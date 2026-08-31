import { put } from "@vercel/blob";

export default async function handler(req, res) {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({
                error: "Método no permitido"
            });
        }

        const form = await req.formData();

        const file = form.get("file");

        if (!file || typeof file.arrayBuffer !== "function") {
            return res.status(400).json({
                error: "No se recibió ningún archivo"
            });
        }

        if (!file.type.startsWith("image/")) {
            return res.status(400).json({
                error: "El archivo seleccionado no es una imagen"
            });
        }

        if (file.size > 5 * 1024 * 1024) {
            return res.status(400).json({
                error: "La imagen supera los 5 MB"
            });
        }

        const extension =
            file.name && file.name.includes(".")
                ? file.name.substring(file.name.lastIndexOf("."))
                : ".jpg";

        const nombre =
            `productos/${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 10)}${extension}`;

        const blob = await put(
            nombre,
            file,
            {
                access: "public",
                contentType: file.type
            }
        );

        return res.status(200).json({
            ok: true,
            url: blob.url,
            pathname: blob.pathname,
            contentType: blob.contentType
        });

    } catch (error) {
        console.error("ERROR UPLOAD:", error);

        return res.status(500).json({
            error: "Error al subir la imagen",
            detalle: error.message
        });
    }
}
