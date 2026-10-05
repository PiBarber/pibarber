import { redirect } from "next/navigation";

import { ROTA_CADASTRAR_BARBEARIA, ROTA_CRIAR_CONTA_CLIENTE } from "@/lib/lado";

/**
 * ENDEREÇO ANTIGO. O cadastro foi separado em duas portas (src/lib/lado.ts):
 *
 *   /criar-conta?tipo=barbearia → /cadastrar-barbearia
 *   /criar-conta                → /criar-conta-cliente
 *
 * Fica de pé pelos links velhos (e-mails, favoritos, anúncios).
 */
export default async function CriarContaAntigaPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  redirect(tipo === "barbearia" ? ROTA_CADASTRAR_BARBEARIA : ROTA_CRIAR_CONTA_CLIENTE);
}
