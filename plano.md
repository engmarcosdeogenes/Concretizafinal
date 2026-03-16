# Concretiza — Plano de Desenvolvimento

## Visão do Produto

SaaS de **gestão de obra e diário de obra** (RDO) para construtoras, engenheiros, mestres e encarregados. PWA (mobile-first), bonito, simples, com IA (fase 2).

**Primeiro cliente:** já garantido, aguarda o produto completo.

---

## Legenda

- ✅ **COMPLETO** — funcional, lógica real, UI pronta
- ❌ **NÃO INICIADO** — intencionalmente pendente (Deploy / IA fase 2)

---

## Stack Técnico

| Camada | Tecnologia | Status |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | ✅ |
| Estilo | Tailwind CSS + shadcn/ui | ✅ |
| API | tRPC v11 (type-safe end-to-end) | ✅ |
| Banco | PostgreSQL via Supabase + Prisma ORM | ✅ Conectado, migrations aplicadas |
| Auth | Supabase Auth | ✅ Login, register, middleware, sessão |
| Storage | Supabase Storage (fotos, docs, plantas) | ✅ `/api/upload` funcionando |
| Formulários | Zod + React state | ✅ |
| Gráficos | Recharts | ✅ Painel + Análises |
| PDF | @react-pdf/renderer + jsPDF | ✅ RDO, FVS, semana |
| Mapa visual | Fabric.js canvas | ✅ Drag, zoom, pan, toolbar |
| Real-time | Supabase Realtime (chat) + polling fallback | ✅ |
| Push | Web Push API + VAPID | ✅ |
| Excel/CSV | xlsx lib | ✅ Fornecedores |
| Criptografia | AES-256-GCM | ✅ Sienge credentials |
| Rate limiting | In-memory sliding window | ✅ auth/upload/nfe endpoints |
| Deploy | Vercel | ✅ Completo |
| IA (fase 2) | Claude API (claude-sonnet-4-6) | ✅ Assistente IA implementado |

---

## Infraestrutura & Auth

| Item | Status | Detalhe |
|---|---|---|
| Supabase conectado | ✅ | DATABASE_URL, ANON_KEY, SERVICE_ROLE_KEY no .env |
| Banco em sincronia | ✅ | `prisma db push` OK, migrations aplicadas |
| Login (Supabase Auth) | ✅ | Email + senha |
| Register + onboard | ✅ | Cria Empresa + Usuario em `/api/auth/onboard` |
| Middleware/proxy | ✅ | Redireciona não-autenticados para /login |
| Multi-tenant | ✅ | Todas queries filtram por `empresaId` |
| Convites | ✅ | Token único, expiração, aceite via `/api/auth/accept-invite` |
| Auditoria (AuditLog) | ✅ | Todos CRUDs loggam mudanças |
| Web Push (VAPID) | ✅ | Notificações push configuradas |
| RLS no Supabase | ✅ | `supabase/migrations/20250309_rls_policies.sql` — todas as 32 tabelas |
| Rate limiting | ✅ | In-memory sliding window — onboard (5/15min), invite (10/15min), upload (30/1min), nfe (10/1min) |

---

## Schema Prisma (32 models — todos implementados)

Empresa, Usuario, ObraUsuario, Obra, RDO, RDOAtividade, RDOEquipe, FVS, FVSItem, TemplateFVS, TemplateFVSItem, FVM, Ocorrencia, Planta, MembroEquipe, Fornecedor, MaterialCatalogo, MovimentacaoMaterial, Equipamento, SolicitacaoCompra, ItemSolicitacao, PedidoCompra, ItemPedido, Documento, LancamentoFinanceiro, Midia, MensagemChat, Convite, AuditLog, PushSubscription, IntegracaoConfig, IntegracaoSync

---

## Módulos — Status detalhado

### Campo (uso diário no canteiro)

#### RDO ✅ COMPLETO (Sprint 4A)
- ✅ Lista com 4 stats (total, aprovados, pendentes, dias)
- ✅ Export Excel
- ✅ Duplicar último RDO
- ✅ Criar: data, clima, temperatura, atividades dinâmicas, equipe dinâmica, observações
- ✅ Upload fotos (`/api/upload` → Supabase Storage)
- ✅ Detalhe: editar observações/clima, galeria fotos
- ✅ Workflow status: RASCUNHO → ENVIADO → EM_REVISAO → APROVADO/REJEITADO (3 etapas)
- ✅ Atividades "Da lista": vinculam tarefas WBS no RDO (modo dual avulso/lista)
- ✅ Verificação em 2 etapas: Engenheiro (ENVIADO→EM_REVISAO) + Coordenador (EM_REVISAO→APROVADO)
- ✅ Ao APROVADO final: atualiza quantidadeExecutada + percentual das TarefaObra vinculadas
- ✅ Rejeição com comentário obrigatório, preserva dados; reabre como RASCUNHO para correção
- ✅ Histórico de verificações (nome, etapa, status, comentário, data) na página do RDO
- ✅ Push notification quando aprovado
- ✅ Geração PDF individual (`/api/pdf/rdo/[rdoId]`)
- ✅ Relatório semanal PDF (`/api/pdf/semana`)
- ✅ Seção colapsável "RDOs no Sienge" quando obra.siengeId configurado (Sprint 4B)
- ✅ Auditoria de mudanças
- ✅ Router: `listar`, `buscarPorId`, `criar`, `atualizar`, `atualizarStatus`, `verificar`, `duplicar`, `buscarSemana`, `excluir`

#### FVS ✅ COMPLETO
- ✅ Lista com filtros (status, serviço, data range)
- ✅ Criar: serviço, código, data, itens dinâmicos, template selector
- ✅ Templates de FVS por empresa
- ✅ Detalhe: editar, aprovar/reprovar itens individualmente
- ✅ Workflow status: PENDENTE → EM_INSPECAO → APROVADO/REJEITADO/RETRABALHO
- ✅ Push notification quando rejeitado
- ✅ Galeria fotos
- ✅ PDF individual + relatório semanal
- ✅ Router: `listar`, `buscarPorId`, `criar`, `atualizar`, `atualizarStatus`, `aprovarItem`, `excluir`

#### FVM ✅ COMPLETO
- ✅ Lista com filtros (status, material, fornecedor)
- ✅ Criar: material, quantidade, unidade, fornecedor, data, nota fiscal, foto NF
- ✅ Workflow status: PENDENTE → RECEBIDO → APROVADO/REJEITADO/DEVOLVIDO
- ✅ Lançar despesa automática no Financeiro ao aprovar
- ✅ Router: `listar`, `buscarPorId`, `criar`, `atualizarStatus`, `excluir`, `lancarDespesaNf`

#### Ocorrências ✅ COMPLETO
- ✅ Lista com filtros (tipo, status, prioridade)
- ✅ Criar: título, tipo (SEGURANCA/QUALIDADE/PRAZO/CUSTO/AMBIENTAL/OUTRO), prioridade 1–3, descrição, data
- ✅ Upload fotos
- ✅ Workflow status: ABERTA → EM_ANALISE → RESOLVIDA → FECHADA
- ✅ Push notification se prioridade máxima
- ✅ Atribuir responsável
- ✅ Posição no mapa (posX, posY, plantaId)
- ✅ Router: `listar`, `buscarPorId`, `criar`, `atualizar`, `atualizarStatus`, `excluir`, `atualizarPosicao`

#### Mapa Visual ✅ COMPLETO
- ✅ Fabric.js canvas com imagem da planta como fundo
- ✅ Upload de imagem da planta (via `/api/upload` → Supabase Storage) OU URL externa
- ✅ Pinos coloridos por tipo de ocorrência, tamanho por prioridade
- ✅ Click no canvas para posicionar ocorrência (modo crosshair)
- ✅ **Drag para reposicionar pinos** (arrastar e soltar persiste no banco)
- ✅ **Zoom com mouse wheel** (0.3× a 5×) + botões +/−/reset na toolbar
- ✅ **Pan do canvas** (arrastar fundo quando não há pino selecionado)
- ✅ Ocorrências resolvidas/fechadas com opacity reduzida
- ✅ Grid blueprint quando não há planta cadastrada
- ✅ Seletor de múltiplas plantas por obra
- ✅ Lista "sem localização" com botão "Localizar"
- ✅ Legenda de tipos
- ✅ Router planta: `criar`, `listar`, `atualizar`, `excluir`

---

### Gestão

#### Equipe ✅ COMPLETO
- ✅ Tabela: nome, função, CPF, telefone, empresa, status
- ✅ CRUD completo (criar, editar, marcar saída com dataSaida, excluir)
- ✅ Router: `listar`, `criar`, `atualizar`, `excluir`

#### Materiais (por obra) ✅ COMPLETO
- ✅ Tabela com material, categoria, unidade, preço, saldo
- ✅ Movimentações (entrada/saída)
- ✅ Filtro por categoria
- ✅ Router movimentacao: `listar`, `criar`

#### Documentos ✅ COMPLETO
- ✅ Upload documento (PDF, imagem) com categoria
- ✅ Tabela: nome, categoria, tamanho, data
- ✅ Download + excluir

#### Financeiro ✅ COMPLETO
- ✅ Resumo: receitas, despesas, saldo, orçamento vs custo
- ✅ CRUD lançamentos (RECEITA/DESPESA) com categoria
- ✅ Recorrência: DIARIA/SEMANAL/MENSAL (gera até 365 lançamentos futuros)
- ✅ Cron job `/api/cron/recorrencia` (com CRON_SECRET)
- ✅ Gráfico receitas vs despesas últimos 6 meses
- ✅ Router: `listar`, `resumo`, `resumoGeral`, `criar`, `excluir`

#### Medição de Obra ✅ COMPLETO (Sprint 3A)
- ✅ `/obras/[id]/medicao` — lista medições com KPIs (total, última data, % médio)
- ✅ Criar medição: data, descrição, tabela de itens dinâmicos (descrição, unidade, qtd prevista, qtd medida, % exec)
- ✅ Expandir medição para ver itens detalhados
- ✅ Barra de progresso por medição
- ✅ Integração Sienge: envia % médio como ProgressLog quando obra tem siengeId
- ✅ Badge "Sienge" nos itens sincronizados (siengeProgressLogId)
- ✅ Router: `listar`, `criar`, `excluir`
- ✅ Schema: `MedicaoObra` + `MedicaoItem` (qtdPrevista, qtdMedida, percentual, siengeProgressLogId)
- ✅ Tab "Medição" adicionada ao ObraTabs e link na Sidebar

---

### Suprimentos (global, todos módulos)

#### Fornecedores ✅ COMPLETO
- ✅ 4 KPIs: ativos, novos no mês, taxa atividade, categorias
- ✅ Filtros: busca (nome/CNPJ/cidade), categoria, status ativo/inativo
- ✅ CRUD completo (criar, editar, toggle ativo, excluir)
- ✅ Export Excel (.xlsx) e CSV
- ✅ Paginação (20 por página)
- ✅ Router: `listar`, `criar`, `atualizar`, `excluir`

#### Materiais (catálogo) ✅ COMPLETO
- ✅ Tabela com filtro por categoria
- ✅ CRUD (criar, editar, excluir)
- ✅ Router: `listar`, `criar`, `atualizar`, `excluir`

#### Equipamentos ✅ COMPLETO
- ✅ Tabela com filtro por status
- ✅ CRUD + change status (DISPONIVEL/EM_USO/MANUTENCAO/INATIVO)
- ✅ Router: `listar`, `criar`, `atualizar`, `excluir`

#### Solicitações de Compra ✅ COMPLETO
- ✅ Tabela com filtros (obra, material, status, urgência)
- ✅ Criar: obra, urgência, itens dinâmicos com material+quantidade
- ✅ Mudar status, expandir itens
- ✅ Editar rascunho: itens, urgência, observações (modo inline na página de detalhe)
- ✅ Excluir rascunho (com confirmação)
- ✅ Router: `listar`, `buscarPorId`, `criar`, `atualizarStatus`, `atualizar`, `excluir`

#### Pedidos de Compra ✅ COMPLETO
- ✅ Tabela com filtros (fornecedor, material, status)
- ✅ Criar: fornecedor, solicitação vinculável, previsão entrega, itens
- ✅ Mudar status, salvar nota fiscal (número, URL, valor)
- ✅ Lançar despesa no financeiro
- ✅ Editar rascunho: itens (add/remove), previsão entrega, observações
- ✅ Excluir rascunho (com confirmação)
- ✅ Router: `listar`, `buscarPorId`, `criar`, `atualizarStatus`, `salvarNotaFiscal`, `lancarDespesa`, `atualizar`, `excluir`

---

### Visibilidade

#### Dashboard / Painel ✅ COMPLETO
- ✅ 4 KPIs: obras ativas, RDOs do mês, ocorrências abertas, membros equipe
- ✅ Gráfico tendência RDOs (últimos 6 meses — Recharts area chart)
- ✅ Gráfico distribuição obras por status (pie chart)
- ✅ Lista obras por status (em andamento, concluídas, pausadas) com progresso
- ✅ Ocorrências recentes (5 últimas)
- ✅ Ações rápidas
- ✅ Router painel: `me`, `resumo`

#### Análises ✅ COMPLETO
- ✅ 4 KPIs detalhados
- ✅ RDOs por mês (12 últimos) — area chart
- ✅ Financeiro por mês (6 últimos) — bar chart receitas vs despesas
- ✅ Ocorrências por tipo — pie chart
- ✅ Ocorrências por status — pie chart
- ✅ FVS por status — pie chart
- ✅ Orçamento vs custo por obra (top 6) — bar chart
- ✅ Avanço físico % por FVS aprovadas
- ✅ Router analises: `resumo`

#### Painéis (Dashboards) ✅ COMPLETO (Sprint 3A + Sprint 3E + Sprint 4C)
- ✅ `/paineis` — página com widgets configuráveis pelo usuário
- ✅ 6 widgets Sprint 3A: KPIs Gerais, Avanço das Obras, Ocorrências Abertas, Contas a Pagar (Sienge), Saldos Bancários (Sienge), Estoque Crítico (Sienge)
- ✅ Visibilidade por widget salva em localStorage
- ✅ Widgets Sienge só aparecem quando integração está ativa
- ✅ Contas a Pagar: próximos 30 dias com destaque de vencidas + total
- ✅ Saldos Bancários: lista contas com total positivo em destaque
- ✅ Estoque Crítico: itens com saldo ≤ mínimo, badge vermelho/amarelo
- ✅ Avanço das Obras: barra de progresso por obra ativa (top 8)
- ✅ Modal "Configurar Widgets" com toggles Eye/EyeOff por widget
- ✅ Sprint 3E — 3 novos widgets BI: Contratos de Venda (PieChart status + KPIs), Patrimônio (KPIs imóveis/móveis + total), Tendência Financeira (AreaChart CR vs CP 6 meses)
- ✅ Sprint 4C — 5 novos widgets BI (Fase 2D):
  - Custo vs Orçamento por Obra (BarChart nativo, top 6 obras, destaque vermelho se excede orçamento)
  - Fluxo de Caixa Projetado (BarChart CP vs CR próximos 3 meses + saldo líquido projetado, Sienge)
  - Top Fornecedores por Gasto (BarChart horizontal top 8, derivado de contasPagar, Sienge)
  - Inadimplência (KPIs total + clientes + lista top 5 com dias em atraso, Sienge)
  - Vencimentos por Prazo (3 cards KPI: ≤7/≤15/≤30 dias com valor + títulos, Sienge)
