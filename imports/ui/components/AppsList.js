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
    
    this.autorun = Tracker.autorun(() => {
      const appsReady = Meteor.subscribe('apps').ready();
      const productsReady = Meteor.subscribe('products').ready();
      this.ready = appsReady && productsReady;
      
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
      
      return m('div', { key: app._id }, [
        m('article', [
          m('h3', app.name),
          m('p', app.description),
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
