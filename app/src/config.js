const path = require('path');

module.exports = {
    DATA_DIR: process.env.DATA_DIR || path.join(__dirname, '..', 'resources')
};