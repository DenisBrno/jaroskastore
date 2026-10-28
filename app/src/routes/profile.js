const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');
const { getUserCredit, checkUserPassword, setUserPassword } = require('../utils/db');
const { isValidNewPassword } = require('../utils/password');

// Logged-in user's profile: username, credit and password change
router.get('/profile', requireLogin, async (req, res) => {
    try {
        const [row] = await getUserCredit(req.user.id);

        res.render('profile', {
            credit: (row && row.kredit) || 0,
            status: req.query.status,
            error: req.query.error
        });
    } catch (err) {
        console.error('Error loading the profile:', err);
        res.status(500).send('Chyba při načítání profilu');
    }
});

// Changes the logged-in user's password and logs them out on their other devices
router.post('/profile/password', requireLogin, async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!isValidNewPassword(newPassword)) {
        return res.redirect('/profile?error=too_short');
    }
    if (newPassword !== confirmPassword) {
        return res.redirect('/profile?error=mismatch');
    }
    try {
        if (!(await checkUserPassword(req.user.id, currentPassword))) {
            return res.redirect('/profile?error=wrong_password');
        }
        await setUserPassword(req.user.id, newPassword, req.sessionID);
        console.log(`[AUTH] Password changed: ${req.user.login}`);
        res.redirect('/profile?status=password_changed');
    } catch (err) {
        console.error('[AUTH] Password change failed:', err);
        res.redirect('/profile?error=failed');
    }
});

module.exports = router;
