import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * A casca das PORTAS de cliente e de barbeiro (src/lib/lado.ts): o lado
 * visual à esquerda, o formulário à direita.
 *
 * No celular o lado visual encolhe para uma faixa com a frase e some com a
 * ilustração — quem está no celular veio entrar, não ler.
 *
 * A frase do lado visual não é h1: o h1 é o título do formulário, que é o que
 * a tela É para o leitor de tela.
 */
export function TelaDividida({
  selo,
  frase,
  destaque,
  apoio,
  ilustracao,
  children,
}: {
  /** Etiqueta pequena acima da frase ("Painel da barbearia"). */
  selo?: string;
  /** A frase grande do lado visual… */
  frase: string;
  /** …e o pedaço final dela, em itálico latão. */
  destaque: string;
  apoio: string;
  ilustracao: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg lg:flex-row">
      {/* ---------------- Lado visual ---------------- */}
      <aside className="relative flex flex-col overflow-hidden border-b border-line bg-surface-2 px-5 pb-7 pt-5 sm:px-8 lg:min-h-dvh lg:w-[45%] lg:shrink-0 lg:border-b-0 lg:px-12 lg:pb-12 lg:pt-10">
        <div className="fundo-navalha pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="pointer-events-none absolute -left-40 -top-32 h-[420px] w-[420px] rounded-full bg-brass opacity-[0.12] blur-3xl"
          aria-hidden
        />

        <div className="relative flex items-center justify-between">
          {/* h-11 garante o alvo de toque de 44px: a logo sozinha dá 36px. */}
          <Link
            href="/"
            aria-label="Voltar para a página inicial"
            className="inline-flex h-11 items-center"
          >
            <Logo />
          </Link>
          {/* No celular o botão de tema mora aqui; no desktop, no lado do formulário. */}
          <div className="lg:hidden">
            <ThemeToggle />
          </div>
        </div>

        <div className="relative mt-6 max-w-md animate-fade-up lg:mt-14">
          {selo ? (
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
              {selo}
            </p>
          ) : null}
          <p className="font-display text-[28px] font-semibold leading-[1.12] tracking-tight text-ink text-balance sm:text-4xl lg:text-[44px]">
            {frase} <span className="italic text-brass">{destaque}</span>
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft sm:text-base lg:mt-4">
            {apoio}
          </p>
        </div>

        <div className="relative hidden flex-1 items-center justify-center py-10 lg:flex" aria-hidden>
          {ilustracao}
        </div>
      </aside>

      {/* ---------------- Formulário ---------------- */}
      <main className="relative flex flex-1 flex-col items-center px-4 pb-8 pt-8 sm:px-8 lg:justify-center lg:py-14">
        {/* O fio de navalha: a linha de latão entre os dois lados. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brass to-transparent lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:h-auto lg:w-px lg:bg-gradient-to-b"
          aria-hidden
        />

        <div className="absolute right-5 top-5 hidden lg:block">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[420px] animate-fade-up">{children}</div>

        <footer className="mt-10 text-center text-xs text-ink-faint lg:absolute lg:bottom-6 lg:mt-0">
          Desenvolvido por PiSystem
        </footer>
      </main>
    </div>
  );
}

/** "ou", entre o formulário e o botão do Google. */
export function DivisorOu() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs text-ink-faint">ou</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
