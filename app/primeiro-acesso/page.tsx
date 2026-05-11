import { PrimeiroAcessoForm } from "@/components/auth/primeiro-acesso-form";
// Se você tiver um componente de logo, importe-o aqui. Ex: import { Logo } from "@/components/ui/logo"

export default function PrimeiroAcessoPage() {
  return (
    <main className="flex min-h-screen">
      {/* Lado Esquerdo - Branco (Formulário) */}
      <div className="flex w-full flex-col px-8 py-10 lg:w-1/2 lg:px-24 xl:px-32">
        {/* Aqui você pode colocar o seu componente de Logo. Substitua a div abaixo pelo seu Logo */}
        <div className="flex items-center gap-2 font-bold text-[#623CEA] text-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#623CEA] text-white">
            CR {/* Ícone provisório */}
          </div>
          CondoReserva
        </div>

        <div className="my-auto max-w-md">
          <p className="text-sm font-semibold text-on-surface-variant">Primeiro Acesso</p>
          <h1 className="mt-2 text-4xl font-black text-on-surface tracking-tight">
            Crie sua senha definitiva
          </h1>
          <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
            Para garantir a segurança da sua conta, por favor, substitua a senha padrão por uma senha forte de sua preferência.
          </p>

          {/* O componente com os 2 campos de senha */}
          <PrimeiroAcessoForm />
        </div>

        <p className="mt-auto text-center text-xs text-on-surface-variant font-medium">
          CondoReserva © 2026
        </p>
      </div>

      {/* Lado Direito - Roxo (Visual) */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#8456F6] to-[#623CEA] p-12 lg:flex">
        {/* Efeito de blur/glow no fundo (igual ao seu print) */}
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-white/10 blur-[80px]" />
        
        <div className="relative z-10 text-center text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-white" /> SEGURANÇA
          </span>
          
          <h2 className="mt-6 text-4xl font-black leading-tight">
            Sua conta protegida <br /> e exclusiva
          </h2>
          <p className="mt-6 max-w-md text-sm text-white/80 leading-relaxed mx-auto">
            A senha é pessoal e intransferível. Após a troca, você terá acesso completo ao portal para consultar áreas comuns, solicitar reservas e acompanhar aprovações.
          </p>
        </div>
      </div>
    </main>
  );
}