/*
  Warnings:

  - Added the required column `dias` to the `Rutina` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Rutina" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ejercicios" TEXT NOT NULL,
    "dias" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    CONSTRAINT "Rutina_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Rutina" ("ejercicios", "id", "nombre", "tipo", "usuarioId") SELECT "ejercicios", "id", "nombre", "tipo", "usuarioId" FROM "Rutina";
DROP TABLE "Rutina";
ALTER TABLE "new_Rutina" RENAME TO "Rutina";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
