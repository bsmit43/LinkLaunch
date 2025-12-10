/**
 * Review Request Service
 * Automated email sequences to collect reviews on G2, Capterra, Trustpilot
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Review platforms database
const REVIEW_PLATFORMS = [
  {
    id: 'g2',
    name: 'G2',
    type: 'saas',
    url: 'https://www.g2.com',
    domainAuthority: 92,
    reviewUrlTemplate: 'https://www.g2.com/products/{slug}/reviews#reviews',
    submitUrlTemplate: 'https://www.g2.com/products/{slug}/reviews/new',
    importance: 'high',
    instructions: 'User needs to have a G2 account. Reviews are verified.'
  },
  {
    id: 'capterra',
    name: 'Capterra',
    type: 'saas',
    url: 'https://www.capterra.com',
    domainAuthority: 90,
    reviewUrlTemplate: 'https://www.capterra.com/p/{id}/reviews',
    submitUrlTemplate: 'https://www.capterra.com/reviews/{id}',
    importance: 'high',
    instructions: 'Capterra verifies reviews via email. User should use work email.'
  },
  {
    id: 'trustpilot',
    name: 'Trustpilot',
    type: 'general',
    url: 'https://www.trustpilot.com',
    domainAuthority: 93,
    reviewUrlTemplate: 'https://www.trustpilot.com/review/{domain}',
    submitUrlTemplate: 'https://www.trustpilot.com/evaluate/{domain}',
    importance: 'high',
    instructions: 'Anyone can leave a review. Trustpilot verifies via email.'
  },
  {
    id: 'producthunt',
    name: 'Product Hunt',
    type: 'startup',
    url: 'https://www.producthunt.com',
    domainAuthority: 91,
    reviewUrlTemplate: 'https://www.producthunt.com/products/{slug}/reviews',
    submitUrlTemplate: 'https://www.producthunt.com/products/{slug}/reviews/new',
    importance: 'medium',
    instructions: 'User needs Product Hunt account.'
  },
  {
    id: 'getapp',
    name: 'GetApp',
    type: 'saas',
    url: 'https://www.getapp.com',
    domainAuthority: 85,
    reviewUrlTemplate: 'https://www.getapp.com/reviews/{id}',
    submitUrlTemplate: 'https://www.getapp.com/reviews/{id}/write',
    importance: 'medium',
    instructions: 'Part of Gartner network with Capterra.'
  },
  {
    id: 'softwareadvice',
    name: 'Software Advice',
    type: 'saas',
    url: 'https://www.softwareadvice.com',
    domainAuthority: 82,
    reviewUrlTemplate: 'https://www.softwareadvice.com/reviews/{id}',
    submitUrlTemplate: 'https://www.softwareadvice.com/reviews/{id}/write',
    importance: 'medium',
    instructions: 'Part of Gartner network with Capterra.'
  },
  {
    id: 'sourceforge',
    name: 'SourceForge',
    type: 'saas',
    url: 'https://sourceforge.net',
    domainAuthority: 89,
    reviewUrlTemplate: 'https://sourceforge.net/software/{slug}/reviews',
    submitUrlTemplate: 'https://sourceforge.net/software/{slug}/reviews/new',
    importance: 'medium',
    instructions: 'Open for software reviews.'
  },
  {
    id: 'alternativeto',
    name: 'AlternativeTo',
    type: 'general',
    url: 'https://alternativeto.net',
    domainAuthority: 80,
    reviewUrlTemplate: 'https://alternativeto.net/software/{slug}',
    submitUrlTemplate: 'https://alternativeto.net/software/{slug}#reviews',
    importance: 'low',
    instructions: 'Like/comment functionality rather than detailed reviews.'
  }
];

// Email sequence templates
const EMAIL_SEQUENCES = {
  welcome: {
    delay: 0,
    subject: 'Thanks for joining {product_name}!',
    purpose: 'Welcome and set expectations'
  },
  check_in: {
    delay: 7,
    subject: "How's your experience with {product_name} so far?",
    purpose: 'Get feedback and identify happy customers'
  },
  review_request: {
    delay: 14,
    subject: 'Quick favor? (takes 2 min)',
    purpose: 'Ask for review on specific platforms'
  },
  follow_up: {
    delay: 21,
    subject: 'Did you have a chance to leave a review?',
    purpose: 'Gentle reminder'
  }
};

/**
 * Get review platforms suitable for a website
 */
