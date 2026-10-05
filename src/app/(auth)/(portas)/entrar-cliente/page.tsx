import type { Metadata } from "next";
import Link from "next/link";

import { BotaoGoogle } from "@/components/auth/BotaoGoogle";
import { FormEntrar } from "@/components/auth/FormEntrar";
import { AgendamentoFlutuante } from "@/components/auth/Ilustracoes";
import { DivisorOu, TelaDividida } from "@/components/auth/TelaDividida";
import { ROTA_CRIAR_CONTA_CLIENTE, ROTA_ENTRAR_BARBEIRO } from "@/lib/lado";

export const metadata: Metadata = { title: "Entrar" };

/**
 * A PORTA DO CLIENTE (src/lib/lado.ts): o "Sou cliente" da landing e todo
 * caminho de agendamento. A sessão que nasce aqui é do lado de cliente.
 *
 * O link para a porta do barbeiro é discreto, de propósito: é para quem
 * clicou errado, não uma escolha no meio da tela.
 */
export default async function EntrarClientePage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string; erro?: string }>;
}) {
  const { proximo, erro } = await searchParams;

  return (
    <TelaDividida
      frase="Seu próximo corte,"
      destaque="a dois toques."
      apoio="Escolha a barbearia, o barbeiro e o horário — sem ligar e sem esperar resposta."
      ilustracao={<AgendamentoFlutuante />}
    >
      <h1 className="text-3xl text-ink">Entrar</h1>
      <p className="mt-1.5 text-sm text-ink-soft">Para agendar e acompanhar seus horários.</p>

      <div className="mt-7">
        <FormEntrar proximo={proximo} erroInicial={erro} />
      </div>

      <DivisorOu />

      <BotaoGoogle proximo={proximo} />

      <p className="mt-7 text-center text-sm text-ink-soft">
        Ainda não tem conta?{" "}
        <Link
          href={ROTA_CRIAR_CONTA_CLIENTE}
          className="font-semibold text-brass hover:text-brass-deep"
        >
          Criar conta
        </Link>
      </p>

      <p className="mt-3 text-center text-xs text-ink-faint">
        Tem uma barbearia?{" "}
        <Link
          href={ROTA_ENTRAR_BARBEIRO}
          className="underline-offset-2 hover:text-ink hover:underline"
        >
          Entrar no painel →
        </Link>
      </p>
    </TelaDividida>
  );
}
