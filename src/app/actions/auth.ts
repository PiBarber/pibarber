"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";

import { registrarAceite } from "@/lib/aceite-termos";
import { ROTA_EMAIL_CONFIRMADO, ROTA_REDEFINIR_SENHA } from "@/lib/auth";
import {
  casaDoLado,
  COOKIE_LADO,
  ladoDaSessao,
  OPCOES_COOKIE_LADO,
  portaDe,
  rotaDeEntrar,
  rotaDeEntrarCom,
  type Porta,
} from "@/lib/lado";
import { urlDoSite } from "@/lib/env";
import { criarBarbeariaDoDono, telefoneDeOutroDono } from "@/lib/nova-barbearia";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { erroDeTelefone, normalizarTelefone } from "@/lib/telefone";
import { aceiteEmDia, MENSAGEM_TERMOS, ROTA_ACEITAR_TERMOS } from "@/lib/termos";
import { falha, sucesso, type ActionResult } from "@/lib/types";

/**
 * Traduz o erro do Supabase Auth para português E diz a que campo ele pertence.
 *
 * O usuário nunca deve ler "Invalid login credentials" — e muito menos o
 * usuário BARBEIRO, que é quem paga a conta.
 *
 * O `campo` é o que permite ao formulário destacar o campo errado em vez de
 * jogar tudo num alerta no topo. Nulo quer dizer "não é de nenhum campo em
 * particular" — aí a tela mostra no topo mesmo.
 */
function traduzirErroAuth(mensagem: string): { texto: string; campo?: string } {
  const m = mensagem.toLowerCase();

  // A dica do Google é deliberada. Uma conta nascida pelo OAuth não tem senha,
  // e tentar entrar com uma devolve exatamente este erro — sem a frase, a
  // pessoa fica tentando adivinhar uma senha que nunca existiu. A dica não
  // revela se a conta existe: aparece para qualquer credencial recusada.
  if (m.includes("invalid login credentials")) {
    return {
      texto: "E-mail ou senha incorretos. Se você criou a conta com o Google, entre por ali.",
      campo: "senha",
    };
  }
  if (m.includes("email not confirmed")) {
    return { texto: "Confirme seu e-mail antes de entrar.", campo: "email" };
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return { texto: "Já existe uma conta com este e-mail. Tente entrar.", campo: "email" };
  }
  if (m.includes("password should be at least")) {
    return { texto: "A senha precisa ter pelo menos 6 caracteres.", campo: "senha" };
  }
  if (m.includes("weak password") || m.includes("pwned")) {
    return {
      texto: "Essa senha é fraca ou já apareceu em vazamentos. Escolha outra.",
      campo: "senha",
    };
  }
  if (m.includes("unable to validate email") || m.includes("invalid email")) {
    return { texto: "E-mail inválido.", campo: "email" };
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return { texto: "Muitas tentativas seguidas. Espere um minuto e tente de novo." };
  }
  if (m.includes("same password")) {
    return { texto: "A nova senha precisa ser diferente da atual.", campo: "senha" };
  }

  console.error("[auth] mensagem não traduzida:", mensagem);
  return { texto: "Não consegui completar. Tente de novo em instantes." };
}

/** E-mail com cara de e-mail. O julgamento final é do Supabase. */
function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/** Só aceita destino interno — bloqueia open redirect via ?proximo=. */
function destinoSeguro(proximo: FormDataEntryValue | string | null | undefined): string | null {
  const valor = typeof proximo === "string" ? proximo.trim() : "";
  if (!valor.startsWith("/") || valor.startsWith("//")) return null;
  return valor;
}

/**
 * O destino depois de entrar, passando antes por /aceitar-termos se o aceite
 * não estiver em dia.
 *
 * Precisa ser aqui, e não só no middleware: o `redirect()` de uma server
 * action para uma página do próprio app é renderizado na mesma resposta, sem
 * passar pelo middleware.
 */
function comAceite(
  perfil: { terms_version: string | null; privacy_version: string | null },
  destino: string,
): string {
  if (aceiteEmDia(perfil)) return destino;
  return `${ROTA_ACEITAR_TERMOS}?proximo=${encodeURIComponent(destino)}`;
}

