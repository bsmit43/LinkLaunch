/**
 * Base adapter class for directory submissions.
 * All specific directory adapters should extend this class.
 */
export class BaseAdapter {
  /**
   * Submit to a directory. Override in child classes.
   * @param {Page} page - Puppeteer page instance
   * @param {Object} data - { website, directory, content }
   * @returns {Promise<{success: boolean, confirmationUrl?: string, liveUrl?: string, error?: string}>}
   */
  async submit(page, { website, directory, content }) {
    throw new Error('Must implement submit()');
  }

  /**
   * Fill a form field with human-like typing.
   */
  async fillField(page, selector, value, options = {}) {
    if (!value || !selector) return false;

    try {
      await page.waitForSelector(selector, { timeout: 5000 });

      if (options.clear) {
        await page.click(selector, { clickCount: 3 });
        await page.keyboard.press('Backspace');
      }

      // Click the field first
      await page.click(selector);
      await this.humanDelay(100, 300);

      // Type with human-like delay
      await page.type(selector, value, {
        delay: 30 + Math.random() * 50
      });

      await this.humanDelay();
      return true;
    } catch (e) {
      console.warn(`Field not found: ${selector}`);
      return false;
    }
  }

  /**
   * Select an option from a dropdown.
   */
  async selectOption(page, selector, value) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.select(selector, value);
      await this.humanDelay();
      return true;
    } catch (e) {
      console.warn(`Select not found: ${selector}`);
      return false;
    }
  }

  /**
   * Click a button.
   */
  async clickButton(page, selector) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.click(selector);
      return true;
    } catch (e) {
      console.warn(`Button not found: ${selector}`);
      return false;
    }
  }

  /**
   * Submit a form and wait for navigation.
   */
  async submitForm(page, selector = 'button[type="submit"]') {
    await this.clickButton(page, selector);

    // Wait for navigation or network idle
    await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }),
      new Promise(r => setTimeout(r, 10000))
    ]).catch(() => { });
  }

  /**
   * Add a human-like delay.
   */
  async humanDelay(min = 100, max = 400) {
    const delay = min + Math.random() * (max - min);
    await new Promise(r => setTimeout(r, delay));
  }

  /**
   * Check if the page indicates success.
   */
  checkSuccess(url, pageContent) {
    const successIndicators = [
      'thank',
      'success',
      'confirm',
      'submitted',
      'received',
      'pending',
      'review',
      'approved',
      'complete'
    ];

    const failureIndicators = [
      'error',
      'failed',
      'invalid',
      'required',
      'missing'
    ];

    const lower = (url + ' ' + pageContent).toLowerCase();

    // Check for failure first
    const hasFailure = failureIndicators.some(word => lower.includes(word));
    if (hasFailure) {
      // But also check if success indicators are present (some pages show both)
      const hasSuccess = successIndicators.some(word => lower.includes(word));
      return hasSuccess;
    }

    return successIndicators.some(word => lower.includes(word));
  }

  /**
   * Get the appropriate value for a field name.
   */
  getFieldValue(fieldName, { website, content }) {
    const lower = fieldName.toLowerCase();

    const mapping = {
      name: website.name,
      title: website.name,
      'startup_name': website.name,
      'company': website.name,
      'company_name': website.name,
      'product_name': website.name,

      url: website.url,
      website: website.url,
      site: website.url,
      link: website.url,
      homepage: website.url,
      'website_url': website.url,

      email: website.contact_email || website.founder_email,
      contact: website.contact_email || website.founder_email,
      'contact_email': website.contact_email || website.founder_email,

      tagline: content?.tagline || website.tagline,
      slogan: content?.tagline || website.tagline,
      subtitle: content?.tagline || website.tagline,
      'short_tagline': content?.tagline || website.tagline,

      description: content?.short_description || content?.long_description || website.description_short || website.description_medium,
      'short_description': content?.short_description || website.description_short,
      'long_description': content?.long_description || website.description_medium || website.description_long,
      about: content?.long_description || website.description_medium,
      summary: content?.short_description || website.description_short,

      twitter: website.twitter_url,
      'twitter_url': website.twitter_url,
      linkedin: website.linkedin_url,
      'linkedin_url': website.linkedin_url,
      github: website.github_url,
      'github_url': website.github_url,

      industry: website.industry,
      category: website.category || website.industry,

      founder: website.founder_name,
      'founder_name': website.founder_name,
      'founder_email': website.founder_email
    };

    return mapping[lower] || null;
  }

  /**
   * Take a screenshot for debugging.
   */
  async takeScreenshot(page, name) {
    try {
      const screenshot = await page.screenshot({
        encoding: 'base64',
        fullPage: false
      });
      console.log(`Screenshot taken: ${name}`);
      return screenshot;
    } catch (e) {
      console.warn('Failed to take screenshot:', e.message);
      return null;
    }
  }
}
