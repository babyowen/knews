export class TTSPlayer {
  private audioContext: AudioContext;
  private currentSource: AudioBufferSourceNode | null = null;

  constructor() {
    console.log('初始化 TTSPlayer...');
    try {
      this.audioContext = new AudioContext();
      console.log('成功创建 AudioContext');
    } catch (error) {
      console.error('创建 AudioContext 失败:', error);
      throw error;
    }
  }

  private async getToken(): Promise<string> {
    try {
      console.log('正在获取阿里云令牌...');
      const response = await fetch('/api/aliyun');
      if (!response.ok) {
        throw new Error(`获取令牌失败: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!data.Token?.Id) {
        throw new Error('无效的令牌响应');
      }
      
      console.log('成功获取阿里云令牌');
      return data.Token.Id;
    } catch (error) {
      console.error('获取令牌失败:', error);
      throw error;
    }
  }

  public async synthesizeAndPlay(text: string): Promise<void> {
    try {
      console.log('开始语音合成，文本长度:', text.length);
      const token = await this.getToken();
      
      console.log('正在发送合成请求...');
      const response = await fetch('/api/aliyun/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, token })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`语音合成失败: ${error.details || response.statusText}`);
      }

      const audioData = await response.arrayBuffer();
      console.log('收到音频数据，大小:', audioData.byteLength);

      try {
        const audioBuffer = await this.audioContext.decodeAudioData(audioData);
        console.log('音频解码成功，开始播放');
        await this.play(audioBuffer);
      } catch (error) {
        console.error('音频处理失败:', error);
        throw error;
      }
    } catch (error) {
      console.error('语音合成过程出错:', error);
      throw error;
    }
  }

  private async play(audioBuffer: AudioBuffer): Promise<void> {
    try {
      console.log('准备播放音频...');
      if (this.currentSource) {
        console.log('停止当前播放');
        this.stop();
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      this.currentSource = source;
      source.start(0);
      console.log('开始播放音频');

      return new Promise((resolve) => {
        source.onended = () => {
          console.log('音频播放完成');
          this.currentSource = null;
          resolve();
        };
      });
    } catch (error) {
      console.error('音频播放失败:', error);
      throw error;
    }
  }

  public stop(): void {
    try {
      if (this.currentSource) {
        console.log('停止音频播放');
        this.currentSource.stop();
        this.currentSource.disconnect();
        this.currentSource = null;
      }
    } catch (error) {
      console.error('停止播放时出错:', error);
      throw error;
    }
  }
} 