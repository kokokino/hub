console.log('=== LOADING MIGRATION 7_add_product_slugs.js ===');

import { Migrations } from 'meteor/quave:migrations';
import { Products, generateSlug } from '/lib/collections/products';

// Register the migration
Migrations.add({
  version: 7,
  name: 'Add URL-friendly slugs to products',
  up: async function() {
    console.log('=== RUNNING MIGRATION 7: Add URL-friendly slugs to products ===');

    // Fetch all products
    const products = await Products.find({}).fetchAsync();
    console.log(`Found ${products.length} products to update`);

    for (const product of products) {
      if (!product.slug) {
        const slug = generateSlug(product.name);
        await Products.updateAsync(
          { _id: product._id },
          { $set: { slug } }
        );
        console.log(`  Added slug "${slug}" to product "${product.name}"`);
      } else {
        console.log(`  Product "${product.name}" already has slug "${product.slug}"`);
      }
    }

    // Create unique index on slug field
    const rawCollection = Products.rawCollection();
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

    // Create unique index on name field (enforce name uniqueness going forward)
    try {
      await rawCollection.createIndex({ name: 1 }, { unique: true, sparse: true });
      console.log('  Created unique index on name field');
    } catch (error) {
      if (error.code === 85 || error.code === 86) {
        console.log('  Index on name field already exists');
      } else {
        throw error;
      }
    }

    console.log('Migration 7 completed successfully');
  },
  down: async function() {
    console.log('Rolling back migration 7');

    // Remove slug field from all products
    await Products.updateAsync(
      {},
      { $unset: { slug: '' } },
      { multi: true }
    );

    // Drop the indexes
    const rawCollection = Products.rawCollection();
    try {
      await rawCollection.dropIndex('slug_1');
      console.log('  Dropped slug index');
    } catch (error) {
      console.log('  Could not drop slug index:', error.message);
    }

    try {
      await rawCollection.dropIndex('name_1');
      console.log('  Dropped name index');
    } catch (error) {
      console.log('  Could not drop name index:', error.message);
    }

    console.log('Rollback of migration 7 completed');
  }
});
