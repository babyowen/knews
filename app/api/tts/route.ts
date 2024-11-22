import { NextResponse } from 'next/server';
import WebSocket from 'ws';

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
        // 添加必要的请求头
        const wsOptions = {
          headers: {
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Connection': 'Upgrade',
            'Host': 'speech.platform.bing.com',
            'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
            'Pragma': 'no-cache',
            'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits',
            'Sec-WebSocket-Key': 'AuFNfR4/DISJ4PTTF2wVLA==',
            'Sec-WebSocket-Version': '13',
            'Upgrade': 'websocket',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36 Edg/91.0.864.41'
          }
        };

        const ws = new WebSocket('wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1', wsOptions);

        ws.on('open', () => {
          // 发送配置消息
          ws.send(JSON.stringify({
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
          }));

          // 发送SSML消息
          ws.send(JSON.stringify({
            ssml: `
              <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
                <voice name="${voice}">
                  ${text}
                </voice>
              </speak>
            `
          }));
        });

        ws.on('message', (data: Buffer) => {
          // 检查是否是音频数据
          if (data.indexOf('Path:audio') !== -1) {
            const audioStart = data.indexOf('\r\n\r\n') + 4;
            audioChunks.push(data.slice(audioStart));
          }
        });

        ws.on('close', () => {
          resolve(Buffer.concat(audioChunks));
        });

        ws.on('error', (error) => {
          console.error('WebSocket错误:', error);
          reject(error);
        });
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