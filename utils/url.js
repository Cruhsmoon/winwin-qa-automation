/** Returns a decoded, human-readable URL string (brackets etc. unescaped). */
function decode(url) {
  return decodeURIComponent(url);
}

/** Returns all values of query params whose key starts with the given prefix. */
function paramsWithPrefix(url, prefix) {
  const { searchParams } = new URL(url);
  return [...searchParams.entries()].filter(([k]) => k.startsWith(prefix));
}

module.exports = { decode, paramsWithPrefix };
