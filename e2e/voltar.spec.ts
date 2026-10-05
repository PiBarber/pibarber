import { expect, test } from "@playwright/test";

import { criarBarbeariaPronta, criarCliente, entrar } from "./apoio";

/**
 * O "VOLTAR" DA PÁGINA DA BARBEARIA E DO AGENDAMENTO
 * (src/components/booking/BotaoVoltar.tsx, src/lib/rastro.ts).
 *
 * Veio de dentro do app: volta pelo histórico, para a tela como estava.
 * Abriu o link direto: vai para a casa do lado (o app, ou o painel do dono).
 * Visitante sem conta: não há para onde voltar, e a seta não aparece.
 */

test.describe("Voltar da página da barbearia", () => {
  test("vindo da busca, volta para a busca com o filtro", async ({ page }) => {
    const loja = await criarBarbeariaPronta();
    const cliente = await criarCliente();
    await entrar(page, cliente.email, "cliente");

    await page.goto("/app/buscar?q=barba");
    await page.goto(`/b/${loja.slug}`);
    await page.getByRole("link", { name: "Voltar" }).click();
    await expect(page).toHaveURL(/\/app\/buscar\?q=barba$/);
  });

  test("aberta pelo link direto, leva o cliente ao app", async ({ page }) => {
    const loja = await criarBarbeariaPronta();
    const cliente = await criarCliente();
    await entrar(page, cliente.email, "cliente");

    // Uma aba nova, como quem toca no link do Instagram já logado.
    const aba = await page.context().newPage();
    await aba.goto(`/b/${loja.slug}`);
    await aba.getByRole("link", { name: "Voltar" }).click();
    await expect(aba).toHaveURL(/\/app$/);
  });

  test("o dono vendo a própria página volta ao painel", async ({ page }) => {
    const loja = await criarBarbeariaPronta();
    await entrar(page, loja.dono.email, "barbearia");

    const aba = await page.context().newPage();
    await aba.goto(`/b/${loja.slug}`);
    await aba.getByRole("link", { name: "Voltar" }).click();
    await expect(aba).toHaveURL(/\/painel$/);
  });

  test("visitante sem conta não vê a seta", async ({ page }) => {
    const loja = await criarBarbeariaPronta();
    await page.goto(`/b/${loja.slug}`);
    await expect(page.getByRole("heading", { name: loja.nome })).toBeVisible();
    await expect(page.getByRole("link", { name: "Voltar" })).toHaveCount(0);
  });
});

test.describe("Voltar do agendamento", () => {
  test("barbearia → agendar → voltar → voltar: chega ao app, não ao agendar", async ({
    page,
  }) => {
    const loja = await criarBarbeariaPronta();
    const cliente = await criarCliente();
    await entrar(page, cliente.email, "cliente");

    await page.goto("/app");
    await page.goto(`/b/${loja.slug}`);
    await page.getByRole("link", { name: "Agendar" }).click();
    await expect(page).toHaveURL(/\/agendar/);

    await page.getByRole("link", { name: "Voltar" }).click();
    await expect(page).toHaveURL(new RegExp(`/b/${loja.slug}$`));

    await page.getByRole("link", { name: "Voltar" }).click();
    await expect(page).toHaveURL(/\/app$/);
  });

  test("aberto direto do app (o 'Agendar de novo'), volta para o app", async ({ page }) => {
    const loja = await criarBarbeariaPronta();
    const cliente = await criarCliente();
    await entrar(page, cliente.email, "cliente");

    await page.goto("/app/agendamentos");
    await page.goto(`/b/${loja.slug}/agendar`);
    await page.getByRole("link", { name: "Voltar" }).click();
    await expect(page).toHaveURL(/\/app\/agendamentos$/);
  });

  test("aberto pelo link direto, volta para a barbearia", async ({ page }) => {
    const loja = await criarBarbeariaPronta();
    await page.goto(`/b/${loja.slug}/agendar`);
    await page.getByRole("link", { name: "Voltar" }).click();
    await expect(page).toHaveURL(new RegExp(`/b/${loja.slug}$`));
  });
});
