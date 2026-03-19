-- Fix schema drift: add missing columns and tables

-- Add updatedAt to MembroEquipe (existing rows get current timestamp)
ALTER TABLE "MembroEquipe" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add updatedAt to Midia (existing rows get current timestamp)
ALTER TABLE "Midia" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create DashboardConfig table
CREATE TABLE IF NOT EXISTS "DashboardConfig" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "widgets" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DashboardConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DashboardConfig_usuarioId_key" ON "DashboardConfig"("usuarioId");

ALTER TABLE "DashboardConfig" ADD CONSTRAINT "DashboardConfig_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DashboardConfig" ADD CONSTRAINT "DashboardConfig_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create MensagemAssistente table
CREATE TABLE IF NOT EXISTS "MensagemAssistente" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MensagemAssistente_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MensagemAssistente_usuarioId_createdAt_idx" ON "MensagemAssistente"("usuarioId", "createdAt");

ALTER TABLE "MensagemAssistente" ADD CONSTRAINT "MensagemAssistente_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MensagemAssistente" ADD CONSTRAINT "MensagemAssistente_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
