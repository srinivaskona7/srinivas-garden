/**
 * Browser E2E Tests using Playwright
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Homepage', () => {
    test('should load homepage', async ({ page }) => {
        await page.goto(BASE_URL);

        await expect(page).toHaveTitle(/Beautiful Garden/);
        await expect(page.locator('h1')).toContainText('Garden');
    });

    test('should display plants section', async ({ page }) => {
        await page.goto(BASE_URL);

        await expect(page.locator('.section-title')).toContainText('Leafy Vegetables');
    });

    test('should have login link', async ({ page }) => {
        await page.goto(BASE_URL);

        const loginLink = page.locator('a[href="/login"]').first();
        await expect(loginLink).toBeVisible();
    });
});

test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);

        await expect(page.locator('#username')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should login with valid credentials', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);

        await page.fill('#username', 'user');
        await page.fill('#password', 'admin764');
        await page.click('button[type="submit"]');

        // Should redirect to admin page
        await page.waitForURL(`${BASE_URL}/admin`);
        await expect(page).toHaveURL(`${BASE_URL}/admin`);
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);

        await page.fill('#username', 'wrong');
        await page.fill('#password', 'wrong');
        await page.click('button[type="submit"]');

        // Should show error toast or message
        await expect(page.locator('.toast.error, .error-message')).toBeVisible({ timeout: 5000 });
    });
});

test.describe('Admin Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto(`${BASE_URL}/login`);
        await page.fill('#username', 'user');
        await page.fill('#password', 'admin764');
        await page.click('button[type="submit"]');
        await page.waitForURL(`${BASE_URL}/admin`);
    });

    test('should display plants grid', async ({ page }) => {
        await expect(page.locator('#plantsGrid')).toBeVisible();
        await expect(page.locator('.plant-card-version').first()).toBeVisible();
    });

    test('should open add plant modal', async ({ page }) => {
        await page.click('button:has-text("Add Plant")');

        await expect(page.locator('#addPlantModal')).toHaveClass(/active/);
        await expect(page.locator('#plantName')).toBeVisible();
    });

    test('should add a new plant', async ({ page }) => {
        await page.click('button:has-text("Add Plant")');

        await page.fill('#plantName', 'Playwright Test Plant');
        await page.fill('#plantSpecies', 'Test Species');
        await page.click('button:has-text("Add Plant"):not([onclick])');

        // Wait for toast
        await expect(page.locator('.toast.show')).toBeVisible({ timeout: 5000 });

        // Verify plant appears
        await expect(page.locator('.plant-card-version:has-text("Playwright Test Plant")')).toBeVisible();
    });

    test('should filter plants by version', async ({ page }) => {
        await page.click('.filter-tab[data-filter="v1"]');

        // Verify filter tab is active
        await expect(page.locator('.filter-tab[data-filter="v1"]')).toHaveClass(/active/);

        // Wait for filter to apply
        await page.waitForTimeout(300);
    });

    test('should open plant fullview on click', async ({ page }) => {
        await page.click('.plant-card-version >> nth=0');

        await expect(page.locator('#fullviewModal')).toHaveClass(/active/);
        await expect(page.locator('.version-gallery')).toBeVisible();
    });

    test('should close fullview modal', async ({ page }) => {
        await page.click('.plant-card-version >> nth=0');
        await expect(page.locator('#fullviewModal')).toHaveClass(/active/);

        await page.click('.fullview-close');
        await expect(page.locator('#fullviewModal')).not.toHaveClass(/active/);
    });

    test('should advance plant version', async ({ page }) => {
        // Find a plant that's not at V4
        const advanceBtn = page.locator('.btn-advance:not([disabled])').first();

        if (await advanceBtn.count() > 0) {
            await advanceBtn.click();

            // Confirm dialog
            page.on('dialog', async dialog => await dialog.accept());

            await expect(page.locator('.toast')).toBeVisible({ timeout: 5000 });
        }
    });
});

test.describe('Media Upload', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);
        await page.fill('#username', 'user');
        await page.fill('#password', 'admin764');
        await page.click('button[type="submit"]');
        await page.waitForURL(`${BASE_URL}/admin`);
    });

    test('should open media upload modal', async ({ page }) => {
        // Open plant fullview
        await page.click('.plant-card-version >> nth=0');
        await expect(page.locator('#fullviewModal')).toHaveClass(/active/);

        // Click add media button
        await page.click('.upload-btn >> nth=0');

        await expect(page.locator('#mediaModal')).toHaveClass(/active/);
        await expect(page.locator('#fileUploadArea')).toBeVisible();
    });
});
