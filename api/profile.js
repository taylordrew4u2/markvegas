// api/profile.js – GET / PUT profile
import { createClient } from '@tursodatabase/serverless/compat';
import { requireAuth } from './_auth.js';

function getDb() {
  return createClient({
    url:
      process.env.TURSO_DATABASE_URL ||
      process.env.TURSO_DB_URL ||
      process.env.database_TURSO_DATABASE_URL,
    authToken:
      process.env.TURSO_AUTH_TOKEN ||
      process.env.TURSO_DB_AUTH_TOKEN ||
      process.env.database_TURSO_AUTH_TOKEN,
  });
}

export default async function handler(req, res) {
  const db = getDb();

  try {
    if (req.method === 'GET') {
      // Ensure the profile row & color_scheme column exist
      await db.execute(
        `CREATE TABLE IF NOT EXISTS profile (
           id INTEGER PRIMARY KEY,
           name TEXT DEFAULT '',
           contact TEXT DEFAULT '',
           bio TEXT DEFAULT '',
           photo_url TEXT DEFAULT '',
           color_scheme TEXT DEFAULT 'default'
         )`
      );
      // Add column if upgrading from older schema
      await db.execute(
        `ALTER TABLE profile ADD COLUMN color_scheme TEXT DEFAULT 'default'`
      ).catch(() => {/* column already exists */});

      await db.execute(
        `INSERT OR IGNORE INTO profile (id, name, contact, bio, photo_url, color_scheme)
         VALUES (1, '', '', '', '', 'default')`
      );

      const result = await db.execute('SELECT * FROM profile WHERE id = 1');
      const row = result.rows[0] ?? {};
      return res.status(200).json({
        id:           row.id           ?? 1,
        name:         row.name         ?? '',
        contact:      row.contact      ?? '',
        bio:          row.bio          ?? '',
        photo_url:    row.photo_url    ?? '',
        color_scheme: row.color_scheme ?? 'default',
      });
    }

    if (req.method === 'PUT') {
      if (!requireAuth(req, res)) return;

      const body = req.body ?? {};
      const name      = body.name      ?? '';
      const contact   = body.contact   ?? '';
      const bio       = body.bio       ?? '';
      const photo_url = body.photo_url ?? '';

      // Only update color_scheme when the client explicitly sends it so
      // saving the profile form never overwrites a previously chosen theme.
      if ('color_scheme' in body) {
        const color_scheme = body.color_scheme ?? 'default';
        await db.execute({
          sql: `INSERT INTO profile (id, name, contact, bio, photo_url, color_scheme)
                VALUES (1, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  name         = excluded.name,
                  contact      = excluded.contact,
                  bio          = excluded.bio,
                  photo_url    = excluded.photo_url,
                  color_scheme = excluded.color_scheme`,
          args: [name, contact, bio, photo_url, color_scheme],
        });
      } else {
        await db.execute({
          sql: `INSERT INTO profile (id, name, contact, bio, photo_url)
                VALUES (1, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  name      = excluded.name,
                  contact   = excluded.contact,
                  bio       = excluded.bio,
                  photo_url = excluded.photo_url`,
          args: [name, contact, bio, photo_url],
        });
      }
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[/api/profile]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
