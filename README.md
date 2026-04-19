# Mark Vegas — Art Portfolio

Bold, editorial portfolio site for an animator. Near-black canvas, oversized
uppercase display type, full-bleed mosaic tiles where the work is the hero.

- Frontend: vanilla HTML/CSS/JS
- Backend: Vercel Serverless Functions
- Database: Turso (LibSQL)
- Media storage: Vercel Blob (direct browser-to-Blob uploads)

## Project Structure

```text
markvegas/
|- index.html
|- admin.html
|- style.css
|- script.js
|- admin.js
|- api/
|  |- _auth.js
|  |- profile.js
|  |- portfolio.js
|  |- portfolio/[id].js
|  |- upload.js           # Vercel Blob client-upload token endpoint
|  |- media/[id].js       # Legacy: serve media stored as Turso BLOB rows
|- scripts/
|  `- setup-vercel.sh
|- vercel.json
|- package.json
`- README.md
```

## Features

- Public landing page with three views (Work / About / Contact) + a mosaic
  grid of full-bleed portfolio tiles that reveal title + index on hover
- Admin panel with password gate
- Profile editing (name, contact, bio, photo URL)
- Portfolio CRUD (add/edit/delete image or video items)
- Theme picker in admin — six schemes: **Noir** (default), **Paper**,
  **Midnight**, **Bone**, **Ember**, **Steel**. Saved to DB and applied to
  the public page via `data-theme` on `<html>`.

## Database Schema

The app auto-creates/updates the `profile` table on first profile API call, but this is the intended schema:

```sql
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY,
  name TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  color_scheme TEXT DEFAULT 'default'
);

CREATE TABLE IF NOT EXISTS portfolio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('image','video')),
  url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Environment Variables

Use these as the primary keys:

```env
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Secret used to authorise all admin write requests (profile, portfolio, upload).
# Defaults to "markvegas" when not set — CHANGE THIS before deploying publicly.
ADMIN_SECRET=change-me-to-a-strong-random-value

# Vercel Blob read/write token – required for /api/upload. Vercel injects
# this automatically in production once a Blob store is connected to the
# project; set it locally for `vercel dev`.
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx
```

Backward-compatible keys are also supported by the API:

```env
TURSO_DB_URL=libsql://your-db.turso.io
TURSO_DB_AUTH_TOKEN=your-token
```

## Media Uploads (Vercel Blob)

Portfolio images and videos are uploaded directly from the browser to
Vercel Blob, bypassing the 4.5 MB serverless function body limit. The flow:

1. Admin UI calls `blobUpload()` from `@vercel/blob/client`, passing the
   admin token inside `clientPayload`.
2. `/api/upload` validates the token and mints a one-time client upload
   token (max 2 GB, restricted to image/video MIME types).
3. The browser streams the file straight to Blob storage and receives a
   public URL, which is then saved to the `portfolio` table via
   `POST /api/portfolio`.

### Setting up a Blob store

1. In the Vercel dashboard, open the project and go to **Storage →
   Create → Blob**.
2. Name the store and click **Connect to Project** (choose Production,
   Preview, and Development).
3. Vercel adds `BLOB_READ_WRITE_TOKEN` to the project's environment
   variables automatically.
4. For local dev, run `vercel env pull` to sync the token into
   `.vercel/.env.development.local`, or copy the value into `.env`.

## Local Development

1. Install dependencies:

```bash
npm install
```

1. Create `.env` from template:

```bash
cp .env.example .env
```

1. Run the app:

```bash
npm run dev
```

App runs on `http://localhost:3000` via `vercel dev`.

## Deploy (Vercel)

1. Ensure project is linked:

```bash
vercel link
```

1. Add environment variables in Vercel dashboard (Project Settings -> Environment Variables):

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `ADMIN_SECRET`
- `BLOB_READ_WRITE_TOKEN` (auto-added when you connect a Blob store)

1. Deploy:

```bash
vercel --prod
```

## Production URLs

- Site: <https://markvegas.space>
- Admin: <https://markvegas.space/admin.html>

## Admin Access

- URL: `https://markvegas.space/admin.html` (or `/admin.html`)
- Current password in code: `markvegas`
- Auth session is stored in `sessionStorage`

## API Endpoints

- `GET /api/profile`
- `PUT /api/profile`
- `GET /api/portfolio`
- `POST /api/portfolio`
- `PUT /api/portfolio/:id`
- `DELETE /api/portfolio/:id`
- `POST /api/upload` — issues a Vercel Blob client-upload token (admin only)
- `GET  /api/media/:id` — legacy endpoint for items stored as Turso BLOB rows

All write endpoints require `Authorization: Bearer <ADMIN_SECRET>`, except
`/api/upload`, which receives the admin token through the Blob client's
`clientPayload` field (the `@vercel/blob` client does not allow custom
request headers).
