import { Info } from "lucide-react";
import {
  CLASSIFICACAO_LABEL,
  COACHING,
  PROCEDENCIA_LABEL,
  type ClassificacaoNumero,
  type Procedencia,
} from "@/lib/bussola";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function SeloProcedencia({
  valor,
  className,
}: {
  valor: Procedencia | null | undefined;
  className?: string;
}) {
  if (!valor) return null;
  const suave = valor === "sugerido_pelo_sistema" || valor === "inferido";
  return (
    <span
      title={`Procedência: ${PROCEDENCIA_LABEL[valor]}`}
      className={cn(
        "inline-flex shrink-0 items-center rounded-sm border px-1.5 py-px text-[10px] leading-4 uppercase tracking-wide",
        suave
          ? "border-dashed border-muted-foreground/50 text-muted-foreground"
          : "border-border text-muted-foreground",
        className,
      )}
    >
      {PROCEDENCIA_LABEL[valor]}
    </span>
  );
}

export function SeloClassificacao({
  valor,
  className,
}: {
  valor: ClassificacaoNumero | null | undefined;
  className?: string;
}) {
  if (!valor) return null;
  return (
    <span
      title={`Classificação da cifra: ${CLASSIFICACAO_LABEL[valor]}`}
      className={cn(
        "inline-flex shrink-0 items-center rounded-sm border border-border px-1.5 py-px text-[10px] leading-4 uppercase tracking-wide text-muted-foreground",
        className,
      )}
    >
      {CLASSIFICACAO_LABEL[valor]}
    </span>
  );
}

export function prefixoCifra(classificacao: ClassificacaoNumero | null | undefined) {
  return classificacao === "estimativa" ? "≈ " : "";
}

export function Coach({ chave }: { chave: keyof typeof COACHING | string }) {
  const item = COACHING[chave];
  if (!item) return null;
  return (
    <Popover>
      <PopoverTrigger
        type="button"
        aria-label="Como preencher este campo"
        className="text-muted-foreground transition-colors hover:text-primary"
      >
        <Info className="h-3.5 w-3.5" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 text-sm">
        <p className="text-muted-foreground">{item.texto}</p>
        {item.bom ? (
          <p className="mt-2 text-foreground">
            <span className="text-farol-verde">✅</span> {item.bom}
          </p>
        ) : null}
        {item.ruim?.map((r) => (
          <p key={r} className="mt-1 text-foreground">
            <span className="text-farol-vermelho">❌</span> {r}
          </p>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function Rotulo({
  children,
  coach,
  obrigatorio,
}: {
  children: React.ReactNode;
  coach?: string;
  obrigatorio?: boolean;
}) {
  return (
    <span className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
      {obrigatorio ? <span className="text-foreground/60">*</span> : null}
      {coach ? <Coach chave={coach} /> : null}
    </span>
  );
}

export function Bloqueio({
  titulo,
  porque,
  children,
}: {
  titulo: string;
  porque: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-farol-vermelho/40 bg-farol-vermelho/8 p-3">
      <p className="text-sm font-semibold text-foreground">{titulo}</p>
      <p className="mt-1 text-xs text-muted-foreground">{porque}</p>
      {children ? <div className="mt-2 space-y-1 text-sm">{children}</div> : null}
    </div>
  );
}

export function Aviso({ titulo, porque }: { titulo: string; porque: string }) {
  return (
    <div className="rounded-md border border-farol-ambar/40 bg-farol-ambar/8 p-3">
      <p className="text-sm font-semibold text-foreground">{titulo}</p>
      <p className="mt-1 text-xs text-muted-foreground">{porque}</p>
    </div>
  );
}
