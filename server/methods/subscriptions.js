import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { isVerifiedUser } from '/imports/utils.js';

Meteor.methods({
  // Get user's subscription status (client-safe)
  async 'subscriptions.getStatus'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    const user = await Meteor.users.findOneAsync(this.userId);
    const subscription = user?.lemonSqueezy?.subscriptions?.[0];
    const emailVerified = isVerifiedUser(user);
    
    return {
      status: subscription?.status || 'inactive',
      planName: subscription?.productName || 'No subscription',
      validUntil: subscription?.renewsAt,
      emailVerified: emailVerified,
      // Use the customer portal URL from Lemon Squeezy webhook data
      manageUrl: subscription?.customerPortalUrl || null
    };
  },
  
  // Create checkout session (redirects to Lemon Squeezy)
  async 'subscriptions.createCheckout'(productId) {
    check(productId, String);
    
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
    
    // In a real implementation, you would call Lemon Squeezy API here
    // For MVP, we'll use direct checkout URLs
    const storeName = Meteor.settings.private.lemonSqueezy?.storeName || 'kokokino';
    // Lemon Squeezy custom data format: checkout[custom][key]=value
    const checkoutUrl = `https://${storeName}.lemonsqueezy.com/checkout/buy/${productId}?checkout[email]=${encodeURIComponent(email)}&checkout[custom][user_id]=${this.userId}&checkout[custom][email]=${encodeURIComponent(email)}`;
    
    return {
      checkoutUrl: checkoutUrl,
      direct: true // Flag indicating direct URL (not API)
    };
  }
});
