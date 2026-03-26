-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Family" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "loanInterest" REAL NOT NULL DEFAULT 1,
    "investLongInterest" REAL NOT NULL DEFAULT 2,
    "investShortInterest" REAL NOT NULL DEFAULT 1
);
INSERT INTO "new_Family" ("id", "investLongInterest", "investShortInterest", "loanInterest", "name") SELECT "id", "investLongInterest", "investShortInterest", "loanInterest", "name" FROM "Family";
DROP TABLE "Family";
ALTER TABLE "new_Family" RENAME TO "Family";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
