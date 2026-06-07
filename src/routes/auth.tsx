import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Hammer, Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — OrçaMetal" },
      { name: "description", content: "Acesse o sistema de orçamentos e ordens de serviço." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/ordens" });
  }, [loading, session, navigate]);

  if (!loading && session) return <Navigate to="/ordens" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível entrar", { description: "E-mail ou senha inválidos." });
      return;
    }
    navigate({ to: "/ordens" });
  };

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-background">
      {/* Decorative gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(217 91% 60% / 0.35), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 h-[520px] w-[520px] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(38 92% 55% / 0.30), transparent 70%)" }}
      />

      {/* Left brand panel (hidden on small screens) */}
      <aside className="relative hidden flex-1 flex-col justify-between p-12 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Hammer className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">OrçaMetal</span>
        </div>

        <div className="max-w-md space-y-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Orçamentos profissionais em <span className="text-primary">minutos</span>, não em horas.
          </h1>
          <p className="text-base text-muted-foreground">
            Cadastre clientes, monte ordens de serviço e gere PDFs prontos para imprimir — feito sob medida para serralherias, calhas e metalúrgicas.
          </p>

          <ul className="space-y-3 pt-2">
            {[
              { icon: FileText, text: "Orçamentos em PDF padronizados" },
              { icon: Sparkles, text: "Catálogo de produtos e clientes" },
              { icon: ShieldCheck, text: "Dados seguros na nuvem" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-foreground/90">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} OrçaMetal. Todos os direitos reservados.
        </p>
      </aside>

      {/* Right login panel */}
      <main className="relative flex w-full flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:max-w-xl">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Hammer className="h-7 w-7" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight">OrçaMetal</h1>
              <p className="text-sm text-muted-foreground">Orçamentos e Ordens de Serviço</p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card/80 p-7 shadow-xl shadow-black/5 backdrop-blur sm:p-8">
            <div className="mb-6 space-y-1.5">
              <h2 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h2>
              <p className="text-sm text-muted-foreground">
                Entre com suas credenciais para acessar o painel.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@empresa.com"
                    className="h-11 pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 px-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="h-11 w-full text-sm font-semibold" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar no painel"
                )}
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-2 rounded-lg border border-dashed bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>Acesso restrito. Os usuários são cadastrados pelo administrador.</span>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground lg:hidden">
            © {new Date().getFullYear()} OrçaMetal
          </p>
        </div>
      </main>
    </div>
  );
}