export function getRelevantPlatforms(website) {
  const platforms = [];

  for (const platform of REVIEW_PLATFORMS) {
    // All SaaS companies should be on G2/Capterra
    if (platform.type === 'saas' && ['saas', 'b2b', 'b2b2c'].includes(website.business_type)) {
      platforms.push(platform);
    }
    // Everyone should be on Trustpilot
    else if (platform.type === 'general') {
      platforms.push(platform);
    }
    // Startups on Product Hunt
    else if (platform.type === 'startup') {
      platforms.push(platform);
    }
  }

  return platforms.sort((a, b) => {
    const importanceOrder = { high: 0, medium: 1, low: 2 };
    return importanceOrder[a.importance] - importanceOrder[b.importance];
  });
}

/**
 * Generate review request email
 */
async function generateReviewEmail(website, customer, sequenceStep, platforms) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const template = EMAIL_SEQUENCES[sequenceStep];

  let prompt;

  if (sequenceStep === 'welcome') {
    prompt = `
Write a warm welcome email for a new customer of ${website.name}.

Customer name: ${customer.name || 'there'}
Product: ${website.name}
Product description: ${website.description_short || website.tagline}

The email should:
- Thank them for signing up
- Briefly mention what they can achieve with the product
- Offer to help if they have questions
- Be friendly and personal (not corporate)
- Be under 150 words
- NOT ask for anything yet

Return just the email body (no subject line).
`;
  } else if (sequenceStep === 'check_in') {
    prompt = `
Write a check-in email to a customer who's been using ${website.name} for about a week.

Customer name: ${customer.name || 'there'}
Product: ${website.name}

The email should:
- Ask how their experience has been
- Show genuine interest in their feedback
- Mention you're available to help
- Ask if there's anything that could be better
- Be conversational and friendly
- Be under 120 words
- End with a simple question to encourage reply

Return just the email body (no subject line).
`;
  } else if (sequenceStep === 'review_request') {
    const platformLinks = platforms.slice(0, 3).map(p =>
      `- ${p.name}: [Leave a review](${p.submitUrlTemplate.replace('{slug}', website.name.toLowerCase().replace(/\s+/g, '-')).replace('{domain}', new URL(website.url).hostname).replace('{id}', 'YOUR_ID')})`
    ).join('\n');

    prompt = `
Write a review request email for ${website.name}.

Customer name: ${customer.name || 'there'}
Product: ${website.name}

The email should:
- Acknowledge their support
- Explain why reviews matter (helps other people find us, helps us grow)
- Make the ask simple and specific
- Mention it takes 2 minutes
- Provide the direct links (I'll add them)
- Offer an incentive if appropriate (discount, extended trial, etc.)
- Be grateful but not desperate
- Be under 150 words

End with something like "Here are the links:" (I'll add the platform links after)

Return just the email body (no subject line).
`;
  } else if (sequenceStep === 'follow_up') {
    prompt = `
Write a gentle follow-up email for a review request that was sent a week ago.

Customer name: ${customer.name || 'there'}
Product: ${website.name}

The email should:
- Be very brief (under 80 words)
- Not be pushy or guilt-trippy
- Acknowledge they're busy
- Simply remind about the review request
- Make it easy to say no (offer to stop asking)
- Be friendly and understanding

Return just the email body (no subject line).
`;
  }

  const result = await model.generateContent(prompt);
  let body = result.response.text();

  // Add platform links for review request
  if (sequenceStep === 'review_request' && platforms.length > 0) {
    const platformLinks = platforms.slice(0, 3).map(p => {
      const url = p.submitUrlTemplate
        .replace('{slug}', website.name.toLowerCase().replace(/\s+/g, '-'))
        .replace('{domain}', new URL(website.url).hostname)
        .replace('{id}', 'YOUR_ID');
      return `• ${p.name}: ${url}`;
    }).join('\n');

    body += `\n\n${platformLinks}`;
  }

  return {
    subject: template.subject.replace('{product_name}', website.name),
    body
  };
}

/**
 * Create a review request sequence for a customer
 */
