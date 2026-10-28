const path = require('path');
const DBMigrate = require('db-migrate');

const APP_ROOT = path.join(__dirname, '..', '..');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Brings the database schema to the latest migration (migrations/*.js, the same as npm run migrate:up).
 * Seeds (migrations/seed) are never run here. Retries while the database is still starting up.
 */
const migrateToLatest = async ({ attempts = 10, delayMs = 3000 } = {}) => {
    for (let attempt = 1; ; attempt++) {
        try {
            const dbmigrate = DBMigrate.getInstance(true, {
                cwd: APP_ROOT,
                config: path.join(APP_ROOT, 'database.json'),
                env: 'dev',
            });
            await dbmigrate.up();
            console.log('[MIGRATE] Database is up to date.');
            return;
        } catch (err) {
            if (attempt >= attempts) {
                throw err;
            }
            console.error(`[MIGRATE] Attempt ${attempt}/${attempts} failed (${err.message}), retrying in ${delayMs / 1000} s...`);
            await sleep(delayMs);
        }
    }
};

module.exports = { migrateToLatest };
