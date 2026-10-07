const { log } = require('../utils/logger');

class BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.header = page.locator('header').first();
  }

  /**
   * Opens a path and waits until the React app is hydrated
   * (the app requests /api/v1/filters only after hydration).
   */
  async open(path = '/') {
    log(`Open ${path}`);
    const hydrated = this.page.waitForResponse((r) => r.url().includes('/api/v1/filters'), { timeout: 60_000 });
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    await hydrated;
    await this.header.waitFor();
  }
}

module.exports = { BasePage };
