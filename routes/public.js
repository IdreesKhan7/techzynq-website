const express   = require('express');
const router    = express.Router();
const articles  = require('../models/articles');
const messages  = require('../models/messages');
const subs      = require('../models/subscribers');
const { sendContactEmail, sendContactConfirmation } = require('../utils/mailer');

// ─── Homepage ────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const breaking = articles.getBreakingArticle();
  const { articles: featured } = articles.getAllArticles({ limit: 1 });
  const hero = breaking || (featured[0] || null);

  const { articles: latest } = articles.getAllArticles({ limit: 6 });
  const { articles: aiList } = articles.getAllArticles({ category: 'AI', limit: 4 });
  const { articles: techList } = articles.getAllArticles({ category: 'Tech', limit: 4 });

  res.render('index', {
    title: 'TechZynq — AI & Technology News',
    description: 'Breaking AI and Technology news, analysis, and insights. Stay ahead of the curve with TechZynq.',
    hero,
    latest,
    aiList,
    techList,
    currentPath: '/',
  });
});

// ─── Latest News ─────────────────────────────────────────────────────────────
router.get('/latest', (req, res) => {
  const page     = parseInt(req.query.page) || 1;
  const perPage  = 12;
  const cat      = req.query.cat || null;
  const { articles: list, total } = articles.getAllArticles({
    limit: perPage,
    offset: (page - 1) * perPage,
    category: cat,
  });
  const tags = articles.getPopularTags();
  res.render('latest', {
    title: 'Latest News — TechZynq',
    description: 'The latest AI and technology news from TechZynq.',
    list, total, page, perPage, cat, tags,
    currentPath: '/latest',
  });
});

// ─── Category pages ──────────────────────────────────────────────────────────
router.get('/ai', (req, res) => {
  const page    = parseInt(req.query.page) || 1;
  const perPage = 12;
  const { articles: list, total } = articles.getAllArticles({
    category: 'AI', limit: perPage, offset: (page - 1) * perPage,
  });
  res.render('category', {
    title: 'Artificial Intelligence — TechZynq',
    description: 'In-depth AI coverage: research breakthroughs, model releases, and industry moves.',
    category: 'AI', list, total, page, perPage,
    currentPath: '/ai',
  });
});

router.get('/tech', (req, res) => {
  const page    = parseInt(req.query.page) || 1;
  const perPage = 12;
  const { articles: list, total } = articles.getAllArticles({
    category: 'Tech', limit: perPage, offset: (page - 1) * perPage,
  });
  res.render('category', {
    title: 'Technology — TechZynq',
    description: 'Hardware, software, startups, and the technology shaping tomorrow.',
    category: 'Tech', list, total, page, perPage,
    currentPath: '/tech',
  });
});

// ─── Tag page ────────────────────────────────────────────────────────────────
router.get('/tag/:slug', (req, res) => {
  const tag  = req.params.slug;
  const page = parseInt(req.query.page) || 1;
  const perPage = 12;
  const { articles: list, total } = articles.getAllArticles({
    tag, limit: perPage, offset: (page - 1) * perPage,
  });
  res.render('tag', {
    title: `#${tag} — TechZynq`,
    description: `All TechZynq articles tagged with "${tag}".`,
    tag, list, total, page, perPage,
    currentPath: `/tag/${tag}`,
  });
});

// ─── Article detail ──────────────────────────────────────────────────────────
router.get('/article/:slug', (req, res) => {
  const article = articles.getArticleBySlug(req.params.slug);
  if (!article || article.status !== 'published') {
    return res.status(404).render('404', { title: 'Not Found — TechZynq', description: 'Page not found.', currentPath: '' });
  }

  articles.incrementViews(article.slug);

  const { articles: related } = articles.getAllArticles({
    category: article.category, limit: 4,
  });
  const relatedFiltered = related.filter(a => a.id !== article.id).slice(0, 3);

  res.render('article', {
    title: `${article.title} — TechZynq`,
    description: article.excerpt,
    article,
    related: relatedFiltered,
    currentPath: `/article/${article.slug}`,
  });
});

// ─── About ───────────────────────────────────────────────────────────────────
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About TechZynq — AI & Technology News',
    description: 'The story behind TechZynq — our mission, our team, and why we cover AI and Technology the way we do.',
    currentPath: '/about',
  });
});

// ─── Contact ─────────────────────────────────────────────────────────────────
router.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'Contact — TechZynq',
    description: 'Get in touch with the TechZynq team.',
    success: false,
    errors: null,
    currentPath: '/contact',
  });
});

router.post('/contact', (req, res) => {
  const { name, email, reason, message } = req.body;
  const errors = [];
  if (!name || name.trim().length < 2)    errors.push('Please enter your name.');
  if (!email || !email.includes('@'))     errors.push('Please enter a valid email address.');
  if (!message || message.trim().length < 10) errors.push('Please enter a message (at least 10 characters).');

  if (errors.length) {
    return res.render('contact', {
      title: 'Contact — TechZynq',
      description: 'Get in touch with the TechZynq team.',
      success: false,
      errors,
      form: { name, email, reason, message },
      currentPath: '/contact',
    });
  }

  const trimmed = { name: name.trim(), email: email.trim(), reason, message: message.trim() };

  // Save to database (always)
  messages.createMessage(trimmed);

  // Send email notification (non-blocking — DB save already succeeded)
  sendContactEmail(trimmed).then(result => {
    if (!result.ok) console.warn('[contact] Email not sent:', result.error);
  });
  sendContactConfirmation({ name: trimmed.name, email: trimmed.email });

  res.render('contact', {
    title: 'Contact — TechZynq',
    description: 'Get in touch.',
    success: true,
    errors: null,
    currentPath: '/contact',
  });
});

// ─── Newsletter subscribe ────────────────────────────────────────────────────
router.post('/subscribe', (req, res) => {
  const { email } = req.body;
  const valid = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  if (!valid) {
    return res.json({ ok: false, message: 'Please enter a valid email address.' });
  }
  const { created } = subs.addSubscriber(email.trim().toLowerCase());
  res.json({ ok: true, created, message: created ? 'Thanks for subscribing!' : 'You\'re already subscribed.' });
});

// ─── Search API ──────────────────────────────────────────────────────────────
router.get('/api/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.json({ results: [] });
  const results = articles.searchArticles(q);
  res.json({ results: results.map(a => ({
    title:     a.title,
    slug:      a.slug,
    excerpt:   a.excerpt,
    category:  a.category,
    publishedAt: a.publishedAt,
    coverImage: a.coverImage,
  }))});
});

// ─── Sitemap ─────────────────────────────────────────────────────────────────
router.get('/sitemap.xml', (req, res) => {
  const { articles: all } = articles.getAllArticles({ limit: 0 });
  const base = `${req.protocol}://${req.get('host')}`;
  const staticPages = ['', '/latest', '/ai', '/tech', '/about', '/contact'];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  staticPages.forEach(p => {
    xml += `  <url><loc>${base}${p}</loc><changefreq>daily</changefreq><priority>${p === '' ? '1.0' : '0.8'}</priority></url>\n`;
  });
  all.forEach(a => {
    xml += `  <url><loc>${base}/article/${a.slug}</loc><lastmod>${a.updatedAt.split('T')[0]}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`;
  });
  xml += `</urlset>`;
  res.type('application/xml').send(xml);
});

router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${req.protocol}://${req.get('host')}/sitemap.xml\n`);
});

// ─── 404 ─────────────────────────────────────────────────────────────────────
router.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found — TechZynq', description: 'Page not found.', currentPath: '' });
});

module.exports = router;
