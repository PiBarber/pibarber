import { expect, test } from "@playwright/test";

import { VERSAO_PRIVACIDADE, VERSAO_TERMOS } from "../src/lib/termos";
import { SENHA } from "./ambiente";
import {
  apiComo,
  celularUnico,
  criarBarbeariaPronta,
  criarCliente,
  entrar,
  registrarAceite,
  sql,
  unico,
} from "./apoio";

/**
 * O ACEITE DOS TERMOS (supabase/37_aceite_dos_termos.sql, src/lib/termos.ts).
 *
 * A caixa "Li e aceito" só vale se virar registro: quem, quando, qual versão e
 * por onde. Conta sem registro em dia — a do Google, a de antes do registro
 * existir, todo mundo depois que a versão muda — para em /aceitar-termos.
 */

type Aceite = { source: string; terms_version: string; privacy_version: string };

function aceitesDe(userId: string): Aceite[] {
  return sql<Aceite>(
    `select source, terms_version, privacy_version from terms_acceptances
      where user_id = '${userId}' order by accepted_at`,
  );
}

test.describe("Tela de aceite", () => {
  test("conta sem aceite (a do Google) para na tela, e só segue depois de aceitar", async ({
    page,
  }) => {
    const conta = await criarCliente("Cliente Google", { semAceite: true });
    await entrar(page, conta.email, "cliente");
    await expect(page).toHaveURL(/\/aceitar-termos\?proximo=/);
    await expect(page.getByRole("heading", { name: "Antes de continuar" })).toBeVisible();

    // Outra página do app também para aqui.
    await page.goto("/app/agendamentos");
    await expect(page).toHaveURL(/\/aceitar-termos\?proximo=%2Fapp%2Fagendamentos/);

    // Sem marcar, não segue.
    await page.getByRole("button", { name: "Aceitar e continuar" }).click();
    await expect(page.locator("#termos-erro")).toContainText("Aceite os termos de uso");
    expect(aceitesDe(conta.id)).toHaveLength(0);

    await page.locator("#termos").check();
    await page.getByRole("button", { name: "Aceitar e continuar" }).click();
    await expect(page).toHaveURL(/\/app\/agendamentos/);

    expect(aceitesDe(conta.id)).toEqual([
      {
        source: "tela_de_aceite",
        terms_version: VERSAO_TERMOS,
        privacy_version: VERSAO_PRIVACIDADE,
      },
    ]);
  });

  test("quem aceitou a versão anterior vê 'Atualizamos' e ganha uma linha nova", async ({
    page,
  }) => {
    const loja = await criarBarbeariaPronta();
    // O dono aceitou uma versão antiga, depois da de hoje (a do ajudante).
    registrarAceite(loja.dono.id, { termos: "2020-01-01", privacidade: "2020-01-01" });

    await entrar(page, loja.dono.email, "barbearia");
    await expect(page).toHaveURL(/\/aceitar-termos/);
    await expect(page.getByRole("heading", { name: "Atualizamos nossos termos" })).toBeVisible();

    await page.locator("#termos").check();
    await page.getByRole("button", { name: "Aceitar e continuar" }).click();
    await expect(page).toHaveURL(/\/painel/);

    // O histórico guarda as três: nada é sobrescrito.
    expect(aceitesDe(loja.dono.id).map((a) => a.terms_version)).toEqual([
      VERSAO_TERMOS,
      "2020-01-01",
      VERSAO_TERMOS,
    ]);
  });

  test("'Não aceito' sai da conta", async ({ page }) => {
    const conta = await criarCliente("Cliente Recusa", { semAceite: true });
    await entrar(page, conta.email, "cliente");
    await page.getByRole("button", { name: /Não aceito/ }).click();
    await expect(page).toHaveURL(/\/entrar-cliente/);
    expect(aceitesDe(conta.id)).toHaveLength(0);
  });
});

test.describe("Cadastros", () => {
  test("o cadastro de cliente exige a caixa e grava o aceite", async ({ page }) => {
    const email = `${unico("novo")}@example.com`;
    await page.goto("/criar-conta-cliente");
    await page.locator("#nome").fill("Cliente Novo E2E");
    await page.locator("#email").fill(email);
    await page.locator("#telefone").fill(celularUnico());
    await page.locator("#senha").fill(SENHA);
    await page.locator("#confirmacao").fill(SENHA);

    await page.getByRole("button", { name: "Criar minha conta" }).click();
    await expect(page.locator("#termos-erro")).toContainText("Aceite os termos de uso");
    expect(sql(`select 1 from profiles where email = '${email}'`)).toHaveLength(0);

    await page.locator("#termos").check();
    await page.getByRole("button", { name: "Criar minha conta" }).click();
    await expect(page).toHaveURL(/\/app/);

    const [perfil] = sql<{ id: string }>(`select id from profiles where email = '${email}'`);
    expect(aceitesDe(perfil!.id).map((a) => a.source)).toEqual(["cadastro_cliente"]);
  });

  test("o cadastro da barbearia grava o aceite com a origem dele", async ({ page }) => {
    const email = `${unico("dono")}@example.com`;
    await page.goto("/cadastrar-barbearia");
    await page.locator("#nome").fill("Dono Termos E2E");
    await page.locator("#telefone").fill(celularUnico());
    await page.locator("#email").fill(email);
    await page.locator("#nomeBarbearia").fill(`Barbearia ${unico("termos")}`);
    await page.locator("#senha").fill(SENHA);
    await page.locator("#confirmacao").fill(SENHA);
    await page.locator("#termos").check();
    await page.getByRole("button", { name: "Criar minha barbearia" }).click();
    await expect(page).toHaveURL(/\/configurar/, { timeout: 30_000 });

    const [perfil] = sql<{ id: string }>(`select id from profiles where email = '${email}'`);
    expect(aceitesDe(perfil!.id).map((a) => a.source)).toEqual(["cadastro_barbearia"]);
  });
});

test.describe("A prova não se forja pela API", () => {
  test("a conta não grava aceite nem marca a versão no próprio perfil", async () => {
    const conta = await criarCliente("Cliente Forja", { semAceite: true });
    const api = await apiComo(conta.email);

    const { error: erroInsert } = await api.from("terms_acceptances").insert({
      user_id: conta.id,
      terms_version: VERSAO_TERMOS,
      privacy_version: VERSAO_PRIVACIDADE,
      source: "tela_de_aceite",
    });
    expect(erroInsert).not.toBeNull();

    await api
      .from("profiles")
      .update({ terms_version: VERSAO_TERMOS, privacy_version: VERSAO_PRIVACIDADE })
      .eq("id", conta.id);

    expect(aceitesDe(conta.id)).toHaveLength(0);
    expect(
      sql(`select 1 from profiles where id = '${conta.id}' and terms_version is not null`),
    ).toHaveLength(0);
  });
});
