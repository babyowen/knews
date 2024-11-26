import { NextResponse } from 'next/server';
import { BaseFeishuRecord, NewsFeishuRecord, FeishuResponse } from '@/app/types/feishu';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, token, appToken, tableId, date, keywords, app_id, app_secret } = body;

    console.log("API Route - Received request:", { type, tableId, date, hasKeywords: !!keywords });

    // 处理获取 tenant_access_token 的请求
    if (type === 'token') {
      console.log("API Route - Fetching tenant access token...");
      const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id,
          app_secret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Route - Feishu Token API Error:", errorText);
        throw new Error(`Feishu Token API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Route - Token response:", {
        code: data.code,
        msg: data.msg,
        hasToken: !!data.tenant_access_token
      });

      return Response.json(data);
    }
    // 处理获取关键词的请求
    else if (type === 'keywords') {
      console.log("API Route - Fetching keywords...");
      const response = await fetch(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Route - Feishu Keywords API Error:", errorText);
        throw new Error(`Feishu Keywords API error: ${response.status}`);
      }

      const result = await response.json();
      console.log("API Route - Keywords response:", {
        code: result.code,
        msg: result.msg,
        itemCount: result.data?.items?.length || 0
      });

      return Response.json(result);
    }
    // 处理获取新闻摘要的请求
    else if (type === 'summaries') {
      console.log("API Route - Fetching summaries...");
      const response = await fetch(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Route - Feishu Summaries API Error:", errorText);
        throw new Error(`Feishu Summaries API error: ${response.status}`);
      }

      const result = await response.json();
      console.log("API Route - Summaries response:", {
        code: result.code,
        msg: result.msg,
        itemCount: result.data?.items?.length || 0
      });

      // 在后端进行数据过滤
      if (result.data?.items) {
        const filteredItems = result.data.items.filter((item: BaseFeishuRecord) => {
          const itemDate = item.fields.date;
          const itemKeyword = item.fields.keyword;

          // 将日期字符串转换为标准格式
          let formattedItemDate = '';
          if (typeof itemDate === 'number') {
            const date = new Date(itemDate);
            formattedItemDate = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
          } else if (typeof itemDate === 'string') {
            formattedItemDate = itemDate.replace(/-/g, '/');
          }

          const formattedInputDate = date.replace(/-/g, '/');
          const matchDate = formattedItemDate === formattedInputDate;
          const matchKeyword = keywords.includes(itemKeyword);

          return matchDate && matchKeyword;
        });

        console.log("API Route - Filtered summaries:", filteredItems.length);
        return Response.json({ code: 0, msg: 'success', data: { items: filteredItems } });
      }
    }
    // 处理获取新闻链接的请求
    else if (type === 'news_links') {
      console.log("API Route - Fetching news links...", {
        tableId,
        date,
        keyword: keywords[0],
        appToken
      });

      const response = await fetch(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Route - Feishu API Error Response:", errorText);
        throw new Error(`Feishu API error: ${response.status}`);
      }

      const result = await response.json();
      console.log("API Route - Raw API Response:", {
        total: result.data?.items?.length || 0,
        firstItem: result.data?.items?.[0]?.fields,
        allFields: result.data?.items?.slice(0, 3).map(item => item.fields) // 显示前3条记录的所有字段
      });
      
      if (result.data?.items) {
        console.log("API Route - Before filtering:", {
          totalItems: result.data.items.length,
          searchDate: date,
          searchKeyword: keywords[0],
          firstThreeItems: result.data.items.slice(0, 3).map(item => ({
            date: item.fields.date,
            keyword: item.fields.keyword,
            title: item.fields.title,
            link: item.fields.link
          }))
        });

        const filteredItems = result.data.items.filter((item: NewsFeishuRecord) => {
          const itemDate = item.fields.date || '';
          const itemKeyword = item.fields.keyword || '';

          // 标准化日期格式
          const normalizeDate = (dateStr: string) => {
            if (!dateStr) return '';
            return dateStr.replace(/-/g, '/');
          };

          const formattedItemDate = normalizeDate(itemDate);
          const formattedInputDate = normalizeDate(date);

          const matchDate = formattedItemDate === formattedInputDate;
          const matchKeyword = keywords.includes(itemKeyword);

          console.log("API Route - Checking item:", { 
            itemDate: formattedItemDate, 
            inputDate: formattedInputDate,
            itemKeyword,
            searchKeyword: keywords[0],
            matchDate,
            matchKeyword,
            hasTitle: !!item.fields.title,
            hasLink: !!item.fields.link,
            rawItemDate: itemDate,
            rawInputDate: date,
            allFields: item.fields // 显示该记录的所有字段
          });

          return matchDate && matchKeyword;
        });

        console.log("API Route - After filtering:", {
          totalFiltered: filteredItems.length,
          matchedItems: filteredItems.map(item => ({
            date: item.fields.date,
            keyword: item.fields.keyword,
            title: item.fields.title,
            link: item.fields.link
          }))
        });
        
        return Response.json({ code: 0, msg: 'success', data: { items: filteredItems } });
      }

      return Response.json({ code: 0, msg: 'success', data: { items: [] } });
    }
    else {
      throw new Error(`Unknown request type: ${type}`);
    }

    return Response.json({ code: 0, msg: 'success', data: { items: [] } });
  } catch (error: unknown) {
    console.error("API Route - Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return Response.json({ code: 500, msg: errorMessage }, { status: 500 });
  }
} 