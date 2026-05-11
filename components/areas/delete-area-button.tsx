"use client";

export function DeleteAreaButton() {
  return (
    <button
      type="submit"
      className="rounded-lg border border-outline-variant/40 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-600 hover:bg-red-50"
      onClick={(e) => {
        if (
          !window.confirm(
            "Tem certeza? Sem reservas, a área será ocultada. Com reservas, ela será marcada como indisponível."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      Excluir
    </button>
  );
}
