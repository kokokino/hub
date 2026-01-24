import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { isVerifiedUser } from '/imports/utils.js';
import { Products } from '/lib/collections/products';
import { Apps } from '/lib/collections/apps';

/**
 * Find a user's subscription for a specific product by slug
 */
function findSubscriptionForProduct(user, productSlug) {
  const subscriptions = user?.lemonSqueezy?.subscriptions || [];
  return subscriptions.find(sub => sub.kokokinoProductSlug === productSlug);
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
  async 'subscriptions.getStatus'(productSlug) {
    check(productSlug, Match.OneOf(String, null, undefined));

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    const user = await Meteor.users.findOneAsync(this.userId);
    const emailVerified = isVerifiedUser(user);

    // If productSlug is provided, find subscription for that product
    // Otherwise, find any active subscription
    let subscription;
    if (productSlug) {
      subscription = findSubscriptionForProduct(user, productSlug);
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
      kokokinoProductSlug: subscription.kokokinoProductSlug
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
        kokokinoProductSlug: sub.kokokinoProductSlug
      };
    });
  },
  
  // Create checkout session (redirects to Lemon Squeezy)
  async 'subscriptions.createCheckout'(productSlug) {
    check(productSlug, String);

    if (!productSlug) {
      throw new Meteor.Error('no-checkout', 'Must have a product slug to checkout');
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
    const existingSubscription = findSubscriptionForProduct(user, productSlug);
    if (existingSubscription) {
      const validUntil = existingSubscription.validUntil ? new Date(existingSubscription.validUntil) : null;
      if (validUntil && validUntil > new Date()) {
        throw new Meteor.Error('already-subscribed', 'You already have an active subscription for this product');
      }
    }

    // Look up product in our Products collection by slug
    const product = await Products.findOneAsync({ slug: productSlug });
    if (!product) {
      throw new Meteor.Error('product-not-found', 'Product not found');
    } else if (!product.lemonSqueezyBuyLinkId) {
      throw new Meteor.Error('no-checkout', 'Product has no Lemon Squeezy checkout configured');
    }
    
    const storeName = Meteor.settings.private.lemonSqueezy?.storeName || 'kokokino';
    // Lemon Squeezy custom data format: checkout[custom][key]=value
    // Note: We only pass user_id - the product is determined by the buy link
    // The webhook will look up our product using lemonSqueezyProductId from the webhook payload
    const checkoutUrl = `https://${storeName}.lemonsqueezy.com/checkout/buy/${product.lemonSqueezyBuyLinkId}?checkout[email]=${encodeURIComponent(email)}&checkout[custom][user_id]=${this.userId}`;
    
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
      const product = await Products.findOneAsync({ slug: sub.kokokinoProductSlug });
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
