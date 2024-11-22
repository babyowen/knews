import { NextResponse } from 'next/server';
import WebSocket from 'isomorphic-ws';

export async function POST(request: Request) {
  try {
    const { text, voice = 'zh-CN-XiaoxiaoNeural' } = await request.json();
    console.log('收到TTS请求:', { 
      textLength: text.length,
      voice,
      text: text.substring(0, 100) + '...'
    });

    if (!text) {
      console.error('缺少必要参数');
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('准备调用Edge TTS服务...');

    // 返回的音频数据
    const audioChunks: Buffer[] = [];

    try {
      const audioData = await new Promise<Buffer>((resolve, reject) => {
        // 生成连接 ID
        const connectionId = Math.random().toString(36).substr(2);
        
        // 构造 WebSocket URL
        const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&ConnectionId=${connectionId}`;

        const ws = new WebSocket(wsUrl, {
          headers: {
            'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36 Edg/91.0.864.41'
          }
        });

        ws.onopen = () => {
          console.log('WebSocket 连接已建立');
          
          // 发送配置消息
          const configMessage = {
            context: {
              synthesis: {
                audio: {
                  metadataOptions: {
                    sentenceBoundaryEnabled: false,
                    wordBoundaryEnabled: false
                  },
                  outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
                }
              }
            }
          };

          ws.send(JSON.stringify(configMessage));

          // 发送SSML消息
          const ssmlMessage = {
            ssml: `
              <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
                <voice name="${voice}">
                  ${text}
                </voice>
              </speak>
            `,
            type: 'ssml'
          };

          ws.send(JSON.stringify(ssmlMessage));
        };

        ws.onmessage = (event) => {
          const data = event.data as Buffer;
          // 检查是否是音频数据
          if (data.includes('Path:audio')) {
            const audioStart = data.indexOf('\r\n\r\n') + 4;
            audioChunks.push(data.slice(audioStart));
          }
        };

        ws.onclose = () => {
          console.log('WebSocket 连接已关闭');
          if (audioChunks.length > 0) {
            resolve(Buffer.concat(audioChunks));
          } else {
            reject(new Error('No audio data received'));
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket错误:', error);
          reject(error);
        };

        // 设置超时
        setTimeout(() => {
          ws.close();
          reject(new Error('WebSocket connection timeout'));
        }, 30000);
      });

      console.log('音频生成完成，数据大小:', audioData.length);

      return new NextResponse(audioData, {
        headers: {
          'Content-Type': 'audio/mp3',
          'Content-Length': audioData.length.toString(),
        },
      });
    } catch (error) {
      console.error('Edge TTS WebSocket 错误:', error);
      throw error;
    }

  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: 'TTS service error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 