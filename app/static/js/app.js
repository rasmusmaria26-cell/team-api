/**
 * DEVKIT API Workbench — Shell, Request Builder & Response Inspector Controller
 * Scope:
 * - Phase 2: Theme switching, mobile drawer navigation, docs drawer modal, accessibility.
 * - Phase 3: Request building (structured & raw), URL parameter encoding, input validation.
 * - Phase 4: Response inspection, syntax-highlighted JSON tree, raw response, headers table,
 *   latency & size metrics, copy payload, and in-flight stale response retention.
 */

import { apiClient } from './api.js';
import { historyRepo } from './history.js';
import { renderDocs } from './docs.js';

// ============================================================================
// 1. SAFE STORAGE UTILITY
// ============================================================================

const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Gracefully no-op if cookies/storage disabled or blocked
    }
  }
};

// ============================================================================
// 2. THEME CONTROLLER
// ============================================================================

function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const htmlRoot = document.documentElement;

  // Retrieve priority: explicitly saved preference -> OS preference -> 'dark' default
  const savedTheme = storage.get('devkit-theme');
  let currentTheme = 'dark';

  if (savedTheme === 'light' || savedTheme === 'dark') {
    currentTheme = savedTheme;
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    currentTheme = 'light';
  }

  applyTheme(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const activeTheme = htmlRoot.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      storage.set('devkit-theme', nextTheme);
    });
  }

  // Listen for operating system theme changes with guarded fallback (no duplicates)
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleOSThemeChange = (e) => {
      if (!storage.get('devkit-theme')) {
        applyTheme(e.matches ? 'light' : 'dark');
      }
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleOSThemeChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleOSThemeChange);
    }
  }
}

function applyTheme(theme) {
  const htmlRoot = document.documentElement;
  const themeToggleBtn = document.getElementById('theme-toggle-btn');

  htmlRoot.setAttribute('data-theme', theme);

  if (themeToggleBtn) {
    const isDark = theme === 'dark';
    const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';
    themeToggleBtn.setAttribute('aria-label', label);
    themeToggleBtn.setAttribute('title', label);
  }
}

// ============================================================================
// 3. CENTRALIZED SCROLL LOCK & BACKGROUND ISOLATION UTILITIES
// ============================================================================

function setInert(element, active) {
  if (!element) return;
  if ('inert' in element) {
    element.inert = Boolean(active);
  }
  if (active) {
    element.setAttribute('inert', '');
  } else {
    element.removeAttribute('inert');
  }
}

function getFocusableElements(container) {
  if (!container) return [];
  const selector = [
    'button:not([disabled]):not([aria-hidden="true"])',
    '[href]:not([aria-hidden="true"])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  return Array.from(container.querySelectorAll(selector)).filter((el) => {
    return !el.hasAttribute('disabled') && (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0);
  });
}

function trapFocus(e, container) {
  if (e.key !== 'Tab') return;
  const focusables = getFocusableElements(container);
  if (focusables.length === 0) {
    e.preventDefault();
    return;
  }
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first || !container.contains(document.activeElement)) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last || !container.contains(document.activeElement)) {
      e.preventDefault();
      first.focus();
    }
  }
}

// Centralized scroll lock manager
const scrollManager = {
  _savedOverflow: '',
  _isLocked: false,

  sync() {
    const shouldLock = isDocsDrawerOpen() || isMobileSidebarOpen();
    if (shouldLock && !this._isLocked) {
      this._savedOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      this._isLocked = true;
    } else if (!shouldLock && this._isLocked) {
      document.body.style.overflow = this._savedOverflow;
      this._isLocked = false;
    }
  }
};

// Centralized inert / background isolation manager
function syncInertState() {
  const header = document.querySelector('.app-header');
  const body = document.querySelector('.app-body');
  const workspace = document.getElementById('app-workspace');
  const sidebar = document.getElementById('app-sidebar');

  const docsOpen = isDocsDrawerOpen();
  const mobileOpen = isMobileSidebarOpen();

  if (docsOpen) {
    // Documentation drawer open: isolate entire background (header & body)
    setInert(header, true);
    setInert(body, true);
  } else if (mobileOpen) {
    // Mobile sidebar open: isolate header and workspace, keep sidebar active
    setInert(header, true);
    setInert(body, false);
    setInert(workspace, true);
    setInert(sidebar, false);
  } else {
    // No overlays open: restore interactivity to header, body, and workspace
    setInert(header, false);
    setInert(body, false);
    setInert(workspace, false);
    if (window.innerWidth <= 768) {
      setInert(sidebar, true);
    } else {
      setInert(sidebar, false);
    }
  }
}

// ============================================================================
// 4. OVERLAYS CONTROLLERS (DOCUMENTATION DRAWER & MOBILE SIDEBAR)
// ============================================================================

function isDocsDrawerOpen() {
  const drawer = document.getElementById('docs-drawer');
  return Boolean(drawer && drawer.classList.contains('active'));
}

function isMobileSidebarOpen() {
  const sidebar = document.getElementById('app-sidebar');
  return Boolean(sidebar && sidebar.classList.contains('mobile-open'));
}

