import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Products } from '/lib/collections/products';
import { Apps } from '/lib/collections/apps';

Meteor.publish('currentUser', function() {
  if (!this.userId) return this.ready();
  
  return Meteor.users.find({ _id: this.userId }, {
    fields: {
      'emails': 1,
      'profile': 1,
      'createdAt': 1,
      'lemonSqueezy.customerId': 1,
      'lemonSqueezy.subscriptions': 1
    }
  });
});

Meteor.publish('activeSubscriberCount', async function(productId) {
  check(productId, Match.OneOf(String, null, undefined));
  
  const self = this;
  let count = 0;
  let initializing = true;
  
  // Build query based on whether productId is provided
  let query;
  if (productId) {
    query = {
      'lemonSqueezy.subscriptions': {
        $elemMatch: {
          kokokinoProductId: productId,
          status: 'active',
          validUntil: { $gt: new Date() }
        }
      }
    };
  } else {
    query = {
      'lemonSqueezy.subscriptions': {
        $elemMatch: {
          status: 'active',
          validUntil: { $gt: new Date() }
        }
      }
    };
  }
  
  // Use productId or 'all' as the document ID
  const countId = productId || 'all';
  
  // Observe changes to the active subscribers cursor
  const handle = await Meteor.users.find(query, { fields: { _id: 1 } }).observeChangesAsync({
    added(id) {
      count++;
      if (!initializing) {
        self.changed('subscriberCounts', countId, { count });
      }
    },
    removed(id) {
      count--;
      self.changed('subscriberCounts', countId, { count });
    }
  });
  
  // Send initial count
  initializing = false;
  self.added('subscriberCounts', countId, { count });
  self.ready();
  
  // Clean up observer on unsubscribe
  self.onStop(() => {
    handle.stop();
  });
});

// Add publications for products and apps
Meteor.publish('products', function() {
  // console.log('Products publication called for user:', this.userId);
  const cursor = Products.find({
    isApproved: true,
    isActive: true
  }, {
    sort: { sortOrder: 1 },
    fields: {
      name: 1,
      description: 1,
      sortOrder: 1,
      pricePerMonthUSD: 1,
      lemonSqueezyBuyLinkId: 1,
      isRequired: 1,
      isActive: 1,
      isApproved: 1
    }
  });
  
  return cursor;
});

Meteor.publish('apps', function() {
  // console.log('Apps publication called for user:', this.userId);
  const cursor = Apps.find({
    isApproved: true,
    isActive: true
  }, {
    fields: {
      name: 1,
      description: 1,
      productId: 1,
      spokeId: 1,
      ageRating: 1,
      isActive: 1,
      isApproved: 1
    }
  });
  
  return cursor;
});
