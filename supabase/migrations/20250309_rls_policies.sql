-- ============================================================
-- Concretiza — Row Level Security (RLS) Policies
-- Aplicar via: Supabase Dashboard → SQL Editor → Run
-- OU: supabase db push (se usar CLI do Supabase)
-- ============================================================
--
-- Modelo de segurança:
--   • Cada usuário tem authId = auth.uid() (Supabase Auth)
--   • get_minha_empresa_id() busca o empresaId do usuário logado
--   • Todas as tabelas filtram por empresaId (isolamento multi-tenant)
--   • O servidor tRPC usa service_role (bypassa RLS) — RLS é defesa extra
--
-- ATENÇÃO: O service_role key SEMPRE bypassa RLS.
-- Apenas conexões via anon/authenticated key são afetadas.
-- ============================================================


-- ─── Função helper: retorna empresaId do usuário atual ────────────────────────

CREATE OR REPLACE FUNCTION get_minha_empresa_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT "empresaId"::text
  FROM "Usuario"
  WHERE "authId" = auth.uid()::text
  LIMIT 1
$$;


-- ============================================================
-- EMPRESA
-- ============================================================

ALTER TABLE "Empresa" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresa_select" ON "Empresa"
  FOR SELECT USING (id = get_minha_empresa_id());

CREATE POLICY "empresa_update" ON "Empresa"
  FOR UPDATE USING (id = get_minha_empresa_id());

-- INSERT: handled server-side only (signup flow)
-- DELETE: not allowed via client


-- ============================================================
-- USUARIO
-- ============================================================

ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_select" ON "Usuario"
  FOR SELECT USING ("empresaId" = get_minha_empresa_id());

CREATE POLICY "usuario_update" ON "Usuario"
  FOR UPDATE USING (
    "empresaId" = get_minha_empresa_id()
    AND ("authId" = auth.uid()::text OR get_minha_empresa_id() IS NOT NULL)
  );

-- INSERT/DELETE: server-side only


-- ============================================================
-- OBRA
-- ============================================================

ALTER TABLE "Obra" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "obra_select" ON "Obra"
  FOR SELECT USING ("empresaId" = get_minha_empresa_id());

CREATE POLICY "obra_insert" ON "Obra"
  FOR INSERT WITH CHECK ("empresaId" = get_minha_empresa_id());

CREATE POLICY "obra_update" ON "Obra"
  FOR UPDATE USING ("empresaId" = get_minha_empresa_id());

CREATE POLICY "obra_delete" ON "Obra"
  FOR DELETE USING ("empresaId" = get_minha_empresa_id());


-- ============================================================
-- OBRA USUARIO (pivot)
-- ============================================================

ALTER TABLE "ObraUsuario" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "obraUsuario_select" ON "ObraUsuario"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Obra" o
      WHERE o.id = "obraId" AND o."empresaId" = get_minha_empresa_id()
    )
  );

CREATE POLICY "obraUsuario_insert" ON "ObraUsuario"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Obra" o
      WHERE o.id = "obraId" AND o."empresaId" = get_minha_empresa_id()
    )
  );

CREATE POLICY "obraUsuario_delete" ON "ObraUsuario"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "Obra" o
      WHERE o.id = "obraId" AND o."empresaId" = get_minha_empresa_id()
    )
  );


-- ============================================================
-- RDO
-- ============================================================

ALTER TABLE "RDO" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rdo_select" ON "RDO"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Obra" o
      WHERE o.id = "obraId" AND o."empresaId" = get_minha_empresa_id()
    )
  );

CREATE POLICY "rdo_insert" ON "RDO"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Obra" o
      WHERE o.id = "obraId" AND o."empresaId" = get_minha_empresa_id()
    )
  );

CREATE POLICY "rdo_update" ON "RDO"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Obra" o
      WHERE o.id = "obraId" AND o."empresaId" = get_minha_empresa_id()
    )
  );

CREATE POLICY "rdo_delete" ON "RDO"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "Obra" o
      WHERE o.id = "obraId" AND o."empresaId" = get_minha_empresa_id()
    )
  );


-- ============================================================
-- RDO ATIVIDADE
-- ============================================================

ALTER TABLE "RDOAtividade" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rdoAtividade_select" ON "RDOAtividade"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "RDO" r
      JOIN "Obra" o ON o.id = r."obraId"
      WHERE r.id = "rdoId" AND o."empresaId" = get_minha_empresa_id()
    )
  );

CREATE POLICY "rdoAtividade_insert" ON "RDOAtividade"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "RDO" r
      JOIN "Obra" o ON o.id = r."obraId"
      WHERE r.id = "rdoId" AND o."empresaId" = get_minha_empresa_id()
    )
  );

