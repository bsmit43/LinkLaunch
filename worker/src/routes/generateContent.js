import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateContentRoute(request, reply) {
  const authHeader = request.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  try {
    const { websiteId } = request.body;

    if (!websiteId) {
      return reply.status(400).send({ error: 'websiteId required' });
    }

    // Get website
    const { data: website, error } = await supabase
      .from('websites')
      .select('*')
      .eq('id', websiteId)
      .single();

    if (error || !website) {
      throw new Error('Website not found');
    }

    console.log(`Generating content for: ${website.name}`);

    // Generate with Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `
Generate 5 unique directory listing variations for this business. Each variation should be substantially different in tone and approach.

Business:
- Name: ${website.name}
- URL: ${website.url}
- Description: ${website.description_short || website.description_medium || 'No description provided'}
- Industry: ${website.industry || 'Technology'}
- Keywords: ${website.keywords?.join(', ') || 'N/A'}
- Tagline: ${website.tagline || 'N/A'}

For each variation, provide:
- tagline: A catchy one-liner (max 60 characters)
- short_description: Brief summary for directory cards (max 160 characters)
- long_description: Full description for detailed listings (max 500 characters)

Requirements:
- Each variation must be substantially different in tone (professional, casual, technical, benefit-focused, story-driven)
- Use natural language, avoid marketing buzzwords
- Don't start with "Welcome to" or "We are" or the company name
- Focus on value proposition and benefits
- Include relevant keywords naturally

Return ONLY a valid JSON array, no markdown formatting:
[{"tagline": "...", "short_description": "...", "long_description": "..."}, ...]
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON (handle potential markdown wrapping)
    let jsonText = text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const variations = JSON.parse(jsonText);

    if (!Array.isArray(variations) || variations.length === 0) {
      throw new Error('Invalid AI response format');
    }

    // Clear existing content
    await supabase
      .from('generated_content')
      .delete()
      .eq('website_id', websiteId);

    // Store new variations
    const contentRecords = variations.map((v, index) => ({
      website_id: websiteId,
      content_type: 'description_short',
      content: JSON.stringify({
        tagline: v.tagline?.substring(0, 60),
        short_description: v.short_description?.substring(0, 160),
        long_description: v.long_description?.substring(0, 500)
      }),
      ai_model: 'gemini-2.0-flash-exp'
    }));

    const { error: insertError } = await supabase
      .from('generated_content')
      .insert(contentRecords);

    if (insertError) throw insertError;

    console.log(`Generated ${variations.length} variations`);

    return {
      success: true,
      variations: variations.length,
      preview: variations[0]
    };

  } catch (error) {
    console.error('Content generation error:', error);
    return reply.status(500).send({ error: error.message });
  }
}
