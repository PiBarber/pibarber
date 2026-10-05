import {
  ArrowRight,
  BookX,
  CalendarDays,
  Check,
  ClipboardList,
  Clock,
  HandCoins,
  Minus,
  MessageCircle,
  PhoneOff,
  Scissors,
  Smartphone,
  Store,
  TrendingUp,
  UserCog,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SecaoLembretes } from "@/components/landing/SecaoLembretes";
import { VejaPorDentro } from "@/components/landing/VejaPorDentro";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LinkButton } from "@/components/ui";
import { EMAIL_COMERCIAL, LINK_WHATSAPP_COMERCIAL, MARCA, PRECO } from "@/lib/config";
import { faixaDoPlano } from "@/lib/assinatura";
import { absoluta } from "@/lib/env";
import { carregarPlanosPublicos, type PlanoPublico } from "@/lib/queries/planos";
import { brl } from "@/lib/utils";

/**
 * O `title` é `absolute` de propósito: o layout raiz define o template
 * "%s · PiBarber", e sem isso esta página viraria "… para barbearia · PiBarber",
 * estourando os ~60 caracteres que o Google mostra e repetindo a marca duas
 * vezes na mesma linha.
 */
export const metadata: Metadata = {
  title: {
    absolute: "Sistema de agendamento para barbearia — agenda, caixa e comissão",
  },
  description:
    "Programa para barbearia com agenda online, lembrete no WhatsApp oficial, ficha de " +
    "cliente, caixa, fiado e controle de comissão. Seus clientes agendam sozinhos pelo " +
    `celular. ${PRECO.diasGratis} dias grátis, sem cartão.`,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: MARCA.nome,
    locale: "pt_BR",
    title: "Sistema de agendamento para barbearia — PiBarber",
    description:
      "Agenda online, lembrete no WhatsApp oficial, caixa, fiado e controle de comissão " +
      "numa tela só. Seus clientes agendam sozinhos pelo celular.",
    // A imagem de compartilhamento é uma captura real do painel, a mesma que
    // abre o "veja por dentro". Quem recebe o link no WhatsApp vê o produto,
    // não um cartão com o logotipo.
    images: [
      {
        url: "/capturas/painel-hoje.png",
        width: 2880,
        height: 1800,
        alt: "A tela Hoje do painel do PiBarber, com o movimento do dia",
      },
    ],
  },
};

const ZAP = LINK_WHATSAPP_COMERCIAL;

/* ========================================================================== */

const DORES = [
  {
    icone: PhoneOff,
    titulo: "O telefone toca no meio do corte",
    texto:
      "Você para a máquina, limpa a mão, atende, anota errado. E ainda perde o cliente que ligou e não foi atendido.",
  },
  {
    icone: BookX,
    titulo: "O caderno some, molha, rasura",
    texto:
      "Um horário anotado duas vezes vira cliente esperando em pé. E se o caderno sumir, sumiu a agenda inteira junto.",
  },
  {
    icone: HandCoins,
    titulo: "Você não sabe quem tá devendo",
    texto:
      "O fiado fica na memória. Passa um mês, você não lembra quanto era nem de quando, e acaba deixando pra lá.",
  },
  {
    icone: TrendingUp,
    titulo: "No fim do mês, sobrou quanto?",
    texto:
      "Entrou dinheiro, saiu dinheiro, pagou a comissão da equipe. Se não tá anotado, o mês fecha no achismo.",
  },
] as const;

