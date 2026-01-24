/**
 * Base HTML template for pre-rendered pages
 */

import { generateMetaTagsHtml } from '../metaTags.js';
import { generateJsonLdScript } from '../structuredData.js';

const DOMAIN = 'https://kokokino.com';

/**
 * Generate the base HTML document
 * @param {Object} options - Template options
 * @param {Object} options.meta - Meta tag values
 * @param {string} options.content - Main content HTML
 * @param {Array} options.schemas - JSON-LD schema objects
 * @returns {string} Complete HTML document
 */
export function renderBaseTemplate({ meta, content, schemas = [] }) {
  const metaTags = generateMetaTagsHtml(meta);
  const jsonLd = schemas.length > 0 ? generateJsonLdScript(schemas) : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${metaTags}
    ${jsonLd}
    <style>
      /* Minimal inline styles for crawler-rendered pages */
      body {
        font-family: system-ui, -apple-system, sans-serif;
        line-height: 1.6;
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
        color: #1a1a1a;
      }
      header { border-bottom: 1px solid #e0e0e0; padding-bottom: 1rem; margin-bottom: 2rem; }
      nav ul { list-style: none; padding: 0; display: flex; gap: 1.5rem; }
      nav a { color: #0066cc; text-decoration: none; }
      nav a:hover { text-decoration: underline; }
      main { min-height: 60vh; }
      footer { border-top: 1px solid #e0e0e0; padding-top: 1rem; margin-top: 2rem; color: #666; }
      h1, h2, h3 { color: #1a1a1a; }
      a { color: #0066cc; }
      article { margin-bottom: 2rem; }
      .app-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; }
      .app-card h3 { margin-top: 0; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
    </style>
</head>
<body>
    <header>
        <nav>
            <strong><a href="${DOMAIN}/">Kokokino Hub</a></strong>
            <ul>
                <li><a href="${DOMAIN}/">Home</a></li>
                <li><a href="${DOMAIN}/about">About</a></li>
                <li><a href="${DOMAIN}/faq">FAQ</a></li>
                <li><a href="${DOMAIN}/contact">Contact</a></li>
            </ul>
        </nav>
    </header>
    <main>
        ${content}
    </main>
    <footer>
        <nav>
            <ul>
                <li><a href="${DOMAIN}/contact">Contact</a></li>
                <li><a href="${DOMAIN}/about">About</a></li>
                <li><a href="${DOMAIN}/faq">FAQ</a></li>
                <li><a href="${DOMAIN}/privacy">Privacy Policy</a></li>
                <li><a href="${DOMAIN}/secure-payments">Secure Payments</a></li>
                <li><a href="${DOMAIN}/sitemap">Sitemap</a></li>
                <li><a href="https://github.com/kokokino/hub" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            </ul>
        </nav>
        <p>&copy; ${new Date().getFullYear()} Kokokino. All code is open source.</p>
    </footer>
</body>
</html>`;
}
