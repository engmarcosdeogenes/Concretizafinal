import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer"

// Tipos para o RDO
type Atividade = {
  descricao: string
  quantidade?: number | null
  unidade?: string | null
}

type MembroEquipe = {
  funcao: string
  quantidade: number
  statusPresenca?: string | null
}

type AssinaturaRDO = {
  label: string
  imagemUrl?: string | null
  ordem: number
}

type MaterialRecebido = {
  materialNome: string
  quantidade: number
  unidade?: string | null
  fornecedor?: string | null
}

type MaterialUtilizado = {
  materialNome: string
  quantidade: number
  unidade?: string | null
  localAplicado?: string | null
}

type RdoData = {
  data: Date
  clima?: string | null
  temperaturaMin?: number | null
  temperaturaMax?: number | null
  ocorreuChuva: boolean
  observacoes?: string | null
  status: string
  visualizacoes?: number
  responsavel: { nome: string }
  obra: {
    nome: string
    endereco?: string | null
    numContrato?: string | null
    prazoContratualDias?: number | null
    dataInicio?: Date | string | null
  }
  atividades: Atividade[]
  equipe: MembroEquipe[]
  assinaturas?: AssinaturaRDO[]
  materiaisRecebidos?: MaterialRecebido[]
  materiaisUtilizados?: MaterialUtilizado[]
}

// Estilos
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
    borderBottomColor: "#f97316",
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
    color: "#f97316",
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

  // Seções
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#f97316",
    backgroundColor: "#fff7ed",
    padding: "5 8",
    borderLeftWidth: 3,
    borderLeftColor: "#f97316",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Cards lado a lado
  row: {
    flexDirection: "row",
    gap: 8,
  },
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
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginTop: 3,
  },
  cardValueSmall: {
    fontSize: 10,
    color: "#0f172a",
    marginTop: 3,
  },

  // Tabela
  table: {
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    padding: "5 8",
    borderRadius: 3,
    marginBottom: 2,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    padding: "5 8",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: "#f8fafc",
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: "#374151",
  },
  tableCellBold: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },

  // Observações
  obsBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    minHeight: 60,
  },
  obsText: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.6,
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
  footerText: {
    fontSize: 8,
    color: "#94a3b8",
  },
  footerBrand: {
    fontSize: 8,
    color: "#f97316",
    fontFamily: "Helvetica-Bold",
  },

  // Prazo
  prazoRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  prazoItem: {
    fontSize: 9,
    color: "#64748b",
  },
  prazoItemBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  prazoBar: {
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    marginTop: 6,
  },

  // Assinaturas
  sigRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  sigBox: {
    flex: 1,
    minWidth: 120,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  sigImage: {
    width: "100%",
    height: 60,
    backgroundColor: "#f8fafc",
  },
  sigLabel: {
    fontSize: 8,
    color: "#64748b",
    padding: "3 6",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    textAlign: "center",
  },
  sigEmpty: {
    height: 60,
    backgroundColor: "#f8fafc",
  },

  // Utilitários
  emptyText: {
    fontSize: 9,
    color: "#94a3b8",
    fontStyle: "italic",
    padding: "4 0",
  },
})

function climaLabel(c?: string | null) {
  if (c === "chuva") return "🌧 Chuva"
  if (c === "nublado") return "⛅ Nublado"
  if (c === "vento") return "💨 Vento"
  if (c === "sol") return "☀ Sol"
  return "—"
}

function presencaLabel(s?: string | null) {
  const map: Record<string, string> = {
    PRESENTE: "Presente", AFASTADO: "Afastado", ATESTADO: "Atestado",
    DESLOCANDO: "Deslocando", FALTA_JUSTIFICADA: "Falta Just.",
    FERIAS: "Férias", FOLGA: "Folga", LICENCA: "Licença",
    TREINAMENTO: "Treinamento", VIAGEM: "Viagem",
  }
  return map[s ?? "PRESENTE"] ?? "Presente"
}