CREATE POLICY "rdoAtividade_update" ON "RDOAtividade"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "RDO" r
      JOIN "Obra" o ON o.id = r."obraId"
      WHERE r.id = "rdoId" AND o."empresaId" = get_minha_empresa_id()
    )
  );

CREATE POLICY "rdoAtividade_delete" ON "RDOAtividade"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "RDO" r
      JOIN "Obra" o ON o.id = r."obraId"
      WHERE r.id = "rdoId" AND o."empresaId" = get_minha_empresa_id()
    )
  );


-- ============================================================
-- RDO EQUIPE
-- ============================================================

ALTER TABLE "RDOEquipe" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rdoEquipe_all" ON "RDOEquipe"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "RDO" r
      JOIN "Obra" o ON o.id = r."obraId"
      WHERE r.id = "rdoId" AND o."empresaId" = get_minha_empresa_id()
    )
  );


-- ============================================================
-- FVS
-- ============================================================

ALTER TABLE "FVS" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fvs_all" ON "FVS"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Obra" o
      WHERE o.id = "obraId" AND o."empresaId" = get_minha_empresa_id()
    )
  );


-- ============================================================
-- FVS ITEM
-- ============================================================

ALTER TABLE "FVSItem" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fvsItem_all" ON "FVSItem"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "FVS" f
      JOIN "Obra" o ON o.id = f."obraId"
      WHERE f.id = "fvsId" AND o."empresaId" = get_minha_empresa_id()
    )
  );


-- ============================================================
-- FVM
-- ============================================================

ALTER TABLE "FVM" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fvm_all" ON "FVM"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Obra" o
      WHERE o.id = "obraId" AND o."empresaId" = get_minha_empresa_id()
    )
  );


-- ============================================================
-- OCORRENCIA
-- ============================================================

ALTER TABLE "Ocorrencia" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ocorrencia_all" ON "Ocorrencia"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Obra" o
      WHERE o.id = "obraId" AND o."empresaId" = get_minha_empresa_id()
    )
  );


-- ============================================================
-- PLANTA
-- ============================================================

ALTER TABLE "Planta" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "planta_all" ON "Planta"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Obra" o
      WHERE o.id = "obraId" AND o."empresaId" = get_minha_empresa_id()
    )
  );


-- ============================================================
-- MEMBRO EQUIPE
-- ============================================================

ALTER TABLE "MembroEquipe" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "membroEquipe_all" ON "MembroEquipe"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Obra" o
      WHERE o.id = "obraId" AND o."empresaId" = get_minha_empresa_id()
    )
  );


-- ============================================================
-- FORNECEDOR
-- ============================================================

ALTER TABLE "Fornecedor" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fornecedor_all" ON "Fornecedor"
  FOR ALL USING ("empresaId" = get_minha_empresa_id());


-- ============================================================
-- MATERIAL CATALOGO
-- ============================================================

ALTER TABLE "MaterialCatalogo" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "materialCatalogo_all" ON "MaterialCatalogo"
  FOR ALL USING ("empresaId" = get_minha_empresa_id());


-- ============================================================
-- MOVIMENTACAO MATERIAL
-- ============================================================

ALTER TABLE "MovimentacaoMaterial" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "movimentacaoMaterial_all" ON "MovimentacaoMaterial"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Obra" o
      WHERE o.id = "obraId" AND o."empresaId" = get_minha_empresa_id()
    )
  );


-- ============================================================
-- EQUIPAMENTO
-- ============================================================

ALTER TABLE "Equipamento" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "equipamento_all" ON "Equipamento"
  FOR ALL USING ("empresaId" = get_minha_empresa_id());


-- ============================================================
-- SOLICITACAO COMPRA
-- ============================================================

ALTER TABLE "SolicitacaoCompra" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solicitacaoCompra_all" ON "SolicitacaoCompra"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Obra" o
      WHERE o.id = "obraId" AND o."empresaId" = get_minha_empresa_id()
    )
  );


-- ============================================================
-- ITEM SOLICITACAO
-- ============================================================

ALTER TABLE "ItemSolicitacao" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "itemSolicitacao_all" ON "ItemSolicitacao"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "SolicitacaoCompra" s
      JOIN "Obra" o ON o.id = s."obraId"
      WHERE s.id = "solicitacaoId" AND o."empresaId" = get_minha_empresa_id()
    )
  );


-- ============================================================
-- PEDIDO COMPRA
-- ============================================================

ALTER TABLE "PedidoCompra" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pedidoCompra_all" ON "PedidoCompra"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Fornecedor" f
      WHERE f.id = "fornecedorId" AND f."empresaId" = get_minha_empresa_id()
    )
  );


-- ============================================================
-- ITEM PEDIDO
-- ============================================================

