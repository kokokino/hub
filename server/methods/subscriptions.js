import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { isVerifiedUser } from '/imports/utils.js';
import { Products } from '/lib/collections/products';
import { Apps } from '/lib/collections/apps';

Meteor.methods({
  // Get user's subscription status (client-safe)
  async 'subscriptions.getStatus'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    const user = await Meteor.users.findOneAsync(this.userId);
    const subscription = user?.lemonSqueezy?.subscriptions?.[0];
    const emailVerified = isVerifiedUser(user);
    
    // Get validUntil from user.subscription.validUntil (set by webhooks)
    // If not found there, try to get it from the subscription object
    const validUntil = user?.subscription?.validUntil || subscription?.validUntil;
    const validUntilDate = validUntil ? new Date(validUntil) : null;
    
    // Check if subscription is still valid based on validUntil date
    const now = new Date();
    const isSubscriptionValid = validUntilDate && validUntilDate > now;
    
    return {
      status: subscription?.status || 'inactive',
      planName: subscription?.productName || 'No subscription',
      validUntil: validUntil,
      emailVerified: emailVerified,
      // Use the customer portal URL from Lemon Squeezy webhook data
      manageUrl: subscription?.customerPortalUrl || null,
      // Add a flag to indicate if subscription is currently valid
      isValid: isSubscriptionValid,
      // Include additional fields for debugging
      renewsAt: subscription?.renewsAt,
      endsAt: subscription?.endsAt
    };
  },
  
  // Create checkout session (redirects to Lemon Squeezy)
  async 'subscriptions.createCheckout'(productId) {
    check(productId, String);
    
    if (!productId) {
      throw new Meteor.Error('no-checkout', 'Must have a product id to checkout');
    }

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    const user = await Meteor.users.findOneAsync(this.userId);
    const email = user?.emails?.[0]?.address;
    
    if (!email) {
      throw new Meteor.Error('no-email', 'User has no email address');
    }
    
    // Check if email is verified using the utility function
    if (!isVerifiedUser(user)) {
      throw new Meteor.Error('email-not-verified', 'Please verify your email address before subscribing');
    }
    
    // Look up product in our Products collection
    const product = await Products.findOneAsync(productId);
    if (!product) {
      throw new Meteor.Error('product-not-found', 'Product not found');
    } else if (!product.lemonSqueezyBuyLinkId) {
      throw new Meteor.Error('no-checkout', 'Product has no Lemon Squeezy checkout configured');
    }
    
    const storeName = Meteor.settings.private.lemonSqueezy?.storeName || 'kokokino';
    // Lemon Squeezy custom data format: checkout[custom][key]=value
    const checkoutUrl = `https://${storeName}.lemonsqueezy.com/checkout/buy/${product.lemonSqueezyBuyLinkId}?checkout[email]=${encodeURIComponent(email)}&checkout[custom][user_id]=${this.userId}&checkout[custom][email]=${encodeURIComponent(email)}&checkout[custom][kokokinoProductId]=${encodeURIComponent(productId)}`;
    
    return {
      checkoutUrl: checkoutUrl,
      direct: true // Flag indicating direct URL (not API)
    };
  },

  'products.getAll': function() {
    return Products.find({
      isApproved: true,
      isActive: true
    }, {
      sort: { sortOrder: 1 }
    }).fetch();
  },
  'products.getApps': function(productId) {
    check(productId, String);
    return Apps.find({
      _id: productId,
      isApproved: true,
      isActive: true
    }).fetch();
  },
  'products.getById': async function(productId) {
    check(productId, String);
    return await Products.findOneAsync({
      _id: productId,
      isApproved: true,
      isActive: true
    });
  }
});
