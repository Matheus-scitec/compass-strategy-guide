export function fmtNumero(valor: number | null | undefined, decimais = 2): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimais,
  }).format(valor);
}

export function fmtPercentual(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return `${fmtNumero(valor, 1)}%`;
}

export function fmtData(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(d);
}

export function fmtPeriodo(periodo: string): string {
  const [ano, mes] = periodo.split("-");
  const meses = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  const idx = Number(mes) - 1;
  if (!ano || Number.isNaN(idx) || !meses[idx]) return periodo;
  return `${meses[idx]}/${ano.slice(2)}`;
}
