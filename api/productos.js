import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { requireAdmin } from "./_auth.js";

function getSql() {
  if (!process.env.POSTGRES_URL) {
    throw new Error("Falta configurar POSTGRES_URL en Vercel.");
  }

  return neon(process.env.POSTGRES_URL);
}

function normalizarProducto(datos, { requireId = false } = {}) {
  const id = datos?.id == null ? "" : String(datos.id).trim();
  const nombre = String(datos?.nombre ?? "").trim();
  const precio = Number(datos?.precio);

  if (requireId && !id) {
    throw new Error("Falta el ID del producto.");
  }

  if (!nombre) {
    throw new Error("El nombre del producto es obligatorio.");
  }

  if (!Number.isFinite(precio) || precio < 0) {
    throw new Error("El precio debe ser un número igual o mayor que cero.");
  }

  return {
    id,
    nombre,
    precio,
    categoria: String(datos?.categoria ?? "").trim(),
    imagen: String(datos?.imagen ?? "").trim(),
    descripcion: String(datos?.descripcion ?? "").trim(),
    detalles: String(datos?.detalles ?? "").trim(),
    solicitud: String(datos?.solicitud ?? "").trim(),
    activo: Boolean(datos?.activo)
  };
}

function errorDeValidacion(res, error) {
  return res.status(400).json({ error: error.message });
}

export default async function handler(req, res) {
  try {
    const sql = getSql();

    if (req.method === "GET") {
      const productos = await sql`
        SELECT
          id::text AS id,
          nombre,
          precio,
          categoria,
          imagen,
          descripcion,
          detalles,
          solicitud,
          activo
        FROM productos
        ORDER BY id
      `;

      return res.status(200).json(productos);
    }

    if (!requireAdmin(req, res)) {
      return;
    }

    if (req.method === "POST") {
      let producto;

      try {
        producto = normalizarProducto(req.body);
      } catch (error) {
        return errorDeValidacion(res, error);
      }

      const id = randomUUID();
      const creado = await sql`
        INSERT INTO productos (
          id, nombre, precio, categoria, imagen,
          descripcion, detalles, solicitud, activo
        )
        VALUES (
          ${id}, ${producto.nombre}, ${producto.precio}, ${producto.categoria},
          ${producto.imagen}, ${producto.descripcion}, ${producto.detalles},
          ${producto.solicitud}, ${producto.activo}
        )
        RETURNING
          id::text AS id, nombre, precio, categoria, imagen,
          descripcion, detalles, solicitud, activo
      `;

      return res.status(201).json({ ok: true, producto: creado[0] });
    }

    if (req.method === "PUT") {
      let producto;

      try {
        producto = normalizarProducto(req.body, { requireId: true });
      } catch (error) {
        return errorDeValidacion(res, error);
      }

      const actualizado = await sql`
        UPDATE productos
        SET
          nombre = ${producto.nombre},
          precio = ${producto.precio},
          categoria = ${producto.categoria},
          imagen = ${producto.imagen},
          descripcion = ${producto.descripcion},
          detalles = ${producto.detalles},
          solicitud = ${producto.solicitud},
          activo = ${producto.activo}
        WHERE id::text = ${producto.id}
        RETURNING
          id::text AS id, nombre, precio, categoria, imagen,
          descripcion, detalles, solicitud, activo
      `;

      if (!actualizado.length) {
        return res.status(404).json({ error: "Producto no encontrado." });
      }

      return res.status(200).json({ ok: true, producto: actualizado[0] });
    }

    if (req.method === "DELETE") {
      const id = req.body?.id == null ? "" : String(req.body.id).trim();

      if (!id) {
        return res.status(400).json({ error: "Falta el ID del producto." });
      }

      const eliminado = await sql`
        DELETE FROM productos
        WHERE id::text = ${id}
        RETURNING id::text AS id
      `;

      if (!eliminado.length) {
        return res.status(404).json({ error: "Producto no encontrado." });
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Método no permitido." });
  } catch (error) {
    console.error("ERROR PRODUCTOS:", error);
    return res.status(500).json({
      error: "No se pudo procesar los productos.",
      detalle: error.message
    });
  }
}
