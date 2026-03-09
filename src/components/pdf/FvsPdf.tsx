import {
  Document, Page, Text, View, StyleSheet,
} from "@react-pdf/renderer"

type FvsItem = {
  id: string
  descricao: string
  aprovado: boolean | null
}

type FvsData = {
  servico: string
  codigo?: string | null
  data: Date
  status: string
  observacoes?: string | null
  responsavel: { nome: string }
  obra: { nome: string; endereco?: string | null }
  itens: FvsItem[]
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
    backgroundColor: "#ffffff",
    color: "#1e293b",
  },

  // Header
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#8b5cf6",
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#8b5cf6",
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  headerDate: {
    fontSize: 9,
    color: "#64748b",
    textAlign: "right",
  },
  obraInfo: {
    marginTop: 8,
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 4,
  },
  obraName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  obraAddress: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
  },

  // Info cards
  row: { flexDirection: "row", gap: 8 },
  card: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardLabel: {
    fontSize: 8,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  cardValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginTop: 3,
  },
  cardValueSmall: {
    fontSize: 9,
    color: "#0f172a",
    marginTop: 3,
  },

  // Status badge
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },

  // Seções
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#8b5cf6",
    backgroundColor: "#f5f3ff",
    padding: "5 8",
    borderLeftWidth: 3,
    borderLeftColor: "#8b5cf6",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Progress bar (visual)
  progressBg: {
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: 8,
    backgroundColor: "#22c55e",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 8,
  },

  // Checklist
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 8,
  },
  checkItemAlt: { backgroundColor: "#f8fafc" },
  checkNum: {
    fontSize: 8,
    color: "#94a3b8",
    width: 18,
    textAlign: "right",
  },
  checkDesc: {
    flex: 1,
    fontSize: 9,
    color: "#374151",
  },
  checkBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 60,
    alignItems: "center",
  },
  checkBadgeText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },

  // Observações
  obsBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    minHeight: 50,
  },
  obsText: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.6,
  },

  // Footer
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
  footerBrand: {
    fontSize: 8,
    color: "#8b5cf6",
    fontFamily: "Helvetica-Bold",
  },

  emptyText: {
    fontSize: 9,
    color: "#94a3b8",
    fontStyle: "italic",
    padding: "4 0",
  },
})

function statusConfig(s: string) {
  if (s === "APROVADO")    return { label: "Aprovado",      bg: "#dcfce7", color: "#166534" }
  if (s === "REJEITADO")   return { label: "Não Conforme",  bg: "#fee2e2", color: "#991b1b" }
  if (s === "EM_INSPECAO") return { label: "Em Inspeção",   bg: "#dbeafe", color: "#1e40af" }
  if (s === "RETRABALHO")  return { label: "Retrabalho",    bg: "#ffedd5", color: "#9a3412" }
  return                          { label: "Pendente",      bg: "#fef9c3", color: "#854d0e" }
}

