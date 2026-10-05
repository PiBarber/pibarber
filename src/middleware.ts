import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/database.types";
import {
  casaDoLado,
  COOKIE_LADO,
  ladoDaSessao,
  ROTA_CADASTRAR_BARBEARIA,
  ROTA_CRIAR_CONTA_CLIENTE,
  ROTA_ENTRAR_ADMIN,
  ROTA_ENTRAR_BARBEIRO,
  ROTA_ENTRAR_CLIENTE,
} from "@/lib/lado";
import { COOKIE_VISUALIZACAO, lojaDoCookie } from "@/lib/visualizacao";

/**
 * Middleware — a SEGUNDA das três camadas de permissão.
 *
 *   1. RLS no Postgres   → a única que vale de verdade
 *   2. este arquivo      → redireciona por prefixo antes de renderizar
 *   3. requireRole()     → no topo de cada página
 *
 * Ele existe pela experiência, não pela segurança: manda a pessoa para o lugar
 * certo antes de gastar uma renderização. TODA página continua chamando
 * requireRole(). Nunca confie só nisto aqui.
 */

const PREFIXOS_APP = ["/app"];
// /configurar é o setup guiado do dono. Mora fora de /painel (o layout de lá
// redireciona para cá, e um redirect para dentro do próprio grupo entra em loop),
// mas o papel exigido é o mesmo.
// /assinatura idem: é para onde o painel manda quando o plano vence.
const PREFIXOS_PAINEL = ["/painel", "/configurar", "/assinatura"];
const PREFIXOS_ADMIN = ["/admin"];
// As portas, mais os endereços antigos (/entrar, /criar-conta), que só
// redirecionam para as novas.
const ROTAS_AUTENTICACAO = [
  ROTA_ENTRAR_CLIENTE,
  ROTA_CRIAR_CONTA_CLIENTE,
  ROTA_ENTRAR_BARBEIRO,
  ROTA_CADASTRAR_BARBEARIA,
  ROTA_ENTRAR_ADMIN,
  "/entrar",
  "/criar-conta",
];

function comecaCom(caminho: string, prefixos: string[]): boolean {
  return prefixos.some((p) => caminho === p || caminho.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  // Este objeto é reatribuído dentro de setAll — é assim que o @supabase/ssr
  // devolve o cookie renovado junto da resposta.
  let resposta = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sem configuração não dá para decidir nada: deixa passar e a página mostra
  // o erro de ambiente, que é bem mais claro do que um redirect misterioso.
  if (!url || !anonKey) return resposta;

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(paraGravar) {
        for (const { name, value } of paraGravar) {
          request.cookies.set(name, value);
        }
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of paraGravar) {
          resposta.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() renova a sessão e valida o token no servidor do Supabase.
  // Não troque por getSession(): aquele só lê o cookie, que o usuário controla.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;
  // O login do admin mora dentro de /admin, mas é porta, não área protegida.
  const ehLoginAdmin = caminho === ROTA_ENTRAR_ADMIN;
  const emAdmin = comecaCom(caminho, PREFIXOS_ADMIN) && !ehLoginAdmin;
  const protegida =
    comecaCom(caminho, PREFIXOS_APP) || comecaCom(caminho, PREFIXOS_PAINEL) || emAdmin;

  // --- Sem sessão ----------------------------------------------------------
  if (!user) {
    if (protegida) {
      const destino = request.nextUrl.clone();
      // A porta certa (src/lib/lado.ts): o admin tem a dele; painel, setup e
      // assinatura são da barbearia; o app é do cliente.
      destino.pathname = emAdmin
        ? ROTA_ENTRAR_ADMIN
        : comecaCom(caminho, PREFIXOS_APP)
          ? ROTA_ENTRAR_CLIENTE
          : ROTA_ENTRAR_BARBEIRO;
      // Guarda para onde a pessoa queria ir, e devolve para lá depois do login.
      destino.search = "";
      destino.searchParams.set("proximo", caminho);
      return NextResponse.redirect(destino);
    }
    return resposta;
  }

  // --- Com sessão: precisa saber o papel -----------------------------------
  if (!protegida && !ROTAS_AUTENTICACAO.includes(caminho)) {
    return resposta; // landing, /b/[slug] e afins: segue sem consultar o banco
  }

  const { data: perfil, error } = await supabase
    .from("profiles")
    .select("role, is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[middleware] falha ao ler o perfil:", error);
    return resposta; // requireRole() na página resolve
  }

  const papel = perfil?.role ?? "client";
  const ehAdmin = perfil?.is_platform_admin ?? false;

  // O lado da sessão foi escolhido pela porta do login (src/lib/lado.ts).
  // Quem tem barbearia pode estar de qualquer lado; quem é só cliente, só do
  // lado de cliente; "admin" só para admin — o cookie escolhe a ÁREA, não dá
  // permissão.
  const temBarbearia = papel === "owner" || papel === "assistant";
  const lado = ladoDaSessao(request.cookies.get(COOKIE_LADO)?.value, { temBarbearia, ehAdmin });

  const casa = casaDoLado(lado, temBarbearia);

  // Quem já está logado não fica olhando tela de login. A exceção é o login do
  // admin para quem ainda não está do lado admin: entrar ali troca a sessão.
  if (ROTAS_AUTENTICACAO.includes(caminho) && !(ehLoginAdmin && lado !== "admin")) {
    const destino = request.nextUrl.clone();
    destino.pathname = casa;
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  // --- Cada prefixo com o seu lado -----------------------------------------
  const podeApp = lado === "cliente";
  const podePainel = temBarbearia && lado === "barbearia";
  const podeAdmin = lado === "admin";

  // "Ver como o dono": o admin entra no /painel (e só nele — não no setup nem
  // na assinatura, que são do dono) quando o cookie de visualização existe.
  // Quem confere de verdade é `requireShopContext()`, que só aceita o cookie
  // de admin e recusa toda ação nesse modo.
  const visualizando =
    podeAdmin &&
    comecaCom(caminho, ["/painel"]) &&
    lojaDoCookie(request.cookies.get(COOKIE_VISUALIZACAO)?.value) !== null;

  // Admin fora do lado admin vai para a porta dele, não para a casa do lado.
  if (emAdmin && !podeAdmin && ehAdmin) {
    const destino = request.nextUrl.clone();
    destino.pathname = ROTA_ENTRAR_ADMIN;
    destino.search = "";
    destino.searchParams.set("proximo", caminho);
    return NextResponse.redirect(destino);
  }

  const negado =
    (comecaCom(caminho, PREFIXOS_APP) && !podeApp) ||
    (comecaCom(caminho, PREFIXOS_PAINEL) && !podePainel && !visualizando) ||
    (emAdmin && !podeAdmin);

  if (negado) {
    const destino = request.nextUrl.clone();
    destino.pathname = casa;
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  return resposta;
}

export const config = {
  matcher: [
    /*
     * Roda em tudo, MENOS:
     *   _next/static, _next/image  → build
     *   favicon, manifest, ícones  → estáticos
     *   arquivos com extensão      → imagens e afins
     *   api/webhooks, api/cron     → chamados pela Meta e pelo pg_cron, SEM
     *                                sessão. Nada aqui os redirecionaria (não
     *                                são prefixo protegido), mas cada chamada
     *                                pagaria um getUser() de ida e volta ao
     *                                Supabase à toa — e o webhook da Meta
     *                                tem prazo curto para receber o 200.
     *   api/emails                 → descadastro de um clique, chamado pelo
     *                                Gmail sem sessão.
     */
    "/((?!_next/static|_next/image|api/webhooks|api/cron|api/emails|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
