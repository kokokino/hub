import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { createHmac } from 'crypto';
import { Products } from '/lib/collections/products';

const WEBHOOK_SECRET = Meteor.settings.private?.lemonSqueezy?.lemonSqueezyWebhookSecret;
if (!WEBHOOK_SECRET) {
  console.warn('Lemon Squeezy webhook secret not configured. Webhooks will not be verified.');
}

WebApp.connectHandlers.use('/webhooks/lemon-squeezy', async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405);
    return res.end('Method Not Allowed');
  }
  
  let body = '';
  req.on('data', chunk => body += chunk.toString());
  
  req.on('end', async () => {
    try {
      // Verify webhook signature if secret is configured
      if (WEBHOOK_SECRET) {
        const signature = req.headers['x-signature'];
        const hmac = createHmac('sha256', WEBHOOK_SECRET);
        const digest = hmac.update(body).digest('hex');
        
        if (signature !== digest) {
          console.error('Invalid webhook signature');
          res.writeHead(401);
          return res.end('Invalid signature');
        }
      } else {
        console.warn('Webhook secret not configured, skipping signature verification');
      }
      
      const data = JSON.parse(body);
      const event = req.headers['x-event-name'];
      
      await handleWebhookEvent(event, data);
      
      res.writeHead(200);
      res.end('Webhook processed');
    } catch (error) {
      console.error('Webhook error:', error);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  });
});

// Events that are payment/invoice events (data object is Subscription Invoice, not Subscription)
const PAYMENT_EVENTS = [
  'subscription_payment_success',
  'subscription_payment_failed',
  'subscription_payment_recovered',
  'subscription_payment_refunded'
];

async function handleWebhookEvent(event, data) {
  if (!data.data) {
    console.error('No data.data in webhook payload:', event);
    return;
  }
  
  const { attributes } = data.data;

  // Lemon Squeezy puts custom_data in meta, not attributes
  const customData = data.meta?.custom_data || {};
  const userId = customData.user_id;
  
  if (!userId) {
    console.error('No user_id found in webhook custom_data:', event);
    return;
  }
  
  // For payment events, the data object is a Subscription Invoice, not a Subscription
  // It doesn't have product_id, so we need to look up the subscription by subscription_id
  if (PAYMENT_EVENTS.includes(event)) {
    await handlePaymentEvent(event, userId, data);
    return;
  }
  
  // For subscription events, look up our product using the Lemon Squeezy product ID
  // This is the authoritative source - not user-controllable
  const lemonSqueezyProductId = String(attributes.product_id);
  const kokokinoProduct = await Products.findOneAsync({ lemonSqueezyProductId: lemonSqueezyProductId });
  
  if (!kokokinoProduct) {
    console.error(`No Kokokino product found for Lemon Squeezy product ID: ${lemonSqueezyProductId}`, event);
    return;
  }
  
  const kokokinoProductId = kokokinoProduct._id;
  
  switch (event) {
    case 'subscription_created':
      await handleSubscriptionCreated(userId, data, kokokinoProductId);
      break;
    case 'subscription_updated':
      await handleSubscriptionUpdated(userId, data, kokokinoProductId);
      break;
    case 'subscription_paused':
      await handleSubscriptionPaused(userId, data, kokokinoProductId);
      break;
    case 'subscription_unpaused':
    case 'subscription_resumed':
      await handleSubscriptionResumed(userId, data, kokokinoProductId);
      break;
    case 'subscription_plan_changed':
      await handleSubscriptionPlanChanged(userId, data, kokokinoProductId);
      break;
    case 'subscription_cancelled':
      await handleSubscriptionCancelled(userId, data, kokokinoProductId);
      break;
    case 'subscription_expired':
      await handleSubscriptionExpired(userId, data, kokokinoProductId);
      break;
    default:
      console.log(`Unhandled webhook event: ${event}`);
  }
}

/**
 * Handle payment events (subscription_payment_success, subscription_payment_failed, etc.)
 * These events have a Subscription Invoice as the data object, not a Subscription
 * We look up the existing subscription by subscription_id to find the kokokinoProductId
 */
