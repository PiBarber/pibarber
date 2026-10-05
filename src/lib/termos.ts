/**
 * AS VERSÕES DOS TERMOS DE USO E DA POLÍTICA DE PRIVACIDADE — um lugar só.
 *
 * A versão é a data em que o texto mudou. É ela que vai para o registro do
 * aceite (supabase/37_aceite_dos_termos.sql) e é ela que /termos e
 * /privacidade mostram em "Atualizados em".
 *
 * ⚠️ Mudou o texto de forma relevante? Troque a data aqui. Na próxima página
 * protegida, toda conta que aceitou a versão anterior cai em /aceitar-termos
 * e só segue depois de aceitar a nova. Correção de vírgula não precisa.
 *
 * Mora fora de "server-only" porque o middleware (edge) também lê.
 */

export const VERSAO_TERMOS = "2026-09-24";
export const VERSAO_PRIVACIDADE = "2026-09-24";

export const ROTA_ACEITAR_TERMOS = "/aceitar-termos";

/** Por onde a pessoa aceitou — o check de `terms_acceptances.source`. */
export type OrigemAceite =
  | "cadastro_cliente"
  | "cadastro_barbearia"
  | "vinculo_barbearia"
  | "tela_de_aceite";

/** A conta aceitou as versões de hoje? Lê as colunas que o trigger mantém no perfil. */
export function aceiteEmDia(
  perfil: { terms_version: string | null; privacy_version: string | null } | null,
): boolean {
  return perfil?.terms_version === VERSAO_TERMOS && perfil?.privacy_version === VERSAO_PRIVACIDADE;
}

/** "2026-09-24" → "24 de setembro de 2026". */
export function dataDaVersao(versao: string): string {
  return new Date(`${versao}T12:00:00Z`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** O erro de quem tenta seguir sem marcar a caixa. */
export const MENSAGEM_TERMOS =
  "Aceite os termos de uso e a política de privacidade para continuar.";
