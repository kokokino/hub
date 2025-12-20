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
