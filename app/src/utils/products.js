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

/**
 * Image file name for a product: diacritics dropped, spaces replaced with "_",
 * every other character that is not a letter, digit, "_" or "-" removed.
 * "Perlivá voda (1,5 l)" -> "Perliva_voda_15_l"
 */
const productImageBaseName = (productName) => String(productName)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_-]/g, '')
    .slice(0, 100);

// Accepted image types, recognised by the file's first bytes (not by its name or the browser's type)
const IMAGE_TYPES = [
    { ext: '.png', matches: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
    { ext: '.jpg', matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
    { ext: '.webp', matches: (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
];

/**
 * Returns the file extension for a PNG, JPEG or WebP image, or null for anything else
 */
const detectImageExtension = (buffer) => {
    const type = buffer && buffer.length >= 12 && IMAGE_TYPES.find(t => t.matches(buffer));
    return type ? type.ext : null;
};

module.exports = { toProductView, productImageBaseName, detectImageExtension };
