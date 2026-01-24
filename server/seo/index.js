/**
 * SEO Middleware Entry Point
 *
 * Detects crawler user agents and serves pre-rendered HTML with full content.
 * Regular users receive the SPA experience unchanged.
 */

import { WebApp } from 'meteor/webapp';
import { isCrawler, getCrawlerName } from './crawlerDetection.js';
import { renderHomePage } from './templates/home.js';
import { renderAboutPage } from './templates/about.js';
import { renderFAQPage } from './templates/faq.js';
import { renderPrivacyPage } from './templates/privacy.js';
import { renderContactPage } from './templates/contact.js';
import { renderAppDetailPage } from './templates/appDetail.js';
import { renderSitemapPage } from './templates/sitemap.js';

// Import sitemap.xml endpoint
import './sitemap.js';

/**
 * Route mapping for pre-rendered pages
 * Keys are URL paths, values are render functions
 */
const staticRoutes = {
  '/': renderHomePage,
  '/about': renderAboutPage,
  '/faq': renderFAQPage,
  '/privacy': renderPrivacyPage,
  '/contact': renderContactPage,
  '/secure-payments': renderPrivacyPage, // Reuse privacy template structure
  '/sitemap': renderSitemapPage
};

/**
 * Check if a path matches a dynamic route pattern
 * @param {string} path - URL path
 * @returns {Object|null} Route match info or null
 */
function matchDynamicRoute(path) {
  // Match /apps/:slug pattern
  const appMatch = path.match(/^\/apps\/([^\/]+)\/?$/);
  if (appMatch) {
    return {
      type: 'app',
      slug: appMatch[1]
    };
  }

  return null;
}

/**
 * Render content for a given path
 * @param {string} path - URL path
 * @returns {Promise<string|null>} HTML content or null
 */
async function renderForPath(path) {
  // Check static routes first
  const staticRenderer = staticRoutes[path];
  if (staticRenderer) {
    const result = await staticRenderer();
    return result;
  }

  // Check dynamic routes
  const dynamicMatch = matchDynamicRoute(path);
  if (dynamicMatch) {
    if (dynamicMatch.type === 'app') {
      return await renderAppDetailPage(dynamicMatch.slug);
    }
  }

  return null;
}

/**
 * Main SEO middleware
 * Intercepts requests from crawlers and serves pre-rendered content
 */
WebApp.connectHandlers.use(async (req, res, next) => {
  // Skip non-GET requests
  if (req.method !== 'GET') {
    return next();
  }

  // Skip API routes, static files, and special paths
  const path = req.url.split('?')[0]; // Remove query string
  if (path.startsWith('/api') ||
      path.startsWith('/_') ||
      path.startsWith('/packages') ||
      path.startsWith('/sockjs') ||
      path.includes('.')) {
    return next();
  }

  // Check if request is from a crawler
  const userAgent = req.headers['user-agent'] || '';
  if (!isCrawler(userAgent)) {
    return next(); // Regular users get the SPA
  }

  const crawlerName = getCrawlerName(userAgent);
  console.log(`SEO: Crawler detected (${crawlerName || 'unknown'}), serving pre-rendered content for: ${path}`);

  try {
    const html = await renderForPath(path);

    if (html) {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Rendered-For': 'crawler'
      });
      res.end(html);
    } else {
      // No pre-rendered content available, fall through to SPA
      // This handles unknown routes - the SPA will show a 404 or redirect
      return next();
    }
  } catch (error) {
    console.error('SEO: Error rendering page for crawler:', error);
    return next(); // Fall back to SPA on error
  }
});

console.log('SEO middleware initialized');
