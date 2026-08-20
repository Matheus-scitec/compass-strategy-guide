import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { analisarFormula, calcularFormula } from "@/lib/formula";
import { fmtNumero } from "@/lib/format";
import { toast } from "sonner";

/**
 * Abre um popover com um campo por variável da fórmula e calcula o apurado.
 * Só aparece quando a fórmula é válida e tem variáveis.
 */
export function CalculadoraFormula({
  formula,
  onAplicar,
}: {
  formula: string | null;
  onAplicar: (valor: number) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [valores, setValores] = useState<Record<string, string>>({});

  const analise = useMemo(() => analisarFormula(formula), [formula]);

  if (!analise.ok || analise.variaveis.length === 0) return null;

  let resultado: number | null = null;
  let erroCalc: string | null = null;
  try {
    const vars: Record<string, number> = {};
    for (const v of analise.variaveis) {
      const txt = valores[v]?.trim() ?? "";
      if (txt === "") throw new Error("Preencha todas as variáveis.");
      const n = Number(txt.replace(",", "."));
      if (Number.isNaN(n)) throw new Error(`Valor inválido para ${v}.`);
      vars[v] = n;
    }
    resultado = calcularFormula(formula!, vars);
  } catch (e) {
    erroCalc = e instanceof Error ? e.message : "Erro no cálculo.";
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label="Calcular apurado pela fórmula"
          title="Calcular apurado pela fórmula"
        >
          <Calculator className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Calcular apurado
          </p>
          <p className="text-xs text-muted-foreground break-words">{formula}</p>
          <div className="space-y-2">
            {analise.variaveis.map((v) => (
              <div key={v}>
                <label className="text-xs font-medium">{v}</label>
                <Input
                  inputMode="decimal"
                  value={valores[v] ?? ""}
                  onChange={(e) => setValores({ ...valores, [v]: e.target.value })}
                  placeholder="0"
                  className="h-8"
                />
              </div>
            ))}
          </div>
          <div className="rounded-md border border-border bg-superficie px-2 py-1.5 text-sm">
            {resultado !== null ? (
              <span className="num font-semibold">{fmtNumero(resultado)}</span>
            ) : (
              <span className="text-xs text-muted-foreground">{erroCalc ?? "—"}</span>
            )}
          </div>
          <Button
            size="sm"
            className="w-full"
            disabled={resultado === null}
            onClick={() => {
              onAplicar(resultado!);
              setAberto(false);
              toast.success("Apurado calculado pela fórmula.");
            }}
          >
            Aplicar ao apurado
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
