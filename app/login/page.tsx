import Link from "next/link";
import { Building2, ShieldCheck, UserCog, UserRound } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-surface px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-container text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-primary">CondoReserva</h1>
            <p className="text-sm text-on-surface-variant">Selecione o portal de acesso</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Link
            href="/login/morador"
            className="rounded-[28px] bg-surface-container-lowest p-8 shadow-ambient transition hover:-translate-y-1"
          >
            <UserRound className="h-8 w-8 text-primary" />
            <h2 className="mt-6 text-2xl font-black">Morador</h2>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">
              Consulta de disponibilidade, solicitacao e acompanhamento de reservas.
            </p>
          </Link>

          <Link
            href="/login/admin"
            className="rounded-[28px] bg-[#1A1A2E] p-8 text-white shadow-ambient transition hover:-translate-y-1"
          >
            <UserCog className="h-8 w-8 text-white" />
            <h2 className="mt-6 text-2xl font-black">Administrador</h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Gestao operacional de moradores, perfis e reservas do condominio.
            </p>
          </Link>

          <Link
            href="/login/sindico"
            className="rounded-[28px] bg-brand-gradient p-8 text-white shadow-ambient transition hover:-translate-y-1"
          >
            <ShieldCheck className="h-8 w-8 text-white" />
            <h2 className="mt-6 text-2xl font-black">Sindico</h2>
            <p className="mt-3 text-sm leading-6 text-white/80">
              Aprovacoes, supervisao de fluxos e visao executiva do condominio.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
