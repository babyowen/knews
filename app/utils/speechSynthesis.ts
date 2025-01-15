export class TTSPlayer {
  private audioContext: AudioContext;
  private currentSource: AudioBufferSourceNode | null = null;

  constructor() {
    try {
      this.audioContext = new AudioContext();
    } catch (error) {
      throw new Error('音频初始化失败');
    }
  }

  private async getToken(): Promise<string> {
    try {
      const response = await fetch('/api/aliyun');
      if (!response.ok) {
        throw new Error('获取令牌失败');
      }
      
      const data = await response.json();
      if (!data.Token?.Id) {
        throw new Error('无效的令牌');
      }
      
      return data.Token.Id;
    } catch (error) {
      throw error;
    }
  }

  public async synthesize(text: string): Promise<Blob> {
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
        const error = await response.json();
        throw new Error('语音合成失败');
      }

      return await response.blob();
    } catch (error) {
      throw error;
    }
  }

  public async synthesizeAndPlay(text: string): Promise<void> {
    try {
      const audioBlob = await this.synthesize(text);
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      try {
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        await this.play(audioBuffer);
      } catch (error) {
        throw new Error('音频处理失败');
      }
    } catch (error) {
      throw error;
    }
  }

  private async play(audioBuffer: AudioBuffer): Promise<void> {
    try {
      if (this.currentSource) {
        this.stop();
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      this.currentSource = source;
      source.start(0);

      return new Promise((resolve) => {
        source.onended = () => {
          this.currentSource = null;
          resolve();
        };
      });
    } catch (error) {
      throw new Error('音频播放失败');
    }
  }

  public stop(): void {
    try {
      if (this.currentSource) {
        this.currentSource.stop();
        this.currentSource.disconnect();
        this.currentSource = null;
      }
    } catch (error) {
      throw new Error('停止播放失败');
    }
  }
} 