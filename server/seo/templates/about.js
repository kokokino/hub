/**
 * About page template for crawlers
 */

import { renderBaseTemplate } from './base.js';
import { getMetaTags } from '../metaTags.js';
import { generateOrganizationSchema, generateBreadcrumbSchema } from '../structuredData.js';

const DOMAIN = 'https://kokokino.com';

/**
 * Render the about page for crawlers
 * @returns {string} HTML content
 */
export function renderAboutPage() {
  const content = `
    <article>
      <h1>About Kokokino</h1>

      <p>
        Kokokino is an open-source cooperative where creative people come together to build games
        and learn from each other. We believe in democratizing game development by making all our
        code publicly available, allowing developers of all skill levels to study, contribute, and grow.
      </p>

      <p>
        Our unique subscription model starts with a $2 monthly base charge that grants access to
        fundamental apps like Backlog Beacon. This approach ensures our servers stay running while
        keeping our core offerings accessible. More ambitious games may require additional subscriptions,
        creating a sustainable ecosystem where novice developers can contribute and experienced creators
        can earn a full-time living.
      </p>

      <p>
        At the heart of our platform is the Kokokino Hub&mdash;the central application that handles
        user accounts, billing, and Single Sign-On (SSO) for all community apps. Like the hub of a wheel,
        it connects individual applications (the spokes) back to a secure, unified center.
      </p>

      <h2>Our Technology Stack</h2>
      <p>
        We've chosen a technology stack focused on simplicity as a super-power:
      </p>
      <ul>
        <li><strong>Meteor JS</strong> &ndash; Real-time applications with built-in reactivity</li>
        <li><strong>Mithril</strong> &ndash; Clean, lightweight UI development</li>
        <li><strong>Pico CSS</strong> &ndash; Minimal, semantic styling</li>
        <li><strong>Babylon JS</strong> &ndash; Powerful 3D rendering engine</li>
        <li><strong>Havok JS</strong> &ndash; Integrated physics simulation</li>
      </ul>
      <p>
        This combination allows us to move quickly while maintaining robust, production-ready applications.
      </p>

      <h2>Our Philosophy</h2>
      <p>
        Our philosophy centers on open collaboration, real-time experiences by default, and modular design.
        Every game in our ecosystem is open source, creating a living library of code that developers can
        learn from, remix, and improve upon&mdash;truly embodying the cooperative spirit.
      </p>

      <aside style="margin-top: 2rem; padding: 1.5rem; background: #f8f9fa; border-radius: 8px;">
        <h2>Our Mission</h2>
        <p style="margin: 0;">
          To create a sustainable ecosystem where game developers can collaborate, learn, and earn&mdash;regardless
          of their experience level&mdash;through open-source development and fair subscription models.
        </p>
      </aside>
    </article>
  `;

  const meta = getMetaTags('/about');
  const schemas = [
    generateOrganizationSchema(),
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'About', url: '/about' }
    ])
  ];

  return renderBaseTemplate({ meta, content, schemas });
}
