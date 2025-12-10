import { BaseAdapter } from './base.js';

/**
 * Indie Hackers Adapter
 *
 * Handles submissions to https://www.indiehackers.com/products/new
 * Indie Hackers is a community for indie makers and bootstrapped founders.
 *
 * Note: Requires authentication. Will return needs_auth if not logged in.
 */
export class IndieHackersAdapter extends BaseAdapter {
  async submit(page, { website, directory, content }) {
    const submissionUrl = directory.submission_url || 'https://www.indiehackers.com/products/new';

    console.log(`  -> Navigating to ${submissionUrl}`);
    await page.goto(submissionUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await this.humanDelay(1500, 2500);

    // Check if login is required
    if (await this.needsLogin(page)) {
      return {
        success: false,
        error: 'Login required - Indie Hackers requires authentication',
        needs_auth: true,
        login_url: 'https://www.indiehackers.com/sign-in'
      };
    }

    console.log('  -> Filling product form');

    // Fill product name
    await this.fillField(
      page,
      'input[name="name"], input[placeholder*="name" i], input[aria-label*="name" i]',
      website.name
    );

    // Fill tagline/short description
    const tagline = content?.tagline || website.tagline;
    if (tagline) {
      await this.fillField(
        page,
        'input[name="tagline"], input[placeholder*="tagline" i], input[placeholder*="short description" i]',
        tagline.substring(0, 160)
      );
    }

    // Fill website URL
    await this.fillField(
      page,
      'input[name="url"], input[name="website"], input[placeholder*="url" i], input[type="url"]',
      website.url
    );

    // Fill description
    const description = content?.long_description || website.description_medium || website.description_short;
    if (description) {
      await this.fillField(
        page,
        'textarea[name="description"], textarea[placeholder*="description" i]',
        description
      );
    }

    // Fill Twitter handle if present
    if (website.twitter_url) {
      const twitterHandle = this.extractTwitterHandle(website.twitter_url);
      if (twitterHandle) {
        await this.fillField(
          page,
          'input[name="twitter"], input[placeholder*="twitter" i]',
          twitterHandle
        );
      }
    }

    // Handle category/topic selection
    await this.selectCategory(page, website.category || website.industry);

    console.log('  -> Submitting form');
    await this.submitForm(page, 'button[type="submit"]:not([disabled]), button:has-text("Create"), button:has-text("Submit")');

    await this.humanDelay(3000, 5000);

    // Check result
    const url = page.url();
    const success = this.checkIndieHackersSuccess(url);

    if (success) {
      console.log('  -> Product created successfully');
    }

    return {
      success,
      confirmationUrl: url,
      liveUrl: success ? url : null,
      error: success ? null : 'Could not confirm product creation'
    };
  }

  async needsLogin(page) {
    // Check for sign-in elements
    const signInButton = await page.$('a[href*="sign-in"], button:has-text("Sign in"), a:has-text("Log in")');
    const productForm = await page.$('form input[name="name"], form input[placeholder*="name" i]');

    // If there's a product form, we're logged in
    if (productForm) return false;

    // If sign-in button visible and no form, needs auth
    return signInButton !== null;
  }

  async selectCategory(page, category) {
    if (!category) return;

    try {
      // Try dropdown/select
      const select = await page.$('select[name*="category"], select[name*="topic"]');
      if (select) {
        await page.select('select[name*="category"]', category);
        await this.humanDelay();
        return;
      }

      // Try clicking category buttons/tags
      const categoryButton = await page.$(`button:has-text("${category}"), label:has-text("${category}")`);
      if (categoryButton) {
        await categoryButton.click();
        await this.humanDelay();
      }
    } catch (e) {
      console.warn('  -> Could not select category:', e.message);
    }
  }

  extractTwitterHandle(twitterUrl) {
    if (!twitterUrl) return null;

    // Extract handle from URL or return as-is if already a handle
    const match = twitterUrl.match(/(?:twitter\.com|x\.com)\/([^/?]+)/);
    if (match) return `@${match[1]}`;

    if (twitterUrl.startsWith('@')) return twitterUrl;
    return `@${twitterUrl}`;
  }

  checkIndieHackersSuccess(url) {
    // Success if redirected to product page
    if (url.includes('/products/') && !url.includes('/new')) return true;
    if (url.includes('/product/') && !url.includes('/new')) return true;

    return false;
  }
}
