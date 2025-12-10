import { createClient } from '@supabase/supabase-js';
import { getAdapter } from '../adapters/registry.js';
import { browserManager } from '../lib/browserManager.js';
import { classifyError, ErrorCategory } from '../utils/errorClassifier.js';
import { getRetryStrategy, calculateNextRetry } from '../utils/retryStrategy.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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

    const results = [];

    for (const job of jobs) {
      // Get fresh browser for EACH job (with health check)
      let browser;
      try {
        browser = await browserManager.ensureBrowser();
      } catch (browserError) {
        console.error(`Failed to get browser for job ${job.id}:`, browserError.message);
        results.push({
          id: job.id,
          directory: job.directory?.name || 'Unknown',
          success: false,
          error: `Browser unavailable: ${browserError.message}`
        });
        continue; // Skip to next job instead of failing entire batch
      }

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

  // Build description that will be used (same logic as content below)
  const descriptionToUse = website.description_medium || website.description_long || website.description_short || website.tagline;

  // Mark as in_progress and save what will be submitted
  await supabase
    .from('submissions')
    .update({
      status: 'in_progress',
      title_used: website.name,
      description_used: descriptionToUse,
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
          title_used: website.name,
          description_used: content.long_description || content.short_description || website.tagline,
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
        // Page may already be invalid if browser crashed
      }
    }

    // Classify the error
    const classification = classifyError(error.message, {
      hasAdapterConfig: Object.keys(directory.adapter_config || {}).length > 0,
      adapterName: directory.adapter_name
    });

    console.log(`Error category: ${classification.category}`);

    // Handle special case: already submitted
    if (classification.markAsSubmitted) {
      await supabase
        .from('submissions')
        .update({
          status: 'submitted',
          error_message: 'Detected as already submitted',
          error_category: classification.category,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      return { id, directory: directory.name, success: true, note: 'Already submitted' };
    }

    // Handle browser restart for infrastructure errors
    if (classification.requiresBrowserRestart) {
      console.log('Browser crash detected - cleaning up for next job');
      await browserManager.cleanup();
    }

    // Get retry strategy based on error category
    const infrastructureRetries = job.infrastructure_retries || 0;
    const strategy = getRetryStrategy(
      classification.category,
      retry_count || 0,
      infrastructureRetries
    );

    // Calculate updates
    const updates = {
      error_message: error.message,
      error_category: classification.category,
      updated_at: new Date().toISOString()
    };

    if (strategy.shouldRetry) {
      updates.status = 'pending';
      if (strategy.incrementRetryCount) {
        updates.retry_count = (retry_count || 0) + 1;
      }
      if (strategy.incrementInfraRetries) {
        updates.infrastructure_retries = infrastructureRetries + 1;
      }
      if (!strategy.immediateRetry && strategy.delayMinutes > 0) {
        updates.next_retry_at = calculateNextRetry(strategy.delayMinutes).toISOString();
      }
    } else {
      updates.status = strategy.status || 'failed';
      updates.next_retry_at = null;
    }

    await supabase
      .from('submissions')
      .update(updates)
      .eq('id', id);

    return {
      id,
      directory: directory.name,
      success: false,
      error: error.message,
      errorCategory: classification.category,
      willRetry: strategy.shouldRetry,
      nextRetryAt: updates.next_retry_at
    };
  }
}
