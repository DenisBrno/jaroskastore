const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');
const fs = require('fs').promises;
const path = require('path');
const { getInventory, addOrder , getUserCredit, updateUserCredit} = require('../utils/db');

router.get('/order', requireLogin, async (req, res) => {
    const status = req.query.status;
    const error = req.query.error;
    
    try {
        const inventoryResult = await getInventory();
        const inventory = inventoryResult
            .filter(item => item.vprodeji !== false)
            .map(item => ({
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

    try {
        const inventoryResult = await getInventory();
        const inventory = inventoryResult.map(item => ({
            nazev: item.produkt,
            cena: item.cena,
        }));

        const produktData = inventory.find(p => p.nazev === produkt);

        if (produktData && numPocet > 0) {

            let userCredit = await getUserCredit(req.user.id);
            userCredit = userCredit[0].kredit;

            if(userCredit-(produktData.cena*numPocet) < 0){
                res.redirect('order?error=insufficientCredit');
                return -1;
            }

            const successOrder = await addOrder(req.user.login, produkt, numPocet, ucebna, zacatek_prestavky, konec_prestavky, poznamka);
            const successFunds = await updateUserCredit(req.user.id, -(produktData.cena*numPocet));
            
            if (!successOrder || !successFunds || !successTransfer) {
                res.redirect('/order?error=db');
                return -1;
            } 

            res.redirect('/order?status=success');
            return 0;
        } else {
            res.redirect('/order?error=invalid');
        }
    } catch (err) {
        res.status(500).send('Chyba při zpracování objednávky');
    }
});

module.exports = router;