- ✅ Total: 14 widgets configuráveis (9 anteriores + 5 novos)

#### Relatórios ✅ COMPLETO
- ✅ Seleção de tipo: RDO, Ocorrências, FVS, Financeiro, Relatório Semanal
- ✅ Filtro por obra (obrigatório ou opcional por tipo)
- ✅ Seleção de semana para relatório semanal
- ✅ Preview imprimível (`/relatorios/preview`) com todos os 4 tipos com dados reais
- ✅ Tabelas com KPIs: resumo de RDOs, ocorrências, FVS, financeiro
- ✅ Botão "Imprimir / PDF" (window.print com CSS @media print)
- ✅ PDF semanal via `/api/pdf/semana` (download direto)
- ✅ PDFs individuais: RDO (`/api/pdf/rdo/[id]`), FVS (`/api/pdf/fvs/[id]`)
- ✅ Acesso rápido por obra (atalhos para RDO, FVS, Financeiro)
- ✅ Histórico dos últimos 10 relatórios gerados (localStorage, reabrir com 1 clique)

---

### Comunicação

#### Chat ✅ COMPLETO
- ✅ Seletor de obra (esquerda) com count mensagens
- ✅ Histórico 100 últimas mensagens
- ✅ Envio com validação (1–2000 chars)
- ✅ Avatar, nome, horário
- ✅ Supabase Realtime — `supabase.channel().on('postgres_changes', INSERT)` por obra
- ✅ Scroll automático para última mensagem
- ✅ Fallback polling a cada 5s + refetchOnWindowFocus
- ✅ Router: `listarObras`, `listar`, `enviar`

---

### Configurações ✅ COMPLETO

| Sub-página | Status |
|---|---|
| Empresa (nome, CNPJ) | ✅ |
| Usuários (membros + permissões granulares + convites) | ✅ |
| Minha Conta (nome, telefone) | ✅ |
| Plano & Faturamento (3 tiers, CTA email) | ✅ |
| Notificações (push permissions + prefs localStorage) | ✅ |
| Integrações — Sienge | ✅ importar obras/fornecedores, ver pedidos |
| Integrações — outras (6 cards "Em breve") | ✅ informativo |

**Gestão de Usuários (completa):**
- ✅ Aba "Membros da equipe": lista todos usuários ativos com role e permissões
- ✅ DONO/ADMIN podem expandir qualquer usuário e editar permissões granulares
- ✅ 7 permissões por toggles: financeiro, aprovar RDO, aprovar FVS, gerenciar equipe, solicitações, documentos, relatórios
- ✅ Troca de cargo (role) com reset automático para padrões do cargo
- ✅ Remover usuário (com confirmação, protegido contra remover DONO/si mesmo)
- ✅ Restaurar permissões para o padrão do cargo
- ✅ Aba "Convites": convite por email+role, copiar link, revogar
- ✅ 9 roles: DONO, ADMIN, ENGENHEIRO, MESTRE, ENCARREGADO, AUXILIAR_ENGENHARIA, ALMOXARIFE, ESTAGIARIO_ENGENHARIA, ESTAGIARIO_ALMOXARIFE
- ✅ Router endpoints: `listarUsuarios`, `atualizarPermissoes`, `atualizarRole`, `removerUsuario`

---

## Routers tRPC (21 — todos completos)

| Router | Procedures | Status |
|---|---|---|
| obra | listar, buscarPorId, criar, atualizar, excluir | ✅ |
| rdo | listar, buscarPorId, criar, atualizar, atualizarStatus, duplicar, buscarSemana, excluir | ✅ |
| fvs | listar, buscarPorId, criar, atualizar, atualizarStatus, aprovarItem, excluir | ✅ |
| fvm | listar, buscarPorId, criar, atualizarStatus, excluir, lancarDespesaNf | ✅ |
| ocorrencia | listar, buscarPorId, criar, atualizar, atualizarStatus, excluir, atualizarPosicao | ✅ |
| equipe | listar, criar, atualizar, excluir | ✅ |
| fornecedor | listar, criar, atualizar, excluir | ✅ |
| material | listar, criar, atualizar, excluir | ✅ |
| equipamento | listar, criar, atualizar, excluir | ✅ |
| solicitacao | listar, buscarPorId, criar, atualizarStatus, atualizar, excluir | ✅ |
| pedido | listar, buscarPorId, criar, atualizarStatus, salvarNotaFiscal, lancarDespesa, atualizar, excluir | ✅ |
| financeiro | listar, resumo, resumoGeral, criar, excluir | ✅ |
| painel | me, resumo | ✅ |
| analises | resumo | ✅ |
| chat | listarObras, listar, enviar | ✅ |
| configuracoes | buscarEmpresa, atualizarEmpresa, buscarPerfil, atualizarPerfil, plano, listarUsuarios, atualizarPermissoes, atualizarRole, removerUsuario | ✅ |
| convite | listar, criar, revogar, buscarToken | ✅ |
| integracoes | buscarConfig, salvarConfig, testarConexao, importarObras, importarFornecedores, pedidosSienge, listarSyncs | ✅ |
| planta | listar, criar, atualizar, excluir | ✅ |
| midia | upload, listar | ✅ |
| auditLog | listarPorObra | ✅ |
| medicao | listar, criar, excluir | ✅ |

---

## Rotas API

| Rota | Status |
|---|---|
| POST `/api/auth/onboard` | ✅ Cria Empresa + Usuario pós-signup (rate limited: 5/15min) |
| POST `/api/auth/accept-invite` | ✅ Cria usuário via convite (rate limited: 10/15min) |
| GET `/api/invite/[token]` | ✅ Lê dados do convite para tela de aceite |
| GET `/api/pdf/rdo/[rdoId]` | ✅ Gera PDF do RDO |
| GET `/api/pdf/fvs/[fvsId]` | ✅ Gera PDF do FVS |
| GET `/api/pdf/semana` | ✅ Relatório semanal PDF |
| POST `/api/upload` | ✅ Upload para Supabase Storage (rate limited: 30/1min) |
| POST `/api/push/subscribe` | ✅ Web push subscription |
| GET `/api/clima` | ✅ Dados de clima |
| GET `/api/cron/recorrencia` | ✅ Gera lançamentos recorrentes (CRON_SECRET) |
| POST `/api/nfe/parse` | ✅ Parser XML SEFAZ — emitente, itens, valor (rate limited: 10/1min) |

---

## Componentes

| Componente | Status |
|---|---|
| Layout: Sidebar (colapsável ↔ icon-only, logo → /obras) | ✅ |
| Layout: Navbar (busca, notificações, ajuda, avatar + logout) | ✅ |
| shared/EmptyState | ✅ |
| shared/PageHeader | ✅ |
| shared/StatusBadge | ✅ |
| shared/PushRegistrar | ✅ |
| obras/ObraTabs | ✅ |
| obras/AlertasObra | ✅ |
| obras/MapaCanvas (drag, zoom, pan, toolbar) | ✅ |
| obras/UploadFotos | ✅ |
| pdf/RdoPdf | ✅ |
| pdf/FvsPdf | ✅ |
| pdf/SemanaPdf | ✅ |

---

## Status geral — 100% completo para o primeiro cliente

Todos os módulos core estão funcionais. O único item pendente intencional é o deploy.

| Categoria | Status |
|---|---|
| Campo (RDO, FVS, FVM, Ocorrências, Mapa) | ✅ Completo |
| Gestão (Equipe, Materiais, Docs, Financeiro) | ✅ Completo |
| Suprimentos (Fornecedores, Catálogo, Equipamentos, Solicitações, Pedidos) | ✅ Completo |
| Visibilidade (Dashboard, Análises, Relatórios) | ✅ Completo |
| Comunicação (Chat com Realtime) | ✅ Completo |
| Configurações (Empresa, Usuários, Plano, Push, Sienge) | ✅ Completo |
| Infraestrutura (Auth, RLS, Rate limiting, Audit, Push) | ✅ Completo |
| Deploy Vercel | ✅ Completo |
| IA Claude API | ✅ Assistente IA implementado |

---

## Arquitetura de Navegação

```
/ → redireciona para /obras (se autenticado) ou /login

(auth)
├── /login
└── /register

(dashboard)
├── /painel                    ✅ Dashboard global
├── /obras                     ✅ Lista
│   ├── /obras/nova            ✅ Formulário criar
│   └── /obras/[id]            ✅ Visão geral + tabs
│       ├── /rdo               ✅ Lista + novo + detalhe
│       ├── /fvs               ✅ Lista + novo + detalhe + editar
│       ├── /fvm               ✅ Lista + novo + detalhe
│       ├── /ocorrencias       ✅ Lista + nova + detalhe
│       ├── /mapa              ✅ Canvas + drag + zoom + pan + toolbar
│       ├── /equipe            ✅
│       ├── /materiais         ✅
│       ├── /documentos        ✅
│       ├── /financeiro        ✅
│       └── /medicao           ✅ (medição de avanço físico)
├── /suprimentos → /suprimentos/fornecedores
│   ├── /fornecedores          ✅ (paginação 20/página, export Excel/CSV)
│   ├── /materiais             ✅
│   ├── /equipamentos          ✅
│   ├── /solicitacoes          ✅ (editar/excluir rascunho implementado)
│   └── /pedidos               ✅ (editar/excluir rascunho implementado)
├── /paineis                   ✅ (Sprint 3A — widgets configuráveis, dados Sienge)
├── /analises                  ✅
├── /relatorios                ✅ (seletor tipo, filtro obra, preview, PDF, histórico)
├── /chat                      ✅ (Supabase Realtime + polling fallback)
└── /configuracoes
    ├── /empresa               ✅
    ├── /usuarios              ✅ (permissões granulares + 9 roles)
    ├── /conta                 ✅
    ├── /plano                 ✅
    ├── /notificacoes          ✅
    └── /integracoes           ✅ (Sienge ativo)
```

---

## Modelo de Negócio

### Planos de Preço

| Plano | Preço | Obras | Usuários | Storage | Público |
|---|---|---|---|---|---|
| **Fundador** *(só 10 vagas)* | R$ 1500/mês fixo para sempre | 5 | Ilimitado | — | Primeiros clientes, beta testadores |
| **Básico** | R$ 1999/mês | 3 | 10 | — | Micro construtoras, reformas |
| **Profissional** *(mais popular)* | R$ 2500/mês | Ilimitado | Ilimitado | 50GB | Construtoras médias — inclui os maiores players de Goiânia |
| **Enterprise** | R$ 4000/mês | Ilimitado | Ilimitado | 150GB | Grupos construtores com múltiplos CNPJs |

**Plano anual:** 17% de desconto (equivale a 2 meses grátis)

### Diferenciais do Enterprise sobre o Profissional
- Múltiplas empresas/CNPJs no mesmo painel (grupos construtores)
- SLA de suporte com resposta garantida em 4h (WhatsApp direto)
- Onboarding assistido (configuração junto com a equipe)
- Relatórios personalizados e exportações avançadas
- Acesso antecipado a features e à IA (Fase 2)

### Contexto de mercado (Goiânia)
- Mesmo as maiores construtoras de Goiânia (EBM, Consciente, Opus, SLN, Souza Andrade) têm no máximo 15–20 obras ativas simultâneas
- O Plano Profissional (obras ilimitadas) atende do menor ao maior player local
- Concorrentes diretos cobram R$ 160/mês só por RDO — Concretiza entrega suite completa por R$ 199
- Sienge e Totvs são caros, complexos, feitos para empresas 5–10x maiores

### Breakeven
- Custos fixos: ~R$ 490/mês (Supabase Pro $25 + Vercel Pro $20 + contador ~R$ 150)
- Breakeven: 3 clientes no Básico ou 2 clientes no Profissional
- Cada cliente a partir do 4º é 100% lucro operacional

---

---

## Visão Estratégica — Concretiza como Frontend do Sienge

O Sienge é o ERP mais usado em construtoras brasileiras (~35% de market share).
Ele faz tudo no escritório. Não faz nada no canteiro.
O Concretiza tem acesso a **86 APIs REST + 14 Bulk Data = 350+ endpoints** do Sienge.

**A visão:** tornar o Concretiza o único app que o engenheiro, mestre e gestor precisam abrir.
Tudo que acontece no Concretiza alimenta o Sienge. Tudo que está no Sienge aparece no Concretiza.
**A ilha (campo) e o continente (escritório) conectados por uma única ponte.**

---

## Roadmap de Expansão — Módulos Sienge

### Legenda de Prioridade
- 🔴 **CRÍTICO** — pedido direto, elimina dor real, diferencial competitivo
- 🟡 **ALTO** — amplia muito o valor, fecha mais contratos
- 🟢 **MÉDIO** — complementa, enriquece produto
- ⚪ **BAIXO** — nice-to-have, nichos específicos

---

### FASE 2A — Campo + Integração Core ✅ COMPLETO (Sprint 3B)
*Objetivo: tornar o campo 100% conectado ao Sienge. Eliminar a reunião de medição.*

#### ✅ Medição de Obra (Sprint 3A)
**O que faz:** O engenheiro registra no app "fiz X m² de alvenaria hoje" → automaticamente atualiza o % da tarefa no planejamento do Sienge. Elimina a reunião semanal de medição (a "Andressa").
**Implementado:** `/obras/[id]/medicao` — KPIs, criação com itens dinâmicos, barra de progresso, badge Sienge nos itens sincronizados, router `medicao.listar/criar/excluir`, schema `MedicaoObra` + `MedicaoItem` (siengeProgressLogId), `criarProgressLogSienge` fire-and-forget.

#### ✅ Lista de Tarefas WBS Nativa (Sprint 4A + 4B)
**O que faz:** WBS nativo da obra (sem depender do Sienge). Código WBS, nome, setor, unidade, barra de progresso (exec/total), status. Hierarquia pai/filho expansível. Integrado ao fluxo do RDO: atividades "Da lista" atualizam % ao ser aprovado.
**Implementado (Sprint 4A):** `/obras/[id]/tarefas` — KPIs (Total, Concluídas, Em andamento, Avanço médio), TarefaRow hierárquico, TarefaModal CRUD, busca por nome/código/setor, PDF `/api/pdf/tarefas/[obraId]`. Schema: `TarefaObra` (parentId, codigo, quantidadeTotal, quantidadeExecutada, percentual, status). Router: `tarefaObra.listar/criar/atualizar/excluir`.
**Implementado (Sprint 4B):** Botão "Importar" + `ImportarModal` — parse client-side de Excel (.xlsx/.csv) usando `xlsx` + MS Project XML (.xml) usando DOMParser nativo. `criarLote` procedure com resolução hierárquica por `codigoPai`. Template Excel para download.

