/**
 * JSON-LD Structured Data generators for Schema.org markup
 */

const DOMAIN = 'https://kokokino.com';

/**
 * Generate Organization schema
 * @returns {Object} Organization JSON-LD
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kokokino',
    url: DOMAIN,
    logo: `${DOMAIN}/logo.png`,
    description: 'An open-source cooperative where creative people come together to build games and learn from each other.',
    email: 'info@kokokino.com',
    telephone: '+1-301-956-2319',
    sameAs: [
      'https://github.com/kokokino'
    ]
  };
}

/**
 * Generate WebSite schema
 * @returns {Object} WebSite JSON-LD
 */
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Kokokino Hub',
    url: DOMAIN,
    description: 'Open source game platform and ecosystem',
    publisher: {
      '@type': 'Organization',
      name: 'Kokokino'
    }
  };
}

/**
 * Generate WebApplication schema for an app
 * @param {Object} app - App document from database
 * @param {Object} product - Associated product document
 * @returns {Object} WebApplication JSON-LD
 */
export function generateAppSchema(app, product = null) {
  const slug = app.slug || app._id;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: app.name,
    description: app.description,
    url: `${DOMAIN}/apps/${slug}`,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web Browser',
    browserRequirements: 'Requires JavaScript. Works in modern browsers.',
    offers: {
      '@type': 'Offer',
      price: product ? product.price : '2.00',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    },
    author: {
      '@type': 'Organization',
      name: 'Kokokino'
    }
  };

  if (app.ageRating) {
    schema.contentRating = app.ageRating;
  }

  if (app.gitHubUrl) {
    schema.isBasedOn = app.gitHubUrl;
  }

  return schema;
}

/**
 * Generate FAQPage schema
 * @returns {Object} FAQPage JSON-LD
 */
export function generateFAQSchema() {
  const faqs = [
    {
      question: 'How do I get started?',
      answer: 'To play games, subscribe to the base monthly subscription plus any other premium subscriptions. You play the games in your web browser which means you can start playing almost instantly. Some games may require a virtual reality headset.'
    },
    {
      question: 'How do I submit a game or app?',
      answer: 'Start by cloning the Hub app and the Skeleton app to learn how they work together. Fork from the Skeleton app to make your own game. Once you have something minimally viable, reach out to make your app playable.'
    },
    {
      question: 'Can I make money?',
      answer: 'If your app is part of the base subscription, you cannot make money directly. For premium subscriptions, you keep 100% of profits minus hosting and payment processing costs. Kokokino does not take a percentage.'
    },
    {
      question: 'What types of games or apps are acceptable?',
      answer: 'Anything that does not violate Lemon Squeezy payment processor guidelines. Games and utilities are welcome as long as they do not promote hate or are overly sexual in content.'
    },
    {
      question: 'Why web technologies?',
      answer: 'The web supports 3D and VR, makes updates easy for players, and allows instant play without downloads. It is accessible and reaches the widest audience.'
    },
    {
      question: 'What tech stack is supported?',
      answer: 'Primarily Meteor (Node/JavaScript) with frameworks like Mithril for UI and Babylon/Havok for 3D/Physics. You can use other technologies as long as you interface with the Hub API.'
    }
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

/**
 * Generate BreadcrumbList schema
 * @param {Array} breadcrumbs - Array of {name, url} objects
 * @returns {Object} BreadcrumbList JSON-LD
 */
export function generateBreadcrumbSchema(breadcrumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url.startsWith('http') ? crumb.url : `${DOMAIN}${crumb.url}`
    }))
  };
}

/**
 * Generate ItemList schema for a collection of apps
 * @param {Array} apps - Array of app documents
 * @returns {Object} ItemList JSON-LD
 */
export function generateAppListSchema(apps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Kokokino Apps',
    description: 'Available games and applications on Kokokino',
    numberOfItems: apps.length,
    itemListElement: apps.map((app, index) => {
      const slug = app.slug || app._id;
      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'WebApplication',
          name: app.name,
          description: app.description,
          url: `${DOMAIN}/apps/${slug}`
        }
      };
    })
  };
}

/**
 * Generate JSON-LD script tag
 * @param {Object|Array} schema - Schema object(s)
 * @returns {string} HTML script tag with JSON-LD
 */
export function generateJsonLdScript(schema) {
  const schemas = Array.isArray(schema) ? schema : [schema];
  return schemas.map(s =>
    `<script type="application/ld+json">${JSON.stringify(s)}</script>`
  ).join('\n');
}
