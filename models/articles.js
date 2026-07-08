const db   = require('./db');
const { v4: uuidv4 } = require('uuid');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function calcReadTime(html) {
  const words = html.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function ensureUniqueSlug(base, excludeId = null) {
  let slug = base;
  let count = 1;
  while (true) {
    const existing = db.get('articles').find({ slug }).value();
    if (!existing || existing.id === excludeId) break;
    slug = `${base}-${count++}`;
  }
  return slug;
}

// ─── Reads ──────────────────────────────────────────────────────────────────

function getAllArticles({ status = 'published', limit, offset = 0, category, tag } = {}) {
  let chain = db.get('articles');
  if (status) chain = chain.filter(a => a.status === status);
  if (category) chain = chain.filter(a => a.category.toLowerCase() === category.toLowerCase());
  if (tag)      chain = chain.filter(a => a.tags && a.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase()));
  chain = chain.orderBy('publishedAt', 'desc');
  const total = chain.size().value();
  if (offset) chain = chain.drop(offset);
  if (limit)  chain = chain.take(limit);
  return { articles: chain.value(), total };
}

function getArticleBySlug(slug) {
  return db.get('articles').find({ slug }).value() || null;
}

function getArticleById(id) {
  return db.get('articles').find({ id }).value() || null;
}

function getBreakingArticle() {
  return db.get('articles')
    .filter({ status: 'published', isBreaking: true })
    .orderBy('publishedAt', 'desc')
    .first()
    .value() || null;
}

function searchArticles(q) {
  const term = q.toLowerCase().trim();
  return db.get('articles')
    .filter(a => a.status === 'published' && (
      a.title.toLowerCase().includes(term)   ||
      (a.excerpt || '').toLowerCase().includes(term) ||
      (a.tags || []).some(t => t.toLowerCase().includes(term))
    ))
    .orderBy('publishedAt', 'desc')
    .take(20)
    .value();
}

function getPopularTags(limit = 20) {
  const counts = {};
  db.get('articles').filter({ status: 'published' }).value().forEach(a => {
    (a.tags || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

// ─── Writes ─────────────────────────────────────────────────────────────────

function createArticle(data) {
  const now   = new Date().toISOString();
  const base  = slugify(data.title);
  const slug  = ensureUniqueSlug(base);
  const article = {
    id:              uuidv4(),
    title:           data.title,
    slug,
    excerpt:         data.excerpt || '',
    coverImage:      data.coverImage || '',
    body:            data.body || '',
    category:        data.category || 'Tech',
    tags:            data.tags || [],
    author:          data.author || { name: 'TechZynq Staff', avatar: '' },
    status:          data.status || 'draft',
    isBreaking:      data.isBreaking === true || data.isBreaking === 'true',
    publishedAt:     data.status === 'published' ? now : null,
    updatedAt:       now,
    readTimeMinutes: calcReadTime(data.body || ''),
    views:           0,
  };
  db.get('articles').push(article).write();
  return article;
}

function updateArticle(id, data) {
  const now     = new Date().toISOString();
  const current = getArticleById(id);
  if (!current) return null;

  const wasPublished = current.status === 'published';
  const nowPublished = data.status === 'published';

  let slug = current.slug;
  if (data.title && slugify(data.title) !== slugify(current.title)) {
    slug = ensureUniqueSlug(slugify(data.title), id);
  }

  const updated = {
    ...current,
    ...data,
    slug,
    id,
    updatedAt: now,
    publishedAt: (!wasPublished && nowPublished) ? now : current.publishedAt,
    isBreaking:  data.isBreaking === true || data.isBreaking === 'true',
    readTimeMinutes: calcReadTime(data.body || current.body || ''),
    tags: data.tags || current.tags || [],
  };

  db.get('articles').find({ id }).assign(updated).write();
  return updated;
}

function deleteArticle(id) {
  db.get('articles').remove({ id }).write();
}

function incrementViews(slug) {
  db.get('articles').find({ slug }).update('views', v => (v || 0) + 1).write();
}

module.exports = {
  getAllArticles,
  getArticleBySlug,
  getArticleById,
  getBreakingArticle,
  searchArticles,
  getPopularTags,
  createArticle,
  updateArticle,
  deleteArticle,
  incrementViews,
  slugify,
};
