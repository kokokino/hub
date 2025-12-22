import { Meteor } from 'meteor/meteor';

Meteor.publish('currentUser', function() {
  if (!this.userId) return this.ready();
  
  return Meteor.users.find({ _id: this.userId }, {
    fields: {
      'emails': 1,
      'profile': 1,
      'subscription.status': 1,
      'subscription.planName': 1,
      'subscription.validUntil': 1,
      'createdAt': 1,
      'lemonSqueezy.customerId': 1,
      'lemonSqueezy.subscriptions': 1
    }
  });
});

Meteor.publish('activeSubscriberCount', function() {
  const self = this;
  let count = 0;
  let initializing = true;
  
  const query = {
    'subscription.status': 'active',
    'subscription.validUntil': { $gt: new Date() }
  };
  
  // Observe changes to the active subscribers cursor
  const handle = Meteor.users.find(query, { fields: { _id: 1 } }).observeChanges({
    added(id) {
      count++;
      if (!initializing) {
        self.changed('subscriberCounts', 'active', { count });
      }
    },
    removed(id) {
      count--;
      self.changed('subscriberCounts', 'active', { count });
    }
  });
  
  // Send initial count
  initializing = false;
  self.added('subscriberCounts', 'active', { count });
  self.ready();
  
  // Clean up observer on unsubscribe
  self.onStop(() => {
    handle.stop();
  });
});
