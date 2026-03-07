CREATE TABLE "Convite" (
  "id"        TEXT NOT NULL,
  "empresaId" TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "role"      "RoleEmpresa" NOT NULL DEFAULT 'ENGENHEIRO',
  "token"     TEXT NOT NULL,
  "usado"     BOOLEAN NOT NULL DEFAULT false,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Convite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Convite_token_key" ON "Convite"("token");
CREATE INDEX "Convite_token_idx" ON "Convite"("token");
ALTER TABLE "Convite" ADD CONSTRAINT "Convite_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
