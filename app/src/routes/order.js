const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');
const fs = require('fs').promises;
const path = require('path');
const { getProductsForSale, addOrder, getUserCredit, updateUserCredit, chargeUserCredit } = require('../utils/db');

router.get('/order', requireLogin, async (req, res) => {
    const status = req.query.status;
    const error = req.query.error;
    
    try {
        const inventoryResult = await getProductsForSale();
        const inventory = inventoryResult.map(item => ({
                nazev: item.produkt,
                cena: item.cena,
        }));

        let userCredit = await getUserCredit(req.user.id);
        userCredit = userCredit[0].kredit;

        res.render('order', {
            status: status,
            error: error,
            produkty: inventory,
            credit: userCredit
        });
    } catch (err) {
        res.status(500).send('Chyba při načítání produktů');
    }
});

router.post('/order', requireLogin, async (req, res) => {
    const { produkt, pocet, ucebna, zacatek_prestavky, konec_prestavky, poznamka } = req.body;
    const numPocet = parseInt(pocet);

    let produktData;
    try {
        produktData = (await getProductsForSale()).find(p => p.produkt === produkt);
    } catch (err) {
        return res.redirect('/order?error=db');
    }

    if (!produktData) {
        return res.redirect('/order?error=not_for_sale');
    }
    if (!(numPocet > 0)) {
        return res.redirect('/order?error=invalid');
    }

    const cena = Number(produktData.cena) * numPocet;

    try {
        // The balance has to cover the whole order; checked and deducted in one statement
        const novyKredit = await chargeUserCredit(req.user.id, cena, cena);
        if (novyKredit === null) {
            return res.redirect('/order?error=insufficientCredit');
        }
    } catch (err) {
        return res.redirect('/order?error=db');
    }

    try {
        await addOrder(req.user.login, produkt, numPocet, ucebna, zacatek_prestavky, konec_prestavky, poznamka);
    } catch (err) {
        await updateUserCredit(req.user.id, cena).catch(e => console.error('Refunding credit failed:', e));
        return res.redirect('/order?error=db');
    }

    res.redirect('/order?status=success');
});

module.exports = router;
