import type { Metadata } from "next";
import Link from "next/link";

import { FormEntrar } from "@/components/auth/FormEntrar";
import { ResumoDoDia } from "@/components/auth/Ilustracoes";
import { TelaDividida } from "@/components/auth/TelaDividida";
import { LinkButton } from "@/components/ui";
import { ROTA_CADASTRAR_BARBEARIA, ROTA_ENTRAR_CLIENTE } from "@/lib/lado";

export const metadata: Metadata = { title: "Entrar no painel" };

/**
 * A PORTA DO BARBEIRO (src/lib/lado.ts): dono e assistente. O "Entrar" da
 * landing. A sessão que nasce aqui é do lado da barbearia; uma conta só de
 * cliente que entra por aqui é convidada a abrir a barbearia dela.
 */
export default async function EntrarBarbeiroPage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string; erro?: string }>;
}) {
  const { proximo, erro } = await searchParams;

  return (
    <TelaDividida
      frase="Menos esforço na rotina, mais"
      destaque="controle do seu negócio."
      apoio="Agenda, caixa, comissões e equipe num só painel — feito para donos e barbeiros."
      ilustracao={<ResumoDoDia />}
    >
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
        Painel da barbearia
      </p>
      <h1 className="text-3xl text-ink">Acesse seu painel</h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        Gerencie a agenda, o caixa e a equipe da sua barbearia.
      </p>

      <div className="mt-7">
        <FormEntrar
          proximo={proximo}
          erroInicial={erro}
          lado="barbearia"
          rotuloBotao="Entrar no painel"
        />
      </div>

      {/* Sem Google no lado da barbearia (decisão do produto): o painel só
          abre com e-mail e senha. Quem criou a conta pelo Google não tem
          senha — cria uma pelo "Esqueci minha senha", com o mesmo e-mail. */}
      <p className="mt-4 text-center text-xs text-ink-faint">
        Criou a conta pelo Google? Toque em{" "}
        <Link
          href="/esqueci-senha?tipo=barbearia"
          className="font-medium text-brass hover:text-brass-deep"
        >
          Esqueci minha senha
        </Link>{" "}
        e crie uma senha com o mesmo e-mail.
      </p>

      <div className="mt-7 border-t border-line pt-6">
        <p className="mb-3 text-center text-sm text-ink-soft">Quer cadastrar sua barbearia?</p>
        <LinkButton
          href={ROTA_CADASTRAR_BARBEARIA}
          variante="outline"
          tamanho="lg"
          larguraTotal
          className="border-brass! text-brass! hover:bg-brass-soft!"
        >
          Cadastrar barbearia →
        </LinkButton>
      </div>

      <p className="mt-5 text-center text-xs text-ink-faint">
        <Link
          href={ROTA_ENTRAR_CLIENTE}
          className="underline-offset-2 hover:text-ink hover:underline"
        >
          ← Entrar como cliente
        </Link>
      </p>
    </TelaDividida>
  );
}
