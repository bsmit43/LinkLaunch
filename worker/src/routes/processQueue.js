import { createClient } from '@supabase/supabase-js';
import { lightpanda } from '@lightpanda/browser';
import puppeteer from 'puppeteer-core';
import { getAdapter } from '../adapters/registry.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Reusable browser instance
let browserInstance = null;
let lightpandaProcess = null;

async function getBrowser() {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  // Start Lightpanda if not running
  if (!lightpandaProcess) {
    console.log('Starting Lightpanda...');
    lightpandaProcess = await lightpanda.serve({
      host: '127.0.0.1',
      port: 9222
    });

    // Give it a moment to start
    await new Promise(r => setTimeout(r, 1000));
    console.log('Lightpanda started');
  }

  // Connect via Puppeteer
  browserInstance = await puppeteer.connect({
    browserWSEndpoint: 'ws://127.0.0.1:9222'
  });

  console.log('Connected to Lightpanda');
  return browserInstance;
}

export async function processQueueRoute(request, reply) {
  // Verify cron secret
  const authHeader = request.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  console.log('Processing queue...');

  try {
    // Get next batch of pending submissions
    // Using the existing 'submissions' table with pending status
    const { data: jobs, error: fetchError } = await supabase
      .from('submissions')
      .select(`
        *,
        website:websites(*),
        directory:directories(*)
      `)
      .eq('status', 'pending')
      .lt('retry_count', 3)
      .order('created_at')
      .limit(5);

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      throw fetchError;
    }

    if (!jobs || jobs.length === 0) {
      console.log('No pending jobs');
      return { message: 'No pending jobs', processed: 0 };
    }

    console.log(`Found ${jobs.length} jobs to process`);

    const browser = await getBrowser();
    const results = [];

    for (const job of jobs) {
      const result = await processJob(browser, job);
      results.push(result);

      // Small delay between submissions to look more human
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
    }

    return {
      processed: results.length,
      results,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Process queue error:', error);
    return reply.status(500).send({ error: error.message });
  }
}

async function processJob(browser, job) {
  const { id, website, directory, retry_count } = job;

  if (!directory) {
    console.log(`Skipping job ${id}: No directory found`);
    return { id, success: false, error: 'Directory not found' };
  }

  console.log(`\nProcessing: ${directory.name}`);

  // Mark as in_progress
  await supabase
    .from('submissions')
    .update({
      status: 'in_progress',
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  let page = null;

  try {
    page = await browser.newPage();

    // Set viewport and user agent to look like a real browser
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Get adapter for this directory
    const adapterName = directory.adapter_name || 'generic';
    const adapter = getAdapter(adapterName);

    // Build content from website data
    const content = {
      tagline: website.tagline,
      short_description: website.description_short || website.tagline,
      long_description: website.description_medium || website.description_long || website.description_short
    };

    // Run submission
    const result = await adapter.submit(page, {
      website,
      directory,
      content
    });

    await page.close();
    page = null;

    if (result.success) {
      await supabase
        .from('submissions')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          listing_url: result.confirmationUrl || result.liveUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      console.log(`${directory.name}: Success`);
      return { id, directory: directory.name, success: true };
    } else {
      throw new Error(result.error || 'Submission failed');
    }

  } catch (error) {
    console.log(`${directory.name}: ${error.message}`);

    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Ignore close errors
      }
    }

    const newRetryCount = (retry_count || 0) + 1;
    const shouldRetry = newRetryCount < 3;

    // Exponential backoff: 5min, 20min, 80min
    const backoffMinutes = 5 * Math.pow(4, newRetryCount - 1);
    const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

    await supabase
      .from('submissions')
      .update({
        status: shouldRetry ? 'pending' : 'failed',
        retry_count: newRetryCount,
        error_message: error.message,
        next_retry_at: shouldRetry ? nextRetryAt.toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    return {
      id,
      directory: directory.name,
      success: false,
      error: error.message,
      willRetry: shouldRetry
    };
  }
}
