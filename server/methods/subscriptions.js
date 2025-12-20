import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
  // Get user's subscription status (client-safe)
  async 'subscriptions.getStatus'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    const user = await Meteor.users.findOneAsync(this.userId);
    const subscription = user?.lemonSqueezy?.subscriptions?.[0];
    const emailVerified = user?.emails?.[0]?.verified || false;
    
    return {
      status: subscription?.status || 'inactive',
      planName: subscription?.productName || 'No subscription',
      validUntil: subscription?.renewsAt,
      emailVerified: emailVerified,
      // Link to Lemon Squeezy customer portal for management
      manageUrl: user?.lemonSqueezy?.customerId 
        ? `https://app.lemonsqueezy.com/my-orders/${user.lemonSqueezy.customerId}`
        : null
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
    const emailVerified = user?.emails?.[0]?.verified;
    
    if (!email) {
      throw new Meteor.Error('no-email', 'User has no email address');
    }
    
    // Check if email is verified
    if (!emailVerified) {
      throw new Meteor.Error('email-not-verified', 'Please verify your email address before subscribing');
    }
    
    // In a real implementation, you would call Lemon Squeezy API here
    // For MVP, we'll use direct checkout URLs
    const storeName = Meteor.settings.private.lemonSqueezy?.storeName || 'kokokino';
    const checkoutUrl = `https://${storeName}.lemonsqueezy.com/checkout/buy/${productId}?checkout[custom][user_id]=${this.userId}&checkout[email]=${encodeURIComponent(email)}`;
    
    return {
      checkoutUrl: checkoutUrl,
      direct: true // Flag indicating direct URL (not API)
    };
  }
});
