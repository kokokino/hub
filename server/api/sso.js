import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import jwt from 'jsonwebtoken';
import { SsoNonces } from '../../lib/collections/ssoNonces.js';

// Cache the keys to avoid reading from disk on every request
let privateKey = null;
let publicKey = null;

/**
 * Gets the private key for signing JWTs
 * @returns {Promise<string>} - The private key in PEM format
 */
async function getPrivateKey() {
  if (privateKey) return privateKey;

  // Try to get from settings first (for production)
  if (Meteor.settings?.private?.jwtPrivateKey) {
    privateKey = Meteor.settings.private.jwtPrivateKey;
    return privateKey;
  }

  // Try to read from Assets (private folder)
  // In Meteor 3, Assets.getText is async
  try {
    privateKey = await Assets.getTextAsync('keys/private.pem');
    return privateKey;
  } catch (e) {
    console.error('Failed to load private key:', e.message);
    throw new Meteor.Error('config-error', 'JWT private key not configured');
  }
}

/**
 * Gets the public key for verifying JWTs
 * @returns {Promise<string>} - The public key in PEM format
 */
async function getPublicKey() {
  if (publicKey) return publicKey;

  // Try to get from settings first
  if (Meteor.settings?.private?.jwtPublicKey) {
    publicKey = Meteor.settings.private.jwtPublicKey;
    return publicKey;
  }

  // Try to read from Assets (private folder)
  // In Meteor 3, Assets.getText is async
  try {
    publicKey = await Assets.getTextAsync('keys/public.pem');
    return publicKey;
  } catch (e) {
    console.error('Failed to load public key:', e.message);
    throw new Meteor.Error('config-error', 'JWT public key not configured');
  }
}

/**
 * Handles GET /api/public-key
 * Returns the Hub's public key for JWT verification
 */
export async function handlePublicKey() {
  const key = await getPublicKey();
  return {
    publicKey: key,
    algorithm: 'RS256',
    keyId: 'hub-2025-01'
  };
}

/**
 * Generates an SSO token for a user to access a spoke app
 * @param {string} userId - The user's ID
 * @param {string} appId - The spoke app ID
 * @param {string} appUrl - The spoke app URL
 * @returns {Object} - { token, expiresAt }
 */
export async function generateSsoToken(userId, appId, appUrl) {
  const user = await Meteor.users.findOneAsync(userId);
  if (!user) {
    throw new Meteor.Error('not-found', 'User not found');
  }

  // Get user's active subscriptions
  const subscriptions = (user.lemonSqueezy?.subscriptions || [])
    .filter(sub => {
      if (sub.status !== 'active') return false;
      if (!sub.validUntil) return false;
      return new Date(sub.validUntil) > new Date();
    })
    .map(sub => ({
      productId: sub.kokokinoProductId,
      status: sub.status,
      validUntil: sub.validUntil
    }));

  // Generate nonce using Random from Meteor
  const nonce = Random.id();

  // Store nonce to prevent replay attacks (expires in 10 minutes)
  await SsoNonces.insertAsync({
    nonce,
    appId,
    userId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  });

  // Build token payload
  const payload = {
    userId: user._id,
    username: user.username || user.emails?.[0]?.address?.split('@')[0] || 'user',
    email: user.emails?.[0]?.address,
    appId,
    appUrl,
    subscriptions,
    nonce
  };

  // Get private key and sign token (expires in 5 minutes)
  const privKey = await getPrivateKey();
  const token = jwt.sign(payload, privKey, {
    algorithm: 'RS256',
    expiresIn: '5m',
    issuer: 'kokokino-hub'
  });

  return {
    token,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  };
}

/**
 * Verifies an SSO token
 * @param {string} token - The JWT token
 * @param {string} expectedAppId - The app ID that should be in the token
 * @returns {Object} - { valid: boolean, payload?: Object, error?: string }
 */
export async function verifySsoToken(token, expectedAppId) {
  try {
    // Get public key and verify signature and expiration
    const pubKey = await getPublicKey();
    const payload = jwt.verify(token, pubKey, {
      algorithms: ['RS256'],
      issuer: 'kokokino-hub'
    });

    // Check app ID matches
    if (payload.appId !== expectedAppId) {
      return { valid: false, error: 'wrong_app' };
    }

    // Check nonce hasn't been used
    const nonceRecord = await SsoNonces.findOneAsync({ 
      nonce: payload.nonce,
      appId: expectedAppId
    });

    if (!nonceRecord) {
      return { valid: false, error: 'invalid_nonce' };
    }

    if (nonceRecord.usedAt) {
      return { valid: false, error: 'nonce_reused' };
    }

    // Mark nonce as used
    await SsoNonces.updateAsync(nonceRecord._id, {
      $set: { usedAt: new Date() }
    });

    return { valid: true, payload };

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { valid: false, error: 'token_expired' };
    }
    if (error.name === 'JsonWebTokenError') {
      return { valid: false, error: 'invalid_signature' };
    }
    console.error('Token verification error:', error);
    return { valid: false, error: 'verification_failed' };
  }
}

/**
 * Cleans up expired nonces
 * Should be called periodically
 */
export async function cleanupExpiredNonces() {
  const result = await SsoNonces.removeAsync({
    expiresAt: { $lt: new Date() }
  });
  if (result > 0) {
    //console.log(`Cleaned up ${result} expired SSO nonces`);
  }
}
