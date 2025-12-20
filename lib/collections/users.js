import { Meteor } from 'meteor/meteor';

// Deny all client-side updates on Meteor.users for security
Meteor.users.deny({
  insert: () => true,
  update: () => true,
  remove: () => true,
});
