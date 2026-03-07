ALTER TABLE "Usuario" ADD COLUMN "authId" TEXT;
CREATE UNIQUE INDEX "Usuario_authId_key" ON "Usuario"("authId");
