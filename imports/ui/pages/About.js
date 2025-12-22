import m from 'mithril';

const AboutPage = {
  view() {
    return m('section', [
      m('h1', 'About Kokokino'),
      m('p',
        'Kokokino is an open‑source cooperative where creative people come together to build games and learn from each other. We believe in democratizing game development by making all our code publicly available, allowing developers of all skill levels to study, contribute, and grow.'
      ),
      m('p',
        'Our unique subscription model starts with a $2 monthly base charge that grants access to fundamental apps like Backlog Beacon. This approach ensures our servers stay running while keeping our core offerings accessible. More ambitious games may require additional subscriptions, creating a sustainable ecosystem where novice developers can contribute and experienced creators can earn a full‑time living.'
      ),
      m('p',
        'At the heart of our platform is the Kokokino Hub—the central application that handles user accounts, billing, and Single Sign‑On (SSO) for all community apps. Like the hub of a wheel, it connects individual applications (the spokes) back to a secure, unified center.'
      ),
      m('p',
        'We\'ve chosen a technology stack focused on simplicity as a super‑power: Meteor JS for real‑time apps, Mithril for clean UI development, Pico CSS for minimal styling, and Babylon JS for 3D rendering and integrated physics with Havok JS. This combination allows us to move quickly while maintaining robust, production‑ready applications.'
      ),
      m('p',
        'Our philosophy centers on open collaboration, real‑time experiences by default, and modular design. Every game in our ecosystem is open source, creating a living library of code that developers can learn from, remix, and improve upon—truly embodying the cooperative spirit.'
      ),
      m('article', { style: 'margin-top: 3rem; padding: 1.5rem; background: #f8f9fa; border-radius: 8px;' },
        [
          m('h2', 'Our Mission'),
          m('p', { style: 'margin: 0;' },
            'To create a sustainable ecosystem where game developers can collaborate, learn, and earn—regardless of their experience level—through open‑source development and fair subscription models.'
          )
        ]
      )
    ]);
  }
};

export default AboutPage;
