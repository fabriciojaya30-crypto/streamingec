import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL);

export default async function handler(req, res) {
    try {
        // =========================
        // OBTENER PRODUCTOS
        // =========================
        if (req.method === "GET") {
            const productos = await sql`
                SELECT
                    id,
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

        // =========================
        // GUARDAR PRODUCTOS
        // =========================
        if (req.method === "POST") {
            const productos = req.body;

            if (!Array.isArray(productos)) {
                return res.status(400).json({
                    error: "Formato de productos inválido"
                });
            }

            for (const producto of productos) {
                await sql`
                    INSERT INTO productos (
                        id,
                        nombre,
                        precio,
                        categoria,
                        imagen,
                        descripcion,
                        detalles,
                        solicitud,
                        activo
                    )
                    VALUES (
                        ${producto.id},
                        ${producto.nombre || ""},
                        ${Number(producto.precio) || 0},
                        ${producto.categoria || ""},
                        ${producto.imagen || ""},
                        ${producto.descripcion || ""},
                        ${producto.detalles || ""},
                        ${producto.solicitud || ""},
                        ${Boolean(producto.activo)}
                    )
                    ON CONFLICT (id)
                    DO UPDATE SET
                        nombre = EXCLUDED.nombre,
                        precio = EXCLUDED.precio,
                        categoria = EXCLUDED.categoria,
                        imagen = EXCLUDED.imagen,
                        descripcion = EXCLUDED.descripcion,
                        detalles = EXCLUDED.detalles,
                        solicitud = EXCLUDED.solicitud,
                        activo = EXCLUDED.activo
                `;
            }

            return res.status(200).json({
                ok: true,
                mensaje: "Productos guardados correctamente"
            });
        }

        return res.status(405).json({
            error: "Método no permitido"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Error de conexión con la base de datos",
            detalle: error.message
        });
    }
}
