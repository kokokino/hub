// Apps collection schema
import { Mongo } from 'meteor/mongo';

export const Apps = new Mongo.Collection('apps');

// Schema (not enforced, for reference)
/*
{
  _id: String,           // Meteor-generated ID
  name: String,          // Display name (e.g., "Backlog Beacon")
  slug: String,          // URL-friendly name (e.g., "backlog-beacon") - unique
  description: String,   // Detailed description
  productId: String,     // References Products._id
  spokeId: String,       // used as a key to look up spoke configuration in Meteor.settings.private.spokes
  gitHubUrl: String,     // Optional GitHub repo link
  ageRating: String,     // ESRB rating (e.g., "E", "T", "M")
  isApproved: Boolean,   // Default: false
  createdAt: Date,
  updatedAt: Date,
  createdBy: String,     // User ID who created this
  isActive: Boolean      // Soft delete flag
}
*/

/**
 * Generate a URL-friendly slug from an app name
 * @param {string} name - The app name
 * @returns {string} A URL-friendly slug
 */
export function generateSlug(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')    // Remove non-word chars (except spaces and hyphens)
    .replace(/\s+/g, '-')        // Replace spaces with hyphens
    .replace(/-+/g, '-')         // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '');    // Trim hyphens from start and end
}

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
