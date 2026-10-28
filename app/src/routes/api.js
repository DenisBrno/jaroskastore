const express = require('express');
const router = express.Router();

const { getUsers } = require('../utils/db');
const { requireTerminal } = require('../middleware/auth');

router.get('/api/users', requireTerminal, async (req, res) => {
    try {
        const keyword = req.query.search;

        if(!keyword){
            return res.json([]);
        }
        const users = await getUsers(keyword);
        return res.json(
            users
        )
    } catch (err) {
        res.status(500).json({ error: 'Chyba při načítání uživatelů' });
    }
});

module.exports = router;