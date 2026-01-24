/**
 * Crawler detection utilities
 * Detects search engine bots and social media crawlers
 */

// List of known crawler user agent patterns
const CRAWLER_PATTERNS = [
  // Search engines
  /googlebot/i,
  /bingbot/i,
  /slurp/i,           // Yahoo
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /sogou/i,
  /exabot/i,
  /ia_archiver/i,     // Alexa

  // Social media
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /pinterest/i,
  /slackbot/i,
  /whatsapp/i,
  /telegrambot/i,
  /discordbot/i,

  // SEO tools
  /semrushbot/i,
  /ahrefsbot/i,
  /mj12bot/i,
  /dotbot/i,

  // Generic bot patterns
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i
];

// More specific patterns to avoid false positives
const STRICT_CRAWLER_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /slackbot/i,
  /whatsapp/i,
  /telegrambot/i,
  /discordbot/i
];

/**
 * Check if a user agent string belongs to a crawler
 * @param {string} userAgent - The user agent string from request headers
 * @param {boolean} strict - Use strict matching (fewer false positives)
 * @returns {boolean} True if the user agent is a known crawler
 */
export function isCrawler(userAgent, strict = false) {
  if (!userAgent) {
    return false;
  }

  const patterns = strict ? STRICT_CRAWLER_PATTERNS : CRAWLER_PATTERNS;

  return patterns.some(pattern => pattern.test(userAgent));
}

/**
 * Get the name of the detected crawler
 * @param {string} userAgent - The user agent string
 * @returns {string|null} The crawler name or null if not detected
 */
export function getCrawlerName(userAgent) {
  if (!userAgent) {
    return null;
  }

  const crawlerNames = {
    googlebot: /googlebot/i,
    bingbot: /bingbot/i,
    yahoo: /slurp/i,
    duckduckbot: /duckduckbot/i,
    baidu: /baiduspider/i,
    yandex: /yandexbot/i,
    facebook: /facebookexternalhit/i,
    twitter: /twitterbot/i,
    linkedin: /linkedinbot/i,
    slack: /slackbot/i,
    whatsapp: /whatsapp/i,
    telegram: /telegrambot/i,
    discord: /discordbot/i
  };

  for (const [name, pattern] of Object.entries(crawlerNames)) {
    if (pattern.test(userAgent)) {
      return name;
    }
  }

  return null;
}
