const express = require('express');
const router = express.Router();
const { getInventory } = require('../utils/db');
const { recordShopPayment } = require('../utils/payment');
const path = require('path');


router.get('/toasty/terminal', async (req, res) => {
    if (!req.session.username || ![0, 5, 6].includes(req.session.userId)) {
        return res.redirect('/login');
    }

    try {
        const inventoryResult = await getInventory();
        const inventory = inventoryResult.map(item => ({
            nazev: item.produkt,
            cena: item.cena,
            skladem: item.sklad_skola,
            img: path.posix.join('/resources', String(item.img))
        }));

        res.render('./toasty/terminal', {
            produkty: inventory,
            logoPath: path.posix.join('/resources', "/img/logo.png"),
            status: req.query.status,
            error: req.query.error
        }
        );
    } catch (error) {
        console.error("Chyba na hlavní stránce:", error);
        res.status(500).send('Interní chyba serveru');
    }
});

router.post('/bistro-payment', async (req, res) => {
    if (!req.session.username || ![0, 5, 6].includes(req.session.userId)) {
        return res.redirect('/login');
    }

    // Only the Jaroska.store part of the form is submitted, the toast part is just a QR calculator
    const result = await recordShopPayment(req.body, {
        movementType: 'PT',
        note: 'v Bistru Napoleon',
        authorId: req.session.userId,
    });

    res.redirect(result === 'success' ? '/toasty/terminal?status=success' : `/toasty/terminal?error=${result}`);
});
module.exports = router;
