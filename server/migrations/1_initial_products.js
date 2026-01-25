console.log('=== LOADING MIGRATION 1_initial_products.js ===');

import { Migrations } from 'meteor/quave:migrations';
import { Products } from '/lib/collections/products';
import { Apps } from '/lib/collections/apps';

// Register the migration
Migrations.add({
  version: 1,
  name: 'Create initial base product and apps',
  up: async function() {
    console.log('=== RUNNING MIGRATION 1: Create initial base product and apps ===');

    // Read Lemon Squeezy configuration from settings
    const lsBaseProductId = Meteor.settings?.private?.lemonSqueezy?.LS_BASE_PRODUCT_ID;
    const lsBuyLinkId = Meteor.settings?.private?.lemonSqueezy?.LS_BASE_BUY_LINK_ID;

    // Validate configuration exists and is reasonable
    if (!lsBaseProductId || lsBaseProductId.length <= 3) {
      throw new Error('Migration 1 failed: LS_BASE_PRODUCT_ID is not set or is too short in Meteor.settings.private.lemonSqueezy');
    }
    if (!lsBuyLinkId || lsBuyLinkId.length <= 3) {
      throw new Error('Migration 1 failed: LS_BASE_BUY_LINK_ID is not set or is too short in Meteor.settings.private.lemonSqueezy');
    }

    // Check if base product already exists
    const existingProduct = await Products.findOneAsync({ name: 'Base Monthly' });
    if (existingProduct) {
      console.log('Base product already exists, skipping migration');
      return;
    }

    // Create Base Monthly Product
    const baseProductId = await Products.insertAsync({
      name: 'Base Monthly',
      description: 'Access to fundamental apps and games including Backlog Beacon',
      sortOrder: 0,
      pricePerMonthUSD: 2.00,
      lemonSqueezyProductId: lsBaseProductId,
      lemonSqueezyBuyLinkId: lsBuyLinkId, 
      isApproved: true,
      isRequired: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system'
    });

    console.log('✓ Created base product with ID:', baseProductId);

    // Create Skeleton App
    await Apps.insertAsync({
      name: 'Spoke App Skeleton',
      description: 'Make your own app starter template and general chat room',
      productId: baseProductId,
      spokeId: 'spoke_app_skeleton',
      ageRating: 'E',
      isApproved: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system'
    });

    console.log('✓ Created Spoke App Skeleton');

    // Create Backlog Beacon App
    await Apps.insertAsync({
      name: 'Backlog Beacon',
      description: 'Track your personal video game collection',
      productId: baseProductId,
      spokeId: 'backlog_beacon',
      ageRating: 'E',
      isApproved: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system'
    });

    console.log('✓ Created Backlog Beacon app');
    
    console.log('✓ Migration 1 completed successfully');
  },
  down: async function() {
    console.log('Rolling back migration 1');
    // Rollback if needed
    await Products.removeAsync({});
    await Apps.removeAsync({});
  }
});
