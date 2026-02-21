console.log('=== LOADING MIGRATION 11_add_talon_lance_youtube.js ===');

import { Migrations } from 'meteor/quave:migrations';
import { Apps } from '/lib/collections/apps';

Migrations.add({
  version: 11,
  name: 'Add YouTube URL to Talon & Lance',
  up: async function() {
    console.log('=== RUNNING MIGRATION 11: Add YouTube URL to Talon & Lance ===');

    const result = await Apps.updateAsync(
      { spokeId: 'talon_and_lance' },
      { $set: { youtubeUrl: 'https://www.youtube.com/watch?v=jEUvKMrVa44' } }
    );
    console.log(`✓ Updated Talon & Lance: ${result} document(s) modified`);

    console.log('✓ Migration 11 completed successfully');
  },
  down: async function() {
    console.log('Rolling back migration 11');

    await Apps.updateAsync(
      { spokeId: 'talon_and_lance' },
      { $unset: { youtubeUrl: '' } }
    );

    console.log('✓ Rollback of migration 11 completed');
  }
});