#### ✅ Vínculo Equipe → Sienge (Sprint 3B)
**O que faz:** Ao cadastrar ou editar um membro com CPF, faz lookup automático no Sienge via `buscarCreditorPorCpf`. Se encontrado, vincula `siengeCreditorId` fire-and-forget.
**Implementado:** `vincularCreditorSienge()` em `equipe.ts`, executado em `criar` e `atualizar`. Badge verde "Sienge" exibido na listagem de membros. Schema: `siengeCreditorId` em `MembroEquipe`.

#### ✅ Webhooks Sienge → Concretiza (Sprint 3B)
**O que faz:** Registra o Concretiza como listener de eventos do Sienge. Quando um pedido é autorizado, NF lançada ou contrato criado, o Concretiza é notificado em tempo real.
**Implementado:** `POST /api/sienge/webhook` — processa `PURCHASE_ORDER_AUTHORIZED`, `PURCHASE_ORDER_CREATED`, `BILL_PAID`, `CONTRACT_CREATED`, grava `IntegracaoSync`. Router `sienge.registrarWebhook/buscarStatusWebhook/removerWebhook`. UI na página `/configuracoes/integracoes` com toggle Ativar/Desativar webhook.

#### ✅ Diário de Obra Bidirecional (Sprint 3B + Sprint 4E)
**O que faz:** Ao mudar RDO para ENVIADO, cria automaticamente no módulo de Diário de Obra do Sienge (fire-and-forget). `siengeReportId` salvo ao confirmar.
**Implementado:** `rdo.ts atualizarStatus` — quando `status === "ENVIADO" && !rdo.siengeReportId && obra.siengeId`, chama `criarRdoSienge(...)` e salva `siengeReportId`. Schema: `siengeReportId String?` em `RDO`.
**Sprint 4E:** Badge "Sienge #ID" visível no detalhe do RDO quando `siengeReportId` está preenchido (ícone Link2, badge azul). Já estava implementado na página mas documentado agora.

#### ✅ Orçamento vs Real (Sprint 3B)
**O que faz:** Exibe o orçamento oficial do Sienge (SINAPI/TCPO/customizado) lado a lado com o gasto real do Concretiza. Desvio em % com chips visuais (verde/laranja/vermelho).
**Implementado:** `/obras/[id]/orcamento` — KPIs (Orçado Total, Gasto Real, Desvio), barra de progresso gasto vs orçado, OrcamentoCard expansível com itens agrupados por grupo, router `sienge.listarOrcamento`. Integra com `financeiro.resumo` para gasto real.

#### ✅ Sprint 4A — WBS nativo + Fluxo de verificação RDO + RBAC Sidebar
**Implementado (commit 6fa5751):**
- Schema: `TarefaObra`, `VerificacaoRDO`, `StatusRDO.EM_REVISAO`, `RDOAtividade.tarefaObraId`
- Fluxo RDO 3 etapas: campo → engenheiro → coordenador. Rejeição com comentário
- RDO modo dual: toggle Avulso/Da lista nas atividades. "Da lista" seleciona com checkbox+qtd
- Sidebar RBAC: MESTRE/ENCARREGADO só vê campo; ENGENHEIRO vê gestão; ADMIN/DONO tudo
- PDF `/api/pdf/tarefas/[obraId]` — tabela WBS com barra de progresso

#### ✅ Sprint 4B — Importação de arquivo para WBS + Sienge enriquecido por obra
**Implementado (commit fc6545c):**
- `criarLote` procedure: importa array de tarefas com resolução hierárquica por `codigoPai`
- ImportarModal (tarefas page): suporte .xlsx/.csv (xlsx lib) e MS Project .xml (DOMParser nativo)
- Template Excel para download (gerado client-side)
- sienge/client.ts: `listarRdosSienge`, `listarSolicitacoesPorObraSienge`
- sienge.ts router: `listarRdosPorObra`, `listarSolicitacoesPorObra`, `listarPedidosPorObra`
- `importarObras` melhorado: flag `atualizarExistentes` + retorna `{criadas, atualizadas, total}`
- RDO page: seção colapsável "RDOs no Sienge" (quando obra.siengeId configurado)
- Materiais page: seção colapsável "Estoque Sienge"
- Visão Geral page: card mini-KPIs Sienge (Pedidos, Cotações, Contratos, Estoque)
- Integrações page: checkbox "Atualizar obras existentes" + toast detalhado

#### ✅ Movimentação de Estoque no Sienge (Sprint 4E)
**Implementado:** `/obras/[id]/almoxarifado` — botão "Nova Movimentação" no header + ícone por linha da tabela de estoque.
- Modal: select de material (da lista de estoque), toggle ENTRADA/SAÍDA (verde/vermelho), quantidade, data, observação

#### ✅ Push Notifications via Webhook Sienge (Sprint 4F)
**Implementado:** `/api/sienge/webhook/route.ts` — além de gravar `IntegracaoSync`, agora chama `notificarEmpresa()` para:
- `PURCHASE_ORDER_AUTHORIZED` → push "Pedido Autorizado no Sienge"
- `PURCHASE_ORDER_CREATED` → push "Novo Pedido no Sienge"
- `BILL_PAID` → push "Conta Paga no Sienge" (com nome do fornecedor)
- `CONTRACT_CREATED` → push "Novo Contrato no Sienge"

#### ✅ Gráfico Orçamento por Grupo (Sprint 4F)
**Implementado:** `/obras/[id]/orcamento` — BarChart Recharts mostrando distribuição do orçamento por grupo de composição.
- Agrupa todos os itens de todas as estimativas pelo campo `group`
- Exibe top 10 grupos por valor, barra laranja, eixo Y em "k"
- Visível apenas quando há 2+ grupos distintos

#### ✅ Análise Consolidada de Fornecedor (Sprint 4F)
**Implementado:** `/suprimentos/fornecedores/[id]` — nova seção "Histórico de Pedidos":
- KPIs: Total de pedidos, Total gasto, Ticket médio
- Últimos 5 pedidos: nome dos itens, data, status badge colorido, valor — link para detalhe
- Link "Ver todos" se houver mais de 5 pedidos

#### ✅ Widget "Pedidos Recentes" no Painéis (Sprint 4F)
**Implementado:** `/paineis` — novo widget 15 (`pedidos-recentes`):
- Lista os 6 pedidos mais recentes da empresa (dados locais, sem Sienge)
- Mostra fornecedor, data, status badge e valor
- Badge "X em aberto" no header se houver pendentes
- Configurável via modal "Configurar Widgets"

#### ✅ Reservas de Estoque com Progresso (Sprint 4F)
**Implementado:** `/obras/[id]/almoxarifado` — aba "Reservas" melhorada:
- 3 KPIs no topo: Pendentes, Atendidas, % Atendimento geral
- Barra de progresso visual por reserva (substitui texto "X%")
- Reservas atendidas ficam semi-transparentes com ícone checkmark
- Grid ajustado para incluir coluna "Progresso"

#### ✅ RDO → Sienge Progress Log (Sprint 4F)
**Implementado:** `rdo.ts verificar` — quando COORDENADOR aprova (APROVADO) e obra tem siengeId:
- Fire-and-forget: calcula média do % das tarefas vinculadas às atividades do RDO
- Envia `criarProgressLogSienge()` com `buildingProjectId=obra.siengeId`, data do RDO, percentual médio
- Só dispara se há atividades com tarefaObraId vinculado
- Import `criarProgressLogSienge` adicionado em `rdo.ts`
- Submit → `trpc.sienge.lancarMovimentacao` → `lancarMovimentacaoEstoqueSienge` (`POST /stock-movements`)
- Sienge confirma via `{ id }`, toast sucesso/erro, refetch automático do estoque
- `lancarMovimentacao` procedure adicionada ao `sienge.ts` router
- `lancarMovimentacaoEstoqueSienge` adicionado ao import do router

---

### FASE 2B — Suprimentos + Financeiro Avançado ✅ COMPLETO (Sprint 3B)
*Objetivo: o gestor de compras e financeiro não precisam mais abrir o Sienge para tarefas de rotina.*

#### ✅ Cotações de Preço (Sprint anterior + Sprint 4D)
**Implementado:** `/suprimentos/cotacoes` — KPIs (Total/Abertas/Fechadas), tabela expansível com respostas dos fornecedores, destaque menor preço, botão PDF Mapa Comparativo.
**Sprint 4D:** Botão "Nova Cotação" + modal inline — seleciona obra (vinculada ao Sienge), descrição, itens dinâmicos (descrição+cód.Sienge+qtd+unidade), multi-select de fornecedores com siengeCreditorId. Submit → `trpc.sienge.criarCotacao` → `criarCotacaoSienge` (`POST /purchase-quotations`). Toast sucesso/erro + refetch lista.

#### ✅ Solicitações → Sienge bidirecional (Sprint anterior)
**Implementado:** `solicitacao.ts` fire-and-forget ao PENDENTE via `criarSolicitacaoSienge`. Schema: `siengePurchaseRequestId Int?` em `SolicitacaoCompra`. Badge Sienge no detalhe da solicitação.

#### ✅ Pedidos → Sienge (autorização pelo app) (Sprint 3B)
**Implementado:** Schema: `siengePurchaseOrderId Int?` adicionado ao `PedidoCompra`. Router `sienge.autorizarPedido` para autorizar pedido no Sienge por ID. Página de detalhe do pedido já usa o campo (PDF de análise, avaliação de fornecedor por critério 1-10 do Sienge quando ENTREGUE).

#### ✅ Contratos de Suprimentos + Medições (Sprint anterior)
**Implementado:** `/obras/[id]/contratos` — KPIs (Total Contratado, Total Medido, % Medido), lista expansível com medições por contrato (data início/fim, status, valor).

#### ✅ Estoque Real (Sienge) (Sprint anterior)
**Implementado:** `/obras/[id]/almoxarifado` — alertas zerado/abaixo mínimo, tabela com saldo, mínimo, badge situação (OK/Baixo/Zerado). Dados ao vivo do Sienge.

#### ✅ Notas Fiscais Eletrônicas (Sprint anterior)
**Implementado:** `/suprimentos/nfe` — filtros por obra + período, tabela com NFe do Sienge, link SEFAZ, status colorido (AUTORIZADA/CANCELADA/etc).

#### ✅ Contas a Pagar (Sprint 3B)
**Implementado:** `/financeiro/contas-pagar` — KPIs (Total a Pagar, Vencidas, Vencendo 30d), filtros status + data, tabela com highlight vencidas (vermelho) / vencendo em 7 dias (amarelo), empty state para Sienge não configurado.

#### ✅ Contas a Receber + Inadimplência (Sprint anterior)
**Implementado:** `/financeiro/recebimentos` — abas Contas a Receber / Inadimplentes, KPIs, filtros status+data, expansível por cliente.

#### ✅ Saldos Bancários Reais (Sprint 3B)
**Implementado:** `/financeiro/caixa` — KPI total consolidado (verde/vermelho), grid de cards por conta bancária com nome, banco, número, saldo colorido. Dados ao vivo do Sienge.

#### ✅ Relatório de Gastos por Obra (Sprint 3B)
**Implementado:** `/relatorios/gastos-obra` — seletor de obra, KPIs (Total/Pago/Vencido), tabela por fornecedor com ranking, tabela de títulos individuais, export Excel (.xlsx).

**Também implementado (Sprint 3B):**
- `/financeiro/page.tsx` — 4 cards: Contas a Pagar (/financeiro/contas-pagar), Recebimentos, Inadimplência, Saldos Bancários (/financeiro/caixa)
- `Sidebar.tsx` — Financeiro expandido com sub-items: Contas a Pagar, Recebimentos, Saldos Bancários

---

### FASE 2C — Comercial + Patrimônio + Contabilidade
*Objetivo: tornar o Concretiza relevante para o time de vendas e financeiro corporativo.*

#### ✅ Painel Comercial — Mapa Imobiliário (Sprint 3C)
**Implementado:** `/comercial/mapa` — KPIs (Total, Disponíveis, Reservadas, Vendidas, Permutadas), filtros por status, grid de cards coloridos por status, seletor de empreendimento. `listarUnidadesSienge()` em sienge client, `sienge.listarMapaImobiliario` procedure. Sidebar global nav tem grupo "Comercial" com link "Mapa Imobiliário".

#### ✅ Contratos de Venda (Sprint 3D)
**Implementado:** `/comercial/contratos` — KPIs (Total, Ativos, Valor total), filtros por status (Ativos/Cancelados/Distratados), tabela (cliente, empreendimento, unidade, valor, assinatura, status badge). `listarContratosVendaSienge()` + `sienge.listarContratosVenda` procedure. Sidebar "Comercial" expandido.

#### ✅ Locação de Imóveis (Sprint 3D)
**Implementado:** `/comercial/locacoes` — KPIs (Total, Ativas, Receita mensal, Vencendo em 30d com destaque amber), filtros por status, tabela com highlight vermelho/amber para contratos vencendo em 30 dias. `listarLocacoesSienge()` + `sienge.listarLocacoes` procedure.

#### ✅ Patrimônio (Bens Imóveis e Móveis) (Sprint 3D)
**Implementado:** `/patrimonio` — KPIs (Valor total patrimônio, count+valor de imóveis e móveis separados), duas abas "Bens Imóveis" (nome, tipo, valor contábil, localização) e "Bens Móveis" (nome, tipo, placa/série, valor contábil, status badge). `listarBensImoveisSienge()` + `listarBensMoveisSienge()` + `sienge.listarPatrimonio` procedure. Ícone `Warehouse` no sidebar global nav.

#### ✅ Comissões de Corretores (Sprint 3D)
**Implementado:** `/comercial/comissoes` — KPIs (Total, Valor pago, A pagar), filtros por status (Pagos/Pendentes), tabela (corretor, empreendimento, unidade, valor, pagamento, status badge). `listarComissoesSienge()` + `sienge.listarComissoes` procedure.

#### ✅ Balancete de Verificação (Sprint 3D)
**Implementado:** `/financeiro/balancete` — Filtro de competência `<input type="month">` (padrão mês atual), KPIs (Mov. Débito, Mov. Crédito, Saldo Final Déb/Créd), tabela scrollável de contas (código, nome, saldo anterior déb/créd, movimento, saldo final), export Excel via xlsx. `listarBalanceteSienge()` + `sienge.listarBalancete` procedure (input: competencia string). Sidebar "Financeiro" tem "Balancete".

