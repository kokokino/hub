import m from 'mithril';
import { Tracker } from 'meteor/tracker';
import { Meteor } from 'meteor/meteor';
import { Apps } from '/lib/collections/apps';
import { Products } from '/lib/collections/products';
import { routeLink } from '/imports/utils.js';

const AppsList = {
  oninit() {
    this.ready = false;
    this.apps = [];
    this.products = {};
    this.baseProduct = null;
    this.user = null;
    this.userSubscriptions = [];
    this.launching = null; // Track which app is being launched
    
    this.autorun = Tracker.autorun(() => {
      const appsReady = Meteor.subscribe('apps').ready();
      const productsReady = Meteor.subscribe('products').ready();
      this.ready = appsReady && productsReady;
      
      // Track user reactively
      this.user = Meteor.user();
      this.userSubscriptions = this.user?.lemonSqueezy?.subscriptions || [];
      
      if (this.ready) {
        // Fetch all approved, active apps
        this.apps = Apps.find({
          isApproved: true,
          isActive: true
        }).fetch();
        
        // Build a lookup map of products by ID
        const productsList = Products.find({
          isApproved: true,
          isActive: true
        }).fetch();
        
        this.products = {};
        productsList.forEach(product => {
          this.products[product._id] = product;
          // Track the base product (required subscription)
          if (product.isRequired) {
            this.baseProduct = product;
          }
        });
      }
      m.redraw();
    });
  },
  
  onremove() {
    if (this.autorun) {
      this.autorun.stop();
    }
  },
  
  /**
   * Check if user has an active subscription for a specific product
   */
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
  
  /**
   * Check if user can launch an app
   * Requirements:
   * 1. User is logged in
   * 2. User has base subscription (isRequired product)
   * 3. User has subscription for the app's product (if different from base)
   */
  canLaunchApp(app) {
    // Must be logged in
    if (!this.user) return false;
    
    // Must have base subscription
    if (!this.baseProduct || !this.hasActiveSubscription(this.baseProduct._id)) {
      return false;
    }
    
    // If app belongs to a different product, must have that subscription too
    if (app.productId !== this.baseProduct._id) {
      if (!this.hasActiveSubscription(app.productId)) {
        return false;
      }
    }
    
    return true;
  },
  
  /**
   * Check if an app has SSO configured (can be launched)
   */
  hasSsoConfigured(app) {
    // Check if app has spokeId set
    if (app.spokeId) return true;
    
    // Check if there's a spoke configured in settings for this app
    const spokes = Meteor.settings?.public?.spokes || {};
    return !!spokes[app._id];
  },
  
  /**
   * Get the list of missing requirements for launching an app
   * Returns an array of missing subscription names
   */
  getMissingRequirements(app) {
    const missing = [];
    
    // Check base subscription
    if (this.baseProduct && !this.hasActiveSubscription(this.baseProduct._id)) {
      missing.push(this.baseProduct.name);
    }
    
    // Check app's product subscription (if different from base)
    if (app.productId !== this.baseProduct?._id && !this.hasActiveSubscription(app.productId)) {
      const product = this.products[app.productId];
      if (product) {
        missing.push(product.name);
      }
    }
    
    return missing;
  },
  
  /**
   * Build the instruction message for users who can't launch
   */
  getLaunchInstructions(app) {
    const isLoggedIn = !!this.user;
    const missingSubscriptions = this.getMissingRequirements(app);
    
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
  
  /**
   * Handle launch button click
   * Generates SSO token and redirects to spoke app
   */
  handleLaunch(app) {
    if (this.launching) return; // Prevent double-clicks
    
    this.launching = app._id;
    m.redraw();
    
    Meteor.call('sso.generateToken', app._id, (error, result) => {
      if (error) {
        console.error('Launch error:', error);
        
        // Show appropriate error message
        if (error.error === 'subscription-required') {
          alert(error.reason || 'Subscription required to launch this app');
        } else if (error.error === 'not-configured') {
          alert('This app is not yet available for launch');
        } else {
          alert('Failed to launch app. Please try again.');
        }
        
        this.launching = null;
        m.redraw();
        return;
      }
      
      // Redirect to the spoke app with SSO token
      window.location.href = result.redirectUrl;
    });
  },
  
  view() {
    if (!this.ready) {
      return m('article', [
        m('h2', 'Available Apps'),
        m('p', 'Loading apps...')
      ]);
    }
    
    // Build grid items from apps
    const appCards = this.apps.map(app => {
      const product = this.products[app.productId];
      const productName = product ? product.name : 'Unknown Product';
      const canLaunch = this.canLaunchApp(app);
      const launchInstructions = !canLaunch ? this.getLaunchInstructions(app) : '';
      const isLaunching = this.launching === app._id;
      const hasSso = this.hasSsoConfigured(app);

      //console.log(`${app._id} hasSso: ${hasSso}`);
      
      const appSlug = app.slug || app._id;

      return m('div', { key: app._id }, [
        m('article.app-card', [
          m('h3', app.name),
          canLaunch
            ? m('button', {
                onclick: () => this.handleLaunch(app),
                disabled: isLaunching || !hasSso
              }, isLaunching ? 'Launching...' : (hasSso ? 'Launch' : 'Coming Soon'))
            : m('p', m('small', m('em', launchInstructions))),
          m('p.app-description.truncated', app.description),
          m('a.read-more-link', routeLink(`/apps/${appSlug}`), 'Read more'),
          m('footer', m('small', [
            `Included in ${productName}`,
            app.gitHubUrl ? [' · ', m('a', {
              href: app.gitHubUrl,
              target: '_blank',
              rel: 'noopener noreferrer'
            }, 'GitHub')] : null
          ]))
        ])
      ]);
    });
    
    // Add "Coming Soon" card at the end
    const comingSoonCard = m('div', { key: 'coming-soon' }, [
      m('article.app-card', [
        m('h3', 'Coming Soon'),
        m('p.app-description', 'More games and apps from our community'),
        m('footer', m('small', 'Various subscription levels'))
      ])
    ]);
    
    return m('article', [
      m('h2', 'Available Apps'),
      m('div.grid', [
        ...appCards,
        comingSoonCard
      ])
    ]);
  }
};

export default AppsList;