const RECURSOS = [
  {
    icone: CalendarDays,
    titulo: "Agenda de verdade",
    texto:
      "Uma coluna por profissional, por dia ou por semana. No celular vira lista. O banco recusa dois cortes no mesmo horário — não tem como furar.",
  },
  {
    icone: Smartphone,
    titulo: "O cliente agenda sozinho",
    texto:
      "Ele instala o app na tela inicial, escolhe o serviço, o profissional e o horário. Você só vê aparecer na agenda.",
  },
  {
    icone: Users,
    titulo: "Ficha de cada cliente",
    texto:
      "Histórico, quanto já gastou, quantas faltou, e a observação que só você lê: “máquina 2 nas laterais”.",
  },
  {
    icone: Wallet,
    titulo: "Caixa que fecha",
    texto:
      "Cada atendimento concluído entra no caixa na hora. Pode dividir o pagamento: R$ 40 no pix e R$ 20 no fiado.",
  },
  {
    icone: HandCoins,
    titulo: "Fiado sob controle",
    texto:
      "Quem deve, quanto, e há quantos dias. Os vencidos em destaque, com a cobrança pronta para mandar no WhatsApp.",
  },
  {
    icone: ClipboardList,
    titulo: "Comissão calculada",
    texto:
      "O percentual de cada profissional roda sozinho. Você marca como pago e a saída já entra no caixa.",
  },
  {
    icone: TrendingUp,
    titulo: "Relatório sem planilha",
    texto:
      "Faturamento por dia, serviços que mais vendem, ticket médio, taxa de falta, e a comparação com o mês anterior.",
  },
  {
    icone: UserCog,
    titulo: "Acesso para o assistente",
    texto:
      "Ele agenda, atende e recebe. Faturamento, comissão e relatório ele não vê — e não é menu escondido, é bloqueio no banco.",
  },
] as const;

const PASSOS = [
  {
    numero: "1",
    titulo: "Você cadastra em poucos minutos",
    texto:
      "Crie a conta e siga o passo a passo: horários, serviços e equipe. Prefere fazer junto? Chama no WhatsApp que a gente configura com você.",
  },
  {
    numero: "2",
    titulo: "Você divulga o link",
    texto:
      "Sua barbearia ganha uma página própria — pibarber.app/b/sua-barbearia — com horários, serviços, equipe, avaliações e o botão de agendar. Põe na bio do Instagram e manda no grupo do WhatsApp.",
  },
  {
    numero: "3",
    titulo: "Você opera do celular",
    texto:
      "O cliente agenda e recebe o lembrete sozinho. Você abre a agenda, conclui o atendimento e recebe. No fim do dia o caixa já está fechado.",
  },
] as const;

const INCLUI = [
  "Agenda por profissional, sem limite de agendamento",
  "App para os seus clientes agendarem sozinhos",
  "Página pública da barbearia, com link para a bio",
  "Lembrete e aviso de cancelamento no WhatsApp oficial",
  "E-mails automáticos, com o lembrete de voltar para quem sumiu",
  "Ficha de cliente com histórico e observações",
  "Caixa, fiado e comissão",
  "Relatórios de faturamento e desempenho",
  "Acesso separado para o assistente, sem ver dinheiro",
  "Lista de espera e avaliações",
] as const;

/**
 * Caderno × WhatsApp na mão × PiBarber. Sem citar concorrente pelo nome: só o
 * que dá para afirmar do PiBarber e do jeito que a barbearia já trabalha.
 * `true` = faz, `false` = não faz, `"parcial"` = depende de alguém lembrar.
 */
const COMPARACAO: {
  item: string;
  caderno: boolean | "parcial";
  zap: boolean | "parcial";
}[] = [
  { item: "O cliente marca sozinho, até de madrugada", caderno: false, zap: false },
  { item: "Lembrete automático na véspera", caderno: false, zap: "parcial" },
  { item: "Impossível marcar dois no mesmo horário", caderno: "parcial", zap: "parcial" },
  { item: "Seu número pessoal fica de fora", caderno: true, zap: false },
  { item: "Quem deve, quanto e desde quando", caderno: "parcial", zap: false },
  { item: "Comissão e caixa calculados sozinhos", caderno: false, zap: false },
  { item: "Chama de volta quem sumiu", caderno: false, zap: "parcial" },
];

/**
 * As dúvidas que travam o DONO antes de criar a conta. As do cliente moram em
 * src/lib/faq.ts (/app/perfil/ajuda). Cada resposta tem que bater com os
 * Termos e com o que o sistema faz — mudou lá, muda aqui.
 */
