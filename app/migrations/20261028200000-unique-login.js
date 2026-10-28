'use strict';

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

// Logins are unique regardless of case ("Denis" and "denis" are the same user)
exports.up = function(db) {
  return db.runSql('CREATE UNIQUE INDEX IF NOT EXISTS uzivatele_tb_login_unique ON uzivatele_tb (LOWER(login))');
};

exports.down = function(db) {
  return db.runSql('DROP INDEX IF EXISTS uzivatele_tb_login_unique');
};

exports._meta = {
  "version": 1
};
