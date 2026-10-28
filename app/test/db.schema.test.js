/**
 * Schema contract tests: every query in src/utils/db.js runs against a real
 * PostgreSQL with the schema from migrations/, so code referencing a column or table
 * that the schema doesn't have (e.g. "column vprodeji does not exist") fails here.
 *
 * Run: npm run test:docker
 */
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const db = require('../src/utils/db');

const suffix = Date.now();
const LOGIN = `test_user_${suffix}`;
const PRODUCT = `Test produkt ${suffix}`;

describe('db.js against the migrated schema', () => {
  let userId;
  let orderId;

  before(() => {
    // addOrder sends an ntfy notification
    globalThis.fetch = async () => ({ status: 200, json: async () => ({}) });
  });

  after(async () => {
    await db.DB_Pool.end();
  });

  test('verifyUser returns null for unknown user', async () => {
    assert.equal(await db.verifyUser(LOGIN, 'wrong'), null);
  });

  test('createUser + verifyUser', async () => {
    assert.equal(await db.createUser(LOGIN, 'secret'), true);
    const user = await db.verifyUser(LOGIN, 'secret');
    assert.equal(user.login, LOGIN);
    userId = user.id;
  });

  test('passwords are stored hashed, duplicate logins are refused', async () => {
    const { rows } = await db.query('SELECT password FROM uzivatele_tb WHERE id = $1', [userId]);
    assert.match(rows[0].password, /^scrypt\$/);
    assert.equal(await db.verifyUser(LOGIN, 'wrong'), null);
    assert.equal(await db.createUser(LOGIN.toUpperCase(), 'other'), false);
    // Also enforced by the database
    await assert.rejects(db.query('INSERT INTO uzivatele_tb (login) VALUES ($1)', [LOGIN.toUpperCase()]), { code: '23505' });
  });

  test('setUserPassword + checkUserPassword', async () => {
    assert.equal(await db.setUserPassword(userId, 'new-secret'), true);
    assert.equal(await db.checkUserPassword(userId, 'secret'), false);
    assert.equal(await db.checkUserPassword(userId, 'new-secret'), true);
    assert.equal(await db.setUserPassword(-12345, 'x'), false);
  });

  test('getUsers finds the user', async () => {
    const users = await db.getUsers(LOGIN);
    assert.deepEqual(Object.keys(users[0]).sort(), ['id', 'kredit', 'login']);
    assert.equal(users[0].login, LOGIN);
  });

  test('updateUserCredit + getUserCredit', async () => {
    assert.equal(await db.updateUserCredit(userId, 50), true);
    assert.equal(await db.updateUserCredit(-12345, 50), false);
    const [row] = await db.getUserCredit(userId);
    assert.equal(row.kredit, 50);
  });

  test('getUserById returns the role (new users are customers)', async () => {
    const user = await db.getUserById(userId);
    assert.deepEqual(user, { id: userId, login: LOGIN, role: 'customer' });
    assert.equal(await db.getUserById(-12345), null);
  });

  test('chargeUserCredit only charges when the balance is high enough', async () => {
    // balance 50: an order of 60 needs 60 before paying -> refused
    assert.equal(await db.chargeUserCredit(userId, 60, 60), null);
    // a payment only needs a non-negative balance and may go below zero
    assert.equal(await db.chargeUserCredit(userId, 60, 0), -10);
    // negative balance -> refused
    assert.equal(await db.chargeUserCredit(userId, 5, 0), null);
    await db.updateUserCredit(userId, 60);
  });

  test('createProduct', async () => {
    const product = { product: PRODUCT, homeStock: 5, schoolStock: 2, price: 10, img: `/img/test_${suffix}.png`, forSale: false };
    assert.equal(await db.getProductClash(PRODUCT, product.img), null);
    assert.equal(await db.createProduct(product), true);

    const [row] = (await db.getInventory()).filter(i => i.produkt === PRODUCT);
    assert.equal(row.cena, 10);
    assert.equal(row.img, product.img);
    assert.equal(row.vprodeji, false);

    // Same name (any case) or same image is refused
    assert.equal(await db.getProductClash(PRODUCT.toUpperCase(), '/img/other.png'), 'name_exists');
    assert.equal(await db.getProductClash('Other', product.img), 'image_exists');
    assert.equal(await db.createProduct({ ...product, product: PRODUCT.toLowerCase(), img: '/img/other.png' }), false);
  });

  test('getProductsForSale only returns products with vprodeji = true', async () => {
    assert.ok(!(await db.getProductsForSale()).some(p => p.produkt === PRODUCT));
    await db.query('UPDATE sklad SET vprodeji = true WHERE produkt = $1', [PRODUCT]);
    assert.ok((await db.getProductsForSale()).some(p => p.produkt === PRODUCT));
    await db.query('UPDATE sklad SET vprodeji = false WHERE produkt = $1', [PRODUCT]);
  });

  test('getInventory returns all columns the views use', async () => {
    const item = (await db.getInventory()).find(i => i.produkt === PRODUCT);
    assert.ok(item, 'created product is in the inventory');
    for (const column of ['id', 'produkt', 'cena', 'img', 'sklad_doma', 'sklad_skola', 'vprodeji']) {
      assert.ok(column in item, `inventory row has "${column}"`);
    }
  });

  test('transferItem + updateInventory', async () => {
    assert.equal(await db.transferItem(PRODUCT, 1), true);
    // Only 4 left at home
    assert.equal(await db.transferItem(PRODUCT, 5), false);
    const res = await db.updateInventory(PRODUCT, 1, '');
    assert.equal(res.rowCount, 1);

    const item = (await db.getInventory()).find(i => i.produkt === PRODUCT);
    assert.equal(item.sklad_doma, 5);
    assert.equal(item.sklad_skola, 3);
  });

  test('createMovement + getMovements + getMovementsSum', async () => {
    const movement = await db.createMovement(PRODUCT, 'N', 2, 10, 1, 'test');
    assert.ok(movement.id);

    const movements = await db.getMovements(PRODUCT, 'N');
    assert.equal(movements.length, 1);
    assert.equal(await db.getMovementsSum(PRODUCT, 'N'), 21);

    // filter variants build different SQL
    await db.getMovements();
    await db.getMovements(PRODUCT);
    await db.getMovements(null, 'N');
    await db.getMovementsSum();
  });

  test('addOrder + getOrders + getOrderDetails', async () => {
    assert.equal(await db.addOrder(LOGIN, PRODUCT, 1, '101', '08:00', '08:10', 'test'), true);

    const order = (await db.getOrders()).find(o => o.customer_name === LOGIN);
    assert.ok(order, 'order is listed');
    orderId = order.id;

    const [details] = await db.getOrderDetails(orderId);
    assert.equal(details.product_name, PRODUCT);
    assert.ok('pohybid' in details, 'order has "pohybid"');
  });

  test('toggleOrderStatus creates and removes the linked movement', async () => {
    await db.toggleOrderStatus(orderId);
    let [details] = await db.getOrderDetails(orderId);
    assert.equal(details.status, true);
    assert.ok(details.pohybid, 'movement is linked');

    await db.toggleOrderStatus(orderId);
    [details] = await db.getOrderDetails(orderId);
    assert.equal(details.status, false);
    assert.equal(await db.getMovementsSum(PRODUCT, 'P'), 0);
  });
});
