const { Pool } = require('pg');
require('dotenv').config();

const userDB_pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: 'uzivatele',
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

const skladDB_pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: 'sklad',
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

/**
 * Ověří, zda login a heslo souhlasí s údaji v DB
 * @param {string} login 
 * @param {string} password 
 * @returns {object|null} - Vrací objekt uživatele nebo null
 */
const verifyUser = async (login, password) => {
  const queryText = 'SELECT id, login FROM uzivatele_tb WHERE login = $1 AND password = $2';
  try {
    const { rows } = await userDB_pool.query(queryText, [login, password]);
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error('Chyba při ověřování hesla:', err);
    return null;
  }
};

const updateUserCredit = async (id, change) => {
  const queryText = 'UPDATE uzivatele_tb SET kredit = kredit + $1 WHERE id=$2';
  try {
    const { rows } = await userDB_pool.query(queryText, [change, id]);
    return rows;
  }
  catch (err) {
    console.error('Chyba při převodu položky:', err);
    return false;
  }
};

/**
 * Získá posledních 10 objednávek
 */
const getOrders = async () => {
  const queryText = 'SELECT id, customer_name, product_name, quantity, created_at, status, ucebna, prestavka_start, prestavka_end, poznamka FROM objednavky_tb ORDER BY id DESC LIMIT 10';
  try {
    const { rows } = await userDB_pool.query(queryText);
    return rows;
  } catch (err) {
    console.error('Chyba při získávání objednávek:', err);
    return [];
  }
};

/**
 * Vytvoří nového uživatele
 */
const createUser = async (login, password) => {
  const queryText = 'INSERT INTO uzivatele_tb (login, password, kredit) VALUES ($1, $2, 0)';
  try {
    await userDB_pool.query(queryText, [login, password]);
    return true;
  } catch (err) {
    console.error('Chyba při vytváření uživatele:', err);
    return false;searchTerm
  }
};

/**
 * Změní stav objednávky na opačný
 */
const toggleOrderStatus = async (orderId) => {
  const queryText = 'UPDATE objednavky_tb SET status = NOT status WHERE id = $1';
  try {
    await userDB_pool.query(queryText, [orderId]);
    return true;
  } catch (err) {
    console.error('Chyba při změně stavu objednávky:', err);
    return false;
  }
};

/**
 * Přidá novou objednávku do databáze
 * @param {string} login - Přihlašovací jméno uživatele
 * @param {string} produkt - Název produktu
 * @param {number} pocet - Počet kusů
 * @param {string} ucebna - Učebna kam se objednávka doručí
 * @param {time} prestavka_start - Začátek přestávky
 * @param {time} prestavka_end - Konec přestávky
 * @returns {Promise<boolean>}
 */
const addOrder = async (login, produkt, pocet, ucebna, prestavka_start, prestavka_end, poznamka) => {
  const queryText = 'INSERT INTO objednavky_tb (customer_name, product_name, quantity, ucebna, prestavka_start, prestavka_end, poznamka) VALUES ($1, $2, $3, $4, $5, $6, $7)';
  try {
    await userDB_pool.query(queryText, [login, produkt, pocet, ucebna, prestavka_start, prestavka_end, poznamka]);

		const auth = Buffer.from(`${process.env.NTFY_USER}:${process.env.NTFY_PASS}`).toString("base64");

		const response = await fetch(process.env.NTFY_HOST, {
		  method: "POST",
		  headers: {
		    "Authorization": `Basic ${auth}`,
		    "Title": "New Order",
		    "Priority": "high"
		  },
		  body: `New order from ${login}, product: ${produkt} x ${pocet} to ${ucebna} at ${prestavka_start}. Note: ${poznamka}`  
		});

		console.log("Status:", response.status);

		const result = await response.json();
		console.log(result);
		
    
    return true;
  } catch (err) {
    console.error('Chyba při ukládání objednávky:', err);
    return false;
  }
};


/**
 * Získá udaje o pohybech ve skladě
 * @param {string} produkt - Název produktu pro filtrovaní pohybů
 * @param {string} typ - Typ pohybu pro filtrovaní pohybů
 * @param {string} sloupce - Ktere slouce zobrazit
 * @returns {Array} - Pole objektů s informacemi o pohybech
 */

const getPohyby = async (produkt, typ) => {
  let queryText = `SELECT id, cas, typ_pohybu, mnozstvi, cena_za_kus, bonus, celkem, poznamka, produkt FROM pohyby`;
  const queryParams = [];

  if (produkt) {
    queryParams.push(produkt);
    queryText += ` WHERE produkt = $${queryParams.length}`;
  }

  if (typ) {
    queryParams.push(typ);
    queryText += produkt ? ` AND typ_pohybu = $${queryParams.length}` : ` WHERE typ_pohybu = $${queryParams.length}`;
  }

  queryText += ` ORDER BY cas DESC`;

  try {
    const { rows } = await skladDB_pool.query(queryText, queryParams);
    return rows;
  } catch (err) {
    console.error('Chyba při získávání pohybů:', err);
    return [];
  }
};

const getInventory = async () => {
  const queryText = 'SELECT id, produkt, cena, img,  sklad_doma, sklad_skola FROM sklad ORDER BY id ASC';
  try {
    const { rows } = await skladDB_pool.query(queryText);
    return rows;
  } catch (err) {
    console.error('Chyba při získávání skladových zásob:', err);
    return [];
  }
};

