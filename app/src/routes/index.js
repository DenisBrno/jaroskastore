const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { getNadchazejiciHodina } = require('../utils/timetable');
const { getInventory } = require('../utils/db');

router.get('/', async (req, res) => {

    try {
        const rozvrhPath = path.join(__dirname, '../rozvrh.json');

        const [rozvrhContent] = await Promise.all([
            fs.readFile(rozvrhPath, 'utf8').catch(() => null)
        ]);

        let lekce = null;
        if (rozvrhContent) {
            try {
                const rozvrh = JSON.parse(rozvrhContent);
                lekce = getNadchazejiciHodina(rozvrh);
            } catch (e) {
                console.error("Chyba při parsování rozvrhu:", e);
            }
        }

        const produkty = await getInventory().then(inventory => {
            return inventory.map(item => ({
                nazev: item.produkt,    
                cena: item.cena, 
                skladem: item.sklad_skola,
                img: item.img,
                vprodeji: item.vprodeji
            }));
        }); 
        console.log(produkty);
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
    const rozvrhPath = path.join(__dirname, '../rozvrh.json');

    try {
        const rozvrhContent = await fs.readFile(rozvrhPath, 'utf8').catch(() => null);
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

router.get('/posters', async (req, res) => {
    try {
        const dataPath = path.join(__dirname, '../data.json');
        const dataContent = await fs.readFile(dataPath, 'utf8');
        const produkty = JSON.parse(dataContent);
        res.render('posters', { produkty: produkty });
    } catch (err) {
        res.status(500).send('Chyba při načítání plakátů');
    }
});

module.exports = router;
