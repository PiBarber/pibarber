/**
 * A trilha de navegação (src/components/RastroDeNavegacao.tsx): a página atual
 * e a anterior, na sessionStorage.
 */

export const CHAVE_RASTRO_ATUAL = "pibarber-rastro-atual";
export const CHAVE_RASTRO_ANTERIOR = "pibarber-rastro-anterior";

/**
 * Áreas de onde vale voltar pelo histórico. Fora delas — o login, a tela de
 * aceite, a landing — voltar levaria a uma tela de passagem, e o botão usa o
 * destino fixo.
 */
const AREAS_DO_APP = ["/app", "/painel", "/admin", "/b/"];

/** A página anterior, se ela for um lugar do app para onde faz sentido voltar. */
export function anteriorParaVoltar(ignorar?: string): string | null {
  let anterior: string | null = null;
  try {
    anterior = sessionStorage.getItem(CHAVE_RASTRO_ANTERIOR);
  } catch {
    return null;
  }
  if (!anterior) return null;
  if (ignorar && (anterior === ignorar || anterior.startsWith(`${ignorar}/`))) return null;
  const doApp = AREAS_DO_APP.some((area) =>
    area.endsWith("/")
      ? anterior.startsWith(area)
      : anterior === area || anterior.startsWith(`${area}/`),
  );
  return doApp ? anterior : null;
}
