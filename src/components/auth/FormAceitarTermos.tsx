"use client";

import { useRef, useState, useTransition } from "react";

import { aceitarTermos } from "@/app/actions/auth";
import { CaixaTermos } from "@/components/auth/CaixaTermos";
import { Button } from "@/components/ui";
import { MENSAGEM_TERMOS } from "@/lib/termos";

/** A caixa e o botão de /aceitar-termos. O sucesso sai por redirect. */
export function FormAceitarTermos({ proximo }: { proximo?: string }) {
  const [termos, setTermos] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();
  const caixa = useRef<HTMLInputElement>(null);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!termos) {
          setErro(MENSAGEM_TERMOS);
          caixa.current?.focus();
          return;
        }
        setErroGeral(null);
        iniciar(async () => {
          const r = await aceitarTermos({ aceitouTermos: termos, proximo });
          const texto = r.message ?? "Não consegui registrar o aceite.";
          if (r.campo === "termos") setErro(texto);
          else setErroGeral(texto);
        });
      }}
      className="flex flex-col gap-5"
    >
      {erroGeral ? (
        <p role="alert" className="rounded-field bg-danger-soft px-3.5 py-3 text-sm text-danger">
          {erroGeral}
        </p>
      ) : null}

      <CaixaTermos
        marcada={termos}
        aoMudar={(marcada) => {
          setTermos(marcada);
          setErro(null);
        }}
        erro={erro ?? undefined}
        inputRef={caixa}
      />

      <Button type="submit" tamanho="lg" larguraTotal carregando={enviando}>
        Aceitar e continuar
      </Button>
    </form>
  );
}
