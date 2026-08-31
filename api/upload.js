import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import formidable from "formidable";
import { put } from "@vercel/blob";
import { requireAdmin } from "./_auth.js";

export const config = {
  api: {
    bodyParser: false
  }
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const EXTENSION_BY_TYPE = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  if (!requireAdmin(req, res)) {
    return;
  }

  try {
    const form = formidable({
      maxFiles: 1,
      maxFileSize: MAX_FILE_SIZE,
      filter: ({ mimetype }) => Boolean(EXTENSION_BY_TYPE[mimetype])
    });
    const [, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: "Selecciona una imagen primero." });
    }

    if (!EXTENSION_BY_TYPE[file.mimetype]) {
      return res.status(400).json({
        error: "Solo se permiten imágenes JPG, PNG o WEBP."
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({ error: "La imagen supera los 5 MB." });
    }

    const contenido = await readFile(file.filepath);
    const nombre = `productos/${randomUUID()}${EXTENSION_BY_TYPE[file.mimetype]}`;
    const blob = await put(nombre, contenido, {
      access: "public",
      contentType: file.mimetype
    });

    return res.status(201).json({ ok: true, url: blob.url });
  } catch (error) {
    console.error("ERROR UPLOAD:", error);
    return res.status(500).json({
      error: "No se pudo subir la imagen.",
      detalle: error.message
    });
  }
}
