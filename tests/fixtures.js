const base = require('@playwright/test');
const { SearchPage } = require('../pages/SearchPage');

// Third-party hosts that are irrelevant for these tests: the cookie banner (it overlays
// the page and appears at a random moment) and analytics/ads (slow, noisy network).
const BLOCKED_HOSTS = [
  'consent.cookiefirst.com',
  'google-analytics.com',
  'googletagmanager.com',
  'googlesyndication.com',
  'doubleclick.net',
  'connect.facebook.net',
  'clarity.ms',
  'youtube-nocookie.com',
];

const test = base.test.extend({
  page: async ({ page }, use) => {
    await page.route(
      (url) => BLOCKED_HOSTS.some((h) => url.hostname.endsWith(h)),
      (route) => route.abort(),
    );
    await use(page);
  },
  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page));
  },
});

module.exports = { test, expect: base.expect };
