import { Building2, LockKeyhole } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center bg-surface px-6 py-10">
      <section className="mx-auto w-full max-w-md rounded-lg bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-2xl font-black text-primary">CondoReserva</span>
        </div>

        <div className="mb-8">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed-variant">
            <LockKeyhole aria-hidden="true" size={20} />
          </div>
          <h1 className="text-2xl font-black text-on-surface">Acesse sua conta</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Informe suas credenciais para acessar seu ambiente.
          </p>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}
