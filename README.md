# Kokokino Hub

A central hub for account management, billing, and Single Sign‑On (SSO) for all Kokokino applications.

## Overview

The Hub is the central application users see when visiting [kokokino.com](https://www.kokokino.com/). It provides:

- User account management
- Billing and subscription handling via Lemon Squeezy
- Single Sign‑On (SSO) for all other Kokokino apps (Spoke apps)
- API endpoints for Spoke app integration

## Architecture

Kokokino uses a Hub & Spoke architecture:

- **Hub** (this app) - Central authentication, billing, and SSO provider
- **Spoke Apps** - Independent Meteor apps that integrate with the Hub for auth

For detailed architecture documentation, see [Hub & Spoke Strategy](documentation/HUB_SPOKE_STRATEGY.md).

```
┌─────────────────────────────────────────────────────────────────┐
│                     HUB APP (port 3000)                         │
│  • User accounts    • Billing    • SSO tokens    • Spoke API   │
└─────────────────────────────────────────────────────────────────┘
                │                               │
                ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│  Spoke App Skeleton       │   │  Backlog Beacon           │
│  (port 3010)              │   │  (port 3020)              │
└───────────────────────────┘   └───────────────────────────┘
```

## Getting Started

### Prerequisites
- Meteor 3+
- Node.js 22+

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   meteor npm install
   ```
3. Copy the example settings file:
   ```bash
   cp settings.example.json settings.development.json
   ```
4. Edit `settings.development.json` with your configuration (see [Configuration](#configuration))
5. Run the development server:
   ```bash
   meteor --settings settings.development.json
   ```

## Configuration

### Email Setup
To enable email verification, configure your SMTP server in `settings.development.json`:
```json
{
  "public": {
    "appName": "Kokokino Hub"
  },
  "private": {
    "MAIL_URL": "smtp://username:password@smtp.example.com:587"
  }
}
```

### Lemon Squeezy Integration
Set up Lemon Squeezy webhooks for subscription management:
```json
{
  "private": {
    "lemonSqueezy": {
      "storeId": "your-store-id",
      "storeName": "kokokino",
      "apiKey": "your-api-key",
      "lemonSqueezyWebhookSecret": "your-webhook-secret"
    }
  }
}
```

Refer to the [Lemon Squeezy documentation](https://docs.lemonsqueezy.com) and [Billing Documentation](documentation/BILLING.md) for details.

### Spoke App Integration
Configure spoke apps for SSO in `settings.development.json`:
```json
{
  "private": {
    "spokeApiKeys": {
      "spoke_app_skeleton": "your-32-char-random-key",
      "backlog_beacon": "another-32-char-random-key"
    },
    "spokes": {
      "spoke_app_skeleton": {
        "url": "http://localhost:3010",
        "name": "Spoke App Skeleton"
      }
    }
  }
}
```

For full SSO architecture, see [Hub & Spoke Strategy](documentation/HUB_SPOKE_STRATEGY.md).

## Development

### Project Structure
```
hub/
├── client/           # Mithril.js frontend, routing, subscriptions
├── server/           # Publications, methods, API endpoints, webhooks
│   ├── api/          # REST API for spoke apps (SSO, subscription checks)
│   ├── webhooks/     # Lemon Squeezy payment webhooks
│   ├── migrations/   # Database migrations (quave:migrations)
│   └── seo/          # Server-side SEO for crawlers
├── imports/          # Shared UI components and utilities
├── lib/              # Collections (shared between client/server)
├── documentation/    # Project documentation
├── private/          # Server-only assets (RSA keys, scripts)
└── tests/            # Test files
```

### Tech Stack
- **Meteor.js 3** – Full-stack framework with real-time data
- **Mithril.js** – Lightweight UI components
- **Pico CSS** – Minimal CSS framework
- **MongoDB** – Database
- **Lemon Squeezy** – Billing and subscriptions
- **RSpack** – Bundler (replacing Webpack)
- **quave:migrations** – Database migrations
- **jsonwebtoken** – RS256 JWT for SSO

### Running Locally

```bash
# Start the Hub on port 3000
npm run dev
# or: meteor --settings settings.development.json

# If running spoke apps simultaneously:
# Hub: port 3000
# Spoke App Skeleton: port 3010
# Backlog Beacon: port 3020
```

### Creating a Development User

For local development, create a pre-configured user with a verified email and active subscription. This bypasses Lemon Squeezy webhooks and email verification.

**Run the setup script:**

```bash
# With meteor running in another terminal:
meteor shell < private/scripts/createDevUser.js
```

**Credentials:**
| Field | Value |
|-------|-------|
| Username | `devuser` |
| Password | `devuser` |
| Email | `devuser@pingme.com` (pre-verified) |
| Subscription | Base Monthly (active) |

The script is idempotent - safe to run multiple times. It will update an existing devuser if one exists.

> **Note:** This script only works via `meteor shell` which requires local filesystem access. Client-side database modifications are blocked by collection deny rules.

### Key Documentation

- [Hub & Spoke Strategy](documentation/HUB_SPOKE_STRATEGY.md) - Architecture and SSO flow
- [Billing](documentation/BILLING.md) - Subscription and payment handling
- [Products and Apps](documentation/PRODUCTS_AND_APPS.md) - Product/app data model
- [Security](documentation/SECURITY.md) - Security policies

## Contributing
We welcome contributions! Please see our [Contributing Guidelines](documentation/CONTRIBUTING.md).

## Code of Conduct
Please review our [Code of Conduct](documentation/CODE_OF_CONDUCT.md) before participating in the community.

## Security
If you discover a security vulnerability, please follow our [Security Policy](documentation/SECURITY.md).

## Related Repositories

- [Spoke App Skeleton](https://github.com/kokokino/spoke_app_skeleton) - Template for creating new spoke apps
- [Backlog Beacon](https://github.com/kokokino/backlog_beacon) - Video game collection manager

## License
MIT License – see [LICENSE](LICENSE) file for details.
