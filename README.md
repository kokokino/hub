# Kokokino Hub

A central hub for account management, billing, and Single Sign‑On (SSO) for all Kokokino applications.

## Overview

The Hub is the central application users see when visiting `http://kokokino.com`. It provides:

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
│                         HUB APP                                 │
│  • User accounts    • Billing    • SSO tokens    • Spoke API   │
└─────────────────────────────────────────────────────────────────┘
                │                               │
                ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│   Spoke: App Skeleton     │   │   Spoke: Backlog Beacon   │
└───────────────────────────┘   └───────────────────────────┘
```

## Getting Started

### Prerequisites
- Meteor 3+
- Node.js 20+

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

### Spoke App Integration (Future)
For SSO and Spoke API configuration, see [Hub & Spoke Strategy](documentation/HUB_SPOKE_STRATEGY.md).

## Development

### Project Structure
```
hub/
├── client/           # Frontend code (Mithril.js components)
├── server/           # Server-side code, methods, and publications
├── imports/          # Shared code (UI components, utilities)
├── lib/              # Collections and shared libraries
├── documentation/    # Project documentation
├── private/          # Server-only assets (keys, etc.)
└── tests/            # Test files
```

### Tech Stack
- **Meteor.js 3** – Full-stack framework with real-time data
- **Mithril.js** – Lightweight UI components
- **Pico CSS** – Minimal CSS framework
- **MongoDB** – Database
- **Lemon Squeezy** – Billing and subscriptions
- **quave:migrations** - For managing changes to the database

### Running Locally

```bash
# Start the Hub on port 3000
meteor --settings settings.development.json

# If running spoke apps simultaneously:
# Hub: port 3000
# Spoke App Skeleton: port 3001
# Backlog Beacon: port 3002
```

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
