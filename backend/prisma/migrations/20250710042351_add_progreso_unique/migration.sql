/*
  Warnings:

  - A unique constraint covering the columns `[usuarioId,rutinaId]` on the table `Progreso` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Progreso_usuarioId_rutinaId_key" ON "Progreso"("usuarioId", "rutinaId");
