console.log('=== LOADING MIGRATION 4_add_github_urls.js ===');

import { Migrations } from 'meteor/quave:migrations';
import { Apps } from '/lib/collections/apps';

// Register the migration
Migrations.add({
  version: 4,
  name: 'Add GitHub URLs to apps',
  up: async function() {
    console.log('=== RUNNING MIGRATION 4: Add GitHub URLs to apps ===');

    // Update Spoke App Skeleton
    const skeletonResult = await Apps.updateAsync(
      { name: 'Spoke App Skeleton' },
      { $set: { gitHubUrl: 'https://github.com/kokokino/spoke_app_skeleton' } }
    );
    console.log(`✓ Updated Spoke App Skeleton: ${skeletonResult} document(s) modified`);

    // Update Backlog Beacon
    const beaconResult = await Apps.updateAsync(
      { name: 'Backlog Beacon' },
      { $set: { gitHubUrl: 'https://github.com/kokokino/backlog_beacon' } }
    );
    console.log(`✓ Updated Backlog Beacon: ${beaconResult} document(s) modified`);

    console.log('✓ Migration 4 completed successfully');
  },
  down: async function() {
    console.log('Rolling back migration 4');

    await Apps.updateAsync(
      { name: 'Spoke App Skeleton' },
      { $unset: { gitHubUrl: '' } }
    );

    await Apps.updateAsync(
      { name: 'Backlog Beacon' },
      { $unset: { gitHubUrl: '' } }
    );

    console.log('✓ Rollback of migration 4 completed');
  }
});
