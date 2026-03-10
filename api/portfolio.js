// api/portfolio.js – GET all items / POST new item
import { createClient } from "@libsql/client";

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

async function ensurePortfolioTable(db) {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS portfolio (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       type TEXT NOT NULL CHECK(type IN ('image','video')),
       url TEXT NOT NULL,
       caption TEXT NOT NULL DEFAULT '',
       created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`,
  );
}

export default async function handler(req, res) {
  const db = getDb();

  try {
    await ensurePortfolioTable(db);

    if (req.method === "GET") {
      const result = await db.execute(
        "SELECT id, type, url, caption, created_at FROM portfolio ORDER BY created_at DESC",
      );
      const rows = result.rows.map((r) => ({
        id: r.id,
        type: r.type,
        url: r.url,
        caption: r.caption ?? "",
        created_at: r.created_at,
      }));
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const { type, url, caption = "" } = req.body ?? {};

      if (!type || !url) {
        return res.status(400).json({ error: "type and url are required" });
      }
      if (type !== "image" && type !== "video") {
        return res
          .status(400)
          .json({ error: 'type must be "image" or "video"' });
      }

      const result = await db.execute({
        sql: "INSERT INTO portfolio (type, url, caption) VALUES (?, ?, ?)",
        args: [type, url, caption],
      });
      return res
        .status(201)
        .json({ id: Number(result.lastInsertRowid), ok: true });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[/api/portfolio]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
