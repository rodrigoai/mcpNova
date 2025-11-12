import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

// Note: MCP server cannot run on Vercel serverless functions
// This is a simplified version that uses OpenAI directly
// For full MCP integration, deploy to a platform that supports long-running processes

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const buildSystemPrompt = (tone: string) => {
  return `You are a customer service assistant with the following tone and style: ${tone}.

Your primary function is to help users create customer records. However, due to serverless limitations, you can only provide guidance and format customer data - you cannot directly create customers in the system.

When a user wants to create a customer, collect the following REQUIRED information:
- name (full name)
- email (valid email address)
- phone (phone number)

Optional fields you can collect:
- retention (boolean), identification, zipcode, state, street, number, neighborhood, city, list_ids (number), create_deal (boolean), tags, url, utm_term, utm_medium, utm_source, utm_campaign, company_id, utm_content

Once you have collected the required information, respond with a friendly message indicating what data you've collected and that it would be sent to the customer registration system.

For any other questions or conversations, respond naturally according to your configured tone.`;
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        details: 'Message field is required and must be a string',
      });
    }

    const agentTone = process.env.AGENT_TONE || process.env.AGENT_STYLE || 'Professional, helpful, and efficient';
    const systemPrompt = buildSystemPrompt(agentTone);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || 'Sorry, I could not process your request.';

    return res.status(200).json({
      reply,
      actions: [],
      note: 'Running in serverless mode - MCP integration not available',
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
