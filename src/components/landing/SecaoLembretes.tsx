import { BadgeCheck, Check, Mail, MessageCircle, ShieldCheck } from "lucide-react";

/**
 * "Seu cliente é lembrado sozinho" — o WhatsApp oficial e os e-mails, na
 * landing.
 *
 * TUDO AQUI PRECISA SER VERDADE NO PRODUTO, porque é promessa de venda:
 *   - WhatsApp: lembrete às 18h da véspera (quem marca depois recebe na hora,
 *     33_lembrete_de_quem_marca_tarde.sql) e aviso de cancelamento
 *     (src/lib/whatsapp/catalogo.ts). Sai do número da PLATAFORMA, pela API
 *     oficial (Cloud API); o dono liga e desliga cada um em Configurações.
 *   - E-mail: confirmação ao cliente, aviso ao dono, cancelamento e o lembrete
 *     de voltar (31_emails.sql), que só vai para quem não tem horário marcado,
 *     uma vez por visita, com descadastro de um clique.
 *
 * O que NÃO se promete: "zero risco" para a plataforma (a Meta pode limitar o
 * número do PiBarber se houver denúncia de spam). O que se promete é o que é
 * certo: o número do barbeiro nunca é usado.
 *
 * O texto do balão é o template real do lembrete, com valores de exemplo.
 */
export function SecaoLembretes() {
  return (
    <section id="lembretes" className="border-y border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-chip bg-money-soft px-3 py-1 text-xs font-medium text-money">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
              WhatsApp oficial da Meta
            </span>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-ink sm:text-4xl">
              Seu cliente é lembrado sozinho. Você só corta.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              Cliente que esquece é cadeira vazia. O PiBarber avisa na véspera pelo WhatsApp e
              chama de volta por e-mail quem sumiu — sem você mandar mensagem nenhuma.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Bloco
                icone={<MessageCircle className="h-5 w-5" aria-hidden />}
                titulo="No WhatsApp"
                itens={[
                  "Lembrete às 18h da véspera — quem marca depois disso recebe na hora",
                  "Aviso quando o horário é cancelado, com o link para marcar outro",
                  "O cliente cancela pelo link e o horário volta a ficar livre na agenda",
                ]}
              />
              <Bloco
                icone={<Mail className="h-5 w-5" aria-hidden />}
                titulo="No e-mail"
                itens={[
                  "Confirmação para o cliente assim que ele agenda",
                  "Aviso para você de agendamento novo e de cancelamento",
                  "Lembrete de voltar: quem não aparece há algumas semanas recebe um convite para agendar de novo",
                ]}
              />
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-card border border-line bg-bg p-5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-money" aria-hidden />
              <p className="text-sm leading-relaxed text-ink-soft">
                <strong className="font-semibold text-ink">Seu WhatsApp não corre risco.</strong>{" "}
                As mensagens saem pela API oficial do WhatsApp, a mesma que bancos e grandes lojas
                usam, do número verificado do PiBarber — nunca do seu celular. Não tem robô
                rodando no seu número, nem aparelho que precisa ficar ligado. O cliente responde
                PARAR e deixa de receber, e você liga ou desliga cada aviso em Configurações.
              </p>
            </div>
          </div>

          {/* Prévia de como a mensagem chega. Desenho, não captura: o texto é o
              do template aprovado, com nomes de exemplo. */}
          <div
            className="border-gradient mx-auto w-full max-w-sm p-4 shadow-float"
            aria-label="Exemplo do lembrete que o cliente recebe no WhatsApp"
            role="img"
          >
            <div className="flex items-center gap-3 border-b border-line pb-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brass text-sm font-semibold text-brass-ink">
                π
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1 text-sm font-semibold text-ink">
                  PiBarber
                  <BadgeCheck className="h-4 w-4 text-money" aria-hidden />
                </p>
                <p className="text-xs text-ink-faint">Conta comercial oficial</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <Balao hora="18:00">
                Olá Marcos! Lembrete: você tem horário <strong>amanhã</strong> na Barbearia do
                Zé, às <strong>14:00</strong>, com Diego. Se não puder vir, cancele em
                pibarber.app/a/… para liberar o horário.
              </Balao>
              <Balao hora="09:12">
                Olá Marcos! Seu horário na Barbearia do Zé em sexta às 14:00 foi cancelado.
                Marque outro em pibarber.app/b/barbearia-do-ze quando quiser.
              </Balao>
            </div>

            <div className="mt-4 rounded-field bg-surface-2 p-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-ink">
                <Mail className="h-3.5 w-3.5 text-brass" aria-hidden />
                Marcos, bora dar um tapa no visual?
              </p>
              <p className="mt-1 text-xs text-ink-faint">
                Já faz 21 dias, Marcos! · Marcar meu horário
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Bloco({
  icone,
  titulo,
  itens,
}: {
  icone: React.ReactNode;
  titulo: string;
  itens: string[];
}) {
  return (
    <div className="rounded-card border border-line bg-bg p-5">
      <span className="grid h-10 w-10 place-items-center rounded-field bg-brass-soft text-brass-deep">
        {icone}
      </span>
      <h3 className="mt-4 text-base font-semibold text-ink">{titulo}</h3>
      <ul className="mt-2 space-y-2">
        {itens.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-ink-soft">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-money" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Balao({ hora, children }: { hora: string; children: React.ReactNode }) {
  return (
    <div className="max-w-[92%] rounded-card rounded-tl-sm bg-money-soft px-3.5 py-2.5 text-sm leading-relaxed text-ink">
      {children}
      <span className="tnum mt-1 block text-right text-[11px] text-ink-faint">{hora}</span>
    </div>
  );
}
