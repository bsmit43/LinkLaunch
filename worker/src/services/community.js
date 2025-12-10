/**
 * Community Opportunity Finder Service
 * Monitors Reddit, Quora, Hacker News for relevant discussions
 * Generates AI draft responses for human review
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Platform configurations
const PLATFORMS = {
  reddit: {
    name: 'Reddit',
    apiBase: 'https://oauth.reddit.com',
    publicApi: 'https://www.reddit.com',
    riskLevel: 'high', // Auto-posting gets you banned
    supportsAutoPost: false
  },
  quora: {
    name: 'Quora',
    riskLevel: 'medium',
    supportsAutoPost: false
  },
  hackernews: {
    name: 'Hacker News',
    apiBase: 'https://hacker-news.firebaseio.com/v0',
    riskLevel: 'high',
    supportsAutoPost: false
  },
  twitter: {
    name: 'Twitter/X',
    riskLevel: 'medium',
    supportsAutoPost: true // With API
  },
  indiehackers: {
    name: 'Indie Hackers',
    url: 'https://www.indiehackers.com',
    riskLevel: 'low',
    supportsAutoPost: false
  }
};

// Subreddit mapping by industry/niche
const SUBREDDIT_MAP = {
  saas: ['SaaS', 'startups', 'entrepreneur', 'smallbusiness', 'Entrepreneur'],
  ai: ['artificial', 'MachineLearning', 'ChatGPT', 'OpenAI', 'LocalLLaMA'],
  marketing: ['marketing', 'SEO', 'socialmedia', 'content_marketing', 'PPC', 'digital_marketing'],
  webdev: ['webdev', 'web_design', 'javascript', 'reactjs', 'sveltejs', 'Frontend'],
  productivity: ['productivity', 'GetMotivated', 'digitalnomad', 'remotework'],
  ecommerce: ['ecommerce', 'Shopify', 'dropship', 'FulfillmentByAmazon'],
  design: ['design', 'UI_Design', 'userexperience', 'web_design'],
  nocode: ['nocode', 'lowcode', 'Zapier', 'Airtable'],
  devtools: ['devops', 'programming', 'learnprogramming', 'webdev'],
  fintech: ['fintech', 'CryptoCurrency', 'personalfinance'],
  general: ['InternetIsBeautiful', 'alphaandbetausers', 'roastmystartup', 'SideProject']
};

/**
 * Get relevant subreddits for a website
 */
export function getRelevantSubreddits(website) {
  const subreddits = new Set();

  // Always include general startup/product subreddits
  SUBREDDIT_MAP.general.forEach(s => subreddits.add(s));

  // Map industry to subreddits
  const industry = website.industry?.toLowerCase() || '';
  const keywords = (website.keywords || []).map(k => k.toLowerCase());
  const businessType = website.business_type?.toLowerCase() || '';

  for (const [niche, subs] of Object.entries(SUBREDDIT_MAP)) {
    if (industry.includes(niche) || keywords.some(k => k.includes(niche) || niche.includes(k))) {
      subs.forEach(s => subreddits.add(s));
    }
  }

  // Business type mapping
  if (businessType === 'saas' || businessType === 'b2b') {
    SUBREDDIT_MAP.saas.forEach(s => subreddits.add(s));
  }

  return Array.from(subreddits);
}

/**
 * Search Reddit for relevant posts (using public JSON API)
 */
