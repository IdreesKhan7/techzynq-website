# TechZynq — AI & Technology News

A production-ready, fully self-contained news website focused on AI & Technology news. Server-rendered with Express + EJS, styled with a custom Tailwind CSS theme, and backed by a file-based JSON database (lowdb) — no external database server, build pipeline, or paid service required.

## Requirements

- [Node.js](https://nodejs.org/) v18 or later (includes npm)

That's it. No database server, no Docker, no external API keys, no paid services. Everything — including image processing (sharp) and the rich-text editor (Quill via CDN) — runs locally.

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` if you want to change the admin credentials or session secret. The default admin login (seeded for local development) is:

- **Email:** `admin@techzynq.com`
- **Password:** `admin123`

> Change `ADMIN_PASSWORD_HASH` in `.env` before deploying anywhere public. Generate a new bcrypt hash with:
> ```bash
> node -e "console.log(require('bcryptjs').hashSync('your-new-password', 10))"
> ```

## Build the CSS

Tailwind CSS is compiled from `public/css/input.css` into `public/css/style.css`. Run this once before first start (and any time you edit `input.css` or add new Tailwind classes in views):

```bash
npm run build:css
```

For active development, you can instead run the watcher in a separate terminal so CSS rebuilds automatically on change:

```bash
npm run watch:css
```

## Run

```bash
npm run dev      # development, auto-restarts on file change (nodemon)
# or
npm start        # production
```

The site will be available at **http://localhost:3000** (or the `PORT` set in `.env`).

## Project structure

```
app.js                 Express app entry point
routes/                public.js (site) and admin.js (admin panel)
controllers/            (logic lives mostly in models/routes for simplicity)
models/                 lowdb-backed data access: articles, messages, subscribers, db
views/                  EJS templates (pages, partials, admin/)
public/                 static assets — compiled CSS, JS-free pages, images, uploads
middleware/             auth.js — admin session guard
utils/                  image.js — multer + sharp upload/resize pipeline
data/db.json            the database file (pre-seeded with sample articles)
```

## Admin panel

Visit `/admin/login` to sign in. From the dashboard you can create, edit, publish/unpublish, and delete articles (with cover image upload and a rich-text editor), and view/delete contact form messages.

## Notes

- The database is a single JSON file at `data/db.json`. Back it up before making bulk edits, and avoid editing it by hand while the server is running.
- Uploaded images are processed into multiple responsive `.webp` sizes and stored in `public/uploads/`.
- `sitemap.xml` and `robots.txt` are generated dynamically from the current article data — no static files to keep in sync.
