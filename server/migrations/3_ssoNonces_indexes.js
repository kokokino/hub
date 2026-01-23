console.log('=== LOADING MIGRATION 3_ssoNonces_indexes.js ===');

import { Migrations } from 'meteor/quave:migrations';
import { SsoNonces } from '/lib/collections/ssoNonces';

// Register the migration
Migrations.add({
  version: 3,
  name: 'Create indexes for ssoNonces collection',
  up: async function() {
    console.log('=== RUNNING MIGRATION 3: Create indexes for ssoNonces ===');

    const ssoNoncesRaw = SsoNonces.rawCollection();

    // TTL index on expiresAt - auto-deletes expired nonces
    await ssoNoncesRaw.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: 'ssoNonces_expiresAt_ttl' }
    );
    console.log('✓ Created TTL index on ssoNonces.expiresAt');

    // Unique compound index on (nonce, appId) - prevents race conditions
    // by ensuring only one document can exist for a given nonce+appId combination
    await ssoNoncesRaw.createIndex(
      { nonce: 1, appId: 1 },
      { unique: true, name: 'ssoNonces_nonce_appId_unique' }
    );
    console.log('✓ Created unique compound index on ssoNonces (nonce, appId)');

    console.log('✓ Migration 3 completed successfully');
  },
  down: async function() {
    console.log('Rolling back migration 3');

    const ssoNoncesRaw = SsoNonces.rawCollection();

    try {
      await ssoNoncesRaw.dropIndex('ssoNonces_expiresAt_ttl');
      await ssoNoncesRaw.dropIndex('ssoNonces_nonce_appId_unique');
    } catch (error) {
      console.log('Could not drop ssoNonces indexes:', error.message);
    }
  }
});
