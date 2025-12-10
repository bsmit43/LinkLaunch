import { BaseAdapter } from './base.js';

/**
 * Product Hunt Adapter
 *
 * Handles submissions to https://www.producthunt.com/posts/new
 * Product Hunt is a platform for discovering and sharing new products.
 *
 * Note: Product Hunt has a complex multi-step wizard and requires authentication.
 * This adapter handles the basic flow but may require manual intervention for:
 * - Media uploads (screenshots, videos)
 * - Maker verification
 * - Launch scheduling
 */
export class ProductHuntAdapter extends BaseAdapter {
  async submit(page, { website, directory, content }) {
    const submissionUrl = directory.submission_url || 'https://www.producthunt.com/posts/new';

    console.log(`  -> Navigating to ${submissionUrl}`);
    await page.goto(submissionUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await this.humanDelay(2000, 3000);

    // Check if login is required
    if (await this.needsLogin(page)) {
      return {
        success: false,
        error: 'Login required - Product Hunt requires authentication',
        needs_auth: true,
        login_url: 'https://www.producthunt.com/login'
      };
    }

    console.log('  -> Starting multi-step submission wizard');

    // Step 1: Basic Info (Name, Tagline, Link)
    const step1 = await this.fillBasicInfo(page, website, content);
    if (!step1.success) {
      return step1;
    }

    // Try to proceed to next step
    await this.clickNext(page);
    await this.humanDelay(1500, 2500);

    // Step 2: Media/Gallery (optional - skip if no media)
    await this.handleMediaStep(page, website);

    // Try to proceed
    await this.clickNext(page);
    await this.humanDelay(1500, 2500);

    // Step 3: Description and Categories
    await this.fillDetailsStep(page, website, content);

    // Try to proceed
    await this.clickNext(page);
    await this.humanDelay(1500, 2500);

    // Step 4: Makers & Launch Configuration
    await this.configureLaunchStep(page, website);

    // Final submit - may be "Schedule" or "Launch" button
    console.log('  -> Finalizing submission');
    const submitted = await this.finalSubmit(page);

    await this.humanDelay(3000, 5000);

    const url = page.url();
    const pageContent = await page.content();
    const success = this.checkProductHuntSuccess(url, pageContent);

    if (success) {
      console.log('  -> Product submitted/scheduled successfully');
    }

    return {
      success,
      confirmationUrl: url,
      liveUrl: success && url.includes('/posts/') ? url : null,
      error: success ? null : 'Product Hunt submission may require additional steps'
    };
  }

  async needsLogin(page) {
    // Check for login button/prompt
    const loginButton = await page.$('a[href*="login"], button:has-text("Log in"), button:has-text("Sign in")');
    const postForm = await page.$('form input[name="name"], input[placeholder*="product" i]');

    // If there's a submission form, we're logged in
    if (postForm) return false;

    return loginButton !== null;
  }

  async fillBasicInfo(page, website, content) {
    console.log('  -> Step 1: Basic Info');

    // Product name
    const nameField = 'input[name="name"], input[placeholder*="name" i], input[aria-label*="name" i]';
    const nameFilled = await this.fillField(page, nameField, website.name);

    if (!nameFilled) {
      return { success: false, error: 'Could not find product name field' };
    }

    // Tagline (usually required)
    const tagline = content?.tagline || website.tagline;
    if (tagline) {
      await this.fillField(
        page,
        'input[name="tagline"], input[placeholder*="tagline" i], textarea[name="tagline"]',
        tagline.substring(0, 60) // PH has a 60 char limit for taglines
      );
    }

    // Product link/URL
    await this.fillField(
      page,
      'input[name="url"], input[name="link"], input[placeholder*="link" i], input[type="url"]',
      website.url
    );

    return { success: true };
  }

  async handleMediaStep(page, website) {
    console.log('  -> Step 2: Media (skipping if no uploads needed)');

    // Check if there's a gallery URL input (some versions allow pasting URLs)
    if (website.screenshot_url) {
      const urlInput = await page.$('input[name="gallery_url"], input[placeholder*="image url" i]');
      if (urlInput) {
        await this.fillField(page, 'input[name="gallery_url"]', website.screenshot_url);
      }
    }

    // Note: Actual file uploads require more complex handling
    // For now, we skip and let user add media manually if needed
  }

  async fillDetailsStep(page, website, content) {
    console.log('  -> Step 3: Details');

    // Description
    const description = content?.long_description || website.description_medium || website.description_long;
    if (description) {
      await this.fillField(
        page,
        'textarea[name="description"], textarea[placeholder*="description" i], [contenteditable="true"]',
        description
      );
    }

    // Topics/Categories - try to select relevant ones
    await this.selectTopics(page, website);

    // Pricing info
    if (website.pricing_model) {
      await this.selectPricing(page, website.pricing_model);
    }
  }

  async selectTopics(page, website) {
    try {
      const industry = website.industry || website.category;
      if (!industry) return;

      // Look for topic selection
      const topicButton = await page.$(`button:has-text("${industry}"), label:has-text("${industry}")`);
      if (topicButton) {
        await topicButton.click();
        await this.humanDelay();
      }
    } catch (e) {
      console.warn('  -> Could not select topics:', e.message);
    }
  }

  async selectPricing(page, pricingModel) {
    try {
      const pricingOption = await page.$(`button:has-text("${pricingModel}"), label:has-text("${pricingModel}")`);
      if (pricingOption) {
        await pricingOption.click();
        await this.humanDelay();
      }
    } catch (e) {
      // Pricing selection optional
    }
  }

  async configureLaunchStep(page, website) {
    console.log('  -> Step 4: Launch Configuration');

    // Add maker info if available (Twitter handle)
    if (website.twitter_url) {
      const twitterHandle = this.extractTwitterHandle(website.twitter_url);
      if (twitterHandle) {
        await this.fillField(
          page,
          'input[name="maker_twitter"], input[placeholder*="twitter" i]',
          twitterHandle
        );
      }
    }

    // Note: Launch date/time selection is complex and usually best done manually
  }

  async clickNext(page) {
    try {
      // Try various next/continue button selectors
      const nextButton = await page.$(
        'button:has-text("Next"), button:has-text("Continue"), ' +
        'button[type="submit"]:not(:has-text("Launch")):not(:has-text("Schedule"))'
      );

      if (nextButton) {
        await nextButton.click();
        await this.humanDelay(1000, 2000);
        return true;
      }
    } catch (e) {
      console.warn('  -> No next button found');
    }
    return false;
  }

  async finalSubmit(page) {
    try {
      // Look for final submit buttons
      const submitButton = await page.$(
        'button:has-text("Schedule"), button:has-text("Launch"), ' +
        'button:has-text("Submit"), button:has-text("Post")'
      );

      if (submitButton) {
        await submitButton.click();
        return true;
      }
    } catch (e) {
      console.warn('  -> Could not find submit button:', e.message);
    }
    return false;
  }

  extractTwitterHandle(twitterUrl) {
    if (!twitterUrl) return null;

    const match = twitterUrl.match(/(?:twitter\.com|x\.com)\/([^/?]+)/);
    if (match) return `@${match[1]}`;

    if (twitterUrl.startsWith('@')) return twitterUrl;
    return `@${twitterUrl}`;
  }

  checkProductHuntSuccess(url, pageContent) {
    const lower = (url + ' ' + pageContent).toLowerCase();

    // Success indicators
    if (url.includes('/posts/') && !url.includes('/new')) return true;
    if (lower.includes('scheduled')) return true;
    if (lower.includes('launching')) return true;
    if (lower.includes('congratulations')) return true;
    if (lower.includes('your product')) return true;

    return this.checkSuccess(url, pageContent);
  }
}
