export function requireAdmin(req, res) {
  const configuredKey = process.env.ADMIN_API_KEY;
  const suppliedKey = req.headers["x-admin-key"];

  if (!configuredKey) {
    res.status(503).json({
      error: "Falta configurar ADMIN_API_KEY en Vercel."
    });
    return false;
  }

  if (typeof suppliedKey !== "string" || suppliedKey !== configuredKey) {
    res.status(401).json({
      error: "No autorizado. Ingresa la clave de administración."
    });
    return false;
  }

  return true;
}
