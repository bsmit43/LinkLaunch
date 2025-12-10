/**
 * Content Syndication Routes
 */

import { syndicateContent, createSyndicationBatch } from '../services/syndication.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * POST /syndicate - Create syndication batch for an article
 */
export async function createSyndicationRoute(request, reply) {
  const authHeader = request.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  try {
    const { websiteId, articleTitle, articleContent, articleUrl, platforms } = request.body;

    if (!websiteId || !articleTitle || !articleContent || !articleUrl) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }

    const result = await createSyndicationBatch(
      websiteId,
      articleTitle,
      articleContent,
      articleUrl,
      platforms || ['medium', 'devto', 'hashnode']
    );

    return { success: true, syndications: result };

  } catch (error) {
    console.error('Syndication error:', error);
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * POST /syndicate/process - Process pending syndications
 */
export async function processSyndicationRoute(request, reply) {
  const authHeader = request.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  try {
    // Get pending syndications
    const { data: pending, error: fetchError } = await supabase
      .from('content_syndications')
      .select('id')
      .eq('status', 'pending')
      .limit(5);

    if (fetchError) throw fetchError;

    if (!pending || pending.length === 0) {
      return { message: 'No pending syndications', processed: 0 };
    }

    const results = [];

    for (const syndication of pending) {
      try {
        const result = await syndicateContent(syndication.id);
        results.push({ id: syndication.id, ...result });
      } catch (error) {
        results.push({ id: syndication.id, success: false, error: error.message });
      }

      // Rate limiting between posts
      await new Promise(r => setTimeout(r, 2000));
    }

    return {
      processed: results.length,
      results
    };

  } catch (error) {
    console.error('Process syndication error:', error);
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * GET /syndications/:websiteId - Get syndication status for a website
 */
export async function getSyndicationsRoute(request, reply) {
  try {
    const { websiteId } = request.params;

    const { data, error } = await supabase
      .from('content_syndications')
      .select('*')
      .eq('website_id', websiteId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { syndications: data };

  } catch (error) {
    console.error('Get syndications error:', error);
    return reply.status(500).send({ error: error.message });
  }
}
