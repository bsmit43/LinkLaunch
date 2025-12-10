/**
 * Social Scheduling Service
 * Generate and schedule social media content
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
  twitter: {
    name: 'Twitter/X',
    maxLength: 280,
    supportsMedia: true,
    supportsLinks: true,
    apiAvailable: true,
    bestTimes: ['9:00', '12:00', '17:00', '20:00'] // UTC
  },
  linkedin: {
    name: 'LinkedIn',
    maxLength: 3000,
    supportsMedia: true,
    supportsLinks: true,
    apiAvailable: true,
    bestTimes: ['8:00', '10:00', '12:00', '17:00'] // UTC
  },
  producthunt: {
    name: 'Product Hunt',
    maxLength: 260,
    supportsMedia: false,
    supportsLinks: true,
    apiAvailable: false,
    bestTimes: ['0:01'] // Launch at midnight PST
  }
};

// Content types/themes
const CONTENT_TYPES = {
  feature: {
    name: 'Feature Highlight',
    description: 'Highlight a specific feature or capability',
    frequency: 'weekly'
  },
  value: {
    name: 'Value/Tip Post',
    description: 'Share a tip related to your industry without direct promotion',
    frequency: 'bi-weekly'
  },
  social_proof: {
    name: 'Social Proof',
    description: 'Share milestones, testimonials, or user stories',
    frequency: 'weekly'
  },
  behind_scenes: {
    name: 'Behind the Scenes',
    description: 'Share the building process, challenges, wins',
    frequency: 'bi-weekly'
  },
  engagement: {
    name: 'Engagement Post',
    description: 'Ask questions, run polls, encourage discussion',
    frequency: 'weekly'
  },
  thread: {
    name: 'Thread/Carousel',
    description: 'Multi-part educational content',
    frequency: 'bi-weekly'
  }
};

/**
 * Generate social content for a specific type and platform
 */
async function generateSocialPost(website, contentType, platform) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const platformConfig = PLATFORMS[platform];
  const typeConfig = CONTENT_TYPES[contentType];

  const prompt = `
Generate a ${platform} post for a ${contentType} (${typeConfig.name}) about ${website.name}.

Product Info:
- Name: ${website.name}
- URL: ${website.url}
- Description: ${website.description_short || website.description_medium || website.tagline}
- Industry: ${website.industry || 'Technology'}
- Target audience: ${website.target_audience || 'Professionals'}
- Keywords: ${(website.keywords || []).join(', ')}

Requirements:
- Max ${platformConfig.maxLength} characters
- ${platform === 'twitter' ? 'Be concise and punchy, use line breaks for readability' : ''}
- ${platform === 'linkedin' ? 'Be professional but personable, can be longer' : ''}
- ${contentType === 'value' ? 'Do NOT mention the product directly - just provide pure value' : ''}
- ${contentType === 'feature' ? 'Focus on ONE specific feature and its benefit' : ''}
- ${contentType === 'social_proof' ? 'Sound authentic, not boastful' : ''}
- ${contentType === 'engagement' ? 'End with a question to encourage replies' : ''}
- ${contentType === 'behind_scenes' ? 'Be personal and vulnerable, share a real moment' : ''}
- NO hashtag spam (max 3 relevant hashtags for Twitter, 3-5 for LinkedIn)
- Sound human, not like AI or marketing copy
- Include a subtle CTA if appropriate (but not pushy)

${contentType === 'thread' ? `
Generate a 5-part thread. Format as:
1/5: [first post]
2/5: [second post]
...etc
Each part should be under ${platformConfig.maxLength} characters.
` : ''}

Return ONLY the post content, no explanations.
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating social post:', error);
    throw error;
  }
}

/**
 * Generate a week's worth of content for a website
 */
export async function generateWeeklyContent(websiteId) {
  const { data: website, error } = await supabase
    .from('websites')
    .select('*')
    .eq('id', websiteId)
    .single();

  if (error || !website) {
    throw new Error('Website not found');
  }

  const posts = [];
  const now = new Date();

  // Content calendar for the week
  const schedule = [
    { day: 1, type: 'feature', platforms: ['twitter', 'linkedin'] },      // Monday
    { day: 3, type: 'value', platforms: ['twitter', 'linkedin'] },        // Wednesday
    { day: 5, type: 'social_proof', platforms: ['twitter', 'linkedin'] }, // Friday
  ];

  for (const item of schedule) {
    for (const platform of item.platforms) {
      const content = await generateSocialPost(website, item.type, platform);

      // Calculate scheduled time
      const scheduledDate = new Date(now);
      scheduledDate.setDate(now.getDate() + ((item.day - now.getDay() + 7) % 7 || 7));

      // Set to best posting time
      const bestTime = PLATFORMS[platform].bestTimes[0];
      const [hours, minutes] = bestTime.split(':');
      scheduledDate.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);

      posts.push({
        website_id: websiteId,
        user_id: website.user_id,
        platform,
        content,
        content_type: item.type,
        scheduled_at: scheduledDate.toISOString(),
        status: 'draft'
      });
    }
  }

  // Insert all posts
  const { data, error: insertError } = await supabase
    .from('social_posts')
    .insert(posts)
    .select();

  if (insertError) throw insertError;

  return {
    success: true,
    posts_created: data.length,
    schedule: data.map(p => ({
      platform: p.platform,
      type: p.content_type,
      scheduled_at: p.scheduled_at,
      preview: p.content.substring(0, 100) + '...'
    }))
  };
}

/**
 * Generate a Twitter thread from a blog post
 */
export async function generateTwitterThread(websiteId, blogContent, blogUrl) {
  const { data: website, error } = await supabase
    .from('websites')
    .select('*')
    .eq('id', websiteId)
    .single();

  if (error || !website) {
    throw new Error('Website not found');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `
