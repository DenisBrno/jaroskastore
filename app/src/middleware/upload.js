const multer = require('multer');

// Files stay in memory until the route has validated the whole form, so nothing is written for a rejected form
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const parseMultipart = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 20 },
}).any();

/**
 * Parses multipart/form-data forms (file uploads) before the CSRF check, which needs the form fields.
 * Only for logged-in users; for guests the body stays empty and the CSRF check refuses the request.
 * Upload errors (e.g. a file over 5 MB) are left for the route in req.uploadError.
 */
const multipartForms = (req, res, next) => {
    if (!req.user || !req.is('multipart/form-data')) {
        return next();
    }
    parseMultipart(req, res, (err) => {
        if (err) {
            req.uploadError = err.code === 'LIMIT_FILE_SIZE' ? 'image_too_large' : 'upload_failed';
            req.files = [];
        }
        next();
    });
};

module.exports = { multipartForms, MAX_FILE_SIZE };
