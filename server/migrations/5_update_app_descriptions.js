console.log('=== LOADING MIGRATION 5_update_app_descriptions.js ===');

import { Migrations } from 'meteor/quave:migrations';
import { Apps } from '/lib/collections/apps';

// Register the migration
Migrations.add({
  version: 5,
  name: 'Update app descriptions',
  up: async function() {
    console.log('=== RUNNING MIGRATION 5: Update app descriptions ===');

    // Update Spoke App Skeleton
    const skeletonDescription = "A ready-to-use template for building real-time web applications that integrate seamlessly with the Kokokino platform. It comes with a built-in real-time chat room (think Discord without the bloat) so your users can start collaborating the moment they log in. It uses web technologies, handles single sign-on, subscription management, and live messaging out of the box. Fork it, customize it, and deploy your own spoke app to join the Kokokino ecosystem.";
    const skeletonResult = await Apps.updateAsync(
      { name: 'Spoke App Skeleton' },
      { $set: { description: skeletonDescription } }
    );
    console.log(`✓ Updated Spoke App Skeleton: ${skeletonResult} document(s) modified`);

    // Update Backlog Beacon
    const beaconDescription = "Helps you organize and track your video game collection across all platforms in one place. Import your existing library from Darkadia or other sources to get started quickly, and export anytime (your data is yours, never held hostage). Mark games as played, in progress, or waiting in the queue so you always know what to play next. Backlog Beacon is open source, so you can contribute code, request features, or peek under the hood whenever you like.";
    const beaconResult = await Apps.updateAsync(
      { name: 'Backlog Beacon' },
      { $set: { description: beaconDescription } }
    );
    console.log(`✓ Updated Backlog Beacon: ${beaconResult} document(s) modified`);

    console.log('✓ Migration 5 completed successfully');
  },
  down: async function() {
    console.log('Rolling back migration 5');

    // Restore previous descriptions (empty or generic)
    await Apps.updateAsync(
      { name: 'Spoke App Skeleton' },
      { $set: { description: '' } }
    );

    await Apps.updateAsync(
      { name: 'Backlog Beacon' },
      { $set: { description: '' } }
    );

    console.log('✓ Rollback of migration 5 completed');
  }
});
