import m from 'mithril';
import SubscriptionButton from '/imports/ui/components/SubscriptionButton';
import SubscriberCount from '/imports/ui/components/SubscriberCount';
import { isVerifiedUser } from '/imports/utils.js';

const HomePage = {
  view() {
    return m('section', [
      m('h1', 'Welcome to Kokokino Hub'),
      m('p', 'Your central hub for all Kokokino games and applications.'),
      
      m('article', [
        m('h2', 'What is Kokokino?'),
        m('p', 'Kokokino is an open‑source cooperative where creative people write games and learn from each other.'),
        m('p', 'All games are open source but monetized through monthly subscriptions to keep the servers running.')
      ]),
      
      m('article', [
        m('h2', 'Base Subscription'),
        m('ul', [
          m('li', [m('strong', 'Base monthly charge: $2'), ' - Access to fundamental apps and games']),
          m('li', ['Currently: ', m(SubscriberCount)])
        ]),
        m('div', 
          m(SubscriptionButton, {
            productId: Meteor.settings.public?.lemonSqueezy?.baseMonthlyProductID,
            label: 'Subscribe to Kokokino Hub ($2/month)',
            variant: 'primary'
          })
        )
      ]),
      
      m('article', [
        m('h2', 'Available Apps'),
        m('div.grid', [
          m('div', [
            m('article', [
              m('h3', 'Backlog Beacon'),
              m('p', 'Track your personal video game collection'),
              m('footer', m('small', 'Included in base subscription'))
            ])
          ]),
          m('div', [
            m('article', [
              m('h3', 'Coming Soon'),
              m('p', 'More games and apps from our community'),
              m('footer', m('small', 'Various subscription levels'))
            ])
          ])
        ])
      ])
    ]);
  }
};

export default HomePage;
