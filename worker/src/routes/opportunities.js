/**
 * Opportunities Routes
 * Handles HARO, Newsletters, Community, and Reviews
 */

import { createClient } from '@supabase/supabase-js';
import {
  processHAROQueries,
  parseHAROEmail,
  getHAROOpportunities,
  submitHAROPitch,
  markHAROPublished,
  generateHAROResponse
} from '../services/haro.js';
import {
  createNewsletterCampaign,
  getNewsletterOutreach,
  updatePitch,
  markOutreachSent,
  markOutreachFeatured,
  getAllNewsletters
} from '../services/newsletters.js';
import {
  findOpportunities,
  getOpportunities,
  updateOpportunityStatus,
  regenerateResponse
} from '../services/community.js';
import {
  createReviewSequence,
  getReviewStats,
  trackReviewSubmitted,
  getAllReviewPlatforms
} from '../services/reviews.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ==================== HARO Routes ====================

/**
 * POST /haro/process - Process HARO emails
 */
export async function processHARORoute(request, reply) {
  const authHeader = request.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  try {
    const { emailContent, source = 'haro' } = request.body;

    if (!emailContent) {
      return reply.status(400).send({ error: 'emailContent required' });
    }

    // Parse email into queries
    const queries = parseHAROEmail(emailContent, source);

    if (queries.length === 0) {
      return { message: 'No valid queries found', processed: 0 };
    }

    // Process and match queries
    const results = await processHAROQueries(queries);

    return {
      success: true,
      queries_found: queries.length,
      matches: results.length,
      results
    };

  } catch (error) {
    console.error('HARO processing error:', error);
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * GET /haro/:userId - Get HARO opportunities for a user
 */
export async function getHARORoute(request, reply) {
  try {
    const { userId } = request.params;
    const opportunities = await getHAROOpportunities(userId);
    return { opportunities };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * POST /haro/:pitchId/submit - Mark pitch as sent
 */
export async function submitHARORoute(request, reply) {
  try {
    const { pitchId } = request.params;
    const { userId } = request.body;

    await submitHAROPitch(pitchId, userId);
    return { success: true };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * POST /haro/:pitchId/published - Mark pitch as published
 */
export async function publishedHARORoute(request, reply) {
  try {
    const { pitchId } = request.params;
    const { userId, publishedUrl } = request.body;

    await markHAROPublished(pitchId, userId, publishedUrl);
    return { success: true };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

// ==================== Newsletter Routes ====================

/**
 * POST /newsletters/campaign - Create newsletter outreach campaign
 */
export async function createNewsletterCampaignRoute(request, reply) {
  try {
    const { websiteId } = request.body;

    if (!websiteId) {
      return reply.status(400).send({ error: 'websiteId required' });
    }

    const result = await createNewsletterCampaign(websiteId);
    return result;
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * GET /newsletters/:websiteId - Get newsletter outreach for website
 */
export async function getNewslettersRoute(request, reply) {
  try {
    const { websiteId } = request.params;
    const outreach = await getNewsletterOutreach(websiteId);
    return { outreach };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * PUT /newsletters/:outreachId - Update pitch
 */
export async function updateNewsletterPitchRoute(request, reply) {
  try {
    const { outreachId } = request.params;
    const { userId, subject, body } = request.body;

    await updatePitch(outreachId, userId, subject, body);
    return { success: true };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * POST /newsletters/:outreachId/sent - Mark as sent
 */
export async function markNewsletterSentRoute(request, reply) {
  try {
    const { outreachId } = request.params;
    const { userId } = request.body;

    await markOutreachSent(outreachId, userId);
    return { success: true };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * POST /newsletters/:outreachId/featured - Mark as featured
 */
export async function markNewsletterFeaturedRoute(request, reply) {
  try {
    const { outreachId } = request.params;
    const { userId, featuredUrl } = request.body;

    await markOutreachFeatured(outreachId, userId, featuredUrl);
    return { success: true };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * GET /newsletters/database - Get all newsletters in database
 */
export async function getNewsletterDatabaseRoute(request, reply) {
  return { newsletters: getAllNewsletters() };
}

// ==================== Community Routes ====================

/**
 * POST /community/find - Find community opportunities
 */
export async function findCommunityRoute(request, reply) {
  const authHeader = request.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  try {
    const { websiteId } = request.body;

    if (!websiteId) {
      return reply.status(400).send({ error: 'websiteId required' });
    }

    const result = await findOpportunities(websiteId);
    return result;
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * GET /community/:userId - Get community opportunities
 */
export async function getCommunityRoute(request, reply) {
  try {
    const { userId } = request.params;
    const { status } = request.query;

    const opportunities = await getOpportunities(userId, status || 'pending_review');
    return { opportunities };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * PUT /community/:opportunityId/status - Update opportunity status
 */
export async function updateCommunityStatusRoute(request, reply) {
  try {
    const { opportunityId } = request.params;
    const { userId, status, postedAnswer } = request.body;

    await updateOpportunityStatus(opportunityId, userId, status, postedAnswer);
    return { success: true };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * POST /community/:opportunityId/regenerate - Regenerate response
 */
export async function regenerateCommunityRoute(request, reply) {
  try {
    const { opportunityId } = request.params;
    const { userId } = request.body;

    const result = await regenerateResponse(opportunityId, userId);
    return result;
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

// ==================== Reviews Routes ====================

/**
 * POST /reviews/sequence - Create review sequence
 */
export async function createReviewSequenceRoute(request, reply) {
  try {
    const { websiteId, customer } = request.body;

    if (!websiteId || !customer?.email) {
      return reply.status(400).send({ error: 'websiteId and customer.email required' });
    }

    const result = await createReviewSequence(websiteId, customer);
    return result;
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * GET /reviews/:websiteId/stats - Get review stats
 */
export async function getReviewStatsRoute(request, reply) {
  try {
    const { websiteId } = request.params;
    const stats = await getReviewStats(websiteId);
    return { stats };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * POST /reviews/track - Track a review submission
 */
export async function trackReviewRoute(request, reply) {
  try {
    const { websiteId, platformId, reviewUrl, rating } = request.body;

    if (!websiteId || !platformId) {
      return reply.status(400).send({ error: 'websiteId and platformId required' });
    }

    const result = await trackReviewSubmitted(websiteId, platformId, reviewUrl, rating);
    return { success: true, review: result };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * GET /reviews/platforms - Get all review platforms
 */
export async function getReviewPlatformsRoute(request, reply) {
  return { platforms: getAllReviewPlatforms() };
}