/* ==========================================================================
   Entrar
   ==========================================================================

   ⚠️ Recebe um OBJETO, não FormData, e isso não é estilo — é correção de bug.

   Com `<form action={acao}>` o React 19 RESETA sozinho todo campo não
   controlado assim que a action termina, inclusive quando ela devolve erro.
   O usuário errava a senha e perdia o e-mail junto. Devolver os valores no
   ActionResult não resolveria: o nó do DOM não remonta, então `defaultValue`
   já não é lido. A saída é o formulário guardar os próprios valores em estado
   e chamar a action direto — que é, aliás, o padrão do resto do projeto
   (`criarAgendamento`, `salvarBarbearia`, `pagarComissao`…).
*/

export async function entrar(entrada: {
  email: string;
  senha: string;
  proximo?: string;
  /** A porta: "barbearia" (/entrar-barbeiro) ou "cliente" (/entrar-cliente). */
  lado?: Porta;
}): Promise<ActionResult> {
  const email = entrada.email.trim().toLowerCase();
  const senha = entrada.senha;
  const proximo = destinoSeguro(entrada.proximo);

  if (!email) return falha("Informe o e-mail.", "email");
  if (!senha) return falha("Informe a senha.", "senha");

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      const { texto, campo } = traduzirErroAuth(error.message);
      return falha(texto, campo);
    }
    if (!data.user) return falha("Não consegui entrar. Tente de novo.");

    // Onde cada papel mora. Lido aqui porque a sessão acabou de nascer.
    const { data: perfil, error: erroPerfil } = await supabase
      .from("profiles")
      .select("role, terms_version, privacy_version")
      .eq("id", data.user.id)
      .maybeSingle();

    if (erroPerfil) console.error("[auth] falha ao ler o perfil no login:", erroPerfil);

    // A porta decide o lado da sessão (src/lib/lado.ts). Conta só de cliente
    // pela porta da barbearia vira "cliente" e é convidada a criar a loja.
    // O admin, por aqui, é uma conta comum: o /admin só abre por /admin/entrar.
    const porta = portaDe(entrada.lado);
    const temBarbearia = perfil?.role === "owner" || perfil?.role === "assistant";
    const lado: Porta = porta === "barbearia" && temBarbearia ? "barbearia" : "cliente";
    (await cookies()).set(COOKIE_LADO, lado, OPCOES_COOKIE_LADO);

    revalidatePath("/", "layout");
    // Perfil ilegível (banco fora, ou sem a migração 37) não para ninguém
    // aqui — o mesmo que o middleware faz. Parar mandaria a pessoa a uma tela
    // de aceite que também não conseguiria gravar.
    const destino = proximo ?? casaDoLado(porta, temBarbearia);
    redirect(erroPerfil || !perfil ? destino : comAceite(perfil, destino));
  } catch (error) {
    unstable_rethrow(error); // deixa o redirect() acima passar
    console.error("[auth] erro inesperado em entrar:", error);
    return falha("Não consegui entrar. Tente de novo em instantes.");
  }
}

/* ==========================================================================
   Entrar no admin — a porta da plataforma
   ========================================================================== */

/** A mesma frase para senha errada e para conta que não é admin. */
const RECUSA_ADMIN = "E-mail ou senha incorretos.";

/**
 * Só e-mail e senha: sem Google, sem cadastro, sem dica.
 *
 * Quem acerta a senha mas NÃO é admin ouve exatamente o mesmo que quem errou,
 * e a sessão que acabou de nascer é desfeita na hora. A tela não serve para
 * descobrir quais contas existem nem quais são admin.
 */
