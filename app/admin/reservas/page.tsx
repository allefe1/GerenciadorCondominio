import { ReservationManagementPage } from "@/components/reservas/reservation-management-page";
import { requireRole } from "@/lib/auth/current-user";

export default async function AdminReservasPage() {
  const currentUser = await requireRole(["ADMINISTRADOR"]);

  return (
    <ReservationManagementPage
      currentUser={currentUser}
      pageTitle="Gestão de reservas"
      pageSubtitle="Aprove, reprove e acompanhe o calendário operacional"
    />
  );
}
