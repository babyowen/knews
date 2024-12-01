import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('API request type:', req.body.type);
  console.log('API request body:', JSON.stringify(req.body, null, 2));

  switch (req.body.type) {
    case 'token':
      try {
        const { app_id, app_secret } = req.body;
        const response = await fetch(
          'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              app_id,
              app_secret,
            }),
          }
        );
        const data = await response.json();
        return res.status(200).json(data);
      } catch (error) {
        console.error('Error getting token:', error);
        return res.status(500).json({ error: 'Failed to get token' });
      }
      break;

    case 'keywords':
      try {
        const { token, appToken, tableId, viewId, field_names } = req.body;
        const response = await fetch(
          `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/search`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              view_id: viewId,
              field_names,
              automatic_fields: false
            }),
          }
        );
        const data = await response.json();
        return res.status(200).json(data);
      } catch (error) {
        console.error('Error fetching keywords:', error);
        return res.status(500).json({ error: 'Failed to fetch keywords' });
      }
      break;

    case 'summaries':
      try {
        const { token, appToken, tableId, viewId, filter, field_names } = req.body;
        console.log('Summaries API request:', {
          appToken,
          tableId,
          viewId,
          filter,
          field_names
        });

        const response = await fetch(
          `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/search`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              view_id: viewId,
              filter,
              field_names,
              automatic_fields: false
            }),
          }
        );

        const responseText = await response.text();
        console.log('Feishu API raw response:', responseText);

        if (!response.ok) {
          throw new Error(`Feishu API error: ${response.status} - ${responseText}`);
        }

        const data = JSON.parse(responseText);
        console.log('Feishu API parsed response:', data);
        return res.status(200).json(data);
      } catch (error) {
        console.error('Error in summaries handler:', error);
        return res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? error.stack : undefined
        });
      }
      break;

    case 'original_news':
      try {
        const { token, appToken, tableId, viewId, filter, field_names } = req.body;
        console.log('Original news API request:', {
          appToken,
          tableId,
          viewId,
          filter,
          field_names
        });

        const response = await fetch(
          `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/search`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              view_id: viewId,
              filter,
              field_names,
              automatic_fields: false
            }),
          }
        );

        const responseText = await response.text();
        console.log('Feishu API raw response:', responseText);

        if (!response.ok) {
          throw new Error(`Feishu API error: ${response.status} - ${responseText}`);
        }

        const data = JSON.parse(responseText);
        console.log('Feishu API parsed response:', data);
        return res.status(200).json(data);
      } catch (error) {
        console.error('Error in original news handler:', error);
        return res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? error.stack : undefined
        });
      }
      break;

    default:
      console.error('Unknown request type:', req.body.type);
      return res.status(400).json({ error: 'Invalid request type' });
  }
}