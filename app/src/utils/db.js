const { Pool } = require('pg');
require('dotenv').config({ path: './.env'});
const { hashPassword, verifyPassword, verifyDummyPassword } = require('./password');

const DB_Pool = new Pool({
  user: process.env.DB_USER || 'jaroskastore_user',
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASS || ''),
  port: process.env.DB_PORT,
});

/**
 * Verifies if the login and password match the database records
 * @param {string} login 
 * @param {string} password 
 * @returns {Promise<object|null>} - Returns the user object or null if not found
 */
const verifyUser = async (login, password) => {
  const queryText = 'SELECT id, login, password FROM uzivatele_tb WHERE login = $1';
  try {
    const { rows } = await DB_Pool.query(queryText, [login]);
    if (rows.length === 0) {
      return verifyDummyPassword(password).then(() => null);
    }
    for (const row of rows) {
      if (await verifyPassword(password, row.password)) {
        return { id: row.id, login: row.login };
      }
    }
    return null;
  } catch (err) {
    console.error('Error during password verification:', err);
    throw err;
  }
};

/**
 * Checks the password of a logged-in user (e.g. before changing it)
 */
const checkUserPassword = async (id, password) => {
  const { rows } = await DB_Pool.query('SELECT password FROM uzivatele_tb WHERE id = $1', [id]);
  return rows.length > 0 && verifyPassword(password, rows[0].password);
};

/**
 * Sets a new password and logs the user out everywhere except the session in keepSessionId.
 * Returns false when the user does not exist.
 */
const setUserPassword = async (id, password, keepSessionId = null) => {
  const res = await DB_Pool.query('UPDATE uzivatele_tb SET password = $1 WHERE id = $2', [await hashPassword(password), id]);
  if (res.rowCount === 0) {
    return false;
  }
  await DB_Pool.query(
    "DELETE FROM session WHERE sess->>'userId' = $1 AND sid IS DISTINCT FROM $2",
    [String(id), keepSessionId]
  );
  return true;
};

/**
 * Returns the user's id, login and role, or null when the user does not exist
 */
const getUserById = async (id) => {
  const queryText = 'SELECT id, login, role FROM uzivatele_tb WHERE id = $1';
  try {
    const { rows } = await DB_Pool.query(queryText, [id]);
    return rows[0] || null;
  } catch (err) {
    console.error('Error fetching user:', err);
    throw err;
  }
};

/**
 * Adds (or with a negative amount removes) credit, returns false when the user does not exist
 */
const updateUserCredit = async (id, changeAmount) => {
  const queryText = 'UPDATE uzivatele_tb SET kredit = COALESCE(kredit, 0) + $1 WHERE id=$2';
  try {
    const res = await DB_Pool.query(queryText, [changeAmount, id]);
    return res.rowCount > 0;
  } catch (err) {
    console.error('Error updating user credit:', err);
    throw err;
  }
};

/**
 * Retrieves the last 10 orders
 */
const getOrders = async () => {
  const queryText = 'SELECT id, customer_name, product_name, quantity, created_at, status, ucebna, prestavka_start, prestavka_end, poznamka FROM objednavky_tb ORDER BY id DESC LIMIT 10';
  try {
    const { rows } = await DB_Pool.query(queryText);
    return rows;
  } catch (err) {
    console.error('Error fetching orders:', err);
    throw err;
  }
};

/**
 * Creates a new user, returns false when the login is already taken
 */
const createUser = async (login, password) => {
  const queryText = `
    INSERT INTO uzivatele_tb (login, password, kredit)
    SELECT $1::varchar, $2, 0
    WHERE NOT EXISTS (SELECT 1 FROM uzivatele_tb WHERE LOWER(login) = LOWER($1))`;
  try {
    const res = await DB_Pool.query(queryText, [login, await hashPassword(password)]);
    return res.rowCount > 0;
  } catch (err) {
    // Unique index on LOWER(login): someone created the same login at the same moment
    if (err.code === '23505') {
      return false;
    }
    console.error('Error creating user:', err);
    throw err;
  }
};

