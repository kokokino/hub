# Kokokino Hub

A central hub for account management, billing, and Single Sign‑On (SSO) for all Kokokino applications.

## Overview

The Hub is the central application users see when visiting `http://kokokino.com`. It provides:

- User account management
- Billing and subscription handling via Lemon Squeezy
- Single Sign‑On (SSO) for all other Kokokino apps

## Getting Started

### Prerequisites
- Meteor 3+

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   meteor npm install
   ```
3. Copy the example settings file:
   ```bash
   cp settings.example.json settings.json
   ```
4. Edit `settings.json` with your configuration (see [Configuration](#configuration))
5. Run the development server:
   ```bash
   meteor --settings settings.json
   ```

## Configuration

### Email Setup
To enable email verification, configure your SMTP server in `settings.json`:
```json
{
  "public": {
    "appName": "Kokokino Hub"
  },
  "private": {
    "MAIL_URL": "smtp://username:password@smtp.example.com:587",
    "lemonSqueezy": {
      "storeId": "your-store-id",
      "apiKey": "your-api-key",
      "lemonSqueezyWebhookSecret": "your-webhook-secret"
    }
  }
}
```

### Lemon Squeezy Integration
Set up Lemon Squeezy webhooks for subscription management. Refer to the [Lemon Squeezy documentation](https://docs.lemonsqueezy.com) for details.

## Development

### Project Structure
- `client/` – Frontend code (Mithril.js components)
- `server/` – Server‑side code and methods
- `tests/` – Test files

### Tech Stack
- Meteor.js – Full‑stack framework
- Mithril.js – UI components
- Pico.css – Minimal CSS framework
- MongoDB – Database
- Lemon Squeezy – Billing and subscriptions

## Contributing
We welcome contributions! Please see our [Contributing Guidelines](documentation/CONTRIBUTING.md).

## Code of Conduct
Please review our [Code of Conduct](documentation/CODE_OF_CONDUCT.md) before participating in the community.

## Security
If you discover a security vulnerability, please follow our [Security Policy](documentation/SECURITY.md).

## License
MIT License – see [LICENSE](LICENSE) file for details.
