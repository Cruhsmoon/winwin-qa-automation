const { test } = require('@playwright/test');

/**
 * Tiny logger: prints to stdout with a timestamp and attaches
 * every step to the Playwright HTML report as an annotation.
 */
function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  try {
    test.info().annotations.push({ type: 'log', description: message });
  } catch {
    /* called outside of a test - stdout only */
  }
}

module.exports = { log };
