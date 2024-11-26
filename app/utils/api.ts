import { BaseFeishuRecord, NewsFeishuRecord, SummaryFeishuRecord, FeishuResponse } from '@/app/types/feishu';

interface NewsItem {
  keyword: string;
  summary: string;
  date: string;
}

interface NewsLink {
  title: string;
  link: string;
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
    
    // 明确指定 item 的类型
    const keywords = data.data.items.map((item: BaseFeishuRecord) => item.fields.keyword);
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
  // 将日期格式从 YYYY-MM-DD 转换为 YYYY/MM/DD
  const formattedDate = date.replace(/-/g, '/');
  
  console.log("Fetching news summaries...", { date: formattedDate, keywords });
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
        date: formattedDate,
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
    
    return data.data.items.map((item: SummaryFeishuRecord) => ({
      keyword: item.fields.keyword || '',
      summary: item.fields.summary || '',
      date: item.fields.update || '',
    }));
  } catch (error) {
    console.error("Error in fetchNewsSummaries:", error);
    throw error;
  }
}

// 获取新闻链接的函数
export async function fetchNewsLinks(
  tenantAccessToken: string,
  tableId: string,
  date: string,
  keyword: string
): Promise<NewsLink[]> {
  const formattedDate = date.replace(/-/g, '/');
  
  console.log("=== fetchNewsLinks Debug Info ===");
  console.log("1. Input parameters:", { 
    date: formattedDate,
    keyword,
    hasToken: !!tenantAccessToken,
    tokenLength: tenantAccessToken?.length,
    tableId,
    appToken: process.env.NEXT_PUBLIC_APP_TOKEN
  });

  try {
    if (!tenantAccessToken) {
      console.error("2. Error: Missing tenant access token");
      return [];
    }

    const appToken = process.env.NEXT_PUBLIC_APP_TOKEN;
    if (!appToken) {
      console.error("2.1 Error: Missing app token");
      return [];
    }

    const requestBody = {
      type: 'news_links',
      token: tenantAccessToken,
      appToken,
      tableId,
      date: formattedDate,
      keywords: [keyword]
    };
    
    console.log("3. Request body:", {
      ...requestBody,
      token: tenantAccessToken ? `${tenantAccessToken.substring(0, 10)}...` : 'MISSING',
      tableId: requestBody.tableId,
      appToken: requestBody.appToken
    });
    
    console.log("4. Making API request to /api/feishu");
    const response = await fetch('/api/feishu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });

    console.log("5. Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("6. API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("7. API Response data:", {
      code: data.code,
      msg: data.msg,
      hasData: !!data.data,
      itemCount: data.data?.items?.length || 0
    });
    
    if (!data.data?.items) {
      console.log("8. No items found in response");
      return [];
    }
    
    if (data.data.items[0]) {
      console.log("9. First item fields:", data.data.items[0].fields);
    }
    
    const links = data.data.items.map((item: NewsFeishuRecord) => ({
      title: item.fields.title || '',
      link: item.fields.link || '',
    }));
    
    console.log("10. Final links:", links);
    return links;
  } catch (error) {
    console.error("Error in fetchNewsLinks:", error);
    throw error;
  }
} 