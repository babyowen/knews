export async function getTenantAccessToken(appId: string, appSecret: string): Promise<string> {
  try {
    console.info('正在验证权限...');
    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret,
      }),
    });

    const data = await response.json();
    
    if (data.code === 0 && data.tenant_access_token) {
      console.info('权限验证成功');
      return data.tenant_access_token;
    } else {
      throw new Error('权限验证失败');
    }
  } catch (error) {
    console.error('权限验证失败');
    throw error;
  }
}

export async function fetchKeywords(
  tenantAccessToken: string,
  appToken: string,
  tableId: string,
  viewId: string
): Promise<string[]> {
  try {
    console.info('正在获取数据...');
    const response = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records?view_id=${viewId}`,
      {
        headers: {
          Authorization: `Bearer ${tenantAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    interface ApiResponse {
      code: number;
      data?: {
        items: Array<{
          fields: {
            keyword: string;
          };
        }>;
      };
    }

    const data = (await response.json()) as ApiResponse;
    
    if (data.code === 0 && data.data?.items) {
      const keywords = data.data.items
        .map(item => item.fields.keyword)
        .filter(Boolean);
        
      const uniqueKeywords = Array.from(new Set(keywords));
      console.info(`数据获取成功`);
      return uniqueKeywords;
    } else {
      throw new Error('数据获取失败');
    }
  } catch (error) {
    console.error('数据获取失败');
    throw error;
  }
} 