async function handlePaymentEvent(event, userId, data) {
  const { attributes } = data.data;
  
  // Subscription Invoice has subscription_id to link back to the subscription
  const subscriptionId = String(attributes.subscription_id);
  
  if (!subscriptionId) {
    console.error(`No subscription_id in payment event: ${event}`);
    return;
  }
  
  // Find the user and their subscription by subscriptionId
  const user = await Meteor.users.findOneAsync({
    _id: userId,
    'lemonSqueezy.subscriptions.subscriptionId': subscriptionId
  });
  
  if (!user) {
    console.error(`No subscription found for user ${userId} with subscriptionId ${subscriptionId}`);
    await updateLastWebhookReceived(userId);
    return;
  }
  
  const existingSubscription = user.lemonSqueezy.subscriptions.find(
    sub => sub.subscriptionId === subscriptionId
  );
  
  if (!existingSubscription) {
    console.error(`Subscription ${subscriptionId} not found in user's subscriptions`);
    await updateLastWebhookReceived(userId);
    return;
  }
  
  const kokokinoProductId = existingSubscription.kokokinoProductId;
  
  switch (event) {
    case 'subscription_payment_success':
    case 'subscription_payment_recovered':
      // Payment succeeded - update timestamp, subscription status should be updated via subscription_updated event
      console.log(`Payment success for user ${userId}, subscription ${subscriptionId}, product ${kokokinoProductId}`);
      await updateLastWebhookReceived(userId);
      break;
    case 'subscription_payment_failed':
      // Payment failed - log it, subscription status should be updated via subscription_updated event
      console.log(`Payment failed for user ${userId}, subscription ${subscriptionId}, product ${kokokinoProductId}`);
      await updateLastWebhookReceived(userId);
      break;
    case 'subscription_payment_refunded':
      // Refund is informational
      console.log(`Payment refunded for user ${userId}, subscription ${subscriptionId}, product ${kokokinoProductId}`);
      await updateLastWebhookReceived(userId);
      break;
  }
}

/**
 * Helper to update the lastWebhookReceived timestamp
 */
async function updateLastWebhookReceived(userId) {
  await Meteor.users.updateAsync(userId, {
    $set: {
      'lemonSqueezy.lastWebhookReceived': new Date()
    }
  });
}

/**
 * Build subscription data object from webhook attributes
 * New structure stores subscriptions with kokokinoProductId as the key identifier
 */
function buildSubscriptionData(data, kokokinoProductId) {
  const { attributes } = data.data;
  const subscriptionId = data.data.id;
  
  // Calculate validUntil based on subscription status and attributes
  const validUntil = determineValidUntil(attributes);
  
  return {
    subscriptionId: String(subscriptionId),
    kokokinoProductId: kokokinoProductId,
    lemonSqueezyProductId: String(attributes.product_id),
    lemonSqueezyVariantId: String(attributes.variant_id),
    customerId: String(attributes.customer_id),
    productName: attributes.product_name,
    variantName: attributes.variant_name,
    status: attributes.status,
    validUntil: validUntil,
    renewsAt: attributes.renews_at ? new Date(attributes.renews_at) : null,
    endsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
    trialEndsAt: attributes.trial_ends_at ? new Date(attributes.trial_ends_at) : null,
    // Pause information - Lemon Squeezy nests this in a 'pause' object
    pause: attributes.pause ? {
      mode: attributes.pause.mode,
      resumesAt: attributes.pause.resumes_at ? new Date(attributes.pause.resumes_at) : null
    } : null,
    // Customer portal URL for managing the subscription
    customerPortalUrl: attributes.urls?.customer_portal || null,
    createdAt: attributes.created_at ? new Date(attributes.created_at) : new Date(),
    updatedAt: attributes.updated_at ? new Date(attributes.updated_at) : new Date()
  };
}

/**
 * Determine the validUntil date based on subscription status and attributes
 */
function determineValidUntil(attributes) {
  const status = attributes.status;
  
  // For paused subscriptions, use resumes_at from pause object
  if (status === 'paused' && attributes.pause?.resumes_at) {
    return new Date(attributes.pause.resumes_at);
  }
  
  // For cancelled subscriptions, use ends_at (when access actually ends)
  if (status === 'cancelled' && attributes.ends_at) {
    return new Date(attributes.ends_at);
  }
  
  // For expired subscriptions, use ends_at
  if (status === 'expired' && attributes.ends_at) {
    return new Date(attributes.ends_at);
  }
  
  // For trial subscriptions, use trial_ends_at if renews_at is not set
  if (status === 'on_trial') {
    if (attributes.renews_at) {
      return new Date(attributes.renews_at);
    }
    if (attributes.trial_ends_at) {
      return new Date(attributes.trial_ends_at);
    }
  }
  
  // Default: use renews_at for active, past_due, unpaid subscriptions
  if (attributes.renews_at) {
    return new Date(attributes.renews_at);
  }
  
  return null;
}

/**
 * Update or insert subscription in user's subscriptions array
 * Subscriptions are keyed by kokokinoProductId - one subscription per product per user
 */
