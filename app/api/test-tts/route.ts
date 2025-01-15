import { NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';

function generateSignature(params: Record<string, string>, secret: string) {
  // 1. 按参数名称排序
  const sortedKeys = Object.keys(params).sort();
  // 2. 构建规范化请求字符串
  const canonicalizedQueryString = sortedKeys
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  // 3. 构建待签名字符串
  const stringToSign = `GET&${encodeURIComponent('/')}&${encodeURIComponent(canonicalizedQueryString)}`;
  // 4. 计算签名
  const signature = crypto
    .createHmac('sha1', `${secret}&`)
    .update(stringToSign)
    .digest('base64');
  return signature;
}

export async function GET() {
  try {
    // 1. 获取token
    const tokenUrl = 'https://nls-meta.cn-shanghai.aliyuncs.com/';
    const appKey = process.env.ALIYUN_APP_KEY;
    const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;

    if (!appKey || !accessKeyId || !accessKeySecret) {
      throw new Error('缺少阿里云配置参数');
    }

    console.log('开始获取Token...');
    
    const params = {
      Action: 'CreateToken',
      Version: '2019-02-28',
      AccessKeyId: accessKeyId,
      Format: 'JSON',
      RegionId: 'cn-shanghai',
      SignatureMethod: 'HMAC-SHA1',
      SignatureVersion: '1.0',
      SignatureNonce: Math.random().toString(36).slice(2),
      Timestamp: new Date().toISOString()
    };

    const signature = generateSignature(params, accessKeySecret);
    
    const tokenResponse = await axios.get(tokenUrl, {
      params: {
        ...params,
        Signature: signature
      }
    });

    console.log('Token获取成功');
    const token = tokenResponse.data?.Token?.Id;

    if (!token) {
      throw new Error('获取token失败');
    }

    // 2. 测试文本转语音
    const text = '这是一个测试文本，用于验证语音合成功能是否正常。';
    const encodedText = encodeURIComponent(text);
    const ttsUrl = `https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts?appkey=${appKey}&token=${token}&text=${encodedText}&format=wav&sample_rate=16000&voice=xiaoyun&volume=50&speech_rate=0&pitch_rate=0`;

    console.log('开始语音合成...');
    const ttsResponse = await axios.get(ttsUrl, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'audio/wav'
      }
    });

    console.log('语音合成完成');

    const contentType = ttsResponse.headers['content-type'];
    if (contentType && !contentType.includes('audio/')) {
      const textResponse = Buffer.from(ttsResponse.data).toString('utf8');
      console.error('语音合成失败:', textResponse);
      return NextResponse.json({ error: textResponse }, { status: 500 });
    }

    return new NextResponse(ttsResponse.data, {
      headers: {
        'Content-Type': 'audio/wav',
      },
    });

  } catch (error) {
    console.error('请求失败:', error instanceof Error ? error.message : '未知错误');
    return NextResponse.json(
      { error: '请求失败' },
      { status: 500 }
    );
  }
} 