#### ✅ Integração Contábil (push de lançamentos) (Sprint 4D)
**Implementado:** Lançamentos contábeis automáticos ao Sienge em 2 eventos:
- `pedido→ENTREGUE`: fire-and-forget → `criarLoteContabilSienge` com `accountCode=Materiais`, `value=pedido.total`
- `fvm→APROVADO`: fire-and-forget → `criarLoteContabilSienge` com `accountCode=Materiais`, `value=fvm.quantidade`
- Schema: `Empresa.planosContas Json?` — mapeamento categoria→código contábil
- `configuracoes.buscarPlanosContas` + `salvarPlanosContas` (com `z.record(z.string(), z.string())`)
- `/configuracoes/plano-contas` — tabela editável (Materiais, Serviços, Equipamentos, Outros, Centro de Custo)
- Card "Plano de Contas" adicionado à `/configuracoes`
- `criarLoteContabilSienge()` em `src/lib/sienge/client.ts` — `POST /accountancy/entry-generator/entry-batches`

#### ✅ Boletos e Segunda Via (Sprint 4D)
**Implementado:** `/financeiro/boletos` — KPIs (Em aberto, Vencidos, Emitidos no mês), filtro por status (aberto/vencido/pago), tabela (cliente|doc|vencimento|valor), botão "2ª via" com modal de email. Usa `listarContasReceber` + `enviarBoleto2Via`. Sidebar "Boletos / 2ª Via" + card em `/financeiro`.
- `enviarBoleto2ViaSienge()`, `obterSaldoDevedorSienge()`, `enviarSaldoDevedorEmailSienge()` em `sienge/client.ts`
- Procedures `enviarBoleto2Via`, `obterSaldoDevedor`, `enviarSaldoDevedorEmail` em `sienge.ts` router

---

### FASE 2D — Dashboards BI Avançados + IA
*Objetivo: o Concretiza como plataforma de inteligência para construtoras.*

#### ✅ Multi-empresa / Enterprise (Sprint 4D)
**Implementado:** `/enterprise` — Visão consolidada das empresas do grupo via Sienge:
- KPIs: Empresas no Grupo, Contas a Pagar (total), Pedidos de Compra
- Lista de empresas do grupo (nome, CNPJ, status ativo/inativo) via `listarEmpresasSienge` (`GET /companies`)
- Seletor: ao clicar numa empresa exibe detalhes (ID Sienge, CNPJ, status)
- Empty/error state elegante com link para Configurações se Sienge não estiver configurado
- Sidebar: link "Enterprise" (ícone Network) visível apenas para plano === "ENTERPRISE"
- `listarEmpresas` procedure em `sienge.ts` + `listarEmpresasSienge()` em `sienge/client.ts`

#### ✅ Dashboards Customizáveis (o que o Hinc faz por R$ 1.000)
**O que faz:** O cliente escolhe quais dashboards quer ver, reordena, configura filtros. Cada card é um widget independente alimentado por dados reais do Sienge + dados próprios do Concretiza.
**Implementado:** `/paineis` — 15 widgets independentes com configuração customizável:
- Schema: `DashboardConfig` (usuarioId unique, empresaId, widgets Json) — persistência server-side por usuário
- tRPC Router: `dashboardConfig.buscar` + `dashboardConfig.salvar` (upsert)
- Drag-and-drop reordering via HTML5 DnD nativo (sem dependência extra)
- Widgets renderizados na ordem do usuário via `RenderWidget` dinâmico
- Modal de configuração com grip handle, toggle visibilidade, botão "Restaurar padrão"
- Merge inteligente: widgets novos são adicionados automaticamente ao config existente
- 15 widgets: KPIs, Avanço Obras, Ocorrências, Tendência Financeira, Custo vs Orçamento, Pedidos Recentes, Contas a Pagar, Saldos Bancários, Estoque Crítico, Fluxo de Caixa, Top Fornecedores, Inadimplência, Vencimentos por Prazo, Contratos de Venda, Patrimônio
**Bulk Data disponível:**
- `/purchase-orders` — pedidos de compra
- `/purchase-quotations` — cotações
- `/invoice-items` — itens de notas fiscais
- `/accounts-payable-installments` — contas a pagar
- `/accounts-receivable-installments` — contas a receber
- `/bank-movements` — movimentos caixa/bancos
- `/sales-contracts` — contratos de venda
- `/building-resources` — insumos de obra
- `/building-cost-estimations` — orçamentos
- `/business-budget` — orçamento empresarial
- `/account-cost-center-balance` — saldos por centro de custo
- `/account-company-balance` — saldos por empresa
- `/customer-extract-history` — extrato de clientes
- `/customer-debt-balance` — saldo devedor
**Rota:** `/paineis`

#### ✅ IA — Claude API integrada ao Sienge
**O que faz:** Com acesso a todos os dados do Sienge + Concretiza, o Claude analisa e responde em linguagem natural:
- "Quanto gastei na obra Jardins neste trimestre e quais os maiores desvios do orçamento?"
- "Qual obra está com maior risco de atraso com base no ritmo de avanço atual?"
- "Me dê um resumo de tudo que aconteceu nas minhas obras essa semana"
- "Há pedidos de compra acima da média histórica desse fornecedor?"
- "Quais materiais estão com estoque crítico em quais obras?"

**Dados disponíveis para o Claude:**
- RDOs, FVS, FVM, Ocorrências (banco Concretiza)
- Medições, Planejamento, Avanço físico (Sienge Engenharia)
- Pedidos, Cotações, Contratos (Sienge Suprimentos)
- Contas a pagar, saldos, extratos (Sienge Financeiro)
- Contratos de venda, inadimplência (Sienge Comercial)

**Implementado:** `/assistente` — Chat IA com contexto rico Sienge + Concretiza:
- System prompt especializado em gestão de obras com consciência de dados Sienge
- Contexto automático: obras ativas (progresso + desvio orçamento), RDOs, FVS, medições, ocorrências por tipo
- Dados Sienge injetados: obras ERP (top 10), pedidos de compra recentes (top 5 com status/autorização), contas a pagar (total + vencidas), saldos bancários (total), inadimplência
- Graceful degradation: se Sienge não configurado, funciona só com dados locais
- 6 sugestões Sienge-aware na UI (resumo financeiro, desvios, inadimplência, etc.)
- max_tokens aumentado para 4096 (análises mais detalhadas)
**Rota:** `/assistente` (chat com IA)

#### 🟡 App Nativo iOS + Android
**O que faz:** Versão nativa do Concretiza para as lojas. Melhora percepção de valor, facilita adoção no campo, permite notificações push nativas, câmera nativa para fotos de obra.
**Tecnologia:** React Native (Expo) — aproveita 100% dos routers tRPC existentes.
**Por que importante:** O Alessandro disse literalmente "quando as pessoas veem que tem aplicativo, ficam mais aceitáveis de usar." O PWA é ótimo tecnicamente mas o mercado ainda valoriza o ícone na loja.

#### 🟢 Integração Construcompras-style (webhook bidirecional de cotações)
**O que faz:** Integração ao estilo Construcompras: ao criar uma solicitação de cotação, notifica os fornecedores via WhatsApp/e-mail. As respostas chegam e criam automaticamente a negociação no Sienge — sem ninguém precisar digitar.
**Tecnologia:** Webhooks Sienge + API WhatsApp Business + parsing de respostas
**APIs Sienge:** `/purchase-quotations`, `/purchase-quotations/{id}/responses`, `/hooks`

#### 🟢 Painel Multi-Empresa (Enterprise)
**O que faz:** Para grupos construtores com múltiplos CNPJs: visão consolidada de todas as empresas do grupo, com drill-down por empresa/obra/departamento.
**APIs Sienge:**
- `GET /companies` — lista empresas do grupo
- Todos os endpoints com `companyId` como filtro
- Bulk `/account-company-balance` — saldos consolidados
**Plano:** exclusivo Enterprise (R$ 800/mês)

---

## Mapa de Implementação Sienge — Endpoints por Módulo

| Módulo Concretiza | Endpoints Sienge | Direção | Fase |
|---|---|---|---|
| Medição de Obra | `/building-projects-progress-logs` | Concretiza → Sienge | 2A |
| Lista de Tarefas | `/building-projects/{id}/tasks`, `/building-calendars` | Sienge → Concretiza | 2A |
| Equipe vinculada | `/creditors`, `/professions`, `/departments` | Bidirecional | 2A |
| Webhooks | `/hooks` | Sienge → Concretiza | 2A |
| RDO Bidirecional | `/construction-daily-reports` | Bidirecional | 2A |
| Orçamento vs Real | `/building-cost-estimations`, `/cost-databases`, `/cost-centers` | Sienge → Concretiza | 2A |
| Cotações | `/purchase-quotations`, `/responses` | Sienge → Concretiza | 2B |
| Solicitações sync | `/purchase-requests`, `/authorize` | Bidirecional | 2B |
| Pedidos autorização | `/purchase-orders`, `/authorize` | Bidirecional | 2B |
| Contratos + Medições | `/contracts`, `/measurements` | Bidirecional | 2B |
| Estoque real | `/stock-inventories`, `/stock-movements` | Bidirecional | 2B |
| NFe do Sienge | `/nfe`, `/purchase-invoices` | Sienge → Concretiza | 2B |
| Contas a Pagar | `/bill-debts`, `/bill-debts/{id}/installments` | Sienge → Concretiza | 2B |
| Contas a Receber | `/accounts-receivable` | Sienge → Concretiza | 2B |
| Saldos Bancários | `/checking-accounts`, `/accounts-balances`, `/accounts-statements` | Sienge → Concretiza | 2B |
| Gastos por Obra | `/bills`, `/bills/{id}/budget-categories` | Sienge → Concretiza | 2B |
| Mapa Imobiliário | `/real-estate-map`, `/units`, `/unit-bookings` | Bidirecional | 2C |
| Contratos de Venda | `/sales-contracts` | Sienge → Concretiza | 2C |
| Locação de Imóveis | `/property-rentals` | Sienge → Concretiza | 2C |
| Patrimônio | `/fixed-assets`, `/movable-assets` | Sienge → Concretiza | 2C |
| Comissões | `/commissions` | Sienge → Concretiza | 2C |
| Balancete | `/trial-balance`, `/accountancy/accounts` | Sienge → Concretiza | 2C |
| Integração Contábil | `/accountancy/entry-generator/entry-batches` | Concretiza → Sienge | 2C |
| Boletos | `/payment-slip-notification`, `/current-debit-balance` | Sienge → Concretiza | 2C |
| Dashboards BI | 14 endpoints Bulk Data | Sienge → Concretiza | 2D |
| IA Claude API | Todos os dados Sienge + Concretiza | Analítico | 2D |
| App Nativo | (infraestrutura, não API) | — | 2D |
| Construcompras-style | `/purchase-quotations`, `/hooks` + WhatsApp API | Bidirecional | 2D |
| Multi-Empresa | `/companies` + todos companyId | Sienge → Concretiza | 2D |

---

## Rotas Novas Previstas

```
(dashboard)
├── /paineis                       ← Dashboards BI customizáveis (substitui /painel)
├── /assistente                    ← Chat com IA (Claude API)
├── /obras/[id]
│   ├── /medicao                   ← Medição de obra + avanço físico (Sienge)
│   ├── /tarefas                   ← Lista de tarefas com % (Sienge Planejamento)
│   ├── /orcamento                 ← Orçamento SINAPI/TCPO vs real
│   ├── /contratos                 ← Contratos de empreitada + medições
│   └── /almoxarifado              ← Estoque real (Sienge)
├── /suprimentos
│   └── /cotacoes                  ← Cotações de preço + respostas fornecedores
├── /financeiro
│   ├── /contas-pagar              ← AP do Sienge
│   ├── /recebimentos              ← AR do Sienge + inadimplência
│   ├── /caixa                     ← Saldos bancários reais
│   ├── /gastos-obra               ← Relatório gastos com rateio
│   └── /balancete                 ← Balancete de verificação
├── /comercial                     ← Módulo novo
│   ├── /mapa                      ← Mapa imobiliário
│   ├── /contratos                 ← Contratos de venda
│   ├── /locacoes                  ← Locação de imóveis
│   └── /comissoes                 ← Comissões corretores
└── /patrimonio                    ← Bens imóveis e móveis
```

---

## Modelo de Negócio Atualizado

### Posicionamento Competitivo Revisado

| Produto | Preço | O que faz | Gap |
|---|---|---|---|
| Diário de Obras | R$ 160/mês | Só RDO | Sem Sienge |
| Hinc | R$ 1.000/mês | 3 dashboards fixos | Sem integração ERP |
| **Construpoint** | **~R$ 2.000/mês** | **Campo + Sienge** | **Concorrente direto** |
| Sienge completo | R$ 2.500+/mês | ERP completo | Complexo, desktop |
| **Concretiza** | **R$ 349–800/mês** | **Campo + Sienge completo + IA** | **Melhor custo-benefício** |

### Novos Planos (revisão para Fase 2)

| Plano | Preço | Módulos Sienge | Público |
|---|---|---|---|
| **Básico** | R$ 199/mês | Importar obras/fornecedores, ver pedidos | Sem Sienge ou uso básico |
| **Profissional** | R$ 349/mês | Fase 2A+2B completo (campo + suprimentos + financeiro) | Construtoras com Sienge |
| **Enterprise** | R$ 800/mês | Tudo: 2A+2B+2C+2D + BI + multi-empresa + IA | Grupos construtores |

---

## Fase 2 — Sequência de Implementação

### 2A — Campo + Integração Core (próximo sprint)
1. Medição de Obra + avanço físico → Sienge
2. Lista de Tarefas com % (Sienge Planejamento)
3. Vínculo Equipe ↔ Credores Sienge
4. Webhook listener (`POST /api/sienge/webhook`)
5. RDO Bidirecional (Concretiza → Sienge ao finalizar)

### 2B — Suprimentos + Financeiro
6. Cotações de Preço (visualização + respostas)
7. Solicitações e Pedidos bidirecionais + autorização mobile
8. Contratos de Suprimentos + Medições
9. Estoque real do Sienge (almoxarifado)
10. Contas a Pagar / Receber (visualização)
11. Saldos Bancários reais
12. Relatório Gastos por Obra (com rateio proporcional)

### ✅ 2C — Comercial + Patrimônio (Sprint 3D)
13. ✅ Mapa Imobiliário (disponibilidade de unidades)
14. ✅ Contratos de Venda + parcelas
15. ✅ Locação de Imóveis
16. ✅ Comissões de Corretores
17. ✅ Patrimônio (bens imóveis e móveis)
18. ✅ Balancete de Verificação

### 2D — BI + IA + Mobile
17. ✅ Dashboards BI customizáveis (14 Bulk Data endpoints)
18. ✅ Claude API integrada (assistente + alertas inteligentes)
19. App nativo iOS + Android (React Native/Expo)
20. Email notifications
21. Integração Construcompras-style
22. Multi-empresa (painel consolidado Enterprise)

---

## Análise Competitiva — Features do Diário de Obra App

> Análise feita em 10/03/2026 com base em scraping completo do web.diariodeobra.app (cliente SLN Construtora).
> **Principal lição:** app simples, funcional, sem floreios — cada feature resolve uma dor real do campo.

