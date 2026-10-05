import { redirect } from "next/navigation";

import { portaDe, rotaDeEntrarCom } from "@/lib/lado";

/**
 * ENDEREÇO ANTIGO. O login foi separado em duas portas (src/lib/lado.ts):
 *
 *   /entrar?tipo=barbearia → /entrar-barbeiro
 *   /entrar                → /entrar-cliente
 *
 * Fica de pé porque há links velhos por aí — e-mails já enviados, favoritos,
 * telas salvas no celular. O `proximo` e o `erro` atravessam o redirect.
 */
export default async function EntrarAntigoPage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string; erro?: string; tipo?: string }>;
}) {
  const { proximo, erro, tipo } = await searchParams;
  redirect(rotaDeEntrarCom(portaDe(tipo), { proximo, erro }));
}