export async function entrarAdmin(entrada: {
  email: string;
  senha: string;
  proximo?: string;
}): Promise<ActionResult> {
  const email = entrada.email.trim().toLowerCase();
  const senha = entrada.senha;
  const proximoBruto = destinoSeguro(entrada.proximo);
  // De volta só para dentro do /admin — esta porta não leva a outro lugar.
  const proximo =
    proximoBruto && (proximoBruto === "/admin" || proximoBruto.startsWith("/admin/"))
      ? proximoBruto
      : null;

  if (!email) return falha("Informe o e-mail.", "email");
  if (!senha) return falha("Informe a senha.", "senha");

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      const { texto, campo } = traduzirErroAuth(error.message);
      // Credencial recusada: a frase neutra, sem a dica do Google das outras portas.
      if (campo === "senha") return falha(RECUSA_ADMIN, "senha");
      return falha(texto, campo);
    }
    if (!data.user) return falha("Não consegui entrar. Tente de novo.");

    const { data: perfil, error: erroPerfil } = await supabase
      .from("profiles")
      .select("is_platform_admin")
      .eq("id", data.user.id)
      .maybeSingle();

    if (erroPerfil) console.error("[auth] falha ao ler o perfil no login do admin:", erroPerfil);

    if (!perfil?.is_platform_admin) {
      const { error: erroSair } = await supabase.auth.signOut();
      if (erroSair) console.error("[auth] falha ao desfazer a sessão recusada:", erroSair);
      return falha(RECUSA_ADMIN, "senha");
    }

    (await cookies()).set(COOKIE_LADO, "admin", OPCOES_COOKIE_LADO);

    revalidatePath("/", "layout");
    redirect(proximo ?? "/admin");
  } catch (error) {
    unstable_rethrow(error);
    console.error("[auth] erro inesperado em entrarAdmin:", error);
    return falha("Não consegui entrar. Tente de novo em instantes.");
  }
}

/* ==========================================================================
   Criar conta
   ========================================================================== */

/**
 * O cadastro de CLIENTE. Sempre cria um `client`.
 *
 * O papel não é enviado e não seria aceito: o trigger handle_new_user() força
 * role='client' ignorando qualquer coisa vinda do metadata. Dono nasce em
 * `criarContaBarbearia` (ou no /admin); assistente nasce em /painel/equipe.
 */
