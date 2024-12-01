import { NextResponse } from 'next/server';
import { FeishuRecord, FeishuResponse } from '@/app/types/feishu';

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
      const { token, appToken, tableId, date, keywords, filter, field_names } = data;
      console.log("API Route - Querying with:", { 
        date, 
        keywords,
        appToken: appToken.substring(0, 4) + "****",
        tableId,
        field_names
      });
      
      // 使用飞书的搜索 API
      const response = await fetch(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/search`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filter,
            field_names,
            automatic_fields: false
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Route - Feishu API Error Response:", errorText);
        throw new Error(`Feishu API error: ${response.status}`);
      }

      const result = await response.json();
      console.log("API Route - Total records received:", result.data?.items?.length || 0);

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