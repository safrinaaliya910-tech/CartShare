/**
 * @file activity.js
 * @description Activity feed renderer for room interactions and real-time ledger events.
 */

import { escapeHtml, relativeTime, getAvatarColor, getInitials } from './utils.js';

/**
 * Formats an activity entry into human-readable action text
 * @param {Object} act 
 * @returns {string}
 */
export function formatActivityText(act) {
  const actor = `<strong>${escapeHtml(act.actorName || 'Shopper')}</strong>`;
  const product = act.productName ? `<em>${escapeHtml(act.productName)}</em>` : '';

  switch (act.type) {
    case 'add':
      return `${actor} added ${product} to the basket`;
    case 'increase':
      return `${actor} increased ${product} (now ${act.qty})`;
    case 'decrease':
      return `${actor} decreased ${product} (now ${act.qty})`;
    case 'remove':
      return `${actor} removed ${product}`;
    case 'join':
      return `${actor} joined the market room`;
    case 'leave':
      return `${actor} left the room`;
    case 'create':
      return `${actor} opened this market room`;
    case 'close':
      return `${actor} closed the market room`;
    default:
      return `${actor} updated the basket`;
  }
}

/**
 * Renders activity entries into container
 * @param {HTMLElement} containerEl 
 * @param {Array<any>} activities 
 */
export function renderActivityFeed(containerEl, activities = []) {
  if (!containerEl) return;

  if (activities.length === 0) {
    containerEl.innerHTML = `
      <div class="text-center py-3 text-concrete small">
        <i class="bi bi-clock-history d-block mb-1 fs-5"></i>
        <span>No recent activity yet.</span>
      </div>
    `;
    return;
  }

  const listItems = activities.map(act => {
    const timeStr = relativeTime(act.createdAt);
    const color = getAvatarColor(act.actorUid);
    const initials = getInitials(act.actorName || 'S');

    return `
      <li class="activity-item">
        <span class="avatar-circle flex-shrink-0" style="background-color: ${color}; width: 22px; height: 22px; font-size: 0.65rem;">
          ${initials}
        </span>
        <div class="flex-grow-1 text-ink">
          ${formatActivityText(act)}
        </div>
        <span class="activity-time flex-shrink-0 ms-2">${timeStr}</span>
      </li>
    `;
  }).join('');

  containerEl.innerHTML = `
    <ul class="activity-stream">
      ${listItems}
    </ul>
  `;
}
