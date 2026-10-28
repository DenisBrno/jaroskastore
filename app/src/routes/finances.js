const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const { requireAdmin } = require('../middleware/auth');
const { toProductView, productImageBaseName, detectImageExtension } = require('../utils/products');
const { getInventory, getProductsForSale, getMovementsSum, getMovements, createProduct, getProductClash, transferItem } = require('../utils/db');
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
            inventory,
            status: req.query.status,
            error: req.query.error
        });
    } catch (error) {
        console.error('Error loading financial data:', error);
        res.status(500).send('Chyba serveru při načítání financí');
    }
});


// Whole number >= min from a form field, otherwise null
const parseWholeNumber = (value, min) => {
    const text = String(value ?? '').trim();
    return /^\d+$/.test(text) && Number(text) >= min ? Number(text) : null;
};

// New product: every column is required, the image is saved as DATA_DIR/img/<product name>.<type>
router.post('/manage-items/create', requireAdmin, async (req, res) => {
    const fail = (error) => res.redirect(`/manage-items?error=${error}`);
    if (req.uploadError) {
        return fail(req.uploadError);
    }

    const product = String(req.body.produkt || '').trim();
    const homeStock = parseWholeNumber(req.body.sklad_doma, 0);
    const schoolStock = parseWholeNumber(req.body.sklad_skola, 0);
    const price = parseWholeNumber(req.body.cena, 1);
    const forSale = { true: true, false: false }[req.body.vprodeji];
    const image = (req.files || []).find(f => f.fieldname === 'img');

    if (!product || product.length > 255 || homeStock === null || schoolStock === null || price === null || forSale === undefined) {
        return fail('invalid_input');
    }
    if (!image) {
        return fail('no_image');
    }
    const extension = detectImageExtension(image.buffer);
    if (!extension) {
        return fail('invalid_image');
    }
    const baseName = productImageBaseName(product);
    if (!baseName) {
        return fail('invalid_name');
    }

    const fileName = `${baseName}${extension}`;
    const img = `/img/${fileName}`;
    const imageDir = path.join(config.DATA_DIR, 'img');
    const imagePath = path.join(imageDir, fileName);

    try {
        const clash = await getProductClash(product, img);
        if (clash) {
            return fail(clash);
        }

        await fs.mkdir(imageDir, { recursive: true });
        await fs.writeFile(imagePath, image.buffer);

        const created = await createProduct({ product, homeStock, schoolStock, price, img, forSale });
        if (!created) {
            // Someone created the same product in the meantime
            await fs.unlink(imagePath).catch(() => {});
            return fail('name_exists');
        }

        console.log(`[ITEMS] ${req.user.login} created product "${product}" (${img})`);
        res.redirect('/manage-items?status=created');
    } catch (error) {
        console.error('Error creating product:', error);
        await fs.unlink(imagePath).catch(() => {});
        fail('create_failed');
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