function openDocsDrawer() {
  const drawer = document.getElementById('docs-drawer');
  const backdrop = document.getElementById('docs-backdrop');
  const docsBtn = document.getElementById('docs-drawer-btn');
  const closeBtn = document.getElementById('docs-drawer-close');

  if (!drawer || !backdrop || !docsBtn) return;
  if (isDocsDrawerOpen()) return;

  if (isMobileSidebarOpen()) {
    closeMobileSidebar({ restoreFocus: false });
  }

  drawer.classList.add('active');
  drawer.setAttribute('aria-hidden', 'false');
  backdrop.classList.add('active');
  docsBtn.setAttribute('aria-expanded', 'true');

  syncInertState();
  scrollManager.sync();

  if (closeBtn) {
    closeBtn.focus();
  }
}

function closeDocsDrawer({ restoreFocus = true } = {}) {
  const drawer = document.getElementById('docs-drawer');
  const backdrop = document.getElementById('docs-backdrop');
  const docsBtn = document.getElementById('docs-drawer-btn');

  if (!drawer || !backdrop || !docsBtn) return;
  if (!isDocsDrawerOpen()) return;

  drawer.classList.remove('active');
  drawer.setAttribute('aria-hidden', 'true');
  backdrop.classList.remove('active');
  docsBtn.setAttribute('aria-expanded', 'false');

  syncInertState();
  scrollManager.sync();

  if (restoreFocus && docsBtn) {
    docsBtn.focus();
  }
}

function openMobileSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const menuBtn = document.getElementById('mobile-menu-btn');
  const closeBtn = document.getElementById('mobile-sidebar-close');

  if (!sidebar || !backdrop || !menuBtn) return;
  if (isMobileSidebarOpen()) return;

  if (isDocsDrawerOpen()) {
    closeDocsDrawer({ restoreFocus: false });
  }

  sidebar.classList.add('mobile-open');
  sidebar.setAttribute('aria-hidden', 'false');
  backdrop.classList.add('active');
  menuBtn.setAttribute('aria-expanded', 'true');

  syncInertState();
  scrollManager.sync();

  if (closeBtn) {
    closeBtn.focus();
  } else {
    const firstFocusable = getFocusableElements(sidebar)[0];
    if (firstFocusable) firstFocusable.focus();
  }
}

function closeMobileSidebar({ restoreFocus = true } = {}) {
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const menuBtn = document.getElementById('mobile-menu-btn');

  if (!sidebar || !backdrop || !menuBtn) return;
  if (!isMobileSidebarOpen()) return;

  sidebar.classList.remove('mobile-open');
  backdrop.classList.remove('active');
  menuBtn.setAttribute('aria-expanded', 'false');

  if (window.innerWidth <= 768) {
    sidebar.setAttribute('aria-hidden', 'true');
  }

  syncInertState();
  scrollManager.sync();

  if (restoreFocus && menuBtn) {
    menuBtn.focus();
  }
}

function syncSidebarResponsiveState() {
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const menuBtn = document.getElementById('mobile-menu-btn');

  if (!sidebar) return;

  const isMobile = window.innerWidth <= 768;

  if (!isMobile) {
    sidebar.classList.remove('mobile-open');
    sidebar.removeAttribute('aria-hidden');
    if (backdrop) backdrop.classList.remove('active');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    syncInertState();
    scrollManager.sync();
  } else {
    if (!sidebar.classList.contains('mobile-open')) {
      if (document.activeElement && sidebar.contains(document.activeElement)) {
        if (menuBtn) {
          menuBtn.focus();
        }
      }
      sidebar.setAttribute('aria-hidden', 'true');
      if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
      syncInertState();
    }
  }
}

function initOverlays() {
  const docsBtn = document.getElementById('docs-drawer-btn');
  const docsCloseBtn = document.getElementById('docs-drawer-close');
  const docsBackdrop = document.getElementById('docs-backdrop');

  const menuBtn = document.getElementById('mobile-menu-btn');
  const sidebarCloseBtn = document.getElementById('mobile-sidebar-close');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const sidebar = document.getElementById('app-sidebar');
  const docsDrawer = document.getElementById('docs-drawer');

  if (docsBtn) {
    docsBtn.addEventListener('click', () => {
      if (isDocsDrawerOpen()) {
        closeDocsDrawer({ restoreFocus: true });
      } else {
        openDocsDrawer();
      }
    });
  }

  if (docsCloseBtn) {
    docsCloseBtn.addEventListener('click', () => closeDocsDrawer({ restoreFocus: true }));
  }

  if (docsBackdrop) {
    docsBackdrop.addEventListener('click', () => closeDocsDrawer({ restoreFocus: true }));
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      if (isMobileSidebarOpen()) {
        closeMobileSidebar({ restoreFocus: true });
      } else {
        openMobileSidebar();
      }
    });
  }

  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', () => closeMobileSidebar({ restoreFocus: true }));
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', () => closeMobileSidebar({ restoreFocus: true }));
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (isDocsDrawerOpen()) {
        e.preventDefault();
        closeDocsDrawer({ restoreFocus: true });
      } else if (isMobileSidebarOpen()) {
        e.preventDefault();
        closeMobileSidebar({ restoreFocus: true });
      }
    } else if (e.key === 'Tab') {
      if (isDocsDrawerOpen()) {
        trapFocus(e, docsDrawer);
      } else if (isMobileSidebarOpen()) {
        trapFocus(e, sidebar);
      }
    }
  });

  window.addEventListener('resize', syncSidebarResponsiveState);
  syncSidebarResponsiveState();
}

// ============================================================================
// 5. REQUEST BUILDER CONTROLLER (PHASE 3)
// ============================================================================

