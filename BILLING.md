# Billing Integration Plan: Lemon Squeezy for Kokokino Hub

## Overview
This document outlines the phased approach to implementing subscription billing using Lemon Squeezy for the Kokokino Hub app. The plan prioritizes simplicity and rapid deployment while allowing for future customization.

## Goals
1. **Quick MVP**: Get subscription payments working within a week
2. **Minimal Code**: Leverage Lemon Squeezy's hosted checkout to reduce complexity
3. **Security**: Follow Meteor best practices for user data protection
4. **Scalability**: Design allows for future custom UI implementation

## Architecture Decisions

### Security Model
- **No sensitive data in `user.profile`**: Store subscription data in `user.lemonSqueezy` top-level field
- **Deny all client writes**: `Meteor.users.deny()` prevents users from modifying their subscription data
- **Server-only updates**: All subscription modifications happen via server methods or webhooks
- **Limited client data**: Only publish necessary subscription status to client

### Hybrid Approach
- **Phase 1**: Hosted Lemon Squeezy checkout + webhook processing
- **Phase 2**: Add subscription management dashboard in-app
- **Phase 3**: (Optional) Replace hosted checkout with custom UI

## Phase 1: MVP Implementation (Week 1)

### 1.1 Lemon Squeezy Setup
1. **Create Test Store** at `https://app.lemonsqueezy.com`
2. **Create Products**:
   - Base Subscription: $2/month (Product ID: `base_monthly`)
   - Additional Game Subscriptions (as needed)
3. **Configure Webhooks**:
   - Endpoint: `https://your-app.com/webhooks/lemon-squeezy`
   - Events: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`
4. **Get API Keys**:
   - Store ID
   - API Key
   - Webhook Secret

### 1.2 Server Implementation

#### File: `lib/collections/users.js`
```javascript
import { Meteor } from 'meteor/meteor';

// Deny all client-side updates on Meteor.users for security
Meteor.users.deny({
  insert: () => true,
  update: () => true,
  remove: () => true,
});
```

#### File: `server/publications.js`
```javascript
import { Meteor } from 'meteor/meteor';

Meteor.publish('currentUser', function() {
  if (!this.userId) return this.ready();
  
  return Meteor.users.find({ _id: this.userId }, {
    fields: {
      'emails': 1,
      'profile': 1,
      'subscription.status': 1,
      'subscription.planName': 1,
      'subscription.validUntil': 1,
      'createdAt': 1
    }
  });
});
```

#### File: `server/methods/subscriptions.js`
```javascript
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
  // Get user's subscription status (client-safe)
  'subscriptions.getStatus'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    const user = Meteor.users.findOne(this.userId);
    const subscription = user?.lemonSqueezy?.subscriptions?.[0];
    
    return {
      status: subscription?.status || 'inactive',
      planName: subscription?.productName || 'No subscription',
      validUntil: subscription?.renewsAt,
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
    
    const user = Meteor.users.findOne(this.userId);
    const email = user?.emails?.[0]?.address;
    
    if (!email) {
      throw new Meteor.Error('no-email', 'User has no email address');
    }
    
    // In a real implementation, you would call Lemon Squeezy API here
    // For MVP, we'll use direct checkout URLs
    const storeId = Meteor.settings.private.lemonSqueezy.storeId;
    const checkoutUrl = `https://kokokino.lemonsqueezy.com/checkout/buy/${productId}?checkout[custom][user_id]=${this.userId}&checkout[email]=${encodeURIComponent(email)}`;
    
    return {
      checkoutUrl: checkoutUrl,
      direct: true // Flag indicating direct URL (not API)
    };
  }
});
```

#### File: `server/webhooks/lemonSqueezy.js`
```javascript
import { Meteor } from 'meteor/meteor';
import crypto from 'crypto';
import { WebApp } from 'meteor/webapp';

const WEBHOOK_SECRET = Meteor.settings.private.lemonSqueezyWebhookSecret;