Convert this blog post into a compelling Twitter thread (7-10 tweets).

Blog content:
${blogContent.substring(0, 3000)}

Blog URL: ${blogUrl}
Author: ${website.founder_name || 'Founder'} of ${website.name}

Requirements for the thread:
1. First tweet should be a hook that makes people want to read more (no "Thread:" or "1/")
2. Each tweet under 280 characters
3. Use line breaks for readability
4. Include key insights and takeaways
5. Last tweet should have a CTA to read the full post with the URL
6. Sound conversational, not promotional
7. Use emojis sparingly (1-2 per thread max)
8. Format as:

TWEET 1:
[content]

TWEET 2:
[content]

...etc
`;

  try {
    const result = await model.generateContent(prompt);
    const threadText = result.response.text();

    // Parse tweets
    const tweets = threadText
      .split(/TWEET \d+:/i)
      .filter(t => t.trim())
      .map(t => t.trim());

    // Store as a single post with thread content
    const { data, error: insertError } = await supabase
      .from('social_posts')
      .insert({
        website_id: websiteId,
        user_id: website.user_id,
        platform: 'twitter',
        content: JSON.stringify(tweets),
        content_type: 'thread',
        link_url: blogUrl,
        status: 'draft',
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return {
      success: true,
      thread_id: data.id,
      tweet_count: tweets.length,
      tweets
    };

  } catch (error) {
    console.error('Error generating thread:', error);
    throw error;
  }
}

/**
 * Post to Twitter (using API)
 */
export async function postToTwitter(content, credentials) {
  if (!credentials.twitterBearerToken) {
    return { success: false, error: 'Twitter credentials not configured' };
  }

  // Twitter API v2 implementation would go here
  // For now, return manual posting instruction
  return {
    success: false,
    error: 'Twitter API integration pending - please post manually',
    content_to_post: content
  };
}

/**
 * Post to LinkedIn (using API)
 */
export async function postToLinkedIn(content, credentials) {
  if (!credentials.linkedinAccessToken) {
    return { success: false, error: 'LinkedIn credentials not configured' };
  }

  try {
    // Get user URN
    const meResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${credentials.linkedinAccessToken}`
      }
    });

    if (!meResponse.ok) {
      throw new Error('Failed to authenticate with LinkedIn');
    }

    const meData = await meResponse.json();
    const authorUrn = `urn:li:person:${meData.sub}`;

    // Create post
    const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.linkedinAccessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      })
    });

    if (!postResponse.ok) {
      const error = await postResponse.json();
      throw new Error(error.message || 'Failed to post to LinkedIn');
    }

    const postData = await postResponse.json();
    return {
      success: true,
      id: postData.id,
      url: `https://www.linkedin.com/feed/update/${postData.id}`
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get scheduled posts for a website
 */
export async function getScheduledPosts(websiteId, status = null) {
  let query = supabase
    .from('social_posts')
    .select('*')
    .eq('website_id', websiteId)
    .order('scheduled_at', { ascending: true });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Update post content
 */
export async function updatePostContent(postId, userId, newContent) {
  const { data: post } = await supabase
    .from('social_posts')
    .select('user_id')
    .eq('id', postId)
    .single();

  if (!post || post.user_id !== userId) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('social_posts')
    .update({
      content: newContent,
      updated_at: new Date().toISOString()
    })
    .eq('id', postId);

  if (error) throw error;
  return { success: true };
}

/**
 * Approve/schedule a post
 */
export async function approvePost(postId, userId, scheduledAt = null) {
  const { data: post } = await supabase
    .from('social_posts')
    .select('user_id')
    .eq('id', postId)
    .single();

  if (!post || post.user_id !== userId) {
    throw new Error('Unauthorized');
  }

  const updates = {
    status: 'scheduled',
    updated_at: new Date().toISOString()
  };

  if (scheduledAt) {
    updates.scheduled_at = scheduledAt;
  }

  const { error } = await supabase
    .from('social_posts')
    .update(updates)
    .eq('id', postId);

  if (error) throw error;
  return { success: true };
}

/**
 * Process scheduled posts (called by cron)
 */
export async function processScheduledPosts() {
  const { data: posts, error } = await supabase
    .from('social_posts')
    .select(`
      *,
      website:websites(user_id)
    `)
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())
    .limit(10);

  if (error) throw error;

  const results = [];

  for (const post of posts) {
    // Get user credentials
    const { data: profile } = await supabase
      .from('profiles')
      .select('platform_credentials')
      .eq('id', post.website.user_id)
      .single();

    const credentials = profile?.platform_credentials || {};

    let result;

    // Update to posting status
    await supabase
      .from('social_posts')
      .update({ status: 'posting' })
      .eq('id', post.id);

    try {
      switch (post.platform) {
        case 'twitter':
          result = await postToTwitter(post.content, credentials);
          break;
        case 'linkedin':
          result = await postToLinkedIn(post.content, credentials);
          break;
        default:
          result = { success: false, error: `Unsupported platform: ${post.platform}` };
      }

      if (result.success) {
        await supabase
          .from('social_posts')
          .update({
            status: 'posted',
            posted_at: new Date().toISOString(),
            post_url: result.url
          })
          .eq('id', post.id);
      } else {
        await supabase
          .from('social_posts')
          .update({
            status: 'failed',
            error_message: result.error
          })
          .eq('id', post.id);
      }

      results.push({ id: post.id, platform: post.platform, ...result });

    } catch (error) {
      await supabase
        .from('social_posts')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', post.id);

      results.push({ id: post.id, platform: post.platform, success: false, error: error.message });
    }
  }

  return { processed: results.length, results };
}

/**
 * Get content calendar view
 */
export async function getContentCalendar(websiteId, startDate, endDate) {
  const { data, error } = await supabase
    .from('social_posts')
    .select('*')
    .eq('website_id', websiteId)
    .gte('scheduled_at', startDate)
    .lte('scheduled_at', endDate)
    .order('scheduled_at', { ascending: true });

  if (error) throw error;

  // Group by date
  const calendar = {};
  for (const post of data) {
    const date = post.scheduled_at.split('T')[0];
    if (!calendar[date]) {
      calendar[date] = [];
    }
    calendar[date].push(post);
  }

  return calendar;
}
