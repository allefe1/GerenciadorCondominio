import { markAllNotificationsAsReadAction, markNotificationAsReadAction } from "@/app/actions/reservas";
import { formatDateBR } from "@/lib/reservas";

type NotificationItem = {
  id: number;
  titulo: string;
  mensagem: string;
  lidaEm: Date | null;
  criadoEm: Date;
};

type NotificationListProps = {
  notifications: NotificationItem[];
};

export function NotificationList({ notifications }: NotificationListProps) {
  return (
    <article className="rounded-[28px] bg-surface-container-lowest p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Notificações</p>
          <h2 className="mt-2 text-2xl font-black">Atualizações das reservas</h2>
        </div>
        {notifications.some((item) => item.lidaEm === null) ? (
          <form action={markAllNotificationsAsReadAction}>
            <button
              type="submit"
              className="rounded-[12px] border border-outline-variant/40 px-3 py-2 text-xs font-semibold text-on-surface transition hover:border-primary hover:text-primary"
            >
              Marcar todas como lidas
            </button>
          </form>
        ) : null}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-outline-variant/30 px-4 py-5 text-sm text-on-surface-variant">
            Nenhuma notificação disponível no momento.
          </div>
        ) : (
          notifications.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-[18px] border px-4 py-4 ${
                notification.lidaEm
                  ? "border-outline-variant/20 bg-white"
                  : "border-primary/20 bg-primary-fixed/40"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-on-surface">{notification.titulo}</p>
                  <p className="mt-1 text-sm text-on-surface-variant">{notification.mensagem}</p>
                  <p className="mt-2 text-xs text-on-surface-variant">
                    {formatDateBR(notification.criadoEm)}
                  </p>
                </div>

                {notification.lidaEm === null ? (
                  <form action={markNotificationAsReadAction}>
                    <input type="hidden" name="idNotificacao" value={notification.id} />
                    <button
                      type="submit"
                      className="rounded-[12px] border border-outline-variant/40 px-3 py-2 text-xs font-semibold text-on-surface transition hover:border-primary hover:text-primary"
                    >
                      Marcar como lida
                    </button>
                  </form>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    Lida
                  </span>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </article>
  );
}