const FAQ_DONO = [
  {
    pergunta: "Preciso de cartão de crédito para testar?",
    resposta: `Não. São ${PRECO.diasGratis} dias grátis, com tudo liberado, sem cadastrar cartão. Só no fim do teste você escolhe se quer assinar.`,
  },
  {
    pergunta: "Tem fidelidade? Como eu cancelo?",
    resposta:
      "No plano mensal não tem fidelidade: cancele quando quiser, pelo próprio painel. No semestral e no anual você paga menos, tem 7 dias para desistir com o dinheiro de volta, e depois disso o acesso segue até o fim do período.",
  },
  {
    pergunta: "Vocês cobram taxa por agendamento ou porcentagem do que eu faturo?",
    resposta:
      "Não. O preço é fixo e depende só de quantos profissionais atendem na sua agenda. Agende quanto quiser.",
  },
  {
    pergunta: "O lembrete de WhatsApp usa o meu número?",
    resposta:
      "Não. As mensagens saem do número verificado do PiBarber, pela API oficial do WhatsApp da Meta. Seu número não é usado em nenhum momento, então não corre risco de bloqueio, e você não precisa deixar celular nenhum ligado.",
  },
  {
    pergunta: "Meus clientes precisam baixar um aplicativo na loja?",
    resposta:
      "Não. O cliente abre o link da sua barbearia no navegador e já agenda. Se quiser, adiciona à tela de início e passa a abrir como um aplicativo.",
  },
  {
    pergunta: "E o cliente que prefere marcar pessoalmente ou por ligação?",
    resposta:
      "Continua do mesmo jeito. Você lança o horário na agenda em dois toques, e a ficha do cliente nasce junto.",
  },
  {
    pergunta: "Como ficam os clientes que eu já tenho?",
    resposta:
      "Cada cliente vira uma ficha na primeira vez que agenda pelo link ou que você lança o horário dele. Não precisa digitar o caderno inteiro antes de começar.",
  },
  {
    pergunta: "Meu assistente vai ver quanto eu faturo?",
    resposta:
      "Não. O acesso do assistente mostra agenda, clientes e fiado, mas não faturamento, comissão nem relatórios — e isso é bloqueado no banco de dados, não só escondido na tela.",
  },
  {
    pergunta: "O cliente pode parar de receber as mensagens?",
    resposta:
      "Pode. No WhatsApp, basta responder PARAR. No e-mail de lembrete de voltar, tem o link de descadastro. E você também liga ou desliga cada aviso nas Configurações do painel.",
  },
  {
    pergunta: "Meus dados e os dos meus clientes ficam seguros?",
    resposta:
      "Cada barbearia só enxerga os próprios dados, com a regra aplicada no banco. Seguimos a LGPD: a política de privacidade diz o que guardamos e por quê, e o cliente pode excluir a conta dele pelo app.",
  },
] as const;

/* ========================================================================== */

/** As perguntas do dono como FAQPage — o Google pode mostrá-las no resultado. */
function dadosFaq() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_DONO.map((f) => ({
      "@type": "Question",
      name: f.pergunta,
      acceptedAnswer: { "@type": "Answer", text: f.resposta },
    })),
  };
}

function MarcaComparacao({ valor }: { valor: boolean | "parcial" }) {
  if (valor === true) {
    return <Check className="mx-auto h-5 w-5 text-money" aria-label="Sim" />;
  }
  if (valor === "parcial") {
    return (
      <Minus className="mx-auto h-5 w-5 text-ink-faint" aria-label="Depende de alguém lembrar" />
    );
  }
  return <X className="mx-auto h-5 w-5 text-danger" aria-label="Não" />;
}

/**
 * Dados estruturados — é como o Google entende que esta página descreve um
 * *produto de software*, e não um artigo qualquer sobre barbearia.
 *
 * `offers` declara a faixa de preço dos planos mensais — os mesmos números que
 * a seção de preço mostra. Declarar aqui um preço diferente do que está na
 * tela é o tipo de contradição que derruba o rich result inteiro — por isso
 * os dois lados leem os MESMOS planos, da tabela que cobra.
 */
