import { Mongo } from 'meteor/mongo';

export const CronLocks = new Mongo.Collection('cronLocks');

// Deny all client-side modifications
CronLocks.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
