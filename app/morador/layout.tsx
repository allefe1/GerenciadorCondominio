import { Bell } from "lucide-react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { getNavItems } from "@/components/dashboard/user-nav";
import { requireRole } from "@/lib/auth/current-user";

export default async function MoradorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await requireRole(["MORADOR"]);

  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface">
      <Sidebar navItems={getNavItems(currentUser.tipoUsuario)} />
      <div className="ml-20">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-end bg-white/85 px-8 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button className="rounded-full bg-surface-container-lowest p-2 text-on-surface-variant transition hover:text-primary">
              <Bell className="h-5 w-5" />
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{currentUser.nomeCompleto}</p>
              <p className="text-xs text-on-surface-variant">{currentUser.email}</p>
            </div>
          </div>
        </header>
        <main className="space-y-6 p-8">{children}</main>
      </div>
    </div>
  );
}
