console.log('=== LOADING MIGRATION 6_add_app_slugs.js ===');

import { Migrations } from 'meteor/quave:migrations';
import { Apps, generateSlug } from '/lib/collections/apps';

// Register the migration
Migrations.add({
  version: 6,
  name: 'Add URL-friendly slugs to apps',
  up: async function() {
    console.log('=== RUNNING MIGRATION 6: Add URL-friendly slugs to apps ===');

    // Fetch all apps
    const apps = await Apps.find({}).fetchAsync();
    console.log(`Found ${apps.length} apps to update`);

    for (const app of apps) {
      if (!app.slug) {
        const slug = generateSlug(app.name);
        await Apps.updateAsync(
          { _id: app._id },
          { $set: { slug } }
        );
        console.log(`  Added slug "${slug}" to app "${app.name}"`);
      } else {
        console.log(`  App "${app.name}" already has slug "${app.slug}"`);
      }
    }

    // Create unique index on slug field
    const rawCollection = Apps.rawCollection();
    try {
      await rawCollection.createIndex({ slug: 1 }, { unique: true, sparse: true });
      console.log('  Created unique index on slug field');
    } catch (error) {
      if (error.code === 85 || error.code === 86) {
        console.log('  Index on slug field already exists');
      } else {
        throw error;
      }
    }

    console.log('Migration 6 completed successfully');
  },
  down: async function() {
    console.log('Rolling back migration 6');

    // Remove slug field from all apps
    await Apps.updateAsync(
      {},
      { $unset: { slug: '' } },
      { multi: true }
    );

    // Drop the index
    const rawCollection = Apps.rawCollection();
    try {
      await rawCollection.dropIndex('slug_1');
      console.log('  Dropped slug index');
    } catch (error) {
      console.log('  Could not drop slug index:', error.message);
    }

    console.log('Rollback of migration 6 completed');
  }
});
