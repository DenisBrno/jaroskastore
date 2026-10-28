const path = require('path');

/**
 * Maps a sklad row to what the product views (main page, product picker) use
 */
const toProductView = (item) => ({
    nazev: item.produkt,
    cena: item.cena,
    skladem: item.sklad_skola,
    img: path.posix.join('/resources', String(item.img)),
});

module.exports = { toProductView };
