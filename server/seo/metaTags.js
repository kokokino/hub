/**
 * Meta tag definitions for SEO
 */

const DOMAIN = 'https://kokokino.com';

/**
 * Default meta tags for all pages
 */
const defaultMeta = {
  siteName: 'Kokokino',
  locale: 'en_US',
  type: 'website'
};

/**
 * Meta tags per route
 */
const routeMeta = {
  '/': {
    title: 'Kokokino Hub - Open Source Game Platform & Ecosystem',
    description: 'Kokokino is an open-source cooperative where creative people build games and learn from each other. Subscribe to access games, or contribute code to join our ecosystem.',
    keywords: 'open source games, game development, web games, game platform, indie games, cooperative gaming'
  },
  '/about': {
    title: 'About Kokokino - Our Mission & Technology Stack',
    description: 'Learn about Kokokino, an open-source cooperative for game developers. We use Meteor JS, Mithril, Pico CSS, and Babylon JS to create accessible, collaborative games.',
    keywords: 'about kokokino, game development cooperative, open source game development, meteor js games'
  },
  '/faq': {
    title: 'Kokokino FAQ - Getting Started, Submitting Games, Monetization',
    description: 'Frequently asked questions about Kokokino. Learn how to play games, submit your own apps, monetize your work, and what technologies are supported.',
    keywords: 'kokokino faq, how to submit games, game monetization, web game development'
  },
  '/contact': {
    title: 'Contact Kokokino - Get In Touch',
    description: 'Have questions about Kokokino? Contact us via email at info@kokokino.com or call us. We typically respond within 24 hours.',
    keywords: 'contact kokokino, kokokino support, kokokino email'
  },
  '/privacy': {
    title: 'Privacy Policy - Kokokino',
    description: 'Kokokino privacy policy. We collect minimal personal data and never sell your information. Learn about your data rights and our security practices.',
    keywords: 'kokokino privacy, data protection, privacy policy'
  },
  '/secure-payments': {
    title: 'Secure Payments - Kokokino',
    description: 'Kokokino uses Lemon Squeezy for secure payment processing. PCI DSS Level 1 compliant. Your payment information is always protected.',
    keywords: 'kokokino payments, secure checkout, lemon squeezy'
  },
  '/sitemap': {
    title: 'Sitemap - Kokokino',
    description: 'Browse all pages and apps available on Kokokino. Find games, documentation, and resources.',
    keywords: 'kokokino sitemap, all pages, app directory'
  }
};

/**
 * Get meta tags for a specific route
 * @param {string} path - The URL path
 * @param {Object} data - Optional dynamic data (e.g., app details)
 * @returns {Object} Meta tag values
 */
export function getMetaTags(path, data = {}) {
  // Check for app detail pages
  if (path.startsWith('/apps/')) {
    if (data.app) {
      return {
        ...defaultMeta,
        title: `${data.app.name} - Kokokino`,
        description: data.app.description || `Play ${data.app.name} on Kokokino, the open source game platform.`,
        keywords: `${data.app.name}, kokokino game, web game, ${data.app.ageRating || ''} rated`,
        url: `${DOMAIN}${path}`,
        type: 'article'
      };
    }
    return {
      ...defaultMeta,
      title: 'App - Kokokino',
      description: 'Discover games and apps on Kokokino, the open source game platform.',
      url: `${DOMAIN}${path}`
    };
  }

  const meta = routeMeta[path] || routeMeta['/'];

  return {
    ...defaultMeta,
    ...meta,
    url: `${DOMAIN}${path}`
  };
}

/**
 * Generate HTML meta tags string
 * @param {Object} meta - Meta tag values
 * @returns {string} HTML meta tags
 */
export function generateMetaTagsHtml(meta) {
  const tags = [];

  // Basic meta tags
  tags.push(`<title>${escapeHtml(meta.title)}</title>`);
  tags.push(`<meta name="description" content="${escapeHtml(meta.description)}">`);

  if (meta.keywords) {
    tags.push(`<meta name="keywords" content="${escapeHtml(meta.keywords)}">`);
  }

  // OpenGraph tags
  tags.push(`<meta property="og:title" content="${escapeHtml(meta.title)}">`);
  tags.push(`<meta property="og:description" content="${escapeHtml(meta.description)}">`);
  tags.push(`<meta property="og:url" content="${escapeHtml(meta.url)}">`);
  tags.push(`<meta property="og:type" content="${meta.type || 'website'}">`);
  tags.push(`<meta property="og:site_name" content="${escapeHtml(meta.siteName)}">`);
  tags.push(`<meta property="og:locale" content="${meta.locale}">`);

  // Twitter Card tags
  tags.push(`<meta name="twitter:card" content="summary">`);
  tags.push(`<meta name="twitter:title" content="${escapeHtml(meta.title)}">`);
  tags.push(`<meta name="twitter:description" content="${escapeHtml(meta.description)}">`);

  // Canonical URL
  tags.push(`<link rel="canonical" href="${escapeHtml(meta.url)}">`);

  return tags.join('\n    ');
}

/**
 * Escape HTML entities
 * @param {string} str - String to escape
 * @returns {string} Escaped string
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
