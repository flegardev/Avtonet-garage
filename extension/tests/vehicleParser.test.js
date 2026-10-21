// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { isDetailPage } from '../src/content/vehicleParser.js';

describe('isDetailPage', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/search');
    document.body.innerHTML = '';
  });

  it('does not treat search results with prices as a detail page', () => {
    document.body.innerHTML = `
      <main>
        <h1>Rabljena vozila</h1>
        <article>
          <img src="https://example.test/car.jpg" alt="Vozilo">
          <strong>14.900 €</strong>
        </article>
      </main>
    `;

    expect(isDetailPage()).toBe(false);
  });

  it('allows non-standard detail pages when seller context is present', () => {
    document.body.innerHTML = `
      <main>
        <h1>Volkswagen Golf 1.5 TSI</h1>
        <img src="https://example.test/car.jpg" alt="Volkswagen Golf">
        <div class="price">14.900 €</div>
        <section class="contact-section">Prodajalec</section>
      </main>
    `;

    expect(isDetailPage()).toBe(true);
  });
});
