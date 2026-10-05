import Link from "next/link";

import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Casca das telas de passagem da autenticação (esqueci a senha, redefinir,
 * e-mail confirmado) e do login do admin. Cartão centralizado, sem distração.
 *
 * As portas de cliente e de barbeiro têm a casca delas (`TelaDividida`).
 */
export function CascaSimples({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        {/* h-11 garante o alvo de toque de 44px: a logo sozinha dá 36px. */}
        <Link
          href="/"
          aria-label="Voltar para a página inicial"
          className="inline-flex h-11 items-center"
        >
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-10 pt-4 sm:items-center sm:pb-16">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="px-4 pb-6 text-center text-xs text-ink-faint">
        Desenvolvido por PiSystem
      </footer>
    </div>
  );
}
