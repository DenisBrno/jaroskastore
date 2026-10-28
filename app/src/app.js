const express = require('express');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const pgSession = require('connect-pg-simple')(session);
const { DB_Pool } = require('./utils/db');
const config = require('./config');
const { loadUser } = require('./middleware/auth');
const { csrfProtection } = require('./middleware/csrf');
const { migrateToLatest } = require('./utils/migrate');
const { MIN_PASSWORD_LENGTH } = require('./utils/password');

const app = express();
const port = 3000;

// In production the app runs behind the ingress (one proxy), which terminates TLS:
// trust its X-Forwarded-* headers for the client IP and https
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Security headers. Scripts may only come from this app and cdnjs (QR library, pinned with SRI),
// inline scripts and event handlers are blocked.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            'script-src': ["'self'", 'https://cdnjs.cloudflare.com'],
            'frame-ancestors': ["'none'"],
            // Production is https only, locally the app runs over plain http
            'upgrade-insecure-requests': process.env.NODE_ENV === 'production' ? [] : null,
        },
    },
    strictTransportSecurity: { maxAge: 180 * 24 * 60 * 60, includeSubDomains: false },
}));

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
app.locals.minPasswordLength = MIN_PASSWORD_LENGTH;
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
    // Every request renews the expiry, so a login ends after 7 days without activity
    rolling: true,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        // Secure (https only) whenever the request came over https
        secure: 'auto',
        sameSite: 'lax'
    }
}));

// Logged-in user and role for routes (req.user) and views (user, hasRole)
app.use(loadUser);

// Every POST needs the form's CSRF token
app.use(csrfProtection);

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
    // Details only in the log, the endpoint is public
    console.error('[HEALTH] Database check failed:', err.message);
    res.status(503).json({
      status: 'unhealthy'
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
