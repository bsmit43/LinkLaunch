/**
 * HARO (Help A Reporter Out) Monitoring Service
 * Monitors journalist queries and generates AI response drafts
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// HARO-like sources to monitor
const SOURCES = {
  haro: {
    name: 'HARO',
    url: 'https://www.helpareporter.com',
    emailPattern: /@helpareporter\.com$/
  },
  qwoted: {
    name: 'Qwoted',
    url: 'https://www.qwoted.com',
    emailPattern: /@qwoted\.com$/
  },
  sourcebottle: {
    name: 'SourceBottle',
    url: 'https://www.sourcebottle.com',
    emailPattern: /@sourcebottle\.com$/
  },
  terkel: {
    name: 'Terkel',
    url: 'https://terkel.io',
    emailPattern: /@terkel\.io$/
  },
  featured: {
    name: 'Featured.com',
    url: 'https://featured.com',
    emailPattern: /@featured\.com$/
  }
};

// Categories/topics for matching
const TOPIC_KEYWORDS = {
  tech: ['technology', 'software', 'app', 'startup', 'saas', 'ai', 'artificial intelligence', 'machine learning', 'automation'],
  marketing: ['marketing', 'seo', 'content', 'social media', 'advertising', 'branding', 'growth'],
  business: ['business', 'entrepreneur', 'startup', 'small business', 'founder', 'ceo', 'leadership'],
  productivity: ['productivity', 'remote work', 'tools', 'efficiency', 'workflow'],
  finance: ['finance', 'fintech', 'investment', 'funding', 'revenue']
};

/**
 * Parse HARO email content into structured query data
 */
export function parseHAROEmail(emailContent, source = 'haro') {
  const queries = [];

  // Different parsing logic based on source
  // HARO format: queries separated by "---" with Summary, Name, Category, etc.
  const queryBlocks = emailContent.split(/[-]{3,}/).filter(block => block.trim().length > 100);

  for (const block of queryBlocks) {
    const lines = block.trim().split('\n');

    let query = {
      source,
      query_title: '',
      query_content: '',
      journalist_name: '',
      journalist_email: '',
      publication: '',
      deadline: null,
      categories: [],
      keywords: []
    };

    // Parse the block
    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('Summary:')) {
        query.query_title = trimmed.replace('Summary:', '').trim();
      } else if (trimmed.startsWith('Name:')) {
        query.journalist_name = trimmed.replace('Name:', '').trim();
      } else if (trimmed.startsWith('Category:')) {
        query.categories = [trimmed.replace('Category:', '').trim()];
      } else if (trimmed.startsWith('Email:')) {
        query.journalist_email = trimmed.replace('Email:', '').trim();
      } else if (trimmed.startsWith('Media Outlet:') || trimmed.startsWith('Publication:')) {
        query.publication = trimmed.replace(/^(Media Outlet|Publication):/, '').trim();
      } else if (trimmed.startsWith('Deadline:')) {
        const deadlineStr = trimmed.replace('Deadline:', '').trim();
        try {
          query.deadline = new Date(deadlineStr).toISOString();
        } catch (e) {
          // Keep as null if parsing fails
        }
      } else if (trimmed.startsWith('Query:') || trimmed.startsWith('Requirements:')) {
        query.query_content = trimmed.replace(/^(Query|Requirements):/, '').trim();
      } else if (!query.query_content && trimmed.length > 50) {
        // Assume longer text is the query content
        query.query_content += (query.query_content ? '\n' : '') + trimmed;
      }
    }

    // Extract keywords from content
    if (query.query_content) {
      query.keywords = extractKeywords(query.query_content);
    }

    if (query.query_title || query.query_content) {
      queries.push(query);
    }
  }

  return queries;
}

/**
 * Extract relevant keywords from query content
 */
function extractKeywords(content) {
  const keywords = [];
  const lowerContent = content.toLowerCase();

  for (const [category, words] of Object.entries(TOPIC_KEYWORDS)) {
    for (const word of words) {
      if (lowerContent.includes(word)) {
        keywords.push(word);
      }
    }
  }

  return [...new Set(keywords)];
}

/**
 * Calculate relevance score between a HARO query and a website
 */
export function calculateRelevance(query, website) {
  let score = 0;
  const queryText = `${query.query_title} ${query.query_content}`.toLowerCase();
  const websiteText = `${website.name} ${website.description_short || ''} ${website.description_medium || ''} ${website.industry || ''} ${(website.keywords || []).join(' ')}`.toLowerCase();

  // Keyword matches
  const websiteKeywords = website.keywords || [];
  for (const keyword of websiteKeywords) {
    if (queryText.includes(keyword.toLowerCase())) {
      score += 0.15;
    }
  }

  // Industry match
  if (website.industry && queryText.includes(website.industry.toLowerCase())) {
    score += 0.25;
  }

  // Category match
  for (const category of query.categories || []) {
    if (websiteText.includes(category.toLowerCase())) {
      score += 0.2;
    }
  }

  // Query keyword matches
  for (const keyword of query.keywords || []) {
    if (websiteText.includes(keyword)) {
      score += 0.1;
    }
  }

  // Business type relevance
  if (website.business_type) {
    const businessTypes = {
      'b2b': ['business', 'enterprise', 'company', 'professional'],
      'b2c': ['consumer', 'customer', 'user', 'people'],
      'saas': ['software', 'tool', 'platform', 'app', 'saas']
    };

    for (const word of businessTypes[website.business_type] || []) {
      if (queryText.includes(word)) {
        score += 0.1;
      }
    }
  }

  return Math.min(score, 1.0); // Cap at 1.0
}