const ENDPOINT_CONFIGS = {
  '/add': {
    method: 'GET',
    path: '/add',
    description: 'Adds two numbers together. Returns both the computed sum and result.',
    formId: 'form-add'
  },
  '/wordcount': {
    method: 'POST',
    path: '/wordcount',
    description: 'Analyzes input text and counts words. Accepts a JSON payload.',
    formId: 'form-wordcount'
  },
  '/greet': {
    method: 'GET',
    path: '/greet/{name}',
    description: 'Generates a personalized greeting for the provided name.',
    formId: 'form-greet'
  },
  '/reverse': {
    method: 'GET',
    path: '/reverse/{text}',
    description: 'Reverses the character sequence of the input text string.',
    formId: 'form-reverse'
  },
  '/health': {
    method: 'GET',
    path: '/health',
    description: 'Verifies API server operational health and deployed version.',
    formId: 'form-health'
  }
};

let currentEndpoint = '/add';
let currentMode = 'structured'; // 'structured' | 'raw'

function getEndpointConfig(endpoint) {
  return ENDPOINT_CONFIGS[endpoint] || ENDPOINT_CONFIGS['/add'];
}

function setValidationAlert(message) {
  const alertEl = document.getElementById('request-validation-alert');
  const textEl = document.getElementById('request-validation-text');
  if (!alertEl || !textEl) return;

  if (message) {
    textEl.textContent = message;
    alertEl.style.display = 'flex';
  } else {
    alertEl.style.display = 'none';
    textEl.textContent = '';
  }
}

function updateWordcountStats(text) {
  const statsEl = document.getElementById('wordcount-stats');
  if (!statsEl) return;

  const str = String(text || '');
  const chars = str.length;
  const words = str.trim() ? str.trim().split(/\s+/).length : 0;
  statsEl.textContent = `${chars} chars • ${words} ${words === 1 ? 'word' : 'words'}`;
}

/**
 * Calculates current request URL, path params, query params, and body from inputs.
 */
function getRequestData() {
  const config = getEndpointConfig(currentEndpoint);
  const data = {
    method: config.method,
    path: config.path,
    queryParams: {},
    pathParams: {},
    body: null,
    valid: true,
    error: null
  };

  if (currentMode === 'structured') {
    switch (currentEndpoint) {
      case '/add': {
        const aVal = document.getElementById('input-add-a').value.trim();
        const bVal = document.getElementById('input-add-b').value.trim();

        if (aVal === '' || !Number.isFinite(Number(aVal))) {
          data.valid = false;
          data.error = 'Parameter "a" must be a valid, finite number.';
          return data;
        }
        if (bVal === '' || !Number.isFinite(Number(bVal))) {
          data.valid = false;
          data.error = 'Parameter "b" must be a valid, finite number.';
          return data;
        }

        data.queryParams = { a: Number(aVal), b: Number(bVal) };
        break;
      }

      case '/wordcount': {
        const textVal = document.getElementById('input-wordcount-text').value;
        if (!textVal.trim()) {
          data.valid = false;
          data.error = 'Payload "text" cannot be empty.';
          return data;
        }
        data.body = { text: textVal };
        break;
      }

      case '/greet': {
        const nameVal = document.getElementById('input-greet-name').value.trim();
        if (!nameVal) {
          data.valid = false;
          data.error = 'Parameter "name" cannot be empty.';
          return data;
        }
        data.pathParams = { name: nameVal };
        break;
      }

      case '/reverse': {
        const textVal = document.getElementById('input-reverse-text').value;
        if (!textVal) {
          data.valid = false;
          data.error = 'Parameter "text" cannot be empty.';
          return data;
        }
        data.pathParams = { text: textVal };
        break;
      }

      case '/health': {
        // Zero-parameter health check
        break;
      }
    }
  } else {
    // RAW Mode
    switch (currentEndpoint) {
      case '/add': {
        const aVal = document.getElementById('input-add-a').value.trim();
        const bVal = document.getElementById('input-add-b').value.trim();
        data.queryParams = { a: aVal || 2, b: bVal || 3 };
        break;
      }
      case '/wordcount': {
        const rawJson = document.getElementById('raw-json-body').value.trim();
        try {
          const parsed = JSON.parse(rawJson);
          if (parsed === null || typeof parsed !== 'object' || typeof parsed.text !== 'string') {
            data.valid = false;
            data.error = 'Raw JSON body must be an object with a "text" string property.';
            return data;
          }
          data.body = parsed;
        } catch (err) {
          data.valid = false;
          data.error = `Invalid JSON syntax: ${err.message}`;
          return data;
        }
        break;
      }
      case '/greet': {
        const nameVal = document.getElementById('input-greet-name').value.trim();
        data.pathParams = { name: nameVal || 'Developer' };
        break;
      }
      case '/reverse': {
        const textVal = document.getElementById('input-reverse-text').value;
        data.pathParams = { text: textVal || 'FastAPI' };
        break;
      }
      case '/health': {
        break;
      }
    }
  }

  return data;
}

/**
 * Updates the live URL preview bar and footer target code based on active inputs.
 */
