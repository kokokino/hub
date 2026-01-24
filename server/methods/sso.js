import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { generateSsoToken } from '../api/sso.js';
import { Apps } from '../../lib/collections/apps.js';
import { Products } from '../../lib/collections/products.js';

Meteor.methods({
  /**
   * Generates an SSO token for launching a spoke app
   * @param {string} appId - The app's _id from the Apps collection
   * @returns {Object} - { token, redirectUrl }
   */
  async 'sso.generateToken'(appId) {
    check(appId, String);

    // Must be logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    // Get the app
    const app = await Apps.findOneAsync(appId);
    if (!app) {
      throw new Meteor.Error('not-found', 'App not found');
    }

    // Check if app has a spoke URL configured
    // First check the app document, then fall back to settings
    let spokeUrl = app.spokeUrl;
    let spokeId = app.spokeId;

    if (!spokeUrl || !spokeId) {
      // Try to get from settings
      const spokes = Meteor.settings?.private?.spokes || {};
      
      // Find spoke by matching app name or ID
      for (const [id, config] of Object.entries(spokes)) {
        if (id === app.spokeId || config.appId === app._id) {
          spokeId = id;
          spokeUrl = config.url;
          break;
        }
      }
    }

    if (!spokeUrl || !spokeId) {
      throw new Meteor.Error('not-configured', 'This app is not configured for SSO launch');
    }

    // Check user has required subscriptions
    const user = await Meteor.users.findOneAsync(this.userId);
    const userSubscriptions = user?.lemonSqueezy?.subscriptions || [];
    const now = new Date();

    // Get base product
    const baseProduct = await Products.findOneAsync({ isRequired: true, isActive: true });
    
    // Check base subscription
    if (baseProduct) {
      const hasBase = userSubscriptions.some(sub =>
        sub.kokokinoProductSlug === baseProduct.slug &&
        sub.status === 'active' &&
        sub.validUntil &&
        new Date(sub.validUntil) > now
      );

      if (!hasBase) {
        throw new Meteor.Error('subscription-required', 'Base subscription required');
      }
    }

    // Check app-specific subscription if different from base
    if (app.productId && app.productId !== baseProduct?._id) {
      const appProduct = await Products.findOneAsync(app.productId);
      const hasAppSub = userSubscriptions.some(sub =>
        sub.kokokinoProductSlug === appProduct?.slug &&
        sub.status === 'active' &&
        sub.validUntil &&
        new Date(sub.validUntil) > now
      );

      if (!hasAppSub) {
        const product = await Products.findOneAsync(app.productId);
        throw new Meteor.Error('subscription-required', 
          `Subscription to ${product?.name || 'this product'} required`);
      }
    }

    // Generate the SSO token
    const { token } = await generateSsoToken(this.userId, spokeId, spokeUrl);

    // Build redirect URL
    const redirectUrl = `${spokeUrl}/sso?token=${encodeURIComponent(token)}`;

    return { token, redirectUrl };
  }
});