const getOrderDetails = async (orderId) => {
  const queryText = 'SELECT id, customer_name, product_name, quantity, created_at, status, ucebna, prestavka_start, prestavka_end, poznamka, pohybId FROM objednavky_tb WHERE id=$1';
  try {
    const { rows } = await DB_Pool.query(queryText, [orderId]);
    return rows;
  } catch (err) {
    console.error('Error fetching order details:', err);
    throw err;
  }
};

const getInventory = async () => {
  const queryText = 'SELECT id, produkt, cena, img,  sklad_doma, sklad_skola, vprodeji FROM sklad ORDER BY id ASC';
  try {
    const { rows } = await DB_Pool.query(queryText);
    return rows;
  } catch (err) {
    console.error('Error fetching inventory:', err);
    throw err;
  }
};

/**
 * Products that are for sale (vprodeji = true): the only ones shown and accepted by orders and payments
 */
const getProductsForSale = async () => {
  const queryText = 'SELECT id, produkt, cena, img, sklad_doma, sklad_skola, vprodeji FROM sklad WHERE vprodeji = true ORDER BY id ASC';
  try {
    const { rows } = await DB_Pool.query(queryText);
    return rows;
  } catch (err) {
    console.error('Error fetching products for sale:', err);
    throw err;
  }
};

const removeMovement = async (movementId) => {
  const queryText = 'DELETE FROM pohyby WHERE id=$1';
  try {
    await DB_Pool.query(queryText, [movementId]);
    return true;
  } catch (err) {
    console.error('Error removing movement from DB:', err);
    throw err;
  }
};

const createMovement = async (product, movementType, quantity, pricePerPiece, bonus, note, author_id) => {
  const queryText = 'INSERT INTO pohyby (produkt, typ_pohybu, mnozstvi, cena_za_kus, bonus, poznamka, author_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
  try {
    const res = await DB_Pool.query(queryText, [product, movementType, quantity, pricePerPiece, bonus, note, author_id]);
    return res.rows[0];
  } catch (err) {
    console.error('Error creating movement in DB:', err);
    throw err;
  }
};

const linkOrder = async (orderId, movementId) => {
  try {
    const queryText = 'UPDATE objednavky_tb SET pohybId = $1 WHERE id = $2';
    await DB_Pool.query(queryText, [movementId, orderId]);
    return true;
  } catch (err) {
    console.error('Error linking order with financial movement:', err);
    throw err;
  }
};

/**
 * Toggles the status of an order
 */
const toggleOrderStatus = async (orderId) => {
  const queryText = 'UPDATE objednavky_tb SET status = NOT status WHERE id = $1';
  try {
    const orderDetails = await getOrderDetails(orderId);
    const inventoryResult = await getInventory();
    const inventory = inventoryResult.map(item => ({
        name: item.produkt,
        price: item.cena,
    }));
    
    const productData = inventory.find(p => p.name === orderDetails[0].product_name);
    
    if (orderDetails[0].status === true) {
      // Added await here to prevent unhandled promise rejections
      // Note: pg lowercases column names, so DB 'pohybId' becomes JS 'pohybid'
      await removeMovement(orderDetails[0].pohybid); 
    } else {
      const movement = await createMovement(
        orderDetails[0].product_name, 
        'P', 
        orderDetails[0].quantity, 
        productData.price, 
        0, 
        `Objednávka vyřízena přes administraci, zaplaceno kreditem (${orderDetails[0].customer_name}).`
      );
      // Added await here as well
      await linkOrder(orderDetails[0].id, movement.id);
    }
    
    await DB_Pool.query(queryText, [orderId]);
    return true;
  } catch (err) {
    console.error('Error toggling order status:', err);
    throw err;
  }
};