function syncLiveUrlPreview() {
  const config = getEndpointConfig(currentEndpoint);
  let pathParams = {};
  let queryParams = {};

  switch (currentEndpoint) {
    case '/add': {
      const a = document.getElementById('input-add-a')?.value || '2';
      const b = document.getElementById('input-add-b')?.value || '3';
      queryParams = { a, b };
      break;
    }
    case '/wordcount': {
      break;
    }
    case '/greet': {
      const name = document.getElementById('input-greet-name')?.value || 'Developer';
      pathParams = { name };
      break;
    }
    case '/reverse': {
      const text = document.getElementById('input-reverse-text')?.value || 'FastAPI';
      pathParams = { text };
      break;
    }
    case '/health': {
      break;
    }
  }

  const constructedUrl = apiClient.buildUrlString(config.path, pathParams, queryParams);

  const targetUrlPreview = document.getElementById('target-url-preview');
  const footerTargetCode = document.getElementById('footer-target-code');
  const rawUrlInput = document.getElementById('raw-url-input');

  if (targetUrlPreview) targetUrlPreview.textContent = constructedUrl;
  if (footerTargetCode) footerTargetCode.textContent = `${config.method} ${constructedUrl}`;
  if (rawUrlInput) rawUrlInput.value = constructedUrl;
}

/**
 * Sets the active editor mode ('structured' | 'raw') and synchronizes payloads.
 */
function setEditorMode(mode) {
  if (mode !== 'structured' && mode !== 'raw') return;
  currentMode = mode;

  const tabStructured = document.getElementById('mode-tab-structured');
  const tabRaw = document.getElementById('mode-tab-raw');
  const viewStructured = document.getElementById('structured-editor');
  const viewRaw = document.getElementById('raw-editor');
  const rawBodySection = document.getElementById('raw-body-section');
  const rawGetNotice = document.getElementById('raw-get-notice');

  setValidationAlert(null);

  if (mode === 'structured') {
    tabStructured?.classList.add('active');
    tabStructured?.setAttribute('aria-selected', 'true');
    tabRaw?.classList.remove('active');
    tabRaw?.setAttribute('aria-selected', 'false');

    if (viewStructured) viewStructured.style.display = 'block';
    if (viewRaw) viewRaw.style.display = 'none';

    // Synchronize edits from raw mode back to structured fields if applicable
    if (currentEndpoint === '/wordcount') {
      const rawJson = document.getElementById('raw-json-body')?.value.trim();
      if (rawJson) {
        try {
          const parsed = JSON.parse(rawJson);
          if (parsed && typeof parsed.text === 'string') {
            const textarea = document.getElementById('input-wordcount-text');
            if (textarea) {
              textarea.value = parsed.text;
              updateWordcountStats(parsed.text);
            }
          }
        } catch {
          // If invalid JSON, retain current structured value without overwriting
        }
      }
    }
  } else {
    // Switching to Raw mode
    tabRaw?.classList.add('active');
    tabRaw?.setAttribute('aria-selected', 'true');
    tabStructured?.classList.remove('active');
    tabStructured?.setAttribute('aria-selected', 'false');

    if (viewStructured) viewStructured.style.display = 'none';
    if (viewRaw) viewRaw.style.display = 'block';

    if (currentEndpoint === '/wordcount') {
      if (rawBodySection) rawBodySection.style.display = 'block';
      if (rawGetNotice) rawGetNotice.style.display = 'none';

      const currentText = document.getElementById('input-wordcount-text')?.value || 'Hello world from DevKit';
      const rawTextarea = document.getElementById('raw-json-body');
      if (rawTextarea) {
        rawTextarea.value = JSON.stringify({ text: currentText }, null, 2);
      }
    } else {
      if (rawBodySection) rawBodySection.style.display = 'none';
      if (rawGetNotice) rawGetNotice.style.display = 'flex';
    }
  }

  syncLiveUrlPreview();
}

/**
 * Activates an endpoint and updates forms, badges, and URL previews.
 */
function selectEndpoint(endpoint) {
  if (!ENDPOINT_CONFIGS[endpoint]) return;
  currentEndpoint = endpoint;
  const config = ENDPOINT_CONFIGS[endpoint];

  setValidationAlert(null);

  // 1. Update navigation active state
  document.querySelectorAll('.endpoint-item').forEach((item) => {
    if (item.getAttribute('data-endpoint') === endpoint) {
      item.classList.add('active');
      item.setAttribute('aria-current', 'page');
    } else {
      item.classList.remove('active');
      item.removeAttribute('aria-current');
    }
  });

  // 2. Update Header Subtitle & Method Badge
  const subtitleEl = document.getElementById('request-panel-subtitle');
  const methodBadge = document.getElementById('target-method-badge');

  if (subtitleEl) subtitleEl.textContent = config.description;
  if (methodBadge) {
    methodBadge.textContent = config.method;
    methodBadge.className = `method-badge ${config.method === 'POST' ? 'method-post' : 'method-get'}`;
  }

  // 3. Switch structured forms
  document.querySelectorAll('.endpoint-form').forEach((form) => {
    if (form.getAttribute('data-endpoint') === endpoint) {
      form.style.display = 'block';
      form.classList.add('active');
    } else {
      form.style.display = 'none';
      form.classList.remove('active');
    }
  });

  // 4. Update raw mode body section visibility
  const rawBodySection = document.getElementById('raw-body-section');
  const rawGetNotice = document.getElementById('raw-get-notice');

  if (endpoint === '/wordcount') {
    if (rawBodySection) rawBodySection.style.display = 'block';
    if (rawGetNotice) rawGetNotice.style.display = 'none';
    const currentText = document.getElementById('input-wordcount-text')?.value || 'Hello world from DevKit';
    const rawTextarea = document.getElementById('raw-json-body');
    if (rawTextarea) rawTextarea.value = JSON.stringify({ text: currentText }, null, 2);
  } else {
    if (rawBodySection) rawBodySection.style.display = 'none';
    if (rawGetNotice) rawGetNotice.style.display = 'flex';
  }

  syncLiveUrlPreview();
}

