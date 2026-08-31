import { neon } from "@neondatabase/serverless";
import { requireAdmin } from "./_auth.js";

function getSql() {
  if (!process.env.POSTGRES_URL) {
    throw new Error("Falta configurar POSTGRES_URL en Vercel.");
  }

  return neon(process.env.POSTGRES_URL);
}

function nombreValido(nombre) {
  const limpio = String(nombre ?? "").trim();

  if (!limpio) {
    throw new Error("El nombre de la categoría es obligatorio.");
  }

  return limpio;
}

export default async function handler(req, res) {
  try {
    const sql = getSql();

    if (req.method === "GET") {
      const categorias = await sql`
        SELECT id, nombre, activa
        FROM categorias
        ORDER BY id ASC
      `;

      return res.status(200).json(categorias);
    }

    if (!requireAdmin(req, res)) {
      return;
    }

    if (req.method === "POST") {
      let nombre;
      try {
        nombre = nombreValido(req.body?.nombre);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }

      const creada = await sql`
        INSERT INTO categorias (nombre, activa)
        VALUES (${nombre}, TRUE)
        RETURNING id, nombre, activa
      `;

      return res.status(201).json({ ok: true, categoria: creada[0] });
    }

    if (req.method === "PUT") {
      const id = req.body?.id;
      let nombre;
      try {
        nombre = nombreValido(req.body?.nombre);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }

      if (id == null || id === "") {
        return res.status(400).json({ error: "Falta el ID de la categoría." });
      }

      const actualizada = await sql`
        UPDATE categorias
        SET nombre = ${nombre}, activa = ${Boolean(req.body?.activa)}
        WHERE id = ${id}
        RETURNING id, nombre, activa
      `;

      if (!actualizada.length) {
        return res.status(404).json({ error: "Categoría no encontrada." });
      }

      return res.status(200).json({ ok: true, categoria: actualizada[0] });
    }

    if (req.method === "DELETE") {
      const id = req.body?.id;

      if (id == null || id === "") {
        return res.status(400).json({ error: "Falta el ID de la categoría." });
      }

      await sql`DELETE FROM categorias WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Método no permitido." });
  } catch (error) {
    console.error("ERROR CATEGORIAS:", error);
    return res.status(500).json({
      error: "No se pudo procesar las categorías.",
      detalle: error.message
    });
  }
}