export async function searchReddit(query, subreddit = null, limit = 25) {
  try {
    const baseUrl = subreddit
      ? `https://www.reddit.com/r/${subreddit}/search.json`
      : 'https://www.reddit.com/search.json';

    const params = new URLSearchParams({
      q: query,
      sort: 'new',
      limit: limit.toString(),
      restrict_sr: subreddit ? 'true' : 'false',
      t: 'week' // Time filter: hour, day, week, month, year, all
    });

    const response = await fetch(`${baseUrl}?${params}`, {
      headers: {
        'User-Agent': 'LinkLaunch/1.0 (Opportunity Finder)'
      }
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json();

    return data.data.children.map(post => ({
      id: post.data.id,
      title: post.data.title,
      selftext: post.data.selftext,
      subreddit: post.data.subreddit,
      url: `https://reddit.com${post.data.permalink}`,
      score: post.data.score,
      num_comments: post.data.num_comments,
      created_utc: post.data.created_utc,
      author: post.data.author
    }));

  } catch (error) {
    console.error('Reddit search error:', error);
    return [];
  }
}

/**
 * Search Hacker News for relevant stories
 */
export async function searchHackerNews(query, limit = 25) {
  try {
    // Use Algolia HN Search API
    const response = await fetch(
      `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=${limit}`
    );

    if (!response.ok) {
      throw new Error(`HN API error: ${response.status}`);
    }

    const data = await response.json();

    return data.hits.map(story => ({
      id: story.objectID,
      title: story.title,
      url: story.url,
      hn_url: `https://news.ycombinator.com/item?id=${story.objectID}`,
      points: story.points,
      num_comments: story.num_comments,
      created_at: story.created_at,
      author: story.author
    }));

  } catch (error) {
    console.error('HN search error:', error);
    return [];
  }
}

/**
 * Check if a post is a good opportunity
 */
function isGoodOpportunity(post, website) {
  // Skip posts with very low engagement
  if (post.score < 5 && post.num_comments < 3) {
    return false;
  }

  // Skip very old posts (> 3 days)
  const postAge = Date.now() / 1000 - (post.created_utc || new Date(post.created_at).getTime() / 1000);
  if (postAge > 3 * 24 * 60 * 60) {
    return false;
  }

  // Check for question indicators
  const questionIndicators = ['?', 'looking for', 'recommend', 'suggestions', 'best', 'alternative', 'help', 'how to', 'what is', 'which'];
  const title = post.title.toLowerCase();
  const hasQuestion = questionIndicators.some(q => title.includes(q));

  // Check for relevance to website
  const websiteKeywords = [
    website.name.toLowerCase(),
    ...(website.keywords || []).map(k => k.toLowerCase()),
    website.industry?.toLowerCase(),
    website.category?.toLowerCase()
  ].filter(Boolean);

  const content = `${post.title} ${post.selftext || ''}`.toLowerCase();
  const isRelevant = websiteKeywords.some(kw => content.includes(kw));

  return hasQuestion || isRelevant;
}

/**
 * Generate a helpful response draft
 */
async function generateResponseDraft(post, website, platform) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const platformGuidelines = {
    reddit: `
- Be genuinely helpful first, promotional second (or not at all)
- Match the subreddit's tone and culture
- Don't start with "Hey!" or overly enthusiastic greetings
- If mentioning your product, be transparent ("I work on X" or "Disclosure: this is my product")
- Provide value even if they don't use your product
- Don't use marketing speak
`,
    hackernews: `
- Be technical and substantive
- HN users are highly skeptical of self-promotion
- Only mention your product if it's DIRECTLY relevant and you disclose the connection
- Better to provide helpful technical insight without any promotion
- Keep it concise
`,
    quora: `
- Answer the question thoroughly first
- You can mention your product as ONE option among several
- Cite sources and be authoritative
- Personal experience is valued
`,
    twitter: `
- Keep it brief and engaging
- Use natural language, not marketing speak
- Can be slightly more promotional than Reddit/HN
- Include a link only if truly helpful
`
  };

  const prompt = `
You are helping draft a response to a community post. The goal is to be genuinely helpful while subtly positioning the product as a potential solution (only if relevant).

PLATFORM: ${platform}
${platformGuidelines[platform] || ''}

POST:
Title: ${post.title}
${post.selftext ? `Content: ${post.selftext.substring(0, 500)}...` : ''}
Subreddit/Source: ${post.subreddit || 'Hacker News'}

PRODUCT (only mention if TRULY relevant):
Name: ${website.name}
URL: ${website.url}
Description: ${website.description_short || website.description_medium || website.tagline}
What it does: ${website.description_medium || website.description_short}

Write a response that:
1. Actually answers their question or contributes to the discussion
2. Provides genuine value (tips, insights, resources)
3. Only mentions ${website.name} if it's a natural fit AND you disclose the connection
4. Sounds like a real person, not a marketer
5. Is appropriate length for the platform (Reddit: 100-250 words, HN: 50-150 words, Twitter: under 280 chars)

If the post isn't relevant to ${website.name}, just write a helpful response WITHOUT mentioning the product at all.

Return ONLY the response text.
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
}

/**
 * Find and store community opportunities for a website
 */
export async function findOpportunities(websiteId) {
  // Get website
  const { data: website, error: websiteError } = await supabase
    .from('websites')
    .select('*')
    .eq('id', websiteId)
    .single();

  if (websiteError || !website) {
    throw new Error('Website not found');
  }

  const opportunities = [];

  // Build search queries from website data
  const searchQueries = [
    website.name,
    ...(website.keywords || []).slice(0, 3),
    website.industry,
    website.category
  ].filter(Boolean);

  // Get relevant subreddits
  const subreddits = getRelevantSubreddits(website);

  // Search Reddit
  for (const subreddit of subreddits.slice(0, 5)) { // Limit to avoid rate limiting
    for (const query of searchQueries.slice(0, 2)) {
      const posts = await searchReddit(query, subreddit, 10);

      for (const post of posts) {
        if (isGoodOpportunity(post, website)) {
          // Check if we already have this opportunity
          const { data: existing } = await supabase
            .from('qa_opportunities')
            .select('id')
            .eq('question_url', post.url)
            .eq('website_id', websiteId)
            .single();

          if (!existing) {
            opportunities.push({
              platform: 'reddit',
              post,
              subreddit
            });
          }
        }
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Search Hacker News
  for (const query of searchQueries.slice(0, 2)) {
    const stories = await searchHackerNews(query, 10);

    for (const story of stories) {
      if (story.points > 10 || story.num_comments > 5) {
        const { data: existing } = await supabase
          .from('qa_opportunities')
          .select('id')
          .eq('question_url', story.hn_url)
          .eq('website_id', websiteId)
          .single();

        if (!existing) {
          opportunities.push({
            platform: 'hackernews',
            post: {
              ...story,
              url: story.hn_url,
              selftext: ''
            }
          });
        }
      }
    }

    await new Promise(r => setTimeout(r, 500));
  }

  // Generate drafts and store opportunities
  const results = [];

  for (const opp of opportunities.slice(0, 10)) { // Limit drafts to save API calls
    try {
      const draftResponse = await generateResponseDraft(opp.post, website, opp.platform);

      const { data, error } = await supabase
        .from('qa_opportunities')
        .insert({
          website_id: websiteId,
          platform: opp.platform,
          question_url: opp.post.url,
          question_title: opp.post.title,
          question_content: opp.post.selftext?.substring(0, 1000) || null,
          subreddit: opp.subreddit || null,
          relevance_score: 0.7, // Could calculate more precisely
          keywords_matched: website.keywords?.filter(k =>
            opp.post.title.toLowerCase().includes(k.toLowerCase())
          ) || [],
          generated_answer: draftResponse,
          status: 'pending_review',
          found_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!error) {
        results.push({
          platform: opp.platform,
          title: opp.post.title,
          url: opp.post.url,
          draftGenerated: true
        });
      }

    } catch (error) {
      console.error('Error processing opportunity:', error);
    }
  }

  return {
    found: opportunities.length,
    processed: results.length,
    opportunities: results
  };
}

/**
 * Get pending opportunities for a user
 */
export async function getOpportunities(userId, status = 'pending_review') {
  const { data, error } = await supabase
    .from('qa_opportunities')
    .select(`
      *,
      website:websites!inner(user_id, name)
    `)
    .eq('website.user_id', userId)
    .eq('status', status)
    .order('found_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Update opportunity status
 */
export async function updateOpportunityStatus(opportunityId, userId, status, postedAnswer = null) {
  // Verify ownership
  const { data: opp } = await supabase
    .from('qa_opportunities')
    .select('website:websites(user_id)')
    .eq('id', opportunityId)
    .single();

  if (!opp || opp.website?.user_id !== userId) {
    throw new Error('Unauthorized');
  }

  const updates = {
    status,
    updated_at: new Date().toISOString()
  };

  if (postedAnswer) {
    updates.posted_answer = postedAnswer;
    updates.posted_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('qa_opportunities')
    .update(updates)
    .eq('id', opportunityId);

  if (error) throw error;
  return { success: true };
}

/**
 * Regenerate response draft
 */
export async function regenerateResponse(opportunityId, userId) {
  const { data: opp, error: fetchError } = await supabase
    .from('qa_opportunities')
    .select(`
      *,
      website:websites(*)
    `)
    .eq('id', opportunityId)
    .single();

  if (fetchError || !opp) {
    throw new Error('Opportunity not found');
  }

  if (opp.website.user_id !== userId) {
    throw new Error('Unauthorized');
  }

  const post = {
    title: opp.question_title,
    selftext: opp.question_content,
    subreddit: opp.subreddit
  };

  const newDraft = await generateResponseDraft(post, opp.website, opp.platform);

  const { error } = await supabase
    .from('qa_opportunities')
    .update({
      generated_answer: newDraft,
      updated_at: new Date().toISOString()
    })
    .eq('id', opportunityId);

  if (error) throw error;

  return { success: true, newDraft };
}
