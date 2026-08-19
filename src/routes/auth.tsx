import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar no Bússola — planejamento estratégico" },
      {
        name: "description",
        content:
          "Acesse o Bússola para conduzir o ciclo de planejamento estratégico do seu time, do diagnóstico ao acompanhamento da execução.",
      },
      { property: "og:title", content: "Entrar no Bússola" },
      {
        property: "og:description",
        content: "Copiloto de planejamento estratégico para times executivos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/ciclos" });
    });
  }, [navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      if (modo === "criar") {
        const { error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            data: { nome },
            emailRedirectTo: `${window.location.origin}/ciclos`,
          },
        });
        if (error) throw error;
        toast.success("Conta criada. Você já pode entrar.");
        void navigate({ to: "/ciclos" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        void navigate({ to: "/ciclos" });
      }
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível continuar.");
    } finally {
      setEnviando(false);
    }
  }

  async function entrarComGoogle() {
    const resultado = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (resultado.error) {
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
    if (resultado.redirected) return;
    void navigate({ to: "/ciclos" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-superficie px-4 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-6 flex items-center gap-2 font-display text-lg font-bold">
          <Compass className="h-5 w-5 text-primary" />
          Bússola
        </Link>
        <div className="rounded-md border border-border bg-card p-6">
          <h1 className="text-xl font-bold">
            {modo === "entrar" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Planejamento estratégico que não deixa o plano ficar frouxo.
          </p>

          <form onSubmit={enviar} className="mt-5 space-y-3">
            {modo === "criar" ? (
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Como o time te chama"
                />
              </div>
            ) : null}
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete={modo === "criar" ? "new-password" : "current-password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={enviando}>
              {modo === "entrar" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <Button variant="outline" className="mt-3 w-full" onClick={entrarComGoogle}>
            Continuar com Google
          </Button>

          <button
            type="button"
            className="mt-4 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
          >
            {modo === "entrar"
              ? "Não tenho conta — criar agora"
              : "Já tenho conta — entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
