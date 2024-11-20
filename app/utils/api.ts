import { FeishuRecord, FeishuResponse } from '@/app/types/feishu';

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
  console.log("fetchNewsSummaries called with:", {
    hasToken: !!tenantAccessToken,
    appToken,
    tableId,
    date,
    keywords
  });

  try {
    const formattedDate = date.replace(/-/g, '/');
    console.log("Formatted date:", formattedDate);

    const requestBody = {
      type: 'summaries',
      token: tenantAccessToken,
      appToken,
      tableId,
      date: formattedDate,
      keywords,
    };

    console.log("Making request with body:", requestBody);

    const response = await fetch('/api/feishu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response for summaries:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Raw summaries response:", data);
    
    if (data.error) {
      console.error("API returned error:", data.error);
      throw new Error(data.error);
    }

    if (!data.data?.items) {
      console.log("No summaries found for the given criteria");
      return [];
    }
    
    const summaries = data.data.items.map((item: any) => {
      console.log("Processing summary item:", item.fields);
      return {
        keyword: item.fields.keyword || '',
        summary: item.fields.summary || '',
        date: item.fields.date || '',  // 注意这里使用 date 而不是 update
      };
    });

    console.log("Processed summaries:", summaries);
    return summaries;
  } catch (error) {
    console.error("Error in fetchNewsSummaries:", error);
    throw error;
  }
}

// 获取新闻链接的函数
export async function fetchNewsLinks(
  tenantAccessToken: string,
  appToken: string,
  localTableId: string,
  date: string,
  keywords: string[]
): Promise<{ keyword: string; title: string; link: string }[]> {
  console.log("Fetching news links with params:", { 
    token: tenantAccessToken ? 'exists' : 'missing',
    appToken,
    localTableId,
    date,
    keywords
  });

  try {
    // 确保日期格式正确（将 - 转换为 /）
    const formattedDate = date.replace(/-/g, '/');

    const response = await fetch('/api/feishu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'links',
        token: tenantAccessToken,
        appToken,
        tableId: localTableId,
        date: formattedDate,  // 使用格式化后的日期
        keywords,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response for links:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Raw links response:", data);

    if (data.error) {
      console.error("API returned error:", data.error);
      throw new Error(data.error);
    }

    if (!data.data?.items) {
      console.log("No links found for the given criteria");
      return [];
    }

    const links = data.data.items.map((item: any) => {
      console.log("Processing link item:", item.fields);
      return {
        keyword: item.fields.keyword || '',
        title: item.fields.title || '',
        link: item.fields.link || '',
      };
    });

    console.log("Processed links:", links);
    return links;
  } catch (error) {
    console.error("Error in fetchNewsLinks:", error);
    throw error;
  }
} 