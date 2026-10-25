const path = require('path');
const express = require('express');
const router = express.Router();
const { getInventory, getMovementsSum, getMovements, createProduct, transferItem, createMovement, updateInventory, updateUserCredit } = require('../utils/db');

router.get('/payment', async (req, res) => {
    if (!req.session.username || req.session.userId !== 0) {
        return res.redirect('/login');
    }
    try {
        const inventoryResult = await getInventory();
        const produkty = inventoryResult.map(item => ({
            nazev: item.produkt,
            cena: item.cena,
            skladem: item.sklad_skola,
            img: path.posix.join('/resources', String(item.img))
        }));

        res.render('payment', { produkty });
    } catch (error) {
        console.error('Error loading products for payment:', error);
        res.render('payment', { produkty: [] });
    }
});


router.post('/payment', async (req, res) => {
    if (!req.session.username || req.session.userId !== 0) {
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
        return res.redirect('/payment?error=loading_products');
    }

    try {
        const orderPromises = [];
        const celkovaSleva = parseInt(req.body.sleva) || 0;
        let slevaPridelena = false;
        
        for (const [key, value] of Object.entries(req.body)) {
            const quantity = parseInt(value);
            
            if (key.startsWith('qty-') && quantity > 0) {
                const productName = key.replace('qty-', '');
                const produktData = produkty.find(p => p.nazev === productName);
                const cenaZaKus = produktData ? produktData.cena : 0;

                let slevaKZapisu = 0;
                if (!slevaPridelena) {
                    slevaKZapisu = celkovaSleva;
                    slevaPridelena = true;
                }

                orderPromises.push(createMovement(productName, 'P', quantity, cenaZaKus, -slevaKZapisu, `${req.body.paymentMethod}, userId:${req.body.userId}`));
				orderPromises.push(updateInventory(productName, 0, -quantity));
                orderPromises.push(updateUserCredit(req.body.userId, -req.body.amount-req.body.bonus));
            }
        }

        await Promise.all(orderPromises);
        res.redirect('/payment?status=success');

    } catch (error) {
        console.error('Error processing payment:', error);
        res.redirect('/payment?error=processing');
    }
});

router.get('/finances', async (req, res) => {
    if (!req.session.username || req.session.userId !== 0) {
        return res.redirect('/login');
    }
    try {
		const totalExpenses = await getMovementsSum(null, 'N');
    	const totalIncome = await getMovementsSum(null, 'P');

        const inventoryResult = await getInventory();
        const inventory = inventoryResult.map(item => ({
            name: item.produkt,
            homeQuantity: item.sklad_doma,
            schoolQuantity: item.sklad_skola
        }));

		const pohybyRes = await getMovements(null, null, 'id, produkt, mnozstvi, celkem, cas, poznamka');
		const pohyby = await pohybyRes.map(pohyb => ({
			produkt: pohyb.produkt,
			mnozstvi: pohyb.mnozstvi,
			celkem:  pohyb.celkem,
			cas: pohyb.cas,
			poznamka: pohyb.poznamka
		}));
		
        res.render('./finances/overview', { 
            totalIncome, 
            totalExpenses, 
            inventory, 
			pohyby
        });
    } catch (error) {
        console.error('Error loading financial data:', error);
        res.status(500).send('Chyba serveru při načítání financí');
    }
});

router.get('/finances/table', async (req, res) => {
    if (!req.session.username || req.session.userId !== 0) {
        return res.redirect('/login');
    }

    const { produkt, dny } = req.query;
    
    try {
        const inventoryResult = await getInventory();
        const produktyList = inventoryResult.map(item => item.produkt);

        // Získáme všechny "příjmy" (prodeje) - typ 'P'
        let pohyby = await getMovements(produkt, 'P');

        // Jednoduché filtrování podle času (dnů) v JS pro flexibilitu, 
        // nebo bychom mohli upravit SQL query v db.js
        if (dny) {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - parseInt(dny));
            pohyby = pohyby.filter(p => new Date(p.cas) >= cutoff);
        }

        const totalSold = pohyby.reduce((sum, p) => sum + p.mnozstvi, 0);
        const totalProfit = pohyby.reduce((sum, p) => sum + parseFloat(p.celkem), 0);

        res.render('./finances/table', { 
            session: req.session,
            pohyby,
            produktyList,
            selectedProdukt: produkt || '',
            selectedDny: dny || '',
            totalSold,
            totalProfit
        });
    } catch (error) {
        console.error('Error loading sales table:', error);
        res.status(500).send('Chyba serveru při načítání tabulky prodejů');
    }
});

router.get('/manage-items', async (req, res) => {
    if (!req.session.username || req.session.userId !== 0) {
        return res.redirect('/login');
    }
    try {
        const inventoryResult = await getInventory();
        const inventory = inventoryResult.map(item => ({
            name: item.produkt,
            homeQuantity: item.sklad_doma,
            schoolQuantity: item.sklad_skola
        }));

        res.render('./finances/manageItems', { 
            inventory 
        });
    } catch (error) {
        console.error('Error loading financial data:', error);
        res.status(500).send('Chyba serveru při načítání financí');
    }
});


router.post('/manage-items/create', async (req, res) => {
    if (!req.session.username || req.session.userId !== 0) { 
        return res.redirect('/login');
    }

    const { produkt, sklad_doma, sklad_skola } = req.body;
    const numSklad_doma = parseInt(sklad_doma);
    const numSklad_skola = parseInt(sklad_skola);

    if (produkt && !isNaN(numSklad_doma) && !isNaN(numSklad_skola)) {
        const success = await createProduct(produkt, numSklad_doma, numSklad_skola);
        if (success) {
            res.redirect('/manage-items');
        } else {
            res.status(500).send('Chyba při vytváření produktu');
        }
    } else {
        res.status(400).send('Neplatné vstupy pro vytvoření produktu');
    }
});

router.post('/manage-items/transfer', async (req, res) => {
    if (!req.session.username || req.session.userId !== 0) {
        return res.redirect('/login');
    }

    const { produkt, mnozstvi } = req.body;
    const numQuantity = parseInt(mnozstvi);
    if (produkt && !isNaN(numQuantity)) {
        const success = await transferItem(produkt, numQuantity);
        if (success) {
            res.redirect('/manage-items');
        } else {
            res.status(500).send('Chyba při přemístění produktu');
        }
    } else {
        res.status(400).send('Neplatné vstupy pro přemístění produktu');
    }
});



module.exports = router;
