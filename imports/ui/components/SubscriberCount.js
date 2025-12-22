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
    
    // Subscribe and track the count reactively
    this.computation = Tracker.autorun(() => {
      const handle = Meteor.subscribe('activeSubscriberCount');
      this.ready = handle.ready();
      
      if (this.ready) {
        const doc = SubscriberCounts.findOne('active');
        this.count = doc ? doc.count : 0;
      }
      
      m.redraw();
    });
  },
  
  onremove(vnode) {
    if (this.computation) {
      this.computation.stop();
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
