import { auth, db, isConfigured } from './firebase-config.js';
import { requireAuth, logoutUser } from './auth.js';
import { createRoom, joinRoomByCode } from './rooms.js';
import { escapeHtml, formatCurrency, relativeTime, showToast } from './utils.js';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let roomDocListeners = new Map();
let userRoomsUnsub = null;

export async function initDashboard() {
  const user = await requireAuth();
  if (!user) return;

  const greetingEl = document.getElementById('userGreeting');
  if (greetingEl) {
    const hour = new Date().getHours();
    let timeOfDay = 'Good morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'Good afternoon';
    else if (hour >= 17) timeOfDay = 'Good evening';

    greetingEl.textContent = `${timeOfDay}, ${user.displayName || 'Market Shopper'}`;
  }

  const logoutBtns = document.querySelectorAll('.logout-btn');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      cleanupDashboardListeners();
      await logoutUser();
    });
  });

  setupCreateRoomModal();

  setupQuickJoinForm();

  subscribeUserRooms(user.uid);
}

function subscribeUserRooms(uid) {
  if (!isConfigured()) return;

  const roomsListEl = document.getElementById('roomsListContainer');
  const emptyStateEl = document.getElementById('roomsEmptyState');

  const q = query(
    collection(db, `users/${uid}/rooms`),
    orderBy("lastOpenedAt", "desc")
  );

  userRoomsUnsub = onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      if (roomsListEl) roomsListEl.innerHTML = '';
      if (emptyStateEl) emptyStateEl.classList.remove('d-none');
      cleanupRoomDocListeners();
      return;
    }

    if (emptyStateEl) emptyStateEl.classList.add('d-none');

    const userRooms = [];
    snapshot.forEach((docSnap) => {
      userRooms.push({ id: docSnap.id, ...docSnap.data() });
    });

    renderRoomsSkeleton(roomsListEl, userRooms);

    userRooms.forEach(room => {
      if (!roomDocListeners.has(room.id)) {
        const rUnsub = onSnapshot(doc(db, "rooms", room.id), (rSnap) => {
          if (rSnap.exists()) {
            updateRoomListItem(room.id, rSnap.data());
          }
        }, (err) => {
          console.warn(`Could not sync room ${room.id}:`, err);
        });

        roomDocListeners.set(room.id, rUnsub);
      }
    });
  }, (err) => {
    console.error("Error listening to user rooms:", err);
  });
}

function renderRoomsSkeleton(container, rooms) {
  if (!container) return;

  container.innerHTML = rooms.map(room => `
    <div class="paper-card p-3 mb-3 room-ledger-card" id="room-card-${room.id}">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <h4 class="font-display mb-0 text-burgundy-dark">${escapeHtml(room.name || 'Market Room')}</h4>
            <span class="stamp-badge" id="badge-status-${room.id}">OPEN</span>
            ${room.role === 'owner' ? '<span class="badge bg-light text-burgundy border p-1" style="font-size:0.65rem;">HOST</span>' : ''}
          </div>
          <div class="font-mono text-concrete small">
            <span>Code: <strong class="text-ink">${escapeHtml(room.code)}</strong></span>
            <span class="mx-2">·</span>
            <span id="meta-members-${room.id}">1 member</span>
            <span class="mx-2">·</span>
            <span>Opened ${relativeTime(room.lastOpenedAt)}</span>
          </div>
        </div>

        <div class="d-flex align-items-center gap-3">
          <div class="text-end">
            <div class="small text-concrete font-mono text-uppercase">Basket Subtotal</div>
            <div class="font-mono fw-bold fs-5 text-burgundy-dark" id="val-subtotal-${room.id}">₹0</div>
          </div>
          <a href="room.html?room=${room.id}" class="btn btn-burgundy btn-sm enter-room-btn" data-room-id="${room.id}">
            Resume <i class="bi bi-arrow-right ms-1"></i>
          </a>
        </div>
      </div>
    </div>
  `).join('');

  const enterBtns = container.querySelectorAll('.enter-room-btn');

  enterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const rId = btn.getAttribute('data-room-id');

      if (rId && auth.currentUser) {
        updateDoc(doc(db, `users/${auth.currentUser.uid}/rooms`, rId), {
          lastOpenedAt: serverTimestamp()
        }).catch(() => {});
      }
    });
  });
}

function updateRoomListItem(roomId, roomData) {
  const subtotalEl = document.getElementById(`val-subtotal-${roomId}`);
  const membersEl = document.getElementById(`meta-members-${roomId}`);
  const statusEl = document.getElementById(`badge-status-${roomId}`);

  if (subtotalEl) {
    subtotalEl.textContent = formatCurrency(roomData.subtotal || 0);
  }

  if (membersEl) {
    const count = roomData.memberCount || 1;
    membersEl.textContent = `${count} member${count === 1 ? '' : 's'}`;
  }

  if (statusEl) {
    if (roomData.status === 'closed') {
      statusEl.className = 'stamp-badge stamp-closed';
      statusEl.textContent = 'CLOSED';
    } else {
      statusEl.className = 'stamp-badge stamp-sage';
      statusEl.textContent = 'OPEN';
    }
  }
}

function setupCreateRoomModal() {
  const form = document.getElementById('createRoomForm');
  if (!form) return;

  const submitBtn = document.getElementById('createRoomSubmitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('roomNameInput');
    const thresholdInput = document.getElementById('deliveryThresholdInput');
    const errorEl = document.getElementById('createRoomError');

    const name = nameInput.value.trim();
    const thresholdRupees = parseFloat(thresholdInput.value) || 0;

    if (name.length < 3 || name.length > 40) {
      if (errorEl) {
        errorEl.textContent = "Room name must be between 3 and 40 characters.";
        errorEl.classList.remove('d-none');
      }
      return;
    }

    if (thresholdRupees < 0 || thresholdRupees > 100000) {
      if (errorEl) {
        errorEl.textContent = "Delivery target must be between ₹0 and ₹1,00,000.";
        errorEl.classList.remove('d-none');
      }
      return;
    }

    try {
      if (errorEl) errorEl.classList.add('d-none');

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Creating...`;

      const newRoomId = await createRoom(name, thresholdRupees);
      showToast("Room opened successfully!", "success");

      window.location.href = `room.html?room=${newRoomId}&new=1`;
    } catch (err) {
      console.error("Create room failed:", err);

      if (errorEl) {
        errorEl.textContent = err.message || "Failed to create room.";
        errorEl.classList.remove('d-none');
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Open Market Room`;
    }
  });
}

function setupQuickJoinForm() {
  const form = document.getElementById('quickJoinForm');
  if (!form) return;

  const input = document.getElementById('quickJoinCodeInput');
  const btn = document.getElementById('quickJoinBtn');
  const errorEl = document.getElementById('quickJoinError');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const rawCode = input.value.trim();

    try {
      if (errorEl) errorEl.classList.add('d-none');

      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Entering...`;

      const roomId = await joinRoomByCode(rawCode);
      showToast("Joined room successfully!", "success");

      window.location.href = `room.html?room=${roomId}`;
    } catch (err) {
      console.error("Join room failed:", err);

      if (errorEl) {
        errorEl.textContent = err.message || "Unable to join room.";
        errorEl.classList.remove('d-none');
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<span>Enter Room <i class="bi bi-arrow-right ms-1"></i></span>`;
    }
  });
}

function cleanupRoomDocListeners() {
  roomDocListeners.forEach(unsub => unsub());
  roomDocListeners.clear();
}

export function cleanupDashboardListeners() {
  if (userRoomsUnsub) userRoomsUnsub();
  cleanupRoomDocListeners();
}