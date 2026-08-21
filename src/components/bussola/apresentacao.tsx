import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Compass, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GUIAS, type TelaGuia } from "@/lib/apresentacao";

type Caixa = { top: number; left: number; width: number; height: number };

const CHAVE = (tela: TelaGuia) => `bussola:guia:${tela}`;
const CHAVE_DESATIVADO = "bussola:guia:desativado";

/** Preferência global: o tour não abre sozinho em nenhuma tela. */
export function tourDesativado(): boolean {
  try {
    return localStorage.getItem(CHAVE_DESATIVADO) === "1";
  } catch {
    return false;
  }
}

export function definirTourDesativado(valor: boolean) {
  try {
    if (valor) localStorage.setItem(CHAVE_DESATIVADO, "1");
    else localStorage.removeItem(CHAVE_DESATIVADO);
  } catch {
    /* armazenamento indisponível */
  }
}

function medir(alvo?: string): Caixa | null {
  if (!alvo || typeof document === "undefined") return null;
  const el = document.querySelector<HTMLElement>(`[data-guia="${alvo}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function ApresentacaoGuiada({ tela }: { tela: TelaGuia }) {
  const guia = GUIAS[tela];
  const [aberta, setAberta] = useState(false);
  const [i, setI] = useState(0);
  const [caixa, setCaixa] = useState<Caixa | null>(null);
  const [desativado, setDesativado] = useState(false);

  const passo = guia.passos[Math.min(i, guia.passos.length - 1)];

  const abrir = useCallback(() => {
    setI(0);
    setAberta(true);
  }, []);

  const fechar = useCallback(() => {
    setAberta(false);
    try {
      localStorage.setItem(CHAVE(tela), "1");
    } catch {
      /* armazenamento indisponível */
    }
  }, [tela]);

  const alternarDesativado = useCallback((valor: boolean) => {
    definirTourDesativado(valor);
    setDesativado(valor);
  }, []);

  // Primeira visita à tela: abre sozinha, a menos que o tour esteja desativado.
  useEffect(() => {
    const off = tourDesativado();
    setDesativado(off);
    if (off) return undefined;
    let visto = "1";
    try {
      visto = localStorage.getItem(CHAVE(tela)) ?? "";
    } catch {
      visto = "1";
    }
    if (!visto) {
      const t = window.setTimeout(() => setAberta(true), 500);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [tela]);

  // Posiciona o destaque no elemento do passo atual.
  useEffect(() => {
    if (!aberta) return undefined;
    const alvo = passo?.alvo;
    const el = alvo ? document.querySelector<HTMLElement>(`[data-guia="${alvo}"]`) : null;
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    const atualizar = () => setCaixa(medir(alvo));
    const t = window.setTimeout(atualizar, 260);
    atualizar();
    window.addEventListener("resize", atualizar);
    window.addEventListener("scroll", atualizar, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", atualizar);
      window.removeEventListener("scroll", atualizar, true);
    };
  }, [aberta, passo?.alvo, i]);

  const avancar = useCallback(() => {
    setI((v) => {
      if (v >= guia.passos.length - 1) {
        fechar();
        return v;
      }
      return v + 1;
    });
  }, [fechar, guia.passos.length]);

  const voltar = useCallback(() => setI((v) => Math.max(0, v - 1)), []);

  useEffect(() => {
    if (!aberta) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
      if (e.key === "ArrowRight" || e.key === "Enter") avancar();
      if (e.key === "ArrowLeft") voltar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberta, avancar, fechar, voltar]);

  const botao = (
    <Button variant="outline" size="sm" onClick={abrir} data-guia="botao-apresentacao">
      <Compass className="h-4 w-4" />
      <span className="hidden sm:inline">Apresentação guiada</span>
    </Button>
  );

  if (!aberta || typeof document === "undefined") return botao;

  const margem = 12;
  const larguraCartao = 420;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const vw = typeof window === "undefined" ? 1200 : window.innerWidth;

  let estiloCartao: React.CSSProperties;
  if (caixa) {
    const abaixo = caixa.top + caixa.height + margem;
    const cabeAbaixo = abaixo + 260 < vh;
    estiloCartao = {
      position: "fixed",
      top: cabeAbaixo ? abaixo : undefined,
      bottom: cabeAbaixo ? undefined : Math.max(margem, vh - caixa.top + margem),
      left: Math.min(Math.max(margem, caixa.left), Math.max(margem, vw - larguraCartao - margem)),
      width: Math.min(larguraCartao, vw - margem * 2),
      maxHeight: "70vh",
      overflowY: "auto",
    };
  } else {
    estiloCartao = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: Math.min(larguraCartao + 60, vw - margem * 2),
      maxHeight: "80vh",
      overflowY: "auto",
    };
  }

  return (
    <>
      {botao}
      {createPortal(
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={guia.titulo}>
          {caixa ? (
            <div
              className="pointer-events-none absolute rounded-md ring-2 ring-primary transition-all duration-200"
              style={{
                top: caixa.top - 4,
                left: caixa.left - 4,
                width: caixa.width + 8,
                height: caixa.height + 8,
                boxShadow: "0 0 0 9999px oklch(0.15 0.02 260 / 0.62)",
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-foreground/55" />
          )}

          <button
            type="button"
            aria-label="Fechar apresentação"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={fechar}
          />

          <aside
            className="rounded-md border border-border bg-card p-4 shadow-lg"
            style={estiloCartao}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {guia.titulo} · passo {i + 1} de {guia.passos.length}
              </p>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fechar} aria-label="Fechar">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <h3 className="mt-2 text-base font-bold">{passo?.titulo}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{passo?.texto}</p>

            {passo?.campos?.length ? (
              <dl className="mt-3 space-y-2 border-t border-border pt-3">
                {passo.campos.map((campo) => (
                  <div key={campo.nome}>
                    <dt className="text-xs font-semibold uppercase tracking-wide">{campo.nome}</dt>
                    <dd className="text-xs leading-relaxed text-muted-foreground">{campo.texto}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="mt-4 flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={fechar}>
                Sair
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={voltar} disabled={i === 0}>
                  <ChevronLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <Button size="sm" onClick={avancar}>
                  {i >= guia.passos.length - 1 ? "Concluir" : "Avançar"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </aside>
        </div>,
        document.body,
      )}
    </>
  );
}
