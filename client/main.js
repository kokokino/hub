import m from 'mithril';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Products } from '/lib/collections/products';
import { Apps } from '/lib/collections/apps';
import './main.html';

// Import Pico CSS directly from node_modules
import '@picocss/pico/css/pico.min.css';

// Import page components
import HomePage from '/imports/ui/pages/HomePage.js';
import ContactPage from '/imports/ui/pages/Contact.js';
import AboutPage from '/imports/ui/pages/About.js';
import PrivacyPolicyPage from '/imports/ui/pages/PrivacyPolicy.js';
import SecurePaymentsPage from '/imports/ui/pages/SecurePayments.js';
import SubscriptionButton from '/imports/ui/components/SubscriptionButton';
import { isVerifiedUser, routeLink } from '/imports/utils.js';

// Initialize accounts configuration
Accounts.ui.config({
  passwordSignupFields: 'USERNAME_AND_EMAIL'
});

// Create a reactive store for verification status
const verificationStore = {
  showNotice: false,
  // Function to update and trigger redraw
  update(user) {
    let isNotVerifiedUser = user // Does user object exist?
                            && user._id // Has it been saved previously to the server? If it has an _id it was.
                            && !isVerifiedUser(user);
    if (this.showNotice !== isNotVerifiedUser) {
      this.showNotice = isNotVerifiedUser;
      // Trigger Mithril redraw when value changes
      m.redraw();
    }
  }
};

// Global subscriptions with logging
console.log('Setting up global subscriptions');
const currentUserHandle = Meteor.subscribe('currentUser');
const productsHandle = Meteor.subscribe('products');
const appsHandle = Meteor.subscribe('apps');

// Track subscription status
Tracker.autorun(() => {
  const currentUserReady = currentUserHandle.ready();
  const productsReady = productsHandle.ready();
  const appsReady = appsHandle.ready();
  
  console.log('Subscription status - currentUser:', currentUserReady, 'products:', productsReady, 'apps:', appsReady);
  
  if (productsReady) {
    const productCount = Products.find().count();
    console.log(`Client received ${productCount} products`);
    Products.find().forEach(product => {
      console.log('Product:', product.name, product._id);
    });
  }
  
  if (appsReady) {
    const appCount = Apps.find().count();
    console.log(`Client received ${appCount} apps`);
    Apps.find().forEach(app => {
      console.log('App:', app.name, app._id);
    });
  }
});

// Set up Tracker to monitor verification status
Tracker.autorun(() => {
  const user = Meteor.user();
  verificationStore.update(user);
});

// Component to handle Blaze login buttons
const LoginButtons = {
  oncreate(vnode) {
    // Render Blaze login buttons into this component
    const data = { align: 'right' };
    this.blazeView = Blaze.renderWithData(Template.loginButtons, data, vnode.dom);
  },

  onremove(vnode) {
    // Clean up when component is removed
    if (this.blazeView) {
      Blaze.remove(this.blazeView);
    }
  },

  view() {
    return m('div');
  }
};

// Verification Notice Component
const VerificationNotice = {
  oninit() {
    this.resending = false;
  },

  resendEmail() {
    this.resending = true;
    Meteor.call('resendVerificationEmail', (error) => {
      this.resending = false;
      if (error) {
        console.error('Failed to resend verification email:', error);
        alert('Failed to resend verification email. Please try again later.');
      } else {
        alert('Verification email resent! Please check your inbox.');
      }
      m.redraw();
    });
  },

  view() {
    if (!verificationStore.showNotice) return null;

    return m('div.verification-notice',
      [
        m('div.notice-content', [
          m('strong.notice-title', 'Email Verification Required'),
          m('p.notice-message',
            'Please check your email and click the verification link to complete your account setup.'),
          m('button.resend-button',
            {
              onclick: () => this.resendEmail(),
              disabled: this.resending
            },
            this.resending ? 'Sending...' : 'Resend Email'
          )
        ])
      ]
    );
  }
};


// Header Component
const Header = {
  view() {
    return m('header', [
      m('nav.container-fluid', [
        m('ul', [
          m('li', m('strong', [
            m('a', routeLink('/'), 'Kokokino Hub')
          ]))
        ]),
        m('ul', [
          m('li', m('a', routeLink('/'), 'Home')),
          m('li', m('a', routeLink('/contact'), 'Contact')),
          m('li', m(LoginButtons))
        ])
      ])
    ]);
  }
};

// Footer Component
const Footer = {
  view() {
    return m('footer.container-fluid', [
      m('div', { style: 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;' }, [
        m('ul', { style: 'display: flex; gap: 1.5rem; margin: 0; padding: 0; list-style: none;' }, [
          m('li', m('a', routeLink('/contact'), 'Contact')),
          m('li', m('a', routeLink('/about'), 'About')),
          m('li', m('a', routeLink('/privacy'), 'Privacy Policy')),
          m('li', m('a', routeLink('/secure-payments'), 'Secure Payments')),
          m('li', m('a[href="https://github.com/kokokino/hub"]', { target: '_blank', rel: 'noopener noreferrer' }, 'GitHub'))
        ]),
        m('small', `© ${new Date().getFullYear()} Kokokino. All code is open source.`)
      ])
    ]);
  }
};

// Main App Component
const App = {
  view() {
    const route = m.route.get();
    let page;
    if (route === '/contact') page = ContactPage;
    else if (route === '/about') page = AboutPage;
    else if (route === '/privacy') page = PrivacyPolicyPage;
    else if (route === '/secure-payments') page = SecurePaymentsPage;
    else page = HomePage;

    return m('div', [
      m(Header),
      m('main.container', [
        route === '/' ? m(VerificationNotice) : null,
        m(page)
      ]),
      m(Footer)
    ]);
  }
};

// Define routes
const routes = {
  '/': App,
  '/contact': App,
  '/about': App,
  '/privacy': App,
  '/secure-payments': App
};

// Mount the app when DOM is ready
Meteor.startup(() => {
  m.route(document.getElementById('app'), '/', routes);
});
