const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { getInventory, addOrder , getUserCredit} = require('../utils/db');

router.get('/order', async (req, res) => {
    if (!req.session.username) {
        return res.redirect('/login');
    }

    const status = req.query.status;
    const error = req.query.error;
    
    try {
        const inventoryResult = await getInventory();
        const inventory = inventoryResult.map(item => ({
            nazev: item.produkt,
            cena: item.cena,
        }));

        let userCredit = await getUserCredit(req.session.userId);
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

router.post('/order', async (req, res) => {
    if (!req.session.username) {
        return res.redirect('/login');
    }

    const { produkt, pocet, ucebna, zacatek_prestavky, konec_prestavky, poznamka } = req.body;
    const numPocet = parseInt(pocet);

    try {
        const inventoryResult = await getInventory();
        const inventory = inventoryResult.map(item => ({
            nazev: item.produkt,
            cena: item.cena,
        }));

        const produktData = inventory.find(p => p.nazev === produkt);

        if (produktData && numPocet > 0) {

            let userCredit = await getUserCredit(req.session.userId);
            userCredit = userCredit[0].kredit;
            if(userCredit-produktData.cena < 0){
                res.redirect('order?error=insufficientCredit');
            }
            
            const success = await addOrder(req.session.username, produkt, numPocet, ucebna, zacatek_prestavky, konec_prestavky, poznamka);

            if (success) {
                res.redirect('/order?status=success');
            } else {
                res.redirect('/order?error=db');
            }
        } else {
            res.redirect('/order?error=invalid');
        }
    } catch (err) {
        res.status(500).send('Chyba při zpracování objednávky');
    }
});

module.exports = router;
