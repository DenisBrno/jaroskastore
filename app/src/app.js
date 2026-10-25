const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { DB_Pool } = require('./utils/db');
const config = require('./config'); // nebo správná cesta ke config.js


const app = express();
const port = 3000;



// Middleware
app.use('/resources', express.static(config.DATA_DIR));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/style.css', (req, res, next) => {
    const fetchDest = req.headers['sec-fetch-dest'];
    if (fetchDest === 'document') {
        return res.status(403).send('Forbidden');
    }
    next();
}, express.static(path.join(__dirname, 'style.css')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session store configuration
const store = new pgSession({
    pool: DB_Pool,
    tableName: 'session'
});

// Explicitly log when store is ready or failing
store.on('error', (err) => console.error('[STORE] Database Error:', err));

// Session middleware
app.use(session({
    store: store,
    name: 'session_id',
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: false, 
        sameSite: 'lax'
    }
}));

app.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.url} - Session ID: ${req.sessionID} - User: ${req.session.username || 'guest'}`);
    res.locals.session = (req.session && req.session.username) ? req.session : null;
    next();
});

// Import Routers
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/order');
const adminRoutes = require('./routes/admin');
const financeRoutes = require('./routes/finances');
const apiRoutes = require('./routes/api');
const toastyRoutes = require('./routes/toasty');

// Use Routers
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', orderRoutes);
app.use('/', adminRoutes);
app.use('/', financeRoutes);
app.use('/', apiRoutes);
app.use('/', toastyRoutes);


app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');

    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      error: err.message
    });
  }
});

app.listen(port, () => {
    console.log(`✅ Jaroska.store běží na: http://localhost:${port}/`);
});
