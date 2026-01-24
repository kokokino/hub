import m from 'mithril';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Mongo } from 'meteor/mongo';

// Client-only collection to receive the count from the publication
const SubscriberCounts = new Mongo.Collection('subscriberCounts');

const SubscriberCount = {
  oninit(vnode) {
    this.count = null;
    this.ready = false;
    this.handle = null;

    // Get productSlug from attrs, or null for overall count
    const productSlug = vnode.attrs.productSlug || null;

    // Subscribe and track the count reactively
    this.computation = Tracker.autorun(() => {
      this.handle = Meteor.subscribe('activeSubscriberCount', productSlug);
      this.ready = this.handle.ready();

      if (this.ready) {
        // The publication publishes to 'subscriberCounts' collection
        // with _id based on productSlug or 'all'
        const countId = productSlug || 'all';
        const doc = SubscriberCounts.findOne(countId);
        this.count = doc ? doc.count : 0;
      }

      m.redraw();
    });
  },
  
  onremove(vnode) {
    if (this.computation) {
      this.computation.stop();
    }
    if (this.handle) {
      this.handle.stop();
    }
  },
  
  view(vnode) {
    if (!this.ready) {
      return m('span', '...');
    }
    
    const label = this.count === 1 ? 'active subscriber' : 'active subscribers';
    return m('span', `${this.count} ${label}`);
  }
};

export default SubscriberCount;
