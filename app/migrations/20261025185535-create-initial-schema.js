'use strict';

var dbm;
var type;
var seed;

exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  const sql = `
    -- 1. uzivatele_tb
    CREATE SEQUENCE IF NOT EXISTS uzivatele_tb_id_seq START WITH 1 INCREMENT BY 1;
    CREATE TABLE IF NOT EXISTS uzivatele_tb (
        id INTEGER NOT NULL DEFAULT nextval('uzivatele_tb_id_seq'),
        login VARCHAR(100),
        password VARCHAR(100),
        kredit INTEGER,
        CONSTRAINT uzivatele_tb_pkey PRIMARY KEY (id)
    );

    -- 2. sklad
    CREATE SEQUENCE IF NOT EXISTS sklad_id_seq START WITH 1 INCREMENT BY 1;
    CREATE TABLE IF NOT EXISTS sklad (
        id INTEGER NOT NULL DEFAULT nextval('sklad_id_seq'),
        produkt VARCHAR(255) NOT NULL,
        sklad_doma INTEGER DEFAULT 0,
        sklad_skola INTEGER DEFAULT 0,
        cena INTEGER,
        img TEXT,
        vprodeji BOOLEAN DEFAULT false,
        CONSTRAINT sklad_pkey PRIMARY KEY (id)
    );

    -- 3. pohyby
    CREATE SEQUENCE IF NOT EXISTS pohyby_id_seq START WITH 1 INCREMENT BY 1;
    CREATE TABLE IF NOT EXISTS pohyby (
        id INTEGER NOT NULL DEFAULT nextval('pohyby_id_seq'),
        cas TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        typ_pohybu VARCHAR(1),
        mnozstvi INTEGER NOT NULL,
        cena_za_kus NUMERIC(10,2) NOT NULL,
        bonus NUMERIC(10,2) DEFAULT 0,
        celkem NUMERIC(12,2) GENERATED ALWAYS AS (((mnozstvi)::numeric * cena_za_kus) + bonus) STORED,
        poznamka TEXT,
        produkt TEXT,
        CONSTRAINT pohyby_pkey PRIMARY KEY (id)
    );

    -- 4. objednavky_tb
    CREATE SEQUENCE IF NOT EXISTS objednavky_tb_id_seq START WITH 1 INCREMENT BY 1;
    CREATE TABLE IF NOT EXISTS objednavky_tb (
        id INTEGER NOT NULL DEFAULT nextval('objednavky_tb_id_seq'),
        customer_name VARCHAR(100),
        product_name TEXT,
        quantity INTEGER,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        status BOOLEAN DEFAULT false,
        ucebna VARCHAR(20),
        prestavka_start TIME WITHOUT TIME ZONE,
        prestavka_end TIME WITHOUT TIME ZONE,
        poznamka TEXT,
        pohybid INTEGER,
        CONSTRAINT objednavky_tb_pkey PRIMARY KEY (id)
    );

    -- Ensure column name is consistent if table already existed
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='objednavky_tb' AND column_name='pohybid'
        ) THEN
            -- Foreign key binding for lowercase pohybid
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'fk_objednavky_pohyb'
            ) THEN
                ALTER TABLE objednavky_tb
                ADD CONSTRAINT fk_objednavky_pohyb
                FOREIGN KEY (pohybid) REFERENCES pohyby(id)
                ON DELETE SET NULL;
            END IF;
        END IF;
    END
    $$;

    -- 5. session
    CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) WITHOUT TIME ZONE NOT NULL,
        CONSTRAINT session_pkey PRIMARY KEY (sid)
    );

    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON session (expire);
  `;

  return db.runSql(sql);
};

exports.down = function(db) {
  const sql = `
    DROP TABLE IF EXISTS objednavky_tb CASCADE;
    DROP SEQUENCE IF EXISTS objednavky_tb_id_seq;

    DROP TABLE IF EXISTS pohyby CASCADE;
    DROP SEQUENCE IF EXISTS pohyby_id_seq;

    DROP TABLE IF EXISTS sklad CASCADE;
    DROP SEQUENCE IF EXISTS sklad_id_seq;

    DROP TABLE IF EXISTS uzivatele_tb CASCADE;
    DROP SEQUENCE IF EXISTS uzivatele_tb_id_seq;

    DROP TABLE IF EXISTS session CASCADE;
  `;

  return db.runSql(sql);
};

exports._meta = {
  "version": 1
};