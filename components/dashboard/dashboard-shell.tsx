import Link from "next/link";
import { Bell, CalendarDays, Home, LogOut, Shield, UserCog, UserRound } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";

type NavItem = {
  href: string;
  label: string;
};

type DashboardShellProps = {
  roleLabel: string;
  title: string;
  subtitle: string;
  currentPath: string;
  userName: string;
  userEmail: string;
  navItems: NavItem[];
  children: React.ReactNode;
};

const iconMap: Record<string, typeof Home> = {
  Home,
  Reservas: CalendarDays,
  Perfil: UserRound,
  Usuarios: UserCog,
  Seguranca: Shield,
};

export function DashboardShell({
  roleLabel,
  title,
  subtitle,
  currentPath,
  userName,
  userEmail,
  navItems,
  children,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface">
      <aside className="fixed left-0 top-0 flex h-full w-20 flex-col items-center gap-6 bg-[#1A1A2E] py-6 text-slate-300 shadow-ambient">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-container text-sm font-black text-white">
          CR
        </div>
        <nav className="flex flex-1 flex-col gap-3">
          {navItems.map(({ href, label }) => {
            const Icon = iconMap[label] ?? Home;
            const active = currentPath === href;

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

      <div className="ml-20">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between bg-white/85 px-8 backdrop-blur-xl">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">{roleLabel}</p>
            <h1 className="text-lg font-bold">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="rounded-full bg-surface-container-lowest p-2 text-on-surface-variant transition hover:text-primary">
              <Bell className="h-5 w-5" />
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{userName}</p>
              <p className="text-xs text-on-surface-variant">{userEmail}</p>
            </div>
          </div>
        </header>

        <main className="space-y-6 p-8">{children}</main>
      </div>
    </div>
  );
}
