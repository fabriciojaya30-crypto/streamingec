import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL);

export default async function handler(req, res) {
  try {

    // =========================
    // OBTENER CATEGORÍAS
    // =========================
    if (req.method === "GET") {

      const categorias = await sql`
        SELECT
          id,
          nombre,
          activa
        FROM categorias
        ORDER BY id ASC
      `;

      return res.status(200).json(categorias);
    }


    // =========================
    // CREAR CATEGORÍA
    // =========================
    if (req.method === "POST") {

      const { nombre } = req.body;

      if (!nombre || !nombre.trim()) {

        return res.status(400).json({
          error: "El nombre de la categoría es obligatorio."
        });

      }

      const categoria = await sql`
        INSERT INTO categorias (
          nombre,
          activa
        )
        VALUES (
          ${nombre.trim()},
          TRUE
        )
        RETURNING id, nombre, activa
      `;

      return res.status(201).json({
        ok: true,
        categoria: categoria[0]
      });
    }


    // =========================
    // EDITAR CATEGORÍA
    // =========================
    if (req.method === "PUT") {

      const { id, nombre, activa } = req.body;

      if (!id) {

        return res.status(400).json({
          error: "Falta el ID de la categoría."
        });

      }

      if (!nombre || !nombre.trim()) {

        return res.status(400).json({
          error: "El nombre de la categoría es obligatorio."
        });

      }

      const categoria = await sql`
        UPDATE categorias
        SET
          nombre = ${nombre.trim()},
          activa = ${Boolean(activa)}
        WHERE id = ${id}
        RETURNING id, nombre, activa
      `;

      if (categoria.length === 0) {

        return res.status(404).json({
          error: "Categoría no encontrada."
        });

      }

      return res.status(200).json({
        ok: true,
        categoria: categoria[0]
      });
    }


    // =========================
    // ELIMINAR CATEGORÍA
    // =========================
    if (req.method === "DELETE") {

      const { id } = req.body;

      if (!id) {

        return res.status(400).json({
          error: "Falta el ID de la categoría."
        });

      }

      await sql`
        DELETE FROM categorias
        WHERE id = ${id}
      `;

      return res.status(200).json({
        ok: true,
        mensaje: "Categoría eliminada correctamente."
      });
    }


    // =========================
    // MÉTODO NO PERMITIDO
    // =========================

    return res.status(405).json({
      error: "Método no permitido."
    });


  } catch (error) {

    console.error(
      "Error API categorías:",
      error
    );

    return res.status(500).json({
      error: "Error de conexión con la base de datos.",
      detalle: error.message
    });

  }
}