export async function criarConta(entrada: {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  confirmacao: string;
  /** A caixa "Li e aceito". Conferida aqui: a tela sozinha não prova nada. */
  aceitouTermos: boolean;
}): Promise<ActionResult> {
  const nome = entrada.nome.trim();
  const email = entrada.email.trim().toLowerCase();
  const telefone = normalizarTelefone(entrada.telefone);
  const senha = entrada.senha;
  const confirmacao = entrada.confirmacao;

  // Cada validação diz A QUEM pertence. A tela usa isso para acender o campo
  // certo e levar o foco até ele, em vez de um alerta genérico no topo.
  if (!nome) return falha("Informe seu nome.", "nome");
  if (nome.length < 3) return falha("Escreva seu nome completo.", "nome");
  if (!email) return falha("Informe o e-mail.", "email");
  if (!emailValido(email)) return falha("Esse e-mail não parece válido.", "email");
  // Cliente pode repetir telefone (mãe e filho com o mesmo celular é o caso
  // normal) — ao contrário do dono. Aqui só precisa ser um celular de verdade.
  const erroTelefone = erroDeTelefone(telefone);
  if (erroTelefone) return falha(erroTelefone, "telefone");
  if (!senha) return falha("Crie uma senha.", "senha");
  if (senha.length < 6) return falha("A senha precisa ter pelo menos 6 caracteres.", "senha");
  if (senha !== confirmacao) return falha("As senhas não são iguais.", "confirmacao");
  if (entrada.aceitouTermos !== true) return falha(MENSAGEM_TERMOS, "termos");

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { full_name: nome }, // vira profiles.full_name pelo trigger
        // Vai para o /callback, que é quem troca o código por sessão, e de lá
        // para a tela de boas-vindas. O link do e-mail é o único que a pessoa
        // clica horas depois, em outro aparelho — cair direto na home logada,
        // sem uma linha dizendo "deu certo", parece que o clique não fez nada.
        emailRedirectTo: `${urlDoSite()}/callback?lado=cliente&proximo=${encodeURIComponent(ROTA_EMAIL_CONFIRMADO)}`,
      },
    });

    if (error) {
      const { texto, campo } = traduzirErroAuth(error.message);
      return falha(texto, campo);
    }

    // E-MAIL JÁ CADASTRADO, disfarçado.
    //
    // Com "Confirm email" ligado, o Supabase NÃO devolve erro quando o e-mail
    // já existe — devolve um usuário de mentira, com `identities` vazio, para
    // não confirmar a terceiros quem tem conta no sistema. Sem esta checagem a
    // tela diria "confirme seu e-mail" e o e-mail nunca chegaria.
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      return falha("Já existe uma conta com este e-mail. Tente entrar.", "email");
    }

    // O telefone vai direto para o perfil, pela service role: o trigger
    // handle_new_user() só copia nome, e-mail e foto do metadata, e sem sessão
    // (confirmação de e-mail ligada) o próprio usuário ainda não pode gravar.
    // Só depois da checagem acima — aqui `data.user` é a conta que ACABOU de
    // nascer, nunca uma que já existia.
    if (data.user) {
      const { error: erroTelefone } = await createAdminClient()
        .from("profiles")
        .update({ phone: telefone })
        .eq("id", data.user.id);

      // Não desfaz a conta por isso: ela existe e funciona, e o app já pede o
      // telefone de quem está sem ele (AvisoTelefone e o agendamento).
      if (erroTelefone)
        console.error("[auth] falha ao gravar o telefone do cliente:", erroTelefone);

      await registrarAceite(data.user.id, "cadastro_cliente");
    }

    // Sem sessão = o projeto exige confirmação por e-mail.
    if (!data.session) {
      return sucesso(undefined, "Conta criada! Confirme o e-mail que enviamos para poder entrar.");
    }

    (await cookies()).set(COOKIE_LADO, "cliente", OPCOES_COOKIE_LADO);
    revalidatePath("/", "layout");
    redirect("/app"); // cadastro público sempre nasce cliente
  } catch (error) {
    unstable_rethrow(error);
    console.error("[auth] erro inesperado em criarConta:", error);
    return falha("Não consegui criar a conta. Tente de novo em instantes.");
  }
}

/* ==========================================================================
   Criar conta de barbearia — o dono se cadastra sozinho
   ========================================================================== */

/**
 * Cria a conta do dono JUNTO com a barbearia dele.
 *
 * Mesma ordem do /admin (`criarBarbearia`): a conta nasce `client`, a loja é
 * inserida com `owner_id` apontando para ela e o trigger
 * `barbershop_after_insert()` promove o perfil a `owner`. Não existe momento
 * em que a pessoa seja "dono sem barbearia" — se a loja não entra, a conta
 * recém-criada é apagada.
 *
 * A loja nasce com `is_active = false`: fora da busca e da página pública até
 * o setup de /configurar terminar. Sem isso ela apareceria para os clientes
 * sem horário, sem serviço e sem ninguém para atender.
 *
 * A REGRA DE UNICIDADE: dois barbeiros não dividem e-mail nem telefone.
 *   e-mail   → único em auth.users; o Supabase recusa (ou disfarça, ver abaixo).
 *   telefone → src/lib/nova-barbearia.ts, o mesmo caminho do cliente que abre
 *              a barbearia pelo Perfil.
 *
 * Usa a service role, e antes de haver sessão — é um dos usos legítimos
 * listados em src/lib/supabase/admin.ts. Ela só LÊ telefones para a checagem
 * e só ESCREVE no usuário que o próprio `signUp` acabou de criar.
 */
