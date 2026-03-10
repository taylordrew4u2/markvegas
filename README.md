# Mark Vegas – Art Portfolio

A clean, bento-style art portfolio website for an animator. Built with vanilla HTML/CSS/JS on the frontend and Vercel Serverless Functions + Turso (edge SQLite) on the backend.

---

## Project Structure

```
markvegas/
├── index.html           # Landing page (portfolio + profile)
├── admin.html           # Admin panel (password-protected)
├── style.css            # All styles (bento grid, shared UI)
├── script.js            # Landing page JS
├── admin.js             # Admin panel JS
├── api/
│   ├── profile.js       # GET / PUT profile
│   ├── portfolio.js     # GET all / POST new portfolio item
│   └── portfolio/
│       └── [id].js      # PUT / DELETE single portfolio item
├── package.json
├── vercel.json
└── README.md
```

---

## Database Setup (Turso)

### 1. Install the Turso CLI

```bash
# macOS / Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Windows (WSL recommended, or use the npm package)
npm install -g @tursodatabase/cli
```

### 2. Sign up / log in

```bash
turso auth signup   # first time
# or
turso auth login
```

### 3. Create a database

```bash
turso db create markvegas
```

### 4. Get the database URL and auth token

```bash
turso db show markvegas --url
turso db tokens create markvegas
```

Copy the URL (starts with `libsql://`) and the token – you will need them in the next steps.

### 5. Create the tables

Open the Turso shell:

```bash
turso db shell markvegas
```

Then run the following SQL:

```sql
CREATE TABLE IF NOT EXISTS profile (
  id        INTEGER PRIMARY KEY,
  name      TEXT    NOT NULL DEFAULT '',
  contact   TEXT    NOT NULL DEFAULT '',
  bio       TEXT    NOT NULL DEFAULT '',
  photo_url TEXT    NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS portfolio (
  id         INTEGER  PRIMARY KEY AUTOINCREMENT,
  type       TEXT     NOT NULL CHECK(type IN ('image','video')),
  url        TEXT     NOT NULL,
  caption    TEXT     NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Exit the shell with `.quit`.

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Create a `.env` file

```bash
cp .env.example .env   # or create it manually
```

`.env`:

```
TURSO_DB_URL=libsql://<your-database-name>-<your-org>.turso.io
TURSO_DB_AUTH_TOKEN=<your-auth-token>
```

### 3. Run locally with Vercel Dev

```bash
npx vercel dev
```

The site will be available at `http://localhost:3000`.

---

## Deployment on Vercel

### 1. Install the Vercel CLI (optional, or use the dashboard)

```bash
npm install -g vercel
```

### 2. Link the project

```bash
vercel link
```

### 3. Set environment variables in Vercel

Either via the CLI:

```bash
vercel env add TURSO_DB_URL
vercel env add TURSO_DB_AUTH_TOKEN
```

Or in the Vercel dashboard: **Project → Settings → Environment Variables**.

### 4. Deploy

```bash
vercel --prod
```

---

## Admin Panel

Navigate to `/admin.html` on your deployed site (or `http://localhost:3000/admin.html` locally).

- **Password:** `markvegas`
- The session is kept in `sessionStorage` (cleared when the browser tab is closed).
- From the admin panel you can edit the profile (name, bio, contact info, photo URL) and manage portfolio items (add, edit, delete images and videos).

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `TURSO_DB_URL` | Turso database URL (`libsql://…`) |
| `TURSO_DB_AUTH_TOKEN` | Turso authentication token |
