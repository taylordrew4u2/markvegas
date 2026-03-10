// api/upload.js – upload images/videos to Vercel Blob
import fs from 'node:fs/promises';
import path from 'node:path';
import formidable from 'formidable';
import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req) {
  const form = formidable({
    multiples: false,
    maxFileSize: 200 * 1024 * 1024,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

function getFileExt(file) {
  const fromName = path.extname(file.originalFilename || '').toLowerCase();
  if (fromName) return fromName;

  if (file.mimetype === 'image/jpeg') return '.jpg';
  if (file.mimetype === 'image/png') return '.png';
  if (file.mimetype === 'image/webp') return '.webp';
  if (file.mimetype === 'image/gif') return '.gif';
  if (file.mimetype === 'video/mp4') return '.mp4';
  if (file.mimetype === 'video/webm') return '.webm';
  if (file.mimetype === 'video/quicktime') return '.mov';
  return '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { files } = await parseForm(req);
    const uploaded = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploaded) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const type = uploaded.mimetype || '';
    const isImage = type.startsWith('image/');
    const isVideo = type.startsWith('video/');

    if (!isImage && !isVideo) {
      return res.status(400).json({ error: 'Only image/video uploads are allowed' });
    }

    const ext = getFileExt(uploaded);
    const prefix = isImage ? 'images' : 'videos';
    const fileName = `${prefix}/${Date.now()}${ext}`;

    const buffer = await fs.readFile(uploaded.filepath);

    const blob = await put(fileName, buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: type || undefined,
    });

    return res.status(200).json({ ok: true, url: blob.url });
  } catch (err) {
    console.error('[/api/upload]', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
}
