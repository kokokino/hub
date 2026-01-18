import m from 'mithril';
import { routeLink } from '/imports/utils.js';

const FAQPage = {
  view() {
    return m('section', [
      m('h1', 'Frequently Asked Questions'),
      m('p',
        'Here are answers to some of the most common questions about Kokokino.'
      ),
      
      // FAQ items
      m('article', { style: 'margin-top: 2rem;' }, [
        m('h2', 'How do I get started?'),
        m('p', 
          'To play games, subscribe to the base monthly subscription plus any other premium subscriptions. You play the games in your web browser which means you can start playing almost instantly. Some games may require a virtual reality headset.'
        ),
      ]),
      
      m('article', [
        m('h2', 'How do I submit a game or app?'),
        m('p', 
          'To make games, start by cloning the ',
          m('a[href="https://github.com/kokokino/hub"]', 
            { target: '_blank', rel: 'noopener noreferrer' },
            'Hub app'
          ),
          ' and then the ',
          m('a[href="https://github.com/kokokino/spoke_app_skeleton"]', 
            { target: '_blank', rel: 'noopener noreferrer' },
            'Skeleton app'
          ),
          ' to learn how they work together. You\'ll likely fork from the Skeleton app to make your own game or you could fork from any other game (everything is open source). Once you have something minimally viable, ',
          m('a', routeLink('/contact'), 'reach out'),
          ' to make your app playable. You\'ll need to decide if you want your app as part of the base monthly subscription or your own dedicated subscription.'
        ),
      ]),
      
      m('article', [
        m('h2', 'Can I make money?'),
        m('p',
          'If your app is part of the base monthly subscription then no, you cannot make money but you might get more players before moving to a dedicated premium subscription. Every player must have an active monthly subscription but they can also purchase selected premium subscriptions. You can set the price for your premium subscription and you keep 100% minus the cost of the hosting platform ',
          m('a[href="https://www.meteor.com/cloud/pricing"]', 
            { target: '_blank', rel: 'noopener noreferrer' },
            '(Meteor Cloud pricing)'
          ),
          ' and payment processing ',
          m('a[href="https://www.lemonsqueezy.com/pricing"]', 
            { target: '_blank', rel: 'noopener noreferrer' },
            '(Lemon Squeezy pricing)'
          ),
          '. We don\'t take a percentage of your profits like most other platforms.'
        ),
      ]),
      
      m('article', [
        m('h2', 'What types of games or apps are acceptable?'),
        m('p',
          'Anything that doesn\'t violate our payment processor guidelines is fair game. Since we use Lemon Squeezy, here are their rules ',
          m('a[href="https://docs.lemonsqueezy.com/help/getting-started/prohibited-products"]', 
            { target: '_blank', rel: 'noopener noreferrer' },
            '(Lemon Squeezy prohibited products)'
          ),
          '. Games and utilities are welcome as long as they don\'t promote hate or are overly sexual in content.'
        ),
      ]),
      
      m('article', [
        m('h2', 'Why web technologies?'),
        m('p',
          'The web is now impressive and can even support 3D and VR. It\'s also easier to get to the finish line. It makes software updates a snap for your players and allows them to start playing immediately without long download times. Your first app should be on the web. Later maybe you\'ll want to make a native PC/console game in C++ or Rust to eke out the last bit of performance (and leave us) but you may find the web does everything you want and more.'
        ),
      ]),
      
      m('article', [
        m('h2', 'What tech stack is supported?'),
        m('p',
          'Primarily Meteor which is Node (JavaScript) and supporting frameworks like Mithril (for UI) and Babylon/Havok for 3D/Physics. But that\'s more of a suggestion than a rule. You\'ll need to interface with our Hub via API calls but then it\'s up to you. It would be nice if we all roughly use the same tech stack so we can share code and help one another but you are free to choose. ',
          m('a[href="https://galaxycloud.app/"]', 
            { target: '_blank', rel: 'noopener noreferrer' },
            'Galaxy'
          ),
          ' is our preferred host but there are alternatives.'
        ),
      ]),
      
      m('article', [
        m('h2', 'What if I want a native app that gets installed on the player\'s device?'),
        m('p',
          'You might want to stick with web technologies like PWA to offer an "offline first" experience where the user doesn\'t have to be connected to the internet to play, or can play with an unstable connection. But if you truly want a natively installed app then you\'ll need to host it elsewhere as we are not setup for that.'
        ),
      ]),
      
      m('article', [
        m('h2', 'Why host here instead of Steam?'),
        m('p',
          'Steam is a great marketplace for established development teams, but it can be hard to make a game and get it approved there these days. Choosing the web may seem like a drawback at first (Babylon instead of Unreal, JavaScript instead of C++) but you may be surprised at the performance you can achieve and how quick your app comes together. Come here to learn and grow, go to Steam when you are ready for the next level. Or maybe stay here if it\'s working for you and you\'re enjoying the ride.'
        ),
      ]),
      
      m('article', { style: 'margin-top: 3rem; padding: 1.5rem; background: #f8f9fa; border-radius: 8px;' },
        m('p', { style: 'margin: 0; font-style: italic;' },
          'If you have further questions, feel free to ',
          m('a', routeLink('/contact'), 'contact us'),
          '.'
        )
      )
    ]);
  }
};

export default FAQPage;
