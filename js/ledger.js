/**
 * @file ledger.js
 * @description Fair Share Ledger — calculates and displays each member's contributions
 * to the shared basket, percentage breakdown, and mathematical reconciliation.
 */

import { escapeHtml, formatCurrency, getAvatarColor, getInitials } from './utils.js';

/**
 * Computes individual member contributions from live items snapshot
 * @param {Array<any>} items 
 * @param {Array<any>} members 
 * @returns {Object}
 */
export function calculateLedger(items = [], members = []) {
  const memberMap = new Map();

  // Populate known members first
  members.forEach(m => {
    memberMap.set(m.id || m.uid, {
      uid: m.id || m.uid,
      name: m.displayName || 'Shopper',
      role: m.role || 'member',
      totalQty: 0,
      totalPaise: 0,
      percentage: 0
    });
  });

  let groupSubtotalPaise = 0;
  let groupItemCount = 0;

  // Aggregate contributions across items
  items.forEach(item => {
    const unitPrice = item.unitPrice || 0;
    const contributions = item.contributions || {};
    const names = item.contributorNames || {};

    Object.entries(contributions).forEach(([uid, qty]) => {
      const q = parseInt(qty, 10) || 0;
      if (q > 0) {
        if (!memberMap.has(uid)) {
          memberMap.set(uid, {
            uid: uid,
            name: names[uid] || 'Shopper',
            role: 'member',
            totalQty: 0,
            totalPaise: 0,
            percentage: 0
          });
        }
        const record = memberMap.get(uid);
        record.totalQty += q;
        record.totalPaise += q * unitPrice;

        groupSubtotalPaise += q * unitPrice;
        groupItemCount += q;
      }
    });
  });

  // Calculate percentage shares
  const memberList = Array.from(memberMap.values()).map(m => {
    m.percentage = groupSubtotalPaise > 0
      ? Math.round((m.totalPaise / groupSubtotalPaise) * 100)
      : 0;
    return m;
  }).sort((a, b) => b.totalPaise - a.totalPaise);

  // Reconcile and assert that member sum equals group subtotal
  const reconciledSum = memberList.reduce((acc, m) => acc + m.totalPaise, 0);
  if (reconciledSum !== groupSubtotalPaise) {
    console.warn(`Ledger reconciliation mismatch: member sum (${reconciledSum}) != group subtotal (${groupSubtotalPaise})`);
  }

  return {
    groupSubtotalPaise,
    groupItemCount,
    members: memberList,
    reconciled: reconciledSum === groupSubtotalPaise
  };
}

/**
 * Renders Fair Share Ledger into container
 * @param {HTMLElement} containerEl 
 * @param {Array<any>} items 
 * @param {Array<any>} members 
 */
export function renderFairShareLedger(containerEl, items = [], members = []) {
  if (!containerEl) return;

  const ledger = calculateLedger(items, members);

  if (ledger.members.length === 0) {
    containerEl.innerHTML = `
      <div class="paper-surface p-3 text-center">
        <p class="text-concrete small mb-0">No active members in this room.</p>
      </div>
    `;
    return;
  }

  const rowsHtml = ledger.members.map(m => {
    const color = getAvatarColor(m.uid);
    const initials = getInitials(m.name);

    return `
      <tr>
        <td>
          <div class="d-flex align-items-center gap-2">
            <span class="avatar-circle" style="background-color: ${color};">${initials}</span>
            <div class="text-truncate" style="max-width: 110px;">
              <span class="d-block text-truncate fw-semibold text-ink">${escapeHtml(m.name)}</span>
              ${m.role === 'owner' ? '<span class="badge bg-light text-burgundy border p-1" style="font-size:0.65rem;">HOST</span>' : ''}
            </div>
          </div>
        </td>
        <td class="text-center font-mono">${m.totalQty}</td>
        <td class="text-end">
          <div class="font-mono fw-bold text-burgundy-dark">${formatCurrency(m.totalPaise)}</div>
          <div class="small text-concrete font-mono">${m.percentage}%</div>
          <div class="share-bar-container">
            <div class="share-bar-fill" style="width: ${m.percentage}%; background-color: ${color};"></div>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  containerEl.innerHTML = `
    <div class="paper-surface p-3 mt-3">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <span class="form-label-custom mb-0"><i class="bi bi-pie-chart me-1 text-burgundy"></i> Fair Share Ledger</span>
        <span class="font-mono small text-concrete">${ledger.members.length} Shopper${ledger.members.length === 1 ? '' : 's'}</span>
      </div>

      <table class="ledger-table">
        <thead>
          <tr>
            <th>Member</th>
            <th class="text-center">Items</th>
            <th class="text-end">Share</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr style="border-top: 1.5px solid var(--latte);">
            <td class="fw-bold font-mono">Total</td>
            <td class="text-center font-mono fw-bold">${ledger.groupItemCount}</td>
            <td class="text-end font-mono fw-bold text-burgundy-dark">${formatCurrency(ledger.groupSubtotalPaise)}</td>
          </tr>
        </tfoot>
      </table>

      <div class="text-center mt-2 pt-2 border-top border-dashed">
        <span class="text-concrete" style="font-size: 0.72rem;">
          <i class="bi bi-info-circle me-1"></i>
          Value of items each member added. This is not an amount owed.
        </span>
      </div>
    </div>
  `;
}
