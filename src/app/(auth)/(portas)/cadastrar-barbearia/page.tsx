import type { Metadata } from "next";
import Link from "next/link";

import { FormCriarBarbearia } from "@/components/auth/FormCriarBarbearia";
import { PainelFlutuante } from "@/components/auth/Ilustracoes";
import { TelaDividida } from "@/components/auth/TelaDividida";
import { PRECO } from "@/lib/config";
import { ROTA_ENTRAR_BARBEIRO, ROTA_ENTRAR_CLIENTE } from "@/lib/lado";

export const metadata: Metadata = { title: "Cadastrar barbearia" };

/**
 * O cadastro do DONO: conta e barbearia de uma vez (`criarContaBarbearia`).
 * É para onde a landing manda — ela vende o sistema para a barbearia.
 *
 * Sem Google no cadastro: a conta de barbearia precisa do telefone, e o OAuth
 * não pergunta nada antes de criar o usuário. Quem já tem conta de cliente
 * com este e-mail vincula a barbearia a ela ali mesmo, no formulário.
 */
export default function CadastrarBarbeariaPage() {
  return (
    <TelaDividida
      frase="Tudo para simplificar a sua gestão"
      destaque="em um só lugar."
      apoio="A vida de quem toca uma barbearia é corrida — aqui, ela se organiza em minutos."
      ilustracao={<PainelFlutuante />}
    >
      <h1 className="text-3xl text-ink">Cadastre sua barbearia</h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        {PRECO.diasGratis} dias grátis · sem cartão de crédito. Depois a gente configura horário,
        serviços e equipe com você, passo a passo.
      </p>

      <div className="mt-7">
        <FormCriarBarbearia />
      </div>

      <p className="mt-7 text-center text-sm text-ink-soft">
        Já tem uma conta?{" "}
        <Link href={ROTA_ENTRAR_BARBEIRO} className="font-semibold text-brass hover:text-brass-deep">
          Entrar aqui
        </Link>
      </p>

      <p className="mt-3 text-center text-xs text-ink-faint">
        <Link
          href={ROTA_ENTRAR_CLIENTE}
          className="underline-offset-2 hover:text-ink hover:underline"
        >
          É cliente buscando uma barbearia? Acesse como cliente →
        </Link>
      </p>
    </TelaDividida>
  );
}
