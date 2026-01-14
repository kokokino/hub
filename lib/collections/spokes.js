import { Mongo } from 'meteor/mongo';

export const Spokes = new Mongo.Collection('spokes');

// Deny all client-side modifications
Spokes.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
