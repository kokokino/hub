import m from 'mithril';

const PrivacyPolicyPage = {
  view() {
    return m('section', [
      m('h1', 'Privacy Policy'),
      m('p', 'At Kokokino, we are committed to protecting your privacy. This short policy explains how we handle your personal data.'),
      
      m('article', [
        m('h2', 'Information We Collect'),
        m('p', 'We collect minimal personal data, primarily for account management and payment processing (via Lemon Squeezy). This includes your email address, billing information (handled by our payment processor), and any information you voluntarily provide during registration or contact.')
      ]),
      
      m('article', [
        m('h2', 'How We Use Your Information'),
        m('p', 'Your information is used solely to provide and improve our services, process your subscriptions, communicate with you, and ensure the security of our platform. We do not sell or share your data with third parties for marketing purposes.')
      ]),
      
      m('article', [
        m('h2', 'Data Security'),
        m('p', 'We implement robust security measures to protect your data. All payments are securely processed by Lemon Squeezy, a trusted third-party payment gateway.')
      ]),
      
      m('article', [
        m('h2', 'Your Rights'),
        m('p', 'You have the right to access, correct, or delete your personal information. Please contact us at ',
          m('a[href="mailto:info@kokokino.com"]', 'info@kokokino.com'),
          ' for any privacy-related concerns.'
        )
      ]),
      
      m('article', { style: 'margin-top: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;' },
        m('p', { style: 'margin: 0; font-style: italic;' },
          'Last Updated: December 20, 2025'
        )
      )
    ]);
  }
};

export default PrivacyPolicyPage;
