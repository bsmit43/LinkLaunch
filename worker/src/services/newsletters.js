/**
 * Newsletter Database & Outreach Service
 * Find and pitch relevant newsletters for product features
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Curated newsletter database by niche
const NEWSLETTER_DATABASE = [
  // AI & Tech
  { name: 'TLDR', subscribers: 1200000, niche: ['tech', 'ai', 'startup'], contact: 'advertise@tldrnewsletter.com', url: 'https://tldr.tech', sponsored: true },
  { name: "Ben's Bites", subscribers: 100000, niche: ['ai', 'ml'], contact: 'ben@bensbites.co', url: 'https://bensbites.co', sponsored: true },
  { name: 'The Neuron', subscribers: 400000, niche: ['ai'], contact: 'hello@theneurondaily.com', url: 'https://www.theneuron.ai', sponsored: true },
  { name: 'The Rundown AI', subscribers: 600000, niche: ['ai'], contact: 'rowan@therundown.ai', url: 'https://therundown.ai', sponsored: true },
  { name: 'AI Tool Report', subscribers: 500000, niche: ['ai', 'tools'], contact: 'info@aitoolreport.com', url: 'https://aitoolreport.com', sponsored: true },

  // Startups & Founders
  { name: 'Indie Hackers', subscribers: 100000, niche: ['startup', 'indie', 'saas'], contact: 'courtland@indiehackers.com', url: 'https://indiehackers.com', sponsored: false },
  { name: 'Failory', subscribers: 40000, niche: ['startup', 'founders'], contact: 'nico@failory.com', url: 'https://failory.com', sponsored: true },
  { name: 'The Hustle', subscribers: 2500000, niche: ['business', 'startup', 'tech'], contact: 'sponsor@thehustle.co', url: 'https://thehustle.co', sponsored: true },
  { name: 'First Round Review', subscribers: 300000, niche: ['startup', 'vc'], contact: null, url: 'https://review.firstround.com', sponsored: false },
  { name: 'Lenny\'s Newsletter', subscribers: 500000, niche: ['product', 'startup', 'growth'], contact: 'lenny@substack.com', url: 'https://lennysnewsletter.com', sponsored: true },

  // SaaS & Product
  { name: 'SaaS Weekly', subscribers: 20000, niche: ['saas'], contact: 'hiten@saasweekly.com', url: 'https://saasweekly.com', sponsored: true },
  { name: 'Product Hunt Daily', subscribers: 500000, niche: ['product', 'startup', 'tech'], contact: null, url: 'https://producthunt.com', sponsored: false },
  { name: 'SaaStr Newsletter', subscribers: 150000, niche: ['saas', 'b2b'], contact: 'sponsor@saastr.com', url: 'https://saastr.com', sponsored: true },

  // Marketing & Growth
  { name: 'Growth.Design', subscribers: 100000, niche: ['ux', 'growth', 'product'], contact: 'dan@growth.design', url: 'https://growth.design', sponsored: false },
  { name: 'Marketing Brew', subscribers: 350000, niche: ['marketing'], contact: 'ads@morningbrew.com', url: 'https://marketingbrew.com', sponsored: true },
  { name: 'Demand Curve', subscribers: 90000, niche: ['growth', 'marketing', 'startup'], contact: 'julian@demandcurve.com', url: 'https://demandcurve.com', sponsored: true },
  { name: 'Growth Bites', subscribers: 30000, niche: ['growth', 'startup'], contact: null, url: 'https://growthbites.com', sponsored: false },

  // Developer & Engineering
  { name: 'TLDR Web Dev', subscribers: 200000, niche: ['webdev', 'engineering'], contact: 'advertise@tldrnewsletter.com', url: 'https://tldr.tech/webdev', sponsored: true },
  { name: 'JavaScript Weekly', subscribers: 180000, niche: ['javascript', 'webdev'], contact: 'peter@cooperpress.com', url: 'https://javascriptweekly.com', sponsored: true },
  { name: 'Bytes', subscribers: 200000, niche: ['javascript', 'webdev'], contact: 'sponsor@ui.dev', url: 'https://bytes.dev', sponsored: true },
  { name: 'Node Weekly', subscribers: 60000, niche: ['nodejs', 'backend'], contact: 'peter@cooperpress.com', url: 'https://nodeweekly.com', sponsored: true },
  { name: 'React Status', subscribers: 50000, niche: ['react', 'frontend'], contact: 'peter@cooperpress.com', url: 'https://react.statuscode.com', sponsored: true },
  { name: 'Frontend Focus', subscribers: 80000, niche: ['frontend', 'webdev'], contact: 'peter@cooperpress.com', url: 'https://frontendfoc.us', sponsored: true },
  { name: 'Hacker Newsletter', subscribers: 60000, niche: ['tech', 'engineering'], contact: 'kale@hackernewsletter.com', url: 'https://hackernewsletter.com', sponsored: true },

  // Design
  { name: 'Sidebar', subscribers: 45000, niche: ['design', 'ux'], contact: 'sacha@sidebar.io', url: 'https://sidebar.io', sponsored: true },
  { name: 'UX Design Weekly', subscribers: 40000, niche: ['ux', 'design'], contact: 'kenny@uxdesignweekly.com', url: 'https://uxdesignweekly.com', sponsored: true },

  // Productivity & Tools
  { name: 'Dense Discovery', subscribers: 35000, niche: ['productivity', 'design', 'tools'], contact: 'kai@densediscovery.com', url: 'https://densediscovery.com', sponsored: true },
  { name: 'Tool Finder', subscribers: 15000, niche: ['tools', 'productivity'], contact: null, url: 'https://toolfinder.co', sponsored: false },
  { name: 'Refind', subscribers: 300000, niche: ['productivity', 'knowledge'], contact: null, url: 'https://refind.com', sponsored: false },

  // Remote Work
  { name: 'Remote OK Newsletter', subscribers: 100000, niche: ['remote', 'jobs'], contact: 'pieter@remoteok.com', url: 'https://remoteok.com', sponsored: true },
  { name: 'Running Remote', subscribers: 30000, niche: ['remote', 'startup'], contact: null, url: 'https://runningremote.com', sponsored: false },

  // Ecommerce & DTC
  { name: '2PM', subscribers: 40000, niche: ['ecommerce', 'dtc'], contact: 'web@2pml.com', url: 'https://2pml.com', sponsored: true },
  { name: 'Pilothouse', subscribers: 25000, niche: ['ecommerce', 'marketing'], contact: null, url: 'https://pilothouse.co', sponsored: false },

  // Finance & Fintech
  { name: 'Fintech Today', subscribers: 30000, niche: ['fintech', 'finance'], contact: null, url: 'https://fintechtoday.co', sponsored: true },
  { name: 'The Fintech Blueprint', subscribers: 20000, niche: ['fintech'], contact: 'lex@fintechblueprint.com', url: 'https://fintechblueprint.com', sponsored: true },

  // No-Code / Low-Code
  { name: 'No Code Founders', subscribers: 15000, niche: ['nocode', 'startup'], contact: null, url: 'https://nocodefounders.com', sponsored: false },
  { name: 'Makerpad Weekly', subscribers: 30000, niche: ['nocode', 'tools'], contact: null, url: 'https://makerpad.zapier.com', sponsored: false }
];

/**
 * Find newsletters relevant to a website
 */
