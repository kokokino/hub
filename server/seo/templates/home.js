/**
 * Home page template for crawlers
 */

import { Apps } from '/lib/collections/apps';
import { Products } from '/lib/collections/products';
import { renderBaseTemplate } from './base.js';
import { getMetaTags } from '../metaTags.js';
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateAppListSchema
} from '../structuredData.js';

const DOMAIN = 'https://kokokino.com';

/**
 * Render the home page for crawlers
 * @returns {Promise<string>} HTML content
 */
export async function renderHomePage() {
  // Fetch apps and products from database
  const apps = await Apps.find({
    isApproved: true,
    isActive: true
  }).fetchAsync();

  const products = await Products.find({
    isApproved: true,
    isActive: true
  }).fetchAsync();

  // Build products lookup
  const productsMap = {};
  products.forEach(product => {
    productsMap[product._id] = product;
  });

  // Generate app cards HTML
  const appCardsHtml = apps.map(app => {
    const product = productsMap[app.productId];
    const productName = product ? product.name : 'Unknown Product';
    const slug = app.slug || app._id;

    return `
      <article class="app-card">
        <h3><a href="${DOMAIN}/apps/${slug}">${escapeHtml(app.name)}</a></h3>
        <p>${escapeHtml(app.description)}</p>
        <footer>
          <small>
            Included in ${escapeHtml(productName)}
            ${app.gitHubUrl ? ` &middot; <a href="${escapeHtml(app.gitHubUrl)}" target="_blank" rel="noopener noreferrer">GitHub</a>` : ''}
          </small>
        </footer>
      </article>
    `;
  }).join('');

  const content = `
    <section>
      <h1>Welcome to Kokokino Hub</h1>
      <p>
        Kokokino is an open-source cooperative where creative people come together to build games
        and learn from each other. We believe in democratizing game development by making all our
        code publicly available.
      </p>
      <p>
        Subscribe to access our growing library of games and applications, or contribute your own
        creations to join the ecosystem.
      </p>
    </section>

    <section>
      <h2>Available Apps</h2>
      <div class="grid">
        ${appCardsHtml}
      </div>
    </section>

    <section>
      <h2>Getting Started</h2>
      <p>
        To play games, <a href="${DOMAIN}/">sign up</a> and subscribe to the base monthly subscription.
        Games run directly in your web browser, so you can start playing almost instantly.
      </p>
      <p>
        Want to build your own game? Check out our <a href="${DOMAIN}/faq">FAQ</a> to learn how to
        submit apps and potentially earn money from your creations.
      </p>
    </section>
  `;

  const meta = getMetaTags('/');
  const schemas = [
    generateOrganizationSchema(),
    generateWebSiteSchema(),
    generateAppListSchema(apps)
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
