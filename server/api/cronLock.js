import { Random } from 'meteor/random';
import { CronLocks } from '/lib/collections/cronLocks';

// Unique identifier for this server instance
const instanceId = Random.id();

// Lock expiry time in milliseconds (10 minutes safety for crashed instances)
const LOCK_EXPIRY_MS = 10 * 60 * 1000;

/**
 * Attempts to acquire a distributed lock for a cron job.
 * Uses MongoDB unique index to ensure only one instance gets the lock.
 * @param {string} jobName - The unique name of the cron job
 * @returns {Promise<boolean>} - True if lock was acquired, false otherwise
 */
export async function acquireCronLock(jobName) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOCK_EXPIRY_MS);

  try {
    // First, clean up any expired locks for this job
    await CronLocks.removeAsync({
      jobName,
      expiresAt: { $lt: now }
    });

    // Try to insert a new lock - will fail if one already exists due to unique index
    await CronLocks.insertAsync({
      jobName,
      instanceId,
      acquiredAt: now,
      expiresAt
    });

    return true;
  } catch (error) {
    // Duplicate key error means another instance has the lock
    if (error.code === 11000) {
      return false;
    }
    // Re-throw unexpected errors
    throw error;
  }
}

/**
 * Releases a distributed lock for a cron job.
 * Only releases if this instance owns the lock.
 * @param {string} jobName - The unique name of the cron job
 * @returns {Promise<void>}
 */
export async function releaseCronLock(jobName) {
  await CronLocks.removeAsync({
    jobName,
    instanceId
  });
}
