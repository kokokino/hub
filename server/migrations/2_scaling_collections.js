console.log('=== LOADING MIGRATION 2_scaling_collections.js ===');

import { Migrations } from 'meteor/quave:migrations';
import { RateLimits } from '/lib/collections/rateLimits';
import { CronLocks } from '/lib/collections/cronLocks';
import { ProcessedWebhooks } from '/lib/collections/processedWebhooks';

// Register the migration
Migrations.add({
  version: 2,
  name: 'Create indexes for scaling collections',
  up: async function() {
    console.log('=== RUNNING MIGRATION 2: Create indexes for scaling collections ===');

    // Get raw MongoDB collections for index creation
    const rateLimitsRaw = RateLimits.rawCollection();
    const cronLocksRaw = CronLocks.rawCollection();
    const processedWebhooksRaw = ProcessedWebhooks.rawCollection();

    // RateLimits indexes
    // TTL index on expiresAt - auto-deletes documents after they expire
    await rateLimitsRaw.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: 'rateLimits_expiresAt_ttl' }
    );
    console.log('✓ Created TTL index on rateLimits.expiresAt');

    // Compound index for efficient querying by spokeId and timestamp
    await rateLimitsRaw.createIndex(
      { spokeId: 1, timestamp: 1 },
      { name: 'rateLimits_spokeId_timestamp' }
    );
    console.log('✓ Created compound index on rateLimits (spokeId, timestamp)');

    // CronLocks indexes
    // TTL index on expiresAt - auto-cleanup for crashed instances
    await cronLocksRaw.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: 'cronLocks_expiresAt_ttl' }
    );
    console.log('✓ Created TTL index on cronLocks.expiresAt');

    // Unique index on jobName - ensures only one lock per job
    await cronLocksRaw.createIndex(
      { jobName: 1 },
      { unique: true, name: 'cronLocks_jobName_unique' }
    );
    console.log('✓ Created unique index on cronLocks.jobName');

    // ProcessedWebhooks indexes
    // TTL index on expiresAt - auto-cleanup after 24 hours
    await processedWebhooksRaw.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: 'processedWebhooks_expiresAt_ttl' }
    );
    console.log('✓ Created TTL index on processedWebhooks.expiresAt');

    // Unique index on webhookKey - ensures idempotency
    await processedWebhooksRaw.createIndex(
      { webhookKey: 1 },
      { unique: true, name: 'processedWebhooks_webhookKey_unique' }
    );
    console.log('✓ Created unique index on processedWebhooks.webhookKey');

    console.log('✓ Migration 2 completed successfully');
  },
  down: async function() {
    console.log('Rolling back migration 2');

    const rateLimitsRaw = RateLimits.rawCollection();
    const cronLocksRaw = CronLocks.rawCollection();
    const processedWebhooksRaw = ProcessedWebhooks.rawCollection();

    // Drop indexes (not the collections themselves)
    try {
      await rateLimitsRaw.dropIndex('rateLimits_expiresAt_ttl');
      await rateLimitsRaw.dropIndex('rateLimits_spokeId_timestamp');
    } catch (error) {
      console.log('Could not drop rateLimits indexes:', error.message);
    }

    try {
      await cronLocksRaw.dropIndex('cronLocks_expiresAt_ttl');
      await cronLocksRaw.dropIndex('cronLocks_jobName_unique');
    } catch (error) {
      console.log('Could not drop cronLocks indexes:', error.message);
    }

    try {
      await processedWebhooksRaw.dropIndex('processedWebhooks_expiresAt_ttl');
      await processedWebhooksRaw.dropIndex('processedWebhooks_webhookKey_unique');
    } catch (error) {
      console.log('Could not drop processedWebhooks indexes:', error.message);
    }
  }
});
