const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const { getNadchazejiciHodina, ROZVRH_PATH } = require('../utils/timetable');
const { getProductsForSale } = require('../utils/db');
const { toProductView } = require('../utils/products');

router.get('/', async (req, res) => {

    try {
        const rozvrhContent = await fs.readFile(ROZVRH_PATH, 'utf8').catch(() => null);

        let lekce = null;
        if (rozvrhContent) {
            try {
                const rozvrh = JSON.parse(rozvrhContent);
                lekce = getNadchazejiciHodina(rozvrh);
            } catch (e) {
                console.error("Chyba při parsování rozvrhu:", e);
            }
        }

        const produkty = (await getProductsForSale()).map(toProductView);
        
        res.render('index', {
            lekce: lekce,
            produkty: produkty
        });
    } catch (error) {
        console.error("Chyba na hlavní stránce:", error);
        res.status(500).send('Interní chyba serveru');
    }
});

router.get('/rozvrh', async (req, res) => {
    try {
        const rozvrhContent = await fs.readFile(ROZVRH_PATH, 'utf8').catch(() => null);
        if (!rozvrhContent) {
            return res.status(404).send('Rozvrh nenalezen.');
        }

        const rozvrh = JSON.parse(rozvrhContent);
        const aktualniLekce = getNadchazejiciHodina(rozvrh);

        res.render('rozvrh', {
            rozvrh: rozvrh,
            aktualniLekce: aktualniLekce
        });
    } catch (err) {
        res.status(500).send('Chyba při načítání rozvrhu');
    }
});

module.exports = router;
