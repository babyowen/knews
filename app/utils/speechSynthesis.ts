import { getAliyunToken } from './getAliyunToken';
import crypto from 'crypto';

export class TTSPlayer {
  private audioContext: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private isPlaying: boolean = false;
  private ws: WebSocket | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isProcessing: boolean = false;
  private shouldStop: boolean = false;
  private readonly CHUNK_SIZE = 8 * 1024; // 减小到 8KB，加快首次播放速度

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new AudioContext();
        console.log('✓ 音频上下文初始化成功');
      } catch (error) {
        console.error('✗ 音频上下文初始化失败');
      }
    }
  }

  public async synthesizeAndPlay(text: string): Promise<void> {
    try {
      if (!this.audioContext) {
        console.error('✗ 音频上下文不可用');
        return;
      }

      // 重置状态
      this.shouldStop = false;
      this.audioQueue = [];
      this.isProcessing = false;

      if (this.isPlaying) {
        this.stop();
      }

      // 关闭之前的 WebSocket 连接
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      console.log('⏳ 准备语音合成...');
      const token = await getAliyunToken();
      const appKey = process.env.NEXT_PUBLIC_ALIYUN_APP_KEY;

      return new Promise((resolve, reject) => {
        // 建立 WebSocket 连接
        const url = `wss://nls-gateway-cn-shanghai.aliyuncs.com/ws/v1?token=${token}`;
        this.ws = new WebSocket(url);
        
        // 设置二进制类型为 arraybuffer
        this.ws.binaryType = 'arraybuffer';

        // 用于存储当前音频块的数据
        let currentChunk: ArrayBuffer[] = [];
        let accumulatedSize = 0;

        // 设置连接超时
        const timeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            console.error('✗ WebSocket 连接超时');
            this.ws?.close();
            reject(new Error('连接超时'));
          }
        }, 5000); // 减少超时时间到 5 秒

        this.ws.onopen = () => {
          console.log('✓ WebSocket 连接已建立');
          clearTimeout(timeout);

          // 生成消息 ID
          const generateId = () => crypto.randomBytes(16).toString('hex');
          const messageId = generateId();
          const taskId = generateId();

          // 发送合成请求
          const startParams = {
            header: {
              message_id: messageId,
              task_id: taskId,
              namespace: 'SpeechSynthesizer',
              name: 'StartSynthesis',
              appkey: appKey
            },
            payload: {
              text,
              format: 'mp3',
              sample_rate: 16000,
              voice: 'zhimiao_emo',
              volume: 50,
              speech_rate: 0,
              pitch_rate: 0,
              enable_subtitle: false,
              enable_punctuation_prediction: true,
              enable_inverse_text_normalization: true,
              aue: 3,
              encode_type: 'mp3',
              codec: 'mp3'
            }
          };

          console.log('⏳ 开始合成...');
          this.ws?.send(JSON.stringify(startParams));
        };

        this.ws.onmessage = async (event) => {
          if (this.shouldStop) {
            return;
          }

          try {
            if (typeof event.data === 'string') {
              const message = JSON.parse(event.data);
              const messageType = message.header.name;
              
              if (messageType === 'TaskFailed') {
                console.error('✗ 合成失败:', message.header.status_text);
                reject(new Error(message.header.status_text || '合成失败'));
                this.ws?.close();
                return;
              }

              if (messageType === 'SynthesisCompleted') {
                console.log('✓ 合成完成');
                
                // 处理最后一个块
                if (currentChunk.length > 0) {
                  await this.processAudioChunk(currentChunk);
                }
                
                this.ws?.close();
                resolve();
              }
            } else if (event.data instanceof ArrayBuffer) {
              // 二进制音频数据
              currentChunk.push(event.data);
              accumulatedSize += event.data.byteLength;

              // 当累积的数据超过阈值时，立即处理当前块
              if (accumulatedSize >= this.CHUNK_SIZE) {
                const chunkToProcess = currentChunk;
                currentChunk = [];
                accumulatedSize = 0;
                // 不等待处理完成，立即开始处理下一块
                this.processAudioChunk(chunkToProcess).catch(console.error);
              }
            }
          } catch (error) {
            console.error('✗ 处理音频数据失败:', error instanceof Error ? error.message : '未知错误');
            reject(error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('✗ WebSocket 错误:', error instanceof Error ? error.message : '未知错误');
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('✓ WebSocket 连接已关闭');
        };
      });
    } catch (error) {
      console.error('✗ 语音合成失败:', error instanceof Error ? error.message : '未知错误');
      throw error;
    }
  }

  private async processAudioChunk(chunk: ArrayBuffer[]): Promise<void> {
    if (this.shouldStop || !this.audioContext) {
      return;
    }

    try {
      const audioData = this.concatenateArrayBuffers(chunk);
      const audioBuffer = await this.audioContext.decodeAudioData(audioData.slice(0));
      this.audioQueue.push(audioBuffer);

      // 如果没有正在处理，立即开始处理队列
      if (!this.isProcessing) {
        this.processQueue();
      }
    } catch (error) {
      console.error('✗ 处理音频块失败:', error instanceof Error ? error.message : '未知错误');
    }
  }

  private async processQueue(): Promise<void> {
    if (this.shouldStop || this.isProcessing || this.audioQueue.length === 0 || !this.audioContext) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.audioQueue.length > 0 && !this.shouldStop) {
        const buffer = this.audioQueue.shift();
        if (!buffer) continue;

        await this.playBuffer(buffer);
      }
    } finally {
      this.isProcessing = false;
      // 如果队列中还有数据，继续处理
      if (this.audioQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  private playBuffer(buffer: AudioBuffer): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioContext || this.shouldStop) {
        resolve();
        return;
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => {
        resolve();
      };

      this.source = source;
      this.isPlaying = true;
      source.start(0);
    });
  }

  private concatenateArrayBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
    const totalLength = buffers.reduce((acc, buf) => acc + buf.byteLength, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    buffers.forEach(buffer => {
      result.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    });
    return result.buffer;
  }

  public stop(): void {
    console.log('⏹ 停止播放');
    this.shouldStop = true;
    this.audioQueue = [];
    
    if (this.source && this.isPlaying) {
      try {
        this.source.stop();
        this.source = null;
        this.isPlaying = false;
      } catch (error) {
        console.error('✗ 停止播放失败:', error instanceof Error ? error.message : '未知错误');
      }
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
} 