export function findRelevantNewsletters(website) {
  const websiteNiches = [];

  // Map website attributes to niches
  if (website.industry) {
    websiteNiches.push(website.industry.toLowerCase());
  }

  if (website.keywords) {
    websiteNiches.push(...website.keywords.map(k => k.toLowerCase()));
  }

  if (website.business_type) {
    websiteNiches.push(website.business_type);
  }

  if (website.category) {
    websiteNiches.push(website.category.toLowerCase());
  }

  // Score each newsletter
  const scoredNewsletters = NEWSLETTER_DATABASE.map(newsletter => {
    let score = 0;

    for (const niche of newsletter.niche) {
      for (const websiteNiche of websiteNiches) {
        if (niche.includes(websiteNiche) || websiteNiche.includes(niche)) {
          score += 1;
        }
      }
    }

    // Boost for sponsored options (easier to get featured)
    if (newsletter.sponsored) {
      score += 0.5;
    }

    // Subscriber count factor (prefer larger reach)
    score += Math.log10(newsletter.subscribers) / 10;

    return { ...newsletter, score };
  });

  // Sort by score and return top matches
  return scoredNewsletters
    .filter(n => n.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);
}

/**
 * Generate a personalized pitch for a newsletter
 */
export async function generateNewsletterPitch(website, newsletter) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `
Write a short, personalized pitch email to ${newsletter.name} newsletter.

Newsletter info:
- Name: ${newsletter.name}
- URL: ${newsletter.url}
- Audience: ${newsletter.niche.join(', ')}
- Subscribers: ${newsletter.subscribers.toLocaleString()}

Product to pitch:
- Name: ${website.name}
- URL: ${website.url}
- Description: ${website.description_short || website.description_medium || website.tagline}
- Industry: ${website.industry || 'Technology'}
- What makes it unique: ${website.description_medium || website.description_short}

The pitch should:
- Be under 150 words
- Have a catchy subject line
- Explain why their readers would care
- Include a specific hook or angle relevant to their audience
- Not be salesy or pushy
- Mention you're happy to provide exclusive access/discount for their readers
- Sound personal, not templated

Return the email in this format:
SUBJECT: [subject line]

[email body]
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse subject and body
    const subjectMatch = text.match(/SUBJECT:\s*(.+?)(?:\n|$)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : `${website.name} - Thought your readers might find this useful`;
    const body = text.replace(/SUBJECT:\s*.+?\n/i, '').trim();

    return { subject, body };
  } catch (error) {
    console.error('Error generating pitch:', error);
    throw error;
  }
}

/**
 * Create newsletter outreach campaign for a website
 */
export async function createNewsletterCampaign(websiteId) {
  // Get website
  const { data: website, error: websiteError } = await supabase
    .from('websites')
    .select('*')
    .eq('id', websiteId)
    .single();

  if (websiteError || !website) {
    throw new Error('Website not found');
  }

  // Find relevant newsletters
  const newsletters = findRelevantNewsletters(website);

  if (newsletters.length === 0) {
    return { success: false, message: 'No relevant newsletters found for this website' };
  }

  const outreachRecords = [];

  for (const newsletter of newsletters) {
    // Generate personalized pitch
    const pitch = await generateNewsletterPitch(website, newsletter);

    outreachRecords.push({
      website_id: websiteId,
      newsletter_name: newsletter.name,
      newsletter_url: newsletter.url,
      contact_email: newsletter.contact,
      subscribers_count: newsletter.subscribers,
      pitch_subject: pitch.subject,
      pitch_draft: pitch.body,
      status: newsletter.contact ? 'draft' : 'no_contact',
      is_sponsored: newsletter.sponsored
    });
  }

  // Insert all outreach records
  const { data, error } = await supabase
    .from('newsletter_outreach')
    .insert(outreachRecords)
    .select();

  if (error) throw error;

  return {
    success: true,
    newsletters: data.length,
    withContact: outreachRecords.filter(r => r.contact_email).length
  };
}

/**
 * Get newsletter outreach for a user/website
 */
export async function getNewsletterOutreach(websiteId) {
  const { data, error } = await supabase
    .from('newsletter_outreach')
    .select('*')
    .eq('website_id', websiteId)
    .order('subscribers_count', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Update pitch content
 */
export async function updatePitch(outreachId, userId, newSubject, newBody) {
  // Verify ownership via website
  const { data: outreach } = await supabase
    .from('newsletter_outreach')
    .select('website:websites(user_id)')
    .eq('id', outreachId)
    .single();

  if (!outreach || outreach.website?.user_id !== userId) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('newsletter_outreach')
    .update({
      pitch_subject: newSubject,
      pitch_draft: newBody,
      updated_at: new Date().toISOString()
    })
    .eq('id', outreachId);

  if (error) throw error;
  return { success: true };
}

/**
 * Mark outreach as sent
 */
export async function markOutreachSent(outreachId, userId) {
  const { data: outreach } = await supabase
    .from('newsletter_outreach')
    .select('website:websites(user_id)')
    .eq('id', outreachId)
    .single();

  if (!outreach || outreach.website?.user_id !== userId) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('newsletter_outreach')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString()
    })
    .eq('id', outreachId);

  if (error) throw error;
  return { success: true };
}

/**
 * Mark outreach as featured
 */
export async function markOutreachFeatured(outreachId, userId, featuredUrl) {
  const { data: outreach } = await supabase
    .from('newsletter_outreach')
    .select('website_id, website:websites(user_id)')
    .eq('id', outreachId)
    .single();

  if (!outreach || outreach.website?.user_id !== userId) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('newsletter_outreach')
    .update({
      status: 'featured',
      featured_url: featuredUrl
    })
    .eq('id', outreachId);

  if (error) throw error;

  // Track as backlink
  if (featuredUrl) {
    await supabase
      .from('backlinks')
      .insert({
        website_id: outreach.website_id,
        source_url: featuredUrl,
        source_domain: new URL(featuredUrl).hostname,
        target_url: '',
        link_type: 'nofollow', // Most newsletter links are nofollow
        context: 'Newsletter feature',
        is_from_submission: true
      });
  }

  return { success: true };
}

/**
 * Get all newsletters (for admin/seeding)
 */
export function getAllNewsletters() {
  return NEWSLETTER_DATABASE;
}
