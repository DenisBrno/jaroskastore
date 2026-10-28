const express = require('express');
const router = express.Router();
const { getInventory, updateUserCredit, chargeUserCredit, createMovement, updateInventory } = require('../utils/db');
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
    
    let produkty = [];

    try {
        const inventoryResult = await getInventory();
        produkty = inventoryResult.map(item => ({
            nazev: item.produkt,
            cena: item.cena,
        }));
    } catch (error) {
        console.error('Error loading products:', error);
        return res.redirect('/toasty/terminal?error=loading_products');
    }

    // Only the Jaroska.store part of the form is submitted, the toast part is just a QR calculator
    const polozky = [];
    for (const [key, value] of Object.entries(req.body)) {
        const quantity = parseInt(value);
        if (key.startsWith('qty-') && quantity > 0) {
            const productName = key.replace('qty-', '');
            const produktData = produkty.find(p => p.nazev === productName);
            if (!produktData) {
                return res.redirect('/toasty/terminal?error=invalid');
            }
            polozky.push({ nazev: productName, mnozstvi: quantity, cena: Number(produktData.cena) });
        }
    }

    if (polozky.length === 0) {
        return res.redirect('/toasty/terminal?error=empty');
    }

    const cenaPolozek = polozky.reduce((sum, p) => sum + p.mnozstvi * p.cena, 0);
    const castka = Number.isNaN(parseInt(req.body.amount)) ? cenaPolozek : parseInt(req.body.amount);
    const sleva = parseInt(req.body.sleva) || 0;
    const kZaplaceni = castka - sleva;
    const paymentMethod = req.body.paymentMethod;

    if (kZaplaceni < 0 || !['qr', 'cash', 'credit'].includes(paymentMethod)) {
        return res.redirect('/toasty/terminal?error=invalid');
    }

    const userId = parseInt(req.body.userId);
    let kreditStrzen = false;

    try {
        if (paymentMethod === 'credit') {
            if (Number.isNaN(userId)) {
                return res.redirect('/toasty/terminal?error=no_user');
            }
            // Balance must not be negative before paying, it may go below zero after
            const novyKredit = await chargeUserCredit(userId, kZaplaceni);
            if (novyKredit === null) {
                return res.redirect('/toasty/terminal?error=negative_credit');
            }
            kreditStrzen = true;
        }

        // The difference between the paid amount and the item prices (discount or a manually
        // edited amount) goes to the first movement, so the movements add up to the paid amount
        const rozdil = kZaplaceni - cenaPolozek;
        const poznamka = paymentMethod === 'credit'
            ? `credit, userId:${userId}, v Bistru Napoleon`
            : `${paymentMethod}, v Bistru Napoleon`;

        await Promise.all(polozky.flatMap((p, i) => [
            createMovement(p.nazev, 'PT', p.mnozstvi, p.cena, i === 0 ? rozdil : 0, poznamka, req.session.userId),
            updateInventory(p.nazev, 0, -p.mnozstvi),
        ]));

        res.redirect('/toasty/terminal?status=success');

    } catch (error) {
        console.error('Error processing payment:', error);
        if (kreditStrzen) {
            await updateUserCredit(userId, kZaplaceni).catch(err => console.error('Refunding credit failed:', err));
        }
        res.redirect('/toasty/terminal?error=processing');
    }

});
module.exports = router;
