import { useMemo } from "react";
import { fmtNumero } from "@/lib/format";
import type { Farol } from "@/lib/bussola";

const COR: Record<Farol, string> = {
  verde: "var(--color-farol-verde)",
  atencao: "var(--color-farol-ambar)",
  critico: "var(--color-farol-vermelho)",
  sem_apuracao: "var(--color-farol-cinza)",
};

type Ponto = { periodo: string; valor: number | null; meta: number | null };

/**
 * Mini gráfico de tendência em SVG inline, sem dependências.
 * Mostra a série de apurados com a meta como linha tracejada.
 */
export function Sparkline({
  pontos,
  polaridade = "maior",
  largura = 160,
  altura = 40,
}: {
  pontos: Ponto[];
  polaridade?: "maior" | "menor";
  largura?: number;
  altura?: number;
}) {
  const dados = pontos.filter((p) => p.valor !== null) as {
    periodo: string;
    valor: number;
    meta: number | null;
  }[];

  const { caminho, caminhoMeta, cor, ultimo, dom } = useMemo(() => {
    if (!dados.length) {
      return { caminho: "", caminhoMeta: "", cor: "var(--color-farol-cinza)", ultimo: null, dom: [0, 1] as [number, number] };
    }
    const valores = dados.map((d) => d.valor);
    const metas = dados.map((d) => d.meta).filter((v): v is number => v !== null);
    const todos = [...valores, ...metas];
    let min = Math.min(...todos);
    let max = Math.max(...todos);
    if (min === max) {
      min -= Math.abs(min) * 0.1 || 1;
      max += Math.abs(max) * 0.1 || 1;
    }
    const margem = (max - min) * 0.08;
    min -= margem;
    max += margem;
    const dom: [number, number] = [min, max];

    const x = (i: number) => (dados.length <= 1 ? largura / 2 : (i / (dados.length - 1)) * (largura - 4) + 2);
    const y = (v: number) => altura - 4 - ((v - min) / (max - min)) * (altura - 8);

    const caminho = dados.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.valor).toFixed(1)}`).join(" ");

    // linha da meta (constante por período, mas varia entre períodos)
    const ptsMeta = dados
      .map((d, i) => (d.meta === null ? null : { x: x(i), y: y(d.meta) }))
      .filter((p): p is { x: number; y: number } => p !== null);
    let caminhoMeta = "";
    if (ptsMeta.length) {
      // desenha segmentos contínuos
      const segs: string[] = [];
      let seg: string[] = [];
      ptsMeta.forEach((p) => {
        seg.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
      });
      if (seg.length) segs.push(`M ${seg.join(" L ")}`);
      caminhoMeta = segs.join(" ");
    }

    const ultimoValor = dados[dados.length - 1].valor;
    const ultimaMeta = dados[dados.length - 1].meta;
    const ating =
      polaridade === "menor"
        ? ultimaMeta === null || ultimoValor === 0
          ? null
          : (ultimaMeta / ultimoValor) * 100
        : ultimaMeta === null
          ? null
          : (ultimoValor / ultimaMeta) * 100;
    let cor = "var(--color-farol-cinza)";
    if (ating !== null) {
      if (ating >= 100) cor = "var(--color-farol-verde)";
      else if (ating >= 90) cor = "var(--color-farol-ambar)";
      else cor = "var(--color-farol-vermelho)";
    }

    return { caminho, caminhoMeta, cor, ultimo: ultimoValor, dom };
  }, [dados, polaridade, largura, altura]);

  if (!dados.length) {
    return (
      <div className="flex items-center justify-center text-[10px] text-muted-foreground" style={{ width: largura, height: altura }}>
        sem histórico
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: largura, height: altura }} title={`Tendência de ${dados.length} períodos`}>
      <svg width={largura} height={altura} className="overflow-visible">
        {/* linha da meta */}
        {caminhoMeta ? (
          <path d={caminhoMeta} fill="none" stroke="var(--color-border)" strokeWidth={1} strokeDasharray="3 3" />
        ) : null}
        {/* área sob a curva */}
        <path
          d={`${caminho} L ${((dados.length <= 1 ? largura / 2 : largura - 4) + 2).toFixed(1)} ${altura - 4} L 2 ${altura - 4} Z`}
          fill={cor}
          opacity={0.12}
        />
        <path d={caminho} fill="none" stroke={cor} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
        {/* ponto final */}
        <circle
          cx={dados.length <= 1 ? largura / 2 : largura - 2}
          cy={altura - 4 - ((ultimo! - dom[0]) / (dom[1] - dom[0])) * (altura - 8)}
          r={2.4}
          fill={cor}
        />
      </svg>
    </div>
  );
}

export function farolCor(f: Farol): string {
  return COR[f];
}

export { fmtNumero };
