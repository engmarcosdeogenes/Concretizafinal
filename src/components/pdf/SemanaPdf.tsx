import {
  Document, Page, Text, View, StyleSheet,
} from "@react-pdf/renderer"

type Atividade = {
  descricao: string
  quantidade?: number | null
  unidade?: string | null
}

type MembroEquipe = {
  funcao: string
  quantidade: number
}

type RdoItem = {
  id: string
  data: Date
  clima?: string | null
  ocorreuChuva: boolean
  observacoes?: string | null
  status: string
  responsavel: { nome: string }
  atividades: Atividade[]
  equipe: MembroEquipe[]
}

type SemanaData = {
  obra: { nome: string; endereco?: string | null }
  dataInicio: Date
  dataFim: Date
  rdos: RdoItem[]
}

const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
    backgroundColor: "#ffffff",
    color: "#1e293b",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#3b82f6",
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  headerSubtitle: { fontSize: 11, color: "#3b82f6", fontFamily: "Helvetica-Bold", marginTop: 2 },
  headerDate: { fontSize: 9, color: "#64748b", textAlign: "right" },
  obraInfo: {
    marginTop: 8,
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 4,
  },
  obraName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  obraAddress: { fontSize: 9, color: "#64748b", marginTop: 2 },

  // KPI row
  kpiRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  kpiCard: {
    flex: 1,
    backgroundColor: "#eff6ff",
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    alignItems: "center",
  },
  kpiValue: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#1d4ed8" },
  kpiLabel: { fontSize: 8, color: "#64748b", marginTop: 2, textAlign: "center" },

  // Seção
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#3b82f6",
    backgroundColor: "#eff6ff",
    padding: "5 8",
    borderLeftWidth: 3,
    borderLeftColor: "#3b82f6",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // RDO card
  rdoCard: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  rdoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: "5 8",
  },
  rdoHeaderDate: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  rdoHeaderMeta: { fontSize: 8, color: "#94a3b8" },
  rdoBody: { padding: 8 },
  rdoRow: { flexDirection: "row", gap: 8 },
  rdoInfo: {
    backgroundColor: "#f8fafc",
    padding: "4 6",
    borderRadius: 3,
    flex: 1,
  },
  rdoInfoLabel: { fontSize: 7, color: "#94a3b8", textTransform: "uppercase" },
  rdoInfoValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#0f172a", marginTop: 1 },

  // Atividades
  atList: { marginTop: 6 },
  atItem: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 6,
  },
  atBullet: { fontSize: 8, color: "#94a3b8", width: 10 },
  atDesc: { flex: 1, fontSize: 8, color: "#374151" },
  atQtd: { fontSize: 8, color: "#64748b", width: 60, textAlign: "right" },

  obsText: { fontSize: 8, color: "#64748b", fontStyle: "italic", marginTop: 4 },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
  },
  footerText: { fontSize: 8, color: "#94a3b8" },
  footerBrand: { fontSize: 8, color: "#3b82f6", fontFamily: "Helvetica-Bold" },
  emptyText: { fontSize: 9, color: "#94a3b8", fontStyle: "italic" },
})

function formatWeekday(d: Date) {
  return new Date(d).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })
}
function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}
function formatNow() { return new Date().toLocaleString("pt-BR") }

function climaLabel(c?: string | null) {
  if (c === "chuva")   return "Chuva"
  if (c === "nublado") return "Nublado"
  if (c === "vento")   return "Vento"
  if (c === "sol")     return "Sol"
  return "—"
}

export function SemanaPdf({ data }: { data: SemanaData }) {
  const { obra, dataInicio, dataFim, rdos } = data

  const totalTrabalhadores = rdos.reduce(
    (s, r) => s + r.equipe.reduce((a, e) => a + e.quantidade, 0),
    0
  )
  const totalAtividades = rdos.reduce((s, r) => s + r.atividades.length, 0)
  const diasComChuva    = rdos.filter(r => r.ocorreuChuva).length

  return (
    <Document
      title={`Relatório Semanal — ${obra.nome} — ${formatDate(dataInicio)}`}
      author="Concretiza"
    >
      <Page size="A4" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <View style={S.headerTop}>
            <View>
              <Text style={S.headerTitle}>CONCRETIZA</Text>
              <Text style={S.headerSubtitle}>Relatório Semanal de Obra</Text>
            </View>
            <Text style={S.headerDate}>Gerado em: {formatNow()}</Text>
          </View>
          <View style={S.obraInfo}>
            <Text style={S.obraName}>{obra.nome}</Text>
            {obra.endereco && <Text style={S.obraAddress}>{obra.endereco}</Text>}
            <Text style={[S.obraAddress, { marginTop: 4 }]}>
              Período: {formatDate(dataInicio)} a {formatDate(dataFim)}
            </Text>
          </View>
        </View>

        {/* KPIs */}
        <View style={S.kpiRow}>
          <View style={S.kpiCard}>
            <Text style={S.kpiValue}>{rdos.length}</Text>
            <Text style={S.kpiLabel}>RDOs registrados</Text>
          </View>
          <View style={S.kpiCard}>
            <Text style={S.kpiValue}>{totalTrabalhadores}</Text>
            <Text style={S.kpiLabel}>Trabalhadores (total)</Text>
          </View>
          <View style={S.kpiCard}>
            <Text style={S.kpiValue}>{totalAtividades}</Text>
            <Text style={S.kpiLabel}>Atividades registradas</Text>
          </View>
          <View style={S.kpiCard}>
            <Text style={S.kpiValue}>{diasComChuva}</Text>
            <Text style={S.kpiLabel}>Dias com chuva</Text>
          </View>
        </View>

        {/* RDOs da semana */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Registros da Semana</Text>

          {rdos.length === 0 ? (
            <Text style={S.emptyText}>Nenhum RDO registrado neste período.</Text>
          ) : (
            rdos.map((rdo) => {
              const totalEquipe = rdo.equipe.reduce((s, e) => s + e.quantidade, 0)
              return (
                <View key={rdo.id} style={S.rdoCard} wrap={false}>
                  <View style={S.rdoHeader}>
                    <Text style={S.rdoHeaderDate}>{formatWeekday(rdo.data)}</Text>
                    <Text style={S.rdoHeaderMeta}>
                      {climaLabel(rdo.clima)}{rdo.ocorreuChuva ? " · Chuva" : ""} · {totalEquipe} trabalhadores · Resp: {rdo.responsavel.nome}
                    </Text>
                  </View>
                  <View style={S.rdoBody}>
                    {rdo.atividades.length > 0 ? (
                      <View style={S.atList}>
                        {rdo.atividades.map((at, i) => (
                          <View key={i} style={S.atItem}>
                            <Text style={S.atBullet}>·</Text>
                            <Text style={S.atDesc}>{at.descricao}</Text>
                            {at.quantidade != null && (
                              <Text style={S.atQtd}>
                                {at.quantidade}{at.unidade ? ` ${at.unidade}` : ""}
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={S.obsText}>Sem atividades registradas.</Text>
                    )}
                    {rdo.observacoes?.trim() ? (
                      <Text style={S.obsText}>Obs: {rdo.observacoes}</Text>
                    ) : null}
                  </View>
                </View>
              )
            })
          )}
        </View>

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>
            {obra.nome} · {formatDate(dataInicio)} a {formatDate(dataFim)}
          </Text>
          <Text style={S.footerBrand}>Concretiza · concretiza.app</Text>
        </View>

      </Page>
    </Document>
  )
}
