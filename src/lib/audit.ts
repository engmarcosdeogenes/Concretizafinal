import "server-only"
import { db } from "@/server/db"

type AuditCtx = {
  session: { userId: string; empresaId: string; nome: string }
}

export async function logAudit(
  ctx: AuditCtx,
  params: {
    entityType: string
    entityId:   string
    obraId?:    string
    acao:       string
    detalhes?:  string
  },
) {
  await db.auditLog.create({
    data: {
      empresaId:   ctx.session.empresaId,
      obraId:      params.obraId ?? null,
      entityType:  params.entityType,
      entityId:    params.entityId,
      acao:        params.acao,
      usuarioId:   ctx.session.userId,
      usuarioNome: ctx.session.nome,
      detalhes:    params.detalhes ?? null,
    },
  })
}
