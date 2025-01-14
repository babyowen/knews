import { NextResponse } from 'next/server';
import axios from 'axios';
import CryptoJS from 'crypto-js';

export async function GET() {
  try {
    // 检查环境变量
    const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
    const appKey = process.env.ALIYUN_APP_KEY;

    if (!accessKeyId || !accessKeySecret || !appKey) {
      console.error('缺少必要的环境变量:', {
        hasAccessKeyId: !!accessKeyId,
        hasAccessKeySecret: !!accessKeySecret,
        hasAppKey: !!appKey
      });
      return NextResponse.json(
        { error: '服务器配置错误：缺少必要的环境变量' },
        { status: 500 }
      );
    }

    // 准备请求参数
    const params: Record<string, string> = {
      AccessKeyId: accessKeyId,
      Action: 'CreateToken',
      Format: 'JSON',
      RegionId: 'cn-shanghai',
      SignatureMethod: 'HMAC-SHA1',
      SignatureNonce: Math.random().toString(36).substr(2),
      SignatureVersion: '1.0',
      Timestamp: new Date().toISOString(),
      Version: '2019-02-28'
    };

    // 按字母顺序排序参数
    const sortedKeys = Object.keys(params).sort();
    const canonicalizedQueryString = sortedKeys
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    // 构造待签名字符串
    const stringToSign = `GET&${encodeURIComponent('/')}&${encodeURIComponent(canonicalizedQueryString)}`;

    // 计算签名
    const signature = CryptoJS.HmacSHA1(
      stringToSign,
      `${accessKeySecret}&`
    ).toString(CryptoJS.enc.Base64);

    // 构造最终的请求URL
    const requestUrl = `https://nls-meta.cn-shanghai.aliyuncs.com/?${canonicalizedQueryString}&Signature=${encodeURIComponent(signature)}`;

    console.log('发送阿里云令牌请求...');
    const response = await axios.get(requestUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-nls-appkey': appKey
      }
    });

    console.log('阿里云响应状态:', response.status);
    
    if (response.data?.Token?.Id) {
      return NextResponse.json(response.data);
    } else {
      console.error('无效的令牌响应:', response.data);
      return NextResponse.json(
        { error: '获取令牌失败：无效的响应格式' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('获取阿里云令牌失败:', error);
    if (axios.isAxiosError(error)) {
      console.error('请求错误详情:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    return NextResponse.json(
      { 
        error: '获取令牌失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
} 