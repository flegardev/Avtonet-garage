/**
 * Injects the floating "Save to Garage" button and Smart Advisor panel
 * into avto.net vehicle detail pages.
 */

import { collectVehicleData } from './vehicleParser.js';
import { analyzeVehicle } from './smartAdvisor.js';

let buttonInjected = false;
let advisorInjected = false;
export function resetInjectionState() {
  buttonInjected = false;
  advisorInjected = false;
}

// ─── Save Button ──────────────────────────────────────────────────────────────

export function injectSaveButton() {
  if (buttonInjected || document.getElementById('ag-save-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'ag-save-btn';
  btn.innerHTML = `
    <span class="ag-btn-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17,21 17,13 7,13 7,21"/>
        <polyline points="7,3 7,8 15,8"/>
      </svg>
    </span>
    <span class="ag-btn-label">Shrani v garažo</span>
  `;
  btn.setAttribute('title', 'Shrani to vozilo v AvtoNetGaražo');
  document.body.appendChild(btn);
  buttonInjected = true;

  btn.addEventListener('click', handleSaveClick);
}

async function handleSaveClick() {
  const btn = document.getElementById('ag-save-btn');
  if (!btn || btn.dataset.state === 'saving') return;

  btn.dataset.state = 'saving';
  btn.querySelector('.ag-btn-label').textContent = 'Shranjujem…';

  try {
    const vehicle = collectVehicleData();

    if (!vehicle.title) {
      showToast('Ni bilo mogoče pridobiti podatkov. Poskusite znova naložiti stran.', 'error');
      resetButton(btn);
      return;
    }

    const response = await chrome.runtime.sendMessage({
      type: 'SAVE_VEHICLE',
      payload: vehicle,
    });

    if (response?.ok) {
      btn.dataset.state = 'saved';
      btn.querySelector('.ag-btn-label').textContent = 'Shranjeno!';
      btn.querySelector('.ag-btn-icon').innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      `;
      const shortTitle = vehicle.title.length > 45
        ? vehicle.title.slice(0, 42) + '…'
        : vehicle.title;
      showToast(`"${shortTitle}" shranjeno v garažo.`, 'success');
    } else {
      throw new Error(response?.error ?? 'Neznana napaka');
    }
  } catch (err) {
    console.error('[AvtoNetGaraža] Shranjevanje neuspešno:', err);
    showToast('Shranjevanje ni uspelo. Poskusite znova.', 'error');
    resetButton(btn);
  }
}

function resetButton(btn) {
  btn.dataset.state = '';
  btn.querySelector('.ag-btn-label').textContent = 'Shrani v garažo';
  btn.querySelector('.ag-btn-icon').innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17,21 17,13 7,13 7,21"/>
      <polyline points="7,3 7,8 15,8"/>
    </svg>
  `;
}

// ─── Smart Advisor Panel ──────────────────────────────────────────────────────

export function injectAdvisorPanel() {
  if (advisorInjected || document.getElementById('ag-advisor')) return;

  const vehicle = collectVehicleData();
  if (!vehicle.title) return;

  const analysis = analyzeVehicle(vehicle);
  advisorInjected = true;

  const panel = document.createElement('div');
  panel.id = 'ag-advisor';
  panel.innerHTML = buildAdvisorHTML(analysis);

  // Insert after the main content area or before the contact section
  const insertTarget =
    document.querySelector('.contact-section, .kontakt, #kontakt, .seller-section, .ClassifiedAdContact') ||
    document.querySelector('h1')?.closest('section') ||
    document.querySelector('main') ||
    document.body;

  if (insertTarget && insertTarget !== document.body) {
    insertTarget.parentNode.insertBefore(panel, insertTarget);
  } else {
    document.body.appendChild(panel);
  }

  const header = panel.querySelector('.ag-advisor-header');
  const togglePanel = () => {
    panel.classList.toggle('ag-advisor--collapsed');
    const expanded = !panel.classList.contains('ag-advisor--collapsed');
    header.setAttribute('aria-expanded', String(expanded));
    panel.querySelector('.ag-collapse-btn')?.setAttribute('aria-expanded', String(expanded));
  };

  header.addEventListener('click', togglePanel);
  header.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    togglePanel();
  });
}

function buildAdvisorHTML(analysis) {
  const { score, positives, warnings, redFlags, recommendation, priceVerdict } = analysis;

  const recConfig = {
    low_risk:  { label: 'Nižje zaznano tveganje', color: '#22c55e', icon: '✓' },
    inspect:   { label: 'Preverite podrobnosti', color: '#f59e0b', icon: '!' },
    high_risk: { label: 'Višje zaznano tveganje',  color: '#ef4444', icon: '✕' },
  }[recommendation];

  const scoreColor =
    score >= 62 ? '#22c55e' : score >= 38 ? '#f59e0b' : '#ef4444';

  const RADIUS = 15.9;
  const CIRCUMFERENCE = +(2 * Math.PI * RADIUS).toFixed(2); // ≈ 99.90
  const dashOffset = +(CIRCUMFERENCE * (1 - score / 100)).toFixed(2);

  const listItems = (items, cls) =>
    items.length
      ? items.map((i) => `<li class="ag-advisor-item ${cls}" title="${escHtml(i.detail)}"><span class="ag-item-dot"></span>${escHtml(i.label)}</li>`).join('')
      : '';

  return `
    <div class="ag-advisor-header" role="button" tabindex="0" aria-expanded="true">
      <div class="ag-advisor-logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>AvtoNetGaraža Pametni Svetovalec</span>
      </div>
      <div class="ag-advisor-rec" style="background:${recConfig.color}20;border-color:${recConfig.color}40;color:${recConfig.color}">
        <span>${recConfig.icon}</span> ${recConfig.label}
      </div>
      <div class="ag-advisor-score" style="--score-color:${scoreColor}">
        <svg class="ag-score-ring" viewBox="0 0 36 36">
          <circle class="ag-ring-bg" cx="18" cy="18" r="${RADIUS}"/>
          <circle class="ag-ring-fill" cx="18" cy="18" r="${RADIUS}"
            style="stroke-dasharray:${CIRCUMFERENCE};stroke-dashoffset:${dashOffset};stroke:${scoreColor}"/>
        </svg>
        <span class="ag-score-num">${score}</span>
      </div>
      <button class="ag-collapse-btn" type="button" aria-label="Prikaži ali skrij pametni svetovalec" aria-expanded="true">▾</button>
    </div>

    <div class="ag-advisor-body">
      ${priceVerdict ? `
        <div class="ag-price-verdict">
          <span class="ag-pv-label">Cenovni signal:</span>
          <span class="ag-pv-value">${escHtml(priceVerdict.verdict)}</span>
          <span class="ag-pv-conf">(${priceVerdict.confidence}% zanesljivost)</span>
          <p class="ag-pv-explain">${escHtml(priceVerdict.explanation)}</p>
        </div>` : ''}

      <div class="ag-advisor-cols">
        ${positives.length ? `
          <div class="ag-col ag-col--pos">
            <h4 class="ag-col-title ag-col-title--pos">✓ Prednosti (${positives.length})</h4>
            <ul class="ag-advisor-list">${listItems(positives, 'ag-item--pos')}</ul>
          </div>` : ''}

        ${warnings.length ? `
          <div class="ag-col ag-col--warn">
            <h4 class="ag-col-title ag-col-title--warn">⚠ Opozorila (${warnings.length})</h4>
            <ul class="ag-advisor-list">${listItems(warnings, 'ag-item--warn')}</ul>
          </div>` : ''}

        ${redFlags.length ? `
          <div class="ag-col ag-col--red">
            <h4 class="ag-col-title ag-col-title--red">✕ Tveganja (${redFlags.length})</h4>
            <ul class="ag-advisor-list">${listItems(redFlags, 'ag-item--red')}</ul>
          </div>` : ''}
      </div>

      <div class="ag-advisor-footer">
        Zagotavlja <strong>AvtoNetGaraža</strong> · Signali so okvirni — vedno preverite vozilo osebno.
      </div>
    </div>
  `;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(message, type = 'info') {
  const existing = document.getElementById('ag-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'ag-toast';
  toast.className = `ag-toast ag-toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('ag-toast--visible'));
  setTimeout(() => {
    toast.classList.remove('ag-toast--visible');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

function escHtml(str) {
  return (str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
