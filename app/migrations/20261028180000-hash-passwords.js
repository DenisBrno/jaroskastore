'use strict';

const { hashPassword } = require('../src/utils/password');

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

// Replaces the plain-text passwords with scrypt hashes; users keep their current passwords.
// Rows that already hold a hash are skipped, so the migration can safely run again.
exports.up = async function(db) {
  await db.runSql('ALTER TABLE uzivatele_tb ALTER COLUMN password TYPE TEXT');

  const users = await db.all("SELECT id, password FROM uzivatele_tb WHERE password IS NOT NULL AND password NOT LIKE 'scrypt$%'");
  for (const user of users) {
    await db.runSql('UPDATE uzivatele_tb SET password = ? WHERE id = ?', [await hashPassword(user.password), user.id]);
  }
};

// Hashes cannot be turned back into passwords
exports.down = function() {
  return Promise.resolve();
};

exports._meta = {
  "version": 1
};
