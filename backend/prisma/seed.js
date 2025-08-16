// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const toJson = (a) => JSON.stringify(a);

const DIAS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const YT = {
  sentadilla: "https://www.youtube.com/watch?v=1xMaFs0L3ao",
  pressBanca: "https://www.youtube.com/watch?v=rT7DgCr-3pg",
  remoBarra: "https://www.youtube.com/watch?v=GZbfZ033f74",
  pesoMuerto: "https://www.youtube.com/watch?v=op9kVnSso6Q",
  dominadas:  "https://www.youtube.com/watch?v=eGo4IYlbE5g",
  zancadas:   "https://www.youtube.com/watch?v=QOVaHwm-Q6U",
};

async function main() {
  // Usuarios
  const coach = await prisma.usuario.upsert({
    where: { email: "coach@example.com" },
    update: {},
    create: {
      nombre: "Coach",
      email: "coach@example.com",
      nivel: "avanzado",
      rol: "instructor",
      suscripcion: true,
    },
  });

  const alumno = await prisma.usuario.upsert({
    where: { email: "alumno@example.com" },
    update: {},
    create: {
      nombre: "Alumno Demo",
      email: "alumno@example.com",
      nivel: "intermedio",
      rol: "alumno",
      suscripcion: true,
    },
  });

  // Rutinas para el alumno (Lun/Mié/Vie)
  const rLunes = await prisma.rutina.create({
    data: {
      nombre: "Fuerza tren inferior",
      tipo: "Piernas",
      ejercicios: toJson([YT.sentadilla, YT.pesoMuerto, YT.zancadas]),
      dias: toJson(["Lunes"]),
      usuarioId: alumno.id,
    },
  });

  const rMiercoles = await prisma.rutina.create({
    data: {
      nombre: "Pecho y espalda",
      tipo: "Empuje/Jale",
      ejercicios: toJson([YT.pressBanca, YT.remoBarra, YT.dominadas]),
      dias: toJson(["Miércoles"]),
      usuarioId: alumno.id,
    },
  });

  const rViernes = await prisma.rutina.create({
    data: {
      nombre: "Full body ligero",
      tipo: "Mixto",
      ejercicios: toJson([YT.sentadilla, YT.pressBanca, YT.remoBarra]),
      dias: toJson(["Viernes"]),
      usuarioId: alumno.id,
    },
  });

  // Marcar progreso de Miércoles ya hecho
  await prisma.progreso.upsert({
    where: { usuarioId_rutinaId: { usuarioId: alumno.id, rutinaId: rMiercoles.id } },
    create: { usuarioId: alumno.id, rutinaId: rMiercoles.id, completado: true },
    update: { completado: true, fecha: new Date() },
  });

  // Crear sesiones/series en los últimos 10 días para simular historial/racha
  const hoy = new Date();
  const daysBack = 10;
  const rutinas = [rLunes, rMiercoles, rViernes];

  for (let d = daysBack; d >= 0; d--) {
    const date = new Date(hoy);
    date.setDate(hoy.getDate() - d);
    // Si ese día de la semana coincide con alguna rutina, crear sesión
    const nameEs = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][date.getDay()];
    const r = rutinas.find((rr) => JSON.parse(rr.dias).includes(nameEs));
    if (!r) continue;

    const sesion = await prisma.sesion.create({
      data: {
        usuarioId: alumno.id,
        rutinaId: r.id,
        fecha: date,
        fatiga: Math.floor(Math.random() * 4) + 3, // 3-6
        dolor: Math.floor(Math.random() * 3),      // 0-2
      },
    });

    const ejercicios = JSON.parse(r.ejercicios);
    for (const ej of ejercicios) {
      for (let setNumber = 1; setNumber <= 3; setNumber++) {
        const reps = 6 + Math.floor(Math.random() * 5); // 6-10
        const peso = 20 + Math.floor(Math.random() * 40); // 20-60
        const rpe = 6 + Math.random() * 2; // 6-8
        await prisma.serie.create({
          data: {
            sesionId: sesion.id,
            ejercicio: ej,
            setNumber,
            reps,
            peso,
            rpe,
            completado: true,
            completedAt: date,
          },
        });
      }
    }
  }

  console.log("✅ Seed completado:");
  console.log(` Instructor: ${coach.email}`);
  console.log(` Alumno:     ${alumno.email} (id=${alumno.id})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
