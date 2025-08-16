const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

/* ------------------- Middlewares ------------------- */
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "JSON inválido" });
  }
  next();
});

/* ------------------- Helpers ------------------- */
const toArray = (val) => {
  if (val == null) return [];
  try { const p = JSON.parse(val); if (Array.isArray(p)) return p.filter(Boolean); } catch {}
  return String(val).split(/[,\n;]+/).map((s) => s.trim()).filter(Boolean);
};
const toJsonString = (arr) => JSON.stringify(Array.isArray(arr) ? arr : []);
const ok = (res, data = { ok: true }) => res.json(data);
const DIAS_ES = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const dayNameEs = (d) => DIAS_ES[d.getDay()];
const startEndOfToday = () => { const n=new Date(); const s=new Date(n); s.setHours(0,0,0,0); const e=new Date(n); e.setHours(23,59,59,999); return { start:s, end:e }; };

/* ------------------- Health ------------------- */
app.get("/healthz", (_req, res) => ok(res, { ok: true, ts: Date.now() }));

/* ------------------- AUTENTICACIÓN ------------------- */
app.post("/register", async (req, res) => {
  const { nombre, email, nivel, rol } = req.body || {};
  if (!nombre || !email || !nivel) return res.status(400).json({ error: "Faltan campos requeridos" });
  try {
    const usuario = await prisma.usuario.create({ data: { nombre, email, nivel, rol: rol || "alumno", suscripcion: false } });
    res.json(usuario);
  } catch { res.status(400).json({ error: "Ya existe o error al registrar." }); }
});

app.post("/login", async (req, res) => {
  const { email, rol } = req.body || {};
  if (!email || !rol) return res.status(400).json({ error: "Email y rol son requeridos" });
  try {
    const usuario = await prisma.usuario.findFirst({ where: { email, rol } });
    if (!usuario) return res.status(401).json({ error: "Usuario o rol incorrectos" });
    res.json(usuario);
  } catch { res.status(500).json({ error: "Error al buscar usuario" }); }
});

/* ------------------- USUARIOS ------------------- */
app.get("/usuarios", async (req, res) => {
  const { rol } = req.query;
  try {
    const usuarios = await prisma.usuario.findMany({ where: rol ? { rol } : {}, orderBy: { nombre: "asc" } });
    res.json(usuarios);
  } catch { res.status(500).json({ error: "Error al obtener usuarios" }); }
});

app.put("/suscripcion/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "ID inválido" });
  try {
    const actualizado = await prisma.usuario.update({ where: { id }, data: { suscripcion: true } });
    res.json(actualizado);
  } catch { res.status(500).json({ error: "No se pudo actualizar suscripción" }); }
});

/* ------------------- RUTINAS ------------------- */
app.post("/rutinas", async (req, res) => {
  const { nombre, tipo, ejercicios = [], dias = [], usuarioId } = req.body || {};
  if (!nombre || !tipo || !Number.isFinite(Number(usuarioId))) return res.status(400).json({ error: "Datos de rutina inválidos" });
  try {
    const rutina = await prisma.rutina.create({
      data: { nombre, tipo, ejercicios: toJsonString(ejercicios), dias: toJsonString(dias), usuarioId: Number(usuarioId) },
    });
    res.json(rutina);
  } catch { res.status(400).json({ error: "Error al crear rutina" }); }
});

app.put("/rutinas/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, tipo, ejercicios = [], dias = [] } = req.body || {};
  if (!Number.isFinite(id)) return res.status(400).json({ error: "ID inválido" });
  try {
    const rutina = await prisma.rutina.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(tipo && { tipo }),
        ...(ejercicios && { ejercicios: toJsonString(ejercicios) }),
        ...(dias && { dias: toJsonString(dias) }),
      },
    });
    res.json(rutina);
  } catch { res.status(500).json({ error: "Error al actualizar rutina" }); }
});

