import crypto from 'node:crypto';
import db from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'business-erp-v1-secret-key-2026-production';
const SESSION_DURATION_DAYS = 30;

// In-memory brute force protection: attempts[key] = { count, lastAttempt }
const loginAttempts = new Map();

/**
 * Clean up expired rate-limit entries every 10 minutes
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of loginAttempts.entries()) {
    if (now - data.lastAttempt > 15 * 60 * 1000) {
      loginAttempts.delete(key);
    }
  }
}, 10 * 60 * 1000).unref();

/**
 * Hash password securely using Node.js scrypt with unique salt
 */
export function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a valid non-empty string.');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

/**
 * Verify password against stored salt:hash in timing-safe manner
 */
export function verifyPassword(password, storedHash) {
  if (!password || !storedHash || typeof storedHash !== 'string') return false;
  let cleanHash = storedHash;
  if (cleanHash.startsWith('scrypt:')) {
    cleanHash = cleanHash.substring(7);
  }
  const [salt, key] = cleanHash.split(':');
  if (!salt || !key) return false;
  try {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(hash, 'hex'));
  } catch (err) {
    return false;
  }
}

/**
 * Cryptographically sign a session token
 */
export function generateToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    exp: Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
    nonce: crypto.randomBytes(8).toString('hex'),
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('base64url');
  return `${payloadStr}.${signature}`;
}

/**
 * Verify token signature and expiration
 */
export function parseToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadStr, signature] = parts;
  try {
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Rate limit check for login
 */
function checkRateLimit(key) {
  const record = loginAttempts.get(key);
  if (!record) return;
  const now = Date.now();
  if (now - record.lastAttempt < 15 * 60 * 1000 && record.count >= 5) {
    const remainingMins = Math.ceil((15 * 60 * 1000 - (now - record.lastAttempt)) / 60000);
    throw new Error(`Too many failed login attempts. Please try again after ${remainingMins} minutes.`);
  }
}

function recordLoginFailure(key) {
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, lastAttempt: now };
  if (now - record.lastAttempt > 15 * 60 * 1000) {
    record.count = 1;
  } else {
    record.count += 1;
  }
  record.lastAttempt = now;
  loginAttempts.set(key, record);
}

function recordLoginSuccess(key) {
  loginAttempts.delete(key);
}

/**
 * Sign up a new business owner
 */
