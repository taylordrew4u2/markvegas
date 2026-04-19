// api/media/[id].js – serve uploaded media from Turso
import { createClient } from "@tursodatabase/serverless/compat";

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

async function ensureMediaTable(db) {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS media_uploads (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       mime_type TEXT NOT NULL,
       original_name TEXT NOT NULL DEFAULT '',
       data BLOB NOT NULL,
       created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`,
  );
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  const mediaId = Number(id);
  if (!id || Number.isNaN(mediaId)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const db = getDb();
    await ensureMediaTable(db);

    const result = await db.execute({
      sql: "SELECT mime_type, data FROM media_uploads WHERE id = ?",
      args: [mediaId],
    });

    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: "Media not found" });
    }

    const mimeType = row.mime_type || "application/octet-stream";
    const payload = row.data;

    if (!payload) {
      return res.status(404).json({ error: "Media not found" });
    }

    const buffer = Buffer.isBuffer(payload)
      ? payload
      : payload instanceof Uint8Array
        ? Buffer.from(payload)
        : Buffer.from(payload);

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.status(200).send(buffer);
  } catch (err) {
    console.error("[/api/media/[id]]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
