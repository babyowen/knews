export class TTSPlayer {
  private audioContext: AudioContext;
  private currentSource: AudioBufferSourceNode | null = null;
  private readonly MAX_TEXT_LENGTH = 300;
  private isPlaying = false;
  private currentToken: string | null = null;
  private textChunks: string[] = [];
  private currentChunkIndex = 0;

  constructor() {
    try {
      this.audioContext = new AudioContext();
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

  private async synthesizeChunk(text: string): Promise<AudioBuffer> {
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

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      return await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      throw error;
    }
  }

  private async playChunk(audioBuffer: AudioBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);
        
        this.currentSource = source;
        source.start(0);

        source.onended = () => {
          this.currentSource = null;
          resolve();
        };
      } catch (error) {
        reject(new Error('音频播放失败'));
      }
    });
  }

  public async synthesizeAndPlay(text: string): Promise<void> {
    try {
      // 重置状态
      this.stop();
      this.isPlaying = true;
      this.currentChunkIndex = 0;
      this.textChunks = this.splitText(text);

      // 开始流式播放
      while (this.isPlaying && this.currentChunkIndex < this.textChunks.length) {
        const chunk = this.textChunks[this.currentChunkIndex];
        const audioBuffer = await this.synthesizeChunk(chunk);
        await this.playChunk(audioBuffer);
        this.currentChunkIndex++;
      }
    } catch (error) {
      this.isPlaying = false;
      throw error;
    } finally {
      this.isPlaying = false;
    }
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
        this.currentSource = null;
      } catch (error) {
        throw new Error('停止播放失败');
      }
    }
  }
} 