/**
 * Handles Send Request click and state machine transitions.
 */
async function handleSendRequest() {
  const reqData = getRequestData();

  if (!reqData.valid) {
    setValidationAlert(reqData.error);
    return;
  }

  setValidationAlert(null);

  const sendBtn = document.getElementById('send-request-btn');
  const sendSpinner = document.getElementById('send-btn-spinner');
  const sendIcon = document.getElementById('send-btn-icon');
  const sendLabel = document.getElementById('send-btn-label');
  const respPanel = document.getElementById('response-panel');
  const staleBadge = document.getElementById('resp-stale-badge');

  // Loading state
  if (sendBtn) sendBtn.disabled = true;
  if (sendSpinner) sendSpinner.style.display = 'inline-block';
  if (sendIcon) sendIcon.style.display = 'none';
  if (sendLabel) sendLabel.textContent = 'Sending...';

  // If a previous response exists, mark it as in-flight stale rather than wiping
  if (lastResponse && respPanel && staleBadge) {
    staleBadge.style.display = 'inline-flex';
    respPanel.classList.add('is-loading');
  }

  try {
    const response = await apiClient.execute({
      method: reqData.method,
      path: reqData.path,
      queryParams: reqData.queryParams,
      pathParams: reqData.pathParams,
      body: reqData.body
    });

    // Record in history repository (Phase 5)
    historyRepo.add({
      method: reqData.method,
      endpoint: currentEndpoint,
      displayUrl: reqData.displayUrl,
      queryParams: reqData.queryParams,
      pathParams: reqData.pathParams,
      body: reqData.body,
      status: response.status,
      duration: response.duration,
      ok: response.ok
    });
    renderHistory();

    // Dispatch custom event for Phase 4 Response Inspector
    document.dispatchEvent(new CustomEvent('devkit:response', { detail: response }));
  } catch (err) {
    // Record client error in history repository (Phase 5)
    historyRepo.add({
      method: reqData.method,
      endpoint: currentEndpoint,
      displayUrl: reqData.displayUrl,
      queryParams: reqData.queryParams,
      pathParams: reqData.pathParams,
      body: reqData.body,
      status: 0,
      duration: 0,
      ok: false
    });
    renderHistory();

    document.dispatchEvent(
      new CustomEvent('devkit:response', {
        detail: {
          status: 0,
          statusText: 'Client Execution Error',
          ok: false,
          duration: 0,
          timestamp: new Date().toISOString(),
          headers: {},
          data: { detail: err.message || 'Execution failed' },
          raw: String(err),
          isError: true
        }
      })
    );
  } finally {
    // Reset button state
    if (sendBtn) sendBtn.disabled = false;
    if (sendSpinner) sendSpinner.style.display = 'none';
    if (sendIcon) sendIcon.style.display = 'inline-block';
    if (sendLabel) sendLabel.textContent = 'Send Request';
  }
}

function initRequestBuilder() {
  // Mode switcher tabs
  const tabStructured = document.getElementById('mode-tab-structured');
  const tabRaw = document.getElementById('mode-tab-raw');

  if (tabStructured) tabStructured.addEventListener('click', () => setEditorMode('structured'));
  if (tabRaw) tabRaw.addEventListener('click', () => setEditorMode('raw'));

  // Live input change listeners for all inputs
  const inputsToWatch = [
    'input-add-a',
    'input-add-b',
    'input-wordcount-text',
    'input-greet-name',
    'input-reverse-text'
  ];

  inputsToWatch.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        setValidationAlert(null);
        syncLiveUrlPreview();
        if (id === 'input-wordcount-text') {
          updateWordcountStats(el.value);
        }
      });
    }
  });

  // Raw JSON live validation indicator
  const rawJsonTextarea = document.getElementById('raw-json-body');
  const rawJsonStatus = document.getElementById('raw-json-status');

  if (rawJsonTextarea) {
    rawJsonTextarea.addEventListener('input', () => {
      setValidationAlert(null);
      try {
        JSON.parse(rawJsonTextarea.value);
        if (rawJsonStatus) {
          rawJsonStatus.textContent = 'Valid JSON';
          rawJsonStatus.style.color = 'var(--status-success)';
        }
      } catch {
        if (rawJsonStatus) {
          rawJsonStatus.textContent = 'Invalid JSON';
          rawJsonStatus.style.color = 'var(--status-error)';
        }
      }
    });
  }

  // Send button listener
  const sendBtn = document.getElementById('send-request-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', handleSendRequest);
  }

  // Navigation sidebar endpoint click listeners
  const endpointButtons = document.querySelectorAll('.endpoint-item');
  endpointButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const endpoint = button.getAttribute('data-endpoint');
      if (endpoint) {
        selectEndpoint(endpoint);
      }

      // Close mobile off-canvas nav after selection and return focus to menu button
      if (window.innerWidth <= 768 && isMobileSidebarOpen()) {
        closeMobileSidebar({ restoreFocus: true });
      }
    });
  });

  // Initial state setup
  selectEndpoint('/add');
  updateWordcountStats(document.getElementById('input-wordcount-text')?.value || '');
}

// ============================================================================
// 6. RESPONSE INSPECTOR CONTROLLER (PHASE 4)
// ============================================================================