export function signupUser({ username, password, confirm_password, confirmPassword }) {
  if (!username || typeof username !== 'string') {
    throw new Error('Username is required.');
  }

  const cleanUsername = username.trim();
  if (cleanUsername.length < 3 || cleanUsername.length > 50) {
    throw new Error('Username must be between 3 and 50 characters.');
  }

  if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
    throw new Error('Username can only contain letters, numbers, and underscores.');
  }

  const confirm = confirm_password || confirmPassword;
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required.');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  if (password !== confirm) {
    throw new Error('Password and confirmation password do not match.');
  }

  // Check unique username
  const existing = db
    .prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE')
    .get(cleanUsername);

  if (existing) {
    throw new Error(`Username "${cleanUsername}" is already taken. Please choose another.`);
  }

  const passwordHash = hashPassword(password);
  const now = new Date().toISOString();

  const result = db.prepare(`
    INSERT INTO users (username, password_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(cleanUsername, passwordHash, now, now);

  const userId = Number(result.lastInsertRowid);
  const user = { id: userId, username: cleanUsername };

  // Generate session token
  const token = generateToken(user);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO sessions (user_id, token, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).run(userId, token, expiresAt, now);

  return {
    user,
    token,
    needs_profile: true,
  };
}

/**
 * Login business owner
 */
export function loginUser({ username, password, ip = '127.0.0.1' }) {
  if (!username || !password) {
    throw new Error('Username and password are required.');
  }

  const cleanUsername = username.trim();
  const rateLimitKey = `${cleanUsername.toLowerCase()}:${ip}`;
  checkRateLimit(rateLimitKey);

  const userRow = db
    .prepare('SELECT id, username, password_hash FROM users WHERE username = ? COLLATE NOCASE')
    .get(cleanUsername);

  if (!userRow || !verifyPassword(password, userRow.password_hash)) {
    recordLoginFailure(rateLimitKey);
    throw new Error('Invalid username or password.');
  }

  recordLoginSuccess(rateLimitKey);

  const user = { id: Number(userRow.id), username: userRow.username };

  // Check profile
  let profile = getBusinessProfile(user.id);
  if (!profile) {
    try {
      saveBusinessProfile(user.id, {
        business_name: `${user.username} Business`,
        business_address: 'Main Store',
        business_nickname: user.username,
      });
      profile = getBusinessProfile(user.id);
    } catch (pe) {}
  }

  // Generate and store session token
  const token = generateToken(user);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO sessions (user_id, token, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).run(user.id, token, expiresAt, now);

  return {
    user,
    token,
    needs_profile: false,
    profile: profile || null,
  };
}

/**
 * Logout business owner
 */
export function logoutUser(token) {
  if (!token) return { success: true };
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  return { success: true, message: 'Logged out successfully.' };
}

/**
 * Validate session token and return user + profile
 */
export function getUserFromToken(token) {
  const payload = parseToken(token);
  if (!payload || !payload.userId) return null;

  // Verify session exists in DB
  const session = db
    .prepare('SELECT id, user_id FROM sessions WHERE token = ?')
    .get(token);

  if (!session) return null;

  const user = db
    .prepare('SELECT id, username, created_at FROM users WHERE id = ?')
    .get(payload.userId);

  if (!user) return null;

  const profile = getBusinessProfile(user.id);

  return {
    user: { id: Number(user.id), username: user.username },
    profile: profile || null,
    needs_profile: !profile,
  };
}

/**
 * Get Business Profile for user
 */
export function getBusinessProfile(userId) {
  const profile = db
    .prepare(`
      SELECT id, user_id, business_name, business_address, business_nickname, created_at, updated_at
      FROM business_profiles
      WHERE user_id = ?
    `)
    .get(userId);

  if (!profile) return null;

  return {
    id: Number(profile.id),
    user_id: Number(profile.user_id),
    business_name: profile.business_name,
    business_address: profile.business_address,
    business_nickname: profile.business_nickname,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

/**
 * Save or update Business Profile
 */
export function saveBusinessProfile(arg1, arg2) {
  let uid;
  let data;

  if (typeof arg1 === 'object' && arg1 !== null && arg1.userId) {
    uid = Number(arg1.userId);
    data = arg1;
  } else {
    uid = Number(arg1);
    data = arg2 || {};
  }

  const { business_name, business_address, business_nickname } = data;

  if (!business_name || typeof business_name !== 'string' || business_name.trim().length < 2) {
    throw new Error('Business Name is required and must be at least 2 characters.');
  }

  if (!business_address || typeof business_address !== 'string' || business_address.trim().length < 3) {
    throw new Error('Business Address is required and must be at least 3 characters.');
  }

  if (!business_nickname || typeof business_nickname !== 'string' || business_nickname.trim().length < 2) {
    throw new Error('Business / Shop Nickname is required and must be at least 2 characters.');
  }

  const cleanName = business_name.trim();
  const cleanAddress = business_address.trim();
  const cleanNickname = business_nickname.trim();
  const now = new Date().toISOString();

  const existing = getBusinessProfile(uid);

  if (existing) {
    db.prepare(`
      UPDATE business_profiles
      SET business_name = ?, business_address = ?, business_nickname = ?, updated_at = ?
      WHERE user_id = ?
    `).run(cleanName, cleanAddress, cleanNickname, now, uid);
  } else {
    db.prepare(`
      INSERT INTO business_profiles (user_id, business_name, business_address, business_nickname, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uid, cleanName, cleanAddress, cleanNickname, now, now);
  }

  return getBusinessProfile(uid);
}

// Aliases for alternate naming conventions
export const createOwnerAccount = signupUser;
export const loginOwner = loginUser;
export const logoutOwner = logoutUser;
export const upsertBusinessProfile = saveBusinessProfile;


