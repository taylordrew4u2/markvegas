# Mark Vegas - Art Portfolio

Clean, bento-style portfolio site for an animator.

- Frontend: vanilla HTML/CSS/JS
- Backend: Vercel Serverless Functions
- Database: Turso (LibSQL)

## Project Structure

```text
markvegas/
|- index.html
|- admin.html
|- style.css
|- script.js
|- admin.js
|- api/
|  |- profile.js
|  |- portfolio.js
|  |- portfolio/[id].js
|- vercel.json
|- package.json
`- README.md
```

## Features

- Public landing page with profile + portfolio grid
- Admin panel with password gate
- Profile editing (name, contact, bio, photo URL)
- Portfolio CRUD (add/edit/delete image or video items)
- Theme picker in admin (saves color scheme to DB and applies to public page)

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
TURSO_AUTH_TOKEN=database_TURSO_AUTH_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzMxNjQ3MTAsImlkIjoiMDE5Y2Q4ZGEtNDcwMS03YmI4LWFiOTQtZWY0YjcwNDEzNDRlIiwicmlkIjoiNDU3NDg3YzktN2UyMS00ODEwLThlODctYTJjOTAwZDYyYmZjIn0.4v2RrS-4Gm2FD3hFXPm3BmaCHKyP3dOom9JrnHz8Ek9gY7NXMuju7l1LpvssXDBI6DHRmGjUx1k3B0UomAuGDw"
database_TURSO_DATABASE_URL="libsql://database-fulvous-school-vercel-icfg-bcu7zzamdox9nbdpkugsrnzd.aws-us-east-1.turso.io"
```

Backward-compatible keys are also supported by the API:

```env
TURSO_DB_URL=libsql://your-db.turso.io
TURSO_DB_AUTH_TOKEN=your-token
```

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
