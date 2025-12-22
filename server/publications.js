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
  const POLL_INTERVAL = 5000; // Poll every 5 seconds
  
  // Function to get the current count
  const getCount = async () => {
    return await Meteor.users.countDocuments({
      'subscription.status': 'active',
      'subscription.validUntil': { $gt: new Date() }
    });
  };
  
  // Initial count
  let currentCount = null;
  
  const updateCount = async () => {
    const newCount = await getCount();
    
    if (currentCount === null) {
      // First time - add the document
      currentCount = newCount;
      self.added('subscriberCounts', 'active', { count: currentCount });
    } else if (newCount !== currentCount) {
      // Count changed - update the document
      currentCount = newCount;
      self.changed('subscriberCounts', 'active', { count: currentCount });
    }
  };
  
  // Get initial count and mark ready
  updateCount().then(() => {
    self.ready();
  });
  
  // Set up polling interval
  const intervalHandle = Meteor.setInterval(() => {
    updateCount();
  }, POLL_INTERVAL);
  
  // Clean up on unsubscribe
  self.onStop(() => {
    Meteor.clearInterval(intervalHandle);
  });
});
