import { GoogleGenerativeAI } from '@google/generative-ai';

// Support both GEMINI_API_KEY and GOOGLE_AI_API_KEY for flexibility
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Use AI to detect form field selectors when pattern matching fails.
 * Extracts form HTML from the page and asks Gemini to identify field selectors.
 *
 * @param {object} page - Puppeteer page object
 * @param {object} options - Website and directory info
 * @returns {Promise<{success: boolean, fields?: object, error?: string}>}
 */
export async function detectFormFieldsWithAI(page, { website, directory }) {
  if (!genAI) {
    return { success: false, error: 'AI detection unavailable: No API key configured' };
  }

  try {
    // 1. Extract form HTML (limit size to avoid token limits)
    const formData = await page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      const inputs = document.querySelectorAll('input, textarea, select');

      // Get form HTML or all inputs if no form tag
      let html = '';
      if (forms.length > 0) {
        html = Array.from(forms).map(f => f.outerHTML).join('\n');
      } else {
        html = Array.from(inputs).map(i => i.outerHTML).join('\n');
      }

      // Truncate if too long (keep under ~15K chars for token limits)
      return html.substring(0, 15000);
    });

    if (!formData || formData.length < 50) {
      return { success: false, error: 'No form elements found on page' };
    }

    // 2. Build prompt
    const prompt = `Analyze this HTML form and return CSS selectors for filling a website/startup submission form.

Website to submit:
- Name: ${website.name}
- URL: ${website.url}
- Email: ${website.contact_email || website.founder_email || ''}
- Tagline: ${website.tagline || ''}
- Description: ${website.description_short || ''}

Form HTML:
${formData}

Return ONLY a JSON object mapping field types to their CSS selectors. Only include fields you actually find in the HTML:
{
  "name": "input#company-name",
  "url": "input[name='website']",
  "email": "input[type='email']",
  "tagline": "input[name='tagline']",
  "description": "textarea.description",
  "submit": "button[type='submit']"
}

Rules:
- Use the most specific CSS selector possible (prefer id > name > class > type)
- Only include fields that actually exist in the HTML above
- Map common variations: "company", "startup", "product" → name; "website", "link", "homepage" → url
- For submit, find the submit button or input[type='submit']
- Return empty object {} if no matching fields found
- Do NOT include any explanation, only the JSON object`;

    // 3. Call Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('  -> AI returned non-JSON response');
      return { success: false, error: 'AI returned invalid format' };
    }

    const fields = JSON.parse(jsonMatch[0]);

    // Filter out submit button from field count
    const fieldCount = Object.keys(fields).filter(k => k !== 'submit').length;

    if (fieldCount === 0) {
      return { success: false, error: 'AI could not identify any form fields' };
    }

    console.log(`  -> AI detected ${fieldCount} fields: ${Object.keys(fields).filter(k => k !== 'submit').join(', ')}`);
    return { success: true, fields };

  } catch (error) {
    console.error('AI detection error:', error.message);
    return { success: false, error: `AI error: ${error.message}` };
  }
}

/**
 * Fill form fields using AI-detected selectors.
 *
 * @param {object} page - Puppeteer page object
 * @param {object} fields - Map of field type to CSS selector
 * @param {object} options - Website and content data
 * @returns {Promise<number>} Number of fields successfully filled
 */
export async function fillWithAISelectors(page, fields, { website, content }) {
  const fieldValues = {
    name: website.name,
    url: website.url,
    email: website.contact_email || website.founder_email,
    tagline: website.tagline,
    description: content?.long_description || content?.short_description || website.description_short || website.tagline
  };

  let filled = 0;

  for (const [fieldType, selector] of Object.entries(fields)) {
    if (fieldType === 'submit') continue; // Skip submit button

    const value = fieldValues[fieldType];
    if (!value) {
      console.log(`    Skipping ${fieldType}: no value available`);
      continue;
    }

    try {
      const element = await page.$(selector);
      if (!element) {
        console.log(`    AI selector not found: ${selector}`);
        continue;
      }

      // Check if element is visible
      const isVisible = await element.isIntersectingViewport().catch(() => true);
      if (!isVisible) {
        console.log(`    AI selector not visible: ${selector}`);
        continue;
      }

      // Clear existing value and type new one
      await element.click();
      await element.evaluate(el => {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.value = '';
        }
      });
      await element.type(value, { delay: 30 });

      filled++;
      console.log(`    AI filled ${fieldType}: ${selector}`);
    } catch (e) {
      console.log(`    AI selector failed (${fieldType}): ${e.message}`);
    }
  }

  return filled;
}
