const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const { getOrders, createUser, toggleOrderStatus, updateUserCredit, getOrderDetails, query } = require('../utils/db');

router.get('/admin', requireAdmin, async (req, res) => {
    try {
        const objednavky = await getOrders();
        res.render('admin', {
            objednavky: objednavky
        });
    } catch (err) {
        res.status(500).send('Chyba při načítání objednávek');
    }
});

router.post('/admin/create-user', requireAdmin, async (req, res) => {
    const { username, password } = req.body;
    const success = await createUser(username, password);

    if (success) {
        res.redirect('/admin?status=user_created');
    } else {
        res.redirect('/admin?error=create_failed');
    }
});

router.post('/admin/toggle-order', requireAdmin, async (req, res) => {
    const { orderId } = req.body;
    await toggleOrderStatus(orderId);
    res.redirect('/admin');
});


router.post('/admin/addCredit',  requireAdmin, async (req, res) => {
    const {userId, charge} = req.body;
    try {
        const result = await updateUserCredit(userId, charge);
        console.log(userId, charge);

        // add result check
        res.redirect('/admin');

    } catch (err) {
        res.status(500).send('Chyba při dobíjení kreditu.');
    }

});

function generateTableHtml(resOrError) {
  // 1. Handle error strings
  if (typeof resOrError === 'string') {
    return `<div class="error-text">Error: ${resOrError}</div>`;
  }

  const db_res = resOrError;

  // 2. Handle SELECT results with data rows
  if (db_res && db_res.rows && db_res.rows.length > 0) {
    const headers = Object.keys(db_res.rows[0]);
    
    const headerRow = headers.map(h => `<th>${h}</th>`).join('');
    const dataRows = db_res.rows.map((row, idx) => {
      const cells = headers.map(h => {
        const val = row[h];
        const displayVal = val === null ? 'null' : typeof val === 'object' ? JSON.stringify(val) : val;
        return `<td>${displayVal}</td>`;
      }).join('');
      return `<tr><td class="index-col">${idx}</td>${cells}</tr>`;
    }).join('');

    return `
      <table class="console-table">
        <thead>
          <tr><th>(index)</th>${headerRow}</tr>
        </thead>
        <tbody>
          ${dataRows}
        </tbody>
      </table>
    `;
  }

  // 3. Handle DDL / DML commands with no data rows (ALTER, INSERT, UPDATE, DELETE, etc.)
  if (db_res && db_res.command) {
    let msg = `Query executed successfully. (${db_res.command})`;
    if (db_res.rowCount !== null && db_res.rowCount !== undefined) {
      msg += ` - ${db_res.rowCount} row(s) affected.`;
    }
    return `<div class="success-text">${msg}</div>`;
  }

  return `<p>No data found.</p>`;
}

router.get('/admin/db-query', requireAdmin, async (req, res) => {
    res.render('./db-query', {
        dbOutput: '<p>No query executed yet.</p>'
    });
});

router.post('/admin/db-query', requireAdmin, async (req, res) => {
    console.log(req.body);
    try {
        const db_res = await query(req.body.query);
        const tableHtml = generateTableHtml(db_res);

        res.render('./db-query', { dbOutput: tableHtml });
    } catch (error) {
        const errorHtml = generateTableHtml(error.message);
        res.status(400).render('./db-query', { dbOutput: errorHtml });
    }
});

module.exports = router;
