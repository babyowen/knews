import { FeishuRecord, FeishuResponse } from '@/app/types/feishu';
import { NewsContent, NewsSummary } from '@/app/types/news';

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
export async function fetchKeywords(
  tenantAccessToken: string, 
  appToken: string, 
  summaryTableId: string,
  summaryViewId: string
): Promise<string[]> {
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
        tableId: summaryTableId,
        viewId: summaryViewId,
        field_names: ["keyword"]
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
    
    // 从所有记录中提取关键词并去重
    const keywords = data.data.items.map((item: FeishuRecord) => item.fields.keyword);
    const uniqueKeywords = Array.from(new Set(keywords)) as string[];
    console.log("Unique keywords:", uniqueKeywords);
    return uniqueKeywords;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Detailed error in fetchKeywords:", error.message);
    }
    throw error;
  }
}

// 从summary表获取AI生成的新闻总结
export async function fetchNewsSummaries(
  tenantAccessToken: string,
  appToken: string,
  summaryTableId: string,
  summaryViewId: string,
  date: string,
  keywords: string[]
): Promise<NewsSummary[]> {
  try {
    if (!keywords.length) {
      console.warn('No keywords provided for fetchNewsSummaries');
      return [];
    }

    const formattedDate = date.replace(/-/g, '/');
    
    console.log('fetchNewsSummaries called with:', {
      date: formattedDate,
      keywords,
      summaryTableId,
      summaryViewId
    });

    // 为每个关键词分别查询
    const allResults = await Promise.all(keywords.map(async (keyword) => {
      const requestBody = {
        type: 'summaries',
        token: tenantAccessToken,
        appToken,
        tableId: summaryTableId,
        viewId: summaryViewId,
        date: formattedDate,
        keywords: [keyword],
        filter: {
          conjunction: "and",
          conditions: [
            {
              field_name: "keyword",
              operator: "is",
              value: [keyword]
            },
            {
              field_name: "date",
              operator: "is",
              value: [formattedDate]
            }
          ]
        },
        field_names: ["keyword", "date", "summary"],
        automatic_fields: false
      };

      console.log(`Fetching summaries for keyword "${keyword}":`, JSON.stringify(requestBody, null, 2));

      const response = await fetch('/api/feishu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log(`API response for keyword "${keyword}":`, responseText);

      if (!response.ok) {
        console.error('Error response from API:', responseText);
        throw new Error(`HTTP error! status: ${response.status} - ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse API response:', e);
        throw new Error('Invalid JSON response from API');
      }

      if (!data.data?.items) {
        console.warn(`No items found for keyword "${keyword}"`);
        return [];
      }

      return data.data.items.map((item: any) => ({
        keyword: Array.isArray(item.fields.keyword) ? item.fields.keyword[0]?.text || '' : '',
        date: Array.isArray(item.fields.date) ? item.fields.date[0]?.text || '' : '',
        summary: Array.isArray(item.fields.summary) ? item.fields.summary[0]?.text || '' : ''
      }));
    }));

    // 合并所有结果
    const mergedResults = allResults.flat();
    console.log('Merged summary results:', mergedResults);
    return mergedResults;

  } catch (error) {
    console.error('Error in fetchNewsSummaries:', error);
    throw error;
  }
}

// 从news_table获取原始新闻内容
export async function fetchOriginalNews(
  tenantAccessToken: string,
  appToken: string,
  newsTableId: string,
  newsViewId: string,
  date: string,
  keywords: string[]
): Promise<NewsContent[]> {
  try {
    if (!keywords.length) {
      console.warn('No keywords provided for fetchOriginalNews');
      return [];
    }

    const formattedDate = date.replace(/-/g, '/');
    
    console.log('fetchOriginalNews called with:', {
      date: formattedDate,
      keywords,
      newsTableId,
      newsViewId
    });

    // 为每个关键词分别查询
    const allResults = await Promise.all(keywords.map(async (keyword) => {
      const requestBody = {
        type: 'summaries',
        token: tenantAccessToken,
        appToken,
        tableId: newsTableId,
        viewId: newsViewId,
        date: formattedDate,
        keywords: [keyword],
        filter: {
          conjunction: "and",
          conditions: [
            {
              field_name: "keyword",
              operator: "is",
              value: [keyword]
            },
            {
              field_name: "date",
              operator: "is",
              value: [formattedDate]
            }
          ]
        },
        field_names: ["title", "link", "keyword", "date", "content"],
        automatic_fields: false
      };

      console.log(`Fetching original news for keyword "${keyword}":`, JSON.stringify(requestBody, null, 2));

      const response = await fetch('/api/feishu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log(`API response for keyword "${keyword}":`, responseText);

      if (!response.ok) {
        console.error('Error response from API:', responseText);
        throw new Error(`HTTP error! status: ${response.status} - ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse API response:', e);
        throw new Error('Invalid JSON response from API');
      }

      if (!data.data?.items) {
        console.warn(`No items found for keyword "${keyword}"`);
        return [];
      }

      return data.data.items.map((item: any) => ({
        keyword: Array.isArray(item.fields.keyword) ? item.fields.keyword[0]?.text || '' : '',
        date: Array.isArray(item.fields.date) ? item.fields.date[0]?.text || '' : '',
        title: Array.isArray(item.fields.title) ? item.fields.title[0]?.text || '' : '',
        content: Array.isArray(item.fields.content) ? item.fields.content[0]?.text || '' : '',
        link: Array.isArray(item.fields.link) ? item.fields.link[0]?.text || '' : ''
      }));
    }));

    // 合并所有结果
    const mergedResults = allResults.flat();
    console.log('Merged original news results:', mergedResults);
    return mergedResults;

  } catch (error) {
    console.error('Error in fetchOriginalNews:', error);
    throw error;
  }
}