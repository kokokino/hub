import { Meteor } from 'meteor/meteor';

// In-memory rate limit tracking
// In production, consider using Redis for multi-instance support
const rateLimits = new Map();

// Rate limit configuration
const RATE_LIMIT_PER_MINUTE = 100;
const RATE_LIMIT_PER_HOUR = 1000;

/**
 * Validates the spoke API key from the Authorization header
 * @param {Object} req - The HTTP request object
 * @returns {Object} - { authorized: boolean, spokeId?: string, message?: string }
 */
export async function apiKeyMiddleware(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return { authorized: false, message: 'Missing Authorization header' };
  }

  // Expect format: "Bearer <api-key>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return { authorized: false, message: 'Invalid Authorization header format' };
  }

  const apiKey = parts[1];
  
  // Get spoke API keys from settings
  const spokeApiKeys = Meteor.settings?.private?.spokeApiKeys || {};
  
  // Find which spoke this key belongs to
  for (const [spokeId, key] of Object.entries(spokeApiKeys)) {
    if (key === apiKey) {
      return { authorized: true, spokeId };
    }
  }

  return { authorized: false, message: 'Invalid API key' };
}

/**
 * Checks rate limits for a spoke
 * @param {string} spokeId - The spoke identifier
 * @returns {Object} - { allowed: boolean, retryAfter?: number }
 */
export async function rateLimitMiddleware(spokeId) {
  const now = Date.now();
  const minuteAgo = now - 60000;
  const hourAgo = now - 3600000;

  // Get or create rate limit entry for this spoke
  if (!rateLimits.has(spokeId)) {
    rateLimits.set(spokeId, { requests: [] });
  }

  const spokeLimit = rateLimits.get(spokeId);
  
  // Clean up old requests
  spokeLimit.requests = spokeLimit.requests.filter(time => time > hourAgo);

  // Count requests in last minute and hour
  const requestsLastMinute = spokeLimit.requests.filter(time => time > minuteAgo).length;
  const requestsLastHour = spokeLimit.requests.length;

  // Check limits
  if (requestsLastMinute >= RATE_LIMIT_PER_MINUTE) {
    return { allowed: false, retryAfter: 60 };
  }

  if (requestsLastHour >= RATE_LIMIT_PER_HOUR) {
    return { allowed: false, retryAfter: 3600 };
  }

  // Record this request
  spokeLimit.requests.push(now);

  return { allowed: true };
}

/**
 * Parses JSON body from request
 * @param {Object} req - The HTTP request object
 * @returns {Promise<Object>} - Parsed JSON body
 */
export function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
      // Limit body size to 1MB
      if (body.length > 1048576) {
        reject(new Error('Request body too large'));
      }
    });

    req.on('end', () => {
      try {
        if (body) {
          resolve(JSON.parse(body));
        } else {
          resolve({});
        }
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });

    req.on('error', reject);
  });
}
