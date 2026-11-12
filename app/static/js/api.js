/**
 * DEVKIT API Workbench — API Client Service (Phase 3)
 * Handles request construction, parameter encoding, latency measurement,
 * and standardized error handling.
 */

export class ApiClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Execute an API request with performance tracking and error standardization.
   * @param {Object} options
   * @param {string} options.method - 'GET' | 'POST'
   * @param {string} options.path - Request path or template (e.g. '/add')
   * @param {Object} [options.queryParams] - Query key-value pairs
   * @param {Object} [options.pathParams] - Path replacement key-value pairs
   * @param {any} [options.body] - Request body (object for JSON or string)
   * @param {Object} [options.headers] - Additional HTTP headers
   * @returns {Promise<Object>} Standardized response object
   */
  async execute({ method = 'GET', path = '', queryParams = {}, pathParams = {}, body = null, headers = {} }) {
    // 1. Interpolate path parameters with strict URL encoding
    let resolvedPath = path;
    for (const [key, val] of Object.entries(pathParams)) {
      resolvedPath = resolvedPath.replace(`{${key}}`, encodeURIComponent(String(val ?? '')));
    }

    // 2. Build query string with strict URL encoding
    const queryEntries = Object.entries(queryParams).filter(([_, v]) => v !== undefined && v !== null && v !== '');
    let queryString = '';
    if (queryEntries.length > 0) {
      const searchParams = new URLSearchParams();
      for (const [k, v] of queryEntries) {
        searchParams.append(k, String(v));
      }
      queryString = `?${searchParams.toString()}`;
    }

    const fullUrl = `${this.baseUrl}${resolvedPath}${queryString}`;

    // 3. Prepare headers and payload
    const requestHeaders = { ...headers };
    let serializedBody = null;

    if (method.toUpperCase() === 'POST' && body !== null && body !== undefined) {
      if (typeof body === 'object') {
        serializedBody = JSON.stringify(body);
        if (!requestHeaders['Content-Type']) {
          requestHeaders['Content-Type'] = 'application/json';
        }
      } else {
        serializedBody = String(body);
        if (!requestHeaders['Content-Type']) {
          requestHeaders['Content-Type'] = 'application/json';
        }
      }
    }

    // 4. Measure execution latency using performance.now()
    const startTime = performance.now();
    const timestamp = new Date().toISOString();

    try {
      const response = await fetch(fullUrl, {
        method: method.toUpperCase(),
        headers: requestHeaders,
        body: serializedBody
      });

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      // Extract response headers
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Parse payload
      let parsedData = null;
      let rawText = '';
      try {
        rawText = await response.text();
        parsedData = JSON.parse(rawText);
      } catch {
        parsedData = rawText;
      }

      return {
        url: fullUrl,
        method: method.toUpperCase(),
        status: response.status,
        statusText: response.statusText || (response.ok ? 'OK' : 'Error'),
        ok: response.ok,
        duration,
        timestamp,
        headers: responseHeaders,
        data: parsedData,
        raw: rawText,
        isError: !response.ok
      };
    } catch (networkError) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      return {
        url: fullUrl,
        method: method.toUpperCase(),
        status: 0,
        statusText: 'Network / Connection Error',
        ok: false,
        duration,
        timestamp,
        headers: {},
        data: {
          detail: networkError.message || 'Unable to reach backend service.'
        },
        raw: String(networkError),
        isError: true,
        networkError: true
      };
    }
  }

  /**
   * Helper to construct display URL string for UI previews
   */
  buildUrlString(path, pathParams = {}, queryParams = {}) {
    let resolved = path;
    for (const [key, val] of Object.entries(pathParams)) {
      resolved = resolved.replace(`{${key}}`, encodeURIComponent(String(val ?? '')));
    }
    const queryEntries = Object.entries(queryParams).filter(([_, v]) => v !== undefined && v !== null && v !== '');
    if (queryEntries.length > 0) {
      const searchParams = new URLSearchParams();
      for (const [k, v] of queryEntries) {
        searchParams.append(k, String(v));
      }
      return `${resolved}?${searchParams.toString()}`;
    }
    return resolved;
  }
}

export const apiClient = new ApiClient();

