import { NextResponse } from 'next/server';
import WebSocket from 'ws';
import axios from 'axios';
import crypto from 'crypto';

interface TokenParameters {
  AccessKeyId: string | undefined;
  Action: string;
  Format: string;
  RegionId: string;
  SignatureMethod: string;
  SignatureNonce: string;
  SignatureVersion: string;
  Timestamp: string;
  Version: string;
  [key: string]: string | undefined;
}

export async function GET(): Promise<Response> {
  return new Promise<Response>(async (resolve) => {
    let ws: WebSocket | null = null;
    
    try {
      // 检查环境变量
      const appKey = process.env.ALIYUN_APP_KEY;
      const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
      const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;

      if (!appKey || !accessKeyId || !accessKeySecret) {
        throw new Error('缺少必要的环境变量配置');
      }

      console.log('环境变量检查通过');

      // 1. 获取 token
      const tokenUrl = 'https://nls-meta.cn-shanghai.aliyuncs.com/';
      
      // 准备签名参数
      const date = new Date();
      const timestamp = date.toISOString();
      const nonce = Math.random().toString(36).substring(2, 15);
      
      // 构建规范化的请求字符串
      const parameters: TokenParameters = {
        AccessKeyId: accessKeyId,
        Action: 'CreateToken',
        Format: 'JSON',
        RegionId: 'cn-shanghai',
        SignatureMethod: 'HMAC-SHA1',
        SignatureNonce: nonce,
        SignatureVersion: '1.0',
        Timestamp: timestamp,
        Version: '2019-02-28'
      };

      // 按参数名称的字典顺序排序
      const sortedKeys = Object.keys(parameters).sort();
      const canonicalizedQueryString = sortedKeys
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(parameters[key] || '')}`)
        .join('&');

      // 构建签名字符串
      const stringToSign = [
        'GET',
        encodeURIComponent('/'),
        encodeURIComponent(canonicalizedQueryString)
      ].join('&');

      // 计算签名
      const signature = crypto
        .createHmac('sha1', accessKeySecret + '&')
        .update(stringToSign)
        .digest('base64');

      console.log('获取 token...');
      console.log('请求 URL:', tokenUrl);
      console.log('请求参数:', {
        ...parameters,
        Signature: signature
      });

      const tokenResponse = await axios.get(tokenUrl, {
        params: {
          ...parameters,
          Signature: signature
        }
      });

      console.log('Token 响应:', tokenResponse.data);
      const token = tokenResponse.data?.Token?.Id;

      if (!token) {
        throw new Error('获取 token 失败');
      }

      const text = '这是一个测试文本，用于验证语音合成功能是否正常。';
      
      // 2. 建立 WebSocket 连接
      console.log('建立 WebSocket 连接...');
      // 在 URL 中添加 token 参数
      const url = `wss://nls-gateway-cn-shanghai.aliyuncs.com/ws/v1?token=${token}`;
      console.log('WebSocket URL:', url);
      
      ws = new WebSocket(url);
      
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
      
      // 用于存储音频数据
      const audioChunks: Buffer[] = [];
      
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
            voice: 'siqi',
            volume: 50,
            speech_rate: -50,
            pitch_rate: 0,
            enable_subtitle: false,
            enable_punctuation_prediction: true,
            enable_inverse_text_normalization: true,
            aue: 3,
            encode_type: 'mp3',
            codec: 'mp3'
          }
        };
        
        console.log('发送合成请求:', startParams);
        if (ws) {
          ws.send(JSON.stringify(startParams));
        }
      });
      
      ws.on('message', (data: Buffer) => {
        try {
          // 尝试解析为 JSON，看是否是控制消息
          const message = JSON.parse(data.toString());
          console.log('收到控制消息:', message);
          
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
          details: error.message 
        }, { status: 500 }));
      });
      
      ws.on('close', () => {
        console.log('WebSocket 连接已关闭');
      });
      
    } catch (error) {
      console.error('测试失败:', error);
      if (axios.isAxiosError(error)) {
        console.error('请求错误详情:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
      }
      ws?.close();
      resolve(NextResponse.json({ 
        error: '测试失败',
        details: error instanceof Error ? error.message : '未知错误'
      }, { status: 500 }));
    }
  });
} 