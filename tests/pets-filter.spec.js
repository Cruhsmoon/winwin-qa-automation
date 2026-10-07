const { test, expect } = require('./fixtures');
const { SearchPage } = require('../pages/SearchPage');
const { log } = require('../utils/logger');
const { decode } = require('../utils/url');

const PET_TYPES = ['Dog', 'Cat', 'Other'];
const DOG_WEIGHTS = ['<1 kg', '1-5 kg', '5-10 kg', '10-15 kg', '15-20 kg', '>20 kg'];
// UI label -> value the app puts into the search URL, e.g. ">20 kg" -> ">20kg"
const toUrlWeight = (label) => label.replace(/\s/g, '');

test.describe('Scenario 2 - Pets filter options', () => {
  /** @type {SearchPage} */
  let search;

  test.beforeEach(async ({ page }) => {
    search = new SearchPage(page);
    await search.openLanding();
    await search.guests.open();
    await search.guests.addPet();
  });

  test('pet type and weight dropdowns expose all expected options', async () => {
    const types = await search.guests.readOptions(search.guests.petTypeSelect);
    log(`Pet types: ${types.labels.join(', ')} (selected: ${types.checked})`);
    expect(types.labels).toEqual(PET_TYPES);
    expect(types.checked, 'Dog is the default type').toBe('Dog');

    const weights = await search.guests.readOptions(search.guests.petWeightSelect);
    log(`Dog weights: ${weights.labels.join(', ')} (selected: ${weights.checked})`);
    expect(weights.labels).toEqual(DOG_WEIGHTS);
  });

  for (const weight of DOG_WEIGHTS) {
    test(`Dog ${weight} can be selected and is reflected in UI and search params`, async () => {
      const { guests } = search;
      await guests.selectPetType('Dog');
      await guests.selectPetWeight(weight);

      await expect(guests.petTypeSelect).toHaveText('Dog');
      await expect(guests.petWeightSelect).toHaveText(weight);
      const { checked } = await guests.readOptions(guests.petWeightSelect);
      expect(checked, 'option is marked as selected (aria-selected)').toBe(weight);

      const href = decode(await search.landingSearchLink.getAttribute('href'));
      expect(href).toContain('guestQuantity.pets[0].type=DOG');
      expect(href).toContain(`guestQuantity.pets[0].weight=${toUrlWeight(weight)}`);
    });
  }

  test('Other can be selected and is reflected in UI and search params', async () => {
    const { guests } = search;
    await guests.selectPetType('Other');
    await expect(guests.petTypeSelect).toHaveText('Other');
    const { checked } = await guests.readOptions(guests.petTypeSelect);
    expect(checked).toBe('Other');

    const href = decode(await search.landingSearchLink.getAttribute('href'));
    expect(href).toContain('guestQuantity.pets[0].type=OTHER');
  });

  test('switching type back and forth keeps the UI consistent', async () => {
    const { guests } = search;
    await guests.selectPetType('Cat');
    await expect(guests.petTypeSelect).toHaveText('Cat');
    await expect(guests.petWeightSelect, 'weight is not asked for cats').toBeHidden();

    await guests.selectPetType('Dog');
    await expect(guests.petWeightSelect).toBeVisible();
    await guests.selectPetWeight('>20 kg');
    await expect(guests.petWeightSelect).toHaveText('>20 kg');
    await expect(guests.petsInput).toHaveValue('1');
  });
});
