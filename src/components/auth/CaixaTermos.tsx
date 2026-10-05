"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * "Li e aceito os termos de uso e a política de privacidade" — a mesma caixa
 * nos dois cadastros e na tela de aceite (/aceitar-termos).
 *
 * Marcá-la não grava nada sozinho: a action confere `aceitouTermos` no
 * servidor e registra o aceite (src/lib/aceite-termos.ts).
 */
export function CaixaTermos({
  marcada,
  aoMudar,
  erro,
  inputRef,
}: {
  marcada: boolean;
  aoMudar: (marcada: boolean) => void;
  erro?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink-soft">
        <input
          id="termos"
          ref={inputRef}
          type="checkbox"
          checked={marcada}
          onChange={(e) => aoMudar(e.target.checked)}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? "termos-erro" : undefined}
          className={cn(
            "mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded-md accent-brass",
            erro && "outline outline-2 outline-danger",
          )}
        />
        <span>
          Li e aceito os{" "}
          <Link
            href="/termos"
            target="_blank"
            className="font-semibold text-brass hover:text-brass-deep"
          >
            termos de uso
          </Link>{" "}
          e a{" "}
          <Link
            href="/privacidade"
            target="_blank"
            className="font-semibold text-brass hover:text-brass-deep"
          >
            política de privacidade
          </Link>
        </span>
      </label>
      {erro ? (
        <p id="termos-erro" className="text-xs text-danger" role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
