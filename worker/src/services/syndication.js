/**
 * Content Syndication Service
 * Automatically publishes content to Medium, Dev.to, Hashnode, and LinkedIn
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
  medium: {
    name: 'Medium',
    apiBase: 'https://api.medium.com/v1',
    domainAuthority: 96,
    dofollow: false,
    requiresAuth: true
  },
  devto: {
    name: 'Dev.to',
    apiBase: 'https://dev.to/api',
    domainAuthority: 78,
    dofollow: true,
    requiresAuth: true
  },
  hashnode: {
    name: 'Hashnode',
    apiBase: 'https://gql.hashnode.com',
    domainAuthority: 72,
    dofollow: true,
    requiresAuth: true
  },
  linkedin: {
    name: 'LinkedIn',
    apiBase: 'https://api.linkedin.com/v2',
    domainAuthority: 98,
    dofollow: false,
    requiresAuth: true
  }
};

/**
 * Rewrite content for a specific platform to avoid duplicate content issues
 */
async function rewriteForPlatform(originalContent, platform, website) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `
Rewrite the following article for publication on ${platform}. The rewrite should:
1. Maintain the same key information and value
2. Use a different structure and opening
3. Adjust tone for ${platform} audience (${platform === 'devto' ? 'developer-focused, technical' : platform === 'linkedin' ? 'professional, business-focused' : 'general tech audience'})
4. Be 70-80% unique from the original to avoid duplicate content issues
5. Keep the canonical URL reference to the original
6. Include a brief author bio mentioning ${website.name}

Original article:
${originalContent}

Return ONLY the rewritten article in markdown format. Include a "---" at the end followed by an author bio.
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Post to Medium
 */
export async function postToMedium(content, credentials) {
  if (!credentials.mediumToken) {
    return { success: false, error: 'Medium integration token not configured' };
  }

  try {
    // Get user ID first
    const userResponse = await fetch(`${PLATFORMS.medium.apiBase}/me`, {
      headers: {
        'Authorization': `Bearer ${credentials.mediumToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!userResponse.ok) {
      throw new Error('Failed to authenticate with Medium');
    }

    const userData = await userResponse.json();
    const userId = userData.data.id;

    // Create post
    const postResponse = await fetch(`${PLATFORMS.medium.apiBase}/users/${userId}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.mediumToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: content.title,
        contentFormat: 'markdown',
        content: content.body,
        canonicalUrl: content.canonicalUrl,
        tags: content.tags?.slice(0, 5) || [],
        publishStatus: 'public'
      })
    });

    if (!postResponse.ok) {
      const error = await postResponse.json();
      throw new Error(error.errors?.[0]?.message || 'Failed to publish to Medium');
    }

    const postData = await postResponse.json();
    return {
      success: true,
      url: postData.data.url,
      id: postData.data.id
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Post to Dev.to
 */
export async function postToDevTo(content, credentials) {
  if (!credentials.devtoApiKey) {
    return { success: false, error: 'Dev.to API key not configured' };
  }

  try {
    const response = await fetch(`${PLATFORMS.devto.apiBase}/articles`, {
      method: 'POST',
      headers: {
        'api-key': credentials.devtoApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        article: {
          title: content.title,
          body_markdown: content.body,
          published: true,
          canonical_url: content.canonicalUrl,
          tags: content.tags?.slice(0, 4) || [],
          series: content.series || null
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to publish to Dev.to');
    }

    const data = await response.json();
    return {
      success: true,
      url: data.url,
      id: data.id
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Post to Hashnode
 */
export async function postToHashnode(content, credentials) {
  if (!credentials.hashnodeToken || !credentials.hashnodePublicationId) {
    return { success: false, error: 'Hashnode credentials not configured' };
  }

  try {
    const mutation = `
      mutation PublishPost($input: PublishPostInput!) {
        publishPost(input: $input) {
          post {
            id
            url
            title
          }
        }
      }
    `;

    const response = await fetch(PLATFORMS.hashnode.apiBase, {
      method: 'POST',
      headers: {
        'Authorization': credentials.hashnodeToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            title: content.title,
            contentMarkdown: content.body,
            publicationId: credentials.hashnodePublicationId,
            originalArticleURL: content.canonicalUrl,
            tags: content.tags?.map(tag => ({ name: tag, slug: tag.toLowerCase().replace(/\s+/g, '-') })) || []
          }
        }
      })
    });

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return {
      success: true,
      url: data.data.publishPost.post.url,
      id: data.data.publishPost.post.id
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Post to LinkedIn
 */
export async function postToLinkedIn(content, credentials) {
  if (!credentials.linkedinAccessToken) {
    return { success: false, error: 'LinkedIn access token not configured' };
  }

  try {
    // Get user URN first
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

    // Create article post
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
              text: content.excerpt || content.title
            },
            shareMediaCategory: 'ARTICLE',
            media: [{
              status: 'READY',
              originalUrl: content.canonicalUrl,
              title: {
                text: content.title
              },
              description: {
                text: content.excerpt || ''
              }
            }]
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      })
    });

    if (!postResponse.ok) {
      const error = await postResponse.json();
      throw new Error(error.message || 'Failed to publish to LinkedIn');
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
 * Syndicate content to all configured platforms
 */
export async function syndicateContent(syndicationId) {
  // Get syndication record
  const { data: syndication, error: fetchError } = await supabase
    .from('content_syndications')
    .select(`
      *,
      website:websites(*)
    `)
    .eq('id', syndicationId)
    .single();

  if (fetchError || !syndication) {
    throw new Error('Syndication not found');
  }

  const { website, platform, original_title, original_content, original_url } = syndication;

  // Update status to rewriting
  await supabase
    .from('content_syndications')
    .update({ status: 'rewriting' })
    .eq('id', syndicationId);

  try {
    // Get user credentials
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', website.user_id)
      .single();

    // Rewrite content for the platform
    const rewrittenContent = await rewriteForPlatform(original_content, platform, website);

    // Update with rewritten content
    await supabase
      .from('content_syndications')
      .update({
        syndicated_title: original_title,
        syndicated_content: rewrittenContent,
        canonical_url: original_url
      })
      .eq('id', syndicationId);

    // Post to platform
    const content = {
      title: original_title,
      body: rewrittenContent,
      canonicalUrl: original_url,
      tags: website.keywords || [],
      excerpt: website.description_short
    };

    // Get credentials from profile metadata or separate credentials table
    const credentials = profile?.platform_credentials || {};

    let result;
    switch (platform) {
      case 'medium':
        result = await postToMedium(content, credentials);
        break;
      case 'devto':
        result = await postToDevTo(content, credentials);
        break;
      case 'hashnode':
        result = await postToHashnode(content, credentials);
        break;
      case 'linkedin':
      case 'linkedin_article':
        result = await postToLinkedIn(content, credentials);
        break;
      default:
        result = { success: false, error: `Unsupported platform: ${platform}` };
    }

    if (result.success) {
      await supabase
        .from('content_syndications')
        .update({
          status: 'published',
          published_url: result.url,
          published_at: new Date().toISOString()
        })
        .eq('id', syndicationId);

      // Track backlink
      await supabase
        .from('backlinks')
        .insert({
          website_id: website.id,
          source_url: result.url,
          source_domain: platform === 'devto' ? 'dev.to' : platform === 'hashnode' ? 'hashnode.com' : platform === 'linkedin' ? 'linkedin.com' : 'medium.com',
          source_domain_authority: PLATFORMS[platform]?.domainAuthority || 0,
          target_url: original_url,
          link_type: PLATFORMS[platform]?.dofollow ? 'dofollow' : 'nofollow',
          is_from_submission: true
        });

      return { success: true, url: result.url };
    } else {
      await supabase
        .from('content_syndications')
        .update({
          status: 'failed',
          error_message: result.error
        })
        .eq('id', syndicationId);

      return result;
    }

  } catch (error) {
    await supabase
      .from('content_syndications')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', syndicationId);

    throw error;
  }
}

/**
 * Create syndication jobs for all platforms
 */
export async function createSyndicationBatch(websiteId, articleTitle, articleContent, articleUrl, platforms = ['medium', 'devto', 'hashnode']) {
  const { data: website } = await supabase
    .from('websites')
    .select('user_id')
    .eq('id', websiteId)
    .single();

  if (!website) {
    throw new Error('Website not found');
  }

  const syndications = platforms.map(platform => ({
    website_id: websiteId,
    user_id: website.user_id,
    original_title: articleTitle,
    original_content: articleContent,
    original_url: articleUrl,
    platform,
    status: 'pending'
  }));

  const { data, error } = await supabase
    .from('content_syndications')
    .insert(syndications)
    .select();

  if (error) throw error;

  return data;
}
