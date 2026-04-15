"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, LogOut, Shield, UserCog, UserRound } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";

type NavItem = {
  href: string;
  label: string;
};

type SidebarProps = {
  navItems: NavItem[];
};

const iconMap: Record<string, typeof Home> = {
  Home,
  Reservas: CalendarDays,
  Perfil: UserRound,
  Usuarios: UserCog,
  Seguranca: Shield,
};

export function Sidebar({ navItems }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 flex h-full w-20 flex-col items-center gap-6 bg-[#1A1A2E] py-6 text-slate-300 shadow-ambient">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-container text-sm font-black text-white">
        CR
      </div>
      <nav className="flex flex-1 flex-col gap-3">
        {navItems.map(({ href, label }) => {
          const Icon = iconMap[label] ?? Home;
          const active = pathname === href;

          return (
            <Link
              key={label}
              href={href}
              className={`flex w-16 flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[10px] font-medium transition ${
                active ? "bg-primary-container text-white" : "hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <form action={logoutAction}>
        <button
          type="submit"
          className="flex w-16 flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[10px] font-medium transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </form>
    </aside>
  );
}
