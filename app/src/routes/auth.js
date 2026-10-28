const express = require('express');
const router = express.Router();
const { verifyUser, createUser } = require('../utils/db');

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
        
        // New session id on login (prevents session fixation)
        req.session.regenerate((err) => {
            if (err) {
                console.error('[AUTH] Session regenerate error:', err);
                return res.redirect('/login?error=session_save_failed');
            }
            req.session.username = user.login;
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

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const success = await createUser(username, password);
    if (success) {
        res.redirect('/login');
    } else {
        res.redirect('/register?error=failed');
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
