import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    // 1. 首先获取 token
    const tokenUrl = 'https://nls-meta.cn-shanghai.aliyuncs.com/';
    const appKey = process.env.ALIYUN_APP_KEY;
    const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;

    console.log('测试参数:', {
      appKey,
      accessKeyId: accessKeyId?.slice(0, 4) + '****',
      accessKeySecret: accessKeySecret?.slice(0, 4) + '****'
    });

    // 获取 token
    const tokenResponse = await axios.get(tokenUrl, {
      params: {
        Action: 'CreateToken',
        Version: '2019-02-28',
        AccessKeyId: accessKeyId,
        Format: 'JSON'
      }
    });

    console.log('Token 响应:', tokenResponse.data);
    const token = tokenResponse.data?.Token?.Id;

    if (!token) {
      throw new Error('获取 token 失败');
    }

    // 2. 测试文本转语音
    const text = '这是一个测试文本，用于验证语音合成功能是否正常。';
    const encodedText = encodeURIComponent(text);

    const ttsUrl = `https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts?appkey=${appKey}&token=${token}&text=${encodedText}&format=wav&sample_rate=16000&voice=xiaoyun&volume=50&speech_rate=0&pitch_rate=0`;

    console.log('发送 TTS 请求...');
    const ttsResponse = await axios.get(ttsUrl, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'audio/wav'
      }
    });

    console.log('TTS 响应头:', ttsResponse.headers);

    // 检查响应类型
    const contentType = ttsResponse.headers['content-type'];
    if (contentType && !contentType.includes('audio/')) {
      console.error('响应不是音频格式:', contentType);
      const textResponse = Buffer.from(ttsResponse.data).toString('utf8');
      console.error('错误响应:', textResponse);
      return NextResponse.json({ error: textResponse }, { status: 500 });
    }

    // 返回音频数据
    return new NextResponse(ttsResponse.data, {
      headers: {
        'Content-Type': 'audio/wav',
      },
    });

  } catch (error) {
    console.error('测试失败:', error);
    if (axios.isAxiosError(error)) {
      console.error('请求错误详情:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    return NextResponse.json(
      { 
        error: '测试失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
} 