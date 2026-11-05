import { test, expect, type Page } from '@playwright/test';

let counter = 0;
function uniqueSuffix() {
  counter += 1;
  return `${Date.now()}-${counter}-${Math.floor(Math.random() * 1e6)}`;
}

async function registerUser(page: Page) {
  await page.goto('/register');
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="name"]', 'Curtidor Teste');
  await page.fill('input[name="email"]', `likes-${uniqueSuffix()}@example.com`);
  await page.fill('input[name="password"]', 'password-123');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
}

// Cria um post novo pela UI (isola o teste do estado compartilhado) e abre o detalhe.
async function createPost(page: Page) {
  const title = `Post para curtir ${uniqueSuffix()}`;
  await page.goto('/posts/new');
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="title"]', title);
  await page.fill('textarea[name="content"]', 'Conteúdo do post');
  await page.getByRole('button', { name: 'Publicar post' }).click();
  await expect(page).toHaveURL(/\/posts\/\d+$/);
  return { title, url: new URL(page.url()).pathname };
}

const likeButton = (page: Page) => page.getByRole('button', { name: /Curtir|Curtido/ });
const homeBadge = (page: Page, title: string) =>
  page.locator('article', { hasText: title }).locator('.badge', { hasText: '♥' });

test.describe('Curtir posts', () => {
  test('curtir na página do post atualiza o botão, a contagem e persiste após recarregar', async ({ page }) => {
    await registerUser(page);
    const { url } = await createPost(page);

    await expect(likeButton(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(likeButton(page).locator('.badge')).toHaveText('0');

    await likeButton(page).click();
    await expect(likeButton(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(likeButton(page)).toContainText('Curtido');
    await expect(likeButton(page).locator('.badge')).toHaveText('1');

    await page.goto(url);
    await expect(likeButton(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(likeButton(page).locator('.badge')).toHaveText('1');
  });

  test('o like aparece na home com a contagem correta', async ({ page }) => {
    await registerUser(page);
    const { title } = await createPost(page);

    await page.goto('/');
    await expect(homeBadge(page, title)).toHaveText('♥ 0');

    await page.goBack();
    await likeButton(page).click();
    await expect(likeButton(page).locator('.badge')).toHaveText('1');

    await page.goto('/');
    await expect(homeBadge(page, title)).toHaveText('♥ 1');
  });

  test('descurtir volta o botão e a contagem, na página e na home', async ({ page }) => {
    await registerUser(page);
    const { title, url } = await createPost(page);

    await likeButton(page).click();
    await expect(likeButton(page).locator('.badge')).toHaveText('1');

    await likeButton(page).click();
    await expect(likeButton(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(likeButton(page).locator('.badge')).toHaveText('0');

    await page.goto(url);
    await expect(likeButton(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(likeButton(page).locator('.badge')).toHaveText('0');

    await page.goto('/');
    await expect(homeBadge(page, title)).toHaveText('♥ 0');
  });

  test('o like de um usuário conta para outros, mas só ele aparece como curtido', async ({ page, browser }) => {
    await registerUser(page);
    const { title, url } = await createPost(page);
    await likeButton(page).click();
    await expect(likeButton(page).locator('.badge')).toHaveText('1');

    const otherContext = await browser.newContext({ baseURL: 'http://localhost:3002' });
    const other = await otherContext.newPage();
    await registerUser(other);
    await other.goto(url);
    await expect(likeButton(other)).toHaveAttribute('aria-pressed', 'false');
    await expect(likeButton(other).locator('.badge')).toHaveText('1');

    await likeButton(other).click();
    await expect(likeButton(other).locator('.badge')).toHaveText('2');

    await page.goto('/');
    await expect(homeBadge(page, title)).toHaveText('♥ 2');
    await otherContext.close();
  });

  test('visitante anônimo vê a contagem mas o post não aparece como curtido', async ({ page, browser }) => {
    await registerUser(page);
    const { url } = await createPost(page);
    await likeButton(page).click();
    await expect(likeButton(page).locator('.badge')).toHaveText('1');

    const anonContext = await browser.newContext({ baseURL: 'http://localhost:3002' });
    const anon = await anonContext.newPage();
    await anon.goto(url);
    await expect(anon.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(anon.getByText('♥ 1 curtidas')).toBeVisible();
    await expect(anon.getByRole('button', { name: /Curtir|Curtido/ })).toHaveCount(0);
    await anonContext.close();
  });
});
