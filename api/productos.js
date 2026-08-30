
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL);

export default async function handler(req, res) {
    try {
        // Obtener productos
        if (req.method === "GET") {
            const productos = await sql`
                SELECT id, nombre, precio, activo
                FROM productos
                ORDER BY id
            `;

            return res.status(200).json(productos);
        }

        // Guardar productos
        if (req.method === "POST") {
            const productos = req.body;

            if (!Array.isArray(productos)) {
                return res.status(400).json({
                    error: "Formato de productos inválido"
                });
            }

            for (const producto of productos) {
                await sql`
                    INSERT INTO productos (id, nombre, precio, activo)
                    VALUES (
                        ${producto.id},
                        ${producto.nombre},
                        ${Number(producto.precio)},
                        ${Boolean(producto.activo)}
                    )
                    ON CONFLICT (id)
                    DO UPDATE SET
                        nombre = EXCLUDED.nombre,
                        precio = EXCLUDED.precio,
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
            error: "Error de conexión con la base de datos"
        });
    }
}
