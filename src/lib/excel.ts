export async function exportarExcel(
  dados: Record<string, unknown>[],
  nomeArquivo: string,
) {
  const XLSX = await import("xlsx")
  const ws = XLSX.utils.json_to_sheet(dados)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Dados")
  XLSX.writeFile(wb, `${nomeArquivo}.xlsx`)
}