/**
 * Sends a push notification about a new order. Failures are only logged: a missing or
 * unreachable ntfy server must not fail an order that is already saved.
 */
const notifyNewOrder = async (message) => {
  if (!process.env.NTFY_HOST) {
    return;
  }
  try {
    const auth = Buffer.from(`${process.env.NTFY_USER}:${process.env.NTFY_PASS}`).toString("base64");
    const response = await fetch(process.env.NTFY_HOST, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Title": "Nova objednavka", // HTTP header values must be ASCII
        "Priority": "high"
      },
      body: message
    });
    console.log("NTFY Status:", response.status);
  } catch (err) {
    console.error('Sending the order notification failed:', err);
  }
};

/**
 * Adds a new order to the database
 * @param {string} login - User's login name
 * @param {string} product - Product name
 * @param {number} quantity - Number of items
 * @param {string} room - Room where the order is delivered
 * @param {time} breakStart - Start of the break
 * @param {time} breakEnd - End of the break
 * @param {string} note - Additional notes
 * @returns {Promise<boolean>}
 */
const addOrder = async (login, product, quantity, room, breakStart, breakEnd, note) => {
  const queryText = 'INSERT INTO objednavky_tb (customer_name, product_name, quantity, ucebna, prestavka_start, prestavka_end, poznamka) VALUES ($1, $2, $3, $4, $5, $6, $7)';
  try {
    await DB_Pool.query(queryText, [login, product, quantity, room, breakStart, breakEnd, note]);

    await notifyNewOrder(`Nová objednávka od ${login}: ${product} x ${quantity}, učebna ${room}, přestávka ${breakStart}. Poznámka: ${note}`);

    return true;
  } catch (err) {
    console.error('Error saving the order:', err);
    throw err;
  }
};

/**
 * Retrieves movement data from the inventory
 * @param {string} product - Product name for filtering movements
 * @param {string} type - Movement type for filtering
 * @returns {Promise<Array>} - Array of objects containing movement info
 */
const getMovements = async (product, type) => {
  let queryText = `SELECT id, cas, typ_pohybu, mnozstvi, cena_za_kus, bonus, celkem, poznamka, produkt FROM pohyby`;
  const queryParams = [];

  if (product) {
    queryParams.push(product);
    queryText += ` WHERE produkt = $${queryParams.length}`;
  }

  if (type) {
    queryParams.push(type);
    queryText += product ? ` AND typ_pohybu = $${queryParams.length}` : ` WHERE typ_pohybu = $${queryParams.length}`;
  }

  queryText += ` ORDER BY cas DESC`;

  try {
    const { rows } = await DB_Pool.query(queryText, queryParams);
    return rows;
  } catch (err) {
    console.error('Error fetching movements:', err);
    throw err;
  }
};

const getMovementsSum = async (product, type) => {
    let queryText = `SELECT SUM(celkem) AS celkovy_soucet FROM pohyby`;
    const queryParams = [];
    const conditions = [];

    if (product) {
        queryParams.push(product);
        conditions.push(`produkt = $${queryParams.length}`);
    }

    if (type) {
        queryParams.push(type);
        conditions.push(`typ_pohybu = $${queryParams.length}`);
    }

    if (conditions.length > 0) {
        queryText += ` WHERE ` + conditions.join(' AND ');
    }

    try {
        const { rows } = await DB_Pool.query(queryText, queryParams);
        return parseFloat(rows[0].celkovy_soucet) || 0;
    } catch (err) {
        console.error('Error calculating movements sum:', err);
        throw err;
    }
};

const createProduct = async (product, homeStock, schoolStock) => {
  const queryText = 'INSERT INTO sklad (produkt, sklad_doma, sklad_skola) VALUES ($1, $2, $3)';
  try {
    await DB_Pool.query(queryText, [product, homeStock, schoolStock]);
    return true;
  } catch (err) {
    console.error('Error creating product:', err);
    throw err;
  }
};  

