# Kokokino Conventions

## Overview
Kokokino is an open‑source COOP where creative people write games and learn from each other.  
All games are open source but monetized through monthly subscriptions to keep the servers running.

## Subscription Model
- **Base monthly charge**: $2  
  Grants access to fundamental apps and games, such as **Backlog Beacon** (for tracking your personal video game collection).
- **Additional subscriptions**: Some ambitious games may require extra monthly charges to cover their scope and development costs.  
  This model allows novices to contribute while enabling advanced creators to earn a full‑time living from their games.

## Tech Stack
We focus on simplicity as a super‑power:

| Technology | Purpose |
|------------|---------|
| **JavaScript** | Unified language for both server‑side and browser‑side code |
| **Meteor JS** | Realtime apps, user accounts, and MongoDB integration |
| **Mithril JS** | General UI, using JavaScript to craft HTML |
| **Pico CSS** | Concise HTML that looks good with minimal effort |
| **Babylon JS** | 3D rendering and physics (with Havok JS built‑in) |
| **Lemon Squeezy** | Billing and subscription management |

## The Hub App
The **Hub** is the central application users see when visiting `http://kokokino.com`.  
It provides:

- User account management
- Billing and subscription handling
- Single Sign‑On (SSO) for all other Kokokino apps (e.g., **Backlog Beacon** and other community apps)

The name “Hub” evokes a wheel where spokes (individual apps) connect back to the center.

## App Structure
- **Hub** – A standalone app that serves as the central entry point and SSO provider.
- **Backlog Beacon** – Included in the standard $2 monthly charge.  
  Other ambitious projects may require their own monthly charge.

Each app is provisioned separately, allowing independent development and deployment while relying on the Hub for authentication and billing.

## Development Philosophy
1. **Open source** – All code is publicly available for learning and collaboration.
2. **Simplicity** – Choose tools that reduce cognitive overhead and speed up development.
3. **Real‑time by default** – Leverage Meteor for live updates and seamless user experiences.
4. **Modularity** – Keep apps decoupled but connected through the Hub’s SSO and billing services.

## Contributing
We welcome contributions from developers, designers, and game creators of all skill levels.  
Check the individual app repositories for contribution guidelines and issue trackers.

---
*Last updated: 2025‑12‑16*
