const { getUserById } = require('../utils/db');

/**
 * Access control
 *
 *   public        /, /rozvrh, /login (rate limited, middleware/rate-limit.js), /register, /health
 *   requireLogin  /order, /account/password
 *   terminal      /toasty/terminal, /bistro-payment, /api/users (admin too)
 *   admin         /admin/*, /payment, /finances/*, /manage-items/*
 *
 * Not logged in -> redirect to /login, wrong role -> 403 (JSON for /api/*).
 */
const ROLES = {
    ADMIN: 'admin',
    TERMINAL: 'terminal',
    CUSTOMER: 'customer',
};

/**
 * Loads the logged-in user (id, login, role) from the database on every request,
 * so role changes and deleted accounts take effect immediately.
 */
const loadUser = async (req, res, next) => {
    req.user = null;

    if (req.session && req.session.userId !== undefined) {
        req.user = await getUserById(req.session.userId);
        if (!req.user) {
            // Account no longer exists
            delete req.session.userId;
            delete req.session.username;
        }
    }

    res.locals.user = req.user;
    res.locals.hasRole = (...roles) => !!req.user && roles.includes(req.user.role);
    next();
};

const deny = (req, res, status) => {
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(status).json({ error: status === 401 ? 'unauthorized' : 'forbidden' });
    }
    if (status === 401) {
        return res.redirect('/login');
    }
    return res.status(403).render('error', {
        title: 'Přístup odepřen',
        message: 'Na tuto stránku nemáte oprávnění.',
    });
};

/**
 * Allows only logged-in users with one of the given roles (any role when none are given).
 */
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) {
        return deny(req, res, 401);
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
        return deny(req, res, 403);
    }
    next();
};

const requireLogin = requireRole();
const requireAdmin = requireRole(ROLES.ADMIN);
const requireTerminal = requireRole(ROLES.ADMIN, ROLES.TERMINAL);

module.exports = {
    ROLES,
    loadUser,
    requireRole,
    requireLogin,
    requireAdmin,
    requireTerminal,
};