### O que eles fazem bem (que devemos aprender)
- Estrutura hierárquica de tarefas com % de avanço por setor/subsetor — o engenheiro vê exatamente onde está cada serviço
- Presença de mão de obra com status granular — saber o *motivo* da ausência (atestado vs folga vs viagem) é informação de gestão
- Copiar RDO de data específica — na prática, a obra repete muito. Copiar economiza 15 minutos por relatório
- Predefinir equipe/equipamentos por obra — sem essa feature, o usuário digita as mesmas 20 pessoas todo dia
- Assinaturas digitais — formaliza o relatório, elimina papel, necessário para obras públicas (contratos FNDE, prefeituras)
- Checklist personalizável — mais simples que FVS, mais rápido de usar no campo
- Prazo contratual no RDO — o dado já existe na obra; exibi-lo no relatório é trabalho mínimo, valor máximo

---

### FASE 1.5 — Quick Wins (features simples, alto impacto, não exigem Sienge)

#### ✅ Grupos de Obra (Sprint 3C)
**Implementado:** `grupo String?` no schema `Obra`, `obra.criar/atualizar` aceitam grupo, formulário `/obras/nova` tem campo "Grupo / Regional", lista `/obras` tem filtro por grupo com botões dinâmicos extraídos de todas as obras.

#### ✅ Status de Ausência Detalhado na Equipe/RDO (Sprint 3C)
**Implementado:** Enum `StatusPresencaMO` com 10 valores (PRESENTE, AFASTADO, ATESTADO, DESLOCANDO, FALTA_JUSTIFICADA, FERIAS, FOLGA, LICENCA, TREINAMENTO, VIAGEM). `RDOEquipe.statusPresenca`, dropdown no formulário RDO novo, badges coloridos no detalhe do RDO.

#### ✅ Copiar RDO de Data Específica (Sprint 3C)
**Implementado:** Dropdown "Copiar de RDO anterior" no formulário do RDO novo. Mostra todos os RDOs históricos da obra com data + preview da primeira atividade. Limite `.slice(0, 15)` removido — mostra histórico completo.

#### ✅ Prazo Contratual no Cabeçalho do RDO (Sprint 3C)
**Implementado:** `numContrato String?` e `prazoContratualDias Int?` em `Obra`. Campos no formulário de criação/edição de obra. RDO detail exibe seção de prazo com dias decorridos, barra de progresso, dias a vencer.

#### ✅ Log de Visualizações no Relatório (Sprint anterior)
**Implementado:** `RDO.visualizacoes Int @default(0)`. Procedure `rdo.registrarVisualizacao` (incrementa com validação de empresa). Contagem exibida no rodapé do detalhe do RDO.

---

### FASE 1.5 — Médio Porte

#### ✅ Predefinir Mão de Obra e Equipamentos por Obra (Sprint 3C)
**Implementado:** `equipePredef Json?` + `equipamentosPredef Json?` em `Obra`. `obra.salvarEquipePredef` + `obra.salvarEquipamentosPredef`. Página `/obras/[id]/configuracoes` com seções editáveis para equipe padrão (funcao + qtd) e equipamentos padrão (nome + qtd). RDO novo tem botão "Carregar equipe padrão". Sidebar obra nav tem link "Configurações".

#### ✅ Assinaturas Digitais no RDO (Sprint 3C)
**Implementado:** Model `AssinaturaRDO { id, rdoId, label, imagemUrl, ordem }`. `AssinaturaCanvas` component (draw + upload + view modes). `rdo.salvarAssinaturas`. Seção de assinaturas no detalhe do RDO com canvas interativo touch+mouse.

#### ✅ Materiais Recebidos e Utilizados no RDO (Sprint anterior)
**Implementado:** Models `RDOMaterialRecebido` + `RDOMaterialUtilizado`. Procedure `rdo.salvarMateriais` (transação atômica). Seção "Materiais do dia" no detalhe do RDO com duas sub-seções (Recebidos: nome/qtd/unidade/fornecedor; Utilizados: nome/qtd/unidade/localAplicado).

#### ✅ Checklist Personalizável por Obra (Sprint 2C)
**Implementado:** Models `TemplateChecklist`, `ItemTemplateChecklist`, `RespostaChecklist`, `ItemRespostaChecklist`. Router `checklist` completo (CRUD templates + respostas). Páginas `/obras/[id]/checklist` (lista), `/novo` (pick template), `/[respostaId]` (preencher + assinar). `/configuracoes/checklists` para CRUD de templates. Assinatura digital no checklist via `AssinaturaCanvas`. Tab "Checklist" no `ObraTabs`.

---

### FASE 2 — Mais Complexo (mas alto valor)

#### ✅ Campos Personalizados no RDO (Sprint 2E)
**O que faz:** A empresa pode adicionar campos extras ao RDO:
- Em "Atividades": campos extras além de descrição/horas (ex: "Quantidade de sacos de cimento", "Trecho executado")
- Em "Ocorrências do dia": campos extras além de tipo/descrição
- Em "Comentários": seções nomeadas customizáveis
**Por que:** Cada construtora tem seus próprios campos de controle. Ao invés de criar tela genérica, permite customização.
**Esforço:** Alto — sistema de campos dinâmicos (JSON schema ou EAV), renderização dinâmica no formulário e PDF.
**Schema:** `camposPersonalizados Json?` em `Empresa` para config + `valoresCamposPersonalizados Json?` em `RDO`

#### ✅ Galeria Centralizada Cross-Obra (Fotos + Vídeos) (Sprint anterior)
**Implementado:** `/analises/galeria` — filtros por tipo (Tudo/Fotos/Vídeos) e por obra, lightbox modal, paginação (30 itens/página), contagem e data de upload por item.

#### ✅ Histograma de Mão de Obra (Sprint 3E)
**Implementado:** `/analises/mao-de-obra` — KPIs (registros, presentes, ausências, funções únicas), AreaChart evolução mensal, BarChart empilhado por função, PieChart breakdown por StatusPresencaMO. Filtro por obra. Tab nav "Indicadores | Mão de Obra | Galeria" em `/analises`.

#### ✅ Modelos de Relatório Customizáveis (Sprint 3E)
**Implementado:** Schema `ModeloRelatorio` (Prisma), router `modeloRelatorio` (listar/criar/atualizar/excluir), página CRUD em `/configuracoes/modelos-relatorio` com 9 toggles de seções (equipe, atividades, equipamentos, ocorrencias, materiais, clima, fotos, assinaturas, camposPersonalizados). Card adicionado em `/configuracoes`.

---

### Resumo de Prioridades — Fase 1.5

| Feature | Esforço | Impacto | Status |
|---|---|---|---|
| Grupos de Obra | Baixo | Alto | ✅ Sprint 3C |
| Status ausência MO | Baixo | Alto | ✅ Sprint 3C |
| Copiar RDO de data específica | Mínimo | Alto | ✅ Sprint 3C |
| Prazo contratual no RDO | Mínimo | Alto (obras públicas) | ✅ Sprint 3C |
| Log de visualizações | Baixo | Médio | ✅ Sprint anterior |
| Predefinir equipe/equipamentos | Médio | Muito Alto | ✅ Sprint 3C |
| Assinaturas digitais | Médio-Alto | Muito Alto (obras públicas) | ✅ Sprint anterior |
| Materiais no RDO | Médio | Alto | ✅ Sprint anterior |
| Checklist personalizável | Médio | Alto | ✅ Sprint 2C |
| Campos personalizados RDO | Alto | Médio | ✅ Sprint 2E |
| Galeria cross-obra | Médio | Alto | ✅ Sprint anterior |
| Histograma MO | Médio | Médio | ✅ Sprint 3E |
| Modelos customizáveis | Alto | Médio | ✅ Sprint 3E |

---

## API Sienge — Mapa Completo (Pesquisa Oficial)

> Fonte: https://api.sienge.com.br/docs + YAML files oficiais (37 arquivos lidos)
> URL base: `https://{subdominio}.api.sienge.com.br/public/api/v1`
> Autenticação: HTTP Basic Auth com usuário API (não é o login da plataforma)
> Rate limit: 200 req/min REST · 20 req/min Bulk Data

---

### Endpoints Completos por Módulo

#### Credores (Fornecedores) — 17 endpoints
```
GET    /creditors                                            Lista (filtros: cpf, cnpj, nome)
POST   /creditors                                            Cria credor
✅ GET    /creditors/{id}                                       Busca por ID
PATCH  /creditors/{id}                                       Atualiza dados
GET    /creditors/{id}/bank-informations                     Dados bancários
✅ POST   /creditors/{id}/bank-informations                     Insere conta bancária
✅ PATCH  /creditors/{id}/bank-informations/{bid}               Atualiza conta bancária
GET    /creditors/{id}/pix-informations                      Dados PIX
✅ POST   /creditors/{id}/pix-informations                      Insere chave PIX
✅ PATCH  /creditors/{id}/pix-informations/{pid}                Atualiza chave PIX
✅ PATCH  /creditors/{id}/phone/{phoneId}                       Atualiza telefone
✅ PATCH  /creditors/{id}/contact/{contactId}                   Atualiza contato
✅ PATCH  /creditors/{id}/procurator/{procuratorId}             Atualiza procurador
✅ PUT    /creditors/{id}/agents                                Atualiza representantes
✅ PUT    /creditors/{id}/payslip-desoneration-years            Anos de desoneração de folha
PUT    /creditors/{id}/activate                              Ativa credor
PUT    /creditors/{id}/deactivate                            Desativa credor
```
**Novidades vs SDK:** banco/PIX, ativação/desativação, representantes, desoneração

#### Clientes — 12 endpoints
```
GET    /customers                                            Lista (cpf, cnpj, enterpriseId)
✅ POST   /customers                                            Cria cliente
✅ GET    /customers/{id}                                       Busca por ID
✅ PATCH  /customers/{id}                                       Atualiza dados
✅ PUT    /customers/{id}/phones                                Sobrescreve telefones
✅ PUT    /customers/{id}/spouse                                Atualiza cônjuge
✅ PUT    /customers/{id}/familyIncomes                         Atualiza renda familiar
✅ PUT    /customers/{id}/addresses/{type}                      Atualiza endereço (C/R)
✅ GET    /customers/{id}/attachments                           Lista anexos
✅ POST   /customers/{id}/attachments                           Upload de anexo (max 70MB)
✅ GET    /customers/{id}/attachments/{aid}                     Download de anexo
✅ POST   /customers/{id}/procurator                            Adiciona procurador
```
**Novidades vs SDK:** cônjuge, renda familiar, endereços, anexos, procuradores

#### Contratos de Venda — 14 endpoints
```
GET    /sales-contracts                                      Lista contratos
✅ POST   /sales-contracts                                      Cria contrato
✅ GET    /sales-contracts/{id}                                 Busca por ID
✅ PATCH  /sales-contracts/{id}                                 Atualiza
✅ DELETE /sales-contracts/{id}                                 Exclui
✅ POST   /sales-contracts/{id}/cancellation                    Cancela contrato
✅ GET    /sales-contracts/{id}/attachments                     Lista anexos
✅ POST   /sales-contracts/{id}/attachments                     Upload de anexo
✅ GET    /sales-contracts/{id}/attachments/{aid}               Download0,
✅ GET    /sales-contracts/{id}/guarantors                      Lista avalistas
✅ POST   /sales-contracts/{id}/guarantors                      Adiciona avalistas
✅ GET    /sales-contracts/{id}/guarantors/{gid}                Busca avalista
✅ PATCH  /sales-contracts/{id}/guarantors/{gid}                Atualiza avalista
✅ PUT    /sales-contracts/{id}/guarantors/{gid}/phones         Telefones do avalista
```
**Novidades vs SDK:** cancelamento, avalistas, anexos, exclusão

#### Comissões de Venda — 18 endpoints
```
GET    /commissions                                          Lista parcelas de comissão
✅ POST   /commissions                                          Cria comissão
✅ GET    /commissions/{id}                                     Busca por ID
✅ PATCH  /commissions/{id}                                     Altera comissão
✅ DELETE /commissions/{id}                                     Deleta comissão
✅ PATCH  /commissions/authorize                                Autoriza parcelas
✅ PATCH  /commissions/cancel                                   Cancela parcelas
✅ POST   /commissions/release                                  Libera parcelas
✅ GET    /commissions/countFilters                             Totalizador por situação
✅ POST   /commissions/{id}/brokers                             Adiciona corretores
✅ DELETE /commissions/{id}/brokers/{cid}                       Remove corretor
✅ GET    /commissions/configurations/brokers                   Config de corretores
✅ POST   /commissions/configurations/brokers                   Cria config de corretor
✅ PATCH  /commissions/configurations/brokers/{id}             Atualiza config
✅ DELETE /commissions/configurations/brokers/{id}             Deleta config
✅ GET    /commissions/configurations/enterprises/{id}         Config de empreendimento
✅ POST   /commissions/configurations/enterprises              Cria config
✅ PUT    /commissions/configurations/enterprises/{id}         Atualiza config
```
**Novidades vs SDK:** módulo inteiramente novo — gestão completa de comissões

#### Unidades de Imóveis — 13 endpoints
```
GET    /units                                                Lista unidades
✅ POST   /units                                                Cria unidade
✅ GET    /units/{id}                                           Busca por ID
✅ PATCH  /units/{id}                                           Atualiza
✅ POST   /units/{id}/child-unit                                Adiciona unidades filhas
✅ PUT    /units/{id}/address                                   Atualiza endereço
✅ GET    /units/{id}/groupings                                 Busca agrupamentos
✅ POST   /units/{id}/attachments                               Upload de anexo
✅ GET    /units/characteristics                                Lista características
✅ POST   /units/characteristics                                Cria característica
✅ PUT    /units/{id}/characteristics                           Vincula características
✅ GET    /units/situations                                     Lista situações
✅ POST   /units/situations                                     Cria situação
```
**Novidades vs SDK:** unidades filhas, endereço, características, situações

#### Contas a Pagar — ~40 endpoints
```
GET    /bills                                                Lista títulos (startDate, endDate, creditorId, costCenterId)
POST   /bills                                                Insere título
✅ GET    /bills/by-change-date                                 Títulos por data de alteração
✅ GET    /bills/{id}                                           Busca título
✅ PATCH  /bills/{id}                                           Atualiza título
✅ POST   /eletronic-invoice-bills                              Cria título a partir de NF-e recebida
✅ GET    /bills/{id}/installments                              Lista parcelas
✅ PATCH  /bills/{id}/installments/{iid}                        Atualiza parcela
✅ GET    /bills/{id}/taxes                                     Impostos do título
✅ GET    /bills/{id}/budget-categories                         Apropriações financeiras (rateio)
✅ GET    /bills/{id}/departments-cost                          Apropriações por departamento
✅ GET    /bills/{id}/buildings-cost                            Apropriações por obra
✅ PUT    /bills/{id}/buildings-cost                            Atualiza apropriações por obra
✅ GET    /bills/{id}/units                                     Unidades do título
✅ PUT    /bills/{id}/units                                     Atualiza unidades
✅ POST   /bills/{id}/attachments                               Upload de anexo
✅ GET    /bills/{id}/attachments                               Lista anexos
✅ GET    /bills/{id}/attachments/{aid}                         Download de anexo
✅ POST   /bills/{id}/tax-information                           Info fiscal (Serviço)
✅ POST   /bills/{id}/tax-information/items                     Item nas info fiscais
-- Formas de pagamento por parcela (10 tipos) --
✅ PATCH/GET .../payment-information/bank-transfer              Transferência bancária
✅ PATCH/GET .../payment-information/boleto-bancario            Boleto bancário
✅ PATCH/GET .../payment-information/boleto-concessionaria      Boleto concessionária
✅ PATCH/GET .../payment-information/boleto-tax                 Boleto tributo (código de barras)
✅ PATCH/GET .../payment-information/dda                        DDA (débito direto autorizado)
✅ PATCH/GET .../payment-information/darf-tax                   DARF
✅ PATCH/GET .../payment-information/darj-tax                   DARJ
✅ PATCH/GET .../payment-information/fgts-tax                   FGTS
✅ PATCH/GET .../payment-information/gare-tax                   GARE
✅ PATCH/GET .../payment-information/inss-tax                   INSS
✅ PATCH/GET .../payment-information/pix                        PIX
```
**Novidades vs SDK:** formas de pagamento por parcela (PIX, boleto, DDA, DARF, FGTS, GARE, INSS), anexos, apropriações