export async function createReviewSequence(websiteId, customer) {
  // Get website
  const { data: website, error: websiteError } = await supabase
    .from('websites')
    .select('*')
    .eq('id', websiteId)
    .single();

  if (websiteError || !website) {
    throw new Error('Website not found');
  }

  // Get relevant platforms
  const platforms = getRelevantPlatforms(website);

  // Create sequence emails
  const sequences = ['welcome', 'check_in', 'review_request', 'follow_up'];
  const emailRecords = [];

  for (const step of sequences) {
    const template = EMAIL_SEQUENCES[step];
    const email = await generateReviewEmail(website, customer, step, platforms);

    emailRecords.push({
      website_id: websiteId,
      customer_email: customer.email,
      customer_name: customer.name,
      sequence_step: step,
      email_subject: email.subject,
      email_body: email.body,
      scheduled_for: new Date(Date.now() + template.delay * 24 * 60 * 60 * 1000).toISOString(),
      status: 'scheduled',
      platforms: platforms.slice(0, 3).map(p => p.id)
    });
  }

  // Insert all emails
  const { data, error } = await supabase
    .from('review_email_queue')
    .insert(emailRecords)
    .select();

  if (error) throw error;

  return {
    success: true,
    emails_scheduled: data.length,
    platforms: platforms.slice(0, 3).map(p => p.name)
  };
}

/**
 * Get pending review emails to send
 */
export async function getPendingReviewEmails() {
  const { data, error } = await supabase
    .from('review_email_queue')
    .select(`
      *,
      website:websites(name, url, user_id)
    `)
    .eq('status', 'scheduled')
    .lte('scheduled_for', new Date().toISOString())
    .limit(10);

  if (error) throw error;
  return data;
}

/**
 * Mark email as sent
 */
export async function markEmailSent(emailId) {
  const { error } = await supabase
    .from('review_email_queue')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString()
    })
    .eq('id', emailId);

  if (error) throw error;
  return { success: true };
}

/**
 * Track review submission
 */
export async function trackReviewSubmitted(websiteId, platformId, reviewUrl, rating) {
  const { data: website } = await supabase
    .from('websites')
    .select('user_id')
    .eq('id', websiteId)
    .single();

  if (!website) throw new Error('Website not found');

  // Find platform
  const platform = REVIEW_PLATFORMS.find(p => p.id === platformId);
  if (!platform) throw new Error('Platform not found');

  // Create review record
  const { data, error } = await supabase
    .from('review_submissions')
    .insert({
      website_id: websiteId,
      platform_id: platformId,
      platform_name: platform.name,
      review_url: reviewUrl,
      rating,
      status: 'submitted'
    })
    .select()
    .single();

  if (error) throw error;

  // Track as backlink if URL provided
  if (reviewUrl) {
    await supabase
      .from('backlinks')
      .insert({
        website_id: websiteId,
        source_url: reviewUrl,
        source_domain: new URL(platform.url).hostname,
        source_domain_authority: platform.domainAuthority,
        target_url: '',
        link_type: 'nofollow',
        context: `Review on ${platform.name}`,
        is_from_submission: true
      });
  }

  return data;
}

/**
 * Get review stats for a website
 */
export async function getReviewStats(websiteId) {
  const { data: reviews, error } = await supabase
    .from('review_submissions')
    .select('*')
    .eq('website_id', websiteId);

  if (error) throw error;

  const stats = {
    total: reviews.length,
    byPlatform: {},
    averageRating: 0
  };

  let totalRating = 0;
  let ratedCount = 0;

  for (const review of reviews) {
    if (!stats.byPlatform[review.platform_name]) {
      stats.byPlatform[review.platform_name] = { count: 0, avgRating: 0, ratings: [] };
    }
    stats.byPlatform[review.platform_name].count++;

    if (review.rating) {
      stats.byPlatform[review.platform_name].ratings.push(review.rating);
      totalRating += review.rating;
      ratedCount++;
    }
  }

  // Calculate averages
  stats.averageRating = ratedCount > 0 ? (totalRating / ratedCount).toFixed(1) : null;

  for (const platform of Object.keys(stats.byPlatform)) {
    const ratings = stats.byPlatform[platform].ratings;
    stats.byPlatform[platform].avgRating = ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : null;
    delete stats.byPlatform[platform].ratings;
  }

  return stats;
}

/**
 * Get all review platforms info
 */
export function getAllReviewPlatforms() {
  return REVIEW_PLATFORMS;
}
