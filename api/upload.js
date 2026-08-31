import { put } from "@vercel/blob";

export const config = {
    api: {
        bodyParser: false
    }
};

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Método no permitido"
        });
    }

    try {

        const contentType =
            req.headers["content-type"] || "";

        if (!contentType.includes("multipart/form-data")) {
            return res.status(400).json({
                error: "La solicitud debe ser multipart/form-data"
            });
        }

        const boundaryMatch =
            contentType.match(
                /boundary=(?:"([^"]+)"|([^;]+))/
            );

        if (!boundaryMatch) {
            return res.status(400).json({
                error: "No se encontró el boundary"
            });
        }

        const boundary =
            boundaryMatch[1] ||
            boundaryMatch[2];

        const chunks = [];

        for await (const chunk of req) {
            chunks.push(chunk);
        }

        const body = Buffer.concat(chunks);

        const separator =
            Buffer.from(
                `--${boundary}`
            );

        const partes = [];

        let inicio = 0;

        while (true) {

            const posicion =
                body.indexOf(
                    separator,
                    inicio
                );

            if (posicion === -1) {
                break;
            }

            partes.push(
                body.slice(
                    inicio,
                    posicion
                )
            );

            inicio =
                posicion +
                separator.length;
        }

        let archivo = null;
        let nombreArchivo = "imagen.jpg";
        let tipoArchivo = "image/jpeg";

        for (const parte of partes) {

            const texto =
                parte.toString(
                    "latin1"
                );

            if (
                !texto.includes(
                    "Content-Disposition"
                )
            ) {
                continue;
            }

            const nombreMatch =
                texto.match(
                    /filename="([^"]*)"/
                );

            if (!nombreMatch) {
                continue;
            }

            nombreArchivo =
                nombreMatch[1] ||
                "imagen.jpg";

            const tipoMatch =
                texto.match(
                    /Content-Type:\s*([^\r\n]+)/i
                );

            if (tipoMatch) {
                tipoArchivo =
                    tipoMatch[1].trim();
            }

            const encabezadoFin =
                Buffer.from(
                    "\r\n\r\n"
                );

            const inicioDatos =
                parte.indexOf(
                    encabezadoFin
                );

            if (inicioDatos === -1) {
                continue;
            }

            let datos =
                parte.slice(
                    inicioDatos +
                    encabezadoFin.length
                );

            if (
                datos
                    .subarray(
                        datos.length - 2
                    )
                    .equals(
                        Buffer.from("\r\n")
                    )
            ) {
                datos =
                    datos.subarray(
                        0,
                        datos.length - 2
                    );
            }

            archivo = datos;

            break;
        }

        if (
            !archivo ||
            archivo.length === 0
        ) {
            return res.status(400).json({
                error:
                    "No se recibió ninguna imagen"
            });
        }

        if (
            !tipoArchivo.startsWith(
                "image/"
            )
        ) {
            return res.status(400).json({
                error:
                    "El archivo enviado no es una imagen"
            });
        }

        if (
            archivo.length >
            5 * 1024 * 1024
        ) {
            return res.status(400).json({
                error:
                    "La imagen supera los 5 MB"
            });
        }

        const extension =
            nombreArchivo.includes(".")
                ? nombreArchivo.substring(
                    nombreArchivo.lastIndexOf(".")
                )
                : ".jpg";

        const nombreUnico =
            `productos/${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 10)}${extension}`;

        const blob =
            await put(
                nombreUnico,
                archivo,
                {
                    access: "public",
                    contentType: tipoArchivo
                }
            );

        return res.status(200).json({
            ok: true,
            url: blob.url,
            pathname: blob.pathname
        });

    } catch (error) {

        console.error(
            "ERROR UPLOAD:",
            error
        );

        return res.status(500).json({
            error:
                "Error al subir la imagen",
            detalle:
                error.message
        });
    }
}
