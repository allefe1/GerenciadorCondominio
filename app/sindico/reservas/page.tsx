import { ReservationManagementPage } from "@/components/reservas/reservation-management-page";
import { requireRole } from "@/lib/auth/current-user";

export default async function SindicoReservasPage() {
  const currentUser = await requireRole(["SINDICO"]);

  return (
    <ReservationManagementPage
      currentUser={currentUser}
      currentPath="/sindico/reservas"
      pageTitle="Aprovação de reservas"
      pageSubtitle="Supervisione solicitações e o calendário de áreas comuns"
    />
  );
}
