import { BaseAdapter } from './base.js';

/**
 * BetaList Adapter
 *
 * Handles submissions to https://betalist.com/submit
 * BetaList is a startup discovery platform for beta products.
 *
 * Note: Requires authentication. Will return needs_auth if not logged in.
 */
export class BetaListAdapter extends BaseAdapter {
  async submit(page, { website, directory, content }) {
    const submissionUrl = directory.submission_url || 'https://betalist.com/submit';

    console.log(`  -> Navigating to ${submissionUrl}`);
    await page.goto(submissionUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await this.humanDelay(1000, 2000);

    // Check if login is required
    if (await this.needsLogin(page)) {
      return {
        success: false,
        error: 'Login required - BetaList requires authentication',
        needs_auth: true,
        login_url: 'https://betalist.com/users/sign_in'
      };
    }

    console.log('  -> Filling form fields');

    // Fill startup name
    await this.fillField(page, 'input[name="startup[name]"]', website.name);

    // Fill website URL
    await this.fillField(page, 'input[name="startup[url]"]', website.url);

    // Fill tagline
    const tagline = content?.tagline || website.tagline;
    if (tagline) {
      await this.fillField(page, 'input[name="startup[tagline]"]', tagline.substring(0, 140));
    }

    // Fill description
    const description = content?.short_description || website.description_short || website.description_medium;
    if (description) {
      await this.fillField(page, 'textarea[name="startup[description]"]', description);
    }

    // Fill email
    const email = website.contact_email || website.founder_email;
    if (email) {
      await this.fillField(page, 'input[name="startup[email]"]', email);
    }

    // Handle category/topic selection if present
    await this.selectCategory(page, website.category || website.industry);

    // Accept terms if checkbox exists
    await this.acceptTerms(page);

    console.log('  -> Submitting form');
    await this.submitForm(page, 'button[type="submit"], input[type="submit"]');

    await this.humanDelay(2000, 3000);

    // Check result
    const url = page.url();
    const pageContent = await page.content();
    const success = this.checkBetaListSuccess(url, pageContent);

    if (success) {
      console.log('  -> Submission successful');
    }

    return {
      success,
      confirmationUrl: url,
      error: success ? null : 'Could not confirm submission'
    };
  }

  async needsLogin(page) {
    // Check for login prompt or missing form
    const loginLink = await page.$('a[href*="sign_in"], a[href*="login"]');
    const submitForm = await page.$('form input[name*="startup"]');

    // If there's a form, we're logged in
    if (submitForm) return false;

    // If no form but login link, needs auth
    return loginLink !== null;
  }

  async selectCategory(page, category) {
    if (!category) return;

    try {
      // Try select dropdown
      const select = await page.$('select[name*="category"], select[name*="topic"]');
      if (select) {
        await page.select('select[name*="category"], select[name*="topic"]', category);
        await this.humanDelay();
      }
    } catch (e) {
      console.warn('  -> Could not select category:', e.message);
    }
  }

  async acceptTerms(page) {
    try {
      const termsCheckbox = await page.$('input[type="checkbox"][name*="terms"], input[type="checkbox"][name*="agree"]');
      if (termsCheckbox) {
        const isChecked = await page.evaluate(el => el.checked, termsCheckbox);
        if (!isChecked) {
          await termsCheckbox.click();
          await this.humanDelay();
        }
      }
    } catch (e) {
      // Terms checkbox optional
    }
  }

  checkBetaListSuccess(url, pageContent) {
    const lower = (url + ' ' + pageContent).toLowerCase();

    // BetaList success indicators
    if (url.includes('/startups/')) return true;
    if (lower.includes('thank you')) return true;
    if (lower.includes('submitted')) return true;
    if (lower.includes('pending review')) return true;
    if (lower.includes('we\'ll review')) return true;

    return this.checkSuccess(url, pageContent);
  }
}
