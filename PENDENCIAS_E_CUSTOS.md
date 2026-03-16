# Concretiza — Pendências e Custos de Infraestrutura

> Documento atualizado com base em análise completa do código-fonte.
> Última revisão: março/2026

---

## 1. Pendências reais (o que ainda falta)

### Pendências técnicas confirmadas

| # | Item | Detalhe | Prioridade |
|---|---|---|---|
| 1 | **IA assistente (Fase 2)** | Claude API para ajudar a preencher RDO, sugerir ocorrências, resumir a semana da obra. Estrutura já está pronta para receber. | 🟡 Fase 2 |
| 2 | **Envio de documentos por e-mail** | A UI existe na aba Documentos mas o backend (`documento.enviarEmail`) não foi implementado. | 🟠 Média |
| 3 | **Integrações adicionais** | WhatsApp, NF-e, Teams, Google Drive, Omie, Totvs aparecem na tela de Integrações mas são só UI — sem backend. Sienge é a única integração real. | 🟡 Baixa (comunicar ao cliente como "em breve") |

### Espaço para anotar feedbacks do patrão na reunião

| # | Item apontado | Detalhe | Prioridade |
|---|---|---|---|
| 4 | | | |
| 5 | | | |
| 6 | | | |
| 7 | | | |
| 8 | | | |

---

## 2. O que está 100% funcionando (não citar como pendente)

| Módulo | Status | Observação |
|---|---|---|
| **Deploy no Vercel** | ✅ No ar | App em produção com Vercel Cron ativo |
| **Banco de dados (Supabase)** | ✅ Conectado | PostgreSQL real, RLS em 30+ tabelas |
| **Autenticação** | ✅ Funcionando | Login, registro, convites, middleware |
| **RDO** | ✅ Completo | Criar, editar, duplicar, PDF, status workflow |
| **FVS** | ✅ Completo | Checklist, templates, aprovação, PDF |
| **FVM** | ✅ Completo | Workflow, lança despesa ao aprovar |
| **Ocorrências + Mapa Visual** | ✅ Completo | Fabric.js com drag, zoom, pan |
| **Equipe** | ✅ Completo | CRUD, ativo/inativo, dataSaída |
| **Materiais** | ✅ Completo | Catálogo + movimentações por obra |
| **Documentos** | ✅ Completo | Upload, download, por categoria (falta só envio por e-mail) |
| **Financeiro** | ✅ Completo | Receitas/despesas, recorrência automática via Cron |
| **Suprimentos** | ✅ Completo | Fornecedores, Materiais, Equipamentos, Solicitações, Pedidos |
| **Dashboard + Análises** | ✅ Completo | KPIs + gráficos 12 meses |
| **Relatórios PDF** | ✅ Completo | RDO, FVS, relatório semanal |
| **Chat por obra** | ✅ Completo | Supabase Realtime (tempo real de verdade) |
| **Chat global** | ✅ Completo | Sidebar com seleção de obra |
| **Notificações push** | ✅ Completo | Web Push API + VAPID, banco de subscriptions |
| **Foto de capa das obras** | ✅ Completo | Upload ao criar e ao editar |
| **Upload fotos e vídeos** | ✅ Completo | Fotos (20MB) e vídeos MP4/MOV/WebM (200MB) |
| **Modo escuro** | ✅ Completo | Toggle na navbar, salvo em localStorage |
| **Permissões granulares** | ✅ Completo | 7 toggles por usuário, roles por empresa |
| **Integração Sienge** | ✅ Completo | Obras, fornecedores, pedidos ao vivo |
| **Multi-tenant** | ✅ Completo | Isolamento total por empresaId + RLS |
| **Rate limiting** | ✅ Completo | Proteção em upload, auth, NF-e |
| **Audit log** | ✅ Completo | Histórico de alterações em cada obra |
| **Cron financeiro** | ✅ Completo | Vercel Cron todos os dias às 09:00 UTC |

---

## 3. Custos de infraestrutura

### Situação atual

| Serviço | Plano atual | Custo |
|---|---|---|
| **Vercel** | Hobby (gratuito) ou Pro | $0 ou $20/mês |
| **Supabase** | Free (500MB, pausa após 7 dias sem uso) | $0 |
| **Domínio** | — | — |

### Por que os planos pagos são necessários para clientes reais

**Vercel Pro ($20/mês ≈ R$ 110):**
- No plano Hobby, o servidor pode ter "cold start" — acorda lento após período sem uso
- O front já carrega um pouco mais pesado com banco de dados; com IA na Fase 2, o uso de CPU aumenta muito mais
- Sem SLA no Hobby — se cair, não tem suporte
- Termos de uso do Hobby não permitem uso comercial com clientes pagantes

**Supabase Pro ($25/mês ≈ R$ 140):**
- No Free, o banco **pausa automaticamente** após 7 dias sem acesso
- Se o patrão abrir o app numa segunda-feira depois de um fim de semana, pode demorar 30 segundos para "acordar" — péssima impressão
- Free tem 500MB de banco e 1GB de storage — suficiente para 1–2 empresas no começo, mas não para crescer
- Pro tem 8GB de banco e 100GB de storage

