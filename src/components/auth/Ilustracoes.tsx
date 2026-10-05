import { CalendarCheck, Check, MessageCircle, Star, TrendingUp } from "lucide-react";

/**
 * As ilustrações do lado visual das portas (TelaDividida). São desenho, não
 * dado: números de exemplo, escondidos do leitor de tela pela casca.
 */

const BARRAS = [44, 60, 52, 74, 66, 90, 82];

/** O painel da barbearia, boiando — para as portas do barbeiro. */
export function PainelFlutuante() {
  return (
    <div className="animate-flutuar w-full max-w-[420px] overflow-hidden rounded-[18px] border border-line bg-surface shadow-float">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="ml-auto text-[11px] font-bold tracking-wide text-ink-faint">
          PAINEL · HOJE
        </span>
      </div>

      <div className="p-4">
        <div className="mb-3.5 grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-line bg-surface-2 p-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
              Faturamento
            </p>
            <p className="tnum text-xl font-bold tracking-tight text-brass">R$ 3.240</p>
            <p className="mt-0.5 text-[11px] font-medium text-money">↑ 12% na semana</p>
          </div>
          <div className="rounded-xl border border-line bg-surface-2 p-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
              Agendamentos
            </p>
            <p className="tnum text-xl font-bold tracking-tight text-ink">28</p>
            <p className="mt-0.5 text-[11px] font-medium text-ink-soft">4 horários livres</p>
          </div>
        </div>

        <div className="mb-3.5 rounded-xl border border-line bg-surface-2 px-3.5 py-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-ink-soft">Receita · 7 dias</span>
            <span className="text-[11px] font-bold text-brass">+18%</span>
          </div>
          <div className="flex h-16 items-end gap-1.5">
            {BARRAS.map((altura, i) => (
              <div
                key={i}
                className={
                  i === 5
                    ? "flex-1 rounded-t bg-gradient-to-b from-amber to-brass"
                    : "flex-1 rounded-t bg-brass opacity-30"
                }
                style={{ height: `${altura}%` }}
              />
            ))}
          </div>
        </div>

        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
          Próximos
        </p>
        <div className="flex flex-col gap-2">
          <LinhaAgenda hora="10:15" nome="Rafael M." servico="Corte + Barba" destaque />
          <LinhaAgenda hora="11:00" nome="Diego S." servico="Degradê" />
        </div>
      </div>
    </div>
  );
}

function LinhaAgenda({
  hora,
  nome,
  servico,
  destaque = false,
}: {
  hora: string;
  nome: string;
  servico: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`tnum w-10 shrink-0 text-[11px] font-bold ${destaque ? "text-brass" : "text-ink-soft"}`}
      >
        {hora}
      </span>
      <span
        className={`h-6 w-6 shrink-0 rounded-full ${destaque ? "bg-gradient-to-br from-amber to-brass" : "bg-line-strong"}`}
      />
      <span className="flex-1 text-xs font-semibold text-ink">{nome}</span>
      <span className="text-[11px] font-medium text-ink-faint">{servico}</span>
    </div>
  );
}

/** Dois cartões de resumo do dia — o login do barbeiro, mais enxuto. */
export function ResumoDoDia() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex items-center gap-3 rounded-xl border border-line-strong bg-surface/80 px-3.5 py-3 shadow-card backdrop-blur">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-money bg-money-soft text-money">
          <CalendarCheck className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">14 agendamentos hoje</p>
          <p className="text-[11px] font-medium text-ink-faint">agenda 82% ocupada</p>
        </div>
      </div>
      <div className="ml-8 flex items-center gap-3 rounded-xl border border-line-strong bg-surface/80 px-3.5 py-3 shadow-card backdrop-blur">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-brass bg-brass-soft text-brass">
          <TrendingUp className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="tnum text-sm font-bold text-ink">R$ 3.240 hoje</p>
          <p className="text-[11px] font-medium text-ink-faint">+18% vs. ontem</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-line-strong bg-surface/80 px-3.5 py-3 shadow-card backdrop-blur">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line-strong bg-surface-2 text-ink-soft">
          <MessageCircle className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">Lembretes enviados</p>
          <p className="text-[11px] font-medium text-ink-faint">pelo WhatsApp, sozinhos</p>
        </div>
      </div>
    </div>
  );
}

const HORARIOS = ["09:00", "10:30", "11:15", "14:00", "15:45", "17:30"];

/** Um agendamento sendo marcado — para as portas do cliente. */
export function AgendamentoFlutuante() {
  return (
    <div className="animate-flutuar w-full max-w-[380px] overflow-hidden rounded-[18px] border border-line bg-surface shadow-float">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber to-brass font-display text-base font-semibold text-brass-ink">
          Z
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">Barbearia do Zé</p>
          <p className="flex items-center gap-1 text-[11px] font-medium text-ink-faint">
            <Star className="h-3 w-3 fill-brass text-brass" />
            4,9 · Centro
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4 flex items-center justify-between rounded-xl border border-line bg-surface-2 px-3.5 py-3">
          <div>
            <p className="text-xs font-semibold text-ink">Corte + Barba</p>
            <p className="text-[11px] text-ink-faint">50 min · com Diego</p>
          </div>
          <p className="tnum text-sm font-bold text-brass">R$ 60</p>
        </div>

        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
          Amanhã · horários livres
        </p>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {HORARIOS.map((hora) => (
            <span
              key={hora}
              className={
                hora === "10:30"
                  ? "tnum rounded-lg bg-brass py-2 text-center text-xs font-bold text-brass-ink"
                  : "tnum rounded-lg border border-line bg-surface-2 py-2 text-center text-xs font-semibold text-ink-soft"
              }
            >
              {hora}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 rounded-xl bg-money-soft py-2.5 text-xs font-semibold text-money">
          <Check className="h-3.5 w-3.5" />
          Horário confirmado · lembrete no WhatsApp
        </div>
      </div>
    </div>
  );
}
