import { FeishuRecord, FeishuResponse, NewsItem } from '@/app/types/feishu';

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
    
    // 明确指定 item 的类型
    const keywords = data.data.items.map((item: FeishuRecord) => item.fields.keyword);
    const uniqueKeywords = Array.from(new Set(keywords)) as string[];
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
    
    const summaries = data.data.items.map((item: any) => {
      if (!item || !item.fields) {
        console.warn('Invalid item received:', item);
        return null;
      }

      const fields = item.fields;
      
      // 确保所有必需字段都存在
      if (!fields.keyword || !fields.summary || !fields.date) {
        console.warn('Missing required fields:', fields);
        return null;
      }

      return {
        keyword: fields.keyword,
        summary: fields.summary,
        date: fields.date,
        references: fields.references || ''
      };
    }).filter((item): item is NewsItem => item !== null);

    console.log("Processed summaries:", summaries);
    return summaries;
  } catch (error) {
    console.error("Error in fetchNewsSummaries:", error);
    throw error;
  }
} 