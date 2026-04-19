// api/portfolio/[id].js – PUT (update) / DELETE a single portfolio item
import { createClient } from "@libsql/client";
import { requireAuth } from "../_auth.js";

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
  const { id } = req.query;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const itemId = Number(id);

  try {
    await ensurePortfolioTable(db);

    if (req.method === "PUT") {
      if (!requireAuth(req, res)) return;

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
        sql: "UPDATE portfolio SET type = ?, url = ?, caption = ? WHERE id = ?",
        args: [type, url, caption, itemId],
      });

      if (result.rowsAffected === 0) {
        return res.status(404).json({ error: "Item not found" });
      }
      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      if (!requireAuth(req, res)) return;

      const result = await db.execute({
        sql: "DELETE FROM portfolio WHERE id = ?",
        args: [itemId],
      });

      if (result.rowsAffected === 0) {
        return res.status(404).json({ error: "Item not found" });
      }
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "PUT, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[/api/portfolio/[id]]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
