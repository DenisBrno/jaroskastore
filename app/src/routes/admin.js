const express = require('express');
const router = express.Router();
const { getOrders, createUser, toggleOrderStatus, updateUserCredit, getOrderDetails } = require('../utils/db');

router.get('/admin', async (req, res) => {
    if (!req.session.username || req.session.userId !== 0) {
        return res.redirect('/');
    }

    try {
        const objednavky = await getOrders();
        res.render('admin', {
            objednavky: objednavky
        });
    } catch (err) {
        res.status(500).send('Chyba při načítání objednávek');
    }
});

router.post('/admin/create-user', async (req, res) => {
    if (!req.session.username || req.session.userId !== 0) {
        return res.status(403).send('Forbidden');
    }

    const { username, password } = req.body;
    const success = await createUser(username, password);

    if (success) {
        res.redirect('/admin?status=user_created');
    } else {
        res.redirect('/admin?error=create_failed');
    }
});

router.post('/admin/toggle-order', async (req, res) => {
    if (!req.session.username || req.session.userId !== 0) {
        return res.status(403).send('Forbidden');
    }

    const { orderId } = req.body;
    await toggleOrderStatus(orderId);
    res.redirect('/admin');
});


router.post('/admin/addCredit',  async (req, res) => {
    if (!req.session.username || req.session.userId !== 0) {
        return res.status(403).send('Forbidden');
    }

    const {userId, charge} = req.body;
    try {
        const result = await updateUserCredit(userId, charge);
        console.log(userId, charge);

        // add result check
        res.redirect('/admin');

    } catch (err) {
        res.status(500).send('Chyba při dobíjení kreditu.');
    }

});
module.exports = router;
