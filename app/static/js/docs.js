/**
 * DEVKIT API Workbench — Documentation Service (Phase 6)
 * Provides comprehensive schema documentation, parameters, sample requests/responses,
 * and single-click workbench loading for all 5 FastAPI endpoints.
 */

export const ENDPOINT_DOCS = [
  {
    id: '/health',
    endpoint: '/health',
    method: 'GET',
    title: 'Service Health Status',
    description: 'Returns the operational health status and currently deployed version of the DevKit backend.',
    params: [],
    requestSample: 'curl -X GET "http://127.0.0.1:8000/health"',
    responseSample: JSON.stringify({ status: 'ok', version: '0.1.0' }, null, 2),
    sampleDefaults: {}
  },
  {
    id: '/add',
    endpoint: '/add',
    method: 'GET',
    title: 'Add Two Numbers',
    description: 'Computes the arithmetic sum of two numeric inputs supplied via query parameters.',
    params: [
      { name: 'a', in: 'query', type: 'float / int', required: true, desc: 'First operand' },
      { name: 'b', in: 'query', type: 'float / int', required: true, desc: 'Second operand' }
    ],
    requestSample: 'curl -X GET "http://127.0.0.1:8000/add?a=10&b=25"',
    responseSample: JSON.stringify({ result: 35.0, sum: 35.0 }, null, 2),
    sampleDefaults: { a: '10', b: '25' }
  },
  {
    id: '/wordcount',
    endpoint: '/wordcount',
    method: 'POST',
    title: 'Word Count Analysis',
    description: 'Analyzes the supplied text string in JSON body and returns the total word count.',
    params: [
      { name: 'text', in: 'body', type: 'string', required: true, desc: 'Input text block to analyze' }
    ],
    requestSample: 'curl -X POST "http://127.0.0.1:8000/wordcount" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"text": "DevKit makes API testing fast and precise."}\'',
    responseSample: JSON.stringify({ word_count: 7, count: 7 }, null, 2),
    sampleDefaults: { text: 'DevKit makes API testing fast and precise.' }
  },
  {
    id: '/greet',
    endpoint: '/greet',
    method: 'GET',
    title: 'Personalized Greeting',
    description: 'Generates a greeting string personalized with the path-parameterized recipient name.',
    params: [
      { name: 'name', in: 'path', type: 'string', required: true, desc: 'Recipient name to greet' }
    ],
    requestSample: 'curl -X GET "http://127.0.0.1:8000/greet/Antigravity"',
    responseSample: '"Hello, Antigravity!"',
    sampleDefaults: { name: 'Antigravity' }
  },
  {
    id: '/reverse',
    endpoint: '/reverse',
    method: 'GET',
    title: 'String Reversal',
    description: 'Reverses the characters of the string supplied in the URL path.',
    params: [
      { name: 'text', in: 'path', type: 'string', required: true, desc: 'Text string to reverse' }
    ],
    requestSample: 'curl -X GET "http://127.0.0.1:8000/reverse/workbench"',
    responseSample: '"hcknebrow"',
    sampleDefaults: { text: 'workbench' }
  }
];

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Render all endpoint documentation cards into the specified container.
 * @param {HTMLElement} container
 * @param {Function} onLoadEndpoint - Callback invoked when "Load into Workbench" is clicked.
 */
export function renderDocs(container, onLoadEndpoint) {
  if (!container) return;

  const html = `
    <div class="docs-list">
      ${ENDPOINT_DOCS.map((doc) => {
        const methodClass = doc.method === 'POST' ? 'method-post' : 'method-get';
        const paramsHtml = doc.params.length > 0
          ? `
            <div class="doc-section">
              <h4 class="doc-section-heading">Parameters</h4>
              <table class="doc-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>In</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  ${doc.params
                    .map(
                      (p) => `
                    <tr>
                      <td class="doc-param-name"><code>${escapeHtml(p.name)}</code></td>
                      <td><span class="doc-param-in">${escapeHtml(p.in)}</span></td>
                      <td><code>${escapeHtml(p.type)}</code></td>
                      <td>${p.required ? '<span class="doc-badge-req">Required</span>' : '<span class="doc-badge-opt">Optional</span>'}</td>
                      <td>${escapeHtml(p.desc)}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `
          : `<div class="doc-section"><p class="text-muted text-xs">No parameters required.</p></div>`;

        return `
          <article class="doc-card" id="doc-${escapeHtml(doc.endpoint.replace('/', ''))}">
            <header class="doc-card-header">
              <div class="doc-card-title-group">
                <span class="method-badge ${methodClass}">${escapeHtml(doc.method)}</span>
                <h3 class="doc-card-path"><code>${escapeHtml(doc.endpoint)}</code></h3>
              </div>
              <button class="btn btn-secondary btn-xs btn-load-doc" data-doc-endpoint="${escapeHtml(doc.endpoint)}" title="Load this endpoint into the Request Builder">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="9 10 4 15 9 20"></polyline>
                  <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
                </svg>
                <span>Load into Workbench</span>
              </button>
            </header>

            <div class="doc-card-body">
              <p class="doc-desc">${escapeHtml(doc.description)}</p>

              ${paramsHtml}

              <div class="doc-section">
                <h4 class="doc-section-heading">Example Request</h4>
                <pre class="doc-code-block"><code>${escapeHtml(doc.requestSample)}</code></pre>
              </div>

              <div class="doc-section">
                <div class="doc-section-header">
                  <h4 class="doc-section-heading">Example Response</h4>
                  <span class="doc-status-pill status-2xx">200 OK</span>
                </div>
                <pre class="doc-code-block doc-code-json"><code>${escapeHtml(doc.responseSample)}</code></pre>
              </div>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;

  container.innerHTML = html;

  // Bind click handlers for "Load into Workbench" buttons
  const buttons = container.querySelectorAll('.btn-load-doc');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const endpoint = btn.getAttribute('data-doc-endpoint');
      const doc = ENDPOINT_DOCS.find((d) => d.endpoint === endpoint);
      if (doc && typeof onLoadEndpoint === 'function') {
        onLoadEndpoint(doc);
      }
    });
  });
}