app.get("/rutinas/:usuarioId", async (req, res) => {
  const usuarioId = Number(req.params.usuarioId);
  if (!Number.isFinite(usuarioId)) return res.status(400).json({ error: "usuarioId inválido" });
  try {
    const rutinas = await prisma.rutina.findMany({ where: { usuarioId }, orderBy: { id: "asc" } });
    const result = rutinas.map((r) => ({ id: r.id, nombre: r.nombre, tipo: r.tipo, ejercicios: toArray(r.ejercicios), dias: toArray(r.dias) }));
    res.json(result);
  } catch { res.status(500).json({ error: "Error al obtener rutinas" }); }
});

app.get("/rutinas", async (_req, res) => {
  try {
    const rutinas = await prisma.rutina.findMany();
    const result = rutinas.map((r) => ({ ...r, ejercicios: toArray(r.ejercicios), dias: toArray(r.dias) }));
    res.json(result);
  } catch { res.status(500).json({ error: "Error al obtener rutinas" }); }
});

app.delete("/rutinas/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "ID inválido" });
  try { await prisma.rutina.delete({ where: { id } }); ok(res, { mensaje: "Rutina eliminada correctamente" }); }
  catch { res.status(500).json({ error: "No se pudo eliminar la rutina" }); }
});

/* ------------------- PROGRESO (rutina completa) ------------------- */
app.post("/progreso", async (req, res) => {
  const usuarioId = Number(req.body?.usuarioId);
  const rutinaId  = Number(req.body?.rutinaId);
  const completado = Boolean(req.body?.completado);
  if (![usuarioId, rutinaId].every(Number.isFinite)) return res.status(400).json({ error: "usuarioId y rutinaId son requeridos" });
  try {
    const progreso = await prisma.progreso.upsert({
      where: { usuarioId_rutinaId: { usuarioId, rutinaId } },
      update: { completado, fecha: new Date() },
      create: { usuarioId, rutinaId, completado },
    });
    res.json(progreso);
  } catch { res.status(500).json({ error: "Error al guardar progreso" }); }
});

app.get("/progreso/:usuarioId", async (req, res) => {
  const usuarioId = Number(req.params.usuarioId);
  if (!Number.isFinite(usuarioId)) return res.status(400).json({ error: "usuarioId inválido" });
  try {
    const progreso = await prisma.progreso.findMany({
      where: { usuarioId },
      select: { rutinaId: true, completado: true, fecha: true },
      orderBy: { fecha: "desc" },
    });
    res.json(progreso);
  } catch { res.status(500).json({ error: "Error al obtener progreso" }); }
});

app.get("/progreso", async (_req, res) => {
  try { const progreso = await prisma.progreso.findMany(); res.json(progreso); }
  catch { res.status(500).json({ error: "Error al obtener progreso global" }); }
});

app.delete("/progreso", async (req, res) => {
  const usuarioId = Number(req.body?.usuarioId);
  const rutinaId  = Number(req.body?.rutinaId);
  if (![usuarioId, rutinaId].every(Number.isFinite)) return res.status(400).json({ error: "usuarioId y rutinaId son requeridos" });
  try { await prisma.progreso.delete({ where: { usuarioId_rutinaId: { usuarioId, rutinaId } } }); ok(res, { mensaje: "Progreso eliminado" }); }
  catch (e) { if (e && e.code === "P2025") return ok(res, { mensaje: "Progreso no existía (ok)" }); res.status(500).json({ error: "No se pudo eliminar el progreso" }); }
});

app.delete("/progreso/:usuarioId/:rutinaId", async (req, res) => {
  const usuarioId = Number(req.params.usuarioId);
  const rutinaId  = Number(req.params.rutinaId);
  if (![usuarioId, rutinaId].every(Number.isFinite)) return res.status(400).json({ error: "Parámetros inválidos" });
  try { await prisma.progreso.delete({ where: { usuarioId_rutinaId: { usuarioId, rutinaId } } }); ok(res, { mensaje: "Progreso eliminado" }); }
  catch (e) { if (e && e.code === "P2025") return ok(res, { mensaje: "Progreso no existía (ok)" }); res.status(500).json({ error: "No se pudo eliminar el progreso" }); }
});

