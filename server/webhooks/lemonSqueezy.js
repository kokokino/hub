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
  const { attributes } = data.data;
  const userId = attributes.custom_data?.user_id;
  const email = attributes.custom_data?.email;
  
  let targetUserId = userId;
  
  // If no userId in custom data, try to find by email
  if (!targetUserId && email) {
    const user = await Meteor.users.findOneAsync({ 'emails.address': email });
    if (user) targetUserId = user._id;
  }
  
  if (!targetUserId) {
    console.error('No user found for webhook:', event, attributes.custom_data);
    return;
  }
  
  switch (event) {
    case 'subscription_created':
      await handleSubscriptionCreated(targetUserId, data);
      break;
    case 'subscription_updated':
      await handleSubscriptionUpdated(targetUserId, data);
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

async function handleSubscriptionCreated(userId, data) {
  const { attributes, relationships } = data.data;
  
  const subscriptionData = {
    subscriptionId: data.data.id,
    customerId: relationships.customer.data.id,
    productId: relationships.variant.data.id,
    productName: attributes.product_name,
    status: attributes.status,
    renewsAt: new Date(attributes.renews_at),
    createdAt: new Date(attributes.created_at),
    updatedAt: new Date(attributes.updated_at),
    currentPeriodEndsAt: new Date(attributes.current_period_ends_at)
  };
  
  await Meteor.users.updateAsync(userId, {
    $set: {
      'lemonSqueezy.customerId': relationships.customer.data.id,
      'lemonSqueezy.subscriptions': [subscriptionData],
      'lemonSqueezy.lastWebhookReceived': new Date(),
      'subscription.status': 'active',
      'subscription.planName': subscriptionData.productName,
      'subscription.validUntil': subscriptionData.currentPeriodEndsAt
    }
  });
}

async function handleSubscriptionUpdated(userId, data) {
  const { attributes, relationships } = data.data;
  
  const subscriptionData = {
    subscriptionId: data.data.id,
    customerId: relationships.customer.data.id,
    productId: relationships.variant.data.id,
    productName: attributes.product_name,
    status: attributes.status,
    renewsAt: new Date(attributes.renews_at),
    createdAt: new Date(attributes.created_at),
    updatedAt: new Date(attributes.updated_at),
    currentPeriodEndsAt: new Date(attributes.current_period_ends_at)
  };
  
  await Meteor.users.updateAsync(userId, {
    $set: {
      'lemonSqueezy.lastWebhookReceived': new Date(),
      'subscription.status': attributes.status,
      'subscription.planName': subscriptionData.productName,
      'subscription.validUntil': subscriptionData.currentPeriodEndsAt
    },
    $addToSet: {
      'lemonSqueezy.subscriptions': subscriptionData
    }
  });
}

async function handleSubscriptionCancelled(userId, data) {
  const { attributes } = data.data;
  
  await Meteor.users.updateAsync(userId, {
    $set: {
      'subscription.status': 'cancelled',
      'subscription.validUntil': new Date(attributes.current_period_ends_at),
      'lemonSqueezy.lastWebhookReceived': new Date()
    },
    $pull: {
      'lemonSqueezy.subscriptions': { subscriptionId: data.data.id }
    }
  });
}

async function handleSubscriptionExpired(userId, data) {
  const { attributes } = data.data;
  
  await Meteor.users.updateAsync(userId, {
    $set: {
      'subscription.status': 'expired',
      'subscription.validUntil': new Date(attributes.current_period_ends_at),
      'lemonSqueezy.lastWebhookReceived': new Date()
    },
    $pull: {
      'lemonSqueezy.subscriptions': { subscriptionId: data.data.id }
    }
  });
}
