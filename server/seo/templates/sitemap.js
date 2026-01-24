/**
 * Sitemap page template for crawlers (user-friendly HTML version)
 */

import { Apps } from '/lib/collections/apps';
import { renderBaseTemplate } from './base.js';
import { getMetaTags } from '../metaTags.js';
import { generateBreadcrumbSchema } from '../structuredData.js';

const DOMAIN = 'https://kokokino.com';

/**
 * Render the sitemap page for crawlers
 * @returns {Promise<string>} HTML content
 */
export async function renderSitemapPage() {
  // Fetch apps from database
  const apps = await Apps.find({
    isApproved: true,
    isActive: true
  }).fetchAsync();

  const appLinks = apps.map(app => {
    const slug = app.slug || app._id;
    return `<li><a href="${DOMAIN}/apps/${slug}">${escapeHtml(app.name)}</a></li>`;
  }).join('\n            ');

  const content = `
    <article>
      <h1>Sitemap</h1>
      <p>Browse all pages and apps available on Kokokino.</p>

      <section>
        <h2>Main Pages</h2>
        <ul>
          <li><a href="${DOMAIN}/">Home</a></li>
          <li><a href="${DOMAIN}/about">About Kokokino</a></li>
          <li><a href="${DOMAIN}/faq">Frequently Asked Questions</a></li>
          <li><a href="${DOMAIN}/contact">Contact Us</a></li>
          <li><a href="${DOMAIN}/privacy">Privacy Policy</a></li>
          <li><a href="${DOMAIN}/secure-payments">Secure Payments</a></li>
        </ul>
      </section>

      <section>
        <h2>Apps & Games</h2>
        <ul>
          ${appLinks || '<li>No apps available yet.</li>'}
        </ul>
      </section>

      <section>
        <h2>Resources</h2>
        <ul>
          <li><a href="https://github.com/kokokino/hub" target="_blank" rel="noopener noreferrer">Hub Source Code (GitHub)</a></li>
          <li><a href="https://github.com/kokokino/spoke_app_skeleton" target="_blank" rel="noopener noreferrer">Spoke App Skeleton (GitHub)</a></li>
          <li><a href="${DOMAIN}/sitemap.xml">XML Sitemap</a></li>
        </ul>
      </section>
    </article>
  `;

  const meta = getMetaTags('/sitemap');
  const schemas = [
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Sitemap', url: '/sitemap' }
    ])
  ];

  return renderBaseTemplate({ meta, content, schemas });
}

/**
 * Escape HTML entities
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