let lastResponse = null;
let currentRespView = 'formatted'; // 'formatted' | 'raw' | 'headers'

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatBytes(bytes) {
  if (bytes === 0 || !bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = (bytes / 1024).toFixed(1);
  return `${kb} KB`;
}

/**
 * High-performance, HTML-safe syntax highlighter for JSON data.
 */
function formatJsonWithHighlight(data) {
  let jsonString = '';
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      jsonString = JSON.stringify(parsed, null, 2);
    } catch {
      // Plain text response (e.g. from /greet or /reverse)
      return escapeHtml(data);
    }
  } else {
    jsonString = JSON.stringify(data, null, 2);
  }

  const escaped = escapeHtml(jsonString);
  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

function setResponseView(view) {
  if (view !== 'formatted' && view !== 'raw' && view !== 'headers') return;
  currentRespView = view;

  const tabFormatted = document.getElementById('resp-tab-formatted');
  const tabRaw = document.getElementById('resp-tab-raw');
  const tabHeaders = document.getElementById('resp-tab-headers');

  const viewFormatted = document.getElementById('resp-view-formatted');
  const viewRaw = document.getElementById('resp-view-raw');
  const viewHeaders = document.getElementById('resp-view-headers');
  const emptyState = document.getElementById('resp-empty-state');

  // If no response yet, keep empty state visible
  if (!lastResponse) {
    if (emptyState) emptyState.style.display = 'flex';
    if (viewFormatted) viewFormatted.style.display = 'none';
    if (viewRaw) viewRaw.style.display = 'none';
    if (viewHeaders) viewHeaders.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  // Synchronize Tab buttons
  [
    { el: tabFormatted, active: view === 'formatted' },
    { el: tabRaw, active: view === 'raw' },
    { el: tabHeaders, active: view === 'headers' }
  ].forEach(({ el, active }) => {
    if (el) {
      if (active) {
        el.classList.add('active');
        el.setAttribute('aria-selected', 'true');
      } else {
        el.classList.remove('active');
        el.setAttribute('aria-selected', 'false');
      }
    }
  });

  // Synchronize Panels
  if (viewFormatted) viewFormatted.style.display = view === 'formatted' ? 'block' : 'none';
  if (viewRaw) viewRaw.style.display = view === 'raw' ? 'block' : 'none';
  if (viewHeaders) viewHeaders.style.display = view === 'headers' ? 'block' : 'none';
}

function renderResponse(response) {
  lastResponse = response;

  const respPanel = document.getElementById('response-panel');
  const staleBadge = document.getElementById('resp-stale-badge');
  const statusBadge = document.getElementById('resp-status-badge');
  const statusText = document.getElementById('resp-status-text');
  const durationBadge = document.getElementById('resp-duration-badge');
  const sizeBadge = document.getElementById('resp-size-badge');
  const subtitleEl = document.getElementById('response-panel-subtitle');
  const timestampEl = document.getElementById('resp-timestamp-text');
  const formattedContent = document.getElementById('resp-formatted-content');
  const rawContent = document.getElementById('resp-raw-content');
  const headersTbody = document.getElementById('resp-headers-tbody');
  const copyBtn = document.getElementById('copy-response-btn');

  // Remove loading states
  if (respPanel) respPanel.classList.remove('is-loading');
  if (staleBadge) staleBadge.style.display = 'none';

  // Calculate payload byte size
  const rawPayload = response.raw || '';
  const byteSize = new TextEncoder().encode(rawPayload).length;
  const formattedSize = formatBytes(byteSize);

  // Status Badge Class & Text
  if (statusBadge && statusText) {
    statusBadge.className = 'status-badge';
    const status = response.status;

    if (status >= 200 && status < 300) {
      statusBadge.classList.add('status-2xx');
    } else if (status >= 400 && status < 500) {
      statusBadge.classList.add('status-4xx');
    } else if (status >= 500) {
      statusBadge.classList.add('status-5xx');
    } else {
      statusBadge.classList.add('status-0xx');
    }

    statusText.textContent = `${response.status} ${response.statusText}`;
  }

  // Duration & Size Badges
  if (durationBadge) durationBadge.textContent = `${response.duration} ms`;
  if (sizeBadge) sizeBadge.textContent = formattedSize;

  // Header Subtitle
  if (subtitleEl) {
    subtitleEl.textContent = `${response.status} ${response.statusText} • ${response.duration} ms • ${formattedSize}`;
  }

  // Footer Timestamp
  if (timestampEl) {
    const timeStr = response.timestamp ? new Date(response.timestamp).toLocaleTimeString() : 'Just now';
    timestampEl.textContent = timeStr;
  }

  // View 1: Formatted Content
  if (formattedContent) {
    formattedContent.innerHTML = formatJsonWithHighlight(response.data !== undefined ? response.data : rawPayload);
  }

  // View 2: Raw Content
  if (rawContent) {
    rawContent.value = rawPayload;
  }

  // View 3: Headers Table
  if (headersTbody) {
    const entries = Object.entries(response.headers || {});
    if (entries.length > 0) {
      headersTbody.innerHTML = entries
        .map(
          ([k, v]) => `<tr><td class="header-key">${escapeHtml(k)}</td><td class="header-val">${escapeHtml(v)}</td></tr>`
        )
        .join('');
    } else {
      headersTbody.innerHTML = `<tr><td colspan="2" class="text-muted text-center">No headers available (e.g. network/client error)</td></tr>`;
    }
  }

  // Enable Copy Button
  if (copyBtn) {
    copyBtn.disabled = false;
    copyBtn.removeAttribute('aria-disabled');
  }

  // Render current view
  setResponseView(currentRespView);
}

function initResponseInspector() {
  const tabFormatted = document.getElementById('resp-tab-formatted');
  const tabRaw = document.getElementById('resp-tab-raw');
  const tabHeaders = document.getElementById('resp-tab-headers');
  const copyBtn = document.getElementById('copy-response-btn');
  const copyIcon = document.getElementById('copy-btn-icon');
  const copiedIcon = document.getElementById('copied-btn-icon');
  const copyLabel = document.getElementById('copy-btn-label');

  if (tabFormatted) tabFormatted.addEventListener('click', () => setResponseView('formatted'));
  if (tabRaw) tabRaw.addEventListener('click', () => setResponseView('raw'));
  if (tabHeaders) tabHeaders.addEventListener('click', () => setResponseView('headers'));

  // Copy Payload action
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      if (!lastResponse || !lastResponse.raw) return;

      try {
        await navigator.clipboard.writeText(lastResponse.raw);
      } catch {
        // Fallback for non-secure contexts
        const textarea = document.createElement('textarea');
        textarea.value = lastResponse.raw;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      // Visual feedback
      if (copyIcon) copyIcon.style.display = 'none';
      if (copiedIcon) copiedIcon.style.display = 'inline-block';
      if (copyLabel) copyLabel.textContent = 'Copied!';

      setTimeout(() => {
        if (copyIcon) copyIcon.style.display = 'inline-block';
        if (copiedIcon) copiedIcon.style.display = 'none';
        if (copyLabel) copyLabel.textContent = 'Copy Payload';
      }, 2000);
    });
  }

  // Global listener for API responses
  document.addEventListener('devkit:response', (e) => {
    if (e.detail) {
      renderResponse(e.detail);
    }
  });
}