#### Pedidos de Compra — 19 endpoints
```
GET    /purchase-orders                                      Lista pedidos
✅ GET    /purchase-orders/{id}                                 Busca pedido
✅ GET    /purchase-orders/{id}/items                           Itens do pedido
✅ GET    /purchase-orders/{id}/items/{n}                       Item específico
✅ GET    /purchase-orders/{id}/items/{n}/delivery-schedules    Previsões de entrega
✅ GET    /purchase-orders/{id}/items/{n}/buildings-appropriations   Apropriações por obra
✅ GET    /purchase-orders/{id}/totalization                    Totalização
✅ GET    /purchase-orders/{id}/direct-billing                  Faturamento direto
PUT    /purchase-orders/{id}/authorize                       Autoriza pedido
PATCH  /purchase-orders/{id}/authorize                       Autoriza com observação
✅ PUT    /purchase-orders/{id}/disapprove                      Reprova pedido
✅ PATCH  /purchase-orders/{id}/disapprove                      Reprova com observação
✅ GET    /purchase-orders/{id}/attachments                     Lista anexos
✅ POST   /purchase-orders/{id}/attachments                     Upload de anexo
✅ GET    /purchase-orders/{id}/attachments/{n}                 Download de anexo
GET    /purchase-orders/{id}/supplier-evaluation-criteria    Critérios de avaliação
POST   /purchase-orders/{id}/evaluation                      Cadastra avaliação do fornecedor
PUT    /purchase-orders/{id}/evaluation                      Cria/atualiza avaliação
GET    /purchase-orders/{id}/analysis/pdf                    Gera PDF de análise do pedido
```
**Novidades vs SDK:** reprovar pedido, avaliação de fornecedor, PDF de análise, previsões de entrega por item, anexos

#### Solicitações de Compra — 13 endpoints
```
POST   /purchase-requests                                    Cria solicitação
✅ GET    /purchase-requests/{id}                               Busca solicitação
✅ PATCH  /purchase-requests/{id}/authorize                     Autoriza todos os itens
✅ PATCH  /purchase-requests/{id}/disapproval                   Reprova todos os itens
✅ GET    /purchase-requests/all/items                          Lista todos os itens (vários filtros)
✅ GET    /purchase-requests/{id}/items/{n}/buildings-appropriations   Apropriações do item
✅ GET    /purchase-requests/{id}/items/{n}/delivery-requirements     Requisitos de entrega
✅ POST   /purchase-requests/{id}/items                         Cria itens na solicitação
✅ PATCH  /purchase-requests/{id}/items/authorize               Autoriza itens específicos
✅ PATCH  /purchase-requests/{id}/items/{n}/authorize           Autoriza item específico
✅ PATCH  /purchase-requests/{id}/items/{n}/disapproval         Reprova item específico
✅ GET    /purchase-requests/{id}/attachments                   Lista anexos
✅ GET    /purchase-requests/{id}/attachments/{n}               Download de anexo
```
**Novidades vs SDK:** autorização/reprovação granular por item, criar itens, requisitos de entrega, listagem geral de itens

#### Cotações de Preço — 10 endpoints
```
POST   /purchase-quotations                                  Cria cotação
✅ GET    /purchase-quotations/all/negotiations                 Lista negociações em andamento
GET    /purchase-quotations/comparison-map/pdf               PDF do mapa comparativo de cotações
✅ POST   /purchase-quotations/{id}/items                       Cria item de cotação
✅ POST   /purchase-quotations/{id}/items/from-purchase-request Cria item a partir de solicitação
✅ POST   /purchase-quotations/{id}/items/{n}/suppliers         Inclui fornecedor no item
✅ POST   /purchase-quotations/{id}/suppliers/{sid}/negotiations         Nova negociação
✅ PATCH  /purchase-quotations/{id}/suppliers/{sid}/negotiations/latest/authorize  Autoriza negociação
✅ PUT    /purchase-quotations/{id}/suppliers/{sid}/negotiations/{n}               Atualiza negociação
✅ PUT    /purchase-quotations/{id}/suppliers/{sid}/negotiations/{n}/items/{i}     Atualiza item de negociação
```
**Novidades vs SDK:** criar cotação, criar itens, incluir fornecedores, negociar, PDF comparativo

#### NF-e (Notas Fiscais Eletrônicas) — 15 endpoints GET
```
GET    /nfes                                                 Lista NF-es por período
GET    /nfes/{chave}                                         Busca NF-e pela chave de acesso
✅ GET    /nfes/{chave}/issuers-recipients                      Emitente e destinatário
✅ GET    /nfes/{chave}/payments                                Formas de pagamento da nota
✅ GET    /nfes/{chave}/deliveries                              Local de entrega/retirada
✅ GET    /nfes/{chave}/linked-nfes                             Notas referenciadas
✅ GET    /nfes/{chave}/icms                                    ICMS total
✅ GET    /nfes/{chave}/carriers                                Informações de transporte
✅ GET    /nfes/{chave}/issqn                                   ISSQN total
GET    /nfes/{chave}/itens                                   Produtos/itens da nota
✅ GET    /nfes/{chave}/itens/{id}/ipi                          IPI do item
✅ GET    /nfes/{chave}/itens/{id}/pis-cofins                   PIS-COFINS do item
✅ GET    /nfes/{chave}/itens/{id}/simplified-icms              ICMS Simples Nacional
✅ GET    /nfes/{chave}/itens/{id}/issqn                        ISSQN do item
✅ GET    /nfes/{chave}/itens/{id}/icms                         ICMS do item
```
**Novidades vs SDK:** dados fiscais completos (ICMS, IPI, PIS-COFINS, ISSQN), transporte, pagamentos, notas referenciadas

#### Estoque — 9 endpoints
```
GET    /stock-inventories/{costCenterId}/items               Insumos no estoque do CC
✅ GET    /stock-inventories/{cid}/items/{rid}/building-appropriation  Apropriações de obra
GET    /stock-reservations                                   Lista reservas consistentes
✅ GET    /stock-reservations/{id}/items                        Itens da reserva
POST   /stock-reservations/{id}/movements                    Movimento que atende reserva
POST   /stock-movements                                      Entrada ou saída
POST   /stock-movements/transfer                             Transferência entre CCs/obras
✅ GET    /inventory-movements                                  Lista movimentações (datas, obra)
✅ GET    /inventory-movements/{id}                             Busca movimentação específica
```
**Novidades vs SDK:** reservas de estoque, transferência entre obras

#### Diário de Obra — 16 endpoints
```
GET    /construction-daily-report                            Lista diários
POST   /construction-daily-report                            Cadastra diário completo
✅ GET    /construction-daily-report/{bid}/{did}                Busca diário específico
✅ DELETE /construction-daily-report/{bid}/{did}                Deleta diário
✅ POST   /construction-daily-report/{bid}/{did}/attachments    Inclui anexo
✅ GET    /construction-daily-report/{bid}/{did}/attachments/{aid}  Download de anexo
✅ POST   /construction-daily-report/{bid}/{did}/events         Inclui ocorrências
✅ PUT    /construction-daily-report/{bid}/{did}/events         Atualiza ocorrências
✅ POST   /construction-daily-report/{bid}/{did}/tasks          Inclui tarefas
✅ PUT    /construction-daily-report/{bid}/{did}/tasks          Atualiza tarefas
✅ POST   /construction-daily-report/{bid}/{did}/crews          Inclui equipes
✅ PUT    /construction-daily-report/{bid}/{did}/crews          Atualiza equipes
✅ POST   /construction-daily-report/{bid}/{did}/equipments     Inclui equipamentos
✅ PUT    /construction-daily-report/{bid}/{did}/equipments     Atualiza equipamentos
✅ GET    /construction-daily-report/event-type                 Tipos de ocorrência
✅ GET    /construction-daily-report/types                      Todos os tipos disponíveis
```
**Novidades vs SDK:** sub-recursos granulares (ocorrências, tarefas, equipes, equipamentos separados), tipos disponíveis, delete, anexos

#### Orçamento de Obra — 6 endpoints
```
GET    /building-cost-estimations/{bid}/resources            Insumos ativos do orçamento
✅ POST   /building-cost-estimations/{bid}/resources            Adiciona insumo
✅ GET    /building-cost-estimations/{bid}/resources/{id}       Busca insumo específico
✅ PATCH  /building-cost-estimations/{bid}/resources/{id}       Atualiza código auxiliar
✅ GET    /building-cost-estimations/{bid}/sheets               Planilhas da versão atual
GET    /building-cost-estimations/{bid}/sheets/{uid}/items   Itens de planilha específica
```
**Novidades vs SDK:** adicionar insumos, planilhas do orçamento, itens por planilha

#### Planejamento de Obra — 2 endpoints (estrutura de dados)
```
GET    /building-projects/{bid}/sheets/{uid}/tasks           Lista tarefas da planilha
✅ PUT    /building-projects/{bid}/sheets/{uid}/tasks           Insere tarefas em nova versão
```

#### Contratos de Suprimentos — 8 endpoints
```
GET    /supply-contracts                                     Lista contratos
✅ GET    /supply-contracts/all                                 Todos os contratos
✅ GET    /supply-contracts/items                               Itens vinculados
✅ GET    /supply-contracts/buildings                           Obras associadas
✅ GET    /supply-contracts/measurements/all                    Todas as medições
✅ GET    /supply-contracts/measurements/items                  Itens das medições
✅ GET    /supply-contracts/measurements/clearing               Informações de compensação
✅ POST   /supply-contracts/measurements                        Cria nova medição
```

#### Notas Fiscais de Compra — 7 endpoints
```
GET    /purchase-invoices                                    Lista NFs de compra
✅ POST   /purchase-invoices                                    Cadastra NF
✅ GET    /purchase-invoices/{id}                               Consulta NF
✅ GET    /purchase-invoices/{id}/items                         Itens da NF
✅ GET    /purchase-invoices/{id}/items/{n}/buildings-appropriations  Apropriações de obra
✅ POST   /purchase-invoices/{id}/items/purchase-orders/delivery-schedules  Entregas de pedidos
✅ GET    /purchase-invoices/deliveries-attended                Lista entregas atendidas (pedido x NF)
```
**Novidades vs SDK:** entregas atendidas (vínculo pedido × NF)

#### Contas a Receber — 5 endpoints
```
GET    /accounts-receivable/receivable-bills                 Busca títulos (customerId obrigatório)
✅ GET    /accounts-receivable/receivable-bills/{id}            Busca título por número
✅ GET    /accounts-receivable/receivable-bills/{id}/installments  Parcelas (portadores inc/exc)
✅ PATCH  /accounts-receivable/receivable-bills/{id}/installments/{iid}/change-due-date  Altera vencimento
✅ GET    /accounts-receivable/{id}/budget-categories           Apropriações financeiras
```

#### Extrato de Cliente — 3 endpoints
```
✅ GET    /customer-financial-statements                        Extrato (customerId obrigatório)
✅ POST   /customer-financial-statements                        Envia por e-mail
GET    /customer-financial-statements/pdf                    Link de download PDF (expira 5min)
```

#### IR — Imposto de Renda — 2 endpoints
```
✅ POST   /customer-income-tax/report                           Envia relatório de IR por e-mail
GET    /customer-income-tax/report/pdf                       Link de download do PDF IR
```

#### Mapa Imobiliário — 1 endpoint
```
GET    /real-estate-map                                      Mapa consolidado (costCentersId, datas obrigatórios)
```

#### Reservas de Unidades — 2 endpoints
```
✅ POST   /unit-bookings                                        Reserva unidade
✅ PATCH  /unit-bookings/units/{id}/deactivate                  Inativa reserva
```
**Novidades vs SDK:** criar e inativar reservas

#### Locação de Imóveis — 2 endpoints
```
GET    /property-rental                                      Lista contratos de locação
✅ POST   /property-rental                                      Cria contrato de locação
```
**Novidades vs SDK:** criar locação

#### Lançamentos Contábeis — 4 endpoints
```
✅ GET    /accountancy/entries                                  Busca lançamentos (companyId obrigatório)
✅ POST   /accountancy/entries                                  Salva lançamentos (array)
✅ POST   /accountancy/entries/async                            Salva assincronamente
✅ GET    /accountancy/entries/async/status                     Status do processamento assíncrono
```
**Novidades vs SDK:** endpoint assíncrono para lançamentos em massa

#### Gerenciamento de Webhooks — 4 endpoints
```
GET    /hooks                                                Lista webhooks configurados
POST   /hooks                                                Cria webhook
✅ GET    /hooks/{id}                                           Busca por UUID
DELETE /hooks/{id}                                           Remove webhook
```

---

### Bulk Data — 12 endpoints
```
✅ /bulk-data/v1/purchase-quotations               Cotações completas com negociações
✅ /bulk-data/v1/customer-extract-history          Histórico de extrato de clientes
✅ /bulk-data/v1/invoice-itens                     Itens de NFs (NF-e, NFS-e, CP/CR)
✅ /bulk-data/v1/bill-payables-installments        Parcelas CP em massa
✅ /bulk-data/v1/bank-movements                    Movimentos de caixa/bancos
✅ /bulk-data/v1/sales-contracts                   Contratos de venda em massa
✅ /bulk-data/v1/building-resources                Insumos/recursos de obra
✅ /bulk-data/v1/budget-items                      Itens de orçamento em massa
✅ /bulk-data/v1/defaulters                        Inadimplentes
✅ /bulk-data/v1/account-balances                  Saldos contábeis por empresa/CC
✅ /bulk-data/v1/receivable-installments           Parcelas a receber em massa
✅ /bulk-data/v1/business-budgets                  Orçamentos empresariais
```

