const { test, expect } = require('@playwright/test');
const testData = require('../test-data.json');

// Helper function for login - reusable across all tests
async function login(page, credentials) {
  await page.goto(credentials.url);
  await page.fill('input[type="text"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation after login
  await page.waitForLoadState('networkidle');
}

// Helper function to navigate to a specific project
async function navigateToProject(page, projectName) {
  await page.click(`text=${projectName}`);
  await page.waitForLoadState('networkidle');
}

// Helper function to find a task card by name
async function getTaskCard(page, taskName) {
  // Find the task card by its title - look for the heading then get the parent card container
  const taskHeading = page.locator(`h3:has-text("${taskName}")`).first();
  await expect(taskHeading).toBeVisible({ timeout: 10000 });
  // Get the parent container that holds the entire task card (heading + description + tags + metadata)
  const taskCard = taskHeading.locator('..').first();
  return taskCard;
}

// Helper function to verify task is in the correct column
async function verifyTaskInColumn(page, taskName, expectedColumn) {
  // Find the column container
  const column = page.locator(`[data-column="${expectedColumn}"], :has-text("${expectedColumn}")`).first();
  
  // Verify the task exists within this column
  const taskInColumn = column.locator(`:text("${taskName}")`).first();
  await expect(taskInColumn).toBeVisible({ timeout: 10000 });
}

// Helper function to verify tags on a task
async function verifyTaskTags(page, taskName, expectedTags) {
  // Find the task card
  const taskCard = await getTaskCard(page, taskName);

  // Verify each expected tag is present
  for (const tag of expectedTags) {
    // Use a more flexible approach to find the tag text
    const tagElement = taskCard.locator(`text="${tag}"`).first();
    await expect(tagElement).toBeVisible({ timeout: 5000 });
  }
}

// Data-driven test suite
test.describe('Task Management Verification', () => {
  // Run before each test
  test.beforeEach(async ({ page }) => {
    await login(page, testData.loginCredentials);
  });

  // Generate a test for each test case in the JSON data
  testData.testCases.forEach((testCase) => {
    test(`${testCase.id}: Verify "${testCase.taskName}" in ${testCase.project}`, async ({ page }) => {
      // Navigate to the project
      await navigateToProject(page, testCase.project);
      
      // Verify task is in the correct column
      await verifyTaskInColumn(page, testCase.taskName, testCase.expectedColumn);
      
      // Verify task has the correct tags
      await verifyTaskTags(page, testCase.taskName, testCase.expectedTags);
    });
  });
});