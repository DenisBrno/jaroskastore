const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const WINDOW_MS = 15 * 60 * 1000;

// Only failed logins count: the login route sets res.locals.loginFailed
const failedLoginOptions = {
    windowMs: WINDOW_MS,
    skipSuccessfulRequests: true,
    requestWasSuccessful: (req, res) => !res.locals.loginFailed,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`[AUTH] Too many failed logins: ${req.body.username} from ${req.ip}`);
        res.redirect('/login?error=too_many');
    },
};

/**
 * Login brute-force protection. The school shares one public IP, so attempts are
 * counted per IP + login (one mistyped password does not lock out others), plus a
 * looser limit per IP against trying many logins.
 */
const loginLimiters = [
    rateLimit({
        ...failedLoginOptions,
        limit: 10,
        keyGenerator: (req) => `${ipKeyGenerator(req.ip)}|${String(req.body.username || '').toLowerCase()}`,
    }),
    rateLimit({
        ...failedLoginOptions,
        limit: 100,
        keyGenerator: (req) => ipKeyGenerator(req.ip),
    }),
];

module.exports = { loginLimiters };