**Suporte a processamento assíncrono em todas as Bulk APIs:**
```
?_async=true                      Processa em background
?_asyncChunkMaxSize=<kb>          Tamanho por chunk
?_asyncWebHookUrl=<url>           Notifica quando concluído       
✅ GET /bulk-data/v1/async/{id}                     Status do processamento
✅ GET /bulk-data/v1/async/{id}/result/{chunk}      Resultado por chunk
```

---

### Catálogo Completo de Eventos Webhook (60+ eventos)

#### Clientes
`CUSTOMER_CREATED` · `CUSTOMER_UPDATED` · `CUSTOMER_REMOVED` · `CUSTOMER_DISABLED` · `CUSTOMER_ENABLED`

#### Contratos de Venda
`SALES_CONTRACT_CREATED` · `SALES_CONTRACT_UPDATED` · `SALES_CONTRACT_REMOVED` · `SALES_CONTRACT_ISSUED` · `SALES_CONTRACT_CANCELED`

#### Locação de Imóveis
`PROPERTY_RENTAL_CREATED` · `PROPERTY_RENTAL_UPDATED` · `PROPERTY_RENTAL_EXCLUDED` · `PROPERTY_RENTAL_CANCELLED` · `PROPERTY_RENTAL_TERMINATED` · `PROPERTY_RENTAL_ISSUED` · `PROPERTY_RENTAL_REACTIVATED` · `PROPERTY_RENTAL_TERMINATION_EXCLUDED`

#### Unidades
`UNIT_CREATED` · `UNIT_UPDATED` · `UNIT_REMOVED`

#### Comissões
`SALES_COMMISSION_CREATED` · `SALES_COMMISSION_INSTALLMENTS_AUTHORIZED` · `SALES_COMMISSION_INSTALLMENTS_CANCELED` · `SALES_COMMISSION_INSTALLMENTS_RELEASED` · `SALES_COMMISSION_RELEASES_EXCLUDED` · `SALES_COMMISSION_EXCLUDED`

#### Empreendimentos
`COST_CENTER_CREATED` · `COST_CENTER_UPDATED` · `COST_CENTER_REMOVED` · `ENTERPRISE_ID_UPDATED`

#### Solicitações de Compra
`PURCHASE_REQUEST_ITEM_AUTHORIZATION_UPDATE` · `PURCHASE_REQUEST_ITEM_CREATED` · `PURCHASE_REQUEST_ITEM_UPDATED` · `PURCHASE_REQUEST_ITEM_DELETED` · `PURCHASE_REQUEST_DELETED` · `PURCHASE_REQUEST_UPDATED`

#### Cotações
`PURCHASE_QUOTATION_NEGOTIATION_AUTHORIZATION_CHANGED`

#### Pedidos de Compra
`PURCHASE_ORDER_AUTHORIZATION_CHANGED` · `PURCHASE_ORDER_GENERATED_FROM_NEGOCIATION` · `PURCHASE_ORDER_ITEM_MODIFIED` · `PURCHASE_ORDER_FINANCIAL_FORECAST_UPDATED`

#### Estoque
`INVENTORY_MOVEMENT_CREATED` · `INVENTORY_MOVEMENT_UPDATED` · `INVENTORY_MOVEMENT_DELETED`

#### Contas a Receber
`RECEIVABLE_INSTALLMENT_CREATED` · `RECEIVABLE_INSTALLMENT_UPDATED` · `RECEIVABLE_INSTALLMENT_REMOVED` · `ASSIGNMENT_RIGHTS_AGREEMENT_UPDATED` · `UPDATE_RECEIVABLE_BILL_SITUATION`

#### Entrega de Chaves
`KEYS_HANDOVER_CREATED` · `KEYS_HANDOVER_EXCLUDED`

#### Baixas Recebidas (CR)
`RECEIPT_PROCESSED`

#### Contas a Pagar
`PAYMENT_BILL_UPDATED` · `PAYMENT_INSTALLMENT_CREATED` · `PAYMENT_INSTALLMENT_UPDATE` · `PAYMENT_INSTALLMENT_REMOVED` · `PAYMENT_AUTHORIZATION_AVAILABLE` · `PAYMENT_AUTHORIZATION_UPDATE`

#### Baixas Pagas (CP)
`PAYMENT_RECEIPT_PROCESSED` · `PAYMENT_RECEIPT_UPDATED` · `PAYMENT_RECEIPT_REMOVED` · `PAYMENT_RECEIPT_CHARGEBACK_PROCESSED` · `PAYMENT_RECEIPT_CHARGEBACK_REMOVED`

#### Movimentos Bancários
`BANK_MOVEMENT_CREATED` · `BANK_MOVEMENT_UPDATED` · `BANK_MOVEMENT_DELETED`

#### Cobrança
`BOOK_COLLECTION_CONFIRMED` · `COLLECTION_NOTIFIED` · `PAYMENT_SLIP_REGISTERED`

#### Contratos de Suprimentos
`CONTRACT_UNAUTHORIZED` · `CONTRACT_AUTHORIZED`

#### Medições de Contratos
`MEASUREMENT_AUTHORIZED` · `MEASUREMENT_UNAUTHORIZED`

#### Liberação de Medição
`CLEARING_FINISHED` · `CLEARING_DELETED`

#### Orçamento
`BUILDING_COST_ESTIMATIONS_VERSION_CREATED` · `BUILDING_COST_ESTIMATION_UPDATED`

#### Recursos/Serviços
`RESOURCE_CREATED` · `WORKITEM_CREATED`

#### Obras
`BUILDING_STATUS_UPDATED` · `BUILDING_COST_ESTIMATION_STATUS_UPDATED`

#### Contabilidade
`ACCOUNTANCY_ACCOUNT_UPDATED` · `ACCOUNTANCY_ACCOUNT_CREATED` · `ACCOUNTANCY_ACCOUNT_DELETED` · `ACCOUNTANCY_CLOSING_CREATED`

#### Diário de Obra
`CONSTRUCTION_DAILY_REPORT_TYPE_CREATED` · `CONSTRUCTION_DAILY_REPORT_TYPE_UPDATED` · `CONSTRUCTION_DAILY_REPORT_TYPE_DELETED`

---

### Módulos Confirmados SEM API Pública

| Módulo | Situação |
|---|---|
| RH / Ponto Eletrônico | SEM API — usar RPA (Selenium/Playwright) se necessário |
| BIM | SEM API pública |
| Cronograma Gantt / Linha de Balanço | SEM API — integra via Prevision (parceiro externo) |
| SPED / Fiscal | SEM API pública identificada |
| Relatórios PDF gerais | Apenas casos específicos: análise de pedido, extrato cliente, IR |

---

### Novos Módulos Desbloqueados pela Pesquisa Completa

Estes não estavam no roadmap anterior e são desbloqueados pelos endpoints descobertos:

#### ✅ Avaliação de Fornecedores (pós-pedido) (Sprint 2E)
Após a entrega de um pedido, o app apresenta formulário de avaliação do fornecedor.
**Endpoints:** `GET /purchase-orders/{id}/supplier-evaluation-criteria` + `POST/PUT /purchase-orders/{id}/evaluation`
**Implementado:** widget inline em `/suprimentos/pedidos/[id]` quando status=ENTREGUE e siengePedidoId existe.

#### ✅ PDF de Análise de Pedido (Sprint 2E)
Gera o PDF oficial do Sienge para análise de pedido de compra, com todos os itens, fornecedor, valores.
**Endpoint:** `GET /purchase-orders/{id}/analysis/pdf`
**Implementado:** API route proxy `/api/sienge/pdf/pedido/[pedidoId]` + botão no detalhe do pedido.

#### ✅ Mapa Comparativo de Cotações PDF (Sprint 2E)
Gera o PDF oficial do mapa comparativo de cotações, mostrando propostas lado a lado de todos os fornecedores.
**Endpoint:** `GET /purchase-quotations/comparison-map/pdf`
**Implementado:** API route proxy `/api/sienge/pdf/cotacao/[cotacaoId]` + botão em `/suprimentos/cotacoes`.

#### ✅ Dados Bancários e PIX de Fornecedores (Sprint 2E)
Exibe contas bancárias e chaves PIX dos fornecedores buscando no Sienge por CNPJ.
**Endpoints:** `/creditors/{id}/bank-informations` + `/creditors/{id}/pix-informations`
**Implementado:** página `/suprimentos/fornecedores/[id]` + procedure `buscarDadosBancariosPorCnpj`.

#### ✅ Reservas de Estoque (Sprint 3E)
Visualiza e atende reservas de materiais vinculadas a obras/pedidos.
**Implementado:** aba "Reservas" em `/obras/[id]/almoxarifado` + mini-modal para atender quantidade + procedures `listarReservas` e `atenderReserva`.

#### ✅ Transferência de Estoque Entre Obras (Sprint 3E)
Almoxarife pode transferir material excedente de uma obra para outra direto pelo app.
**Implementado:** botão "Transferir" no header do almoxarifado → modal (obra destino, material, quantidade, observação) + mutation `transferirEstoque`.

#### ✅ Entrega de Chaves (Sprint 3E)
Para construtoras com venda de unidades: registrar e gerenciar entrega de chaves.
**Implementado:** página `/comercial/entrega-chaves` com KPIs (total, realizadas, pendentes) e tabela (unidade, empreendimento, cliente, data, responsável, status). Link adicionado no Sidebar.

#### 🟢 Gestão de Comissões (módulo comercial completo)
Painel completo de comissões: criar, autorizar, liberar, cancelar parcelas. Configurar corretores e empreendimentos.
**Endpoints:** 18 endpoints do módulo `/commissions`
**Rota:** `/comercial/comissoes` (expandido além do atual)

#### 🟢 Avalistas de Contratos de Venda
Gerenciar avalistas e cônjuges de compradores nos contratos de venda.
**Endpoints:** `/sales-contracts/{id}/guarantors`
**Rota:** aba em `/comercial/contratos/[id]`

#### 🟢 Lançamentos Contábeis Assíncronos
Para integrações contábeis de alto volume: usar endpoint assíncrono com webhook de conclusão.
**Endpoints:** `POST /accountancy/entries/async` + webhook `ACCOUNTANCY_CLOSING_CREATED`

#### ✅ Extrato do Cliente + PDF (Sprint 3E)
Enviar extrato de cliente por e-mail diretamente pelo app. Gerar link de PDF com validade de 5 min.
**Implementado:** API route `/api/sienge/pdf/extrato/[contratoId]` + botão `FileDown` por linha em `/comercial/contratos`.

#### ✅ Informe de Rendimentos IR (Sprint 3E)
Gerar e enviar informe de rendimentos para clientes no período de IR.
**Implementado:** página `/comercial/clientes` com tabela + selector de ano + botão "Informe IR" → `/api/sienge/pdf/ir/[clienteId]?ano=YYYY`.

#### ✅ Dados Fiscais Completos da NF-e (tributos por item)
Visualizar ICMS, IPI, PIS-COFINS, ISSQN item a item da nota fiscal eletrônica.
**Endpoints:** 15 endpoints GET do módulo `/nfes`
**Rota:** aba "Notas Fiscais" no `/obras/[id]/almoxarifado` com botão "Tributos" por NF-e
**Implementado:** Aba "Notas Fiscais" no almoxarifado com lista de NF-es da obra. Botão "Tributos" abre modal de detalhe fiscal com: header (fornecedor, CNPJ, emissão, valor), 6 KPIs de totais (Base ICMS, ICMS, IPI, PIS, COFINS, ISSQN), lista de itens expansível com cards coloridos por tributo (base, alíquota, valor, CST). `buscarNFeDetalheSienge()` + `sienge.buscarNFeDetalhe` procedure.

---

### Resumo de Cobertura Final

| Domínio | Endpoints REST | Bulk | Webhooks | Módulos Concretiza |
|---|---|---|---|---|
| Cadastros (credores, clientes) | 29 | — | 5 | Fornecedores expandido, Clientes novo |
| Comercial (contratos, unidades, comissões) | 37 | 1 | 20 | Comercial novo |
| Financeiro (CP, CR, bancos, IR) | ~50 | 4 | 15 | Financeiro Sienge expandido |
| Suprimentos (solicitações, cotações, pedidos, NF) | 49 | 1 | 11 | Suprimentos bidirecional |
| Engenharia (RDO, orçamento, planejamento, estoque) | 33 | 3 | 9 | Campo expandido |
| Contratos suprimentos + medições | 8 | — | 4 | Medição de obra |
| Patrimônio | 2 | — | — | Patrimônio |
| Contabilidade | 4 | 2 | 4 | Balancete |
| Webhooks (gerenciamento) | 4 | — | — | Webhook listener |
| **TOTAL** | **~216 REST** | **12 Bulk** | **60+ eventos** | **15+ módulos novos** |

---

## Comandos

```bash
cd C:\Users\Usuario\Documents\ProjetoConcretiza\concretiza

pnpm dev                    # dev em http://localhost:3000
pnpm build                  # build de produção
npx prisma generate         # gerar client após mudar schema
npx prisma validate         # validar schema
npx prisma db push          # sincronizar schema com banco
npx prisma migrate status   # checar status das migrations
npx prisma studio           # GUI do banco
```

---

## FASE 3: IMPLEMENTAÇÃO FRONTEND (UI/UX)

> **Objetivo:** Transformar as 305 procedures tRPC do backend em interfaces funcionais no Next.js.
> Cada item agrupa rotas por afinidade de módulo. O número entre parênteses indica a quantidade de endpoints consumidos.

---

### 3.1 — Financeiro (Contas a Pagar, Contas a Receber, Bancos, IR)

| # | Item | Rotas | Status |
|---|------|-------|--------|
| 1 | ❌ Implementar CRUD de Contas a Pagar (criarContaPagar, listarContasPagar, lancarDespesa, lancarDespesaNf) | 4 | ❌ |
| 2 | ❌ Implementar Gestão de Bills — detalhes, parcelas, impostos, anexos, categorias (buscarBill, atualizarBill, listarParcelasBill, atualizarParcelaBill, listarImpostosBill, listarAnexosBill, downloadAnexoBill, uploadAnexoBill, criarTaxInformation*, listarBudgetCategoriesBill, listarDepartmentsCostBill, listarBuildingsCostBill, atualizarBuildingsCostBill, listarUnitsBill, atualizarUnitsBill, criarBillFromNFe, listarBillsByChangeDate) | 18 | ❌ |
| 3 | ❌ Implementar Contas a Receber — parcelas, vencimentos, categorias (listarContasReceber, buscarReceivableBill, listarParcReceivableBill, alterarVencimentoReceivableBill, listarBudgetCategoriesReceivable) | 5 | ❌ |
| 4 | ❌ Implementar Tela de Pagamentos e Info Bancária (buscarPaymentInfo, atualizarPaymentInfo) | 2 | ❌ |
| 5 | ❌ Implementar Envio de Boletos, Extratos e Informes IR por Email/PDF (enviarBoleto2Via, enviarExtratoClienteEmail, enviarInformeIREmail, enviarSaldoDevedorEmail, getExtratoPdfUrl, getInformeIRPdfUrl, obterSaldoDevedor, listarExtratoCliente) | 8 | ❌ |
| 6 | ❌ Implementar Dashboard de Inadimplência e Saldos (listarInadimplentes, listarSaldos, listarBulkDefaulters) | 3 | ❌ |
| 7 | ❌ Implementar Relatórios Financeiros Bulk (listarBulkAccountBalances, listarBulkBankMovements, listarBulkBillPayablesInstallments, listarBulkReceivableInstallments, listarBulkCustomerExtractHistory, listarBulkInvoiceItens) | 6 | ❌ |

