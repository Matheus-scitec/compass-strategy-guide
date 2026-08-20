import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Aviso, Rotulo } from "@/components/bussola/selos";
import {
  PERSPECTIVAS,
  avaliaFraseObjetivo,
  avaliaTituloIniciativa,
  proximoCodigo,
  type Perspectiva,
  type Procedencia,
} from "@/lib/bussola";
import { faltasDaIniciativa, faltasDoIndicador } from "@/lib/bloqueios";
import { analisarFormula } from "@/lib/formula";

type Membro = { user_id: string; perfil: { id: string; nome: string } | null };

const PROCEDENCIAS: { valor: Procedencia; label: string }[] = [
  { valor: "decidido_pelo_time", label: "Decidido pelo time" },
  { valor: "importado_de_documento", label: "Importado de documento" },
  { valor: "sugerido_pelo_sistema", label: "Sugerido pelo sistema" },
  { valor: "inferido", label: "Inferido" },
];

function SelectProcedencia({
  valor,
  onChange,
}: {
  valor: Procedencia;
  onChange: (v: Procedencia) => void;
}) {
  return (
    <div>
      <Rotulo coach="procedencia">Procedência</Rotulo>
      <Select value={valor} onValueChange={(v) => onChange(v as Procedencia)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PROCEDENCIAS.map((p) => (
            <SelectItem key={p.valor} value={p.valor}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SelectPessoa({
  valor,
  onChange,
  membros,
  placeholder,
}: {
  valor: string | null;
  onChange: (v: string | null) => void;
  membros: Membro[];
  placeholder: string;
}) {
  return (
    <Select value={valor ?? "__vazio"} onValueChange={(v) => onChange(v === "__vazio" ? null : v)}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__vazio">Sem responsável</SelectItem>
        {membros.map((m) => (
          <SelectItem key={m.user_id} value={m.user_id}>
            {m.perfil?.nome ?? "Sem nome"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export type ObjetivoForm = {
  id?: string;
  codigo?: string;
  perspectiva: Perspectiva;
  frase: string;
  por_que_importa: string | null;
  dono_id: string | null;
  forum_acompanhamento: string | null;
  risco_principal: string | null;
  procedencia: Procedencia;
};

export function DialogObjetivo({
  aberto,
  onOpenChange,
  cicloId,
  membros,
  codigosExistentes,
  inicial,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  cicloId: string;
  membros: Membro[];
  codigosExistentes: string[];
  inicial?: ObjetivoForm;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<ObjetivoForm>(
    inicial ?? {
      perspectiva: "financeiro",
      frase: "",
      por_que_importa: "",
      dono_id: null,
      forum_acompanhamento: "",
      risco_principal: "",
      procedencia: "decidido_pelo_time",
    },
  );
  const avisos = avaliaFraseObjetivo(form.frase);

  async function salvar() {
    const payload = {
      ciclo_id: cicloId,
      perspectiva: form.perspectiva,
      frase: form.frase.trim(),
      por_que_importa: form.por_que_importa,
      dono_id: form.dono_id,
      forum_acompanhamento: form.forum_acompanhamento,
      risco_principal: form.risco_principal,
      procedencia: form.procedencia,
    };
    const resposta = inicial?.id
      ? await supabase.from("objetivo").update(payload).eq("id", inicial.id)
      : await supabase
          .from("objetivo")
          .insert({ ...payload, codigo: proximoCodigo("OBJ", codigosExistentes) });
    if (resposta.error) {
      toast.error(resposta.error.message);
      return;
    }
    await qc.invalidateQueries();
    onOpenChange(false);
    toast.success(inicial?.id ? "Objetivo atualizado." : "Objetivo criado.");
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{inicial?.id ? "Editar objetivo" : "Novo objetivo"}</DialogTitle>
          <DialogDescription>
            Objetivo é frase de mudança com direção, e mora numa das quatro perspectivas ou na
            faixa de sustentação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Rotulo obrigatorio>Perspectiva</Rotulo>
            <Select
              value={form.perspectiva}
              onValueChange={(v) => setForm({ ...form, perspectiva: v as Perspectiva })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERSPECTIVAS.map((p) => (
                  <SelectItem key={p.valor} value={p.valor}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              {PERSPECTIVAS.find((p) => p.valor === form.perspectiva)?.explicacao}
            </p>
          </div>

          <div>
            <Rotulo obrigatorio coach="objetivo_frase">
              Frase do objetivo
            </Rotulo>
            <Textarea
              value={form.frase}
              onChange={(e) => setForm({ ...form, frase: e.target.value })}
              placeholder="Reduzir o prazo de entrega a ponto de deixar de ser objeção comercial"
            />
            {avisos.map((a) => (
              <p key={a} className="mt-1 text-xs text-farol-ambar">
                {a}
              </p>
            ))}
          </div>

          <div>
            <Rotulo>Por que importa</Rotulo>
            <Textarea
              value={form.por_que_importa ?? ""}
              onChange={(e) => setForm({ ...form, por_que_importa: e.target.value })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Rotulo coach="objetivo_dono">Dono</Rotulo>
              <SelectPessoa
                valor={form.dono_id}
                onChange={(v) => setForm({ ...form, dono_id: v })}
                membros={membros}
                placeholder="Escolha uma pessoa"
              />
            </div>
            <div>
              <Rotulo coach="objetivo_forum">Fórum de acompanhamento</Rotulo>
              <Input
                value={form.forum_acompanhamento ?? ""}
                onChange={(e) => setForm({ ...form, forum_acompanhamento: e.target.value })}
                placeholder="Comitê comercial mensal"
              />
            </div>
          </div>

          <div>
            <Rotulo>Risco principal</Rotulo>
            <Input
              value={form.risco_principal ?? ""}
              onChange={(e) => setForm({ ...form, risco_principal: e.target.value })}
            />
          </div>

          <SelectProcedencia
            valor={form.procedencia}
            onChange={(v) => setForm({ ...form, procedencia: v })}
          />
        </div>

        <DialogFooter>
          <Button onClick={salvar} disabled={!form.frase.trim()}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type IndicadorForm = {
  id?: string;
  codigo?: string;
  nome: string;
  formula: string | null;
  fonte: string | null;
  frequencia: string | null;
  polaridade: "maior" | "menor" | null;
  unidade: string | null;
  linha_base: string;
  linha_base_data: string | null;
  responsavel_apuracao: string | null;
  tipo_indicador: string;
  publicado: boolean;
  limite_verde: string;
  limite_atencao: string;
  procedencia: Procedencia;
};

export function DialogIndicador({
  aberto,
  onOpenChange,
  objetivoId,
  cicloId,
  membros,
  codigosExistentes,
  nomesExistentes,
  inicial,
  onPedirIniciativaLinhaBase,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  objetivoId: string;
  cicloId: string;
  membros: Membro[];
  codigosExistentes: string[];
  nomesExistentes: { nome: string; formula: string | null }[];
  inicial?: IndicadorForm;
  onPedirIniciativaLinhaBase?: (nome: string) => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<IndicadorForm>(
    inicial ?? {
      nome: "",
      formula: "",
      fonte: "",
      frequencia: "mensal",
      polaridade: "maior",
      unidade: "",
      linha_base: "",
      linha_base_data: null,
      responsavel_apuracao: null,
      tipo_indicador: "resultado",
      publicado: false,
      procedencia: "decidido_pelo_time",
    },
  );

  const normaliza = (t: string) => t.trim().toLowerCase();
  const duplicado = nomesExistentes.find(
    (n) =>
      n.nome &&
      form.nome &&
      (normaliza(n.nome) === normaliza(form.nome) ||
        (!!n.formula && !!form.formula && normaliza(n.formula) === normaliza(form.formula))),
  );

  const faltas = faltasDoIndicador({
    id: "",
    codigo: "",
    nome: form.nome,
    publicado: true,
    tipo_indicador: form.tipo_indicador,
    formula: form.formula,
    fonte: form.fonte,
    frequencia: form.frequencia,
    polaridade: form.polaridade,
    linha_base: form.linha_base === "" ? null : Number(form.linha_base),
    linha_base_data: form.linha_base_data,
    objetivo_id: objetivoId,
  });

  async function salvar() {
    const payload = {
      objetivo_id: objetivoId,
      nome: form.nome.trim(),
      formula: form.formula,
      fonte: form.fonte,
      frequencia: form.frequencia,
      polaridade: form.polaridade,
      unidade: form.unidade,
      linha_base: form.linha_base === "" ? null : Number(form.linha_base),
      linha_base_data: form.linha_base_data,
      responsavel_apuracao: form.responsavel_apuracao,
      tipo_indicador: form.tipo_indicador,
      publicado: form.publicado && faltas.length === 0,
      procedencia: form.procedencia,
    };
    const resposta = inicial?.id
      ? await supabase.from("indicador").update(payload).eq("id", inicial.id)
      : await supabase
          .from("indicador")
          .insert({ ...payload, codigo: proximoCodigo("IND", codigosExistentes) });
    if (resposta.error) {
      toast.error(resposta.error.message);
      return;
    }
    await qc.invalidateQueries();
    onOpenChange(false);
    toast.success(
      payload.publicado
        ? "Indicador publicado — já aparece no painel."
        : "Indicador salvo em rascunho.",
    );
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{inicial?.id ? "Editar indicador" : "Novo indicador"}</DialogTitle>
          <DialogDescription>
            Indicador só é publicável com fórmula, fonte, frequência, polaridade e linha de base
            medida. Sem isso ele fica em rascunho e não aparece no painel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Rotulo obrigatorio>Nome</Rotulo>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            {duplicado ? (
              <div className="mt-2">
                <Aviso
                  titulo={`Parecido com "${duplicado.nome}"`}
                  porque="Números divergentes para a mesma coisa em painéis diferentes é problema clássico. Confirme se não é o mesmo indicador."
                />
              </div>
            ) : null}
          </div>

          <div>
            <Rotulo obrigatorio coach="indicador_formula">
              Fórmula
            </Rotulo>
            <Textarea
              value={form.formula ?? ""}
              onChange={(e) => setForm({ ...form, formula: e.target.value })}
              placeholder="(entregas no prazo ÷ entregas do mês) × 100"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Rotulo obrigatorio coach="indicador_fonte">
                Fonte
              </Rotulo>
              <Input
                value={form.fonte ?? ""}
                onChange={(e) => setForm({ ...form, fonte: e.target.value })}
                placeholder="ERP — relatório OTD-12"
              />
            </div>
            <div>
              <Rotulo obrigatorio>Frequência</Rotulo>
              <Select
                value={form.frequencia ?? "mensal"}
                onValueChange={(v) => setForm({ ...form, frequencia: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Rotulo obrigatorio coach="indicador_polaridade">
                Polaridade
              </Rotulo>
              <Select
                value={form.polaridade ?? "maior"}
                onValueChange={(v) => setForm({ ...form, polaridade: v as "maior" | "menor" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maior">Maior é melhor</SelectItem>
                  <SelectItem value="menor">Menor é melhor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Rotulo>Unidade</Rotulo>
              <Input
                value={form.unidade ?? ""}
                onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                placeholder="%, dias, R$"
              />
            </div>
            <div>
              <Rotulo obrigatorio coach="indicador_linha_base">
                Linha de base medida
              </Rotulo>
              <Input
                inputMode="decimal"
                value={form.linha_base}
                onChange={(e) => setForm({ ...form, linha_base: e.target.value })}
              />
            </div>
            <div>
              <Rotulo obrigatorio>Data da linha de base</Rotulo>
              <Input
                type="date"
                value={form.linha_base_data ?? ""}
                onChange={(e) => setForm({ ...form, linha_base_data: e.target.value || null })}
              />
            </div>
            <div>
              <Rotulo coach="indicador_tipo">Tipo</Rotulo>
              <Select
                value={form.tipo_indicador}
                onValueChange={(v) => setForm({ ...form, tipo_indicador: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resultado">De resultado</SelectItem>
                  <SelectItem value="direcao">De direção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Rotulo>Responsável pela apuração</Rotulo>
              <SelectPessoa
                valor={form.responsavel_apuracao}
                onChange={(v) => setForm({ ...form, responsavel_apuracao: v })}
                membros={membros}
                placeholder="Escolha uma pessoa"
              />
            </div>
          </div>

          <SelectProcedencia
            valor={form.procedencia}
            onChange={(v) => setForm({ ...form, procedencia: v })}
          />

          <div className="rounded-md border border-border bg-superficie p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Publicar no painel</p>
                <p className="text-xs text-muted-foreground">
                  Regra 1: publicação exige o conjunto completo.
                </p>
              </div>
              <Switch
                checked={form.publicado}
                disabled={faltas.length > 0}
                onCheckedChange={(v) => setForm({ ...form, publicado: v })}
              />
            </div>
            {faltas.length ? (
              <div className="mt-2">
                <Aviso
                  titulo={`Falta ${faltas.join(", ")}`}
                  porque="Sem isso o indicador fica em rascunho. Se ninguém consegue produzir a linha de base, crie uma iniciativa para construí-la em vez de aceitar o indicador vazio."
                />
                {(faltas.includes("linha de base medida") ||
                  faltas.includes("data da linha de base")) &&
                onPedirIniciativaLinhaBase ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => onPedirIniciativaLinhaBase(form.nome || "indicador")}
                  >
                    Criar iniciativa para construir a linha de base
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={salvar} disabled={!form.nome.trim() || !cicloId}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type IniciativaForm = {
  id?: string;
  titulo: string;
  objetivo_id: string | null;
  lider_id: string | null;
  entregavel_verificavel: string | null;
  inicio: string | null;
  fim: string | null;
  investimento: string;
  status: "N" | "A" | "C" | "T";
  reversibilidade: string | null;
  publicado: boolean;
  procedencia: Procedencia;
};

export function DialogIniciativa({
  aberto,
  onOpenChange,
  cicloId,
  membros,
  objetivos,
  codigosExistentes,
  inicial,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  cicloId: string;
  membros: Membro[];
  objetivos: { id: string; codigo: string; frase: string }[];
  codigosExistentes: string[];
  inicial?: IniciativaForm;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<IniciativaForm>(
    inicial ?? {
      titulo: "",
      objetivo_id: null,
      lider_id: null,
      entregavel_verificavel: "",
      inicio: null,
      fim: null,
      investimento: "",
      status: "N",
      reversibilidade: "",
      publicado: false,
      procedencia: "decidido_pelo_time",
    },
  );

  const avisos = avaliaTituloIniciativa(form.titulo);
  const faltas = faltasDaIniciativa({
    id: "",
    codigo: "",
    titulo: form.titulo,
    objetivo_id: form.objetivo_id,
    lider_id: form.lider_id,
    fim: form.fim,
    entregavel_verificavel: form.entregavel_verificavel,
    publicado: true,
    status: form.status,
  });

  async function salvar() {
    const payload = {
      ciclo_id: cicloId,
      titulo: form.titulo.trim(),
      objetivo_id: form.objetivo_id,
      lider_id: form.lider_id,
      entregavel_verificavel: form.entregavel_verificavel,
      inicio: form.inicio,
      fim: form.fim,
      investimento: form.investimento === "" ? null : Number(form.investimento),
      status: form.status,
      reversibilidade: form.reversibilidade,
      publicado: form.publicado && faltas.length === 0,
      procedencia: form.procedencia,
    };
    const resposta = inicial?.id
      ? await supabase.from("iniciativa").update(payload).eq("id", inicial.id)
      : await supabase
          .from("iniciativa")
          .insert({ ...payload, codigo: proximoCodigo("INI", codigosExistentes) });
    if (resposta.error) {
      toast.error(resposta.error.message);
      return;
    }
    await qc.invalidateQueries();
    onOpenChange(false);
    toast.success("Iniciativa salva.");
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{inicial?.id ? "Editar iniciativa" : "Nova iniciativa"}</DialogTitle>
          <DialogDescription>
            Iniciativa é projeto com começo e fim. Só é publicável com líder pessoa, prazo e
            entregável verificável.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Rotulo obrigatorio coach="iniciativa_titulo">
              Título
            </Rotulo>
            <Input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Implantar o módulo de ocorrências até junho"
            />
            {avisos.map((a) => (
              <p key={a} className="mt-1 text-xs text-farol-ambar">
                {a}
              </p>
            ))}
          </div>

          <div>
            <Rotulo>Objetivo que ela sustenta</Rotulo>
            <Select
              value={form.objetivo_id ?? "__vazio"}
              onValueChange={(v) =>
                setForm({ ...form, objetivo_id: v === "__vazio" ? null : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha um objetivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__vazio">Sem objetivo (fica órfã)</SelectItem>
                {objetivos.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.codigo} · {o.frase.slice(0, 60)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Rotulo obrigatorio coach="iniciativa_entregavel">
              Entregável verificável
            </Rotulo>
            <Textarea
              value={form.entregavel_verificavel ?? ""}
              onChange={(e) => setForm({ ...form, entregavel_verificavel: e.target.value })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Rotulo obrigatorio coach="iniciativa_lider">
                Líder
              </Rotulo>
              <SelectPessoa
                valor={form.lider_id}
                onChange={(v) => setForm({ ...form, lider_id: v })}
                membros={membros}
                placeholder="Escolha uma pessoa"
              />
            </div>
            <div>
              <Rotulo>Status</Rotulo>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as IniciativaForm["status"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="N">Não iniciada</SelectItem>
                  <SelectItem value="A">Em andamento</SelectItem>
                  <SelectItem value="C">Concluída</SelectItem>
                  <SelectItem value="T">Travada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Rotulo>Início</Rotulo>
              <Input
                type="date"
                value={form.inicio ?? ""}
                onChange={(e) => setForm({ ...form, inicio: e.target.value || null })}
              />
            </div>
            <div>
              <Rotulo obrigatorio>Prazo (fim)</Rotulo>
              <Input
                type="date"
                value={form.fim ?? ""}
                onChange={(e) => setForm({ ...form, fim: e.target.value || null })}
              />
            </div>
            <div>
              <Rotulo coach="classificacao_numero">Investimento (R$)</Rotulo>
              <Input
                inputMode="decimal"
                value={form.investimento}
                onChange={(e) => setForm({ ...form, investimento: e.target.value })}
              />
            </div>
            <div>
              <Rotulo>Reversibilidade</Rotulo>
              <Input
                value={form.reversibilidade ?? ""}
                onChange={(e) => setForm({ ...form, reversibilidade: e.target.value })}
                placeholder="Reversível em 30 dias sem perda"
              />
            </div>
          </div>

          <SelectProcedencia
            valor={form.procedencia}
            onChange={(v) => setForm({ ...form, procedencia: v })}
          />

          <div className="rounded-md border border-border bg-superficie p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Publicar iniciativa</p>
                <p className="text-xs text-muted-foreground">Regra 2: líder, prazo e entregável.</p>
              </div>
              <Switch
                checked={form.publicado}
                disabled={faltas.length > 0}
                onCheckedChange={(v) => setForm({ ...form, publicado: v })}
              />
            </div>
            {faltas.length ? (
              <p className="mt-2 text-xs text-farol-ambar">
                Falta {faltas.join(", ")}. Sem isso, ninguém consegue cobrar a entrega na data.
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={salvar} disabled={!form.titulo.trim()}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
