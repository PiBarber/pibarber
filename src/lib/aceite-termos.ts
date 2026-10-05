import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { VERSAO_PRIVACIDADE, VERSAO_TERMOS, type OrigemAceite } from "@/lib/termos";

/**
 * Grava que `userId` aceitou as versões de hoje dos termos e da política
 * (supabase/37_aceite_dos_termos.sql). O trigger copia as versões para o
 * perfil, que é onde o middleware confere.
 *
 * Usa a service role: a tabela não tem escrita para quem tem sessão. Quem
 * chama já provou de quem é o `userId` — o `signUp` acabou de criá-lo, ou a
 * sessão é dele.
 *
 * Não levanta: devolve `false` e registra no log. Quem chama decide. No
 * cadastro, a conta segue — sem o registro, a tela de aceite pede de novo no
 * primeiro acesso, então a prova nunca fica faltando sem a pessoa ser parada.
 */
export async function registrarAceite(userId: string, origem: OrigemAceite): Promise<boolean> {
  try {
    const { error } = await createAdminClient().from("terms_acceptances").insert({
      user_id: userId,
      terms_version: VERSAO_TERMOS,
      privacy_version: VERSAO_PRIVACIDADE,
      source: origem,
    });
    if (error) {
      console.error("[termos] falha ao registrar o aceite:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[termos] erro inesperado ao registrar o aceite:", error);
    return false;
  }
}
