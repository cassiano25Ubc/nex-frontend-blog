import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import Stripe from 'stripe';
import { E2E_STRIPE_WEBHOOK_SECRET, userIdForEmail } from './mocks/data';

let counter = 0;
function uniqueEmail(prefix = 'premium') {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function registerUser(page: Page, email: string) {
  await page.goto('/register');
  await page.fill('input[name="name"]', 'Membro Teste');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'password-123');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
}

// Simula o Stripe avisando o app: evento assinado enviado ao webhook real do Next.
// Não toca em nenhuma página ou API do Stripe.
async function sendCheckoutCompletedWebhook(
  request: APIRequestContext,
  userId: number | string,
) {
  const payload = JSON.stringify({
    id: 'evt_e2e',
    object: 'event',
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_e2e', object: 'checkout.session', client_reference_id: String(userId) } },
  });
  const signature = Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: E2E_STRIPE_WEBHOOK_SECRET,
  });
  return request.post('/api/webhook/stripe', {
    data: payload,
    headers: { 'content-type': 'application/json', 'stripe-signature': signature },
  });
}

test.describe('Fluxo de se tornar membro (premium)', () => {
  test('visitante anônimo não vê o botão "Virar premium"', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Virar premium' })).toHaveCount(0);
  });

  test('usuário logado não premium vê o botão e nenhum selo Premium', async ({ page }) => {
    await registerUser(page, uniqueEmail());
    await expect(page.getByRole('button', { name: 'Virar premium' })).toBeVisible();
    await expect(page.locator('header .badge-accent')).toHaveCount(0);
  });

  test('clicar em "Virar premium" inicia o checkout e redireciona', async ({ page }) => {
    await registerUser(page, uniqueEmail());

    const checkoutResponse = page.waitForURL(/checkout=success/);
    await page.getByRole('button', { name: 'Virar premium' }).click();
    await checkoutResponse;

    // O mock devolve uma URL local (nunca do Stripe): validamos só o redirecionamento.
    expect(new URL(page.url()).hostname).toBe('localhost');
    await expect(page.getByText('Pagamento recebido!')).toBeVisible();
  });

  test('após o pagamento o webhook ativa o premium e o usuário vira membro', async ({ page, request }) => {
    const email = uniqueEmail();
    await registerUser(page, email);
    await expect(page.getByRole('button', { name: 'Virar premium' })).toBeVisible();

    const response = await sendCheckoutCompletedWebhook(request, userIdForEmail(email));
    expect(response.status()).toBe(200);

    await page.reload();
    await expect(page.locator('header .badge-accent', { hasText: 'Premium' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Virar premium' })).toHaveCount(0);
  });

  test('o status premium persiste após sair e entrar de novo', async ({ page, request }) => {
    const email = uniqueEmail();
    await registerUser(page, email);
    await sendCheckoutCompletedWebhook(request, userIdForEmail(email));

    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'password-123');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.locator('header .badge-accent', { hasText: 'Premium' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Virar premium' })).toHaveCount(0);
  });

  test('usuário que já é premium recebe "Você já é premium." ao tentar o checkout', async ({ browser, request }) => {
    const email = uniqueEmail();
    // Duas abas da mesma sessão: a segunda ainda mostra o botão (página antiga) após virar premium.
    const context = await browser.newContext({ baseURL: 'http://localhost:3002' });
    const page = await context.newPage();
    await registerUser(page, email);
    await expect(page.getByRole('button', { name: 'Virar premium' })).toBeVisible();

    await sendCheckoutCompletedWebhook(request, userIdForEmail(email));

    await page.getByRole('button', { name: 'Virar premium' }).click();
    await expect(page.locator('.alert-error, [role="alert"]', { hasText: 'Você já é premium.' }).first()).toBeVisible();
    await context.close();
  });

  test('falha ao iniciar o checkout mostra mensagem de erro e mantém o usuário na página', async ({ page }) => {
    await registerUser(page, uniqueEmail('checkout-fail'));

    await page.getByRole('button', { name: 'Virar premium' }).click();

    await expect(
      page.getByText('Não foi possível iniciar o pagamento. Tente novamente.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Virar premium' })).toBeVisible();
  });

  test('webhook com assinatura inválida não ativa o premium', async ({ page, request }) => {
    const email = uniqueEmail();
    await registerUser(page, email);

    const response = await request.post('/api/webhook/stripe', {
      data: '{}',
      headers: { 'content-type': 'application/json', 'stripe-signature': 't=1,v1=invalida' },
    });
    expect(response.status()).toBe(400);

    await page.reload();
    await expect(page.getByRole('button', { name: 'Virar premium' })).toBeVisible();
  });

  test('home exibe os avisos de retorno do checkout (sucesso e cancelamento)', async ({ page }) => {
    await page.goto('/?checkout=success');
    await expect(page.getByText('Pagamento recebido!')).toBeVisible();

    await page.goto('/?checkout=cancel');
    await expect(page.getByText('Pagamento cancelado.')).toBeVisible();
    await expect(page.getByText('Pagamento recebido!')).toHaveCount(0);
  });

  test('checkbox de post premium só aparece para membros', async ({ page, request }) => {
    const email = uniqueEmail();
    await registerUser(page, email);

    await page.goto('/posts/new');
    await expect(page.getByRole('heading', { name: 'Criar post' })).toBeVisible();
    await expect(page.locator('input[name="premium"]')).toHaveCount(0);

    await sendCheckoutCompletedWebhook(request, userIdForEmail(email));

    await page.reload();
    await expect(page.locator('input[name="premium"]')).toBeVisible();
  });

  test('membro cria um post premium que aparece com selo na home e no detalhe', async ({ page, request }) => {
    const email = uniqueEmail();
    await registerUser(page, email);
    await sendCheckoutCompletedWebhook(request, userIdForEmail(email));

    const title = `Post premium ${Date.now()}`;
    await page.goto('/posts/new');
    await page.fill('input[name="title"]', title);
    await page.fill('textarea[name="content"]', 'Conteúdo exclusivo para membros');
    await page.locator('input[name="premium"]').check();
    await page.getByRole('button', { name: 'Publicar post' }).click();

    await expect(page).toHaveURL(/\/posts\/\d+$/);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.locator('main .badge-accent', { hasText: 'Premium' })).toBeVisible();

    await page.goto('/');
    const card = page.locator('article', { hasText: title });
    await expect(card).toBeVisible();
    await expect(card.locator('.badge-accent', { hasText: 'Premium' })).toBeVisible();
  });
});
