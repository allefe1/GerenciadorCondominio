"use client";

export function DeleteAreaButton() {
  return (
    <button
      type="submit"
      className="rounded-lg border border-outline-variant/40 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-600 hover:bg-red-50"
      onClick={(e) => {
        if (
          !window.confirm(
            "Tem certeza que deseja excluir esta área? (As reservas antigas serão mantidas no histórico)"
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