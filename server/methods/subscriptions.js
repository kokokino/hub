import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { isVerifiedUser } from '/imports/utils.js';
import { Products } from '/lib/collections/products';
import { Apps } from '/lib/collections/apps';

/**
 * Find a user's subscription for a specific product
 */
function findSubscriptionForProduct(user, productId) {
  const subscriptions = user?.lemonSqueezy?.subscriptions || [];
  return subscriptions.find(sub => sub.kokokinoProductId === productId);
}

/**
 * Find any active subscription for a user
 */
function findAnyActiveSubscription(user) {
  const subscriptions = user?.lemonSqueezy?.subscriptions || [];
  const now = new Date();
  return subscriptions.find(sub => 
    sub.status === 'active' && 
    sub.validUntil && 
    new Date(sub.validUntil) > now
  );
}

Meteor.methods({
  // Get user's subscription status for a specific product (or any active subscription)
  async 'subscriptions.getStatus'(productId) {
    check(productId, Match.OneOf(String, null, undefined));
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    const user = await Meteor.users.findOneAsync(this.userId);
    const emailVerified = isVerifiedUser(user);
    
    // If productId is provided, find subscription for that product
    // Otherwise, find any active subscription
    let subscription;
    if (productId) {
      subscription = findSubscriptionForProduct(user, productId);
    } else {
      subscription = findAnyActiveSubscription(user);
    }
    
    if (!subscription) {
      return {
        status: 'inactive',
        planName: 'No subscription',
        validUntil: null,
        emailVerified: emailVerified,
        manageUrl: null,
        isValid: false,
        renewsAt: null,
        endsAt: null
      };
    }
    
    // Check if subscription is still valid based on validUntil date
    const now = new Date();
    const validUntilDate = subscription.validUntil ? new Date(subscription.validUntil) : null;
    const isSubscriptionValid = validUntilDate && validUntilDate > now;
    
    return {
      status: subscription.status || 'inactive',
      planName: subscription.productName || 'No subscription',
      validUntil: subscription.validUntil,
      emailVerified: emailVerified,
      manageUrl: subscription.customerPortalUrl || null,
      isValid: isSubscriptionValid,
      renewsAt: subscription.renewsAt,
      endsAt: subscription.endsAt,
      kokokinoProductId: subscription.kokokinoProductId
    };
  },
  
  // Get all subscriptions for the current user
  async 'subscriptions.getAll'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    const user = await Meteor.users.findOneAsync(this.userId);
    const subscriptions = user?.lemonSqueezy?.subscriptions || [];
    const now = new Date();
    
    return subscriptions.map(sub => {
      const validUntilDate = sub.validUntil ? new Date(sub.validUntil) : null;
      const isValid = validUntilDate && validUntilDate > now;
      
      return {
        status: sub.status,
        planName: sub.productName,
        validUntil: sub.validUntil,
        manageUrl: sub.customerPortalUrl,
        isValid: isValid,
        renewsAt: sub.renewsAt,
        endsAt: sub.endsAt,
        kokokinoProductId: sub.kokokinoProductId
      };
    });
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
    
    // Check if user already has an active subscription for this product
    const existingSubscription = findSubscriptionForProduct(user, productId);
    if (existingSubscription) {
      const validUntil = existingSubscription.validUntil ? new Date(existingSubscription.validUntil) : null;
      if (validUntil && validUntil > new Date()) {
        throw new Meteor.Error('already-subscribed', 'You already have an active subscription for this product');
      }
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
    // Note: using snake_case for custom data keys as that's what we extract in webhooks
    const checkoutUrl = `https://${storeName}.lemonsqueezy.com/checkout/buy/${product.lemonSqueezyBuyLinkId}?checkout[email]=${encodeURIComponent(email)}&checkout[custom][user_id]=${this.userId}&checkout[custom][email]=${encodeURIComponent(email)}&checkout[custom][kokokino_product_id]=${encodeURIComponent(productId)}`;
    
    return {
      checkoutUrl: checkoutUrl,
      direct: true // Flag indicating direct URL (not API)
    };
  },

  'products.getAll': async function() {
    return await Products.find({
      isApproved: true,
      isActive: true
    }, {
      sort: { sortOrder: 1 }
    }).fetchAsync();
  },
  
  'products.getApps': async function(productId) {
    check(productId, String);
    return await Apps.find({
      productId: productId,
      isApproved: true,
      isActive: true
    }).fetchAsync();
  },
  
  'products.getById': async function(productId) {
    check(productId, String);
    return await Products.findOneAsync({
      _id: productId,
      isApproved: true,
      isActive: true
    });
  },
  
  // Get user's subscribed products with full product details
  'subscriptions.getUserProducts': async function() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    const user = await Meteor.users.findOneAsync(this.userId);
    const subscriptions = user?.lemonSqueezy?.subscriptions || [];
    const now = new Date();
    
    // Get product details for each subscription
    const results = [];
    for (const sub of subscriptions) {
      const product = await Products.findOneAsync(sub.kokokinoProductId);
      const validUntilDate = sub.validUntil ? new Date(sub.validUntil) : null;
      const isValid = validUntilDate && validUntilDate > now;
      
      results.push({
        subscription: {
          status: sub.status,
          validUntil: sub.validUntil,
          isValid: isValid,
          renewsAt: sub.renewsAt,
          endsAt: sub.endsAt,
          customerPortalUrl: sub.customerPortalUrl
        },
        product: product
      });
    }
    
    return results;
  }
});