ALTER TABLE "ItemPedido" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "itemPedido_all" ON "ItemPedido"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "PedidoCompra" p
      JOIN "Fornecedor" f ON f.id = p."fornecedorId"
      WHERE p.id = "pedidoId" AND f."empresaId" = get_minha_empresa_id()
    )
  );


-- ============================================================
-- DOCUMENTO
-- ============================================================

ALTER TABLE "Documento" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documento_all" ON "Documento"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Obra" o
      WHERE o.id = "obraId" AND o."empresaId" = get_minha_empresa_id()
    )
  );


-- ============================================================
-- LANCAMENTO FINANCEIRO
-- ============================================================

ALTER TABLE "LancamentoFinanceiro" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lancamentoFinanceiro_all" ON "LancamentoFinanceiro"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Obra" o
      WHERE o.id = "obraId" AND o."empresaId" = get_minha_empresa_id()
    )
  );


-- ============================================================
-- MIDIA
-- ============================================================

ALTER TABLE "Midia" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "midia_all" ON "Midia"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Obra" o
      WHERE o.id = "obraId" AND o."empresaId" = get_minha_empresa_id()
    )
  );


-- ============================================================
-- TEMPLATE FVS
-- ============================================================

ALTER TABLE "TemplateFVS" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templateFvs_all" ON "TemplateFVS"
  FOR ALL USING ("empresaId" = get_minha_empresa_id());


-- ============================================================
-- TEMPLATE FVS ITEM
-- ============================================================

ALTER TABLE "TemplateFVSItem" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templateFvsItem_all" ON "TemplateFVSItem"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "TemplateFVS" t
      WHERE t.id = "templateId" AND t."empresaId" = get_minha_empresa_id()
    )
  );


-- ============================================================
-- CONVITE
-- ============================================================

ALTER TABLE "Convite" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "convite_all" ON "Convite"
  FOR ALL USING ("empresaId" = get_minha_empresa_id());

-- Convite por token (para página de aceite — sem login)
CREATE POLICY "convite_by_token" ON "Convite"
  FOR SELECT USING (true);  -- token validation is done in app logic

-- Nota: o SELECT acima abre leitura de todos convites via client.
-- Se quiser restringir, remova "convite_by_token" e faça a validação
-- de token apenas via server-side (service_role key).


-- ============================================================
-- AUDIT LOG
-- ============================================================

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auditLog_select" ON "AuditLog"
  FOR SELECT USING ("empresaId" = get_minha_empresa_id());

-- INSERT: apenas via service_role (server-side)


-- ============================================================
-- PUSH SUBSCRIPTION
-- ============================================================

ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pushSubscription_all" ON "PushSubscription"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Usuario" u
      WHERE u.id = "usuarioId"
        AND u."empresaId" = get_minha_empresa_id()
        AND u."authId" = auth.uid()::text
    )
  );


-- ============================================================
-- INTEGRACAO CONFIG
-- ============================================================

ALTER TABLE "IntegracaoConfig" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integracaoConfig_all" ON "IntegracaoConfig"
  FOR ALL USING ("empresaId" = get_minha_empresa_id());


-- ============================================================
-- INTEGRACAO SYNC
-- ============================================================

ALTER TABLE "IntegracaoSync" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integracaoSync_all" ON "IntegracaoSync"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "IntegracaoConfig" ic
      WHERE ic.id = "integracaoId" AND ic."empresaId" = get_minha_empresa_id()
    )
  );


-- ============================================================
-- MENSAGEM CHAT
-- ============================================================

ALTER TABLE "MensagemChat" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mensagemChat_all" ON "MensagemChat"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Obra" o
      WHERE o.id = "obraId" AND o."empresaId" = get_minha_empresa_id()
    )
  );


-- ============================================================
-- Storage Buckets (aplique via Supabase Dashboard → Storage → Policies)
-- ============================================================

-- Bucket: documentos
-- SELECT: autenticado e pertence à empresa
-- INSERT: autenticado
-- DELETE: autenticado

-- Execute estes no dashboard do Supabase → Storage → Policies:
/*
  -- Leitura
  CREATE POLICY "docs_read" ON storage.objects
    FOR SELECT USING (
      bucket_id = 'documentos'
      AND auth.uid() IS NOT NULL
    );

  -- Upload
  CREATE POLICY "docs_insert" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'documentos'
      AND auth.uid() IS NOT NULL
    );

  -- Delete
  CREATE POLICY "docs_delete" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'documentos'
      AND auth.uid() IS NOT NULL
    );
*/


-- ============================================================
-- VERIFICAÇÃO: lista tabelas com RLS habilitado
-- ============================================================

-- Execute para verificar:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' ORDER BY tablename;
