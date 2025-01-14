import axios from 'axios';

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
    
    const response = await axios.get<TokenResponse>('/api/aliyun');
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