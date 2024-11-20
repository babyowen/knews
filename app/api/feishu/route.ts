import { NextResponse } from 'next/server';
import { FeishuRecord } from '@/app/types/feishu';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, token, appToken, tableId, date, keywords } = body;

    console.log("API Route - Received request:", {
      type,
      token: token ? 'exists' : 'missing',
      appToken: appToken ? 'exists' : 'missing',
      tableId,
      date,
      keywords
    });

    // 处理获取 tenant_access_token 的请求
    if (type === 'token') {
      const { app_id, app_secret } = body;
      console.log("API Route - Token request with:", {
        app_id: app_id ? 'exists' : 'missing',
        app_secret: app_secret ? 'exists' : 'missing'
      });

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
        console.error("API Route - Token error response:", errorText);
        throw new Error(`Feishu API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Route - Token response:", {
        code: data.code,
        msg: data.msg,
        tenant_access_token: data.tenant_access_token ? 'exists' : 'missing'
      });
      return NextResponse.json(data);
    }

    // 处理获取关键词的请求
    if (type === 'keywords') {
      console.log("API Route - Fetching keywords with:", {
        token: token ? 'exists' : 'missing',
        appToken,
        tableId
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
        console.error("API Route - Keywords error response:", errorText);
        throw new Error(`Feishu API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Route - Keywords response:", {
        total: data.data?.items?.length || 0
      });
      return NextResponse.json(data);
    }

    // 处理获取新闻总结的请求
    if (type === 'summaries') {
      console.log("API Route - Fetching summaries with:", {
        token: token ? 'exists' : 'missing',
        appToken,
        tableId,
        date,
        keywords
      });

      if (!token || !appToken || !tableId || !date || !keywords) {
        throw new Error('Missing required parameters for summaries request');
      }

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
        console.error("API Route - Summaries error response:", errorText);
        throw new Error(`Feishu API error: ${response.status}`);
      }

      const result = await response.json();
      console.log("API Route - Total records received:", result.data?.items?.length || 0);
      
      if (result.data?.items) {
        const filteredItems = result.data.items.filter((item: FeishuRecord) => {
          const itemDate = item.fields.date;
          const itemKeyword = item.fields.keyword;
          const itemSummary = item.fields.summary;

          console.log("API Route - Raw item fields:", item.fields);

          let formattedItemDate = '';
          if (typeof itemDate === 'number') {
            const itemDateObj = new Date(itemDate);
            formattedItemDate = `${itemDateObj.getFullYear()}/${(itemDateObj.getMonth() + 1).toString().padStart(2, '0')}/${itemDateObj.getDate().toString().padStart(2, '0')}`;
          } else if (typeof itemDate === 'string') {
            formattedItemDate = itemDate.replace(/-/g, '/');
          }

          const formattedInputDate = date.replace(/-/g, '/');
          const matchDate = formattedItemDate === formattedInputDate;
          const matchKeyword = keywords.includes(itemKeyword);

          console.log("API Route - Checking summary item:", {
            itemDate: formattedItemDate,
            inputDate: formattedInputDate,
            itemKeyword,
            matchDate,
            matchKeyword,
            hasSummary: !!itemSummary
          });

          return matchDate && matchKeyword && itemSummary;
        });

        console.log("API Route - Filtered summaries:", {
          total: filteredItems.length,
          items: filteredItems.map(item => ({
            keyword: item.fields.keyword,
            date: item.fields.date,
            hasSummary: !!item.fields.summary
          }))
        });

        return NextResponse.json({ data: { items: filteredItems } });
      }

      return NextResponse.json({ data: { items: [] } });
    }

    // 处理获取新闻链接的请求
    if (type === 'links') {
      console.log("API Route - Fetching links with:", {
        token: token ? 'exists' : 'missing',
        appToken,
        tableId,
        date,
        keywords
      });

      if (!token || !appToken || !tableId || !date || !keywords) {
        throw new Error('Missing required parameters for links request');
      }

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
        console.error("API Route - Links error response:", errorText);
        throw new Error(`Feishu API error: ${response.status}`);
      }

      const result = await response.json();
      console.log("API Route - Total link records received:", result.data?.items?.length || 0);
      
      if (result.data?.items) {
        const filteredItems = result.data.items.filter((item: FeishuRecord) => {
          const itemDate = item.fields.date;
          const itemKeyword = item.fields.keyword;

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

          console.log("API Route - Checking link item:", {
            itemDate: formattedItemDate,
            inputDate: formattedInputDate,
            itemKeyword,
            matchDate,
            matchKeyword
          });

          return matchDate && matchKeyword;
        });

        console.log("API Route - Filtered links:", filteredItems.length);
        return NextResponse.json({ data: { items: filteredItems } });
      }

      return NextResponse.json({ data: { items: [] } });
    }

    throw new Error(`Unknown request type: ${type}`);
  } catch (error) {
    console.error("API Route - Error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal Server Error' 
    }, { status: 500 });
  }
} 