/* ------------------- SESIONES / SERIES ------------------- */
app.post("/sesiones", async (req, res) => {
  const usuarioId = Number(req.body?.usuarioId);
  const rutinaId  = Number(req.body?.rutinaId);
  const { notas, fatiga, dolor } = req.body || {};
  if (![usuarioId, rutinaId].every(Number.isFinite)) return res.status(400).json({ error: "usuarioId y rutinaId son requeridos" });

  const { start, end } = startEndOfToday();
  try {
    let sesion = await prisma.sesion.findFirst({ where: { usuarioId, rutinaId, fecha: { gte: start, lte: end } } });
    if (!sesion) {
      sesion = await prisma.sesion.create({ data: { usuarioId, rutinaId, notas: notas || null, fatiga, dolor } });
    } else if (fatiga != null || dolor != null || notas != null) {
      sesion = await prisma.sesion.update({ where: { id: sesion.id }, data: { notas: notas ?? sesion.notas, fatiga: fatiga ?? sesion.fatiga, dolor: dolor ?? sesion.dolor } });
    }
    res.json(sesion);
  } catch { res.status(500).json({ error: "No se pudo crear/recuperar la sesión" }); }
});

app.get("/sesiones/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "id inválido" });
  try {
    const sesion = await prisma.sesion.findUnique({ where: { id }, include: { series: { orderBy: [{ ejercicio: "asc" }, { setNumber: "asc" }] } } });
    if (!sesion) return res.status(404).json({ error: "Sesión no encontrada" });
    res.json(sesion);
  } catch { res.status(500).json({ error: "Error al obtener sesión" }); }
});

app.patch("/sesiones/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { notas, fatiga, dolor } = req.body || {};
  if (!Number.isFinite(id)) return res.status(400).json({ error: "id inválido" });
  try { const s = await prisma.sesion.update({ where: { id }, data: { notas, fatiga, dolor } }); res.json(s); }
  catch { res.status(500).json({ error: "No se pudo actualizar la sesión" }); }
});

app.get("/series", async (req, res) => {
  const sesionId = Number(req.query?.sesionId);
  const ejercicio = String(req.query?.ejercicio || "");
  if (!Number.isFinite(sesionId) || !ejercicio) return res.status(400).json({ error: "sesionId y ejercicio requeridos" });
  try {
    const series = await prisma.serie.findMany({ where: { sesionId, ejercicio }, orderBy: { setNumber: "asc" } });
    res.json(series);
  } catch { res.status(500).json({ error: "No se pudieron obtener las series" }); }
});

app.post("/series", async (req, res) => {
  const { sesionId, ejercicio, setNumber, reps, peso, rpe, completado } = req.body || {};
  if (![sesionId, setNumber].every(Number.isFinite) || !ejercicio) return res.status(400).json({ error: "sesionId, ejercicio y setNumber requeridos" });
  try {
    const serie = await prisma.serie.upsert({
      where: { sesionId_ejercicio_setNumber: { sesionId, ejercicio, setNumber } },
      update: { reps: reps ?? null, peso: peso ?? null, rpe: rpe ?? null, completado: Boolean(completado), completedAt: completado ? new Date() : null },
      create: { sesionId, ejercicio, setNumber, reps: reps ?? null, peso: peso ?? null, rpe: rpe ?? null, completado: Boolean(completado), completedAt: completado ? new Date() : null },
    });
    res.json(serie);
  } catch { res.status(500).json({ error: "No se pudo guardar la serie" }); }
});

/* ------------------- HISTORIAL / RESUMEN ------------------- */
app.get("/historial/:usuarioId/:ejercicio", async (req, res) => {
  const usuarioId = Number(req.params.usuarioId);
  const ejercicio = decodeURIComponent(req.params.ejercicio);
  if (!Number.isFinite(usuarioId) || !ejercicio) return res.status(400).json({ error: "Parámetros inválidos" });
  try {
    const sesiones = await prisma.sesion.findMany({
      where: { usuarioId },
      include: { series: { where: { ejercicio }, orderBy: { setNumber: "asc" } } },
      orderBy: { fecha: "desc" },
      take: 5,
    });
    res.json(sesiones);
  } catch { res.status(500).json({ error: "No se pudo obtener historial" }); }
});

