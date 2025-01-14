import { NextResponse } from 'next/server';
import WebSocket from 'ws';
import crypto from 'crypto';

export async function POST(request: Request) {
  return new Promise<Response>(async (resolve) => {
    let ws: WebSocket | null = null;
    
    try {
      const { text, token } = await request.json();
      const appKey = process.env.ALIYUN_APP_KEY;

      if (!appKey || !token) {
        throw new Error('缺少必要的参数');
      }

      // 建立 WebSocket 连接
      console.log('建立 WebSocket 连接...');
      const url = `wss://nls-gateway-cn-shanghai.aliyuncs.com/ws/v1?token=${token}`;
      ws = new WebSocket(url);
      
      // 用于存储音频数据
      const audioChunks: Buffer[] = [];
      
      // 设置超时
      const timeout = setTimeout(() => {
        if (ws?.readyState !== WebSocket.OPEN) {
          console.error('WebSocket 连接超时');
          ws?.close();
          resolve(NextResponse.json({ 
            error: 'WebSocket 连接超时',
            details: '无法在指定时间内建立连接'
          }, { status: 500 }));
        }
      }, 10000);

      ws.on('open', () => {
        console.log('WebSocket 连接已建立');
        clearTimeout(timeout);
        
        // 生成消息 ID
        const generateId = () => crypto.randomBytes(16).toString('hex');
        const messageId = generateId();
        const taskId = generateId();
        
        // 发送开始合成指令
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
        
        console.log('发送合成请求');
        ws?.send(JSON.stringify(startParams));
      });
      
      ws.on('message', (data: Buffer) => {
        try {
          // 尝试解析为 JSON，看是否是控制消息
          const message = JSON.parse(data.toString());
          console.log('收到控制消息:', message.header.name);
          
          // 检查是否有错误
          if (message.header.name === 'TaskFailed') {
            console.error('合成任务失败:', message);
            ws?.close();
            resolve(NextResponse.json({ 
              error: '合成任务失败',
              details: message.payload 
            }, { status: 500 }));
            return;
          }
          
          if (message.header.name === 'SynthesisCompleted') {
            console.log('合成完成');
            ws?.close();
            
            if (audioChunks.length === 0) {
              resolve(NextResponse.json({ 
                error: '没有收到音频数据',
                details: '合成完成但没有收到音频数据'
              }, { status: 500 }));
              return;
            }
            
            // 合并所有音频数据并返回
            const audioBuffer = Buffer.concat(audioChunks);
            resolve(new NextResponse(audioBuffer, {
              headers: {
                'Content-Type': 'audio/mp3',
                'Transfer-Encoding': 'chunked'
              },
            }));
          }
        } catch (e) {
          // 如果不是 JSON，则是二进制音频数据
          console.log('收到音频数据:', data.length, '字节');
          audioChunks.push(data);
        }
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket 错误:', error);
        resolve(NextResponse.json({ 
          error: 'WebSocket 错误',
          details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 }));
      });
      
      ws.on('close', () => {
        console.log('WebSocket 连接已关闭');
      });
      
    } catch (error) {
      console.error('TTS 请求失败:', error);
      ws?.close();
      resolve(NextResponse.json({ 
        error: '语音合成失败',
        details: error instanceof Error ? error.message : '未知错误'
      }, { status: 500 }));
    }
  });
} 