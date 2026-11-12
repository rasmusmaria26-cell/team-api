/**
 * DEVKIT API Workbench — Request History Repository (Phase 5)
 * Manages recent requests in localStorage with a 20-item FIFO limit.
 * Privacy & Safety: Never persists response bodies, credentials, or sensitive headers.
 */

const STORAGE_KEY = 'devkit-request-history';
const MAX_HISTORY_ITEMS = 20;

export class HistoryRepository {
  /**
   * Safely retrieve all history items from localStorage.
   * @returns {Array<Object>} List of up to 20 recent requests (newest first).
   */
  getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Add a request entry to history.
   * @param {Object} entry
   * @param {string} entry.method - 'GET' | 'POST'
   * @param {string} entry.endpoint - Base endpoint identifier (e.g. '/add')
   * @param {string} entry.displayUrl - Full constructed relative URL (e.g. '/add?a=2&b=3')
   * @param {Object} [entry.queryParams] - Query parameters used
   * @param {Object} [entry.pathParams] - Path parameters used
   * @param {any} [entry.body] - Request body used
   * @param {number} entry.status - HTTP response status code
   * @param {number} entry.duration - Execution time in milliseconds
   * @param {boolean} entry.ok - Whether status was in 2xx range
   * @returns {Object} Added entry
   */
  add({ method, endpoint, displayUrl, queryParams = {}, pathParams = {}, body = null, status, duration, ok }) {
    try {
      const items = this.getAll();
      const newEntry = {
        id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        method: String(method || 'GET').toUpperCase(),
        endpoint: String(endpoint || ''),
        displayUrl: String(displayUrl || endpoint),
        queryParams: { ...queryParams },
        pathParams: { ...pathParams },
        body: body !== null && body !== undefined ? (typeof body === 'object' ? { ...body } : String(body)) : null,
        status: Number(status || 0),
        duration: Number(duration || 0),
        ok: Boolean(ok)
      };

      // Add to front (newest first) and trim to 20 items (FIFO)
      items.unshift(newEntry);
      if (items.length > MAX_HISTORY_ITEMS) {
        items.length = MAX_HISTORY_ITEMS;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      return newEntry;
    } catch {
      // Gracefully handle quota exceeded or storage blocked
      return null;
    }
  }

  /**
   * Retrieve a single history item by ID.
   * @param {string} id
   * @returns {Object|null}
   */
  getById(id) {
    const items = this.getAll();
    return items.find((item) => item.id === id) || null;
  }

  /**
   * Clear all history from localStorage.
   */
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Gracefully no-op
    }
  }

  /**
   * Get current count of items.
   * @returns {number}
   */
  count() {
    return this.getAll().length;
  }
}

export const historyRepo = new HistoryRepository();

