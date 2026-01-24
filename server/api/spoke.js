import { Meteor } from 'meteor/meteor';
import { verifySsoToken } from './sso.js';
import { Products } from '../../lib/collections/products.js';

/**
 * Handles POST /api/spoke/validate-token
 * Validates an SSO token and returns user data
 */
export async function handleValidateToken(body, spokeId) {
  const { token } = body;

  if (!token) {
    return { valid: false, error: 'missing_token' };
  }

  // Get the app ID for this spoke
  const spokes = Meteor.settings?.private?.spokes || {};
  const spokeConfig = spokes[spokeId];
  
  if (!spokeConfig) {
    return { valid: false, error: 'unknown_spoke' };
  }

  // Verify the token
  const result = await verifySsoToken(token, spokeId);

  if (!result.valid) {
    return { valid: false, error: result.error };
  }

  // Get fresh user data
  const user = await Meteor.users.findOneAsync(result.payload.userId);
  if (!user) {
    return { valid: false, error: 'user_not_found' };
  }

  // Get active subscriptions with product names
  const subscriptions = await getActiveSubscriptions(user);

  return {
    valid: true,
    userId: user._id,
    username: user.username || user.emails?.[0]?.address?.split('@')[0] || 'user',
    email: user.emails?.[0]?.address,
    emailVerified: user.emails?.[0]?.verified || false,
    subscriptions
  };
}

/**
 * Handles POST /api/spoke/check-subscription
 * Checks if a user has active subscriptions for specific products
 */
export async function handleCheckSubscription(body) {
  const { userId, requiredProductSlugs } = body;

  if (!userId) {
    return { hasAccess: false, error: 'missing_user_id' };
  }

  if (!requiredProductSlugs || !Array.isArray(requiredProductSlugs)) {
    return { hasAccess: false, error: 'missing_required_product_slugs' };
  }

  const user = await Meteor.users.findOneAsync(userId);
  if (!user) {
    return { hasAccess: false, error: 'user_not_found' };
  }

  const subscriptions = await getActiveSubscriptions(user);
  const activeProductSlugs = subscriptions.map(sub => sub.productSlug);

  // Check if user has all required subscriptions
  const hasAccess = requiredProductSlugs.every(productSlug =>
    activeProductSlugs.includes(productSlug)
  );

  return {
    hasAccess,
    subscriptions
  };
}

/**
 * Handles POST /api/spoke/user-info
 * Gets current user information
 */
export async function handleUserInfo(body) {
  const { userId } = body;

  if (!userId) {
    return { error: 'missing_user_id' };
  }

  const user = await Meteor.users.findOneAsync(userId);
  if (!user) {
    return { error: 'user_not_found' };
  }

  const subscriptions = await getActiveSubscriptions(user);

  return {
    userId: user._id,
    username: user.username || user.emails?.[0]?.address?.split('@')[0] || 'user',
    email: user.emails?.[0]?.address,
    emailVerified: user.emails?.[0]?.verified || false,
    subscriptions,
    createdAt: user.createdAt
  };
}

/**
 * Gets a user's active subscriptions with product details
 * @param {Object} user - The user document
 * @returns {Array} - Array of subscription objects with product details
 */
async function getActiveSubscriptions(user) {
  const userSubscriptions = user.lemonSqueezy?.subscriptions || [];
  const now = new Date();

  const activeSubscriptions = [];

  for (const sub of userSubscriptions) {
    // Check if subscription is active
    if (sub.status !== 'active') continue;
    if (!sub.validUntil || new Date(sub.validUntil) <= now) continue;

    // Get product details by slug
    const product = await Products.findOneAsync({ slug: sub.kokokinoProductSlug });

    activeSubscriptions.push({
      productSlug: sub.kokokinoProductSlug,
      productName: product?.name || 'Unknown Product',
      status: sub.status,
      validUntil: sub.validUntil
    });
  }

  return activeSubscriptions;
}
