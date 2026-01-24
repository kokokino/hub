// Products collection schema
import { Mongo } from 'meteor/mongo';

export const Products = new Mongo.Collection('products');

// Schema (not enforced, for reference)
/*
{
  _id: String,           // Meteor-generated ID
  name: String,          // Display name (e.g., "Base Monthly")
  slug: String,          // URL-friendly name (e.g., "base-monthly") - unique, used for cross-app references
  description: String,   // Detailed description
  sortOrder: Number,     // Display order (lower = first)
  lemonSqueezyProductId: String,     // Lemon Squeezy product ID (e.g., "739029")
  lemonSqueezyBuyLinkId: String,     // Lemon Squeezy buy link UUID
  pricePerMonthUSD: Number,  // Decimal price (e.g., 2.00)
  gitHubURL: String,     // Optional GitHub repo link
  paymentInstructions: String, // Payment details for owners
  isApproved: Boolean,   // Default: false
  createdAt: Date,
  updatedAt: Date,
  createdBy: String,     // User ID who created this
  isRequired: Boolean,   // Is this product required? (Base subscription)
  isActive: Boolean      // Soft delete flag
}
*/

/**
 * Generate a URL-friendly slug from a product name
 * @param {string} name - The product name
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
Products.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

// Note: In Meteor, allow/deny rules only affect write operations (insert, update, remove)
// Read operations (find) are controlled by publications
// These allow rules are explicit but not strictly necessary
Products.allow({
  insert: function () { return false; },
  update: function () { return false; },
  remove: function () { return false; },
  fetch: []
});
