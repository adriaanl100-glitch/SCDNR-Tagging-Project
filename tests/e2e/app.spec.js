import { test, expect } from '@playwright/test';

test('loads catch form with tabs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'SCDNR Tag Logging' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Capture Current GPS Location' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save Catch' })).toBeVisible();
});

test('shows validation errors on empty submit', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Save Catch' }).click();
  await expect(page.locator('#error-species')).toBeVisible();
});

test('navigates to sync tab', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Submit Catches to DNR' })).toBeVisible();
  await expect(page.locator('#sync-count')).toBeVisible();
});

test('species dropdown disables invalid tag types', async ({ page }) => {
  await page.goto('/');
  await page.selectOption('#species', 'Southern Flounder');
  await expect(page.locator('#tag-type-k')).toBeDisabled();
});

test('offline banner hidden when online', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#offline-banner')).toBeHidden();
});
