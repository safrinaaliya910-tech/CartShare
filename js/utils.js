export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatCurrency(paise) {
  const p = Number(paise);
  if (!isFinite(p) || isNaN(p)) return '₹0';
  const rupees = p / 100;
  const hasPaise = p % 100 !== 0;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0
  }).format(rupees);
}

export function rupeesToPaise(rupees) {
  const r = parseFloat(rupees);
  if (!isFinite(r) || isNaN(r) || r < 0) return 0;
  return Math.round(r * 100);
}

export function paiseToRupees(paise) {
  const p = parseInt(paise, 10);
  if (!isFinite(p) || isNaN(p) || p < 0) return 0;
  return Math.round(p / 100);
}

export function relativeTime(timestamp) {
  if (!timestamp) return 'just now';

  let date;

  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    return 'just now';
  }

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 30) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function debounce(func, wait = 200) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');

  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(container);
  }

  const typeClass = type === 'success'
    ? 'toast-sage'
    : (type === 'error' ? 'toast-burgundy' : '');

  const icon = type === 'success'
    ? '<i class="bi bi-check-circle-fill text-success me-2"></i>'
    : (type === 'error'
      ? '<i class="bi bi-exclamation-octagon-fill text-danger me-2"></i>'
      : '<i class="bi bi-info-circle-fill text-primary me-2"></i>');

  const toastEl = document.createElement('div');
  toastEl.className = `toast market-toast ${typeClass} show`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');

  toastEl.innerHTML = `
    <div class="toast-body d-flex align-items-center justify-content-between p-3">
      <div class="d-flex align-items-center">
        ${icon}
        <span>${escapeHtml(message)}</span>
      </div>
      <button type="button" class="btn-close ms-2" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  container.appendChild(toastEl);

  setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => toastEl.remove(), 300);
  }, 3800);

  const closeBtn = toastEl.querySelector('.btn-close');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.remove(), 200);
    });
  }
}

export function getParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

export function normalizeRoomCode(code) {
  if (!code) return '';

  let clean = code.trim().toUpperCase();

  if (!clean.startsWith('CS-') && clean.length === 4) {
    clean = 'CS-' + clean;
  }

  return clean;
}

export function getInitials(name) {
  if (!name) return '??';

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getAvatarColor(uid) {
  const palette = [
    '#722F37',
    '#6F8460',
    '#8C5E3C',
    '#4E1F25',
    '#3D6B5E',
    '#7F5539',
    '#5C6B73'
  ];

  if (!uid) return palette[0];

  let hash = 0;

  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % palette.length;
  return palette[index];
}