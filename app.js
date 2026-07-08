require('dotenv').config();

const express        = require('express');
const session         = require('express-session');
const cookieParser    = require('cookie-parser');
const compression     = require('compression');
const path            = require('path');

const publicRoutes = require('./routes/public');
const adminRoutes  = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }, // 8 hours
}));

app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

// Expose request path / url to all views (used for active nav state, OG tags)
app.use((req, res, next) => {
  res.locals.reqUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  next();
});

app.use('/admin', adminRoutes);
app.use('/', publicRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong.');
});

app.listen(PORT, () => {
  console.log(`TechZynq running at http://localhost:${PORT}`);
});
