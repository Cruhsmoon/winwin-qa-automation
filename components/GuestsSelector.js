const { expect } = require('@playwright/test');
const { log } = require('../utils/logger');

const id = (v) => `[data-wwt-id="${v}"]`;

/** Guests dropdown in the main search bar (Adults / Children / Pets). */
class GuestsSelector {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.trigger = page.locator(id('guests-select__open--button'));
    this.menu = page.getByRole('menu');

    this.adultsInput = page.locator(id('guests-select__adults-number--input'));
    this.adultsIncrement = page.locator(id('guests-select__adults-number--increment--button'));
    this.adultsDecrement = page.locator(id('guests-select__adults-number--decrement--button'));

    this.petsInput = page.locator(id('guests-select__pets-number--input'));
    this.petsIncrement = page.locator(id('guests-select__pets-number--increment--button'));
    this.petTypeSelect = page.locator(id('guests-select__pet-type--select'));
    this.petWeightSelect = page.locator(id('guests-select__pet-weight--select'));
  }

  /** Text shown in the closed search-bar field (e.g. "2", "10  1"). */
  get summary() {
    return this.trigger.locator('xpath=..');
  }

  async open() {
    log('Open Guests selector');
    // retry the click: right after hydration the first click is sometimes swallowed
    await expect(async () => {
      if (!(await this.adultsInput.isVisible())) await this.trigger.click();
      await expect(this.adultsInput).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 20_000 });
  }

  async adultsValue() {
    return Number(await this.adultsInput.inputValue());
  }

  async adultsMax() {
    return Number(await this.adultsInput.getAttribute('max'));
  }

  /** Clicks "+" until it becomes disabled; returns the number of clicks made. */
  async incrementAdultsToLimit(safetyLimit = 50) {
    let clicks = 0;
    while ((await this.adultsIncrement.isEnabled()) && clicks < safetyLimit) {
      await this.adultsIncrement.click();
      clicks += 1;
    }
    log(`Adults "+" clicked ${clicks} times, value = ${await this.adultsValue()}`);
    return clicks;
  }

  async addPet() {
    log('Add 1 pet');
    await this.petsIncrement.click();
    await this.petTypeSelect.waitFor();
  }

  async selectPetType(type) {
    log(`Select pet type: ${type}`);
    await this.petTypeSelect.click();
    await this.page.getByRole('option', { name: type, exact: true }).click();
  }

  async selectPetWeight(weight) {
    log(`Select pet weight: ${weight}`);
    await this.petWeightSelect.click();
    await this.page.getByRole('option', { name: weight, exact: true }).click();
  }

  /** Opens a Radix select, returns visible option labels and the checked one, then closes it. */
  async readOptions(select) {
    await select.click();
    const options = this.page.getByRole('option');
    await options.first().waitFor();
    const labels = await options.allInnerTexts();
    const checked = await this.page.locator('[role="option"][aria-selected="true"]').innerText();
    await this.page.keyboard.press('Escape');
    return { labels: labels.map((l) => l.trim()), checked: checked.trim() };
  }
}

module.exports = { GuestsSelector };