export async function criarContaBarbearia(entrada: {
  nome: string;
  nomeBarbearia: string;
  email: string;
  telefone: string;
  senha: string;
  confirmacao: string;
  aceitouTermos: boolean;
}): Promise<ActionResult> {
  const nome = entrada.nome.trim();
  const nomeBarbearia = entrada.nomeBarbearia.trim();
  const email = entrada.email.trim().toLowerCase();
  const telefone = normalizarTelefone(entrada.telefone);
  const senha = entrada.senha;

  if (nome.length < 3) return falha("Escreva seu nome completo.", "nome");
  if (nomeBarbearia.length < 2) return falha("Escreva o nome da barbearia.", "nomeBarbearia");
  if (!email) return falha("Informe o e-mail.", "email");
  if (!emailValido(email)) return falha("Esse e-mail não parece válido.", "email");
  const erroTelefone = erroDeTelefone(telefone);
  if (erroTelefone) return falha(erroTelefone, "telefone");
  if (!senha) return falha("Crie uma senha.", "senha");
  if (senha.length < 6) return falha("A senha precisa ter pelo menos 6 caracteres.", "senha");
  if (senha !== entrada.confirmacao) return falha("As senhas não são iguais.", "confirmacao");
  if (entrada.aceitouTermos !== true) return falha(MENSAGEM_TERMOS, "termos");

  try {
    const admin = createAdminClient();

    const telefoneEmUso = await telefoneDeOutroDono(admin, telefone);
    if (telefoneEmUso === null) {
      return falha("Não consegui criar a conta. Tente de novo em instantes.");
    }
    if (telefoneEmUso) {
      return falha("Este telefone já está cadastrado em outra barbearia.", "telefone");
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { full_name: nome },
        emailRedirectTo: `${urlDoSite()}/callback?lado=barbearia&proximo=${encodeURIComponent(ROTA_EMAIL_CONFIRMADO)}`,
      },
    });

    if (error) {
      const { texto, campo } = traduzirErroAuth(error.message);
      if (campo === "email" && texto.startsWith("Já existe")) {
        return falha(MENSAGEM_EMAIL_EXISTENTE, CAMPO_CONTA_EXISTENTE);
      }
      return falha(texto, campo);
    }

    // Mesmo disfarce do `criarConta`: e-mail já cadastrado volta como usuário
    // de mentira, sem identidades. O caso típico aqui é o CLIENTE do app que
    // quer abrir a barbearia dele — e a tela oferece isso ali mesmo: pede a
    // senha e chama `vincularBarbearia`, sem ele perder a conta.
    if (!data.user || (data.user.identities?.length ?? 0) === 0) {
      return falha(MENSAGEM_EMAIL_EXISTENTE, CAMPO_CONTA_EXISTENTE);
    }

    const userId = data.user.id;

    const criada = await criarBarbeariaDoDono(admin, { userId, nomeBarbearia, telefone });

    if (!criada.ok) {
      // Sem a loja, a conta ficaria órfã: um cadastro de barbeiro que entra
      // como cliente e não entende por quê. Desfaz.
      await admin.auth.admin.deleteUser(userId);
      return criada.motivo === "telefone_em_uso"
        ? falha("Este telefone já está cadastrado em outra barbearia.", "telefone")
        : falha("Não consegui criar a barbearia. Tente de novo em instantes.");
    }

    // Depois da loja: se ela falhasse, a conta seria apagada e o aceite junto.
    await registrarAceite(userId, "cadastro_barbearia");

    if (!data.session) {
      return sucesso(
        undefined,
        "Barbearia criada! Confirme o e-mail que enviamos e entre para terminar a configuração.",
      );
    }

    (await cookies()).set(COOKIE_LADO, "barbearia", OPCOES_COOKIE_LADO);
    revalidatePath("/", "layout");
    redirect("/configurar");
  } catch (error) {
    unstable_rethrow(error);
    console.error("[auth] erro inesperado em criarContaBarbearia:", error);
    return falha("Não consegui criar a conta. Tente de novo em instantes.");
  }
}

/**
 * Não diz "é conta de cliente" nem mostra nome ou foto — o Supabase não revela
 * de quem é o e-mail, e esta tela também não deveria. Quem é dono da conta
 * prova com a senha (ou com o Google) e só então a barbearia é vinculada.
 */
const MENSAGEM_EMAIL_EXISTENTE =
  "Já existe uma conta com este e-mail. Se ela é sua, confirme a senha para vincular a barbearia.";

