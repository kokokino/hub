import m from 'mithril';
import { Tracker } from 'meteor/tracker';
import { Meteor } from 'meteor/meteor';
import { Products } from '/lib/collections/products';
import SubscriptionButton from '/imports/ui/components/SubscriptionButton';
import ProductList from '/imports/ui/components/ProductList';
import AppsList from '/imports/ui/components/AppsList';
import { isVerifiedUser } from '/imports/utils.js';

const HomePage = {
  oninit() {
    this.baseProduct = null;
    this.ready = false;
    
    this.autorun = Tracker.autorun(() => {
      this.ready = Meteor.subscribe('products').ready();
      if (this.ready) {
        // Find the base product (required product)
        this.baseProduct = Products.findOne({ isRequired: true, isActive: true });
        console.log('HomePage: baseProduct:', this.baseProduct);
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
    return m('section', [
      m('h1', 'Welcome to Kokokino Hub'),
      m('p', 'Your central hub for all Kokokino games and applications.'),
      
      m('article', [
        m('h2', 'What is Kokokino?'),
        m('p', 'Kokokino is an open‑source cooperative where creative people write games and learn from each other.'),
        m('p', 'All games are open source but monetized through monthly subscriptions to keep the servers running.')
      ]),
      
      m(ProductList),
      
      m(AppsList)
    ]);
  }
};

export default HomePage;
