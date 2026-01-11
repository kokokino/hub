import m from 'mithril';
import { Tracker } from 'meteor/tracker';
import { Meteor } from 'meteor/meteor';
import { Apps } from '/lib/collections/apps';
import { Products } from '/lib/collections/products';

const AppsList = {
  oninit() {
    this.ready = false;
    this.apps = [];
    this.products = {};
    this.baseProduct = null;
    this.user = null;
    this.userSubscriptions = [];
    
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
   */
  handleLaunch(app) {
    alert('Coming soon');
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
      
      return m('div', { key: app._id }, [
        m('article', [
          m('h3', app.name),
          m('p', app.description),
          canLaunch
            ? m('button', {
                onclick: () => this.handleLaunch(app)
              }, 'Launch')
            : m('p', m('small', m('em', launchInstructions))),
          m('footer', m('small', `Included in ${productName}`))
        ])
      ]);
    });
    
    // Add "Coming Soon" card at the end
    const comingSoonCard = m('div', { key: 'coming-soon' }, [
      m('article', [
        m('h3', 'Coming Soon'),
        m('p', 'More games and apps from our community'),
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
