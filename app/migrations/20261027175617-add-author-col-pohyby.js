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
  return db.addColumn('pohyby', 'author_id', {
    type: 'int',
    defaultValue: -1
  });
};

exports.down = function(db) {
  return db.removeColumn('pohyby', 'author_id')
};

exports._meta = {
  "version": 1
};