**Subtotal Financeiro: ~46 rotas**

---

### 3.2 — Comercial (Contratos de Venda, Unidades, Reservas, Comissões)

| # | Item | Rotas | Status |
|---|------|-------|--------|
| 8 | ❌ Implementar CRUD de Contratos de Venda com anexos (criarContratoVenda, atualizarContratoVenda, buscarContratoVenda, cancelarContratoVenda, excluirContratoVenda, listarContratosVenda, listarAnexosContratoVenda, downloadAnexoContratoVenda, uploadAnexoContratoVenda, listarBulkSalesContracts) | 10 | ❌ |
| 9 | ❌ Implementar Gestão de Avalistas de Contrato (adicionarAvalistaContratoVenda, atualizarAvalistaContratoVenda, buscarAvalistaContratoVenda, listarAvalistasContratoVenda, atualizarTelefonesAvalistaContratoVenda) | 5 | ❌ |
| 10 | ❌ Implementar CRUD de Unidades Imobiliárias — endereço, características, situações, filhas (criarUnidade, atualizarUnidade, buscarUnidade, atualizarEnderecoUnidade, buscarAgrupamentosUnidade, criarCaracteristicaUnidade, listarCaracteristicasUnidade, vincularCaracteristicasUnidade, criarSituacaoUnidade, listarSituacoesUnidade, adicionarUnidadeFilha, uploadAnexoUnidade) | 12 | ❌ |
| 11 | ❌ Implementar Gestão de Reservas de Unidades (criarReservaUnidade, inativarReservaUnidade, listarReservas, atenderReserva, listarItensReservaEstoque) | 5 | ❌ |
| 12 | ❌ Implementar Mapa Imobiliário e Entrega de Chaves (listarMapaImobiliario, listarEntregaChaves) | 2 | ❌ |
| 13 | ❌ Implementar CRUD de Comissões — autorização, liberação, cancelamento (criarComissao, atualizarComissao, buscarComissao, excluirComissao, listarComissoes, autorizarComissoes, cancelarComissoes, liberarComissoes, comissoesCountFilters) | 9 | ❌ |
| 14 | ❌ Implementar Gestão de Corretores e Config de Comissão (adicionarCorretorComissao, removerCorretorComissao, criarConfigCorretorComissao, atualizarConfigCorretorComissao, excluirConfigCorretorComissao, listarConfigCorretoresComissao, criarConfigEmpreendimentoComissao, atualizarConfigEmpreendimentoComissao, buscarConfigEmpreendimentoComissao) | 9 | ❌ |

**Subtotal Comercial: ~52 rotas**

---

### 3.3 — Cadastros (Clientes, Credores, Empresas)

| # | Item | Rotas | Status |
|---|------|-------|--------|
| 15 | ❌ Implementar CRUD Completo de Clientes — cônjuge, endereço, renda, telefones, procurador, anexos (criarCliente, atualizarCliente, buscarClientePorId, buscarClienteSiengePorId, listarClientes, atualizarConjugeCliente, atualizarEnderecoCliente, atualizarRendaFamiliarCliente, sobrescreverTelefonesCliente, criarProcuradorCliente, listarAnexosCliente, downloadAnexoCliente, uploadAnexoCliente) | 13 | ❌ |
| 16 | ❌ Implementar CRUD Completo de Credores/Fornecedores — contato, dados bancários, PIX, procuradores, representantes (buscarCreditorPorId, atualizarContatoCredor, atualizarDesoneracaoFolhaCredor, atualizarProcuradorCredor, atualizarRepresentantesCredor, inserirContaBancariaCredor, atualizarContaBancariaCredor, listarDadosBancariosCredor, inserirPixCredor, atualizarPixCredor, atualizarTelefoneCredor, toggleAtivoCreditor, buscarDadosBancariosPorCnpj) | 13 | ❌ |
| 17 | ❌ Implementar Gestão de Empresas (atualizarEmpresa, buscarEmpresa, listarEmpresas) | 3 | ❌ |

**Subtotal Cadastros: ~29 rotas**

---

### 3.4 — Suprimentos (Solicitações, Cotações, Pedidos, NF-e)

| # | Item | Rotas | Status |
|---|------|-------|--------|
| 18 | ❌ Implementar Gestão de Solicitações de Compra — itens, autorização, reprovação, apropriações, anexos (buscarSolicitacao, listarSolicitacoesPorObra, autorizarSolicitacao, reprovarSolicitacao, autorizarItemSolicitacao, autorizarItensSolicitacao, reprovarItemSolicitacao, criarItensSolicitacao, listarTodosItensSolicitacao, listarApropriacoesSolicitacaoItem, listarRequisitosEntregaSolicitacaoItem, listarAnexosSolicitacao, downloadAnexoSolicitacao) | 13 | ❌ |
| 19 | ❌ Implementar Gestão de Cotações — itens, fornecedores, negociações, autorização (criarCotacao, listarCotacoes, criarItemCotacao, criarItemCotacaoFromSolicitacao, incluirFornecedorItemCotacao, criarNegociacaoCotacao, atualizarNegociacaoCotacao, atualizarItemNegociacaoCotacao, autorizarNegociacaoCotacao, listarNegociacoesCotacao, listarBulkPurchaseQuotations) | 11 | ❌ |
| 20 | ❌ Implementar Gestão de Pedidos de Compra — itens, autorização, reprovação, entregas, anexos, totais (buscarPedido, listarPedidosPorObra, buscarItemPedido, listarItensPedido, buscarTotalizacaoPedido, autorizarPedido, reprovarPedido, reprovarPedidoComObs, buscarDirectBillingPedido, listarDeliverySchedulesPedido, criarEntregasPedidoNfCompra, listarEntregasAtendidasNfCompra, listarAnexosPedido, downloadAnexoPedido, uploadAnexoPedido, pedidosSienge, listarBuildingsAppropriationsPedidoItem) | 17 | ❌ |
| 21 | ❌ Implementar Visualizador de NF-e Completo — detalhes, ICMS, ISS, IPI, PIS/COFINS, transportadoras, pagamentos (listarNFe, buscarNFeDetalhe, buscarNFeCarriers, buscarNFeDeliveries, buscarNFeIcms, buscarNFeIssqn, buscarNFeIssuersRecipients, buscarNFeItemIcms, buscarNFeItemIpi, buscarNFeItemIssqn, buscarNFeItemPisCofins, buscarNFeItemSimplifiedIcms, buscarNFeLinkedNfes, buscarNFePayments, listarBuildingsAppropriationsNfItem) | 15 | ❌ |
| 22 | ❌ Implementar Purchase Invoice e Nota Fiscal (buscarPurchaseInvoice, cadastrarPurchaseInvoice, listarItensPurchaseInvoice, salvarNotaFiscal) | 4 | ❌ |
| 23 | ❌ Implementar Importação de Fornecedores (importarFornecedores) | 1 | ❌ |

**Subtotal Suprimentos: ~61 rotas**

---

### 3.5 — Engenharia e Campo (RDO, Orçamento, Estoque, Planejamento)

| # | Item | Rotas | Status |
|---|------|-------|--------|
| 24 | ❌ Implementar Dashboard de Diário de Obra/RDO — equipes, equipamentos, ocorrências, tarefas, semana, histograma (buscarDiarioObra, deletarDiarioObra, listarRdosPorObra, listarTiposDiarioObra, listarTiposOcorrenciaDiarioObra, atualizarEquipamentosDiarioObra, incluirEquipamentosDiarioObra, atualizarEquipesDiarioObra, incluirEquipesDiarioObra, atualizarOcorrenciasDiarioObra, incluirOcorrenciasDiarioObra, atualizarTarefasDiarioObra, incluirTarefasDiarioObra, buscarSemana, histogramaMO) | 15 | ❌ |
| 25 | ❌ Implementar Predefinições de Equipes e Equipamentos (salvarEquipamentosPredef, salvarEquipePredef) | 2 | ❌ |
| 26 | ❌ Implementar Gestão de Orçamento — planilhas, insumos, budget (listarOrcamento, listarPlanilhasOrcamento, adicionarInsumoOrcamento, atualizarInsumoOrcamento, buscarInsumoOrcamento, listarBulkBudgetItems, listarBulkBusinessBudgets, listarBulkBuildingResources) | 8 | ❌ |
| 27 | ❌ Implementar Gestão de Estoque e Inventário — saldos, movimentações, apropriações, transferências (listarEstoque, saldoPorMaterial, transferirEstoque, listarMovimentacoesInventario, buscarMovimentacaoInventario, listarApropriacoesInventario, lancarMovimentacao, listarPendentesParaTransferencia) | 8 | ❌ |
| 28 | ❌ Implementar Gestão de Obras e Importação (listarObras, importarObras, listarPorObra) | 3 | ❌ |
| 29 | ❌ Implementar Planejamento — Tarefas e Materiais (listarTarefas, inserirTarefasPlanilha, salvarMateriais) | 3 | ❌ |

**Subtotal Engenharia: ~39 rotas**

---

### 3.6 — Contratos de Suprimentos e Medições de Obra

| # | Item | Rotas | Status |
|---|------|-------|--------|
| 30 | ❌ Implementar Gestão de Contratos de Suprimentos (listarBuildingsSupplyContracts, listarItensSupplyContracts, listarTodosSupplyContracts) | 3 | ❌ |
| 31 | ❌ Implementar Medições de Contratos — itens, compensações (listarMedicoes, criarMedicaoSupplyContract, listarItensMedicoesSupplyContracts, listarCompensacoesMedicoesSupplyContracts, listarTodasMedicoesSupplyContracts) | 5 | ❌ |

**Subtotal Contratos/Medições: ~8 rotas**

---

### 3.7 — Contabilidade

| # | Item | Rotas | Status |
|---|------|-------|--------|
| 32 | ❌ Implementar Lançamentos Contábeis — CRUD e processamento async (listarLancamentosContabeis, salvarLancamentosContabeis, salvarLancamentosContabeisAsync, statusLancamentosContabeisAsync, criarLoteContabil) | 5 | ❌ |
| 33 | ❌ Implementar Balancete e Plano de Contas (listarBalancete, buscarPlanosContas, salvarPlanosContas) | 3 | ❌ |

**Subtotal Contabilidade: ~8 rotas**

---

### 3.8 — Patrimônio e Locações

| # | Item | Rotas | Status |
|---|------|-------|--------|
| 34 | ❌ Implementar Listagem de Patrimônio (listarPatrimonio) | 1 | ❌ |
| 35 | ❌ Implementar CRUD de Locações (criarLocacao, listarLocacoes) | 2 | ❌ |

**Subtotal Patrimônio: ~3 rotas**

---

### 3.9 — Administração e Sistema (Usuários, Permissões, Perfil)

| # | Item | Rotas | Status |
|---|------|-------|--------|
| 36 | ❌ Implementar Gestão de Usuários e Permissões (listarUsuarios, removerUsuario, atualizarPermissoes, atualizarRole) | 4 | ❌ |
| 37 | ❌ Implementar Tela de Perfil do Usuário (buscarPerfil, atualizarPerfil, me, buscarToken) | 4 | ❌ |
| 38 | ❌ Implementar Galeria de Mídias (galeria) | 1 | ❌ |

**Subtotal Admin: ~9 rotas**

---

### 3.10 — Templates, Formulários e Avaliações

| # | Item | Rotas | Status |
|---|------|-------|--------|
| 39 | ❌ Implementar CRUD de Templates com duplicação (criarTemplate, atualizarTemplate, buscarTemplate, excluirTemplate, listarTemplates, duplicar) | 6 | ❌ |
| 40 | ❌ Implementar Sistema de Respostas/Formulários (criarResposta, buscarResposta, excluirResposta, finalizarResposta, listarRespostas) | 5 | ❌ |
| 41 | ❌ Implementar Campos Personalizados e Configuração (buscarCamposPersonalizados, salvarCamposPersonalizados, buscarConfig, salvarConfig) | 4 | ❌ |
| 42 | ❌ Implementar Avaliação de Fornecedores (salvarAvaliacao, listarCriteriosAvaliacao) | 2 | ❌ |
| 43 | ❌ Implementar Assinaturas Digitais (salvarAssinaturas) | 1 | ❌ |

**Subtotal Templates/Formulários: ~18 rotas**

---

### 3.11 — Integrações, Webhooks e Sincronização

| # | Item | Rotas | Status |
|---|------|-------|--------|
| 44 | ❌ Implementar Painel de Webhooks — registro, status, remoção (buscarWebhook, buscarStatusWebhook, registrarWebhook, removerWebhook) | 4 | ❌ |
| 45 | ❌ Implementar Painel de Sincronizações e Conexão Sienge (listarSyncs, testarConexao, incluirAnexoSienge, downloadAnexoSienge) | 4 | ❌ |
| 46 | ❌ Implementar Monitor de Operações Bulk Async (consultarBulkAsyncResult, consultarBulkAsyncStatus) | 2 | ❌ |

**Subtotal Integrações: ~10 rotas**

---

### 3.12 — Rotas Genéricas e Transversais

| # | Item | Rotas | Status |
|---|------|-------|--------|
| 47 | ❌ Implementar Actions Genéricas de CRUD (buscar, listar, criar, excluir, enviar, limpar, salvar, atualizar, verificar, revogar) | 10 | ❌ |
| 48 | ❌ Implementar Aprovação/Reprovação Genérica de Itens (aprovarItem, aprovarItens, atualizarItem, atualizarStatus, atualizarPosicao) | 5 | ❌ |
| 49 | ❌ Implementar Dashboard Resumo Geral (resumo, resumoGeral) | 2 | ❌ |
| 50 | ❌ Implementar Listagem por Entidade e Contratos (listarPorEntidade, listarContratos, registrarVisualizacao) | 3 | ❌ |

**Subtotal Transversais: ~20 rotas**

---

### Resumo FASE 3

| Módulo | Itens | Rotas |
|--------|-------|-------|
| Financeiro | 7 | ~46 |
| Comercial | 7 | ~52 |
| Cadastros | 3 | ~29 |
| Suprimentos | 6 | ~61 |
| Engenharia/Campo | 6 | ~39 |
| Contratos/Medições | 2 | ~8 |
| Contabilidade | 2 | ~8 |
| Patrimônio | 2 | ~3 |
| Admin/Sistema | 3 | ~9 |
| Templates/Formulários | 5 | ~18 |
| Integrações/Webhooks | 3 | ~10 |
| Transversais | 4 | ~20 |
| **TOTAL** | **50 itens** | **~305 rotas** |
