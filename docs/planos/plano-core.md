# Concretiza — Plano (core / índice)

Visão do Produto
SaaS de gestão de obra e diário de obra (RDO) para construtoras, engenheiros, mestres e encarregados. PWA (mobile-first), bonito, simples, com IA (fase 2).

Legenda
- ✅ COMPLETO — funcional, lógica real, UI pronta
- ❌ NÃO INICIADO — intencionalmente pendente (Deploy / IA fase 2)

Resumo técnico & Status
- Next.js 15 + TypeScript — ✅
- Tailwind + shadcn/ui — ✅
- tRPC v11 — ✅
- Supabase + Prisma — ✅
- Auth (Supabase) — ✅
- IA (Claude) — integrado (Fase 2)
- Backend (routers tRPC) — ✅ (implementado)
- Frontend (FASE 3) — subdividido em micro-planos (veja links abaixo)

Índice — Sub-Planos (FASE 3)
- Engenharia / Campo (RDO, Orçamento, Estoque): plano-engenharia.md
- Financeiro (CP/CR, Boletos, Balancete): plano-financeiro.md
- Comercial (Contratos, Unidades, Comissões): plano-comercial.md
- Cadastros (Clientes, Credores, Empresas): plano-cadastros.md
- Suprimentos (Solicitações, Cotações, Pedidos, NF-e): plano-suprimentos.md
- Contabilidade (Lançamentos, Balancete): plano-contabilidade.md
- Administração & Perfil (Usuários, Permissões, Mídia): plano-admin.md
- Templates & Formulários: plano-templates.md
- Integrações & Webhooks: plano-integracoes.md
- Rotas Genéricas / Transversais: plano-transversais.md

Observações
- Cada sub-plano contém os itens (❌) que o Ralph deve consumir e atualizar com ✅.
- Use estes arquivos como input direto para prompts menores e lotes.