// ============================================================================
// 7. REQUEST HISTORY CONTROLLER (PHASE 5)
// ============================================================================

function formatShortTime(isoString) {
  try {
    const d = new Date(isoString);
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${mins}:${secs}`;
  } catch {
    return '';
  }
}

function renderHistory() {
  const historyList = document.getElementById('history-list');
  const historyEmpty = document.getElementById('history-empty');
  const countBadge = document.getElementById('history-count-badge');
  const clearBtn = document.getElementById('clear-history-btn');

  const items = historyRepo.getAll();
  const count = items.length;

  if (countBadge) {
    countBadge.textContent = `${count}/20`;
    countBadge.setAttribute('aria-label', `History capacity: ${count} of 20`);
  }

  if (count === 0) {
    if (historyEmpty) historyEmpty.style.display = 'flex';
    if (historyList) {
      historyList.style.display = 'none';
      historyList.innerHTML = '';
    }
    if (clearBtn) clearBtn.style.display = 'none';
    return;
  }

  if (historyEmpty) historyEmpty.style.display = 'none';
  if (clearBtn) clearBtn.style.display = 'inline-block';
  if (historyList) {
    historyList.style.display = 'flex';
    historyList.innerHTML = items
      .map((item) => {
        const methodClass = item.method === 'POST' ? 'method-post' : 'method-get';
        let statusDotClass = 'status-0xx';
        if (item.status >= 200 && item.status < 300) statusDotClass = 'status-2xx';
        else if (item.status >= 400 && item.status < 500) statusDotClass = 'status-4xx';
        else if (item.status >= 500) statusDotClass = 'status-5xx';

        const displayStatus = item.status === 0 ? 'ERR' : item.status;
        const timeStr = item.timestamp ? formatShortTime(item.timestamp) : '';

        return `
          <li class="history-item-wrapper">
            <button class="history-item" data-history-id="${escapeHtml(item.id)}" title="Recall request ${escapeHtml(item.displayUrl)}">
              <div class="history-item-top">
                <span class="method-badge ${methodClass}">${escapeHtml(item.method)}</span>
                <span class="history-item-path">${escapeHtml(item.displayUrl)}</span>
              </div>
              <div class="history-item-bottom">
                <span class="history-status-badge">
                  <span class="history-status-dot ${statusDotClass}"></span>
                  <span>${escapeHtml(displayStatus)}</span>
                </span>
                <div class="history-meta-right">
                  <span>${escapeHtml(item.duration)}ms</span>
                  <span>${escapeHtml(timeStr)}</span>
                </div>
              </div>
            </button>
          </li>
        `;
      })
      .join('');

    // Attach click listeners to all history items
    const buttons = historyList.querySelectorAll('.history-item');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-history-id');
        if (id) loadHistoryItem(id);
      });
    });
  }
}

function loadHistoryItem(id) {
  const item = historyRepo.getById(id);
  if (!item) return;

  // 1. Select endpoint
  selectEndpoint(item.endpoint);

  // 2. Populate values based on endpoint
  if (item.endpoint === '/add') {
    const inputA = document.getElementById('input-add-a');
    const inputB = document.getElementById('input-add-b');
    if (inputA && item.queryParams?.a !== undefined) inputA.value = item.queryParams.a;
    if (inputB && item.queryParams?.b !== undefined) inputB.value = item.queryParams.b;
  } else if (item.endpoint === '/wordcount') {
    const inputWord = document.getElementById('input-wordcount-text');
    if (inputWord) {
      inputWord.value = item.body?.text || (typeof item.body === 'string' ? item.body : '');
      updateWordcountStats(inputWord.value);
    }
  } else if (item.endpoint === '/greet') {
    const inputGreet = document.getElementById('input-greet-name');
    if (inputGreet && item.pathParams?.name !== undefined) inputGreet.value = item.pathParams.name;
  } else if (item.endpoint === '/reverse') {
    const inputReverse = document.getElementById('input-reverse-text');
    if (inputReverse && item.pathParams?.text !== undefined) inputReverse.value = item.pathParams.text;
  }

  // Also sync raw JSON editor if there is body
  const rawJson = document.getElementById('raw-json-body');
  if (rawJson && item.body) {
    try {
      rawJson.value = typeof item.body === 'object' ? JSON.stringify(item.body, null, 2) : item.body;
    } catch {
      rawJson.value = String(item.body);
    }
  }

  // Clear validation alert
  setValidationAlert(null);

  // Sync live URL preview
  syncLiveUrlPreview();

  // If mobile nav is open, close it and restore focus
  if (window.innerWidth <= 768 && isMobileSidebarOpen()) {
    closeMobileSidebar({ restoreFocus: true });
  }
}

function initHistory() {
  const clearBtn = document.getElementById('clear-history-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      historyRepo.clear();
      renderHistory();
    });
  }
  renderHistory();
}

// ============================================================================
// 8. DOCUMENTATION DRAWER CONTROLLER (PHASE 6)
// ============================================================================

function handleLoadDocEndpoint(doc) {
  if (!doc) return;

  // 1. Select endpoint
  selectEndpoint(doc.endpoint);

  // 2. Set default sample values
  if (doc.endpoint === '/add') {
    const inputA = document.getElementById('input-add-a');
    const inputB = document.getElementById('input-add-b');
    if (inputA && doc.sampleDefaults.a !== undefined) inputA.value = doc.sampleDefaults.a;
    if (inputB && doc.sampleDefaults.b !== undefined) inputB.value = doc.sampleDefaults.b;
  } else if (doc.endpoint === '/wordcount') {
    const inputWord = document.getElementById('input-wordcount-text');
    if (inputWord && doc.sampleDefaults.text !== undefined) {
      inputWord.value = doc.sampleDefaults.text;
      updateWordcountStats(doc.sampleDefaults.text);
    }
  } else if (doc.endpoint === '/greet') {
    const inputGreet = document.getElementById('input-greet-name');
    if (inputGreet && doc.sampleDefaults.name !== undefined) inputGreet.value = doc.sampleDefaults.name;
  } else if (doc.endpoint === '/reverse') {
    const inputReverse = document.getElementById('input-reverse-text');
    if (inputReverse && doc.sampleDefaults.text !== undefined) inputReverse.value = doc.sampleDefaults.text;
  }

  // 3. Sync raw JSON editor if applicable
  const rawJson = document.getElementById('raw-json-body');
  if (rawJson && doc.endpoint === '/wordcount') {
    rawJson.value = JSON.stringify({ text: doc.sampleDefaults.text }, null, 2);
  }

  setValidationAlert(null);
  syncLiveUrlPreview();

  // 4. Close documentation drawer and restore focus
  closeDocsDrawer({ restoreFocus: true });

  // Focus send button for quick execution
  const sendBtn = document.getElementById('send-request-btn');
  if (sendBtn) {
    sendBtn.focus();
  }
}

function initDocs() {
  const docsContainer = document.getElementById('docs-content');
  if (docsContainer) {
    renderDocs(docsContainer, handleLoadDocEndpoint);
  }
}

// ============================================================================
// 9. HEALTH POLLING & WORKBENCH ERGONOMICS (PHASE 7)
// ============================================================================

let healthPollInterval = null;

async function checkHealthStatus() {
  const indicator = document.getElementById('connection-indicator');
  const dot = indicator?.querySelector('.indicator-dot');
  const label = document.getElementById('connection-status-text');

  try {
    const res = await fetch('/health', { method: 'GET', cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (dot) {
        dot.className = 'indicator-dot dot-connected';
      }
      if (label) {
        label.textContent = 'Online';
      }
      if (indicator) {
        indicator.setAttribute('title', `Connected to DevKit API (${data.version || 'v0.1.0'})`);
        indicator.setAttribute('aria-label', `Backend status: Online, version ${data.version || '0.1.0'}`);
      }
    } else {
      if (dot) {
        dot.className = 'indicator-dot dot-error';
      }
      if (label) {
        label.textContent = 'Degraded';
      }
      if (indicator) {
        indicator.setAttribute('title', `HTTP ${res.status}: Backend service degraded`);
        indicator.setAttribute('aria-label', `Backend status: Degraded (HTTP ${res.status})`);
      }
    }
  } catch {
    if (dot) {
      dot.className = 'indicator-dot dot-error';
    }
    if (label) {
      label.textContent = 'Offline';
    }
    if (indicator) {
      indicator.setAttribute('title', 'Backend service unreachable');
      indicator.setAttribute('aria-label', 'Backend status: Offline (Connection failed)');
    }
  }
}

function initHealthPolling() {
  // Check immediately on startup
  checkHealthStatus();

  // Poll every 15 seconds
  healthPollInterval = setInterval(checkHealthStatus, 15000);

  // Clean up interval before unload
  window.addEventListener('beforeunload', () => {
    if (healthPollInterval) {
      clearInterval(healthPollInterval);
    }
  });
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl + Enter or Cmd + Enter triggers Request execution
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const sendBtn = document.getElementById('send-request-btn');
      if (sendBtn && !sendBtn.disabled) {
        e.preventDefault();
        sendBtn.click();
      }
    }
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initOverlays();
  initRequestBuilder();
  initResponseInspector();
  initHistory();
  initDocs();
  initHealthPolling();
  initKeyboardShortcuts();
});
