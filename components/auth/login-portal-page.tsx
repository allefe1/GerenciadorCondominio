import { Building2, KeyRound, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { TipoUsuario } from "@prisma/client";

import { LoginForm } from "@/components/auth/login-form";
import { loginPortalContent } from "@/lib/auth/portal";

type LoginPortalPageProps = {
  portal: TipoUsuario;
};

export function LoginPortalPage({ portal }: LoginPortalPageProps) {
  const content = loginPortalContent[portal];

  return (
    <main className="flex min-h-screen w-full bg-surface">
      <section className="flex w-full flex-col bg-surface-container-lowest p-8 md:p-12 lg:w-1/2 lg:p-20">
        <div className="mb-auto flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-2xl font-black tracking-tight text-primary">CondoReserva</span>
        </div>

        <div className="mx-auto my-auto w-full max-w-md">
          <header className="mb-10 space-y-3">
            <p className="text-lg font-medium text-on-surface">{content.eyebrow}</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">
              {content.title}
            </h1>
            <p className="text-sm text-on-surface-variant">{content.description}</p>
          </header>

          <div className="mb-6 rounded-2xl bg-primary-fixed p-4">
            <p className="mb-3 text-sm font-bold text-on-primary-fixed-variant">
              Acesso de demonstracao
            </p>
            <div className="space-y-2 text-xs text-on-primary-fixed-variant">
              {content.demoAccounts.map((account) => (
                <p key={account.email}>
                  <span className="font-bold">{account.email}</span> /{" "}
                  <span className="font-bold">{account.password}</span> → {account.role}
                </p>
              ))}
            </div>
          </div>

          <LoginForm portal={portal} />

          <div className="mt-6 text-sm text-on-surface-variant">
            <Link href={content.alternateHref} className="font-semibold text-primary hover:underline">
              {content.alternateLabel}
            </Link>
          </div>
        </div>

        <footer className="mt-auto pt-10 text-center text-sm text-on-surface-variant">
          CondoReserva © 2026
        </footer>
      </section>

      <section
        className={`relative hidden w-1/2 items-center justify-center overflow-hidden p-12 lg:flex ${content.accentClassName}`}
      >
        <Lock className="absolute right-20 top-20 h-24 w-24 rotate-12 text-white/20" />
        <KeyRound className="absolute bottom-20 left-10 h-24 w-24 -rotate-12 text-white/10" />
        <ShieldCheck className="absolute left-20 top-1/4 h-20 w-20 text-white/15" />
        <div className="absolute left-1/4 top-32 h-12 w-32 rounded-full bg-white/20 blur-xl" />
        <div className="absolute bottom-40 right-1/4 h-16 w-48 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 max-w-lg text-center text-white">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-lg">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-[0.24em]">{content.badge}</span>
          </div>
          <h2 className="text-3xl font-black leading-tight">{content.sideTitle}</h2>
          <p className="mt-4 text-sm text-white/70">{content.sideDescription}</p>
        </div>
      </section>
    </main>
  );
}
