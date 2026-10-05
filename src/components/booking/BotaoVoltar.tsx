"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { anteriorParaVoltar } from "@/lib/rastro";
import { cn } from "@/lib/utils";

/**
 * A seta de voltar da página da barbearia e do agendamento.
 *
 * Veio de dentro do app (a busca, os favoritos, o card do agendamento)? Volta
 * pelo histórico, e a pessoa reencontra a tela como deixou — com o filtro da
 * busca e a rolagem. Abriu o link direto (Instagram, WhatsApp)? Vai para o
 * `destino` fixo.
 *
 * É um <Link> de verdade: sem JavaScript, ou no clique com o botão do meio,
 * ele leva ao `destino`.
 */
export function BotaoVoltar({
  destino,
  ignorar,
  rotulo,
  className,
}: {
  destino: string;
  /** Caminho que não conta como "de onde vim" (ele e o que estiver abaixo dele). */
  ignorar?: string;
  rotulo: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <Link
      href={destino}
      aria-label={rotulo}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        if (anteriorParaVoltar(ignorar)) {
          e.preventDefault();
          router.back();
        }
      }}
      className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-chip", className)}
    >
      <ArrowLeft className="h-5 w-5" aria-hidden />
    </Link>
  );
}
