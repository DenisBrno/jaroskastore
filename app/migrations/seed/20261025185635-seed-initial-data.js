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
    -- 1. uzivatele_tb (dev login Denis / 12, the password is stored as a scrypt hash)
    INSERT INTO uzivatele_tb (id, login, password, kredit, role) VALUES
    (0, 'Denis', 'scrypt$16384$8$1$LIBJtAMTDjX56fO6fXi8eQ==$8cPxpqQ22hySiych9L/IOq+9ldfWmhhMN0oWOmM0oSX3KC4cUFBZ7skOvxlEcxnKhUkPQLyLxhwVgVvVTmsVpQ==', 100, 'admin')
    ON CONFLICT (id) DO NOTHING;

    -- 2. sklad
    INSERT INTO sklad (id, produkt, sklad_doma, sklad_skola, cena, img, vprodeji) VALUES
    (1, 'Monster Ultra White', 1, 2, 30, '/img/Monster_UW.png', false),
    (2, 'Monster Mango Loco', 9, 1, 30, '/img/Monster_ML.png', false),
    (3, 'Monster Ultra Strawberry Dreams', 6, 1, 30, '/img/Monster_USD.png', false),
    (4, 'Coca-Cola', 8, 4, 30, '/img/Cola.png', true),
    (5, 'RedBull Classic', 8, 3, 30, '/img/redbull.png', true),
    (6, 'Perlivá voda', 0, 0, 12, '/img/voda.png', false),
    (7, 'Alaska', 22, 2, 6, '/img/alaska.png', true),
    (8, 'Dupetky', 1, 2, 20, '/img/dupetky.png', false),
    (9, 'Corny Salted Caramel', 18, 0, 17, '/img/corny.png', false),
    (10, 'Corny Banana', 2, 2, 17, '/img/corny.png', false),
    (11, 'Corny White Choco', 16, 1, 17, '/img/corny.png', false),
    (12, 'Kinder Bueno', 10, 0, 20, '/img/bueno.png', false),
    (13, 'Dr. Pepper', 5, 2, 20, '/img/drpepper.png', false),
    (14, 'Kinder Bueno White', 40, 4, 20, '/img/bueno-white.png', false),
    (15, 'Pringles', 3, 0, 60, '/img/pringles.png', false),
    (16, 'Cool (různé příchutě)', 16, 1, 20, '/img/cool.png', false),
    (17, 'Opavia oplatky', 12, 1, 30, '/img/opavia.png', false)
    ON CONFLICT (id) DO NOTHING;

    -- 3. pohyby
    INSERT INTO pohyby (id, cas, typ_pohybu, mnozstvi, cena_za_kus, bonus, poznamka, produkt) VALUES
    (8, '2026-05-04 07:52:00.43784', 'P', 1, 30.00, 0.00, 'QR Platba', 'Coca-Cola'),
    (9, '2026-05-04 12:09:22.508101', 'P', 1, 30.00, 0.00, 'QR Platba', 'Coca-Cola'),
    (10, '2026-05-04 13:28:05.690033', 'P', 1, 30.00, 0.00, 'QR Platba', 'Coca-Cola'),
    (12, '2026-05-05 10:56:31.513466', 'P', 1, 20.00, 0.00, 'QR Platba', 'Kinder Bueno White'),
    (0, '2026-05-01 12:00:00', 'N', 1, 6184.09, 0.00, 'prechod na db', NULL),
    (1, '2026-05-01 12:00:00', 'P', 1, 4567.00, 0.00, 'prechod na db', NULL),
    (15, '2026-05-06 08:48:25.107437', 'P', 1, 20.00, 0.00, 'QR Platba', 'Dr. Pepper'),
    (16, '2026-05-06 09:45:24.724839', 'P', 1, 30.00, 0.00, 'QR Platba', 'Monster Ultra White'),
    (17, '2026-05-06 09:45:24.751891', 'P', 1, 30.00, 0.00, 'QR Platba', 'Monster Mango Loco'),
    (19, '2026-05-06 13:49:32.292775', 'P', 1, 20.00, 2.00, 'QR Platba', 'Dupetky'),
    (21, '2026-05-06 13:52:49.331046', 'P', 1, 30.00, 0.00, 'QR Platba', 'Coca-Cola'),
    (20, '2026-05-06 13:49:32.310892', 'P', 1, 20.00, 0.00, 'QR Platba', 'Kinder Bueno White'),
    (18, '2026-05-06 09:45:24.752793', 'P', 1, 20.00, 0.00, 'QR Platba', 'Kinder Bueno White'),
    (23, '2026-05-07 10:22:40.831053', 'P', 2, 20.00, 0.00, 'QR Platba', 'Kinder Bueno White'),
    (22, '2026-05-07 10:22:40.812178', 'P', 1, 17.00, -17.00, 'QR Platba', 'Corny White Choco'),
    (24, '2026-05-07 11:49:22.219814', 'P', 2, 6.00, 0.00, 'QR Platba', 'Alaska'),
    (25, '2026-05-11 07:48:35.042137', 'P', 1, 6.00, 0.00, 'QR Platba', 'Alaska'),
    (26, '2026-05-11 07:48:35.071891', 'P', 1, 20.00, 0.00, 'QR Platba', 'Dr. Pepper'),
    (27, '2026-05-11 10:25:16.935724', 'P', 1, 30.00, 0.00, 'QR Platba', 'Coca-Cola'),
    (28, '2026-05-11 10:44:29.467721', 'P', 1, 17.00, 0.00, 'QR Platba', 'Corny White Choco'),
    (29, '2026-05-11 12:55:07.544055', 'P', 1, 30.00, 0.00, 'QR Platba', 'Coca-Cola'),
    (30, '2026-05-12 11:19:14.403302', 'P', 1, 30.00, 0.00, 'QR Platba', 'Monster Mango Loco'),
    (31, '2026-05-12 11:19:14.419298', 'P', 1, 30.00, 0.00, 'QR Platba', 'Coca-Cola'),
    (32, '2026-05-14 10:26:41.711375', 'P', 1, 30.00, 0.00, 'QR Platba', 'Monster Ultra White'),
    (33, '2026-05-14 10:26:41.724992', 'P', 1, 17.00, 0.00, 'QR Platba', 'Corny Salted Caramel'),
    (34, '2026-05-14 11:49:26.553764', 'P', 1, 30.00, 0.00, 'QR Platba', 'RedBull Classic'),
    (35, '2026-05-14 11:50:24.108788', 'P', 1, 30.00, 0.00, 'QR Platba', 'RedBull Classic'),
    (36, '2026-05-14 13:35:16.045579', 'P', 1, 6.00, 1.00, 'QR Platba', 'Alaska'),
    (37, '2026-05-14 13:46:46.807846', 'P', 2, 20.00, 0.00, 'QR Platba', 'Kinder Bueno White'),
    (38, '2026-05-14 13:46:53.470528', 'P', 1, 20.00, 2.00, 'QR Platba', 'Kinder Bueno White'),
    (39, '2026-05-15 07:10:56.489075', 'P', 1, 30.00, 0.00, 'QR Platba', 'Coca-Cola'),
    (40, '2026-05-16 19:51:53.577684', 'P', 1, 30.00, 0.00, 'QR Platba', 'Coca-Cola'),
    (41, '2026-05-16 20:29:56.059233', 'P', 1, 20.00, -20.00, 'QR Platba', 'Kinder Bueno White'),
    (50, '2026-05-17 19:48:21.508001', 'N', 16, 25.00, 0.00, NULL, 'Coca-Cola'),
    (51, '2026-05-17 20:06:29.235419', 'N', 3, 45.00, 0.00, NULL, 'Pringles'),
    (52, '2026-05-17 20:08:02.109651', 'N', 20, 14.50, 0.00, NULL, 'Cool (různé příchutě)'),
    (53, '2026-05-17 20:08:56.252816', 'N', 14, 25.20, 0.00, NULL, 'Opavia oplatky'),
    (54, '2026-05-19 12:38:24.216704', 'P', 1, 30.00, 0.00, 'QR Platba', 'Coca-Cola'),
    (55, '2026-05-20 09:46:27.683372', 'P', 1, 30.00, 0.00, 'QR Platba', 'RedBull Classic'),
    (56, '2026-05-20 09:46:54.229682', 'P', 1, 17.00, 0.00, 'QR Platba', 'Corny Salted Caramel'),
    (57, '2026-05-20 09:46:54.247903', 'P', 1, 20.00, 0.00, 'QR Platba', 'Kinder Bueno White'),
    (58, '2026-05-20 09:47:08.678651', 'P', 1, 30.00, 0.00, 'QR Platba', 'Monster Ultra White'),
    (59, '2026-05-20 09:47:08.704836', 'P', 1, 20.00, 0.00, 'QR Platba', 'Dupetky'),
    (60, '2026-05-20 09:47:08.706057', 'P', 1, 20.00, 0.00, 'QR Platba', 'Kinder Bueno White'),
    (61, '2026-05-21 08:46:58.249384', 'P', 2, 30.00, 0.00, 'QR Platba', 'Coca-Cola'),
    (62, '2026-05-21 11:19:34.354668', 'P', 2, 20.00, 0.00, 'QR Platba', 'Kinder Bueno White'),
    (63, '2026-05-21 11:19:42.355978', 'P', 1, 20.00, 0.00, 'QR Platba', 'Cool (různé příchutě)'),
    (64, '2026-05-23 20:12:43.460273', 'P', 1, 20.00, -8.00, 'QR Platba', 'Kinder Bueno White'),
    (65, '2026-05-26 17:16:56.71122', 'P', 1, 20.00, 0.00, 'QR Platba', 'Dr. Pepper'),
    (66, '2026-06-01 10:39:32.263196', 'P', 1, 30.00, 0.00, 'QR Platba', 'Coca-Cola'),
    (67, '2026-06-01 10:39:32.288407', 'P', 1, 20.00, 0.00, 'QR Platba', 'Kinder Bueno White'),
    (68, '2026-06-01 10:39:32.293562', 'P', 1, 30.00, 0.00, 'QR Platba', 'Opavia oplatky'),
    (69, '2026-06-01 10:40:06.378075', 'P', 1, 30.00, 1.00, 'QR Platba', 'Coca-Cola'),
    (70, '2026-06-01 10:40:06.398944', 'P', 1, 6.00, 0.00, 'QR Platba', 'Alaska'),
    (71, '2026-06-01 10:40:06.405229', 'P', 1, 20.00, 0.00, 'QR Platba', 'Kinder Bueno White'),
    (72, '2026-06-02 09:09:03.800655', 'P', 1, 30.00, 1.00, 'QR Platba', 'Monster Ultra White'),
    (73, '2026-06-02 09:09:03.845656', 'P', 2, 30.00, 0.00, 'QR Platba', 'Monster Ultra Strawberry Dreams'),
    (74, '2026-06-02 09:09:03.842642', 'P', 1, 30.00, 0.00, 'QR Platba', 'Monster Mango Loco'),
    (76, '2026-06-02 09:09:03.848969', 'P', 2, 6.00, 0.00, 'QR Platba', 'Alaska'),
    (75, '2026-06-02 09:09:03.84805', 'P', 2, 20.00, 0.00, 'QR Platba', 'Dupetky'),
    (77, '2026-06-03 14:52:05.341318', 'P', 1, 17.00, 0.00, 'QR Platba', 'Corny Salted Caramel'),
    (78, '2026-06-03 14:53:00.337897', 'P', 1, 30.00, 0.00, 'QR Platba', 'Monster Ultra White'),
    (79, '2026-06-03 14:53:21.24842', 'P', 1, 20.00, 0.00, 'QR Platba', 'Cool (různé příchutě)'),
    (80, '2026-06-05 20:52:53.570005', 'P', 1, 30.00, -30.00, 'QR Platba', 'Coca-Cola'),
    (81, '2026-06-05 20:53:11.042901', 'P', 1, 20.00, 0.00, 'QR Platba', 'Dr. Pepper'),
    (82, '2026-06-05 20:53:28.345242', 'P', 1, 20.00, 0.00, 'QR Platba', 'Dupetky'),
    (83, '2026-06-05 20:54:17.385397', 'P', 1, 30.00, 0.00, 'QR Platba', 'Monster Mango Loco'),
    (84, '2026-06-08 10:41:03.751323', 'P', 1, 30.00, 0.00, 'QR Platba', 'Monster Ultra White'),
    (85, '2026-06-08 10:41:03.753368', 'P', 2, 20.00, 0.00, 'QR Platba', 'Dr. Pepper'),
    (86, '2026-06-08 10:41:03.759071', 'P', 1, 20.00, 0.00, 'QR Platba', 'Cool (různé příchutě)'),
    (87, '2026-06-08 10:41:03.794132', 'P', 1, 30.00, 0.00, 'QR Platba', 'Coca-Cola'),
    (88, '2026-06-08 10:41:03.795973', 'P', 1, 30.00, 0.00, 'QR Platba', 'Monster Mango Loco'),
    (89, '2026-06-08 10:41:03.800665', 'P', 1, 30.00, 0.00, 'QR Platba', 'RedBull Classic'),
    (90, '2026-06-08 10:41:03.803485', 'P', 1, 6.00, 0.00, 'QR Platba', 'Alaska'),
    (91, '2026-06-09 10:03:28.358246', 'P', 1, 30.00, 0.00, 'QR Platba', 'Monster Mango Loco'),
    (92, '2026-06-11 10:36:23.002092', 'P', 1, 20.00, 0.00, 'QR Platba', 'Dupetky')
    ON CONFLICT (id) DO NOTHING;

    -- Update sequence counters to prevent key collisions on future inserts
    SELECT setval('uzivatele_tb_id_seq', 4, true);
    SELECT setval('sklad_id_seq', 17, true);
    SELECT setval('pohyby_id_seq', 92, true);
    SELECT setval('objednavky_tb_id_seq', 29, true);
  `;

  return db.runSql(sql);
};

exports.down = function(db) {
  const sql = `
    TRUNCATE TABLE objednavky_tb RESTART IDENTITY CASCADE;
    TRUNCATE TABLE pohyby RESTART IDENTITY CASCADE;
    TRUNCATE TABLE sklad RESTART IDENTITY CASCADE;
    TRUNCATE TABLE uzivatele_tb RESTART IDENTITY CASCADE;
  `;

  return db.runSql(sql);
};

exports._meta = {
  "version": 1
};