/**
 * O `campo` que avisa a tela de cadastro para abrir o cartão de vínculo em vez
 * de só acender o campo do e-mail. Não é um campo do formulário.
 */
const CAMPO_CONTA_EXISTENTE = "contaExistente";

/* ==========================================================================
   Vincular a barbearia a uma conta que já existe
   ========================================================================== */

/**
 * O cliente que chega ao /cadastrar-barbearia com o e-mail da conta dele.
 *
 * Primeiro prova que a conta é dele (a senha), depois faz o mesmo que
 * `abrirMinhaBarbearia` faz pelo Perfil: a loja nasce com `owner_id` nele e o
 * trigger o promove a `owner`. Os agendamentos de cliente continuam onde estão.
 *
 * Senha errada não deixa nada para trás — nenhuma sessão nasceu. Conta que JÁ
 * tem barbearia (dono ou assistente) simplesmente entra pelo lado da
 * barbearia: era isso que ela queria ao digitar a senha.
 */
export async function vincularBarbearia(entrada: {
  email: string;
  senha: string;
  nomeBarbearia: string;
  telefone: string;
  aceitouTermos: boolean;
}): Promise<ActionResult> {
  const email = entrada.email.trim().toLowerCase();
  const nomeBarbearia = entrada.nomeBarbearia.trim();
  const telefone = normalizarTelefone(entrada.telefone);

  if (!emailValido(email)) return falha("Esse e-mail não parece válido.", "email");
  if (!entrada.senha) return falha("Digite sua senha para confirmar.", "senhaVinculo");
  if (nomeBarbearia.length < 2) return falha("Escreva o nome da barbearia.", "nomeBarbearia");
  const erroTelefone = erroDeTelefone(telefone);
  if (erroTelefone) return falha(erroTelefone, "telefone");
  if (entrada.aceitouTermos !== true) return falha(MENSAGEM_TERMOS, "termos");

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: entrada.senha,
    });

    if (error) {
      const { texto, campo } = traduzirErroAuth(error.message);
      if (campo === "senha") {
        return falha(
          "Senha incorreta. Tente de novo, recupere a senha ou entre com o Google.",
          "senhaVinculo",
        );
      }
      return falha(texto, campo === "email" ? "email" : undefined);
    }
    if (!data.user) return falha("Não consegui confirmar a conta. Tente de novo.");

    const { data: perfil, error: erroPerfil } = await supabase
      .from("profiles")
      .select("role, phone")
      .eq("id", data.user.id)
      .maybeSingle();

    if (erroPerfil || !perfil) {
      console.error("[auth] falha ao ler o perfil no vínculo:", erroPerfil);
      return falha("Não consegui vincular a barbearia. Tente de novo em instantes.");
    }

    // A senha provou a conta, e a caixa estava marcada: o aceite vale mesmo
    // que a conta já tenha barbearia e só entre por aqui.
    await registrarAceite(data.user.id, "vinculo_barbearia");

    const cookieStore = await cookies();

    // Já tem barbearia: não cria outra, só entra do lado dela.
    if (perfil.role !== "client") {
      cookieStore.set(COOKIE_LADO, "barbearia", OPCOES_COOKIE_LADO);
      revalidatePath("/", "layout");
      redirect("/painel");
    }

    // A partir daqui a conta está provada — ver src/lib/supabase/admin.ts.
    const admin = createAdminClient();

    const telefoneEmUso = await telefoneDeOutroDono(admin, telefone);
    if (telefoneEmUso === null) {
      return falha("Não consegui vincular a barbearia. Tente de novo em instantes.");
    }
    if (telefoneEmUso) {
      return falha("Este telefone já está cadastrado em outra barbearia.", "telefone");
    }

    const criada = await criarBarbeariaDoDono(admin, {
      userId: data.user.id,
      nomeBarbearia,
      telefone,
    });

    if (!criada.ok) {
      // Mesmo desfazer do `abrirMinhaBarbearia`: o telefone do perfil volta a
      // ser o do cliente, que é onde as barbearias dele o procuram.
      const { error: erroDesfazer } = await admin
        .from("profiles")
        .update({ phone: perfil.phone })
        .eq("id", data.user.id);
      if (erroDesfazer) console.error("[auth] falha ao desfazer o telefone:", erroDesfazer);

      return criada.motivo === "telefone_em_uso"
        ? falha("Este telefone já está cadastrado em outra barbearia.", "telefone")
        : falha("Não consegui criar a barbearia. Tente de novo em instantes.");
    }

    cookieStore.set(COOKIE_LADO, "barbearia", OPCOES_COOKIE_LADO);
    revalidatePath("/", "layout");
    redirect("/configurar");
  } catch (error) {
    unstable_rethrow(error);
    console.error("[auth] erro inesperado em vincularBarbearia:", error);
    return falha("Não consegui vincular a barbearia. Tente de novo em instantes.");
  }
}

