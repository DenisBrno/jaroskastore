const express = require('express');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { DB_Pool } = require('./utils/db');
const config = require('./config');
const { loadUser } = require('./middleware/auth');
const { migrateToLatest } = require('./utils/migrate');

const app = express();
const port = 3000;

// Middleware
app.use('/resources', express.static(config.DATA_DIR)); 
app.use(express.urlencoded({ extended: true }));
// Stylesheets and scripts can be loaded by pages but not opened directly
const blockDirectNavigation = (req, res, next) => {
    if (req.headers['sec-fetch-dest'] === 'document') {
        return res.status(403).send('Přístup odepřen');
    }
    next();
};
app.use('/styles', blockDirectNavigation, express.static(path.join(__dirname, 'styles')));
app.use('/scripts', blockDirectNavigation, express.static(path.join(__dirname, 'scripts')));

// View engine
app.set('view engine', 'ejs');
app.locals.iban = config.IBAN;
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

// Logged-in user and role for routes (req.user) and views (user, hasRole)
app.use(loadUser);

app.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.url} - User: ${req.user ? req.user.login : 'guest'}`);
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
    await DB_Pool.query('SELECT 1');

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

// Serve requests only once the database schema matches the code
migrateToLatest()
    .then(() => {
        app.listen(port, () => {
            console.log(`✅ Jaroska.store běží na: http://localhost:${port}/`);
        });
    })
    .catch((err) => {
        console.error('[MIGRATE] Database migration failed, not starting:', err);
        process.exit(1);
    });
