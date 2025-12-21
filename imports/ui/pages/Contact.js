import m from 'mithril';

const ContactPage = {
  view() {
    return m('section', [
      m('h1', 'Get In Touch'),
      m('p', 'Have questions about Kokokino, our games, or how to join? Reach out to us directly, and we\'ll be happy to help!'),
      
      m('article', [
        m('h2', 'Email Us'),
        m('p',
          m('a[href="mailto:info@kokokino.com"]', 
            { style: 'font-size: 1.2rem;' },
            'info@kokokino.com'
          )
        )
      ]),
      
      m('article', [
        m('h2', 'Call Us'),
        m('p', { style: 'font-size: 1.2rem;' }, '+1 (301) 956-2319')
      ]),
      
      m('article', { style: 'margin-top: 2rem; padding: 1.5rem; background: #f8f9fa; border-radius: 8px;' },
        m('p', { style: 'margin: 0;' },
          'We typically respond to emails within 24 hours. For urgent matters, please call during business hours (9 AM - 5 PM EST, Monday-Friday).'
        )
      )
    ]);
  }
};

export default ContactPage;
