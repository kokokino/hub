/**
 * Privacy Policy page template for crawlers
 */

import { renderBaseTemplate } from './base.js';
import { getMetaTags } from '../metaTags.js';
import { generateBreadcrumbSchema } from '../structuredData.js';

/**
 * Render the privacy policy page for crawlers
 * @returns {string} HTML content
 */
export function renderPrivacyPage() {
  const content = `
    <article>
      <h1>Privacy Policy</h1>
      <p>
        At Kokokino, we are committed to protecting your privacy. This short policy explains
        how we handle your personal data.
      </p>

      <section>
        <h2>Information We Collect</h2>
        <p>
          We collect minimal personal data, primarily for account management and payment processing
          (via Lemon Squeezy). This includes your email address, billing information (handled by our
          payment processor), and any information you voluntarily provide during registration or contact.
        </p>
      </section>

      <section>
        <h2>How We Use Your Information</h2>
        <p>
          Your information is used solely to provide and improve our services, process your subscriptions,
          communicate with you, and ensure the security of our platform. We do not sell or share your
          data with third parties for marketing purposes.
        </p>
      </section>

      <section>
        <h2>Data Security</h2>
        <p>
          We implement robust security measures to protect your data. All payments are securely
          processed by Lemon Squeezy, a trusted third-party payment gateway.
        </p>
      </section>

      <section>
        <h2>Your Rights</h2>
        <p>
          You have the right to access, correct, or delete your personal information. Please contact
          us at <a href="mailto:info@kokokino.com">info@kokokino.com</a> for any privacy-related concerns.
        </p>
      </section>

      <aside style="margin-top: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
        <p style="margin: 0; font-style: italic;">
          Last Updated: December 20, 2025
        </p>
      </aside>
    </article>
  `;

  const meta = getMetaTags('/privacy');
  const schemas = [
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Privacy Policy', url: '/privacy' }
    ])
  ];

  return renderBaseTemplate({ meta, content, schemas });
}
