import axios from 'axios';
import CryptoJS from 'crypto-js';

interface TokenResponse {
  Token: {
    Id: string;
    ExpireTime: number;
  }
}

let cachedToken: string | null = null;
let tokenExpireTime: number = 0;

export async function getAliyunToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  if (cachedToken && tokenExpireTime > now + 60) {
    return cachedToken;
  }

  try {
    console.log('开始请求阿里云令牌...');
    
    // 准备请求参数
    const params: Record<string, string> = {
      AccessKeyId: process.env.NEXT_PUBLIC_ALIYUN_ACCESS_KEY_ID || '',
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
      `${process.env.NEXT_PUBLIC_ALIYUN_ACCESS_KEY_SECRET}&`
    ).toString(CryptoJS.enc.Base64);

    // 构造最终的请求URL
    const requestUrl = `https://nls-meta.cn-shanghai.aliyuncs.com/?${canonicalizedQueryString}&Signature=${encodeURIComponent(signature)}`;

    console.log('发送令牌请求...');
    const response = await axios.get<TokenResponse>(requestUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-nls-appkey': process.env.NEXT_PUBLIC_ALIYUN_APP_KEY
      }
    });

    console.log('令牌请求响应:', response.status, response.statusText);

    if (response.data?.Token?.Id) {
      cachedToken = response.data.Token.Id;
      tokenExpireTime = response.data.Token.ExpireTime;
      return cachedToken;
    } else {
      console.error('无效的令牌响应:', response.data);
      throw new Error('Invalid token response');
    }
  } catch (error) {
    console.error('获取令牌失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('错误详情:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    throw new Error('获取语音合成令牌失败');
  }
} 