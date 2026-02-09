console.log('=== LOADING MIGRATION 8_add_youtube_urls.js ===');

import { Migrations } from 'meteor/quave:migrations';
import { Apps } from '/lib/collections/apps';

// Register the migration
Migrations.add({
  version: 8,
  name: 'Add YouTube URLs to apps',
  up: async function() {
    console.log('=== RUNNING MIGRATION 8: Add YouTube URLs to apps ===');

    // Update Backlog Beacon
    const beaconResult = await Apps.updateAsync(
      { name: 'Backlog Beacon' },
      { $set: { youtubeUrl: 'https://youtu.be/gG103DR-Sl0' } }
    );
    console.log(`✓ Updated Backlog Beacon: ${beaconResult} document(s) modified`);

    console.log('✓ Migration 8 completed successfully');
  },
  down: async function() {
    console.log('Rolling back migration 8');

    await Apps.updateAsync(
      { name: 'Backlog Beacon' },
      { $unset: { youtubeUrl: '' } }
    );

    console.log('✓ Rollback of migration 8 completed');
  }
});
