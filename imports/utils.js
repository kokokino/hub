import m from 'mithril';

/**
 * Check if a user object has a verified email
 * @param {Object} user - Meteor user object
 * @returns {Boolean} true if user has at least one verified email
 */
export function isVerifiedUser(user) {
  return user && 
         user.emails && 
         user.emails[0] && 
         user.emails[0].verified === true;
}

/**
 * Helper function for route links
 * @param {string} path - The route path
 * @returns {Object} An object with href and onclick properties
 */
export function routeLink(path) {
  return {
    href: path,
    onclick: function(e) {
      e.preventDefault();
      m.route.set(path);
    }
  };
}
