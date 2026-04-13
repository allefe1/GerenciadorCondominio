import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type ResetPasswordTokenPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function ResetPasswordTokenPage({
  params,
}: ResetPasswordTokenPageProps) {
  const { token } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-6">
      <section className="w-full max-w-xl rounded-[24px] bg-surface-container-lowest p-8 shadow-ambient">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
          Recuperação de senha
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-on-surface">
          Definir nova senha
        </h1>
        <p className="mt-4 text-sm leading-6 text-on-surface-variant">
          Escolha uma nova senha forte para voltar a acessar o CondoReserva.
        </p>
        <ResetPasswordForm token={token} />
        <div className="mt-6 text-sm">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Voltar para o login
          </Link>
        </div>
      </section>
    </main>
  );
}