async function upsertSubscription(userId, subscriptionData) {
  const kokokinoProductId = subscriptionData.kokokinoProductId;
  
  if (!kokokinoProductId) {
    console.error('Cannot upsert subscription without kokokinoProductId');
    return;
  }
  
  // First, try to update existing subscription for this product
  const updateResult = await Meteor.users.updateAsync(
    { _id: userId, 'lemonSqueezy.subscriptions.kokokinoProductId': kokokinoProductId },
    {
      $set: {
        'lemonSqueezy.customerId': subscriptionData.customerId,
        'lemonSqueezy.lastWebhookReceived': new Date(),
        'lemonSqueezy.subscriptions.$': subscriptionData
      }
    }
  );
  
  // If no document was updated, the subscription doesn't exist yet - add it
  if (updateResult === 0) {
    await Meteor.users.updateAsync(
      { _id: userId },
      {
        $set: {
          'lemonSqueezy.customerId': subscriptionData.customerId,
          'lemonSqueezy.lastWebhookReceived': new Date()
        },
        $push: {
          'lemonSqueezy.subscriptions': subscriptionData
        }
      }
    );
  }
}

/**
 * Remove a subscription from user's subscriptions array by kokokinoProductId
 */
async function removeSubscription(userId, kokokinoProductId) {
  if (!kokokinoProductId) {
    console.error('Cannot remove subscription without kokokinoProductId');
    return;
  }
  
  await Meteor.users.updateAsync(userId, {
    $set: {
      'lemonSqueezy.lastWebhookReceived': new Date()
    },
    $pull: {
      'lemonSqueezy.subscriptions': { kokokinoProductId: kokokinoProductId }
    }
  });
}

/**
 * Handle subscription_created event
 * New subscription - typically status is "active" or "on_trial"
 */
async function handleSubscriptionCreated(userId, data, kokokinoProductId) {
  const subscriptionData = buildSubscriptionData(data, kokokinoProductId);
  await upsertSubscription(userId, subscriptionData);
  console.log(`Subscription created for user ${userId}, product ${kokokinoProductId}, status: ${subscriptionData.status}`);
}

/**
 * Handle subscription_updated event
 * General update - could be any change to the subscription
 */
async function handleSubscriptionUpdated(userId, data, kokokinoProductId) {
  const subscriptionData = buildSubscriptionData(data, kokokinoProductId);
  await upsertSubscription(userId, subscriptionData);
  console.log(`Subscription updated for user ${userId}, product ${kokokinoProductId}, status: ${subscriptionData.status}`);
}

/**
 * Handle subscription_paused event
 * Subscription is paused - renews_at is null, pause.resumes_at may have a date
 */
async function handleSubscriptionPaused(userId, data, kokokinoProductId) {
  const subscriptionData = buildSubscriptionData(data, kokokinoProductId);
  await upsertSubscription(userId, subscriptionData);
  console.log(`Subscription paused for user ${userId}, product ${kokokinoProductId}`);
}

/**
 * Handle subscription_unpaused and subscription_resumed events
 * Subscription is active again - renews_at should have a value
 */
async function handleSubscriptionResumed(userId, data, kokokinoProductId) {
  const subscriptionData = buildSubscriptionData(data, kokokinoProductId);
  await upsertSubscription(userId, subscriptionData);
  console.log(`Subscription resumed for user ${userId}, product ${kokokinoProductId}`);
}

/**
 * Handle subscription_plan_changed event
 * Plan changed - product_id, product_name, variant_id may be different
 */
async function handleSubscriptionPlanChanged(userId, data, kokokinoProductId) {
  const subscriptionData = buildSubscriptionData(data, kokokinoProductId);
  await upsertSubscription(userId, subscriptionData);
  console.log(`Subscription plan changed for user ${userId}, product ${kokokinoProductId}`);
}

/**
 * Handle subscription_cancelled event
 * Subscription cancelled - ends_at indicates when access ends
 * User retains access until ends_at (end of current billing period)
 */
async function handleSubscriptionCancelled(userId, data, kokokinoProductId) {
  const subscriptionData = buildSubscriptionData(data, kokokinoProductId);
  await upsertSubscription(userId, subscriptionData);
  console.log(`Subscription cancelled for user ${userId}, product ${kokokinoProductId}, ends at: ${subscriptionData.endsAt}`);
}

/**
 * Handle subscription_expired event
 * Subscription has expired - access should be revoked
 */
async function handleSubscriptionExpired(userId, data, kokokinoProductId) {
  // Remove the subscription from the array since it's expired
  await removeSubscription(userId, kokokinoProductId);
  console.log(`Subscription expired and removed for user ${userId}, product ${kokokinoProductId}`);
}
