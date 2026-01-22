import { Mongo } from 'meteor/mongo';

export const RateLimits = new Mongo.Collection('rateLimits');

// Deny all client-side modifications
RateLimits.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
