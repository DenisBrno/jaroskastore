const { Pool } = require('pg');
require('dotenv').config();

const userDbPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: 'uzivatele',
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

const inventoryDbPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: 'sklad',
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

/**
 * Verifies if the login and password match the database records
 * @param {string} login 
 * @param {string} password 
 * @returns {Promise<object|null>} - Returns the user object or null if not found
 */
const verifyUser = async (login, password) => {
  const queryText = 'SELECT id, login FROM uzivatele_tb WHERE login = $1 AND password = $2';
  try {
    const { rows } = await userDbPool.query(queryText, [login, password]);
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error('Error during password verification:', err);
    throw err;
  }
};

const updateUserCredit = async (id, changeAmount) => {
  const queryText = 'UPDATE uzivatele_tb SET kredit = kredit + $1 WHERE id=$2';
  try {
    const { rows } = await userDbPool.query(queryText, [changeAmount, id]);
    return rows;
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
    const { rows } = await userDbPool.query(queryText);
    return rows;
  } catch (err) {
    console.error('Error fetching orders:', err);
    throw err;
  }
};

/**
 * Creates a new user
 */
const createUser = async (login, password) => {
  const queryText = 'INSERT INTO uzivatele_tb (login, password, kredit) VALUES ($1, $2, 0)';
  try {
    await userDbPool.query(queryText, [login, password]);
    return true;
  } catch (err) {
    console.error('Error creating user:', err);
    throw err;
  }
};

const getOrderDetails = async (orderId) => {
  const queryText = 'SELECT id, customer_name, product_name, quantity, created_at, status, ucebna, prestavka_start, prestavka_end, poznamka, pohybId FROM objednavky_tb WHERE id=$1';
  try {
    const { rows } = await userDbPool.query(queryText, [orderId]);
    return rows;
  } catch (err) {
    console.error('Error fetching order details:', err);
    throw err;
  }
};

const getInventory = async () => {
  const queryText = 'SELECT id, produkt, cena, img,  sklad_doma, sklad_skola FROM sklad ORDER BY id ASC';
  try {
    const { rows } = await inventoryDbPool.query(queryText);
    return rows;
  } catch (err) {
    console.error('Error fetching inventory:', err);
    throw err;
  }
};

const removeMovement = async (movementId) => {
  const queryText = 'DELETE FROM pohyby WHERE id=$1';
  try {
    await inventoryDbPool.query(queryText, [movementId]);
    return true;
  } catch (err) {
    console.error('Error removing movement from DB:', err);
    throw err;
  }
};

const createMovement = async (product, movementType, quantity, pricePerPiece, bonus, note) => {
  const queryText = 'INSERT INTO pohyby (produkt, typ_pohybu, mnozstvi, cena_za_kus, bonus, poznamka) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
  try {
    const res = await inventoryDbPool.query(queryText, [product, movementType, quantity, pricePerPiece, bonus, note]);
    return res.rows[0];
  } catch (err) {
    console.error('Error creating movement in DB:', err);
    throw err;
  }
};

const linkOrder = async (orderId, movementId) => {
  try {
    const queryText = 'UPDATE objednavky_tb SET pohybId = $1 WHERE id = $2';
    await userDbPool.query(queryText, [movementId, orderId]);
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
        `Order filled through admin panel, paid with user (${orderDetails[0].customer_name}) credit.`
      );
      // Added await here as well
      await linkOrder(orderDetails[0].id, movement.id);
    }
    
    await userDbPool.query(queryText, [orderId]);
    return true;
  } catch (err) {
    console.error('Error toggling order status:', err);
    throw err;
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
    await userDbPool.query(queryText, [login, product, quantity, room, breakStart, breakEnd, note]);

    const auth = Buffer.from(`${process.env.NTFY_USER}:${process.env.NTFY_PASS}`).toString("base64");

    const response = await fetch(process.env.NTFY_HOST, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Title": "New Order",
        "Priority": "high"
      },
      body: `New order from ${login}, product: ${product} x ${quantity} to ${room} at ${breakStart}. Note: ${note}`  
    });

    console.log("NTFY Status:", response.status);

    const result = await response.json();
    console.log("NTFY Result:", result);
    
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
    const { rows } = await inventoryDbPool.query(queryText, queryParams);
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
        const { rows } = await inventoryDbPool.query(queryText, queryParams);
        return parseFloat(rows[0].celkovy_soucet) || 0;
    } catch (err) {
        console.error('Error calculating movements sum:', err);
        throw err;
    }
};

const createProduct = async (product, homeStock, schoolStock) => {
  const queryText = 'INSERT INTO sklad (produkt, sklad_doma, sklad_skola) VALUES ($1, $2, $3)';
  try {
    await inventoryDbPool.query(queryText, [product, homeStock, schoolStock]);
    return true;
  } catch (err) {
    console.error('Error creating product:', err);
    throw err;
  }
};  

const transferItem = async (product, quantity) => {
  const queryText = 'UPDATE sklad SET sklad_doma = sklad_doma - $1, sklad_skola = sklad_skola + $1 WHERE produkt = $2';
  try {
    await inventoryDbPool.query(queryText, [quantity, product]);
    return true;
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

  const client = await inventoryDbPool.connect();

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
    const res = await userDbPool.query(query, [formattedKeyword]);
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
    const res = await userDbPool.query(query, [userId]);
    return res.rows;
  } catch (err) {
    console.error('Fetching user credit failed:', err);
    throw err;
  }
};

module.exports = {
  userDbPool,
  query: (text, params) => userDbPool.query(text, params),
  verifyUser,
  addOrder,
  getOrders,
  createUser,
  toggleOrderStatus,
  getMovements,
  getInventory,
  createProduct,
  transferItem,
  createMovement, 
  updateInventory,
  getMovementsSum,
  getUsers,
  updateUserCredit,
  getUserCredit,
  getOrderDetails
};