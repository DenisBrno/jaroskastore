const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const { toProductView } = require('../utils/products');
const { getInventory, getProductsForSale, getMovementsSum, getMovements, createProduct, transferItem } = require('../utils/db');
const { recordShopPayment } = require('../utils/payment');

router.get('/payment', requireAdmin, async (req, res) => {
    try {
        const produkty = (await getProductsForSale()).map(toProductView);

        res.render('payment', { produkty, status: req.query.status, error: req.query.error });
    } catch (error) {
        console.error('Error loading products for payment:', error);
        res.render('payment', { produkty: [], status: req.query.status, error: 'loading_products' });
    }
});


router.post('/payment', requireAdmin, async (req, res) => {
    const result = await recordShopPayment(req.body, {
        movementType: 'P',
        authorId: req.user.id,
    });

    res.redirect(result === 'success' ? '/payment?status=success' : `/payment?error=${result}`);
});

router.get('/finances', requireAdmin, async (req, res) => {
    try {
        const totalExpenses = await getMovementsSum(null, 'N');
        const totalIncome = await getMovementsSum(null, 'P');
        const pohyby = await getMovements();

        res.render('./finances/overview', {
            totalIncome,
            totalExpenses,
            pohyby
        });
    } catch (error) {
        console.error('Error loading financial data:', error);
        res.status(500).send('Chyba serveru při načítání financí');
    }
});

router.get('/finances/table', requireAdmin, async (req, res) => {
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

router.get('/manage-items', requireAdmin, async (req, res) => {
    try {
        const inventoryResult = await getInventory();
        const inventory = inventoryResult.map(item => ({
            name: item.produkt,
            homeQuantity: item.sklad_doma,
            schoolQuantity: item.sklad_skola
        }));

        res.render('./finances/manage-items', { 
            inventory 
        });
    } catch (error) {
        console.error('Error loading financial data:', error);
        res.status(500).send('Chyba serveru při načítání financí');
    }
});


router.post('/manage-items/create', requireAdmin, async (req, res) => {
    const { produkt, sklad_doma, sklad_skola } = req.body;
    const numSklad_doma = parseInt(sklad_doma);
    const numSklad_skola = parseInt(sklad_skola);

    if (produkt && numSklad_doma >= 0 && numSklad_skola >= 0) {
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

router.post('/manage-items/transfer', requireAdmin, async (req, res) => {
    const { produkt, mnozstvi } = req.body;
    const numQuantity = parseInt(mnozstvi);
    if (produkt && numQuantity > 0) {
        const success = await transferItem(produkt, numQuantity);
        if (success) {
            res.redirect('/manage-items');
        } else {
            res.status(400).send('Doma není dost kusů tohoto produktu');
        }
    } else {
        res.status(400).send('Neplatné vstupy pro přemístění produktu');
    }
});



module.exports = router;
