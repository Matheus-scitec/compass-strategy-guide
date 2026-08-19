export type ObjetivoBloq = {
  id: string;
  codigo: string;
  frase: string;
  dono_id: string | null;
  forum_acompanhamento: string | null;
  indicador?: IndicadorBloq[];
};

export type IndicadorBloq = {
  id: string;
  codigo: string;
  nome: string;
  publicado: boolean;
  tipo_indicador: string;
  formula: string | null;
  fonte: string | null;
  frequencia: string | null;
  polaridade: "maior" | "menor" | null;
  linha_base: number | null;
  linha_base_data: string | null;
  objetivo_id: string;
};

export type IniciativaBloq = {
  id: string;
  codigo: string;
  titulo: string;
  objetivo_id: string | null;
  lider_id: string | null;
  fim: string | null;
  entregavel_verificavel: string | null;
  publicado: boolean;
  status: "N" | "A" | "C" | "T";
  perfil?: { id: string; nome: string } | null;
};

export function faltasDoIndicador(i: IndicadorBloq): string[] {
  const faltas: string[] = [];
  if (!i.formula?.trim()) faltas.push("fórmula");
  if (!i.fonte?.trim()) faltas.push("fonte");
  if (!i.frequencia?.trim()) faltas.push("frequência");
  if (!i.polaridade) faltas.push("polaridade");
  if (i.linha_base === null || i.linha_base === undefined) faltas.push("linha de base medida");
  if (!i.linha_base_data) faltas.push("data da linha de base");
  return faltas;
}

export function faltasDaIniciativa(i: IniciativaBloq): string[] {
  const faltas: string[] = [];
  if (!i.lider_id) faltas.push("líder (pessoa, não área)");
  if (!i.fim) faltas.push("prazo");
  if (!i.entregavel_verificavel?.trim()) faltas.push("entregável verificável");
  return faltas;
}

export type Saude = {
  objetivosSemDono: ObjetivoBloq[];
  objetivosSemForum: ObjetivoBloq[];
  objetivosComExcessoIndicadores: ObjetivoBloq[];
  iniciativasOrfas: IniciativaBloq[];
  iniciativasIncompletas: IniciativaBloq[];
  indicadoresRascunho: IndicadorBloq[];
  totalObjetivos: number;
  totalIndicadores: number;
  excessoObjetivos: boolean;
  excessoIndicadores: boolean;
  proporcaoResultado: number | null;
  gargalos: { lider: string; nome: string; ativas: number }[];
};

export function calculaSaude(
  objetivos: ObjetivoBloq[],
  iniciativas: IniciativaBloq[],
): Saude {
  const indicadores = objetivos.flatMap((o) => o.indicador ?? []);
  const resultado = indicadores.filter((i) => i.tipo_indicador === "resultado").length;

  const cargaPorLider = new Map<string, { nome: string; ativas: number }>();
  for (const ini of iniciativas) {
    if (!ini.lider_id) continue;
    if (ini.status !== "A" && ini.status !== "N") continue;
    const atual = cargaPorLider.get(ini.lider_id) ?? {
      nome: ini.perfil?.nome ?? "Sem nome",
      ativas: 0,
    };
    atual.ativas += 1;
    cargaPorLider.set(ini.lider_id, atual);
  }

  return {
    objetivosSemDono: objetivos.filter((o) => !o.dono_id),
    objetivosSemForum: objetivos.filter((o) => !o.forum_acompanhamento?.trim()),
    objetivosComExcessoIndicadores: objetivos.filter((o) => (o.indicador ?? []).length > 3),
    iniciativasOrfas: iniciativas.filter((i) => !i.objetivo_id),
    iniciativasIncompletas: iniciativas.filter((i) => faltasDaIniciativa(i).length > 0),
    indicadoresRascunho: indicadores.filter((i) => !i.publicado),
    totalObjetivos: objetivos.length,
    totalIndicadores: indicadores.length,
    excessoObjetivos: objetivos.length > 16,
    excessoIndicadores: indicadores.length > 25,
    proporcaoResultado: indicadores.length ? (resultado / indicadores.length) * 100 : null,
    gargalos: [...cargaPorLider.entries()]
      .filter(([, v]) => v.ativas > 3)
      .map(([lider, v]) => ({ lider, nome: v.nome, ativas: v.ativas })),
  };
}
