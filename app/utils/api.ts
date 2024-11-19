interface FeishuResponse {
  code: number;
  msg: string;
  data: {
    items: Array<{
      fields: {
        keyword: string;
      };
    }>;
  };
}

interface NewsItem {
  keyword: string;
  summary: string;
  date: string;
}

// 获取 tenant_access_token 的函数
export async function getTenantAccessToken(appId: string, appSecret: string): Promise<string> {
  console.log("Starting to fetch tenant access token...");
  try {
    const response = await fetch('/api/feishu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'token',
        app_id: appId,
        app_secret: appSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Tenant access token response:", data);
    
    if (!data.tenant_access_token) {
      throw new Error('No tenant_access_token in response');
    }
    
    return data.tenant_access_token;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Detailed error in getTenantAccessToken:", error.message);
    }
    throw error;
  }
}

// 从多维表格中获取关键词的函数
export async function fetchKeywords(tenantAccessToken: string, appToken: string, tableId: string): Promise<string[]> {
  console.log("Starting to fetch keywords...");
  try {
    const response = await fetch('/api/feishu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'keywords',
        token: tenantAccessToken,
        appToken,
        tableId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as FeishuResponse;
    console.log("Keywords response:", data);
    
    if (!data.data?.items) {
      throw new Error('No items found in response');
    }
    
    // 获取所有关键词并去重
    const keywords = data.data.items.map(item => item.fields.keyword);
    const uniqueKeywords = Array.from(new Set(keywords));
    return uniqueKeywords;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Detailed error in fetchKeywords:", error.message);
    }
    throw error;
  }
}

// 获取新闻总结的函数
export async function fetchNewsSummaries(
  tenantAccessToken: string, 
  appToken: string, 
  tableId: string,
  date: string,
  keywords: string[]
): Promise<NewsItem[]> {
  console.log("Fetching news summaries...", { date, keywords });
  try {
    const response = await fetch('/api/feishu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'summaries',
        token: tenantAccessToken,
        appToken,
        tableId,
        date,
        keywords,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Summaries response:", data);
    
    if (!data.data?.items) {
      console.log("No summaries found for the given criteria");
      return [];
    }
    
    return data.data.items.map((item: any) => ({
      keyword: item.fields.keyword || '',
      summary: item.fields.summary || '',
      date: item.fields.update || '',  // 使用update字段作为日期
    }));
  } catch (error) {
    console.error("Error in fetchNewsSummaries:", error);
    throw error;
  }
} 