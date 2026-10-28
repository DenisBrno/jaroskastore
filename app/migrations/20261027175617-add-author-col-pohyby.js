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

exports.up = function(db) {
  // IF NOT EXISTS: safe on databases that got the column before migrations were tracked
  return db.runSql('ALTER TABLE pohyby ADD COLUMN IF NOT EXISTS author_id INTEGER DEFAULT -1');
};

exports.down = function(db) {
  return db.removeColumn('pohyby', 'author_id')
};

exports._meta = {
  "version": 1
};