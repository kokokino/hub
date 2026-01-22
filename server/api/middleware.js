import { Meteor } from 'meteor/meteor';
import { RateLimits } from '/lib/collections/rateLimits';

// Rate limit configuration
const RATE_LIMIT_PER_MINUTE = 100;
const RATE_LIMIT_PER_HOUR = 1000;

// TTL for rate limit entries (1 hour in milliseconds)
const RATE_LIMIT_TTL_MS = 60 * 60 * 1000;

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
 * Checks rate limits for a spoke using MongoDB for multi-instance support
 * @param {string} spokeId - The spoke identifier
 * @returns {Object} - { allowed: boolean, retryAfter?: number }
 */
export async function rateLimitMiddleware(spokeId) {
  const now = new Date();
  const minuteAgo = new Date(now.getTime() - 60000);
  const hourAgo = new Date(now.getTime() - 3600000);

  // Count requests in last minute
  const requestsLastMinute = await RateLimits.find({
    spokeId,
    timestamp: { $gt: minuteAgo }
  }).countAsync();

  // Check minute limit
  if (requestsLastMinute >= RATE_LIMIT_PER_MINUTE) {
    return { allowed: false, retryAfter: 60 };
  }

  // Count requests in last hour
  const requestsLastHour = await RateLimits.find({
    spokeId,
    timestamp: { $gt: hourAgo }
  }).countAsync();

  // Check hour limit
  if (requestsLastHour >= RATE_LIMIT_PER_HOUR) {
    return { allowed: false, retryAfter: 3600 };
  }

  // Record this request with TTL for auto-cleanup
  const expiresAt = new Date(now.getTime() + RATE_LIMIT_TTL_MS);
  await RateLimits.insertAsync({
    spokeId,
    timestamp: now,
    expiresAt
  });

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
