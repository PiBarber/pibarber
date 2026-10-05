import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { sair } from "@/app/actions/auth";
import { FormAceitarTermos } from "@/components/auth/FormAceitarTermos";
import { requireProfile, rotaInicial } from "@/lib/auth";
import { aceiteEmDia } from "@/lib/termos";

export const metadata: Metadata = {
  title: "Termos de uso",
  robots: { index: false, follow: false },
};

/**
 * Para onde o middleware manda quem entrou no app ou no painel sem um aceite
 * em dia (src/lib/termos.ts): a conta criada pelo Google, o assistente criado
 * pelo dono, a conta de antes do registro existir — e todo mundo quando a
 * versão dos termos muda.
 *
 * Mora no grupo `(simples)`, fora de /app e /painel: dentro deles, o próprio
 * middleware a mandaria para cá de novo, em loop.
 */
export default async function AceitarTermosPage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string }>;
}) {
  const perfil = await requireProfile();
  const { proximo } = await searchParams;
  const destino = proximo?.startsWith("/") && !proximo.startsWith("//") ? proximo : undefined;

  // Já está em dia (aceitou em outra aba, ou abriu o endereço à toa).
  if (aceiteEmDia(perfil)) redirect(destino ?? rotaInicial(perfil));

  // Já aceitou uma versão antes: o que mudou foi o texto, não a pessoa.
  const atualizacao = perfil.terms_version !== null;

  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
      <h1 className="text-3xl text-ink">
        {atualizacao ? "Atualizamos nossos termos" : "Antes de continuar"}
      </h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        {atualizacao
          ? "Os termos de uso ou a política de privacidade mudaram. Leia e aceite a nova versão para seguir usando o PiBarber."
          : "Para usar o PiBarber, leia e aceite os termos de uso e a política de privacidade."}
      </p>

      <div className="mt-6">
        <FormAceitarTermos proximo={destino} />
      </div>

      <form action={sair} className="mt-4 text-center">
        <button type="submit" className="text-sm text-ink-faint hover:text-ink">
          Não aceito — sair da conta
        </button>
      </form>
    </div>
  );
}
