const path = require('path');

module.exports = {
    DATA_DIR: process.env.DATA_DIR || path.join(__dirname, '..', 'resources'),
    // Account for QR payments
    IBAN: process.env.IBAN || 'CZ9120100000002103161375'
};