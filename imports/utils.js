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
 * Extract the video ID from a YouTube URL
 * Handles both youtu.be/ID and youtube.com/watch?v=ID formats
 * @param {string} url - A YouTube URL
 * @returns {string|null} The video ID, or null if not a valid YouTube URL
 */
export function extractYouTubeVideoId(url) {
  if (!url) return null;
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];
  const longMatch = url.match(/youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]+)/);
  if (longMatch) return longMatch[1];
  return null;
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
