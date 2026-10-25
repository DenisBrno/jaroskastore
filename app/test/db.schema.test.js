/**
 * Schema contract tests: every query in src/utils/db.js runs against a real
 * PostgreSQL initialised from init-db/, so code referencing a column or table
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

describe('db.js against init-db schema', () => {
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

  test('getUsers finds the user', async () => {
    const users = await db.getUsers(LOGIN);
    assert.deepEqual(Object.keys(users[0]).sort(), ['id', 'kredit', 'login']);
    assert.equal(users[0].login, LOGIN);
  });

  test('updateUserCredit + getUserCredit', async () => {
    await db.updateUserCredit(userId, 50);
    const [row] = await db.getUserCredit(userId);
    assert.equal(row.kredit, 50);
  });

  test('createProduct', async () => {
    assert.equal(await db.createProduct(PRODUCT, 5, 2), true);
    // createProduct doesn't set a price, toggleOrderStatus below needs one
    await db.query('UPDATE sklad SET cena = 10 WHERE produkt = $1', [PRODUCT]);
  });

  test('getInventory returns all columns the views use', async () => {
    const item = (await db.getInventory()).find(i => i.produkt === PRODUCT);
    assert.ok(item, 'created product is in the inventory');
    for (const column of ['id', 'produkt', 'cena', 'img', 'sklad_doma', 'sklad_skola', 'vprodeji']) {
      assert.ok(column in item, `inventory row has "${column}"`);
    }
  });

  test('transferItem + updateInventory', async () => {
    await db.transferItem(PRODUCT, 1);
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
