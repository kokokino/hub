import { Mongo } from 'meteor/mongo';

export const ProcessedWebhooks = new Mongo.Collection('processedWebhooks');

// Deny all client-side modifications
ProcessedWebhooks.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
