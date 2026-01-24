import m from 'mithril';
import { Tracker } from 'meteor/tracker';
import { Meteor } from 'meteor/meteor';
import { Apps } from '/lib/collections/apps';
import { Products } from '/lib/collections/products';
import { routeLink } from '/imports/utils.js';

const AppDetailPage = {
  oninit(vnode) {
    this.slug = vnode.attrs.slug;
    this.app = null;
    this.product = null;
    this.user = null;
    this.userSubscriptions = [];
    this.baseProduct = null;
    this.ready = false;
    this.launching = false;

    this.autorun = Tracker.autorun(() => {
      const appsReady = Meteor.subscribe('apps').ready();
      const productsReady = Meteor.subscribe('products').ready();
      this.ready = appsReady && productsReady;

      this.user = Meteor.user();
      this.userSubscriptions = this.user?.lemonSqueezy?.subscriptions || [];

      if (this.ready) {
        // Find app by slug or ID
        this.app = Apps.findOne({ slug: this.slug, isApproved: true, isActive: true });
        if (!this.app) {
          this.app = Apps.findOne({ _id: this.slug, isApproved: true, isActive: true });
        }

        if (this.app && this.app.productId) {
          this.product = Products.findOne({ _id: this.app.productId });
        }

        // Find base product
        const products = Products.find({ isApproved: true, isActive: true }).fetch();
        this.baseProduct = products.find(product => product.isRequired);
      }
      m.redraw();
    });
  },

  onremove() {
    if (this.autorun) {
      this.autorun.stop();
    }
  },

  hasActiveSubscription(productId) {
    if (!productId) return false;
    const now = new Date();
    return this.userSubscriptions.some(sub =>
      sub.kokokinoProductId === productId &&
      sub.status === 'active' &&
      sub.validUntil &&
      new Date(sub.validUntil) > now
    );
  },

  canLaunchApp() {
    if (!this.user || !this.app) return false;
    if (!this.baseProduct || !this.hasActiveSubscription(this.baseProduct._id)) {
      return false;
    }
    if (this.app.productId !== this.baseProduct._id) {
      if (!this.hasActiveSubscription(this.app.productId)) {
        return false;
      }
    }
    return true;
  },

  hasSsoConfigured() {
    if (!this.app) return false;
    if (this.app.spokeId) return true;
    const spokes = Meteor.settings?.public?.spokes || {};
    return !!spokes[this.app._id];
  },

  getMissingRequirements() {
    if (!this.app) return [];
    const missing = [];

    if (this.baseProduct && !this.hasActiveSubscription(this.baseProduct._id)) {
      missing.push(this.baseProduct.name);
    }

    if (this.app.productId !== this.baseProduct?._id && !this.hasActiveSubscription(this.app.productId)) {
      if (this.product) {
        missing.push(this.product.name);
      }
    }

    return missing;
  },

  getLaunchInstructions() {
    const isLoggedIn = !!this.user;
    const missingSubscriptions = this.getMissingRequirements();

    if (missingSubscriptions.length === 0) {
      return '';
    }

    const subscriptionList = missingSubscriptions.join(' and ');

    if (isLoggedIn) {
      return `Please subscribe to ${subscriptionList} to launch`;
    } else {
      return `Please log in and subscribe to ${subscriptionList} to launch`;
    }
  },

  handleLaunch() {
    if (this.launching || !this.app) return;

    this.launching = true;
    m.redraw();

    Meteor.call('sso.generateToken', this.app._id, (error, result) => {
      if (error) {
        console.error('Launch error:', error);

        if (error.error === 'subscription-required') {
          alert(error.reason || 'Subscription required to launch this app');
        } else if (error.error === 'not-configured') {
          alert('This app is not yet available for launch');
        } else {
          alert('Failed to launch app. Please try again.');
        }

        this.launching = false;
        m.redraw();
        return;
      }

      window.location.href = result.redirectUrl;
    });
  },

  view() {
    if (!this.ready) {
      return m('section', [
        m('p', m('a', routeLink('/'), '\u2190 Back to Home')),
        m('p', 'Loading...')
      ]);
    }

    if (!this.app) {
      return m('section', [
        m('p', m('a', routeLink('/'), '\u2190 Back to Home')),
        m('h1', 'App Not Found'),
        m('p', 'The requested app could not be found.')
      ]);
    }

    const productName = this.product ? this.product.name : 'Kokokino Subscription';
    const canLaunch = this.canLaunchApp();
    const launchInstructions = !canLaunch ? this.getLaunchInstructions() : '';
    const hasSso = this.hasSsoConfigured();

    return m('section', [
      m('p', m('a', routeLink('/'), '\u2190 Back to Home')),

      m('h1', this.app.name),

      m('article', [
        m('h2', 'About This App'),
        m('p', this.app.description)
      ]),

      m('article', [
        m('h2', 'Details'),
        m('dl', [
          m('dt', m('strong', 'Subscription Required')),
          m('dd', productName),

          this.app.ageRating ? [
            m('dt', m('strong', 'Age Rating')),
            m('dd', this.app.ageRating)
          ] : null,

          this.app.gitHubUrl ? [
            m('dt', m('strong', 'Source Code')),
            m('dd', m('a', {
              href: this.app.gitHubUrl,
              target: '_blank',
              rel: 'noopener noreferrer'
            }, 'View on GitHub'))
          ] : null
        ])
      ]),

      m('article', [
        m('h2', 'Play Now'),
        canLaunch
          ? m('button', {
              onclick: () => this.handleLaunch(),
              disabled: this.launching || !hasSso
            }, this.launching ? 'Launching...' : (hasSso ? 'Launch App' : 'Coming Soon'))
          : [
              m('p', m('em', launchInstructions)),
              m('p', m('a', routeLink('/'), 'Sign up or log in to get started'))
            ]
      ]),

      m('article', { style: 'margin-top: 2rem; padding: 1.5rem; background: #f8f9fa; border-radius: 8px;' }, [
        m('h3', 'Part of the Kokokino Ecosystem'),
        m('p', { style: 'margin: 0;' }, [
          this.app.name,
          ' is part of the Kokokino open-source game platform. All our code is publicly available, and we welcome contributions from developers of all skill levels. ',
          m('a', routeLink('/faq'), 'Learn more about contributing'),
          '.'
        ])
      ])
    ]);
  }
};

export default AppDetailPage;
