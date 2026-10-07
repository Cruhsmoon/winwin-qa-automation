const { log } = require('../utils/logger');

const id = (v) => `[data-wwt-id="${v}"]`;

/** "Filters" modal opened by the slider icon next to the search button. */
class FiltersModal {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.openButton = page.locator(id('main-search__big-filter-open--button'));
    this.modal = page.locator(id('big-filter--modal'));
    // The modal renders two "Apply" buttons (desktop + mobile layouts) - use the visible one.
    this.applyButton = page.locator(id('big-filter__submit--button')).filter({ visible: true });
    this.clearAllButton = page.locator(id('big-filter__clear-all--button')).filter({ visible: true });
  }

  async open() {
    log('Open Filters modal');
    await this.openButton.click();
    await this.modal.waitFor();
  }

  /** Filter option checkbox by its visible label, e.g. "Breakfast", "Dogs allowed". */
  option(label) {
    return this.modal
      .locator('label')
      .filter({ has: this.page.locator(`span:text-is("${label}")`) })
      .getByRole('checkbox');
  }

  async check(label) {
    const cb = this.option(label);
    await cb.scrollIntoViewIfNeeded();
    if ((await cb.getAttribute('aria-checked')) !== 'true') {
      log(`Check filter: ${label}`);
      await cb.click();
    }
    return cb.getAttribute('value');
  }

  async apply() {
    log('Apply filters');
    await this.applyButton.click();
    await this.modal.waitFor({ state: 'hidden' });
  }
}

module.exports = { FiltersModal };
