import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { createHmac } from 'crypto';

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

async function handleWebhookEvent(event, data) {
  if (!data.data) {
    console.error('No data.data in webhook payload:', event);
    return;
  }
  
  const { attributes } = data.data;

  // Lemon Squeezy puts custom_data in meta, not attributes
  const userId = data.meta?.custom_data?.user_id;
  
  const email = attributes?.user_email;
  
  let targetUserId = userId;
  
  if (!targetUserId) {
    console.error('No user found for webhook:', event);
    return;
  }
  
  switch (event) {
    case 'subscription_created':
      await handleSubscriptionCreated(targetUserId, data);
      break;
    case 'subscription_updated':
      await handleSubscriptionUpdated(targetUserId, data);
      break;
    case 'subscription_paused':
      await handleSubscriptionPaused(targetUserId, data);
      break;
    case 'subscription_unpaused':
    case 'subscription_resumed':
      await handleSubscriptionResumed(targetUserId, data);
      break;
    case 'subscription_payment_failed':
      await handleSubscriptionPaymentFailed(targetUserId, data);
      break;
    case 'subscription_payment_success':
    case 'subscription_payment_recovered':
      await handleSubscriptionPaymentSuccess(targetUserId, data);
      break;
    case 'subscription_payment_refunded':
      // Refunds are informational - log but don't change subscription status
      console.log(`Payment refunded for user ${targetUserId}, subscription ${data.data.id}`);
      await updateLastWebhookReceived(targetUserId);
      break;
    case 'subscription_plan_changed':
      await handleSubscriptionPlanChanged(targetUserId, data);
      break;
    case 'subscription_cancelled':
      await handleSubscriptionCancelled(targetUserId, data);
      break;
    case 'subscription_expired':
      await handleSubscriptionExpired(targetUserId, data);
      break;
    default:
      console.log(`Unhandled webhook event: ${event}`);
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
 */
function buildSubscriptionData(data) {
  const { attributes } = data.data;
  const subscriptionId = data.data.id;
  
  return {
    subscriptionId: subscriptionId,
    customerId: attributes.customer_id,
    productId: attributes.product_id,
    variantId: attributes.variant_id,
    productName: attributes.product_name,
    variantName: attributes.variant_name,
    status: attributes.status,
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
 */
async function upsertSubscription(userId, subscriptionData, topLevelFields) {
  const subscriptionId = subscriptionData.subscriptionId;
  
  // First, try to update existing subscription
  const updateResult = await Meteor.users.updateAsync(
    { _id: userId, 'lemonSqueezy.subscriptions.subscriptionId': subscriptionId },
    {
      $set: {
        'lemonSqueezy.lastWebhookReceived': new Date(),
        'lemonSqueezy.subscriptions.$': subscriptionData,
        ...topLevelFields
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
          'lemonSqueezy.lastWebhookReceived': new Date(),
          ...topLevelFields
        },
        $push: {
          'lemonSqueezy.subscriptions': subscriptionData
        }
      }
    );
  }
}

/**
 * Handle subscription_created event
 * New subscription - typically status is "active" or "on_trial"
 */
async function handleSubscriptionCreated(userId, data) {
  const { attributes } = data.data;
  const subscriptionData = buildSubscriptionData(data);
  const validUntil = determineValidUntil(attributes);
  
  await Meteor.users.updateAsync(userId, {
    $set: {
      'lemonSqueezy.customerId': subscriptionData.customerId,
      'lemonSqueezy.subscriptions': [subscriptionData],
      'lemonSqueezy.lastWebhookReceived': new Date(),
      'subscription.status': attributes.status,
      'subscription.planName': subscriptionData.productName,
      'subscription.validUntil': validUntil
    }
  });
}

/**
 * Handle subscription_updated event
 * General update - could be any change to the subscription
 */
async function handleSubscriptionUpdated(userId, data) {
  const { attributes } = data.data;
  const subscriptionData = buildSubscriptionData(data);
  const validUntil = determineValidUntil(attributes);
  
  await upsertSubscription(userId, subscriptionData, {
    'subscription.status': attributes.status,
    'subscription.planName': subscriptionData.productName,
    'subscription.validUntil': validUntil
  });
}

/**
 * Handle subscription_paused event
 * Subscription is paused - renews_at is null, pause.resumes_at may have a date
 */
async function handleSubscriptionPaused(userId, data) {
  const { attributes } = data.data;
  const subscriptionData = buildSubscriptionData(data);
  
  // For paused subscriptions, validUntil is when it resumes (or null for indefinite pause)
  const validUntil = attributes.pause?.resumes_at 
    ? new Date(attributes.pause.resumes_at) 
    : null;
  
  await upsertSubscription(userId, subscriptionData, {
    'subscription.status': 'paused',
    'subscription.planName': subscriptionData.productName,
    'subscription.validUntil': validUntil
  });
}

/**
 * Handle subscription_unpaused and subscription_resumed events
 * Subscription is active again - renews_at should have a value
 */
async function handleSubscriptionResumed(userId, data) {
  const { attributes } = data.data;
  const subscriptionData = buildSubscriptionData(data);
  const validUntil = determineValidUntil(attributes);
  
  await upsertSubscription(userId, subscriptionData, {
    'subscription.status': 'active',
    'subscription.planName': subscriptionData.productName,
    'subscription.validUntil': validUntil
  });
}

/**
 * Handle subscription_payment_failed event
 * Payment failed - status is typically "past_due" or "unpaid"
 */
async function handleSubscriptionPaymentFailed(userId, data) {
  const { attributes } = data.data;
  const subscriptionData = buildSubscriptionData(data);
  const validUntil = determineValidUntil(attributes);
  
  // Use the status from Lemon Squeezy (past_due, unpaid, etc.)
  await upsertSubscription(userId, subscriptionData, {
    'subscription.status': attributes.status,
    'subscription.planName': subscriptionData.productName,
    'subscription.validUntil': validUntil
  });
}

/**
 * Handle subscription_payment_success and subscription_payment_recovered events
 * Payment succeeded - subscription should be active
 */
async function handleSubscriptionPaymentSuccess(userId, data) {
  const { attributes } = data.data;
  const subscriptionData = buildSubscriptionData(data);
  const validUntil = determineValidUntil(attributes);
  
  await upsertSubscription(userId, subscriptionData, {
    'subscription.status': attributes.status, // Should be 'active'
    'subscription.planName': subscriptionData.productName,
    'subscription.validUntil': validUntil
  });
}

/**
 * Handle subscription_plan_changed event
 * Plan changed - product_id, product_name, variant_id may be different
 */
async function handleSubscriptionPlanChanged(userId, data) {
  const { attributes } = data.data;
  const subscriptionData = buildSubscriptionData(data);
  const validUntil = determineValidUntil(attributes);
  
  await upsertSubscription(userId, subscriptionData, {
    'subscription.status': attributes.status,
    'subscription.planName': subscriptionData.productName,
    'subscription.validUntil': validUntil
  });
}

/**
 * Handle subscription_cancelled event
 * Subscription cancelled - ends_at indicates when access ends
 * User retains access until ends_at (end of current billing period)
 */
async function handleSubscriptionCancelled(userId, data) {
  const { attributes } = data.data;
  const subscriptionData = buildSubscriptionData(data);
  
  // ends_at is when the subscription actually ends (end of current period)
  const validUntil = attributes.ends_at ? new Date(attributes.ends_at) : null;
  
  // Update the subscription in the array (don't remove it yet - user still has access)
  await upsertSubscription(userId, subscriptionData, {
    'subscription.status': 'cancelled',
    'subscription.planName': subscriptionData.productName,
    'subscription.validUntil': validUntil
  });
}

/**
 * Handle subscription_expired event
 * Subscription has expired - access should be revoked
 */
async function handleSubscriptionExpired(userId, data) {
  const { attributes } = data.data;
  const subscriptionId = data.data.id;
  
  // Remove the subscription from the array since it's expired
  await Meteor.users.updateAsync(userId, {
    $set: {
      'subscription.status': 'expired',
      'subscription.validUntil': attributes.ends_at ? new Date(attributes.ends_at) : null,
      'lemonSqueezy.lastWebhookReceived': new Date()
    },
    $pull: {
      'lemonSqueezy.subscriptions': { subscriptionId: subscriptionId }
    }
  });
}
