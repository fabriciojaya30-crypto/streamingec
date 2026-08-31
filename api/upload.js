import { put } from "@vercel/blob";

export default async function handler(req, res) {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({
                error: "Método no permitido"
            });
        }

        const contentType =
            req.headers["content-type"] || "";

        if (!contentType.includes("multipart/form-data")) {
            return res.status(400).json({
                error: "La solicitud debe ser multipart/form-data"
            });
        }

        const chunks = [];

        for await (const chunk of req) {
            chunks.push(chunk);
        }

        const body = Buffer.concat(chunks);

        const boundaryMatch =
            contentType.match(
                /boundary=(?:"([^"]+)"|([^;]+))/
            );

        if (!boundaryMatch) {
            return res.status(400).json({
                error: "No se encontró el boundary del formulario"
            });
        }

        const boundary =
            boundaryMatch[1] ||
            boundaryMatch[2];

        const parts =
            body
                .toString("binary")
                .split(`--${boundary}`);

        let fileBuffer = null;
        let fileName = "imagen.jpg";
        let mimeType = "image/jpeg";

        for (const part of parts) {

            if (
                !part.includes(
                    "Content-Disposition"
                )
            ) {
                continue;
            }

            const nameMatch =
                part.match(
                    /filename="([^"]*)"/
                );

            if (!nameMatch) {
                continue;
            }

            fileName =
                nameMatch[1] ||
                "imagen.jpg";

            const typeMatch =
                part.match(
                    /Content-Type:\s*([^\r\n]+)/i
                );

            if (typeMatch) {
                mimeType =
                    typeMatch[1].trim();
            }

            const separator =
                "\r\n\r\n";

            const index =
                part.indexOf(
                    separator
                );

            if (index === -1) {
                continue;
            }

            let data =
                part.slice(
                    index + separator.length
                );

            data =
                data.replace(
                    /\r\n--$/,
                    ""
                );

            fileBuffer =
                Buffer.from(
                    data,
                    "binary"
                );

            break;
        }

        if (
            !fileBuffer ||
            fileBuffer.length === 0
        ) {
            return res.status(400).json({
                error:
                    "No se recibió ninguna imagen"
            });
        }

        const extension =
            fileName.includes(".")
            ? fileName.substring(
                fileName.lastIndexOf(".")
            )
            : ".jpg";

        const uniqueName =
            `productos/${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 10)}${extension}`;

        const blob =
            await put(
                uniqueName,
                fileBuffer,
                {
                    access: "public",
                    contentType: mimeType
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
