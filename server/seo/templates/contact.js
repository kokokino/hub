/**
 * Contact page template for crawlers
 */

import { renderBaseTemplate } from './base.js';
import { getMetaTags } from '../metaTags.js';
import { generateOrganizationSchema, generateBreadcrumbSchema } from '../structuredData.js';

/**
 * Render the contact page for crawlers
 * @returns {string} HTML content
 */
export function renderContactPage() {
  const content = `
    <article>
      <h1>Get In Touch</h1>
      <p>
        Have questions about Kokokino, our games, or how to join? Reach out to us directly,
        and we'll be happy to help!
      </p>

      <section>
        <h2>Email Us</h2>
        <p>
          <a href="mailto:info@kokokino.com" style="font-size: 1.2rem;">info@kokokino.com</a>
        </p>
      </section>

      <section>
        <h2>Call Us</h2>
        <p style="font-size: 1.2rem;">+1 (301) 956-2319</p>
      </section>

      <aside style="margin-top: 2rem; padding: 1.5rem; background: #f8f9fa; border-radius: 8px;">
        <p style="margin: 0;">
          We typically respond to emails within 24 hours. For urgent matters, please call during
          business hours (9 AM - 5 PM EST, Monday-Friday).
        </p>
      </aside>
    </article>
  `;

  const meta = getMetaTags('/contact');
  const schemas = [
    generateOrganizationSchema(),
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Contact', url: '/contact' }
    ])
  ];

  return renderBaseTemplate({ meta, content, schemas });
}
