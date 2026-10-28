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

// Replaces the hard-coded user ids (admin = 0, terminal = 0, 5, 6) with a role per user
exports.up = function(db) {
  const sql = `
    ALTER TABLE uzivatele_tb
      ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'customer'
      CONSTRAINT uzivatele_tb_role_check CHECK (role IN ('admin', 'terminal', 'customer'));

    UPDATE uzivatele_tb SET role = 'admin' WHERE id = 0;
    UPDATE uzivatele_tb SET role = 'terminal' WHERE id IN (5, 6);
  `;

  return db.runSql(sql);
};

exports.down = function(db) {
  return db.removeColumn('uzivatele_tb', 'role');
};

exports._meta = {
  "version": 1
};
