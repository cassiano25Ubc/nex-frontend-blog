import { test, expect } from '@playwright/test';
import { mockUser } from './mocks/data';

test.describe('Fluxo completo de autenticação', () => {
  test('deve registrar um novo usuário e fazer login', async ({ page, context }) => {
    const newUserEmail = `testuser-${Date.now()}@example.com`;
    const newUserName = 'Test User';
    const newUserPassword = 'password-123';

    // Step 1: Navigate to register page
    await page.goto('/register');
    
    await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible();
    await expect(page.getByText('Preencha os dados para começar.')).toBeVisible();

    // Step 2: Fill and submit register form
    await page.fill('input[name="name"]', newUserName);
    await page.fill('input[name="email"]', newUserEmail);
    await page.fill('input[name="password"]', newUserPassword);
    
    await page.click('button[type="submit"]');

    // Step 3: Verify redirect to home page after successful registration
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible();

    // Step 4: Verify user is logged in by checking if they can see the logout button
    const logoutButton = page.getByRole('button', { name: 'Sair' });
    await expect(logoutButton).toBeVisible();

    // Step 5: Verify user can see "Criar post" button (only visible when logged in)
    await expect(page.getByRole('link', { name: 'Criar post' })).toBeVisible();

    // Step 6: Log out
    await logoutButton.click();

    // After logout, we should be back on home page but without the logout button
    await page.waitForTimeout(500);
    
    // Step 7: Verify logout by checking logout button is gone and login button appears
    const loginButton = page.getByRole('link', { name: 'Login' });
    await expect(loginButton).toBeVisible();
  });

  test('deve fazer login com credenciais válidas', async ({ page }) => {
    // Step 1: Navigate to login page
    await page.goto('/login');
    
    await expect(page.getByRole('heading', { name: 'Fazer login' })).toBeVisible();

    // Step 2: Fill and submit login form with mock user
    await page.fill('input[name="email"]', mockUser.email);
    await page.fill('input[name="password"]', mockUser.password);
    
    await page.click('button[type="submit"]');

    // Step 3: Verify redirect to home page after successful login
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible();

    // Step 4: Verify user is logged in by checking logout button
    const logoutButton = page.getByRole('button', { name: 'Sair' });
    await expect(logoutButton).toBeVisible();
  });

  test('deve exibir erro ao fazer login com credenciais inválidas', async ({ page }) => {
    // Step 1: Navigate to login page
    await page.goto('/login');
    
    // Step 2: Try to login with wrong credentials
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');

    // Step 3: Verify error message is shown
    const errorAlert = page.locator('[role="alert"].alert-error');
    await expect(errorAlert).toContainText('E-mail ou senha incorretos');
    
    // Step 4: Verify we're still on the login page
    await expect(page).toHaveURL('/login');
  });

  test('deve validar campos de registro obrigatórios', async ({ page }) => {
    // Step 1: Navigate to register page
    await page.goto('/register');

    // Step 2: Try to submit without filling anything
    await page.click('button[type="submit"]');

    // Step 3: Verify we're still on register page (HTML5 validation prevents submission)
    await expect(page).toHaveURL('/register');
  });

  test('deve exibir erro quando tentar registrar com e-mail já cadastrado', async ({ page }) => {
    // Step 1: Navigate to register page
    await page.goto('/register');

    // Step 2: Try to register with the mock user's email (which should already exist)
    await page.fill('input[name="name"]', 'Another User');
    await page.fill('input[name="email"]', mockUser.email);
    await page.fill('input[name="password"]', 'password-123');
    
    await page.click('button[type="submit"]');

    // Step 3: Verify error message about duplicate email
    const errorAlert = page.locator('[role="alert"].alert-error');
    await expect(errorAlert).toContainText('já está cadastrado');
    
    // Step 4: Verify we're still on register page
    await expect(page).toHaveURL('/register');
  });

  test('deve manter o usuário logado após recarregar a página', async ({ page }) => {
    // Step 1: Login first
    await page.goto('/login');
    
    await page.fill('input[name="email"]', mockUser.email);
    await page.fill('input[name="password"]', mockUser.password);
    await page.click('button[type="submit"]');

    // Step 2: Verify we're logged in
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible();

    // Step 3: Verify logout button is visible (user is logged in)
    const logoutButton = page.getByRole('button', { name: 'Sair' });
    await expect(logoutButton).toBeVisible();

    // Step 4: Reload the page
    await page.reload();

    // Step 5: Verify user is still logged in (page should load normally without redirecting to login)
    await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible();
    await expect(logoutButton).toBeVisible();
    
    // The token should still be in the httpOnly cookie, so we're still authenticated
    const url = page.url();
    expect(url).toContain('localhost');
  });

  test('deve navegar entre login e registro', async ({ page }) => {
    // Step 1: Start at login page
    await page.goto('/login');
    
    await expect(page.getByRole('heading', { name: 'Fazer login' })).toBeVisible();

    // Step 2: Click link to go to register
    await page.click('a:has-text("Cadastre-se")');

    // Step 3: Verify we're on register page
    await expect(page).toHaveURL('/register');
    await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible();

    // Step 4: Click link to go back to login
    await page.click('a:has-text("Fazer login")');

    // Step 5: Verify we're back on login page
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Fazer login' })).toBeVisible();
  });
});

