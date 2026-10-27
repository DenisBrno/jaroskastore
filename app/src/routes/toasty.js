const express = require('express');
const router = express.Router();
const { getInventory, getUserCredit, updateUserCredit, createMovement, updateInventory} = require('../utils/db');
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
            logoPath: path.posix.join('/resources', "/img/logo.png")
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

    try {
        console.log(req.body)
    } catch(err) {

    }

    try {
        const orderPromises = [];
        const slevaToasty  = parseInt(req.body.sleva[0]) || 0;
        const slevaObchod  = parseInt(req.body.sleva[1]) || 0;
        let slevaObchodPridelena = false;
        

        for (const [key, value] of Object.entries(req.body)) {
            const quantity = parseInt(value);
            if (key.startsWith('qty-') && quantity > 0) {
                const productName = key.replace('qty-', '');

                if(productName == "1toast"){
                    orderPromises.push(createMovement("Toasty", 'T', quantity, req.body.amount[0]/quantity ,-slevaToasty, `${req.body.paymentMethod[0]}, Bistro Napoleon`));
                    continue;
                }

                const produktData = produkty.find(p => p.nazev === productName);
                const cenaZaKus = produktData ? produktData.cena : 0;

                let slevaKZapisu = 0;
                if (!slevaObchodPridelena) {
                    slevaKZapisu = slevaObchod;
                    slevaObchodPridelena = true;
                }

                orderPromises.push(createMovement(productName, 'PT', quantity, cenaZaKus, -slevaKZapisu, `${req.body.paymentMethod[1]}, v Bistru Napoleon`));
				orderPromises.push(updateInventory(productName, 0, -quantity));
                if (req.body.paymentMethod[1]=='credit'){
                    orderPromises.push(updateUserCredit(req.body.userId, -req.body.amount-req.body.bonus));
                }
            } 
        }

        await Promise.all(orderPromises);
        res.redirect('/toasty/terminal?status=success');

    } catch (error) {
        console.error('Error processing payment:', error);
        res.redirect('/toasty/terminal?error=processing');
    }

});
module.exports = router;
