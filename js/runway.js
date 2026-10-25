import { escapeHtml, formatCurrency } from './utils.js';
import { PRODUCTS } from './products.js';

export function calculateRunwayData(subtotalPaise, thresholdPaise, cartItems = []) {
  if (!thresholdPaise || thresholdPaise <= 0) {
    return {
      hasTarget: false,
      percentage: 100,
      remainingPaise: 0,
      isReached: true,
      suggestions: []
    };
  }

  const subtotal = Math.max(0, subtotalPaise || 0);
  const remainingPaise = Math.max(0, thresholdPaise - subtotal);
  const isReached = subtotal >= thresholdPaise;
  const percentage = Math.min(100, Math.round((subtotal / thresholdPaise) * 100));

  const cartCategories = new Set(cartItems.map(i => i.category));

  let suggestions = [];
  if (remainingPaise > 0) {
    suggestions = PRODUCTS
      .filter(p => p.priceInPaise <= remainingPaise)
      .sort((a, b) => {
        const aNewCat = !cartCategories.has(a.category);
        const bNewCat = !cartCategories.has(b.category);
        if (aNewCat && !bNewCat) return -1;
        if (!aNewCat && bNewCat) return 1;
        return b.priceInPaise - a.priceInPaise;
      })
      .slice(0, 3);
  }

  return {
    hasTarget: true,
    percentage,
    remainingPaise,
    isReached,
    suggestions
  };
}

export function renderDeliveryRunway(containerEl, subtotalPaise, thresholdPaise, cartItems = [], onAddSuggestion) {
  if (!containerEl) return;

  const runway = calculateRunwayData(subtotalPaise, thresholdPaise, cartItems);

  if (!runway.hasTarget) {
    containerEl.innerHTML = `
      <div class="runway-card">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="form-label-custom mb-0"><i class="bi bi-geo-alt me-1"></i> Delivery Runway</span>
          <span class="stamp-badge">No Target Set</span>
        </div>
        <p class="text-concrete small mb-0">This room has no target threshold configured.</p>
      </div>
    `;
    return;
  }

  const statusLabel = runway.isReached
    ? `<span class="stamp-badge stamp-sage"><i class="bi bi-check2-circle"></i> Target Reached</span>`
    : `<span class="font-mono small text-burgundy-dark font-weight-bold">${formatCurrency(runway.remainingPaise)} to go</span>`;

  const statusMessage = runway.isReached
    ? `You've reached the ${formatCurrency(thresholdPaise)} target.`
    : `${formatCurrency(runway.remainingPaise)} more to reach the delivery target.`;

  let suggestionsHtml = '';
  if (runway.suggestions.length > 0 && !runway.isReached) {
    suggestionsHtml = `
      <div class="runway-suggestions">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <span class="text-concrete small font-mono text-uppercase" style="font-size:0.7rem;">Fits the remaining gap:</span>
        </div>
        <div class="d-flex flex-wrap gap-1">
          ${runway.suggestions.map(item => `
            <div class="gap-suggestion-chip">
              <span>${escapeHtml(item.name)}</span>
              <span class="font-mono text-burgundy font-weight-bold">${formatCurrency(item.priceInPaise)}</span>
              <button type="button" class="btn btn-sm btn-burgundy btn-sm-custom ms-1 add-suggestion-btn" data-product-id="${item.id}" title="Add to shared cart">
                + Add
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  containerEl.innerHTML = `
    <div class="runway-card">
      <div class="d-flex align-items-center justify-content-between mb-1">
        <span class="form-label-custom mb-0"><i class="bi bi-bicycle me-1 text-burgundy"></i> Delivery Runway</span>
        ${statusLabel}
      </div>
      <div class="d-flex justify-content-between small text-concrete font-mono">
        <span>Current: <strong class="text-ink">${formatCurrency(subtotalPaise)}</strong></span>
        <span>Target: <strong class="text-burgundy-dark">${formatCurrency(thresholdPaise)}</strong></span>
      </div>

      <div class="runway-track-wrap" role="progressbar" aria-valuenow="${runway.percentage}" aria-valuemin="0" aria-valuemax="100" aria-label="Delivery threshold progress">
        <div class="runway-fill ${runway.isReached ? 'completed' : ''}" style="width: ${runway.percentage}%"></div>
        <div class="runway-marker" style="left: ${runway.percentage}%" title="Current progress: ${runway.percentage}%">
          <i class="bi bi-basket2"></i>
        </div>

        <span class="runway-tick-line" style="left: 25%"></span>
        <span class="runway-tick" style="left: 25%">25%</span>
        <span class="runway-tick-line" style="left: 50%"></span>
        <span class="runway-tick" style="left: 50%">50%</span>
        <span class="runway-tick-line" style="left: 75%"></span>
        <span class="runway-tick" style="left: 75%">75%</span>
        <span class="runway-tick-line" style="left: 100%"></span>
        <span class="runway-tick" style="left: 100%"><i class="bi bi-flag-fill text-burgundy"></i></span>
      </div>

      <p class="small text-ink mt-3 mb-0">${statusMessage}</p>
      ${suggestionsHtml}
    </div>
  `;

  if (onAddSuggestion) {
    const buttons = containerEl.querySelectorAll('.add-suggestion-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const pId = btn.getAttribute('data-product-id');
        const prod = PRODUCTS.find(p => p.id === pId);
        if (prod) onAddSuggestion(prod);
      });
    });
  }
}