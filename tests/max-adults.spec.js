const { test, expect } = require('./fixtures');
const { SearchPage } = require('../pages/SearchPage');
const { log } = require('../utils/logger');
const { decode } = require('../utils/url');

test.describe('Scenario 1 - Max Adults selection in Guests selector', () => {
  /** @type {SearchPage} */
  let search;

  test.beforeEach(async ({ page }) => {
    search = new SearchPage(page);
    await search.openLanding();
    await search.guests.open();
  });

  test('user can select the maximum number of adults and UI blocks going above it', async () => {
    const { guests } = search;
    const max = await guests.adultsMax();
    log(`Adults input max attribute = ${max}`);
    expect(max, 'max attribute must be defined').toBeGreaterThan(1);

    await test.step('increase adults with "+" until the limit', async () => {
      await guests.incrementAdultsToLimit();
      await expect(guests.adultsInput).toHaveValue(String(max));
    });

    await test.step('UI behaviour at the limit', async () => {
      await expect(guests.adultsIncrement, '"+" is disabled at max').toBeDisabled();
      await expect(guests.adultsDecrement, '"-" stays enabled at max').toBeEnabled();
      await expect(guests.summary, 'closed field shows the selected count').toContainText(String(max));
    });

    await test.step('typing a value above the limit is not accepted', async () => {
      await guests.adultsInput.fill(String(max + 1));
      await guests.adultsInput.press('Tab');
      expect(await guests.adultsValue()).toBeLessThanOrEqual(max);
    });

    await test.step('selected value is passed to the search link (API params)', async () => {
      const href = decode(await search.landingSearchLink.getAttribute('href'));
      log(`Search link: ${href}`);
      expect(href).toContain(`guestQuantity.adultsQuantity=${max}`);
    });

    await test.step('after "-" the limit is released again', async () => {
      await guests.adultsDecrement.click();
      await expect(guests.adultsInput).toHaveValue(String(max - 1));
      await expect(guests.adultsIncrement).toBeEnabled();
    });
  });

  test('selected maximum persists after closing and reopening the selector', async ({ page }) => {
    const { guests } = search;
    const max = await guests.adultsMax();
    await guests.incrementAdultsToLimit();
    await page.keyboard.press('Escape');
    await expect(guests.adultsInput).toBeHidden();
    await expect(guests.summary).toContainText(String(max));
    await guests.open();
    await expect(guests.adultsInput).toHaveValue(String(max));
    await expect(guests.adultsIncrement).toBeDisabled();
  });
});
