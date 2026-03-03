// ─── Tony AI Agent — Vercel Serverless Function ──────────────────────────────
// This is the "brain" behind Tony. It receives a user prompt, sends it to
// Claude (Anthropic's AI), and returns a response. Think of it as the
// middleman between the Tony dashboard and Claude's API.
//
// Runs on Vercel as a "serverless function" — meaning it only spins up when
// someone sends a request, then shuts down. No server to manage.
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Only accept POST requests (sending data TO the server)
  if (req.method !== 'POST') {
    return res.status(405).json({ text: 'Method not allowed.' });
  }

  // Pull the API key from Vercel's environment variables (set in dashboard)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      text: "I'm not fully set up yet — my API key is missing. Ask your dev to add ANTHROPIC_API_KEY in Vercel.",
      error: true,
    });
  }

  // Get the user's prompt from the request body
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({
      text: 'Give me something to work with! Type what you want to make.',
      error: true,
    });
  }

  // ── Tony's personality & instructions for Claude ──
  const systemPrompt = `You are Tony, Dorsia's design studio assistant. You help the content team at Dorsia (a premium hospitality brand) create branded content assets.

Your personality: warm, efficient, and knowledgeable about the restaurant world. Keep responses to 1-3 sentences. Be conversational, not corporate.

Available tool:
- create_chef_dm: Creates an Instagram DM conversation screenshot featuring a chef. Use this when someone wants to create a Chef DM, conversation, or chef feature.

When someone asks about tools that don't exist yet (story cards, menu highlights, event promos), let them know it's coming soon and suggest using Chef DMs in the meantime.

If someone asks something unrelated to content creation, gently redirect them back to what you can help with.`;

  // ── The tool Claude can use ──
  // Think of a "tool" like giving Claude a button it can press.
  // When it decides to press it, we get structured data back (chef name, venue, etc.)
  const tools = [
    {
      name: 'create_chef_dm',
      description:
        'Create a Chef DMs conversation for an Instagram chef feature',
      input_schema: {
        type: 'object',
        properties: {
          chef_name: {
            type: 'string',
            description: "The chef's full name",
          },
          venue: {
            type: 'string',
            description: 'The restaurant name',
          },
          handle: {
            type: 'string',
            description: 'Instagram handle (without @)',
          },
        },
        required: ['chef_name'],
      },
    },
  ];

  try {
    // ── Call the Anthropic API ──
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        tools,
        messages: [{ role: 'user', content: prompt.trim() }],
      }),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      console.error('Anthropic API error:', anthropicRes.status, errBody);
      return res.status(500).json({
        text: "Something went wrong on my end. Try again?",
        error: true,
      });
    }

    const data = await anthropicRes.json();

    // ── Parse Claude's response ──
    // Claude returns an array of "content blocks". Each block is either
    // text (what Claude says) or tool_use (Claude pressing a button).
    let text = '';
    let action = null;

    for (const block of data.content || []) {
      if (block.type === 'text') {
        text += block.text;
      }
      if (block.type === 'tool_use' && block.name === 'create_chef_dm') {
        action = {
          type: 'chef-dm',
          params: {
            chef: block.input.chef_name || '',
            venue: block.input.venue || '',
            handle: block.input.handle || '',
          },
        };
      }
    }

    // If Claude used the tool but didn't say anything, give a default message
    if (!text && action) {
      text = `Setting up a Chef DM for ${action.params.chef}${action.params.venue ? ' at ' + action.params.venue : ''}. Let's go!`;
    }

    return res.status(200).json({ text, action });
  } catch (err) {
    console.error('Tony API error:', err);
    return res.status(500).json({
      text: "Something went wrong. Try again?",
      error: true,
    });
  }
}
