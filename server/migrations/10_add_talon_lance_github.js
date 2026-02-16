console.log('=== LOADING MIGRATION 10_add_talon_lance_github.js ===');

import { Migrations } from 'meteor/quave:migrations';
import { Apps } from '/lib/collections/apps';

Migrations.add({
  version: 10,
  name: 'Add GitHub URL to Talon & Lance',
  up: async function() {
    console.log('=== RUNNING MIGRATION 10: Add GitHub URL to Talon & Lance ===');

    const result = await Apps.updateAsync(
      { spokeId: 'talon_and_lance' },
      { $set: { gitHubUrl: 'https://github.com/kokokino/talon-and-lance' } }
    );
    console.log(`✓ Updated Talon & Lance: ${result} document(s) modified`);

    console.log('✓ Migration 10 completed successfully');
  },
  down: async function() {
    console.log('Rolling back migration 10');

    await Apps.updateAsync(
      { spokeId: 'talon_and_lance' },
      { $unset: { gitHubUrl: '' } }
    );

    console.log('✓ Rollback of migration 10 completed');
  }
});
