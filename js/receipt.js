

import { escapeHtml, formatCurrency } from './utils.js';
import { calculateLedger } from './ledger.js';

/**
 
 * @param {HTMLElement} containerEl 
 * @param {Object} room 
 * @param {Array<any>} items 
 * @param {Array<any>} members 
 */
export function renderReceipt(containerEl, room = {}, items = [], members = []) {
  if (!containerEl) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const subtotalPaise = items.reduce((sum, item) => {
    return sum + ((item.totalQty || 0) * (item.unitPrice || 0));
  }, 0);

  const thresholdPaise = room.threshold || 0;
  const deliveryChargePaise = room.deliveryCharge || 0;

  
  let appliedDeliveryPaise = 0;
  let deliveryLabel = "₹0 (Not applicable)";

  if (thresholdPaise > 0) {
    if (subtotalPaise >= thresholdPaise) {
      appliedDeliveryPaise = 0;
      deliveryLabel = "₹0 (target reached)";
    } else if (subtotalPaise > 0) {
      appliedDeliveryPaise = deliveryChargePaise;
      deliveryLabel = formatCurrency(deliveryChargePaise);
    } else {
      deliveryLabel = "₹0 (Empty cart)";
    }
  } else {
    deliveryLabel = "₹0 (No target configured)";
  }

  const finalTotalPaise = subtotalPaise + appliedDeliveryPaise;
  const ledger = calculateLedger(items, members);

  
  let itemsTableRows = '';
  if (items.length === 0) {
    itemsTableRows = `
      <tr>
        <td colspan="4" class="text-center py-4 text-muted">
          No items in the basket yet.
        </td>
      </tr>
    `;
  } else {
    itemsTableRows = items.map((item, index) => {
      const lineTotal = (item.totalQty || 0) * (item.unitPrice || 0);
      const idx = String(index + 1).padStart(2, '0');
      return `
        <tr>
          <td>
            <span class="text-muted font-mono me-1" style="font-size:0.75rem;">${idx}</span>
            <strong>${escapeHtml(item.name)}</strong>
            ${item.unit ? `<small class="text-muted d-block font-mono">${escapeHtml(item.unit)}</small>` : ''}
          </td>
          <td class="text-end font-mono">${formatCurrency(item.unitPrice)}</td>
          <td class="text-center font-mono">${item.totalQty}</td>
          <td class="text-end font-mono font-weight-bold">${formatCurrency(lineTotal)}</td>
        </tr>
      `;
    }).join('');
  }

  
  const ledgerBreakdownRows = ledger.members.map(m => {
    return `
      <div class="d-flex justify-content-between py-1" style="font-size:0.82rem;">
        <span>${escapeHtml(m.name)} (${m.totalQty} items)</span>
        <span class="font-mono">${formatCurrency(m.totalPaise)} (${m.percentage}%)</span>
      </div>
    `;
  }).join('');

  containerEl.innerHTML = `
    <div class="receipt-sheet" id="receiptSheet">
      <div class="receipt-header">
        <div class="receipt-title font-display">CartShare</div>
        <div class="stamp-badge mb-2">Shopping Summary</div>
        <div class="receipt-meta font-mono">Room: <strong>${escapeHtml(room.name || 'Market Room')}</strong> · Code: <strong>${escapeHtml(room.code || 'CS-XXXX')}</strong></div>
        <div class="receipt-meta font-mono">${dateStr} · ${timeStr}</div>
      </div>

      <table class="receipt-table font-mono">
        <thead>
          <tr>
            <th style="width: 50%;">Item</th>
            <th class="text-end" style="width: 18%;">Unit</th>
            <th class="text-center" style="width: 12%;">Qty</th>
            <th class="text-end" style="width: 20%;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsTableRows}
        </tbody>
      </table>

      <div class="receipt-summary-lines font-mono">
        <div class="receipt-summary-line">
          <span>Items Subtotal:</span>
          <span>${formatCurrency(subtotalPaise)}</span>
        </div>
        <div class="receipt-summary-line">
          <span>Delivery Contribution:</span>
          <span>${deliveryLabel}</span>
        </div>
        <div class="receipt-summary-line receipt-total-line">
          <span>GROUP TOTAL:</span>
          <span class="text-burgundy-dark">${formatCurrency(finalTotalPaise)}</span>
        </div>
      </div>

      <!-- Fair Share breakdown section -->
      <div class="mt-3 pt-2 border-top border-dashed">
        <div class="fw-bold text-uppercase font-mono mb-1" style="font-size:0.75rem; letter-spacing:0.05em;">
          Individual Contribution Breakdown:
        </div>
        ${ledgerBreakdownRows}
        <div class="text-muted mt-2 font-mono" style="font-size:0.7rem; font-style:italic;">
          * Contribution values only, not amounts owed.
        </div>
      </div>

      <div class="receipt-disclaimer font-mono">
        This is a shopping summary, not a tax invoice or proof of payment.<br>
        CartShare — The Market, Together.
      </div>

      <div class="receipt-actions d-flex justify-content-end gap-2 mt-4">
        <button type="button" class="btn btn-outline-dark btn-sm font-mono" data-bs-dismiss="modal">
          Close
        </button>
        <button type="button" class="btn btn-burgundy btn-sm font-mono" id="printReceiptBtn">
          <i class="bi bi-printer me-1"></i> Print / Save PDF
        </button>
      </div>
    </div>
  `;

  
  const printBtn = containerEl.querySelector('#printReceiptBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}