function dadosEstruturados(planos: PlanoPublico[]) {
  const mensais = planos
    .map((p) => Number(p.monthly_price))
    .filter((v) => Number.isFinite(v) && v > 0);

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: MARCA.nome,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Sistema de agendamento para barbearia",
    operatingSystem: "Web, Android, iOS",
    description:
      "Programa para barbearia com agenda online, lembrete no WhatsApp oficial, ficha de " +
      "cliente, caixa, fiado e controle de comissão. Os clientes agendam sozinhos pelo celular.",
    inLanguage: "pt-BR",
    url: absoluta("/"),
    screenshot: absoluta("/capturas/painel-hoje.png"),
    // Faixa de preço dos planos MENSAIS, lida da tabela que cobra. Sem planos
    // (falha de leitura), o bloco sai inteiro: melhor nenhum preço declarado do
    // que um diferente do que a página mostra.
    ...(mensais.length > 0
      ? {
          offers: {
            "@type": "AggregateOffer",
            lowPrice: Math.min(...mensais).toFixed(2),
            highPrice: Math.max(...mensais).toFixed(2),
            offerCount: mensais.length,
            priceCurrency: "BRL",
            category: "subscription",
          },
        }
      : {}),
    featureList: [
      "Agenda por profissional, com bloqueio de horário sobreposto",
      "Agendamento online pelo celular do cliente",
      "Lembrete e aviso de cancelamento pelo WhatsApp oficial (API da Meta)",
      "E-mail automático de confirmação e de lembrete de voltar",
      "Ficha de cliente com histórico e observações",
      "Caixa com pagamento dividido",
      "Controle de fiado",
      "Cálculo e pagamento de comissão",
      "Relatórios de faturamento e desempenho",
      "Acesso separado para assistente, sem ver dinheiro",
    ],
    provider: { "@type": "Organization", name: MARCA.autor, email: EMAIL_COMERCIAL },
  };
}