app.get("/resumen/:usuarioId", async (req, res) => {
  const usuarioId = Number(req.params.usuarioId);
  if (!Number.isFinite(usuarioId)) return res.status(400).json({ error: "usuarioId inválido" });
  try {
    const [rutinas, progresos] = await Promise.all([
      prisma.rutina.findMany({ where: { usuarioId } }),
      prisma.progreso.findMany({ where: { usuarioId, completado: true } }),
    ]);
    const totalRutinas = rutinas.length;
    const completadas  = progresos.length;
    const adherencia   = totalRutinas ? Math.round((completadas / totalRutinas) * 100) : 0;

    const seven = new Date(); seven.setDate(seven.getDate() - 7);
    const sesiones = await prisma.sesion.findMany({ where: { usuarioId, fecha: { gte: seven } }, include: { series: true } });
    let seriesSemana = 0; let volumenSemana = 0;
    sesiones.forEach((s) => s.series.forEach((se) => { seriesSemana += 1; if (se.peso != null && se.reps != null) volumenSemana += se.peso * se.reps; }));
    res.json({ totalRutinas, completadas, adherencia, seriesSemana, volumenSemana });
  } catch { res.status(500).json({ error: "No se pudo calcular resumen" }); }
});

/* ------------------- CALENDARIO / RACHAS / INSIGNIAS ------------------- */
app.get("/calendar/:usuarioId", async (req, res) => {
  const usuarioId = Number(req.params.usuarioId);
  const year  = Number(req.query.year)  || new Date().getFullYear();
  const month = Number(req.query.month) || (new Date().getMonth() + 1); // 1-12
  if (!Number.isFinite(usuarioId)) return res.status(400).json({ error: "usuarioId inválido" });

  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end   = new Date(year, month, 0, 23, 59, 59, 999); // último día del mes

  try {
    const [rutinas, sesiones] = await Promise.all([
      prisma.rutina.findMany({ where: { usuarioId } }),
      prisma.sesion.findMany({ where: { usuarioId, fecha: { gte: start, lte: end } } }),
    ]);

    const sessionsByDay = new Map(); // YYYY-MM-DD -> count
    sesiones.forEach((s) => {
      const d = new Date(s.fecha);
      const key = d.toISOString().slice(0,10);
      sessionsByDay.set(key, (sessionsByDay.get(key) || 0) + 1);
    });

    const diasProgramados = new Set(); // nombres "Lunes", etc, si hay al menos una rutina ese día
    rutinas.forEach((r) => toArray(r.dias).forEach((d) => diasProgramados.add(d)));

    const days = [];
    for (let day = 1; day <= end.getDate(); day++) {
      const dt = new Date(year, month - 1, day);
      const key = dt.toISOString().slice(0,10);
      const name = dayNameEs(dt);
      const plannedCount = rutinas.filter((r) => toArray(r.dias).includes(name)).length;
      const sessionsCount = sessionsByDay.get(key) || 0;
      days.push({
        date: key,
        weekday: name,
        plannedCount,
        sessionsCount,
        scheduled: plannedCount > 0,
        done: sessionsCount > 0,
      });
    }
    res.json({ year, month, days });
  } catch (e) {
    res.status(500).json({ error: "No se pudo construir el calendario" });
  }
});

