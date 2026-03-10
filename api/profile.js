// api/profile.js – GET / PUT profile
import { createClient } from '@libsql/client';

function getDb() {
  return createClient({
    url: process.env.TURSO_DB_URL,
    authToken: process.env.TURSO_DB_AUTH_TOKEN,
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
      const { name = '', contact = '', bio = '', photo_url = '', color_scheme = 'default' } = req.body ?? {};
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
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[/api/profile]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
