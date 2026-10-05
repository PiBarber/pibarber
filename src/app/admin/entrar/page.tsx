import type { Metadata } from "next";

import { CascaSimples } from "@/components/auth/CascaSimples";
import { FormEntrar } from "@/components/auth/FormEntrar";

export const metadata: Metadata = {
  title: "Entrar no admin",
  robots: { index: false, follow: false },
};

/**
 * A PORTA DO ADMIN (src/lib/lado.ts). Só e-mail e senha: sem Google, sem
 * cadastro e sem link para as outras portas.
 *
 * Mora em /admin/entrar, FORA do grupo `(painel)`: o layout de lá chama
 * `requireAdmin()`, e uma tela de login atrás dele entraria em loop.
 */
export default async function EntrarAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string; erro?: string }>;
}) {
  const { proximo, erro } = await searchParams;

  return (
    <CascaSimples>
      <div className="rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
        <h1 className="text-3xl text-ink">Admin</h1>
        <p className="mt-1.5 text-sm text-ink-soft">Acesso restrito à equipe da plataforma.</p>

        <div className="mt-6">
          <FormEntrar proximo={proximo} erroInicial={erro} lado="admin" />
        </div>
      </div>
    </CascaSimples>
  );
}
