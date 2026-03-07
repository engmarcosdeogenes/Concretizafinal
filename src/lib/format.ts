const DIAS_ABREV = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const DIAS_NOME  = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]

/** dd/MM/yyyy — para listas */
export function formatDataCurta(d: Date | string): string {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

/** dd de mês de yyyy — para páginas de detalhe */
export function formatDataLonga(d: Date | string): string {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
}

/** "Seg", "Ter", etc. */
export function diaSemanaAbrev(d: Date | string): string {
  return DIAS_ABREV[new Date(d).getDay()]
}

/** "Segunda-feira", "Terça-feira", etc. */
export function diaSemanaNome(d: Date | string): string {
  return DIAS_NOME[new Date(d).getDay()]
}
