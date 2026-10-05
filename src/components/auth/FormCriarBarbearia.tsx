"use client";

import { CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";

import { criarContaBarbearia, vincularBarbearia } from "@/app/actions/auth";
import { CaixaTermos } from "@/components/auth/CaixaTermos";
import { Button, Field, Input } from "@/components/ui";
import { erroDeTelefone } from "@/lib/telefone";
import { MENSAGEM_TERMOS } from "@/lib/termos";
import { mascaraTelefone } from "@/lib/utils";

/**
 * CRIAR CONTA DE BARBEARIA — o dono cria a conta e a loja de uma vez.
 *
 * Mesmo padrão do FormCriarConta, e pelo mesmo motivo: campos CONTROLADOS e
 * action chamada direto, para um erro não apagar o que já foi digitado.
 *
 * Pede só o que a conta precisa para existir. O resto — endereço, horário,
 * serviços, equipe — é o setup de /configurar, logo em seguida.
 *
 * O MODO VÍNCULO: se o e-mail já tem conta (o caso típico é o cliente do app
 * abrindo a barbearia dele), a action responde `campo: "contaExistente"` e o
 * formulário vira outro: some nome e senha nova, aparece o cartão pedindo a
 * senha DA CONTA, e o envio chama `vincularBarbearia`. O cartão não mostra
 * nome nem foto de ninguém — quem digitou o e-mail ainda não provou nada.
 */

type Campo =
  | "nome"
  | "nomeBarbearia"
  | "email"
  | "telefone"
  | "senha"
  | "confirmacao"
  | "senhaVinculo"
  | "termos";
type Erros = Partial<Record<Campo, string>>;

const CAMPO_CONTA_EXISTENTE = "contaExistente";

export function FormCriarBarbearia() {
  const [nome, setNome] = useState("");
  const [nomeBarbearia, setNomeBarbearia] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [termos, setTermos] = useState(false);

  /** E-mail que já tem conta: o formulário pede a senha dela em vez de criar outra. */
  const [vinculo, setVinculo] = useState(false);
  const [senhaVinculo, setSenhaVinculo] = useState("");

  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [criada, setCriada] = useState<string | null>(null);
  const [verSenha, setVerSenha] = useState(false);
  const [enviando, iniciar] = useTransition();

  /** Trava síncrona contra duplo envio — ver FormCriarConta. */
  const emVoo = useRef(false);

  const refs: Record<Campo, React.RefObject<HTMLInputElement | null>> = {
    nome: useRef<HTMLInputElement>(null),
    nomeBarbearia: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    telefone: useRef<HTMLInputElement>(null),
    senha: useRef<HTMLInputElement>(null),
    confirmacao: useRef<HTMLInputElement>(null),
    senhaVinculo: useRef<HTMLInputElement>(null),
    termos: useRef<HTMLInputElement>(null),
  };

  function limpar(campo: Campo) {
    setErroGeral(null);
    setErros((atual) => {
      if (!(campo in atual)) return atual;
      const resto = { ...atual };
      delete resto[campo];
      return resto;
    });
  }

  function conferirSenhas(nova: string, novaConfirmacao: string) {
    if (novaConfirmacao === "" || nova === novaConfirmacao) {
      limpar("confirmacao");
      return;
    }
    setErros((atual) => ({
      ...atual,
      confirmacao: "As senhas não são iguais.",
    }));
  }

  function mostrarErro(campo: Campo | undefined, texto: string) {
    if (campo && campo in refs) {
      setErros({ [campo]: texto });
      refs[campo].current?.focus();
    } else {
      setErroGeral(texto);
    }
  }

  /** "Prefiro usar outro e-mail": volta ao cadastro normal, com o e-mail vazio. */
  function sairDoVinculo() {
    setVinculo(false);
    setSenhaVinculo("");
    setEmail("");
    setErros({});
    setErroGeral(null);
    // Depois do re-render, quando o campo já voltou a ser editável.
    setTimeout(() => refs.email.current?.focus(), 0);
  }

  function enviar() {
    if (emVoo.current) return;

    // O telefone é conferido aqui antes de sair: é o campo que mais se erra, e
    // a resposta do servidor demora uma ida ao banco a mais que os outros.
    const erroTelefone = erroDeTelefone(telefone);
    if (erroTelefone) {
      mostrarErro("telefone", erroTelefone);
      return;
    }
    if (!termos) {
      mostrarErro("termos", MENSAGEM_TERMOS);
      return;
    }

    emVoo.current = true;
    setErroGeral(null);
    setErros({});

    iniciar(async () => {
      const resultado = vinculo
        ? await vincularBarbearia({
            email,
            senha: senhaVinculo,
            nomeBarbearia,
            telefone,
            aceitouTermos: termos,
          })
        : await criarContaBarbearia({
            nome,
            nomeBarbearia,
            email,
            telefone,
            senha,
            confirmacao,
            aceitouTermos: termos,
          });

      emVoo.current = false;

      if (!resultado.ok) {
        const texto = resultado.message ?? "Não consegui criar a conta.";

        if (resultado.campo === CAMPO_CONTA_EXISTENTE) {
          setVinculo(true);
          setSenha("");
          setConfirmacao("");
          setTimeout(() => refs.senhaVinculo.current?.focus(), 0);
          return;
        }

        if (resultado.campo === "senhaVinculo") setSenhaVinculo("");
        mostrarErro(resultado.campo as Campo | undefined, texto);
        return;
      }

      // Sem message, a action já redirecionou (para /configurar ou /painel).
      if (resultado.message) setCriada(resultado.message);
    });
  }

  if (criada) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card bg-money-soft px-5 py-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-money" aria-hidden />
        <p className="text-sm text-ink">{criada}</p>
      </div>
    );
  }

  const botaoVerSenha = (
    <button
      type="button"
      onClick={() => setVerSenha((v) => !v)}
      aria-label={verSenha ? "Esconder a senha" : "Mostrar a senha"}
      className="grid h-11 w-11 place-items-center rounded-chip text-ink-faint transition-colors hover:text-ink"
    >
      {verSenha ? (
        <EyeOff className="h-4.5 w-4.5" aria-hidden />
      ) : (
        <Eye className="h-4.5 w-4.5" aria-hidden />
      )}
    </button>
  );

  return (
    <>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
        className="flex flex-col gap-4"
      >
        {erroGeral ? (
          <p role="alert" className="rounded-field bg-danger-soft px-3.5 py-3 text-sm text-danger">
            {erroGeral}
          </p>
        ) : null}

        {!vinculo ? (
          <Field label="Nome completo" htmlFor="nome" obrigatorio erro={erros.nome}>
            <Input
              id="nome"
              ref={refs.nome}
              autoComplete="name"
              placeholder="Como você se chama"
              value={nome}
              erro={Boolean(erros.nome)}
              onChange={(e) => {
                setNome(e.target.value);
                limpar("nome");
              }}
            />
          </Field>
        ) : null}

        <Field
          label="Celular"
          htmlFor="telefone"
          obrigatorio
          erro={erros.telefone}
          dica="Com DDD. Cada barbearia tem o seu — não dá para repetir o de outra."
        >
          <Input
            id="telefone"
            ref={refs.telefone}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(11) 98765-4321"
            value={telefone}
            erro={Boolean(erros.telefone)}
            className="tnum"
            onChange={(e) => {
              setTelefone(mascaraTelefone(e.target.value));
              limpar("telefone");
            }}
          />
        </Field>

        <Field label="E-mail" htmlFor="email" obrigatorio erro={erros.email}>
          <Input
            id="email"
            ref={refs.email}
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="voce@exemplo.com"
            value={email}
            erro={Boolean(erros.email)}
            readOnly={vinculo}
            className={vinculo ? "border-brass! bg-surface-2" : undefined}
            onChange={(e) => {
              setEmail(e.target.value);
              limpar("email");
            }}
          />
        </Field>

        {vinculo ? (
          <div className="rounded-card border border-brass/40 bg-brass-soft/60 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber to-brass text-brass-ink">
                <KeyRound className="h-4 w-4" aria-hidden />
              </span>
              <p className="text-[15px] font-bold text-ink">Este e-mail já tem uma conta</p>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-ink-soft">
              Se ela é sua, use a mesma conta para gerenciar a barbearia — seus agendamentos como
              cliente continuam intactos.
            </p>

            <Field
              label="Confirme sua senha para continuar"
              htmlFor="senhaVinculo"
              obrigatorio
              erro={erros.senhaVinculo}
            >
              <Input
                id="senhaVinculo"
                ref={refs.senhaVinculo}
                type={verSenha ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Sua senha atual"
                value={senhaVinculo}
                erro={Boolean(erros.senhaVinculo)}
                onChange={(e) => {
                  setSenhaVinculo(e.target.value);
                  limpar("senhaVinculo");
                }}
                iconeDireita={botaoVerSenha}
              />
            </Field>

            <div className="mt-2 flex items-center justify-between gap-3 text-sm">
              <button
                type="button"
                onClick={sairDoVinculo}
                className="text-ink-faint underline-offset-2 hover:text-ink hover:underline"
              >
                Prefiro usar outro e-mail
              </button>
              <Link
                href="/esqueci-senha?tipo=barbearia"
                className="font-medium text-brass hover:text-brass-deep"
              >
                Esqueci minha senha
              </Link>
            </div>
          </div>
        ) : null}

        <Field
          label="Nome da barbearia"
          htmlFor="nomeBarbearia"
          obrigatorio
          erro={erros.nomeBarbearia}
        >
          <Input
            id="nomeBarbearia"
            ref={refs.nomeBarbearia}
            autoComplete="organization"
            placeholder="Ex.: Studio Navalha"
            value={nomeBarbearia}
            erro={Boolean(erros.nomeBarbearia)}
            onChange={(e) => {
              setNomeBarbearia(e.target.value);
              limpar("nomeBarbearia");
            }}
          />
        </Field>

        {!vinculo ? (
          <>
            <Field
              label="Senha"
              htmlFor="senha"
              obrigatorio
              erro={erros.senha}
              dica="Pelo menos 6 caracteres."
            >
              <Input
                id="senha"
                ref={refs.senha}
                type={verSenha ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Crie uma senha"
                value={senha}
                erro={Boolean(erros.senha)}
                onChange={(e) => {
                  setSenha(e.target.value);
                  limpar("senha");
                  conferirSenhas(e.target.value, confirmacao);
                }}
                iconeDireita={botaoVerSenha}
              />
            </Field>

            <Field
              label="Repita a senha"
              htmlFor="confirmacao"
              obrigatorio
              erro={erros.confirmacao}
            >
              <Input
                id="confirmacao"
                ref={refs.confirmacao}
                type={verSenha ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Digite a senha de novo"
                value={confirmacao}
                erro={Boolean(erros.confirmacao)}
                onChange={(e) => {
                  setConfirmacao(e.target.value);
                  conferirSenhas(senha, e.target.value);
                }}
                onBlur={(e) => conferirSenhas(senha, e.target.value)}
              />
            </Field>
          </>
        ) : null}

        <CaixaTermos
          marcada={termos}
          aoMudar={(marcada) => {
            setTermos(marcada);
            limpar("termos");
          }}
          erro={erros.termos}
          inputRef={refs.termos}
        />

        <Button type="submit" tamanho="lg" larguraTotal carregando={enviando}>
          {vinculo ? "Entrar e vincular minha barbearia" : "Criar minha barbearia"}
        </Button>
      </form>

      {/* Sem Google no lado da barbearia: a conta criada pelo Google não tem
          senha e cria uma pelo "Esqueci minha senha", que fica no cartão. */}
      {vinculo ? (
        <p className="mt-4 text-center text-xs text-ink-faint">
          Criou a conta pelo Google? Ela não tem senha: toque em “Esqueci minha senha” no cartão
          acima e crie uma com o mesmo e-mail.
        </p>
      ) : null}
    </>
  );
}
