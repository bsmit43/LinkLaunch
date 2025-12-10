import { BaseAdapter } from './base.js';

/**
 * Crunchbase Adapter
 *
 * Handles submissions to https://www.crunchbase.com/add-new
 * Crunchbase is a business information database.
 *
 * Note: Requires authentication. Will return needs_auth if not logged in.
 */
export class CrunchbaseAdapter extends BaseAdapter {
  async submit(page, { website, directory, content }) {
    const submissionUrl = directory.submission_url || 'https://www.crunchbase.com/add-new';

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
        error: 'Login required - Crunchbase requires a free account',
        needs_auth: true,
        login_url: 'https://www.crunchbase.com/login'
      };
    }

    // Select entity type (Company/Organization)
    await this.selectEntityType(page);
    await this.humanDelay(1000, 1500);

    console.log('  -> Filling company information');

    // Fill company/organization name
    await this.fillField(
      page,
      'input[name="name"], input[aria-label*="name" i], input[placeholder*="organization name" i]',
      website.name
    );

    // Fill website URL
    await this.fillField(
      page,
      'input[name="website"], input[name="homepage_url"], input[aria-label*="website" i], input[type="url"]',
      website.url
    );

    // Fill short description
    const shortDesc = content?.short_description || website.description_short || website.tagline;
    if (shortDesc) {
      await this.fillField(
        page,
        'textarea[name="short_description"], textarea[aria-label*="description" i], input[name="tagline"]',
        shortDesc.substring(0, 250)
      );
    }

    // Fill long description if available
    const longDesc = content?.long_description || website.description_medium;
    if (longDesc) {
      await this.fillField(
        page,
        'textarea[name="description"], textarea[name="long_description"]',
        longDesc
      );
    }

    // Fill founder info
    if (website.founder_name) {
      await this.fillField(
        page,
        'input[name="founder"], input[name="founder_name"], input[aria-label*="founder" i]',
        website.founder_name
      );
    }

    // Fill industry/category
    await this.selectIndustry(page, website.industry || website.category);

    // Fill social links
    await this.fillSocialLinks(page, website);

    // Handle location if available
    if (website.location) {
      await this.fillField(
        page,
        'input[name="location"], input[name="headquarters"], input[aria-label*="location" i]',
        website.location
      );
    }

    console.log('  -> Submitting form');
    await this.submitForm(page, 'button[type="submit"], button:has-text("Submit"), button:has-text("Create")');

    await this.humanDelay(3000, 5000);

    // Check result
    const url = page.url();
    const pageContent = await page.content();
    const success = this.checkCrunchbaseSuccess(url, pageContent);

    if (success) {
      console.log('  -> Company profile submitted');
    }

    return {
      success,
      confirmationUrl: url,
      error: success ? null : 'Submission pending review'
    };
  }

  async needsLogin(page) {
    // Check for login/sign-up prompts
    const authPrompt = await page.$('button:has-text("Sign in"), a[href*="login"], button:has-text("Log in")');
    const addForm = await page.$('form input[name="name"], form input[aria-label*="name" i]');

    // If there's an add form, we're likely authenticated
    if (addForm) return false;

    return authPrompt !== null;
  }

  async selectEntityType(page) {
    try {
      // Look for organization/company type selector
      const companyOption = await page.$(
        'button:has-text("Company"), label:has-text("Company"), ' +
        'button:has-text("Organization"), input[value="company"]'
      );

      if (companyOption) {
        await companyOption.click();
        await this.humanDelay(500, 1000);
      }
    } catch (e) {
      console.warn('  -> Could not select entity type:', e.message);
    }
  }

  async selectIndustry(page, industry) {
    if (!industry) return;

    try {
      // Try select dropdown
      const select = await page.$('select[name="industry"], select[name="category"]');
      if (select) {
        await page.select('select[name="industry"]', industry);
        await this.humanDelay();
        return;
      }

      // Try autocomplete/search input
      const industryInput = await page.$('input[name="industry"], input[aria-label*="industry" i]');
      if (industryInput) {
        await this.fillField(page, 'input[name="industry"]', industry);
        await this.humanDelay(500, 1000);

        // Try to select from dropdown
        const suggestion = await page.$('.suggestion, [role="option"], li:has-text("' + industry + '")');
        if (suggestion) {
          await suggestion.click();
        }
      }
    } catch (e) {
      console.warn('  -> Could not set industry:', e.message);
    }
  }

  async fillSocialLinks(page, website) {
    // LinkedIn
    if (website.linkedin_url) {
      await this.fillField(
        page,
        'input[name="linkedin"], input[name="linkedin_url"], input[placeholder*="linkedin" i]',
        website.linkedin_url
      );
    }

    // Twitter
    if (website.twitter_url) {
      await this.fillField(
        page,
        'input[name="twitter"], input[name="twitter_url"], input[placeholder*="twitter" i]',
        website.twitter_url
      );
    }

    // GitHub
    if (website.github_url) {
      await this.fillField(
        page,
        'input[name="github"], input[name="github_url"], input[placeholder*="github" i]',
        website.github_url
      );
    }
  }

  checkCrunchbaseSuccess(url, pageContent) {
    const lower = (url + ' ' + pageContent).toLowerCase();

    // Success indicators
    if (url.includes('/organization/')) return true;
    if (lower.includes('successfully')) return true;
    if (lower.includes('thank you')) return true;
    if (lower.includes('submitted')) return true;
    if (lower.includes('pending review')) return true;

    return this.checkSuccess(url, pageContent);
  }
}
