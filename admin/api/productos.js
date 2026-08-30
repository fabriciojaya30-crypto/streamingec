export default function handler(req, res) {
  const productos = [
    {
      id: "netflix",
      nombre: "Netflix",
      precio: 0,
      activo: true
    },
    {
      id: "spotify",
      nombre: "Spotify",
      precio: 0,
      activo: true
    },
    {
      id: "youtube",
      nombre: "YouTube Premium",
      precio: 0,
      activo: true
    },
    {
      id: "canva",
      nombre: "Canva Pro",
      precio: 0,
      activo: true
    },
    {
      id: "chatgpt",
      nombre: "ChatGPT",
      precio: 0,
      activo: true
    },
    {
      id: "gemini",
      nombre: "Gemini",
      precio: 0,
      activo: true
    },
    {
      id: "office",
      nombre: "Microsoft Office",
      precio: 0,
      activo: true
    }
  ];

  res.status(200).json(productos);
}