/* ==========================================================================
   Aceitar os termos — /aceitar-termos
   ========================================================================== */

/**
 * Quem chegou ao app sem um aceite em dia: a conta criada pelo Google (que não
 * passa por caixa nenhuma), o assistente criado pelo dono, a conta de antes do
 * registro existir, e todo mundo quando a versão dos termos muda. O middleware
 * manda para /aceitar-termos; esta action grava e devolve ao destino.
 */
export async function aceitarTermos(entrada: {
  aceitouTermos: boolean;
  proximo?: string;
}): Promise<ActionResult> {
  if (entrada.aceitouTermos !== true) return falha(MENSAGEM_TERMOS, "termos");

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return falha("Sua sessão expirou. Entre de novo.");

    // A sessão é dele: getUser() validou o token no servidor do Supabase.
    const gravado = await registrarAceite(user.id, "tela_de_aceite");
    if (!gravado) return falha("Não consegui registrar o aceite. Tente de novo em instantes.");

    const { data: perfil } = await supabase
      .from("profiles")
      .select("role, is_platform_admin")
      .eq("id", user.id)
      .maybeSingle();
    const temBarbearia = perfil?.role === "owner" || perfil?.role === "assistant";
    const lado = ladoDaSessao((await cookies()).get(COOKIE_LADO)?.value, {
      temBarbearia,
      ehAdmin: perfil?.is_platform_admin ?? false,
    });

    revalidatePath("/", "layout");
    redirect(destinoSeguro(entrada.proximo) ?? casaDoLado(lado, temBarbearia));
  } catch (error) {
    unstable_rethrow(error);
    console.error("[auth] erro inesperado em aceitarTermos:", error);
    return falha("Não consegui registrar o aceite. Tente de novo em instantes.");
  }
}

/* ==========================================================================
   Google
   ========================================================================== */

/**
 * Não devolve ActionResult: o caminho de sucesso SEMPRE sai da página (vai
 * para o Google), e um `<form action>` simples exige retorno void. O erro
 * viaja pela query string e a tela de login o exibe.
 */
