import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearchParams, Link } from "react-router";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(1, "Informe sua senha"),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome"),
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function Login() {
  const [tab, setTab] = useState<"entrar" | "criar">("entrar");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const utils = trpc.useUtils();

  const next = searchParams.get("next") || "/app";

  const onSuccess = async () => {
    await utils.auth.me.invalidate();
    navigate(next, { replace: true });
  };

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess,
    onError: (err) => toast.error(err.message),
  });
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      toast.success("Conta criada! Bem-vindo ao IsentaTáxi.");
      await onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col items-center justify-center px-4">
      <Link to="/" className="mb-8 flex items-center gap-2">
        <span className="font-display text-2xl tracking-tight">
          Isenta<span className="text-[#FACC15]">Táxi</span>
        </span>
      </Link>

      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#141416] p-6 shadow-2xl">
        {/* Abas */}
        <div className="mb-6 grid grid-cols-2 rounded-lg bg-white/5 p-1">
          {(
            [
              { id: "entrar", label: "Entrar" },
              { id: "criar", label: "Criar conta" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-md py-2 text-sm font-semibold transition-colors ${
                tab === t.id
                  ? "bg-[#FACC15] text-[#0A0A0B]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "entrar" ? (
          <form
            className="space-y-4"
            onSubmit={loginForm.handleSubmit((values) =>
              loginMutation.mutate(values),
            )}
          >
            <div className="space-y-2">
              <Label htmlFor="login-email">E-mail</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="voce@email.com"
                className="bg-white/5 border-white/10"
                {...loginForm.register("email")}
              />
              {loginForm.formState.errors.email && (
                <p className="text-xs text-red-400">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Senha</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="bg-white/5 border-white/10"
                {...loginForm.register("password")}
              />
              {loginForm.formState.errors.password && (
                <p className="text-xs text-red-400">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className="w-full bg-[#FACC15] text-[#0A0A0B] font-bold hover:bg-[#EAB308]"
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        ) : (
          <form
            className="space-y-4"
            onSubmit={registerForm.handleSubmit((values) =>
              registerMutation.mutate(values),
            )}
          >
            <div className="space-y-2">
              <Label htmlFor="reg-name">Nome</Label>
              <Input
                id="reg-name"
                autoComplete="name"
                placeholder="Seu nome"
                className="bg-white/5 border-white/10"
                {...registerForm.register("name")}
              />
              {registerForm.formState.errors.name && (
                <p className="text-xs text-red-400">
                  {registerForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">E-mail</Label>
              <Input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="voce@email.com"
                className="bg-white/5 border-white/10"
                {...registerForm.register("email")}
              />
              {registerForm.formState.errors.email && (
                <p className="text-xs text-red-400">
                  {registerForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Senha</Label>
              <Input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                className="bg-white/5 border-white/10"
                {...registerForm.register("password")}
              />
              {registerForm.formState.errors.password && (
                <p className="text-xs text-red-400">
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className="w-full bg-[#FACC15] text-[#0A0A0B] font-bold hover:bg-[#EAB308]"
            >
              {registerMutation.isPending ? "Criando..." : "Criar conta"}
            </Button>
          </form>
        )}
      </div>

      <p className="mt-6 text-xs text-white/40 text-center max-w-xs">
        Isenção de IPI/ICMS para taxistas de São Paulo — acompanhe seu processo
        etapa por etapa.
      </p>
    </div>
  );
}