function itemConfig(aprovado: boolean | null) {
  if (aprovado === true)  return { label: "Conforme",     bg: "#dcfce7", color: "#166534" }
  if (aprovado === false) return { label: "Não Conforme", bg: "#fee2e2", color: "#991b1b" }
  return                         { label: "Pendente",     bg: "#f1f5f9", color: "#64748b" }
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("pt-BR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })
}

function formatNow() {
  return new Date().toLocaleString("pt-BR")
}

export function FvsPdf({ fvs }: { fvs: FvsData }) {
  const sc = statusConfig(fvs.status)
  const total      = fvs.itens.length
  const conformes  = fvs.itens.filter(i => i.aprovado === true).length
  const naoConf    = fvs.itens.filter(i => i.aprovado === false).length
  const pendentes  = fvs.itens.filter(i => i.aprovado === null).length
  const pct        = total > 0 ? Math.round(conformes / total * 100) : 0

  return (
    <Document
      title={`FVS — ${fvs.servico} — ${new Date(fvs.data).toLocaleDateString("pt-BR")}`}
      author="Concretiza"
    >
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>CONCRETIZA</Text>
              <Text style={styles.headerSubtitle}>Ficha de Verificação de Serviço</Text>
            </View>
            <View>
              <Text style={styles.headerDate}>Gerado em: {formatNow()}</Text>
              <View style={[styles.statusBadge, { backgroundColor: sc.bg, marginTop: 4, alignSelf: "flex-end" }]}>
                <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
              </View>
            </View>
          </View>

          <View style={styles.obraInfo}>
            <Text style={styles.obraName}>{fvs.obra.nome}</Text>
            {fvs.obra.endereco && (
              <Text style={styles.obraAddress}>{fvs.obra.endereco}</Text>
            )}
          </View>
        </View>

        {/* Informações gerais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações da Inspeção</Text>
          <View style={styles.row}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Serviço</Text>
              <Text style={styles.cardValue}>{fvs.servico}</Text>
            </View>
            {fvs.codigo && (
              <View style={[styles.card, { flex: 0.5 }]}>
                <Text style={styles.cardLabel}>Código</Text>
                <Text style={styles.cardValue}>{fvs.codigo}</Text>
              </View>
            )}
          </View>
          <View style={[styles.row, { marginTop: 6 }]}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Data</Text>
              <Text style={styles.cardValueSmall}>{formatDate(fvs.data)}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Responsável</Text>
              <Text style={styles.cardValueSmall}>{fvs.responsavel.nome}</Text>
            </View>
          </View>
        </View>

        {/* Resumo de conformidade */}
        {total > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumo de Conformidade</Text>
            <View style={styles.row}>
              <View style={[styles.card, { borderColor: "#bbf7d0" }]}>
                <Text style={styles.cardLabel}>Conformes</Text>
                <Text style={[styles.cardValue, { color: "#166534" }]}>{conformes}</Text>
              </View>
              <View style={[styles.card, { borderColor: "#fecaca" }]}>
                <Text style={styles.cardLabel}>Não Conformes</Text>
                <Text style={[styles.cardValue, { color: "#991b1b" }]}>{naoConf}</Text>
              </View>
              <View style={[styles.card, { borderColor: "#e2e8f0" }]}>
                <Text style={styles.cardLabel}>Pendentes</Text>
                <Text style={[styles.cardValue, { color: "#475569" }]}>{pendentes}</Text>
              </View>
              <View style={[styles.card, { borderColor: "#ddd6fe" }]}>
                <Text style={styles.cardLabel}>Conformidade</Text>
                <Text style={[styles.cardValue, { color: "#8b5cf6" }]}>{pct}%</Text>
              </View>
            </View>
            <View style={{ marginTop: 8 }}>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.progressText}>{conformes} de {total} itens conformes ({pct}%)</Text>
            </View>
          </View>
        )}

        {/* Checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Checklist de Verificação</Text>
          {fvs.itens.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum item cadastrado.</Text>
          ) : (
            fvs.itens.map((item, i) => {
              const ic = itemConfig(item.aprovado)
              return (
                <View key={item.id} style={[styles.checkItem, i % 2 === 1 ? styles.checkItemAlt : {}]}>
                  <Text style={styles.checkNum}>{i + 1}.</Text>
                  <Text style={styles.checkDesc}>{item.descricao}</Text>
                  <View style={[styles.checkBadge, { backgroundColor: ic.bg }]}>
                    <Text style={[styles.checkBadgeText, { color: ic.color }]}>{ic.label}</Text>
                  </View>
                </View>
              )
            })
          )}
        </View>

        {/* Observações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observações</Text>
          <View style={styles.obsBox}>
            <Text style={styles.obsText}>
              {fvs.observacoes?.trim() ? fvs.observacoes : "Nenhuma observação registrada."}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Responsável: {fvs.responsavel.nome} · Status: {sc.label}
          </Text>
          <Text style={styles.footerBrand}>Concretiza · concretiza.app</Text>
        </View>

      </Page>
    </Document>
  )
}
