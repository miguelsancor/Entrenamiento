const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// ✅ Registro de usuario
app.post("/register", async (req, res) => {
  const { nombre, email, nivel, rol } = req.body;

  try {
    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        nivel,
        rol: rol || "alumno",
        suscripcion: false,
      },
    });
    res.json(usuario);
  } catch (err) {
    res.status(400).json({ error: "Ya existe o error al registrar." });
  }
});

// ✅ Login por email y rol
app.post("/login", async (req, res) => {
  const { email, rol } = req.body;

  if (!email || !rol) {
    return res.status(400).json({ error: "Email y rol son requeridos" });
  }

  try {
    const usuario = await prisma.usuario.findFirst({
      where: { email, rol },
    });

    if (!usuario) {
      return res.status(401).json({ error: "Usuario o rol incorrectos" });
    }

    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: "Error al buscar usuario" });
  }
});

// ✅ Obtener usuarios por rol (opcional)
app.get("/usuarios", async (req, res) => {
  const { rol } = req.query;
  const where = rol ? { rol } : {};

  try {
    const usuarios = await prisma.usuario.findMany({
      where,
      orderBy: { nombre: "asc" },
    });
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// ✅ Asignar rutina a usuario
app.post("/rutinas", async (req, res) => {
  const { nombre, tipo, ejercicios, usuarioId } = req.body;

  try {
    const rutina = await prisma.rutina.create({
      data: {
        nombre,
        tipo,
        ejercicios: JSON.stringify(ejercicios),
        usuarioId,
      },
    });
    res.json(rutina);
  } catch (err) {
    res.status(400).json({ error: "Error al crear rutina" });
  }
});

// ✅ Obtener rutina(s) de un usuario
app.get("/rutinas/:usuarioId", async (req, res) => {
  const { usuarioId } = req.params;

  try {
    const rutinas = await prisma.rutina.findMany({
      where: { usuarioId: parseInt(usuarioId) },
    });

    // Convertir ejercicios de string a objeto
    const result = rutinas.map((r) => ({
      ...r,
      ejercicios: JSON.parse(r.ejercicios),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener rutinas" });
  }
});

// ✅ Activar suscripción (simulada)
app.put("/suscripcion/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const actualizado = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: { suscripcion: true },
    });
    res.json(actualizado);
  } catch (err) {
    res.status(500).json({ error: "No se pudo actualizar suscripción" });
  }
});

// ✅ Inicio del servidor
app.listen(4000, () => {
  console.log(" Backend corriendo en http://localhost:4000");
});
