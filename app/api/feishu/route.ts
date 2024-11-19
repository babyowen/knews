import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { type, ...data } = await request.json();
    console.log("API Route - Received request type:", type);

    if (type === 'token') {
      const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: process.env.NEXT_PUBLIC_APP_ID,
          app_secret: process.env.NEXT_PUBLIC_APP_SECRET,
        }),
      });

      const result = await response.json();
      return NextResponse.json(result);
    }

    if (type === 'keywords') {
      const { token, appToken, tableId } = data;
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

      const result = await response.json();
      return NextResponse.json(result);
    }

    if (type === 'summaries') {
      const { token, appToken, tableId, date, keywords } = data;
      console.log("API Route - Querying summaries with:", { 
        date, 
        keywords,
        appToken: appToken.substring(0, 4) + "****",
        tableId 
      });
      
      // 使用与获取关键词相同的API端点
      console.log("API Route - Fetching from Feishu API...");
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
      console.log("API Route - Total records received:", result.data?.items?.length || 0);
      
      // 在后端进行数据过滤
      if (result.data?.items) {
        const filteredItems = result.data.items.filter((item: any) => {
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

          // 只记录匹配日期或关键词的项
          if (matchDate || matchKeyword) {
            console.log("API Route - Checking matching/partial-matching item:", { 
              itemDate: formattedItemDate, 
              inputDate: formattedInputDate,
              itemKeyword,
              matchDate,
              matchKeyword
            });
          }

          return matchDate && matchKeyword;
        });

        console.log("API Route - Filtered items count:", filteredItems.length);
        if (filteredItems.length > 0) {
          console.log("API Route - Matched items:", filteredItems.map((item: any) => ({
            keyword: item.fields.keyword,
            date: item.fields.date,
            summaryPreview: item.fields.summary?.substring(0, 50) + "..."
          })));
        } else {
          console.log("API Route - No matching items found");
        }

        return NextResponse.json({
          code: result.code,
          msg: result.msg,
          data: {
            items: filteredItems
          }
        });
      }

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  } catch (error) {
    console.error('API Route - Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 