"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { CHAVE_RASTRO_ANTERIOR, CHAVE_RASTRO_ATUAL } from "@/lib/rastro";

/**
 * Guarda de qual página a pessoa veio, para o botão de voltar da página da
 * barbearia (src/components/booking/BotaoVoltar.tsx) saber se dá para voltar
 * pelo histórico.
 *
 * Por que não `document.referrer`: o Next troca de página sem recarregar, e o
 * referrer continua sendo o da primeira carga.
 *
 * Só o caminho, sem a query: a decisão é "veio de dentro do app?", e o
 * `router.back()` devolve a URL inteira (com o filtro da busca) sozinho.
 * Vive na sessionStorage — some ao fechar a aba, que é quando o histórico
 * também some.
 */
export function RastroDeNavegacao() {
  const caminho = usePathname();

  useEffect(() => {
    try {
      const atual = sessionStorage.getItem(CHAVE_RASTRO_ATUAL);
      if (atual === caminho) return;
      if (atual) sessionStorage.setItem(CHAVE_RASTRO_ANTERIOR, atual);
      else sessionStorage.removeItem(CHAVE_RASTRO_ANTERIOR);
      sessionStorage.setItem(CHAVE_RASTRO_ATUAL, caminho);
    } catch {
      // Navegador sem sessionStorage (aba privada antiga): o botão cai no destino fixo.
    }
  }, [caminho]);

  return null;
}
