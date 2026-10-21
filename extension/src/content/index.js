import { isDetailPage } from './vehicleParser.js';
import { injectSaveButton, injectAdvisorPanel, resetInjectionState } from './saveButton.js';
import './content.css';

// ─── Injection logic ──────────────────────────────────────────────────────────

function tryInject() {
  if (!isDetailPage()) return;
  injectSaveButton();
  injectAdvisorPanel();
}

// Wait for the DOM to settle (avto.net may render parts dynamically)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', tryInject);
} else {
  tryInject();
}

// MutationObserver for SPA-style navigation (if avto.net ever goes that route)
let debounceTimer;
let lastUrl = window.location.href;

const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const currentUrl = window.location.href;

    if (currentUrl !== lastUrl) {
      resetInjectionState();
      lastUrl = currentUrl;
    }

    if (isDetailPage()) {
      injectSaveButton();
      injectAdvisorPanel();
    }
  }, 600);
});

if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
}

// Re-check on history navigation (back/forward)
window.addEventListener('popstate', () => {
  resetInjectionState();
  lastUrl = window.location.href;
  setTimeout(tryInject, 800);
});
