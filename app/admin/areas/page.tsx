import Link from "next/link";
import { db } from "@/lib/db";
import { AreaForm } from "@/components/areas/area-form";
import { deleteAreaAction, toggleAreaStatusAction } from "@/app/actions/areas";
import { DeleteAreaButton } from "@/components/areas/delete-area-button";

export default async function AreasPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const resolvedParams = await searchParams;
  const editParam = resolvedParams.edit;
  const isEditing = !!editParam;

  // A MÁGICA DO SOFT DELETE: Só buscamos as áreas onde deletadoEm é nulo
  const areas = await db.areaComum.findMany({
    where: { deletadoEm: null },
    orderBy: { nomeArea: "asc" },
  });

  let editingArea = null;
  if (editParam && editParam !== "new") {
    // Procura a área específica e converte o Decimal para Number
    const foundArea = areas.find((a) => a.id === Number(editParam));
    if (foundArea) {
      editingArea = {
        ...foundArea,
        valorReserva: Number(foundArea.valorReserva),
      };
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-on-surface">Áreas Comuns</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Gerencie os espaços do condomínio disponíveis para reserva.
        </p>
      </div>

      {isEditing ? (
        <AreaForm editingArea={editingArea} cancelHref="/admin/areas" />
      ) : (
        <div className="rounded-[28px] bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-on-surface">Lista de Áreas</h2>
            <Link
              href="/admin/areas?edit=new"
              className="rounded-full bg-[#623CEA] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#5028D5]"
            >
              + Nova Área
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-outline-variant/30 text-on-surface-variant">
                <tr>
                  <th className="pb-3 pr-4 font-semibold">Nome</th>
                  <th className="pb-3 pr-4 font-semibold">Capacidade</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {areas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-on-surface-variant">
                      Nenhuma área cadastrada. Clique em "Nova Área" para começar.
                    </td>
                  </tr>
                ) : (
                  areas.map((area) => (
                    <tr key={area.id} className="transition hover:bg-surface-container-low/50">
                      <td className="py-4 pr-4 font-medium text-on-surface">{area.nomeArea}</td>
                      <td className="py-4 pr-4 text-on-surface-variant">{area.capacidadeMaxima} pessoas</td>
                      <td className="py-4 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            area.status === "DISPONIVEL"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {area.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/areas?edit=${area.id}`}
                            className="rounded-lg border border-outline-variant/40 px-3 py-1.5 text-xs font-semibold text-on-surface transition hover:border-primary hover:text-primary"
                          >
                            Editar
                          </Link>
                          <form action={toggleAreaStatusAction}>
                            <input type="hidden" name="id" value={area.id} />
                            <button
                              type="submit"
                              className="rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-50"
                            >
                              {area.status === "DISPONIVEL" ? "Inativar" : "Ativar"}
                            </button>
                          </form>
                          <form action={deleteAreaAction}>
                            <input type="hidden" name="id" value={area.id} />
                            <DeleteAreaButton />
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