### Tabela de custos mensais (infraestrutura de produção)

| Serviço | Plano necessário | Custo mensal |
|---|---|---|
| **Vercel** | Pro | $20 ≈ **R$ 110** |
| **Supabase** | Pro | $25 ≈ **R$ 140** |
| **Domínio** | Registro.br (.com.br) ou Namecheap (.app) | ~**R$ 8** (≈ R$ 100/ano) |
| **Claude API** (IA — Fase 2) | Pay-per-use | ~$50–100 ≈ **R$ 280–560** (só quando ativar) |
| **Total sem IA** | | ~**R$ 260/mês** |
| **Total com IA ativa** | | ~**R$ 540–820/mês** |

---

## 4. Escalabilidade — quantas empresas o Supabase aguenta?

### Resposta direta: 1 Supabase Pro aguenta 50–100 construtoras sem upgrade

O Concretiza já é **multi-tenant por design** — cada dado tem `empresaId` e nunca vaza entre empresas.
Não é necessário criar conta separada por cliente. É exatamente como Notion, Linear e 99% dos SaaS funcionam.

```
Supabase (1 instância, $25/mês fixo)
├── Construtora A — obras, rdos, equipe, fotos...
├── Construtora B — obras, rdos, equipe, fotos...
├── ...
└── Construtora Z — sem ver nada das outras
```

### Comparação das opções

| Opção | Custo com 10 clientes | Trabalho | Recomendado? |
|---|---|---|---|
| **1 Supabase compartilhado** (modelo atual) | **$25/mês fixo** | Zero | ✅ Sim — até 50–100 empresas |
| 1 Supabase por empresa | $25 × 10 = **$250/mês** | Muito alto (10 dashboards, 10 migrations) | ❌ Só para enterprise |
| VPS dedicada por empresa | $200–500/mês + mão de obra | Extremamente alto | ❌ Só com 200+ clientes |

### Limites reais do Supabase Pro com 10 construtoras

| Recurso | Limite Pro | Estimativa com 10 empresas | Situação |
|---|---|---|---|
| Banco de dados | 8 GB | ~1–2 GB (100–300MB por empresa) | ✅ Folgado |
| Storage (fotos/vídeos) | 100 GB | ~10–50 GB | ✅ Ok |
| Conexões simultâneas | 500 | ~50–100 usuários | ✅ Ok |
| Realtime (chat) | 500 conexões | ~20–50 abertas | ✅ Ok |

**Quando separar faz sentido:**
- Cliente **enterprise** (construtora grande, 500+ funcionários) que exige isolamento jurídico por contrato → cobra R$ 2.000+/mês, aí justifica instância dedicada
- Você passar de **150 clientes ativos** → avalia migração para servidor dedicado

---

## 5. Quanto cobrar — viabilidade financeira

### Referência do mercado

| Produto | Preço | Obras | Usuários | Recursos |
|---|---|---|---|---|
| Diário de Obras | R$ 160/mês | Ilimitadas | Ilimitados | Só RDO + fotos |
| **Concretiza** (sugestão) | **R$ 200/mês** | Ilimitadas | Ilimitados | Tudo (RDO, FVS, FVM, Suprimentos, Financeiro, Chat, IA...) |

### Simulação de viabilidade

| Clientes pagando | Receita | Custo infra | Lucro |
|---|---|---|---|
| 1 cliente | R$ 200 | R$ 260 | ❌ Prejuízo de R$ 60 |
| 2 clientes | R$ 400 | R$ 260 | ✅ **R$ 140 de lucro** |
| 5 clientes | R$ 1.000 | R$ 260 | ✅ **R$ 740 de lucro** |
| 10 clientes | R$ 2.000 | R$ 260 | ✅ **R$ 1.740 de lucro** |

> A infraestrutura suporta dezenas de clientes sem precisar aumentar de plano tão cedo.
> O custo de R$ 260/mês é praticamente fixo, independente do número de empresas.

### Sugestão de preço para o patrão (Plano Fundador)

- **R$ 150/mês** com preço travado para sempre (desconto por ser o primeiro cliente)
- Ele economiza vs Diário de Obras (que cobra R$ 160 por muito menos)
- Você não tem prejuízo a partir do 2º cliente
- O patrão entra motivado porque tem vantagem real e vitalícia

---

## 6. Próximos passos

1. [x] ~~Deploy no Vercel~~ — já feito
2. [x] ~~Banco conectado~~ — Supabase conectado e funcionando
3. [ ] Migrar Supabase para **Pro** ($25/mês) — elimina pausa de 7 dias e aumenta limites
4. [ ] Migrar Vercel para **Pro** ($20/mês) — elimina cold start e permite uso comercial
5. [ ] Registrar domínio (sugestão: concretiza.app ou concretiza.com.br)
6. [ ] Apresentar para o patrão e coletar feedbacks (preencher tabela da seção 1)
7. [ ] Implementar `documento.enviarEmail()` (backend faltando)
8. [ ] Fase 2: integrar Claude API para IA assistente
