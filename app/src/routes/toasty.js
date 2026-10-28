const express = require('express');
const router = express.Router();
const { requireTerminal } = require('../middleware/auth');
const { getProductsForSale } = require('../utils/db');
const { recordShopPayment } = require('../utils/payment');
const path = require('path');


router.get('/toasty/terminal', requireTerminal, async (req, res) => {
    try {
        const inventoryResult = await getProductsForSale();
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

router.post('/bistro-payment', requireTerminal, async (req, res) => {
    // Only the Jaroska.store part of the form is submitted, the toast part is just a QR calculator
    const result = await recordShopPayment(req.body, {
        movementType: 'PT',
        note: 'v Bistru Napoleon',
        authorId: req.user.id,
    });

    res.redirect(result === 'success' ? '/toasty/terminal?status=success' : `/toasty/terminal?error=${result}`);
});
module.exports = router;
