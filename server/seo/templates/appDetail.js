/**
 * App detail page template for crawlers
 */

import { Apps } from '/lib/collections/apps';
import { Products } from '/lib/collections/products';
import { renderBaseTemplate } from './base.js';
import { getMetaTags } from '../metaTags.js';
import { generateAppSchema, generateBreadcrumbSchema } from '../structuredData.js';

const DOMAIN = 'https://kokokino.com';

/**
 * Render an individual app detail page for crawlers
 * @param {string} slug - The app slug or ID
 * @returns {Promise<string|null>} HTML content or null if app not found
 */
export async function renderAppDetailPage(slug) {
  // Find the app by slug or ID
  let app = await Apps.findOneAsync({ slug, isApproved: true, isActive: true });

  if (!app) {
    // Try finding by ID if slug doesn't match
    app = await Apps.findOneAsync({ _id: slug, isApproved: true, isActive: true });
  }

  if (!app) {
    return null;
  }

  // Get associated product
  const product = app.productId
    ? await Products.findOneAsync({ _id: app.productId })
    : null;

  const productName = product ? product.name : 'Kokokino Subscription';

  const content = `
    <article>
      <nav aria-label="breadcrumb" style="margin-bottom: 1rem;">
        <a href="${DOMAIN}/">&larr; Back to Home</a>
      </nav>

      <h1>${escapeHtml(app.name)}</h1>

      <section>
        <h2>About This App</h2>
        <p>${escapeHtml(app.description)}</p>
      </section>

      <section>
        <h2>Details</h2>
        <dl>
          <dt><strong>Subscription Required</strong></dt>
          <dd>${escapeHtml(productName)}</dd>

          ${app.ageRating ? `
          <dt><strong>Age Rating</strong></dt>
          <dd>${escapeHtml(app.ageRating)}</dd>
          ` : ''}

          ${app.gitHubUrl ? `
          <dt><strong>Source Code</strong></dt>
          <dd><a href="${escapeHtml(app.gitHubUrl)}" target="_blank" rel="noopener noreferrer">View on GitHub</a></dd>
          ` : ''}
        </dl>
      </section>

      <section>
        <h2>How to Play</h2>
        <p>
          To play ${escapeHtml(app.name)}, you'll need an active subscription to ${escapeHtml(productName)}.
          <a href="${DOMAIN}/">Sign up or log in</a> to get started. Games run directly in your web browser,
          so you can start playing almost instantly.
        </p>
      </section>

      <aside style="margin-top: 2rem; padding: 1.5rem; background: #f8f9fa; border-radius: 8px;">
        <h3>Part of the Kokokino Ecosystem</h3>
        <p style="margin: 0;">
          ${escapeHtml(app.name)} is part of the Kokokino open-source game platform. All our code is
          publicly available, and we welcome contributions from developers of all skill levels.
          <a href="${DOMAIN}/faq">Learn more about contributing</a>.
        </p>
      </aside>
    </article>
  `;

  const appSlug = app.slug || app._id;
  const meta = getMetaTags(`/apps/${appSlug}`, { app });
  const schemas = [
    generateAppSchema(app, product),
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Apps', url: '/' },
      { name: app.name, url: `/apps/${appSlug}` }
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