export async function entrarComGoogle(formData: FormData): Promise<void> {
  const proximo = destinoSeguro(formData.get("proximo"));
  const lado = portaDe(formData.get("lado"));
  let destino: string;

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${urlDoSite()}/callback?lado=${lado}${proximo ? `&proximo=${encodeURIComponent(proximo)}` : ""}`,
      },
    });

    if (error || !data.url) {
      console.error("[auth] falha ao abrir o OAuth do Google:", error);
      destino = rotaDeEntrarCom(lado, {
        erro: error ? traduzirErroAuth(error.message).texto : "Não consegui abrir o login do Google.",
      });
    } else {
      destino = data.url;
    }
  } catch (error) {
    unstable_rethrow(error);
    console.error("[auth] erro inesperado em entrarComGoogle:", error);
    destino = rotaDeEntrarCom(lado, { erro: "Não consegui abrir o login do Google." });
  }

  // redirect() fora do try: ele funciona levantando exceção, e um catch
  // no caminho engoliria o roteamento.
  redirect(destino);
}

/* ==========================================================================
   Sair
   ========================================================================== */

/* ==========================================================================
   Esqueci minha senha
   ========================================================================== */

/**
 * Manda o link de redefinir a senha. O e-mail sai pelo Supabase Auth (com o
 * Resend como SMTP — docs/emails.md) e o link cai em /callback, que troca por
 * sessão e leva a /redefinir-senha.
 *
 * A resposta é a MESMA exista ou não a conta: dizer "não há conta com este
 * e-mail" entregaria a quem testa quais e-mails são clientes do PiBarber.
 */
export async function pedirNovaSenha(entrada: {
  email: string;
  lado?: Porta;
}): Promise<ActionResult> {
  try {
    const email = entrada.email.trim().toLowerCase();
    if (!emailValido(email)) return falha("Digite um e-mail válido.", "email");

    const lado = portaDe(entrada.lado);
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${urlDoSite()}/callback?lado=${lado}&proximo=${encodeURIComponent(ROTA_REDEFINIR_SENHA)}`,
    });

    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes("rate limit") || m.includes("too many") || error.status === 429) {
        return falha("Já mandamos um link há pouco. Espere um minuto e tente de novo.");
      }
      // Qualquer outro erro é nosso (SMTP fora, configuração). Log, e a mesma
      // resposta neutra — sem revelar nada sobre a conta.
      console.error("[auth] falha ao pedir nova senha:", error);
    }

    return sucesso(
      undefined,
      "Se houver uma conta com este e-mail, o link para criar uma nova senha chega em instantes. Confira também o spam.",
    );
  } catch (error) {
    unstable_rethrow(error);
    console.error("[auth] erro inesperado em pedirNovaSenha:", error);
    return falha("Não consegui enviar agora. Tente de novo em instantes.");
  }
}

/**
 * Grava a nova senha. Só funciona com a sessão que o link do e-mail abriu —
 * sem ela, `updateUser` recusa e a tela manda pedir outro link.
 */
export async function redefinirSenha(entrada: {
  senha: string;
  confirmacao: string;
}): Promise<ActionResult> {
  try {
    if (entrada.senha.length < 6) {
      return falha("A senha precisa ter pelo menos 6 caracteres.", "senha");
    }
    if (entrada.senha !== entrada.confirmacao) {
      return falha("A confirmação não bate com a senha.", "confirmacao");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return falha("O link expirou. Peça um novo em “Esqueci minha senha”.");
    }

    const { error } = await supabase.auth.updateUser({ password: entrada.senha });
    if (error) {
      const { texto, campo } = traduzirErroAuth(error.message);
      return falha(texto, campo);
    }

    const { data: perfil, error: erroPerfil } = await supabase
      .from("profiles")
      .select("role, is_platform_admin, terms_version, privacy_version")
      .eq("id", user.id)
      .maybeSingle();
    const temBarbearia = perfil?.role === "owner" || perfil?.role === "assistant";
    const lado = ladoDaSessao((await cookies()).get(COOKIE_LADO)?.value, {
      temBarbearia,
      ehAdmin: perfil?.is_platform_admin ?? false,
    });

    revalidatePath("/", "layout");
    const casa = casaDoLado(lado, temBarbearia);
    // Sem o perfil, não para (ver `entrar`); o admin não passa pelo aceite.
    redirect(lado === "admin" || erroPerfil || !perfil ? casa : comAceite(perfil, casa));
  } catch (error) {
    unstable_rethrow(error);
    console.error("[auth] erro inesperado em redefinirSenha:", error);
    return falha("Não consegui trocar a senha. Tente de novo.");
  }
}

export async function sair(): Promise<void> {
  // O lado da sessão sai junto: a próxima porta escolhe de novo. Antes, ele
  // diz para qual porta voltar — quem saiu do painel quer o login do painel.
  const cookieStore = await cookies();
  const valorLado = cookieStore.get(COOKIE_LADO)?.value;
  const porta = valorLado === "admin" ? "admin" : portaDe(valorLado);
  cookieStore.delete(COOKIE_LADO);
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) console.error("[auth] falha ao sair:", error);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[auth] erro inesperado em sair:", error);
  }

  revalidatePath("/", "layout");
  redirect(rotaDeEntrar(porta));
}
