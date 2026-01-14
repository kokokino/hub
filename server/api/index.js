import { WebApp } from 'meteor/webapp';
import { apiKeyMiddleware, rateLimitMiddleware, parseJsonBody } from './middleware.js';
import { handlePublicKey } from './sso.js';
import { handleValidateToken, handleCheckSubscription, handleUserInfo } from './spoke.js';

// Helper to send JSON responses
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Main API router
WebApp.connectHandlers.use(async (req, res, next) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  // Only handle /api routes
  if (!path.startsWith('/api')) {
    return next();
  }

  // CORS headers for API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // Public endpoints (no auth required)
    if (path === '/api/public-key' && method === 'GET') {
      const result = await handlePublicKey();
      sendJson(res, 200, result);
      return;
    }

    // Spoke-authenticated endpoints
    if (path.startsWith('/api/spoke/')) {
      // Check API key
      const authResult = await apiKeyMiddleware(req);
      if (!authResult.authorized) {
        sendJson(res, 401, { error: 'unauthorized', message: authResult.message });
        return;
      }

      // Check rate limit
      const rateLimitResult = await rateLimitMiddleware(authResult.spokeId);
      if (!rateLimitResult.allowed) {
        res.setHeader('Retry-After', rateLimitResult.retryAfter);
        sendJson(res, 429, { 
          error: 'rate_limited', 
          message: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter
        });
        return;
      }

      // Parse JSON body for POST requests
      let body = {};
      if (method === 'POST') {
        body = await parseJsonBody(req);
      }

      // Route to appropriate handler
      if (path === '/api/spoke/validate-token' && method === 'POST') {
        const result = await handleValidateToken(body, authResult.spokeId);
        sendJson(res, result.valid ? 200 : 400, result);
        return;
      }

      if (path === '/api/spoke/check-subscription' && method === 'POST') {
        const result = await handleCheckSubscription(body);
        sendJson(res, 200, result);
        return;
      }

      if (path === '/api/spoke/user-info' && method === 'POST') {
        const result = await handleUserInfo(body);
        if (result.error) {
          sendJson(res, 404, result);
          return;
        }
        sendJson(res, 200, result);
        return;
      }

      // Unknown spoke endpoint
      sendJson(res, 404, { error: 'not_found', message: 'Endpoint not found' });
      return;
    }

    // Unknown API endpoint
    sendJson(res, 404, { error: 'not_found', message: 'API endpoint not found' });

  } catch (error) {
    console.error('API Error:', error);
    sendJson(res, 500, { error: 'internal_error', message: 'An unexpected error occurred' });
  }
});

console.log('Hub API routes initialized');