const getPohybySum = async (produkt, typ) => {
    // Použijeme COALESCE, aby v případě prázdné tabulky vrátila 0 místo NULL
    let queryText = `SELECT SUM(celkem) AS celkovy_soucet FROM pohyby`;
    const queryParams = [];
    const conditions = [];

    // Logika pro dynamické skládání WHERE podmínek
    if (produkt) {
        queryParams.push(produkt);
        conditions.push(`produkt = $${queryParams.length}`);
    }

    if (typ) {
        queryParams.push(typ);
        conditions.push(`typ_pohybu = $${queryParams.length}`);
    }

    // Pokud existují nějaké podmínky, přidáme je do query
    if (conditions.length > 0) {
        queryText += ` WHERE ` + conditions.join(' AND ');
    }

    try {
        const { rows } = await skladDB_pool.query(queryText, queryParams);
        // Vrátíme buď součet převedený na číslo, nebo 0
        return parseFloat(rows[0].celkovy_soucet) || 0;
    } catch (err) {
        console.error('Chyba při výpočtu součtu pohybů:', err);
        return 0;
    }
};

const createProduct = async (produkt, sklad_doma, sklad_skola) => {
  const queryText = 'INSERT INTO sklad (produkt, sklad_doma, sklad_skola) VALUES ($1, $2, $3)';
  try {
    await skladDB_pool.query(queryText, [produkt, sklad_doma, sklad_skola]);
    return true;
  }
  catch (err) {
    console.error('Chyba při vytváření produktu:', err);
    return false;
  }
};  

const transferItem = async (produkt, mnozstvi) => {
  const queryText = 'UPDATE sklad SET sklad_doma = sklad_doma - $1, sklad_skola = sklad_skola + $1 WHERE produkt = $2';
  try {
    await skladDB_pool.query(queryText, [mnozstvi, produkt]);
    return true;
  }
  catch (err) {
    console.error('Chyba při převodu položky:', err);
    return false;
  }
};

const createPohyb = async (produkt, typ_pohybu, mnozstvi, cena_za_kus, bonus, poznamka) => {
  const queryText = 'INSERT INTO pohyby (produkt, typ_pohybu, mnozstvi, cena_za_kus, bonus, poznamka) VALUES ($1, $2, $3, $4, $5, $6)';
  try {
    await skladDB_pool.query(queryText, [produkt, typ_pohybu, mnozstvi, cena_za_kus, bonus, poznamka]);
    return true;
  }
  catch (err) {
    console.error('Chyba při vytváření pohybu v DB:', err);
    return false;
  }
}

/**
 * Změní stav skladu o zadanou hodnotu (přičte/odečte).
 * Pokud je sklad_doma nebo sklad_skola prázdný/null, přičte se 0 (beze změny).
 */
const updateInventory = async (produkt, rozdil_doma, rozdil_skola) => {
  // COALESCE($2, 0) zajistí, že pokud je hodnota null, přičte se nula
  const query = `
    UPDATE sklad 
    SET 
      sklad_doma = sklad_doma + COALESCE($2, 0),
      sklad_skola = sklad_skola + COALESCE($3, 0)
    WHERE produkt = $1
  `;

  // Převedeme prázdné vstupy na null pro SQL, nebo na 0 (v tomto případě vyjde nastejno)
  const values = [
    produkt, 
    (rozdil_doma !== '' && rozdil_doma !== undefined) ? rozdil_doma : 0, 
    (rozdil_skola !== '' && rozdil_skola !== undefined) ? rozdil_skola : 0
  ];

  try {
    const client = await skladDB_pool.connect();
    const res = await client.query(query, values);
    client.release();

    if (res.rowCount === 0) {
      console.warn(`Produkt "${produkt}" nebyl nalezen, nic se neupravilo.`);
    } else {
      console.log(`Sklad produktu "${produkt}" byl upraven.`);
    }
    
    return res;
  } catch (err) {
    console.error('Chyba při přičítání ke skladu:', err.stack);
    throw err;
  }
};

const getUsers = async (keyWord) => {
  const formattedKeyword = `%${keyWord}%`;

  const query  = `
  SELECT id, login, kredit 
  FROM uzivatele_tb 
  WHERE 
    CAST(id AS TEXT) LIKE $1 
    OR LOWER(login) LIKE LOWER($1)
  LIMIT 10;
  `;

  try {
    const res = await userDB_pool.query(query, [formattedKeyword]);

    return res.rows;
  } catch (err) {
    console.error('Search query failed:', err);
    throw err;
  }
};

const getUserCredit = async (userId) => {
  const query  = `
  SELECT kredit 
  FROM uzivatele_tb 
  WHERE id=$1;`;

  try {
    const res = await userDB_pool.query(query, [userId]);

    return res.rows;
  } catch (err) {
    console.error('Search query failed:', err);
    throw err;
  }
}

const getOrderDetails = async (orderId) => {
  const queryText = 'SELECT id, customer_name, product_name, quantity, created_at, status, ucebna, prestavka_start, prestavka_end, poznamka FROM objednavky_tb WHERE id=$1';
  try {
    const { rows } = await userDB_pool.query(queryText, [orderId]);
    return rows;
  } catch (err) {
    console.error('Chyba při získávání objednávek:', err);
    return [];
  }
}

// 2. Export funkcí na konci souboru
module.exports = {
  userDB_pool,
  query: (text, params) => userDB_pool.query(text, params),
  verifyUser,
  addOrder,
  getOrders,
  createUser,
  toggleOrderStatus,
  getPohyby,
  getInventory,
  createProduct,
  transferItem,
  createPohyb, 
  updateInventory,
  getPohybySum,
  getUsers,
  updateUserCredit,
  getUserCredit,
  getOrderDetails
};
