-- CreateTable
CREATE TABLE "Sesion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER NOT NULL,
    "rutinaId" INTEGER NOT NULL,
    "notas" TEXT,
    "fatiga" INTEGER,
    "dolor" INTEGER,
    CONSTRAINT "Sesion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sesion_rutinaId_fkey" FOREIGN KEY ("rutinaId") REFERENCES "Rutina" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Serie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sesionId" INTEGER NOT NULL,
    "ejercicio" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "reps" INTEGER,
    "peso" REAL,
    "rpe" REAL,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    CONSTRAINT "Serie_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "Sesion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Sesion_usuarioId_rutinaId_fecha_idx" ON "Sesion"("usuarioId", "rutinaId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Serie_sesionId_ejercicio_setNumber_key" ON "Serie"("sesionId", "ejercicio", "setNumber");
