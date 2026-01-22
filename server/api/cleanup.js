import { Meteor } from 'meteor/meteor';
import { cleanupExpiredNonces } from './sso.js';
import { acquireCronLock, releaseCronLock } from './cronLock.js';

const JOB_NAME = 'cleanup-expired-nonces';

// Clean up expired nonces every 5 minutes
Meteor.setInterval(async () => {
  // Try to acquire the distributed lock
  const hasLock = await acquireCronLock(JOB_NAME);
  if (!hasLock) {
    // Another instance is handling the cleanup
    return;
  }

  try {
    await cleanupExpiredNonces();
  } catch (error) {
    console.error('Error cleaning up expired nonces:', error);
  } finally {
    // Always release the lock when done
    await releaseCronLock(JOB_NAME);
  }
}, 5 * 60 * 1000);

// Also run cleanup on startup
Meteor.startup(async () => {
  // Try to acquire the distributed lock for startup cleanup
  const hasLock = await acquireCronLock(JOB_NAME);
  if (!hasLock) {
    // Another instance is handling the cleanup
    return;
  }

  try {
    await cleanupExpiredNonces();
  } catch (error) {
    console.error('Error cleaning up expired nonces on startup:', error);
  } finally {
    // Always release the lock when done
    await releaseCronLock(JOB_NAME);
  }
});
