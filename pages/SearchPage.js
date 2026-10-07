const { BasePage } = require('./BasePage');
const { GuestsSelector } = require('../components/GuestsSelector');
const { FiltersModal } = require('../components/FiltersModal');

/** Landing page (/) and search results page (/app) share the same search bar. */
class SearchPage extends BasePage {
  constructor(page) {
    super(page);
    this.guests = new GuestsSelector(page);
    this.filters = new FiltersModal(page);
    this.landingSearchLink = page.locator('[data-wwt-id="landing__search--link"]');
    this.filtersCounterBadge = this.filters.openButton;
  }

  async openLanding() {
    await this.open('/');
  }

  async openResults() {
    await this.open('/app');
  }
}

module.exports = { SearchPage };
