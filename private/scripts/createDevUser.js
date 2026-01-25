// Development User Setup Script
// Run: meteor shell < private/scripts/createDevUser.js

(async () => {
  const { Meteor } = require('meteor/meteor');
  const { Accounts } = require('meteor/accounts-base');
  const { Products } = require('/lib/collections/products');

  const DEV_USER = {
    username: 'devuser',
    email: 'devuser@pingme.com',
    password: 'devuser'
  };

  console.log('=== Creating Development User ===\n');

  // Check if base-monthly product exists
  const product = await Products.findOneAsync({ slug: 'base-monthly' });
  if (!product) {
    console.error('ERROR: base-monthly product not found. Run migrations first.');
    return;
  }
  console.log(`Found product: ${product.name}`);

  // Check if devuser already exists
  let user = await Meteor.users.findOneAsync({ username: DEV_USER.username });
  let userId;

  if (user) {
    console.log(`User "${DEV_USER.username}" already exists (ID: ${user._id})`);
    userId = user._id;
  } else {
    console.log(`Creating user "${DEV_USER.username}"...`);
    userId = await Accounts.createUserAsync({
      username: DEV_USER.username,
      email: DEV_USER.email,
      password: DEV_USER.password
    });
    console.log(`Created user with ID: ${userId}`);
  }

  // Build subscription data
  const now = new Date();
  const tenYearsFromNow = new Date(now.getTime() + (10 * 365 * 24 * 60 * 60 * 1000));

  await Meteor.users.updateAsync(userId, {
    $set: {
      'emails.0.verified': true,
      'lemonSqueezy': {
        customerId: 'dev-customer-001',
        lastWebhookReceived: now,
        subscriptions: [{
          subscriptionId: 'dev-subscription-001',
          kokokinoProductSlug: 'base-monthly',
          lemonSqueezyProductId: 'dev-product-id',
          lemonSqueezyVariantId: 'dev-variant-id',
          customerId: 'dev-customer-001',
          productName: product.name,
          variantName: 'Monthly',
          status: 'active',
          validUntil: tenYearsFromNow,
          renewsAt: tenYearsFromNow,
          endsAt: null,
          trialEndsAt: null,
          pause: null,
          customerPortalUrl: null,
          createdAt: now,
          updatedAt: now
        }]
      }
    }
  });

  console.log('\n=== Development User Ready ===');
  console.log(`Username: ${DEV_USER.username}`);
  console.log(`Password: ${DEV_USER.password}`);
  console.log(`Email: ${DEV_USER.email} (verified)`);
  console.log(`Subscription: ${product.name} (active until ${tenYearsFromNow.toDateString()})`);
  console.log('\nYou can now log in at http://localhost:3000');
})();
