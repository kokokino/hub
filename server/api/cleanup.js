import { Meteor } from 'meteor/meteor';
import { cleanupExpiredNonces } from './sso.js';

// Clean up expired nonces every 5 minutes
Meteor.setInterval(async () => {
  try {
    await cleanupExpiredNonces();
  } catch (error) {
    console.error('Error cleaning up expired nonces:', error);
  }
}, 5 * 60 * 1000);

// Also run cleanup on startup
Meteor.startup(async () => {
  try {
    await cleanupExpiredNonces();
  } catch (error) {
    console.error('Error cleaning up expired nonces on startup:', error);
  }
});
