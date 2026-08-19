/** Exporta uma tabela em CSV com separador ponto-e-vírgula (Excel pt-BR). */
export function baixarCSV(nome: string, cabecalho: string[], linhas: (string | number | null)[][]) {
  const escapa = (v: string | number | null) => {
    const texto = v === null || v === undefined ? "" : String(v);
    return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };
  const csv = [cabecalho, ...linhas].map((l) => l.map(escapa).join(";")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nome}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Abre a caixa de impressão do navegador para salvar a vista atual em PDF. */
export function imprimirPDF() {
  window.print();
}