app.get("/streaks/:usuarioId", async (req, res) => {
  const usuarioId = Number(req.params.usuarioId);
  if (!Number.isFinite(usuarioId)) return res.status(400).json({ error: "usuarioId inválido" });
  try {
    const since = new Date(); since.setDate(since.getDate() - 180);
    const sesiones = await prisma.sesion.findMany({ where: { usuarioId, fecha: { gte: since } }, orderBy: { fecha: "asc" }});

    // set de fechas únicas
    const days = [...new Set(sesiones.map(s => new Date(s.fecha).toISOString().slice(0,10)))].sort();
    const todayKey = new Date().toISOString().slice(0,10);

    // longest streak
    let longest = 0, current = 0, prev = null;
    for (const key of days) {
      if (!prev) { current = 1; longest = Math.max(longest, current); prev = key; continue; }
      const p = new Date(prev); p.setDate(p.getDate()+1);
      const expected = p.toISOString().slice(0,10);
      if (key === expected) current += 1; else current = 1;
      longest = Math.max(longest, current);
      prev = key;
    }

    // current streak (hasta hoy o hasta ayer)
    let currentStreak = 0;
    // si hoy no hubo, permitir racha hasta ayer
    const ref = days.includes(todayKey) ? new Date(todayKey) : (() => { const d=new Date(todayKey); d.setDate(d.getDate()-1); return d; })();
    const refKey = ref.toISOString().slice(0,10);
    // recorrer hacia atrás
    let k = refKey;
    while (days.includes(k)) {
      currentStreak++;
      const d = new Date(k); d.setDate(d.getDate()-1);
      k = d.toISOString().slice(0,10);
    }

    res.json({ currentStreak, longestStreak: longest, activeDays: days.length });
  } catch { res.status(500).json({ error: "No se pudo calcular rachas" }); }
});

app.get("/badges/:usuarioId", async (req, res) => {
  const usuarioId = Number(req.params.usuarioId);
  if (!Number.isFinite(usuarioId)) return res.status(400).json({ error: "usuarioId inválido" });

  const now = new Date();
  const monday = new Date(now);
  const day = monday.getDay(); // 0=Dom
  const diffToMon = (day + 6) % 7; // de Lunes
  monday.setDate(monday.getDate() - diffToMon);
  monday.setHours(0,0,0,0);

  try {
    const weekSessions = await prisma.sesion.count({ where: { usuarioId, fecha: { gte: monday } } });
    const streaks = await (await fetchLocal(`/streaks/${usuarioId}`))(); // helper interno
    const badges = [];

    if (weekSessions >= 1) badges.push({ code: "start", label: "Arranque" });
    if (weekSessions >= 3) badges.push({ code: "consistency3", label: "Constancia 3/sem" });
    if (weekSessions >= 5) badges.push({ code: "consistency5", label: "Constancia 5/sem" });
    if (streaks.currentStreak >= 7)  badges.push({ code: "streak7", label: "Racha 7" });
    if (streaks.currentStreak >= 14) badges.push({ code: "streak14", label: "Racha 14" });
    if (streaks.currentStreak >= 30) badges.push({ code: "streak30", label: "Racha 30" });

    res.json({ weekSessions, badges, streaks });
  } catch { res.status(500).json({ error: "No se pudieron calcular insignias" }); }

  // mini-helper: llama al propio endpoint local sin romper CORS
  function fetchLocal(path) {
    return async () => {
      // consulta directa a prisma para no hacer HTTP recursivo
      const since = new Date(); since.setDate(since.getDate() - 180);
      const sesiones = await prisma.sesion.findMany({ where: { usuarioId, fecha: { gte: since } }, orderBy: { fecha: "asc" }});
      const days = [...new Set(sesiones.map(s => new Date(s.fecha).toISOString().slice(0,10)))].sort();
      let longest = 0, current = 0, prev = null;
      for (const key of days) {
        if (!prev) { current = 1; longest = Math.max(longest, current); prev = key; continue; }
        const p = new Date(prev); p.setDate(p.getDate()+1);
        const expected = p.toISOString().slice(0,10);
        if (key === expected) current += 1; else current = 1;
        longest = Math.max(longest, current);
        prev = key;
      }
      const todayKey = new Date().toISOString().slice(0,10);
      const ref = days.includes(todayKey) ? new Date(todayKey) : (() => { const d=new Date(todayKey); d.setDate(d.getDate()-1); return d; })();
      const refKey = ref.toISOString().slice(0,10);
      let currentStreak = 0, k = refKey;
      while (days.includes(k)) {
        currentStreak++;
        const d = new Date(k); d.setDate(d.getDate()-1);
        k = d.toISOString().slice(0,10);
      }
      return { currentStreak, longestStreak: longest, activeDays: days.length };
    };
  }
});

/* ------------------- Inicio ------------------- */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Backend en http://0.0.0.0:${PORT}`));

process.on("SIGINT", async () => { await prisma.$disconnect(); process.exit(0); });
