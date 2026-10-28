const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

// Stored as scrypt$N$r$p$salt$hash (salt and hash in base64)
const PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;
const MIN_PASSWORD_LENGTH = 8;

const hashPassword = async (password) => {
    const salt = crypto.randomBytes(16);
    const hash = await scrypt(String(password), salt, KEY_LENGTH, PARAMS);
    return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64'), hash.toString('base64')].join('$');
};

/**
 * Compares a password with a stored hash in constant time. Anything that is not
 * a valid scrypt hash (empty, NULL, old plain-text value) never matches.
 */
const verifyPassword = async (password, stored) => {
    const parts = String(stored || '').split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') {
        return false;
    }
    const [, N, r, p, salt, hash] = parts;
    const expected = Buffer.from(hash, 'base64');
    const actual = await scrypt(String(password), Buffer.from(salt, 'base64'), expected.length, {
        N: Number(N), r: Number(r), p: Number(p),
    });
    return crypto.timingSafeEqual(actual, expected);
};

// Hash of a random password, compared against when the login does not exist so that
// unknown and known logins take the same time
let dummyHash;
const verifyDummyPassword = async (password) => {
    dummyHash = dummyHash || await hashPassword(crypto.randomBytes(16).toString('hex'));
    await verifyPassword(password, dummyHash);
    return false;
};

const isValidNewPassword = (password) => typeof password === 'string' && password.length >= MIN_PASSWORD_LENGTH;

module.exports = {
    MIN_PASSWORD_LENGTH,
    hashPassword,
    verifyPassword,
    verifyDummyPassword,
    isValidNewPassword,
};
