export class TTSPlayer {
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private readonly MAX_TEXT_LENGTH = 300;
  private isPlaying = false;
  private currentToken: string | null = null;
  private textChunks: string[] = [];
  private currentChunkIndex = 0;
  private isMobile: boolean;

  constructor() {
    // 检测是否为移动设备
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    try {
      // 在PC端使用 AudioContext，移动端使用 Audio 元素
      if (!this.isMobile) {
        this.audioContext = new AudioContext();
      }
      this.audioElement = new Audio();
      this.audioElement.addEventListener('ended', () => {
        this.playNext();
      });
    } catch (error) {
      throw new Error('音频初始化失败');
    }
  }

  private async getToken(): Promise<string> {
    if (this.currentToken) {
      return this.currentToken;
    }

    try {
      const response = await fetch('/api/aliyun');
      if (!response.ok) {
        throw new Error('获取令牌失败');
      }
      
      const data = await response.json();
      if (!data.Token?.Id) {
        throw new Error('无效的令牌');
      }
      
      const token = data.Token.Id;
      this.currentToken = token;
      return token;
    } catch (error) {
      this.currentToken = null;
      throw error;
    }
  }

  private splitText(text: string): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    
    // 按句号、问号、感叹号分割
    const sentences = text.split(/([。！？.!?])/);
    
    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i];
      const punctuation = sentences[i + 1] || '';
      
      if ((currentChunk + sentence + punctuation).length > this.MAX_TEXT_LENGTH) {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = '';
        }
        // 如果单个句子超过最大长度，需要按逗号分割
        if ((sentence + punctuation).length > this.MAX_TEXT_LENGTH) {
          const subSentences = (sentence + punctuation).split(/([，,])/);
          let subChunk = '';
          for (let j = 0; j < subSentences.length; j += 2) {
            const subSentence = subSentences[j];
            const comma = subSentences[j + 1] || '';
            if ((subChunk + subSentence + comma).length > this.MAX_TEXT_LENGTH) {
              if (subChunk) {
                chunks.push(subChunk);
              }
              // 如果还是太长，强制切分
              const forceSplit = (subSentence + comma).match(new RegExp(`.{1,${this.MAX_TEXT_LENGTH}}`, 'g')) || [];
              chunks.push(...forceSplit);
              subChunk = '';
            } else {
              subChunk += subSentence + comma;
            }
          }
          if (subChunk) {
            chunks.push(subChunk);
          }
        } else {
          chunks.push(sentence + punctuation);
        }
      } else {
        currentChunk += sentence + punctuation;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }

  private async synthesizeChunk(text: string): Promise<Blob> {
    try {
      const token = await this.getToken();
      const response = await fetch('/api/aliyun/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, token })
      });

      if (!response.ok) {
        throw new Error('语音合成失败');
      }

      return await response.blob();
    } catch (error) {
      throw error;
    }
  }

  private async playNext(): Promise<void> {
    if (!this.isPlaying || this.currentChunkIndex >= this.textChunks.length) {
      this.isPlaying = false;
      return;
    }

    try {
      const chunk = this.textChunks[this.currentChunkIndex];
      const audioBlob = await this.synthesizeChunk(chunk);
      const audioUrl = URL.createObjectURL(audioBlob);

      if (this.isMobile && this.audioElement) {
        // 移动端使用 Audio 元素播放
        this.audioElement.src = audioUrl;
        await this.audioElement.play();
      } else if (this.audioContext) {
        // PC端使用 AudioContext 播放
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);
        source.onended = () => {
          this.currentChunkIndex++;
          this.playNext();
        };
        source.start(0);
      }

      // 如果是移动端，ended事件会触发playNext
      if (!this.isMobile) {
        this.currentChunkIndex++;
      }
    } catch (error) {
      this.isPlaying = false;
      throw error;
    }
  }

  public async synthesizeAndPlay(text: string): Promise<void> {
    try {
      // 重置状态
      this.stop();
      this.isPlaying = true;
      this.currentChunkIndex = 0;
      this.textChunks = this.splitText(text);

      // 开始播放第一个片段
      await this.playNext();
    } catch (error) {
      this.isPlaying = false;
      throw error;
    }
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.isMobile && this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    } else if (this.audioContext) {
      // 断开所有连接
      this.audioContext.close().then(() => {
        this.audioContext = new AudioContext();
      });
    }
    this.currentChunkIndex = 0;
  }
} 