function statusConfig(s: string) {
  if (s === "APROVADO") return { label: "Aprovado", bg: "#dcfce7", color: "#166534" }
  if (s === "ENVIADO") return { label: "Enviado", bg: "#dbeafe", color: "#1e40af" }
  if (s === "REJEITADO") return { label: "Rejeitado", bg: "#fee2e2", color: "#991b1b" }
  return { label: "Rascunho", bg: "#f1f5f9", color: "#475569" }
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("pt-BR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })
}

function formatNow() {
  return new Date().toLocaleString("pt-BR")
}

export function RdoPdf({ rdo }: { rdo: RdoData }) {
  const sc = statusConfig(rdo.status)
  const totalEquipe = rdo.equipe.reduce((s, e) => s + e.quantidade, 0)

  const diasDecorridos = rdo.obra.dataInicio
    ? Math.floor((Date.now() - new Date(rdo.obra.dataInicio).getTime()) / 86_400_000)
    : 0
  const diasAVencer = rdo.obra.prazoContratualDias != null
    ? rdo.obra.prazoContratualDias - diasDecorridos
    : null
  const pctDecorrido = rdo.obra.prazoContratualDias
    ? Math.min(100, Math.round((diasDecorridos / rdo.obra.prazoContratualDias) * 100))
    : 0

  return (
    <Document
      title={`RDO — ${rdo.obra.nome} — ${new Date(rdo.data).toLocaleDateString("pt-BR")}`}
      author="Concretiza"
    >
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>CONCRETIZA</Text>
              <Text style={styles.headerSubtitle}>Relatório Diário de Obra</Text>
            </View>
            <View>
              <Text style={styles.headerDate}>Gerado em: {formatNow()}</Text>
              <View style={[styles.statusBadge, { backgroundColor: sc.bg, marginTop: 4, alignSelf: "flex-end" }]}>
                <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
              </View>
            </View>
          </View>

          <View style={styles.obraInfo}>
            <Text style={styles.obraName}>{rdo.obra.nome}</Text>
            {rdo.obra.endereco && (
              <Text style={styles.obraAddress}>{rdo.obra.endereco}</Text>
            )}
          </View>
        </View>

        {/* Prazo Contratual */}
        {(rdo.obra.numContrato || rdo.obra.prazoContratualDias) && (
          <View>
            <View style={styles.prazoRow}>
              {rdo.obra.numContrato && (
                <Text style={styles.prazoItem}>Contrato: <Text style={styles.prazoItemBold}>{rdo.obra.numContrato}</Text></Text>
              )}
              {rdo.obra.prazoContratualDias != null && (
                <Text style={styles.prazoItem}>Prazo: <Text style={styles.prazoItemBold}>{rdo.obra.prazoContratualDias} dias</Text></Text>
              )}
              {rdo.obra.prazoContratualDias != null && (
                <Text style={styles.prazoItem}>Decorrido: <Text style={styles.prazoItemBold}>{diasDecorridos} dias ({pctDecorrido}%)</Text></Text>
              )}
              {diasAVencer != null && (
                <Text style={[styles.prazoItemBold, { color: diasAVencer <= 0 ? "#dc2626" : pctDecorrido >= 70 ? "#d97706" : "#16a34a" }]}>
                  {diasAVencer <= 0 ? `Vencido há ${Math.abs(diasAVencer)} dias` : `A vencer: ${diasAVencer} dias`}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Dados gerais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Dia</Text>
          <View style={styles.row}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Data</Text>
              <Text style={styles.cardValueSmall}>{formatDate(rdo.data)}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Clima</Text>
              <Text style={styles.cardValue}>{climaLabel(rdo.clima)}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Temperatura</Text>
              <Text style={styles.cardValue}>
                {rdo.temperaturaMin != null && rdo.temperaturaMax != null
                  ? `${rdo.temperaturaMin}° / ${rdo.temperaturaMax}°C`
                  : rdo.temperaturaMax != null
                    ? `${rdo.temperaturaMax}°C`
                    : "—"}
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Chuva</Text>
              <Text style={styles.cardValue}>{rdo.ocorreuChuva ? "Sim" : "Não"}</Text>
            </View>
          </View>

          <View style={[styles.row, { marginTop: 6 }]}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Responsável</Text>
              <Text style={styles.cardValueSmall}>{rdo.responsavel.nome}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Total de Trabalhadores</Text>
              <Text style={styles.cardValue}>{totalEquipe} pessoas</Text>
            </View>
          </View>
        </View>

        {/* Equipe */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipe</Text>
          {rdo.equipe.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum registro de equipe.</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 3 }]}>Função</Text>
                <Text style={[styles.tableHeaderText, { flex: 0.8, textAlign: "right" }]}>Qtd</Text>
                <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: "right" }]}>Status</Text>
              </View>
              {rdo.equipe.map((e, i) => (
                <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tableCell, { flex: 3 }]}>{e.funcao}</Text>
                  <Text style={[styles.tableCellBold, { flex: 0.8, textAlign: "right" }]}>{e.quantidade}</Text>
                  <Text style={[styles.tableCell, { flex: 1.5, textAlign: "right" }]}>{presencaLabel(e.statusPresenca)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Atividades */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atividades Realizadas</Text>
          {rdo.atividades.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma atividade registrada.</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 5 }]}>Descrição</Text>
                <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: "right" }]}>Qtd</Text>
                <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: "right" }]}>Unidade</Text>
              </View>
              {rdo.atividades.map((a, i) => (
                <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tableCell, { flex: 5 }]}>{a.descricao}</Text>
                  <Text style={[styles.tableCell, { flex: 1.5, textAlign: "right" }]}>
                    {a.quantidade != null ? String(a.quantidade) : "—"}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1.5, textAlign: "right" }]}>
                    {a.unidade ?? "—"}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Observações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observações</Text>
          <View style={styles.obsBox}>
            <Text style={styles.obsText}>
              {rdo.observacoes?.trim() ? rdo.observacoes : "Nenhuma observação registrada."}
            </Text>
          </View>
        </View>

        {/* Materiais do dia */}
        {((rdo.materiaisRecebidos?.length ?? 0) > 0 || (rdo.materiaisUtilizados?.length ?? 0) > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Materiais do Dia</Text>

            {(rdo.materiaisRecebidos?.length ?? 0) > 0 && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#166534", marginBottom: 4 }}>Recebidos</Text>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, { flex: 3 }]}>Material</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Qtd</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Un.</Text>
                    <Text style={[styles.tableHeaderText, { flex: 2, textAlign: "right" }]}>Fornecedor</Text>
                  </View>
                  {rdo.materiaisRecebidos!.map((m, i) => (
                    <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                      <Text style={[styles.tableCell, { flex: 3 }]}>{m.materialNome}</Text>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{m.quantidade}</Text>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{m.unidade ?? "—"}</Text>
                      <Text style={[styles.tableCell, { flex: 2, textAlign: "right" }]}>{m.fornecedor ?? "—"}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {(rdo.materiaisUtilizados?.length ?? 0) > 0 && (
              <View>
                <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1e40af", marginBottom: 4 }}>Utilizados</Text>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, { flex: 3 }]}>Material</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Qtd</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Un.</Text>
                    <Text style={[styles.tableHeaderText, { flex: 2, textAlign: "right" }]}>Local aplicado</Text>
                  </View>
                  {rdo.materiaisUtilizados!.map((m, i) => (
                    <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                      <Text style={[styles.tableCell, { flex: 3 }]}>{m.materialNome}</Text>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{m.quantidade}</Text>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{m.unidade ?? "—"}</Text>
                      <Text style={[styles.tableCell, { flex: 2, textAlign: "right" }]}>{m.localAplicado ?? "—"}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Assinaturas */}
        {(rdo.assinaturas?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assinaturas</Text>
            <View style={styles.sigRow}>
              {rdo.assinaturas!.map((a, i) => (
                <View key={i} style={styles.sigBox}>
                  {a.imagemUrl ? (
                    <Image src={a.imagemUrl} style={styles.sigImage} />
                  ) : (
                    <View style={styles.sigEmpty} />
                  )}
                  <Text style={styles.sigLabel}>{a.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Responsável: {rdo.responsavel.nome} · Status: {statusConfig(rdo.status).label}
            {rdo.visualizacoes ? ` · ${rdo.visualizacoes} visualizações` : ""}
          </Text>
          <Text style={styles.footerBrand}>Concretiza · concretiza.app</Text>
        </View>

      </Page>
    </Document>
  )
}
