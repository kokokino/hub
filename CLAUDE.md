# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Install dependencies
meteor npm install

# Run development server (port 3000)
meteor --settings settings.development.json

# Run tests once
meteor test --once --driver-package meteortesting:mocha

# Run tests in watch mode
TEST_WATCH=1 meteor test --full-app --driver-package meteortesting:mocha

# Bundle size analysis
meteor --production --extra-packages bundle-visualizer
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
- `lib/collections/` - MongoDB collections (shared between client/server)
- `imports/ui/` - Mithril components and pages
- `private/keys/` - RSA keypair for JWT signing (never committed)

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
