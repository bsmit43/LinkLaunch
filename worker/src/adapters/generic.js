import { BaseAdapter } from './base.js';
import { detectFormFieldsWithAI, fillWithAISelectors } from '../utils/formDetectionAI.js';

/**
 * Generic adapter that attempts to auto-detect and fill form fields.
 * Falls back to AI detection when pattern matching fails.
 */
export class GenericAdapter extends BaseAdapter {
  async submit(page, { website, directory, content }) {
    const submissionUrl = directory.submission_url || directory.url;
    console.log(`  -> Navigating to ${submissionUrl}`);

    // Navigate to submission page
    await page.goto(submissionUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await this.humanDelay(1000, 2000);

    // Check if we have configured form fields
    const adapterConfig = directory.adapter_config || {};
    const formFields = adapterConfig.form_fields || {};

    if (Object.keys(formFields).length > 0) {
      // Use configured field mappings
      return await this.fillConfiguredForm(page, { website, directory, content, formFields });
    } else {
      // Try to auto-detect form fields
      return await this.autoFillForm(page, { website, directory, content });
    }
  }

  /**
   * Fill form using configured field selectors.
   */
  async fillConfiguredForm(page, { website, directory, content, formFields }) {
    console.log(`  -> Using configured form fields`);

    for (const [fieldName, selector] of Object.entries(formFields)) {
      if (fieldName === 'submit') continue;

      const value = this.getFieldValue(fieldName, { website, content });
      if (value && selector) {
        console.log(`  -> Filling ${fieldName}`);
        await this.fillField(page, selector, value);
      }
    }

    // Submit the form
    const submitSelector = formFields.submit || 'button[type="submit"]';
    console.log(`  -> Submitting form`);
    await this.submitForm(page, submitSelector);

    // Wait and check result
    await this.humanDelay(2000, 3000);

    const url = page.url();
    const pageContent = await page.content();
    const success = this.checkSuccess(url, pageContent);

    return {
      success,
      confirmationUrl: url,
      error: success ? null : 'Could not confirm submission'
    };
  }

  /**
   * Auto-detect and fill form fields.
   */
  async autoFillForm(page, { website, directory, content }) {
    console.log(`  -> Auto-detecting form fields`);

    // Common field patterns to look for
    const fieldPatterns = [
      { names: ['name', 'title', 'startup_name', 'company', 'product', 'app'], value: website.name },
      { names: ['url', 'website', 'site', 'link', 'homepage'], value: website.url },
      { names: ['email', 'contact_email', 'contact'], value: website.contact_email || website.founder_email },
      { names: ['tagline', 'slogan', 'subtitle', 'short'], value: content?.tagline || website.tagline },
      { names: ['description', 'about', 'summary', 'details', 'bio'], value: content?.short_description || website.description_short },
      { names: ['twitter'], value: website.twitter_url },
      { names: ['linkedin'], value: website.linkedin_url },
      { names: ['github'], value: website.github_url },
    ];

    let filledCount = 0;

    for (const pattern of fieldPatterns) {
      if (!pattern.value) continue;

      for (const name of pattern.names) {
        // Try various selector patterns
        const selectors = [
          `input[name="${name}"]`,
          `input[name*="${name}"]`,
          `input[id="${name}"]`,
          `input[id*="${name}"]`,
          `textarea[name="${name}"]`,
          `textarea[name*="${name}"]`,
          `textarea[id="${name}"]`,
          `textarea[id*="${name}"]`,
          `input[placeholder*="${name}" i]`,
          `textarea[placeholder*="${name}" i]`,
        ];

        for (const selector of selectors) {
          try {
            const element = await page.$(selector);
            if (element) {
              const isVisible = await element.isIntersectingViewport();
              if (isVisible) {
                await this.fillField(page, selector, pattern.value, { clear: true });
                console.log(`  -> Auto-filled: ${name}`);
                filledCount++;
                break;
              }
            }
          } catch (e) {
            // Continue trying other selectors
          }
        }
      }
    }

    // If pattern matching failed, try AI detection as fallback
    if (filledCount === 0) {
      console.log(`  -> Pattern matching failed, trying AI detection...`);

      const aiResult = await detectFormFieldsWithAI(page, { website, directory });

      if (aiResult.success) {
        // Fill using AI-detected selectors
        filledCount = await fillWithAISelectors(page, aiResult.fields, { website, content });

        if (filledCount > 0) {
          console.log(`  -> AI successfully filled ${filledCount} fields`);
        }
      }

      // If still no fields filled, return error
      if (filledCount === 0) {
        return {
          success: false,
          error: aiResult.error || 'Could not auto-detect any form fields'
        };
      }
    }

    // Try to find and click submit button
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Submit")',
      'button:has-text("Add")',
      'button:has-text("Create")',
      'button:has-text("Post")',
      'button:has-text("Send")',
      '.submit-button',
      '.btn-submit',
      '#submit',
      '[data-submit]'
    ];

    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await this.submitForm(page, selector);
          submitted = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!submitted) {
      // Try pressing Enter as last resort
      await page.keyboard.press('Enter');
      await this.humanDelay(2000, 3000);
    }

    await this.humanDelay(2000, 3000);

    const url = page.url();
    const pageContent = await page.content();
    const success = this.checkSuccess(url, pageContent);

    return {
      success,
      confirmationUrl: url,
      error: success ? null : 'Auto-detection may have failed'
    };
  }
}
