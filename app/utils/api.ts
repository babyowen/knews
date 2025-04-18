import { FeishuRecord, FeishuResponse } from '@/app/types/feishu';
import { NewsContent, NewsSummary } from '@/app/types/news';
import { DEFAULT_CATEGORIES } from '../config/categories';

interface NewsItem {
  keyword: string;
  summary: string;
  date: string;
}

// 获取 tenant_access_token 的函数
export async function getTenantAccessToken(appId: string, appSecret: string): Promise<string> {
  try {
    console.log('ℹ️ 系统初始化中...');
    console.log('正在请求 Token...');
    
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
    console.log('Token API 响应:', JSON.stringify(data, null, 2));
    
    if (data.code === 0) {
      console.log('✓ 权限验证成功');
      return data.tenant_access_token;
    } else {
      throw new Error(`权限验证失败: ${data.msg || '未知错误'} (错误码: ${data.code})`);
    }
  } catch (error) {
    console.error('✗ 系统初始化失败:', error instanceof Error ? error.message : '未知错误');
    if (error instanceof Error && error.stack) {
      console.error('错误堆栈:', error.stack);
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
  try {
    console.log('ℹ️ 正在获取预设关键词...');
    
    // 从DEFAULT_CATEGORIES中获取所有预设的关键词
    const predefinedKeywords = Object.values(DEFAULT_CATEGORIES).flat();
    console.log("预设的关键词列表:", predefinedKeywords);
    
    // 去重
    const uniqueKeywords = Array.from(new Set(predefinedKeywords));
    console.log("去重后的关键词列表:", uniqueKeywords);
    
    return uniqueKeywords;
  } catch (error) {
    console.error('✗ 关键词获取失败');
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