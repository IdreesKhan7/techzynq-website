const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const multer   = require('multer');
const { requireAdmin } = require('../middleware/auth');
const articleModel = require('../models/articles');
const msgModel     = require('../models/messages');
const subsModel    = require('../models/subscribers');
const { processUpload } = require('../utils/image');

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Images only'));
    cb(null, true);
  },
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.get('/login', (req, res) => {
  if (req.session.isAdmin) return res.redirect('/admin');
  res.render('admin/login', { title: 'Admin Login — TechZynq', error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@techzynq.com';
  const adminHashEnv  = process.env.ADMIN_PASSWORD_HASH;

  let valid = false;
  if (email === adminEmail) {
    if (adminHashEnv) {
      valid = await bcrypt.compare(password, adminHashEnv);
    } else {
      // Fallback for first-run: plaintext ADMIN_PASSWORD in .env
      valid = password === (process.env.ADMIN_PASSWORD || 'admin123');
    }
  }

  if (!valid) {
    return res.render('admin/login', { title: 'Admin Login — TechZynq', error: 'Invalid credentials.' });
  }

  req.session.isAdmin   = true;
  req.session.adminEmail = email;
  const returnTo = req.session.returnTo || '/admin';
  delete req.session.returnTo;
  res.redirect(returnTo);
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// ─── Dashboard ───────────────────────────────────────────────────────────────
router.get('/', requireAdmin, (req, res) => {
  const { articles: all } = articleModel.getAllArticles({ status: null, limit: 0 });
  const published  = all.filter(a => a.status === 'published').length;
  const drafts     = all.filter(a => a.status === 'draft').length;
  const unread     = msgModel.getUnreadCount();
  const subs       = subsModel.getCount();
  const recent     = all.slice(0, 8);
  res.render('admin/dashboard', {
    title: 'Dashboard — TechZynq Admin',
    currentAdminPath: '/admin',
    unreadMessages: unread,
    stats: { published, drafts, unread, subs, total: all.length },
    recent,
  });
});

// ─── Articles list ────────────────────────────────────────────────────────────
router.get('/articles', requireAdmin, (req, res) => {
  const { articles: list } = articleModel.getAllArticles({ status: null, limit: 0 });
  res.render('admin/articles', {
    title: 'Articles — TechZynq Admin',
    currentAdminPath: '/admin/articles',
    unreadMessages: msgModel.getUnreadCount(),
    list,
  });
});

// ─── New article ──────────────────────────────────────────────────────────────
router.get('/articles/new', requireAdmin, (req, res) => {
  res.render('admin/article-form', {
    title: 'New Article — TechZynq Admin',
    currentAdminPath: '/admin/articles',
    unreadMessages: msgModel.getUnreadCount(),
    article: null,
    error: null,
  });
});

router.post('/articles/new', requireAdmin, upload.single('coverImage'), async (req, res) => {
  try {
    const data = { ...req.body };
    data.tags = (req.body.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    if (req.file) {
      data.coverImage = await processUpload(req.file);
    }
    articleModel.createArticle(data);
    res.redirect('/admin/articles');
  } catch (err) {
    console.error(err);
    res.render('admin/article-form', {
      title: 'New Article — TechZynq Admin',
      currentAdminPath: '/admin/articles',
      unreadMessages: msgModel.getUnreadCount(),
      article: null,
      error: err.message,
    });
  }
});

// ─── Edit article ─────────────────────────────────────────────────────────────
router.get('/articles/:id/edit', requireAdmin, (req, res) => {
  const article = articleModel.getArticleById(req.params.id);
  if (!article) return res.redirect('/admin/articles');
  res.render('admin/article-form', {
    title: `Edit: ${article.title} — TechZynq Admin`,
    currentAdminPath: '/admin/articles',
    unreadMessages: msgModel.getUnreadCount(),
    article,
    error: null,
  });
});

router.post('/articles/:id/edit', requireAdmin, upload.single('coverImage'), async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    data.tags = (req.body.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    if (req.file) {
      data.coverImage = await processUpload(req.file);
    }
    articleModel.updateArticle(id, data);
    res.redirect('/admin/articles');
  } catch (err) {
    console.error(err);
    const article = articleModel.getArticleById(req.params.id);
    res.render('admin/article-form', {
      title: 'Edit Article — TechZynq Admin',
      currentAdminPath: '/admin/articles',
      unreadMessages: msgModel.getUnreadCount(),
      article,
      error: err.message,
    });
  }
});

// ─── Delete article ───────────────────────────────────────────────────────────
router.post('/articles/:id/delete', requireAdmin, (req, res) => {
  articleModel.deleteArticle(req.params.id);
  res.redirect('/admin/articles');
});

// ─── Messages ─────────────────────────────────────────────────────────────────
router.get('/messages', requireAdmin, (req, res) => {
  const list  = msgModel.getAllMessages();
  const unread = list.filter(m => !m.read).length;
  // Mark all as read on view
  list.filter(m => !m.read).forEach(m => msgModel.markRead(m.id));
  res.render('admin/messages', {
    title: 'Messages — TechZynq Admin',
    currentAdminPath: '/admin/messages',
    unreadMessages: 0,
    list, unread,
  });
});

router.post('/messages/:id/delete', requireAdmin, (req, res) => {
  msgModel.deleteMessage(req.params.id);
  res.redirect('/admin/messages');
});

module.exports = router;
