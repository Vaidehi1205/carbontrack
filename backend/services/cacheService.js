const store = new Map();

/**
 * Read a cached value if it has not expired.
 * @param {string} key Cache key.
 * @returns {*|undefined}
 */
export function getCache(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

/**
 * Store a value in the in-memory cache.
 * @param {string} key Cache key.
 * @param {*} value Value to cache.
 * @param {number} ttlMs Time to live in milliseconds.
 * @returns {*}
 */
export function setCache(key, value, ttlMs) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

/**
 * Remove cache entries by exact key or prefix.
 * @param {string} prefix Cache prefix.
 * @returns {void}
 */
export function invalidateByPrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/**
 * Clear all cached data.
 * @returns {void}
 */
export function clearCache() {
  store.clear();
}
