import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Empresa = Tables<"empresas">;
export type Cliente = Tables<"clientes">;
export type Produto = Tables<"produtos">;
export type OrdemServico = Tables<"ordens_servico">;
export type OrdemItem = Tables<"ordem_servico_itens">;

/** Throws if a Supabase response carries an error, otherwise returns data. */
export function unwrap<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data;
}

export const UNIDADES = ["UN", "MT", "M²", "KG", "Barra", "PC", "CX"] as const;

export { supabase };
