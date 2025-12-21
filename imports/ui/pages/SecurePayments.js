import m from 'mithril';

const SecurePaymentsPage = {
  view() {
    return m('section', [
      m('h1', 'Secure Payments'),
      m('p',
        'Your financial security is our top priority. All payments for Kokokino subscriptions are handled securely and efficiently by ',
        m('a[href="https://www.lemonsqueezy.com/"]', 
          { target: '_blank', rel: 'noopener noreferrer' },
          'Lemon Squeezy'
        ),
        ', a trusted and PCI-compliant payment platform. This ensures your sensitive payment information is protected with the highest standards of encryption and fraud prevention.'
      ),
      
      m('article', { style: 'margin-top: 2rem; padding: 1.5rem; background: #f0f7ff; border-radius: 8px;' },
        [
          m('h2', 'Why We Chose Lemon Squeezy'),
          m('ul', { style: 'padding-left: 1.5rem;' },
            [
              m('li', 'Global tax compliance handled for you'),
              m('li', 'Borderless payments from 135+ countries'),
              m('li', 'Support for 20+ payment methods'),
              m('li', 'Local currency support for 130+ countries'),
              m('li', 'AI-powered fraud prevention'),
              m('li', 'Automated failed payment recovery')
            ]
          ),
          m('p', { style: 'margin-top: 1rem;' },
            'By partnering with Lemon Squeezy as our merchant of record, we can focus on building great games while they handle the complexities of payments, taxes, and compliance.'
          )
        ]
      ),
      
      m('article', [
        m('h2', 'Payment Security Features'),
        m('div', { style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-top: 1rem;' },
          [
            m('div', { style: 'padding: 1rem; background: #f8f9fa; border-radius: 6px;' },
              m('h3', { style: 'margin-top: 0;' }, 'PCI Compliance'),
              m('p', 'Lemon Squeezy is PCI DSS Level 1 certified—the highest level of payment security standard.')
            ),
            m('div', { style: 'padding: 1rem; background: #f8f9fa; border-radius: 6px;' },
              m('h3', { style: 'margin-top: 0;' }, 'Encryption'),
              m('p', 'All payment data is encrypted in transit and at rest using industry-standard protocols.')
            ),
            m('div', { style: 'padding: 1rem; background: #f8f9fa; border-radius: 6px;' },
              m('h3', { style: 'margin-top: 0;' }, 'No Card Storage'),
              m('p', 'We never see or store your credit card details. All payment information is handled directly by Lemon Squeezy.')
            )
          ]
        )
      ]),
      
      m('article', [
        m('p',
          'If you have any questions about payment security or need assistance with a transaction, please don\'t hesitate to ',
          m('a[href="/contact"]', { oncreate: m.route.link }, 'contact us'),
          '.'
        )
      ])
    ]);
  }
};

export default SecurePaymentsPage;
