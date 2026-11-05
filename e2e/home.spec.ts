import { test, expect } from '@playwright/test';

test('acessar essa página inicial', async ({ page }) => {
  await page.goto('/');
  
  // Check that page has content (you can add more specific assertions later)
 await expect(page.getByRole('heading', { name: "Posts" })).toBeVisible();
});

test('exibe os posts retornados pelo mock MSW', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Post mockado via MSW' }),
  ).toBeVisible();
});
