import m from 'mithril';
import { Tracker } from 'meteor/tracker';
import { Meteor } from 'meteor/meteor';
import { Products } from '/lib/collections/products';
import SubscriptionButton from './SubscriptionButton';
import SubscriberCount from './SubscriberCount';

const ProductList = {
  oninit() {
    this.ready = false;
    this.products = [];
    
    this.autorun = Tracker.autorun(() => {
      this.ready = Meteor.subscribe('products').ready();
      if (this.ready) {
        this.products = Products.find({
          isApproved: true,
          isActive: true
        }, {
          sort: { sortOrder: 1 }
        }).fetch();
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
      return m('p', 'Loading products...');
    }
    
    if (this.products.length === 0) {
      return m('p', 'No products available.');
    }
    
    return this.products.map(product => 
      m('article', { key: product._id }, [
        m('h2', product.name),
        m('p', product.description),
        m('p', `Price: $${product.pricePerMonthUSD.toFixed(2)}/month`),
        m('p', ['Currently: ', m(SubscriberCount, { productId: product._id })]),
        m(SubscriptionButton, {
          productId: product._id,
          label: 'Subscribe',
          variant: 'primary'
        })
      ])
    );
  }
};

export default ProductList;
