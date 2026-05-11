import { clsx, type ClassValue } from "clsx";

export function censurarTelefone(telefone: string | null) {
  if (!telefone) return "-";
  
  // Remove tudo que não é número (parênteses, traços, espaços)
  const apenasNumeros = telefone.replace(/\D/g, "");
  
  // Se por algum motivo o número for muito curto, retorna como está
  if (apenasNumeros.length < 4) return telefone;
  
  // Pega os últimos 4 dígitos e coloca a máscara na frente
  const ultimos4 = apenasNumeros.slice(-4);
  return `(••) •••••-${ultimos4}`; 
}

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
