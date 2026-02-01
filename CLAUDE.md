# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Install dependencies
meteor npm install

# Run development server (port 3000)
npm run dev
# or: meteor --settings settings.development.json

# Run tests once
npm test

# Run tests in watch mode (full app)
npm run test-app

# Bundle size analysis
npm run visualize

# Create dev user (pre-verified, pre-paid) - requires meteor running
meteor shell < private/scripts/createDevUser.js
# Credentials: devuser / devuser
```

## Architecture Overview

**Hub & Spoke Model**: This is the Hub app - the central authentication, billing, and SSO provider for the Kokokino ecosystem. Spoke apps (independent Meteor applications) connect to this Hub for user auth and subscription validation.

```
Hub (kokokino.com)                    Spokes
├── User accounts                     ├── Spoke App Skeleton (port 3001)
├── Billing (Lemon Squeezy)           └── Backlog Beacon (port 3002)
├── SSO token generation (RS256 JWT)
└── REST API for spoke integration
```

**Key Directories**:
- `client/` - Mithril.js frontend, routing, subscriptions
- `server/` - Publications, methods, API endpoints, webhooks
- `server/api/` - REST API for spoke apps (SSO validation, subscription checks)
- `server/webhooks/` - Lemon Squeezy payment webhooks
- `server/migrations/` - Database migrations (quave:migrations)
- `server/seo/` - Server-side SEO rendering for crawlers (sitemap, meta tags, structured data)
- `lib/collections/` - MongoDB collections (shared between client/server)
- `imports/ui/` - Mithril components and pages
- `private/keys/` - RSA keypair for JWT signing (never committed)
- `private/scripts/` - Utility scripts (e.g., createDevUser.js)

**Authentication Flow**:
1. User logs in at Hub
2. Hub generates RS256 JWT with user info and subscriptions
3. User redirected to spoke with token
4. Spoke validates token using Hub's public key
5. Spoke creates local session

**Collections**:
- `Meteor.users` - User accounts with Lemon Squeezy subscription data
- `products` - Billable subscription products
- `apps` - Playable apps/games tied to products
- `productOwners/appOwners` - Many-to-many ownership relationships
- `spokes` - Spoke app registry
- `ssoNonces` - SSO token replay prevention
- `rateLimits` - API rate limiting tracking
- `cronLocks` - Distributed cron job locks
- `processedWebhooks` - Webhook deduplication

**Client Routing** (Mithril.js):
Routes defined in `client/main.js` - all routes render through the `App` component which selects the appropriate page based on `m.route.get()`. Use `routeLink()` helper from `imports/utils.js` for navigation links.

## Tech Stack and Conventions

**Stack**: Meteor v3, Mithril.js, Pico CSS, MongoDB, Lemon Squeezy (billing)

**Meteor v3 Requirements**:
- Must use async/await (no fibers)
- Use modern Meteor v3 API for collections, methods, publications
- Choose Meteor v3-compatible Atmosphere packages
- Never use `autopublish` or `insecure` packages

**UI Guidelines**:
- Use Mithril for components; Blaze only for accounts-ui integration
- Leverage Pico.css patterns; avoid inline styles
- Use semantic CSS class names ("warning" not "yellow")

**JavaScript Style**:
- Always use curly braces with if/else blocks
- Prefer single return statement at end of functions
- Use `const` by default, `let` when needed, avoid `var`
- One variable declaration per line
- Use full readable names ("document" not "doc", "count" not "i")

**Security First**:
- Assume spoke maintainers could be malicious
- All client-side DB writes are denied (use methods)
- Rate limit API endpoints
- Validate all user input
- Asymmetric JWT prevents spoke impersonation

## Configuration

Settings files are not committed. Copy `settings.example.json` to `settings.development.json` and configure:
- `private.MAIL_URL` - SMTP for email verification
- `private.lemonSqueezy.*` - Billing integration
- `private.spokeApiKeys` - Per-spoke API keys
- `private.spokes` - Spoke URLs and names

RSA keys for JWT signing go in `private/keys/` (or `Meteor.settings.private.jwtPrivateKey`).

## Code Patterns

### Meteor Methods
```javascript
Meteor.methods({
  async 'collection.action'(param) {
    check(param, String);                                    // Always validate input
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const data = await Collection.findOneAsync(query);       // Use async methods
    if (!data) {
      throw new Meteor.Error('not-found', 'Resource not found');
    }
    return result;                                           // Single return at end
  }
});
```

### Publications
```javascript
Meteor.publish('dataName', function() {
  if (!this.userId) return this.ready();                     // Auth check
  return Collection.find(query, {
    fields: { sensitiveField: 0 }                            // Always use field projection
  });
});
```

### Mithril Components
```javascript
const Component = {
  oninit(vnode) {
    this.handle = Meteor.subscribe('data');                  // Subscribe
    this.computation = Tracker.autorun(() => {               // Reactive tracking
      this.data = Collection.findOne();
      m.redraw();                                            // Trigger re-render
    });
  },
  onremove() {
    if (this.computation) this.computation.stop();           // Always cleanup
    if (this.handle) this.handle.stop();
  },
  view(vnode) {
    return m('div', this.data?.name);
  }
};
```

### Collections (lib/collections/)
```javascript
export const Items = new Mongo.Collection('items');
Items.deny({                                                 // Block all client writes
  insert: () => true,
  update: () => true,
  remove: () => true
});
```

### REST API Endpoints (server/api/)
```javascript
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

WebApp.connectHandlers.use(async (req, res, next) => {
  if (!req.url.startsWith('/api/')) return next();
  // CORS, auth middleware, then route handling
  sendJson(res, 200, { success: true });
});
```

### Webhook Idempotency
Webhooks use unique index on `webhookKey` (eventType + objectId + timestamp). Insert attempt catches duplicate key error (code 11000) to skip already-processed webhooks.

### Migrations (server/migrations/)
```javascript
Migrations.add({
  version: 1,
  name: 'Description',
  up: async function() {
    const existing = await Collection.findOneAsync(query);   // Idempotency check
    if (existing) return;
    await Collection.insertAsync(data);
  },
  down: async function() { /* rollback */ }
});
```

### SEO (server/seo/)
Crawler detection via user-agent patterns. Pre-renders HTML with meta tags, OpenGraph, and JSON-LD structured data for search engines. Non-crawlers get the SPA.

### Utility Helpers (imports/utils.js)
- `isVerifiedUser(user)` - Check email verification status
- `routeLink(path)` - Mithril link attrs that use client-side routing