WebApp.connectHandlers.use('/webhooks/lemon-squeezy', async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405);
    return res.end('Method Not Allowed');
  }
  
  let body = '';
  req.on('data', chunk => body += chunk.toString());
  
  req.on('end', async () => {
    try {
      // Verify webhook signature
      const signature = req.headers['x-signature'];
      const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
      const digest = hmac.update(body).digest('hex');
      
      if (signature !== digest) {
        console.error('Invalid webhook signature');
        res.writeHead(401);
        return res.end('Invalid signature');
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

// Similar handlers for updated, expired events
```

### 1.3 Client Implementation

#### File: `imports/ui/components/SubscriptionButton.js`
```javascript
import m from 'mithril';

const SubscriptionButton = {
  oninit(vnode) {
    this.loading = false;
    this.subscription = null;
    
    // Load subscription status
    Meteor.call('subscriptions.getStatus', (error, result) => {
      if (!error) this.subscription = result;
      m.redraw();
    });
  },
  
  view(vnode) {
    const { productId = 'base_monthly', label = 'Subscribe', variant = 'primary' } = vnode.attrs;
    
    // User has active subscription
    if (this.subscription?.status === 'active') {
      return m('div.subscription-status', [
        m('p', [
          m('strong', 'Active: '),
          this.subscription.planName
        ]),
        m('p.small', [
          'Renews: ',
          new Date(this.subscription.validUntil).toLocaleDateString()
        ]),
        this.subscription.manageUrl && m('a', {
          href: this.subscription.manageUrl,
          target: '_blank',
          class: 'button button-outline',
          style: 'margin-top: 0.5rem;'
        }, 'Manage Subscription')
      ]);
    }
    
    // No subscription - show subscribe button
    return m('button', {
      class: `button button-${variant}`,
      disabled: this.loading,
      onclick: async () => {
        this.loading = true;
        m.redraw();
        
        try {
          const result = await Meteor.callAsync('subscriptions.createCheckout', productId);
          window.location.href = result.checkoutUrl;
        } catch (error) {
          console.error('Checkout error:', error);
          alert('Failed to start checkout. Please try again.');
          this.loading = false;
          m.redraw();
        }
      }
    }, this.loading ? 'Loading...' : label);
  }
};

export default SubscriptionButton;
```

#### File: `client/main.js` (Add to existing)
```javascript
// Add to imports
import SubscriptionButton from '/imports/ui/components/SubscriptionButton';

// Add to App component view (where you want subscription button)
m(SubscriptionButton, { productId: 'base_monthly', label: 'Subscribe to Kokokino Hub ($2/month)' })
```

### 1.4 Configuration

#### File: `settings.json` (production)
```json
{
  "public": {
    "appName": "Kokokino Hub"
  },
  "private": {
    "MAIL_URL": "smtp://username:password@smtp.example.com:587",
    "lemonSqueezy": {
      "storeId": "your-store-id",
      "apiKey": "your-api-key",
      "webhookSecret": "your-webhook-secret"
    }
  }
}
```

## Phase 2: Enhanced Dashboard (Week 2-3)

### 2.1 Subscription Management Component
```javascript
// imports/ui/components/SubscriptionDashboard.js
// Shows all subscriptions, billing history, update/cancel options
```

### 2.2 In-App Subscription Management
- Add "Upgrade/Downgrade" options
- Show billing history
- Download invoices
- Cancel with confirmation flow

### 2.3 Email Notifications
- Send confirmation emails for subscription changes
- Renewal reminders
- Payment failure notifications

## Phase 3: Custom Checkout (Month 2+)

### 3.1 Custom Checkout UI
- Replace Lemon Squeezy hosted checkout
- Custom credit card form using Lemon Squeezy Elements
- In-app payment flow

### 3.2 Advanced Features
- Coupon codes
- Gift subscriptions
- Team plans
- Usage-based billing

## Testing Strategy

### Sandbox Testing
1. **Test Store**: Use Lemon Squeezy sandbox mode
2. **Test Cards**:
   - `4242 4242 4242 4242` - Success
   - `4000 0000 0000 0002` - Card declined
   - `4000 0000 0000 0069` - Expired card
3. **Webhook Testing**: Use ngrok for local testing
   ```bash
   ngrok http 3000
   ```

### Test Commands
```bash
# Run with settings
meteor --settings settings.json

# Test webhook locally
curl -X POST https://your-ngrok-url.ngrok.io/webhooks/lemon-squeezy \
  -H "Content-Type: application/json" \
  -H "x-signature: test" \
  -d '{"test": "data"}'
```

## Deployment Checklist

- [ ] Lemon Squeezy store configured
- [ ] Webhook endpoint deployed
- [ ] SSL certificate installed (for webhooks)
- [ ] Settings file configured with API keys
- [ ] Test payments working
- [ ] Email verification integrated
- [ ] Subscription status displaying correctly
- [ ] "Manage Subscription" links working

## Monitoring & Maintenance

1. **Webhook Logs**: Monitor webhook processing
2. **Failed Payments**: Handle dunning management
3. **Customer Support**: Process refunds/cancellations
4. **Tax Compliance**: Update for new regions as needed

## Future Considerations

1. **Multiple Products**: Add game-specific subscriptions
2. **Team Accounts**: Allow team billing
3. **Usage Tracking**: Metered billing for API usage
4. **Affiliate Program**: Referral system

## Emergency Procedures

1. **Payment System Down**: Fallback to manual signup
2. **Webhook Failure**: Manual subscription updates
3. **Data Corruption**: Backup and restore procedures

---

*Last Updated: 2025-12-19*
*Next Review: 2026-01-19*
