// Apps collection schema
import { Mongo } from 'meteor/mongo';

export const Apps = new Mongo.Collection('apps');

// Schema (not enforced, for reference)
/*
{
  _id: String,           // Meteor-generated ID
  name: String,          // Display name (e.g., "Backlog Beacon")
  description: String,   // Detailed description
  productId: String,     // References Products._id
  gitHubURL: String,     // Optional GitHub repo link
  ageRating: String,     // ESRB rating (e.g., "E", "T", "M")
  isApproved: Boolean,   // Default: false
  createdAt: Date,
  updatedAt: Date,
  createdBy: String,     // User ID who created this
  isActive: Boolean      // Soft delete flag
}
*/

// Deny all client-side updates
Apps.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

// Note: In Meteor, allow/deny rules only affect write operations
Apps.allow({
  insert: function () { return false; },
  update: function () { return false; },
  remove: function () { return false; },
  fetch: []
});
