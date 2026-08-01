const express = require('express');
const router = express.Router();

const { getUsers } = require('../utils/db');

router.get('/api/users', async (req, res) => {
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
        res.status(500).send('Chyba při načítání objednávek');
    }
});

module.exports = router;