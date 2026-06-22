const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const requestedPages = ['Command Center', 'Inventory', 'Orders', 'Shipments', 'Reports'];
const pagesByRole = {
  CEO: requestedPages,
  'Company Manager': requestedPages,
  'Logistics Manager': ['Command Center', 'Shipments'],
  'Inventory Manager': ['Command Center', 'Inventory'],
  'Finance Manager': ['Command Center', 'Reports'],
};

function loadTestUsers() {
  let users;

  if (process.env.VELORA_LOAD_TEST_USERS_JSON) {
    users = JSON.parse(process.env.VELORA_LOAD_TEST_USERS_JSON);
  } else {
    const usersFile = path.resolve(process.env.VELORA_LOAD_TEST_USERS_FILE || 'tests/load-users.json');
    if (!fs.existsSync(usersFile)) {
      throw new Error(
        'Load-test users are missing. Copy tests/load-users.example.json to tests/load-users.json and provide 10 real test accounts.',
      );
    }
    users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  }

  if (!Array.isArray(users) || users.length < 10) {
    throw new Error('VELORA load tests require an array containing at least 10 test accounts.');
  }

  const selectedUsers = users.slice(0, 10);
  const emails = new Set();
  selectedUsers.forEach((user, index) => {
    if (!user.email || !user.password || !user.role) {
      throw new Error(`Test user ${index + 1} must include email, password, and role.`);
    }
    const normalizedEmail = String(user.email).trim().toLowerCase();
    if (emails.has(normalizedEmail)) {
      throw new Error(`Each worker requires a different account. Duplicate email: ${normalizedEmail}`);
    }
    emails.add(normalizedEmail);
  });

  return selectedUsers;
}

async function measure(metrics, label, action) {
  const startedAt = Date.now();
  await action();
  metrics.timings[label] = Date.now() - startedAt;
}

async function openPage(page, pageName, metrics) {
  await measure(metrics, pageName, async () => {
    await page.locator('aside nav').getByRole('button', { name: pageName, exact: true }).click();
    await expect(page.locator('.topbar .page-title h1')).toHaveText(pageName);
  });
}

async function createAndRemoveTestOrder(page, account, metrics) {
  const marker = `LOAD-TEST ${account.label || account.email.split('@')[0]} ${Date.now()}`;
  const vehicle = await page.locator('#vehicle-list option').first().getAttribute('value');
  if (!vehicle) {
    metrics.skipped.push({ page: 'Orders', reason: 'No inventory vehicle was available for safe order creation.' });
    return;
  }

  await measure(metrics, 'Create test order', async () => {
    await page.getByLabel('Customer Name').fill(marker);
    await page.getByLabel('Vehicle').fill(vehicle);
    await page.getByLabel('Quantity').fill('1');
    await page.getByRole('button', { name: 'Add order', exact: true }).click();
    await expect(page.locator('tbody tr').filter({ hasText: marker }).first()).toBeVisible();
  });

  metrics.createdOrder = marker;

  if (process.env.VELORA_LOAD_TEST_KEEP_ORDERS !== 'true') {
    await measure(metrics, 'Remove test order', async () => {
      const testRow = page.locator('tbody tr').filter({ hasText: marker }).first();
      await testRow.getByRole('button', { name: 'Delete', exact: true }).click();
      await expect(page.locator('tbody tr').filter({ hasText: marker })).toHaveCount(0);
    });
    metrics.testOrderRemoved = true;
  }
}

const users = loadTestUsers();
test.describe.configure({ mode: 'parallel' });

users.forEach((account, accountIndex) => {
  test(`worker ${String(accountIndex + 1).padStart(2, '0')} - ${account.label || `test-user-${accountIndex + 1}`}`, async ({ page }, testInfo) => {
    const metrics = {
      account: account.label || `test-user-${accountIndex + 1}`,
      role: account.role,
      timings: {},
      skipped: [],
      createdOrder: null,
      testOrderRemoved: false,
    };

    try {
      await measure(metrics, 'Open website', async () => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible();
      });

      await page.getByLabel('Role').selectOption({ label: account.role });
      await page.getByLabel('Email').fill(account.email);
      await page.getByLabel('Password').fill(account.password);

      await measure(metrics, 'Login and dashboard', async () => {
        await page.getByRole('button', { name: 'Sign in', exact: true }).click();
        await expect(page.locator('.topbar .page-title h1')).toHaveText('Command Center');
      });

      const allowedPages = pagesByRole[account.role] || ['Command Center'];
      for (const pageName of requestedPages.slice(1)) {
        if (!allowedPages.includes(pageName)) {
          metrics.skipped.push({ page: pageName, reason: `Locked by ${account.role} RBAC.` });
          continue;
        }
        await openPage(page, pageName, metrics);
      }

      const createOrders = process.env.VELORA_LOAD_TEST_CREATE_ORDERS === 'true';
      const mayCreateOrder = account.allowOrderCreation === true
        && ['CEO', 'Company Manager'].includes(account.role);

      if (createOrders && mayCreateOrder) {
        if (!(await page.locator('.topbar .page-title h1').textContent())?.includes('Orders')) {
          await openPage(page, 'Orders', metrics);
        }
        await createAndRemoveTestOrder(page, account, metrics);
      } else {
        metrics.skipped.push({
          page: 'Create test order',
          reason: createOrders
            ? 'Account is not explicitly authorized to create orders.'
            : 'Order creation is disabled. Set VELORA_LOAD_TEST_CREATE_ORDERS=true to opt in.',
        });
      }
    } finally {
      await testInfo.attach('load-metrics', {
        body: Buffer.from(JSON.stringify(metrics)),
        contentType: 'application/json',
      });
    }
  });
});
