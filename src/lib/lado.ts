/**
 * AS PORTAS DE ENTRADA — uma conta pode ser de barbearia E de cliente, e a
 * porta por onde a pessoa entra decide de que lado ela está:
 *
 *   /entrar-barbeiro  → lado "barbearia": painel (dono e assistente)
 *   /entrar-cliente   → lado "cliente":   app de cliente
 *   /admin/entrar     → lado "admin":     painel da plataforma (só e-mail e senha)
 *
 * O lado vale até SAIR. Não há botão de troca: para ir ao outro lado, a
 * pessoa sai e entra pela outra porta (decisão do produto).
 *
 * O cookie não dá permissão nenhuma — ele só ESCOLHE a área. Quem pode o quê
 * continua sendo o papel no perfil e a RLS: uma conta só de cliente com o
 * cookie "barbearia" não ganha painel, e um cookie "admin" sem
 * `is_platform_admin` não abre o /admin. E o lado de cliente só mostra o que é
 * da pessoa como cliente (`meus_agendamentos_ids()`, 30_lado_cliente.sql),
 * nunca a agenda da barbearia onde ela trabalha.
 *
 * O admin, de propósito, SÓ entra pela porta dele: pelas outras duas a conta é
 * tratada como uma conta comum. O /admin exige o lado "admin".
 *
 * Mora fora de "server-only" porque o middleware (edge) também lê.
 */

export const COOKIE_LADO = "pibarber-lado";
export type Lado = "cliente" | "barbearia" | "admin";
/** As portas públicas — o admin não aparece em link nenhum. */
export type Porta = Exclude<Lado, "admin">;

/* ==========================================================================
   Rotas das portas
   ========================================================================== */

export const ROTA_ENTRAR_CLIENTE = "/entrar-cliente";
export const ROTA_CRIAR_CONTA_CLIENTE = "/criar-conta-cliente";
export const ROTA_ENTRAR_BARBEIRO = "/entrar-barbeiro";
export const ROTA_CADASTRAR_BARBEARIA = "/cadastrar-barbearia";
export const ROTA_ENTRAR_ADMIN = "/admin/entrar";

/** A tela de login de cada lado. */
export function rotaDeEntrar(lado: Lado): string {
  if (lado === "admin") return ROTA_ENTRAR_ADMIN;
  return lado === "barbearia" ? ROTA_ENTRAR_BARBEIRO : ROTA_ENTRAR_CLIENTE;
}

/** Login de um lado com `?erro=` e/ou `?proximo=` — o que vier preenchido. */
export function rotaDeEntrarCom(
  lado: Lado,
  extras: { erro?: string | null; proximo?: string | null },
): string {
  const params = new URLSearchParams();
  if (extras.proximo) params.set("proximo", extras.proximo);
  if (extras.erro) params.set("erro", extras.erro);
  const query = params.toString();
  return query ? `${rotaDeEntrar(lado)}?${query}` : rotaDeEntrar(lado);
}

/* ==========================================================================
   O lado da sessão
   ========================================================================== */

/** O lado do cookie; sem cookie, o natural do papel. */
export function ladoDaSessao(
  valor: string | undefined | null,
  quem: { temBarbearia: boolean; ehAdmin: boolean },
): Lado {
  // "admin" só vale para quem é admin; para os outros, o cookie é ignorado.
  if (valor === "admin" && quem.ehAdmin) return "admin";
  if (valor === "barbearia" && quem.temBarbearia) return "barbearia";
  if (valor === "cliente" || valor === "admin") return "cliente";
  return quem.temBarbearia ? "barbearia" : "cliente";
}

/** Lê o lado de um valor qualquer (formulário, query) — nunca "admin". */
export function portaDe(valor: unknown): Porta {
  return valor === "barbearia" ? "barbearia" : "cliente";
}

export const OPCOES_COOKIE_LADO = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
  // Dura o mesmo que a sessão costuma durar; "Sair" apaga antes.
  maxAge: 60 * 60 * 24 * 60,
};

/** Para onde cada lado leva depois do login. */
export function casaDoLado(lado: Lado, temBarbearia: boolean): string {
  if (lado === "admin") return "/admin";
  if (lado === "barbearia") return temBarbearia ? "/painel" : ROTA_SEM_BARBEARIA;
  return "/app";
}

/**
 * Conta só de cliente que entrou pela porta da barbearia: em vez de erro,
 * oferece criar a barbearia com a mesma conta.
 */
export const ROTA_SEM_BARBEARIA = "/app/perfil/barbearia?pela=porta-da-barbearia";
