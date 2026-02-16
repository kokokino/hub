console.log('=== LOADING MIGRATION 9_add_talon_and_lance.js ===');

import { Migrations } from 'meteor/quave:migrations';
import { Products } from '/lib/collections/products';
import { Apps } from '/lib/collections/apps';
import { generateSlug } from '/lib/collections/apps';

Migrations.add({
  version: 9,
  name: 'Add Talon & Lance app to base product',
  up: async function() {
    console.log('=== RUNNING MIGRATION 9: Add Talon & Lance app ===');

    const existingApp = await Apps.findOneAsync({ spokeId: 'talon_and_lance' });
    if (existingApp) {
      console.log('Talon & Lance app already exists, skipping migration');
      return;
    }

    const baseProduct = await Products.findOneAsync({ name: 'Base Monthly' });
    if (!baseProduct) {
      throw new Error('Migration 9 failed: Base Monthly product not found');
    }

    await Apps.insertAsync({
      name: 'Talon & Lance',
      slug: generateSlug('Talon & Lance'),
      description: '<p>Mount your ostrich, raise your lance, and take to the skies! Talon & Lance is a multiplayer arcade battle inspired by the classic 1982 hit Joust. Now reimagined for the modern web. Clash with up to 4 players in frantic aerial combat where altitude is everything: fly higher than your opponent and your lance strikes true, fly lower and you\'re toast. Master the art of the flap, outmaneuver rival knights, dodge the bubbling lava below, and watch your enemies burst into satisfying showers of voxel debris. Choose your knight wisely because enemy waves will escalate in chaos, while egg-snatching mechanics will keep you on your toes. Every match is a wild ride. No downloads, no installs, just jump in from your browser and joust in this open-source Kokokino spoke app.</p><p>Under the hood, Talon & Lance is a love letter to deterministic game engineering. The entire physics simulation runs on integer-only arithmetic. No floating point, no ambiguity. Ensuring byte-for-byte identical game state across every connected player. Multiplayer is powered by GGPO-style rollback netcode over peer-to-peer WebRTC, meaning inputs are processed locally with near-zero perceived latency, and only rolled back when predictions miss. If NAT traversal fails, a server-side WebRTC relay kicks in seamlessly as a fallback. The renderer is built on Babylon.js with a custom voxel model system that assembles hierarchical rigs from hand-crafted voxel definitions: complete with wing joints, shoulder pivots, and palette-swappable color schemes. All of this runs inside a Meteor 3.4 real-time framework that handles matchmaking, room management, and SSO authentication, while the gameplay itself bypasses the server entirely for true P2P performance. It\'s retro arcade fun built on seriously modern netcode.</p>',
      productId: baseProduct._id,
      spokeId: 'talon_and_lance',
      ageRating: 'E',
      isApproved: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system'
    });

    console.log('✓ Created Talon & Lance app');
    console.log('✓ Migration 9 completed successfully');
  },
  down: async function() {
    console.log('Rolling back migration 9');

    await Apps.removeAsync({ spokeId: 'talon_and_lance' });

    console.log('✓ Rollback of migration 9 completed');
  }
});
