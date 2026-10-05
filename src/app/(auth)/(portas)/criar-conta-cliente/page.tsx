import type { Metadata } from "next";
import Link from "next/link";

import { BotaoGoogle } from "@/components/auth/BotaoGoogle";
import { FormCriarConta } from "@/components/auth/FormCriarConta";
import { AgendamentoFlutuante } from "@/components/auth/Ilustracoes";
import { DivisorOu, TelaDividida } from "@/components/auth/TelaDividida";
import { ROTA_CADASTRAR_BARBEARIA, ROTA_ENTRAR_CLIENTE } from "@/lib/lado";

export const metadata: Metadata = { title: "Criar conta" };

/**
 * O cadastro do CLIENTE. Sempre cria um `client` — ver `criarConta`.
 *
 * Para onde o fluxo de agendamento, o login do cliente e a seção "Sou cliente"
 * da landing mandam. O cadastro da barbearia mora em /cadastrar-barbearia.
 */
export default function CriarContaClientePage() {
  return (
    <TelaDividida
      frase="Crie sua conta e"
      destaque="agende em segundos."
      apoio="Seus horários, barbearias favoritas e histórico de cortes num lugar só."
      ilustracao={<AgendamentoFlutuante />}
    >
      <h1 className="text-3xl text-ink">Criar conta</h1>
      <p className="mt-1.5 text-sm text-ink-soft">Para agendar nas barbearias do PiBarber.</p>

      <div className="mt-7">
        <FormCriarConta />
      </div>

      <DivisorOu />

      <BotaoGoogle rotulo="Criar conta com o Google" lado="cliente" />

      <p className="mt-7 text-center text-sm text-ink-soft">
        Já tem conta?{" "}
        <Link href={ROTA_ENTRAR_CLIENTE} className="font-semibold text-brass hover:text-brass-deep">
          Entrar
        </Link>
      </p>

      <p className="mt-3 text-center text-xs text-ink-faint">
        Tem uma barbearia?{" "}
        <Link
          href={ROTA_CADASTRAR_BARBEARIA}
          className="underline-offset-2 hover:text-ink hover:underline"
        >
          Cadastre-a no PiBarber →
        </Link>
      </p>
    </TelaDividida>
  );
}
