const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const { getOrders, createUser, setUserPassword, toggleOrderStatus, updateUserCredit, query } = require('../utils/db');
const { isValidNewPassword } = require('../utils/password');

router.get('/admin', requireAdmin, async (req, res) => {
    try {
        const objednavky = await getOrders();
        res.render('admin', {
            objednavky: objednavky,
            status: req.query.status,
            error: req.query.error
        });
    } catch (err) {
        res.status(500).send('Chyba při načítání objednávek');
    }
});

router.post('/admin/create-user', requireAdmin, async (req, res) => {
    const username = String(req.body.username || '').trim();
    const { password } = req.body;

    if (!username || !isValidNewPassword(password)) {
        return res.redirect('/admin?error=invalid_password');
    }
    try {
        const success = await createUser(username, password);
        res.redirect(success ? '/admin?status=user_created' : '/admin?error=user_exists');
    } catch (err) {
        res.redirect('/admin?error=create_failed');
    }
});

// Sets a new password for any user and logs them out on all devices
router.post('/admin/set-password', requireAdmin, async (req, res) => {
    const userId = parseInt(req.body.userId);
    const { password } = req.body;

    if (Number.isNaN(userId)) {
        return res.redirect('/admin?error=no_user');
    }
    if (!isValidNewPassword(password)) {
        return res.redirect('/admin?error=invalid_password');
    }
    try {
        const success = await setUserPassword(userId, password);
        res.redirect(success ? '/admin?status=password_set' : '/admin?error=no_user');
    } catch (err) {
        console.error('Setting the password failed:', err);
        res.redirect('/admin?error=password_failed');
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

const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Everything coming from the database or the query is escaped, the result is rendered unescaped
function generateTableHtml(resOrError) {
  // 1. Handle error strings
  if (typeof resOrError === 'string') {
    return `<div class="form-error">Chyba: ${escapeHtml(resOrError)}</div>`;
  }

  const db_res = resOrError;

  // 2. Handle SELECT results with data rows
  if (db_res && db_res.rows && db_res.rows.length > 0) {
    const headers = Object.keys(db_res.rows[0]);
    
    const headerRow = headers.map(h => `<th>${escapeHtml(h)}</th>`).join('');
    const dataRows = db_res.rows.map((row, idx) => {
      const cells = headers.map(h => {
        const val = row[h];
        const displayVal = val === null ? 'null' : typeof val === 'object' ? JSON.stringify(val) : val;
        return `<td>${escapeHtml(displayVal)}</td>`;
      }).join('');
      return `<tr><td>${idx}</td>${cells}</tr>`;
    }).join('');

    return `
      <table>
        <thead>
          <tr><th>#</th>${headerRow}</tr>
        </thead>
        <tbody>
          ${dataRows}
        </tbody>
      </table>
    `;
  }

  // 3. Handle DDL / DML commands with no data rows (ALTER, INSERT, UPDATE, DELETE, etc.)
  if (db_res && db_res.command) {
    let msg = `Dotaz proveden (${escapeHtml(db_res.command)})`;
    if (db_res.rowCount !== null && db_res.rowCount !== undefined) {
      msg += `, ovlivněno řádků: ${db_res.rowCount}`;
    }
    return `<div class="form-success">${msg}</div>`;
  }

  return `<p>Žádná data.</p>`;
}

router.get('/admin/db-query', requireAdmin, async (req, res) => {
    res.render('./db-query', {
        dbOutput: '<p>Zatím nebyl proveden žádný dotaz.</p>'
    });
});

router.post('/admin/db-query', requireAdmin, async (req, res) => {
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
