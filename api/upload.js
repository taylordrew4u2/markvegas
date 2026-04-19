// api/upload.js – issues client-upload tokens for Vercel Blob so the browser
// can stream files directly to Blob storage (bypassing the 4.5 MB serverless
// body limit). Auth is carried via the `clientPayload` field because the
// @vercel/blob client does not let callers set custom request headers.

import crypto from "node:crypto";
import { handleUpload } from "@vercel/blob/client";

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

function isAuthorized(token) {
  const secret = process.env.ADMIN_SECRET || "markvegas";
  const secretBuf = Buffer.from(secret);
  const tokenBuf = Buffer.from(token || "");
  return (
    tokenBuf.length === secretBuf.length &&
    crypto.timingSafeEqual(tokenBuf, secretBuf)
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        let token = "";
        try {
          token = JSON.parse(clientPayload || "{}").token || "";
        } catch {
          token = "";
        }
        if (!isAuthorized(token)) {
          throw new Error("Unauthorized");
        }
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          addRandomSuffix: true,
          maximumSizeInBytes: 2 * 1024 * 1024 * 1024, // 2 GB
        };
      },
      onUploadCompleted: async () => {
        // No-op: the blob URL is returned to the client and persisted
        // alongside the portfolio item via /api/portfolio.
      },
    });
    return res.status(200).json(jsonResponse);
  } catch (err) {
    console.error("[/api/upload]", err);
    const message = err?.message === "Unauthorized" ? "Unauthorized" : "Upload failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
