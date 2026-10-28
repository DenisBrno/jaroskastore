const crypto = require('crypto');

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

const tokensMatch = (sent, expected) => typeof sent === 'string'
    && typeof expected === 'string'
    && sent.length === expected.length
    && crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(expected));

/**
 * CSRF protection: every POST form contains the session's token (views/partials/csrf.ejs)
 * and any other request without the matching token is refused.
 * The token is created the first time a page renders a form, so plain visits create no session.
 */
const csrfProtection = (req, res, next) => {
    res.locals.csrfToken = () => {
        if (!req.session.csrfToken) {
            req.session.csrfToken = crypto.randomBytes(32).toString('base64url');
        }
        return req.session.csrfToken;
    };

    if (SAFE_METHODS.includes(req.method) || tokensMatch(req.body && req.body._csrf, req.session.csrfToken)) {
        return next();
    }

    console.log(`[CSRF] Rejected ${req.method} ${req.originalUrl}`);
    res.status(403).render('error', {
        title: 'Formulář vypršel',
        message: 'Platnost formuláře vypršela. Načtěte stránku znovu a akci zopakujte.',
    });
};

module.exports = { csrfProtection };
