const { test, expect } = require('./fixtures');
const { SearchPage } = require('../pages/SearchPage');
const { log } = require('../utils/logger');
const { decode, paramsWithPrefix } = require('../utils/url');

const SEARCH_API = '/api/v1/offers/search?';
const isSearch = (r) => r.url().includes(SEARCH_API);
const FILTERS = ['Breakfast', 'Dogs allowed'];

test.describe('Scenario 3 - Applying filters changes the search request', () => {
  test('selected filters are sent to /api/v1/offers/search and reflected in the page URL', async ({ page }) => {
    const search = new SearchPage(page);

    // 1. Baseline search request (no filters)
    const baselineResponse = page.waitForResponse((r) => isSearch(r.request()) && r.status() === 200, { timeout: 60_000 });
    await search.openResults();
    const baseline = await baselineResponse;
    const baselineUrl = baseline.url();
    log(`Baseline request: ${decode(baselineUrl)}`);
    expect(paramsWithPrefix(baselineUrl, 'filters'), 'no filters in baseline request').toHaveLength(0);
    expect(decode(page.url())).not.toContain('search.filters');

    // 2. Select filters in the modal
    await search.filters.open();
    const optionIds = [];
    for (const label of FILTERS) optionIds.push(await search.filters.check(label));
    log(`Selected option IDs: ${optionIds.join(', ')}`);
    for (const label of FILTERS) {
      await expect(search.filters.option(label)).toHaveAttribute('aria-checked', 'true');
    }

    // 3. Apply and intercept the new search request
    const filteredRequestPromise = page.waitForRequest(
      (r) => isSearch(r) && r.url().includes('filters'),
      { timeout: 60_000 },
    );
    await search.filters.apply();
    const filteredRequest = await filteredRequestPromise;
    const filteredUrl = filteredRequest.url();
    log(`Filtered request: ${decode(filteredUrl)}`);

    // API assertions
    expect(filteredUrl, 'request URL changed after applying filters').not.toBe(baselineUrl);
    const sentOptionIds = paramsWithPrefix(filteredUrl, 'filters')
      .filter(([k]) => k.includes('optionIDs'))
      .map(([, v]) => v);
    expect(sentOptionIds.sort()).toEqual([...optionIds].sort());
    const response = await filteredRequest.response();
    expect(response?.status(), 'filtered search responds 200').toBe(200);

    // UI assertions: page URL keeps the filters (shareable link)
    const pageUrl = decode(page.url());
    for (const idValue of optionIds) expect(pageUrl).toMatch(new RegExp(`search\\.filters\\[\\d+\\]\\.optionIDs\\[\\d+\\]=${idValue}(&|$)`));
  });
});
