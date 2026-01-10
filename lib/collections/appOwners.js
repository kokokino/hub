// AppOwners collection schema
import { Mongo } from 'meteor/mongo';

export const AppOwners = new Mongo.Collection('appOwners');

// Schema (not enforced, for reference)
/*
{
  _id: String,
  appId: String,         // References Apps._id
  userId: String,        // References Meteor.users._id
  role: String,          // "owner", "maintainer", "contributor"
  sharePercentage: Number, // Decimal percentage (0-100)
  createdAt: Date,
  createdById: String    // Who assigned this ownership: References Meteor.users._id
}
*/

// Deny all client-side updates
AppOwners.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
