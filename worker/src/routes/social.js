/**
 * Social Media Scheduling Routes
 */

import {
  generateWeeklyContent,
  generateTwitterThread,
  getScheduledPosts,
  updatePostContent,
  approvePost,
  processScheduledPosts,
  getContentCalendar
} from '../services/social.js';

/**
 * POST /social/generate-weekly - Generate a week's worth of content
 */
export async function generateWeeklyRoute(request, reply) {
  try {
    const { websiteId } = request.body;

    if (!websiteId) {
      return reply.status(400).send({ error: 'websiteId required' });
    }

    const result = await generateWeeklyContent(websiteId);
    return result;
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * POST /social/generate-thread - Generate a Twitter thread from content
 */
export async function generateThreadRoute(request, reply) {
  try {
    const { websiteId, blogContent, blogUrl } = request.body;

    if (!websiteId || !blogContent || !blogUrl) {
      return reply.status(400).send({ error: 'websiteId, blogContent, and blogUrl required' });
    }

    const result = await generateTwitterThread(websiteId, blogContent, blogUrl);
    return result;
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * GET /social/:websiteId - Get scheduled posts
 */
export async function getPostsRoute(request, reply) {
  try {
    const { websiteId } = request.params;
    const { status } = request.query;

    const posts = await getScheduledPosts(websiteId, status);
    return { posts };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * GET /social/:websiteId/calendar - Get content calendar
 */
export async function getCalendarRoute(request, reply) {
  try {
    const { websiteId } = request.params;
    const { startDate, endDate } = request.query;

    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const calendar = await getContentCalendar(websiteId, start, end);
    return { calendar };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * PUT /social/:postId - Update post content
 */
export async function updatePostRoute(request, reply) {
  try {
    const { postId } = request.params;
    const { userId, content } = request.body;

    await updatePostContent(postId, userId, content);
    return { success: true };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * POST /social/:postId/approve - Approve and schedule post
 */
export async function approvePostRoute(request, reply) {
  try {
    const { postId } = request.params;
    const { userId, scheduledAt } = request.body;

    await approvePost(postId, userId, scheduledAt);
    return { success: true };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

/**
 * POST /social/process - Process scheduled posts (cron)
 */
export async function processPostsRoute(request, reply) {
  const authHeader = request.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  try {
    const result = await processScheduledPosts();
    return result;
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}
