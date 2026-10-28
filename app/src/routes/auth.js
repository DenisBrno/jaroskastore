const express = require('express');
const router = express.Router();
const { verifyUser, checkUserPassword, setUserPassword } = require('../utils/db');
const { requireLogin } = require('../middleware/auth');
const { isValidNewPassword } = require('../utils/password');

router.get('/login', (req, res) => {
    const error = req.query.error;
    res.render('login', { error });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`[AUTH] Login attempt for: ${username}`);
    
    const user = await verifyUser(username, password);
    if (user) {
        console.log(`[AUTH] User verified: ${user.login} (ID: ${user.id})`);
        
        // New session id on login (prevents session fixation); the role is loaded from the DB per request
        req.session.regenerate((err) => {
            if (err) {
                console.error('[AUTH] Session regenerate error:', err);
                return res.redirect('/login?error=session_save_failed');
            }
            req.session.userId = user.id;
            req.session.save((err) => {
                if (err) {
                    console.error('[AUTH] Session save error:', err);
                    return res.redirect('/login?error=session_save_failed');
                }
                console.log(`[AUTH] Session saved successfully to DB. Redirecting...`);
                res.redirect('/');
            });
        });
    } else {
        console.log(`[AUTH] Login failed: Invalid credentials`);
        res.redirect('/login?error=invalid');
    }
});

router.get('/register', (req, res) => {
    res.render('register');
});

// Accounts are created by an admin (/admin/create-user), there is no public registration

router.get('/account/password', requireLogin, (req, res) => {
    res.render('account-password', { status: req.query.status, error: req.query.error });
});

// Changes the logged-in user's password and logs them out on their other devices
router.post('/account/password', requireLogin, async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!isValidNewPassword(newPassword)) {
        return res.redirect('/account/password?error=too_short');
    }
    if (newPassword !== confirmPassword) {
        return res.redirect('/account/password?error=mismatch');
    }
    try {
        if (!(await checkUserPassword(req.user.id, currentPassword))) {
            return res.redirect('/account/password?error=wrong_password');
        }
        await setUserPassword(req.user.id, newPassword, req.sessionID);
        console.log(`[AUTH] Password changed: ${req.user.login}`);
        res.redirect('/account/password?status=changed');
    } catch (err) {
        console.error('[AUTH] Password change failed:', err);
        res.redirect('/account/password?error=failed');
    }
});

router.post('/logout', (req, res) => {
    console.log('[AUTH] Logout requested');
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error('[AUTH] Session destroy error:', err);
            }
            console.log('[AUTH] Session destroyed. Clearing cookie.');
            res.clearCookie('session_id', { path: '/' });
            res.redirect('/');
        });
    } else {
        console.log('[AUTH] No session found during logout.');
        res.clearCookie('session_id', { path: '/' });
        res.redirect('/');
    }
});

module.exports = router;
