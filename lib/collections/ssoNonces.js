import { Mongo } from 'meteor/mongo';

export const SsoNonces = new Mongo.Collection('ssoNonces');

// Deny all client-side modifications
SsoNonces.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