export default async function LandingPage() {
  const planos = await carregarPlanosPublicos();

  return (
    <div className="min-h-dvh bg-bg">
      {/* JSON-LD. O conteúdo é nosso e fixo — não há entrada de usuário aqui,
          que é o que tornaria este dangerouslySetInnerHTML perigoso de fato. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosEstruturados(planos)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosFaq()) }}
      />

      {/* ---------- Topo ---------- */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo />

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Em 375px a linha logo + tema + os dois botões estoura por ~11px
                e alarga o documento inteiro. Quem sai no celular é o TEMA: os
                dois botões são as duas portas do barbeiro — "Teste grátis" para
                quem chega, "Entrar" para quem já tem barbearia — e nenhuma das
                duas pode sumir. O tema continua nas telas de login e cadastro.

                O `hidden` vai no wrapper: o botão do tema traz a própria
                classe de display, que venceria o `hidden` por vir depois. */}
            <span className="hidden sm:contents">
              <ThemeToggle />
            </span>
            {/* "Entrar" da landing é a porta da BARBEARIA (src/lib/lado.ts); o
                cliente entra pelo "Sou cliente". */}
            <LinkButton href="/entrar-barbeiro" variante="ghost" tamanho="sm">
              Entrar
            </LinkButton>
            {/* Da landing, "Teste grátis" é SEMPRE de barbearia: a landing vende
                o sistema para o dono. O cliente cria a conta dele pelo fluxo
                de agendamento, que leva para /criar-conta sem o `?tipo=`. */}
            {/* "Teste grátis" e não "Criar conta": o topo acompanha a rolagem,
                então a oferta fica à vista na página inteira. */}
            <LinkButton href="/cadastrar-barbearia" variante="primary" tamanho="sm">
              Teste grátis
            </LinkButton>
          </div>
        </div>
      </header>

      <main>
        {/* ---------- Chamada principal ---------- */}
        <section className="mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-chip bg-brass-soft px-3 py-1 text-xs font-medium text-brass-deep">
                <Scissors className="h-3.5 w-3.5" aria-hidden />
                Feito para barbearia, não para salão genérico
              </span>

              {/* O h1 é curto de propósito: seis palavras cabem em uma linha no
                  celular e batem antes de o polegar rolar.

                  O TERMO DE BUSCA MUDOU DE LUGAR, não sumiu. "Sistema de
                  agendamento para barbearia" abre o parágrafo logo abaixo, e
                  continua no <title>, na descrição e no Open Graph — que é de
                  onde o Google tira o resultado. O h1 passou a fazer o trabalho
                  que só ele faz: convencer em dois segundos. */}
              <h1 className="mt-5 text-4xl leading-[1.1] text-ink sm:text-5xl lg:text-6xl">
                Corte. O resto <span className="text-brass">é com a gente</span>.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
                Sistema de agendamento para barbearia com agenda online, lembrete automático no
                WhatsApp oficial, ficha de cliente, caixa, fiado e controle de comissão numa tela
                só. Seu cliente marca o horário sozinho pelo celular, recebe o lembrete na véspera,
                e no fim do dia o caixa já está fechado — sem caderno, sem planilha, sem achismo.
              </p>

              {/* Três CTAs, duas audiências. O dono é o primário e vai direto
                  para o cadastro da barbearia (desde o setup guiado ele se
                  cadastra sozinho; quem quer conversar antes acha o WhatsApp
                  em Preço e em Contato); o cliente final tem
                  caminho próprio, porque ele TAMBÉM cria conta aqui — e até
                  agora só encontrava o "Criar conta" pequeno do topo.

                  `flex-wrap` em vez de três colunas fixas: em 375px eles
                  empilham em largura total, e a partir de sm acomodam duas
                  linhas sem estourar a caixa. */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <LinkButton
                  href="/cadastrar-barbearia"
                  tamanho="lg"
                  larguraTotal
                  className="sm:w-auto"
                  iconeEsquerda={<Store className="h-5 w-5" aria-hidden />}
                >
                  Testar {PRECO.diasGratis} dias grátis
                </LinkButton>
                <LinkButton
                  href="#como-funciona"
                  variante="secondary"
                  tamanho="lg"
                  larguraTotal
                  className="sm:w-auto"
                  iconeDireita={<ArrowRight className="h-4 w-4" aria-hidden />}
                >
                  Ver como funciona
                </LinkButton>
                <LinkButton
                  href="/entrar-cliente"
                  variante="outline"
                  tamanho="lg"
                  larguraTotal
                  className="sm:w-auto"
                  iconeEsquerda={<UserRound className="h-5 w-5" aria-hidden />}
                >
                  Sou cliente
                </LinkButton>
              </div>

              {/* A oferta à vista, logo abaixo de onde a pessoa decide clicar:
                  é ela que derruba o "vou ter que pagar ou deixar o cartão?". */}
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-ink">
                {[`${PRECO.diasGratis} dias grátis`, "Sem cartão de crédito", "Sem compromisso"].map(
                  (selo) => (
                    <li key={selo} className="flex items-center gap-1.5">
                      <Check className="h-4 w-4 shrink-0 text-money" aria-hidden />
                      {selo}
                    </li>
                  ),
                )}
              </ul>
            </div>

            {/* Prévia da tela Hoje — o que o dono abre 50 vezes por dia. */}
            <div className="border-gradient p-5 shadow-float">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Hoje</p>
                  <p className="text-lg font-semibold text-ink">Sexta, 14 ago</p>
                </div>
                <span className="rounded-chip bg-money-soft px-2.5 py-1 text-xs font-medium text-money">
                  8 atendimentos
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-field bg-surface-2 p-3">
                  <p className="text-xs text-ink-faint">Entrou hoje</p>
                  <p className="tnum mt-1 text-xl font-semibold text-money">R$ 640,00</p>
                </div>
                <div className="rounded-field bg-surface-2 p-3">
                  <p className="text-xs text-ink-faint">Em aberto no fiado</p>
                  <p className="tnum mt-1 text-xl font-semibold text-danger">R$ 120,00</p>
                </div>
              </div>

              <ul className="mt-4 divide-y divide-line">
                {[
                  { hora: "14:00", nome: "Marcos Vinícius", servico: "Corte + barba" },
                  { hora: "14:45", nome: "Diego Ramos", servico: "Corte social" },
                  { hora: "15:30", nome: "Paulo Henrique", servico: "Barba" },
                ].map((linha) => (
                  <li key={linha.hora} className="flex items-center gap-3 py-3">
                    <span className="tnum w-12 shrink-0 text-sm font-semibold text-brass">
                      {linha.hora}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {linha.nome}
                      </span>
                      <span className="block truncate text-xs text-ink-faint">{linha.servico}</span>
                    </span>
                    <span className="shrink-0 rounded-chip bg-brass-soft px-2.5 py-1 text-xs font-medium text-brass-deep">
                      Concluir
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ---------- O problema do caderno ---------- */}
        <section className="border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                O caderno funciona — até o dia em que não funciona.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-soft">
                Nenhum barbeiro perde cliente por cortar mal. Perde por horário marcado errado, por
                não lembrar de quem devia e por não saber o que sobrou no fim do mês.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {DORES.map((dor) => (
                <div key={dor.titulo} className="rounded-card border border-line bg-bg p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-field bg-danger-soft text-danger">
                    <dor.icone className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-ink">{dor.titulo}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{dor.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- O que o sistema faz ---------- */}
        <section id="recursos" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold leading-tight text-ink sm:text-4xl">
              Tudo o que a barbearia usa no dia a dia, numa tela só.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              Nada de módulo que você nunca vai abrir. Se o barbeiro não usa toda semana, não está
              aqui.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {RECURSOS.map((recurso) => (
              <div
                key={recurso.titulo}
                className="rounded-card border border-line bg-surface p-5 shadow-card"
              >
                <span className="grid h-10 w-10 place-items-center rounded-field bg-brass-soft text-brass-deep">
                  <recurso.icone className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink">{recurso.titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{recurso.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Lembretes: WhatsApp oficial e e-mail ---------- */}
        <SecaoLembretes />

        {/* ---------- Veja por dentro ----------
            Sem borda e sem `bg-surface`: a seção seguinte ("Como funciona") já é
            uma faixa clara com borda, e duas coladas viram um bloco só com
            linha dupla no meio. Aqui quem separa é o peso do quadro da imagem. */}
        <section id="por-dentro" className="bg-bg">
          <div className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                Veja o programa por dentro, antes de falar com a gente.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-soft">
                São telas do sistema rodando de verdade — não desenho de como poderia ser. Os nomes
                e valores são de uma barbearia de demonstração.
              </p>
            </div>

            <VejaPorDentro />
          </div>
        </section>

        {/* ---------- Como funciona ---------- */}
        <section id="como-funciona" className="border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                Do primeiro contato ao primeiro agendamento.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-soft">
                Você configura sozinho em poucos minutos, com o passo a passo. Se preferir, a gente
                faz junto com você pelo WhatsApp.
              </p>
            </div>

            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {PASSOS.map((passo) => (
                <li key={passo.numero} className="relative">
                  <span className="font-display grid h-12 w-12 place-items-center rounded-full bg-brass text-xl font-semibold text-brass-ink">
                    {passo.numero}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{passo.titulo}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{passo.texto}</p>
                </li>
              ))}
            </ol>

            <div className="mt-10 flex items-start gap-3 rounded-card border border-line bg-bg p-5">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brass" aria-hidden />
              <p className="text-sm leading-relaxed text-ink-soft">
                <strong className="font-semibold text-ink">
                  Não precisa mudar como você trabalha.
                </strong>{" "}
                Quem prefere marcar no balcão continua marcando — você lança na agenda em dois
                toques. O app é para quem quiser agendar sozinho, de madrugada, sem te incomodar.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- Preço ----------
            Os valores vêm da tabela `plans`, a mesma que cobra. As regras de
            cancelamento e devolução ecoam o item 5 dos Termos — mudou lá, muda
            aqui. Nada de "cancelou, para na hora": no semestral e no anual o
            acesso segue até o fim do período. */}
        <section id="preco" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <h2 className="text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                O preço acompanha a sua equipe. Sem taxa por agendamento.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-soft">
                Sem cobrança por cliente cadastrado, sem porcentagem em cima do que você fatura. O
                plano é pelo número de profissionais que atendem na sua agenda.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink-faint">
                Os primeiros {PRECO.diasGratis} dias são grátis, sem cartão. No mensal, cancele
                quando quiser. No semestral e no anual você paga menos, e tem 7 dias para desistir
                com o dinheiro de volta.{" "}
                <Link href="/termos" className="text-brass hover:underline">
                  Ver os termos
                </Link>
                .
              </p>

              <p className="mt-8 text-sm font-medium text-ink">Todos os planos incluem</p>
              <ul className="mt-3 space-y-2.5">
                {INCLUI.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-money" aria-hidden />
                    <span className="text-sm leading-relaxed text-ink-soft">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-gradient p-6 shadow-float sm:p-8">
              {planos.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {planos.map((plano) => {
                    const anual = plano.precos.find((p) => p.cycle === "annual");
                    return (
                      <li
                        key={plano.id}
                        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-card border border-line bg-surface p-4"
                      >
                        <div>
                          <p className="font-semibold text-ink">{plano.name}</p>
                          <p className="text-sm text-ink-soft">{faixaDoPlano(plano)}</p>
                        </div>
                        <div className="text-right">
                          <p className="flex items-baseline justify-end gap-1">
                            <span className="tnum text-2xl font-semibold text-ink">
                              {brl(plano.monthly_price)}
                            </span>
                            <span className="text-sm text-ink-faint">/mês</span>
                          </p>
                          {anual?.per_month ? (
                            <p className="tnum text-xs text-money">
                              ou {brl(anual.per_month)}/mês no anual
                            </p>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              <p className="mt-4 text-xs leading-relaxed text-ink-faint">
                Semestral com 10% e anual com 20% de desconto, no cartão ou no Pix — no cartão,
                também em 6x ou 12x sem juros.
              </p>

              <LinkButton
                href="/cadastrar-barbearia"
                tamanho="lg"
                larguraTotal
                className="mt-6"
                iconeEsquerda={<Store className="h-5 w-5" aria-hidden />}
              >
                Começar os {PRECO.diasGratis} dias grátis
              </LinkButton>

              <p className="mt-4 text-center text-sm text-ink-soft">
                Mais de 8 profissionais?{" "}
                <a
                  href={ZAP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brass hover:underline"
                >
                  Fale com a gente
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* ---------- Comparação ---------- */}
        <section id="comparacao" className="border-y border-line bg-surface">
          <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                Caderno, WhatsApp na mão ou PiBarber?
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-soft">
                O caderno e o WhatsApp funcionam até onde alguém lembra de tudo. O que o sistema
                faz sozinho, ninguém precisa lembrar.
              </p>
            </div>

            {/* Tabela de verdade (leitor de tela lê linha e coluna). No celular,
                as três colunas de marca são estreitas e o texto quebra. */}
            <div className="mt-10 overflow-hidden rounded-card border border-line bg-bg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-ink-soft">
                    <th scope="col" className="p-3 text-left font-medium sm:p-4">
                      <span className="sr-only">Recurso</span>
                    </th>
                    <th scope="col" className="w-12 px-1 py-3 text-center text-[11px] font-medium leading-tight sm:w-24 sm:p-4 sm:text-sm">
                      Caderno
                    </th>
                    <th scope="col" className="w-12 px-1 py-3 text-center text-[11px] font-medium leading-tight sm:w-24 sm:p-4 sm:text-sm">
                      WhatsApp na mão
                    </th>
                    <th
                      scope="col"
                      className="w-12 bg-brass-soft px-1 py-3 text-center text-[11px] font-semibold leading-tight text-brass-deep sm:w-24 sm:p-4 sm:text-sm"
                    >
                      {MARCA.nome}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {COMPARACAO.map((linha) => (
                    <tr key={linha.item}>
                      <th scope="row" className="p-3 text-left font-normal text-ink sm:p-4">
                        {linha.item}
                      </th>
                      <td className="px-1 py-3 sm:p-4">
                        <MarcaComparacao valor={linha.caderno} />
                      </td>
                      <td className="px-1 py-3 sm:p-4">
                        <MarcaComparacao valor={linha.zap} />
                      </td>
                      <td className="bg-brass-soft/60 px-1 py-3 sm:p-4">
                        <MarcaComparacao valor={true} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-ink-faint">
              <Minus className="inline h-3.5 w-3.5 align-text-bottom" aria-hidden /> = só se
              alguém lembrar de fazer na mão.
            </p>
          </div>
        </section>

        {/* ---------- Dúvidas do dono ----------
            <details> nativo: abre sem JavaScript, e as respostas fechadas
            continuam no HTML para o Google (o FAQPage acima declara as mesmas). */}
        <section id="duvidas" className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
          <h2 className="text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            Perguntas de quem está pensando em começar.
          </h2>
          <div className="mt-8 divide-y divide-line rounded-card border border-line bg-surface">
            {FAQ_DONO.map((f) => (
              <details key={f.pergunta} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 text-left text-base font-medium text-ink sm:p-5 [&::-webkit-details-marker]:hidden">
                  {f.pergunta}
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-brass transition-transform group-open:rotate-90"
                    aria-hidden
                  />
                </summary>
                <p className="px-4 pb-4 text-sm leading-relaxed text-ink-soft sm:px-5 sm:pb-5">
                  {f.resposta}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ---------- Contato ---------- */}
        <section id="contato" className="border-t border-line bg-surface">
          <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-20">
            <h2 className="text-3xl font-semibold leading-tight text-ink sm:text-4xl">
              Manda uma mensagem. A gente responde de verdade.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
              Sem formulário comprido e sem robô. Chama no WhatsApp que a gente te mostra o sistema
              rodando e tira suas dúvidas na hora.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <LinkButton
                href={ZAP}
                target="_blank"
                rel="noopener noreferrer"
                tamanho="lg"
                larguraTotal
                className="sm:w-auto"
                iconeEsquerda={<MessageCircle className="h-5 w-5" aria-hidden />}
              >
                Falar no WhatsApp
              </LinkButton>
              <LinkButton
                href={`mailto:${EMAIL_COMERCIAL}`}
                variante="secondary"
                tamanho="lg"
                larguraTotal
                className="sm:w-auto"
              >
                Prefiro por e-mail
              </LinkButton>
            </div>
          </div>
        </section>
      </main>

      {/* ---------- Rodapé ---------- */}
      <footer className="border-t border-line bg-bg">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <Logo tamanho="sm" />
            <p className="mt-2 text-sm text-ink-faint">
              {MARCA.descricao}. Desenvolvido por{" "}
              <span className="font-medium text-ink-soft">{MARCA.autor}</span>.
            </p>
          </div>

          {/* -mx-3 compensa o padding dos links: eles ganham 44px de altura de
              toque sem afastar o texto da margem da coluna. */}
          <nav className="-mx-3 flex flex-wrap text-sm text-ink-soft">
            <a
              href="#recursos"
              className="inline-flex h-11 items-center px-3 transition-colors hover:text-brass"
            >
              Recursos
            </a>
            <a
              href="#lembretes"
              className="inline-flex h-11 items-center px-3 transition-colors hover:text-brass"
            >
              Lembretes
            </a>
            <a
              href="#por-dentro"
              className="inline-flex h-11 items-center px-3 transition-colors hover:text-brass"
            >
              Por dentro
            </a>
            <a
              href="#como-funciona"
              className="inline-flex h-11 items-center px-3 transition-colors hover:text-brass"
            >
              Como funciona
            </a>
            <a
              href="#preco"
              className="inline-flex h-11 items-center px-3 transition-colors hover:text-brass"
            >
              Preço
            </a>
            <a
              href="#duvidas"
              className="inline-flex h-11 items-center px-3 transition-colors hover:text-brass"
            >
              Dúvidas
            </a>
            <a
              href={ZAP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center px-3 transition-colors hover:text-brass"
            >
              WhatsApp
            </a>
            {/* A Meta exige esta URL para publicar o app do WhatsApp — e ela
                precisa estar alcançável a partir do site, não só por link
                direto. Ver docs/whatsapp.md. */}
            <a
              href="/privacidade"
              className="inline-flex h-11 items-center px-3 transition-colors hover:text-brass"
            >
              Privacidade
            </a>
            <a
              href="/termos"
              className="inline-flex h-11 items-center px-3 transition-colors hover:text-brass"
            >
              Termos
            </a>
          </nav>
        </div>

        <div className="border-t border-line">
          <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-ink-faint sm:px-6">
            © {new Date().getFullYear()} {MARCA.autor}. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Botão flutuante do WhatsApp comercial: quem está decidindo tira a
          dúvida na hora, de qualquer ponto da página. Fica acima do rodapé
          (z-40, como o topo) e respeita a área segura do iPhone. */}
      <a
        href={ZAP}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar com a gente no WhatsApp"
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-money text-bg shadow-float transition-transform hover:scale-105 active:scale-95"
      >
        <MessageCircle className="h-6 w-6" aria-hidden />
      </a>
    </div>
  );
}