/**
 * Moves pieces from home to school stock, returns false when there are not enough at home
 */
const transferItem = async (product, quantity) => {
  const queryText = 'UPDATE sklad SET sklad_doma = sklad_doma - $1, sklad_skola = sklad_skola + $1 WHERE produkt = $2 AND sklad_doma >= $1';
  try {
    const res = await DB_Pool.query(queryText, [quantity, product]);
    return res.rowCount > 0;
  } catch (err) {
    console.error('Error transferring item:', err);
    throw err;
  }
};

/**
 * Modifies the inventory stock by a given amount (add/subtract).
 * If homeDifference or schoolDifference is empty/null, it adds 0 (no change).
 */
const updateInventory = async (product, homeDifference, schoolDifference) => {
  const query = `
    UPDATE sklad 
    SET 
      sklad_doma = sklad_doma + COALESCE($2, 0),
      sklad_skola = sklad_skola + COALESCE($3, 0)
    WHERE produkt = $1
  `;

  const values = [
    product, 
    (homeDifference !== '' && homeDifference !== undefined) ? homeDifference : 0, 
    (schoolDifference !== '' && schoolDifference !== undefined) ? schoolDifference : 0
  ];

  const client = await DB_Pool.connect();

  try {
    const res = await client.query(query, values);

    if (res.rowCount === 0) {
      console.warn(`Product "${product}" was not found, no updates made.`);
    } else {
      console.log(`Inventory for product "${product}" was successfully updated.`);
    }
    
    return res;
  } catch (err) {
    console.error('Error updating inventory stock:', err.stack);
    throw err;
  } finally {
    // ALWAYS release the client back to the pool to prevent memory leaks
    client.release();
  }
};

const getUsers = async (keyword) => {
  const formattedKeyword = `%${keyword}%`;

  const query  = `
  SELECT id, login, kredit 
  FROM uzivatele_tb 
  WHERE 
    CAST(id AS TEXT) LIKE $1 
    OR LOWER(login) LIKE LOWER($1)
  LIMIT 10;
  `;

  try {
    const res = await DB_Pool.query(query, [formattedKeyword]);
    return res.rows;
  } catch (err) {
    console.error('Search query for users failed:', err);
    throw err;
  }
};

const getUserCredit = async (userId) => {
  const query  = `
  SELECT kredit 
  FROM uzivatele_tb 
  WHERE id=$1;`;

  try {
    const res = await DB_Pool.query(query, [userId]);
    return res.rows;
  } catch (err) {
    console.error('Fetching user credit failed:', err);
    throw err;
  }
};

/**
 * Atomically deducts an amount from a user's credit, but only when the balance before paying
 * is at least minBalance (0 = may go below zero after paying, amount = must stay >= 0).
 * Returns the new balance, or null when the user does not exist or the balance is too low.
 */
const chargeUserCredit = async (userId, amount, minBalance) => {
  const query = `
  UPDATE uzivatele_tb
  SET kredit = COALESCE(kredit, 0) - $1
  WHERE id = $2 AND COALESCE(kredit, 0) >= $3
  RETURNING kredit;`;

  try {
    const res = await DB_Pool.query(query, [amount, userId, minBalance]);
    return res.rowCount > 0 ? res.rows[0].kredit : null;
  } catch (err) {
    console.error('Charging user credit failed:', err);
    throw err;
  }
};

module.exports = {
  DB_Pool,
  query: (text, params) => DB_Pool.query(text, params),
  verifyUser,
  checkUserPassword,
  setUserPassword,
  getUserById,
  addOrder,
  getOrders,
  createUser,
  toggleOrderStatus,
  getMovements,
  getInventory,
  getProductsForSale,
  createProduct,
  transferItem,
  createMovement, 
  updateInventory,
  getMovementsSum,
  getUsers,
  updateUserCredit,
  getUserCredit,
  chargeUserCredit,
  getOrderDetails
};