/**
 * Generate AI response draft for a HARO query
 */
export async function generateHAROResponse(query, website) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `
You are helping craft a response to a journalist query (from HARO or similar service).

JOURNALIST QUERY:
Publication: ${query.publication || 'Not specified'}
Query: ${query.query_title}
${query.query_content}

RESPONDER INFORMATION:
Name: ${website.founder_name || 'Founder'}
Title: ${website.founder_title || 'CEO'}
Company: ${website.name}
Website: ${website.url}
Industry: ${website.industry || 'Technology'}
What they do: ${website.description_short || website.description_medium || 'A technology company'}

Write a compelling, professional response that:
1. Directly answers the journalist's question with specific, quotable insights
2. Positions ${website.founder_name || 'the founder'} as an expert
3. Includes 1-2 concrete examples or data points if relevant
4. Is between 150-300 words
5. Does NOT sound like marketing copy - sounds like genuine expert insight
6. Includes a brief bio at the end (2 sentences max)

Format the response as if it's being sent via email. Start with a brief greeting acknowledging their query.

Return ONLY the response text, no additional commentary.
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating HARO response:', error);
    throw error;
  }
}

/**
 * Process incoming HARO queries and match to websites
 */
export async function processHAROQueries(queries) {
  const results = [];

  for (const query of queries) {
    // Check if query already exists
    const { data: existing } = await supabase
      .from('haro_queries')
      .select('id')
      .eq('query_title', query.query_title)
      .eq('source', query.source)
      .single();

    if (existing) {
      continue; // Skip duplicate
    }

    // Insert the query
    const { data: insertedQuery, error: insertError } = await supabase
      .from('haro_queries')
      .insert({
        source: query.source,
        journalist_name: query.journalist_name,
        journalist_email: query.journalist_email,
        publication: query.publication,
        query_title: query.query_title,
        query_content: query.query_content,
        deadline: query.deadline,
        categories: query.categories,
        keywords: query.keywords,
        status: 'new'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting HARO query:', insertError);
      continue;
    }

    // Find matching websites
    const { data: websites } = await supabase
      .from('websites')
      .select('*')
      .eq('status', 'active');

    if (!websites) continue;

    for (const website of websites) {
      const relevance = calculateRelevance(query, website);

      if (relevance >= 0.3) { // Threshold for matching
        // Generate AI response draft
        const draftResponse = await generateHAROResponse(query, website);

        // Create pitch record
        await supabase
          .from('haro_pitches')
          .insert({
            query_id: insertedQuery.id,
            website_id: website.id,
            user_id: website.user_id,
            pitch_content: draftResponse,
            status: 'pending_review'
          });

        // Update query status
        await supabase
          .from('haro_queries')
          .update({ status: 'matched' })
          .eq('id', insertedQuery.id);

        results.push({
          query: insertedQuery,
          website: website.name,
          relevance,
          pitchGenerated: true
        });
      }
    }
  }

  return results;
}

/**
 * Get all pending HARO opportunities for a user
 */
export async function getHAROOpportunities(userId) {
  const { data, error } = await supabase
    .from('haro_pitches')
    .select(`
      *,
      query:haro_queries(*),
      website:websites(name, url)
    `)
    .eq('user_id', userId)
    .in('status', ['pending_review', 'draft'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Submit a HARO pitch (mark as sent)
 */
export async function submitHAROPitch(pitchId, userId) {
  // Verify ownership
  const { data: pitch, error: fetchError } = await supabase
    .from('haro_pitches')
    .select('*')
    .eq('id', pitchId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !pitch) {
    throw new Error('Pitch not found or unauthorized');
  }

  const { error: updateError } = await supabase
    .from('haro_pitches')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString()
    })
    .eq('id', pitchId);

  if (updateError) throw updateError;

  return { success: true };
}

/**
 * Mark a HARO pitch as published (when you get featured)
 */
export async function markHAROPublished(pitchId, userId, publishedUrl) {
  const { error } = await supabase
    .from('haro_pitches')
    .update({
      status: 'published',
      published_url: publishedUrl
    })
    .eq('id', pitchId)
    .eq('user_id', userId);

  if (error) throw error;

  // Also track as backlink
  const { data: pitch } = await supabase
    .from('haro_pitches')
    .select('website_id, query:haro_queries(publication)')
    .eq('id', pitchId)
    .single();

  if (pitch) {
    await supabase
      .from('backlinks')
      .insert({
        website_id: pitch.website_id,
        source_url: publishedUrl,
        source_domain: new URL(publishedUrl).hostname,
        source_domain_authority: 80, // Estimate, can be updated
        target_url: '', // Will be the website URL
        link_type: 'dofollow',
        context: `Featured via HARO - ${pitch.query?.publication || 'Publication'}`,
        is_from_submission: true
      });
  }

  return { success: true };
}
