import { db, auth, isConfigured } from './firebase-config.js';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let activeUnsubscribers = [];
let prevItemVersions = new Map();

export function registerUnsubscribe(unsub) {
  if (typeof unsub === 'function') {
    activeUnsubscribers.push(unsub);
  }
}

export function cleanupListeners() {
  while (activeUnsubscribers.length > 0) {
    const unsub = activeUnsubscribers.pop();
    try {
      unsub();
    } catch (err) {
      console.warn("Error unsubscribing listener:", err);
    }
  }
  prevItemVersions.clear();
}

export function subscribeToRoom(roomId, {
  onRoomUpdate,
  onMembersUpdate,
  onItemsUpdate,
  onActivityUpdate,
  onError
}) {
  if (!isConfigured() || !roomId) return;

  const roomRef = doc(db, "rooms", roomId);
  const roomUnsub = onSnapshot(roomRef, (snapshot) => {
    if (!snapshot.exists()) {
      if (onError) onError({ code: 'room-not-found', message: 'Room has been removed.' });
      return;
    }
    const data = { id: snapshot.id, ...snapshot.data() };
    if (onRoomUpdate) onRoomUpdate(data);
  }, (err) => {
    console.error("Room sync error:", err);
    if (onError) onError(err);
  });
  registerUnsubscribe(roomUnsub);

  const membersRef = collection(db, `rooms/${roomId}/members`);
  const membersUnsub = onSnapshot(membersRef, (snapshot) => {
    const members = [];
    let isCurrentMember = false;
    const currentUid = auth.currentUser?.uid;

    snapshot.forEach((docSnap) => {
      const m = { id: docSnap.id, ...docSnap.data() };
      members.push(m);
      if (currentUid && docSnap.id === currentUid) {
        isCurrentMember = true;
      }
    });

    if (currentUid && !isCurrentMember && !snapshot.empty) {
      if (onError) onError({ code: 'not-a-member', message: 'You are no longer a member of this room.' });
      return;
    }

    if (onMembersUpdate) onMembersUpdate(members);
  }, (err) => {
    console.error("Members sync error:", err);
    if (onError) onError(err);
  });
  registerUnsubscribe(membersUnsub);

  const itemsRef = collection(db, `rooms/${roomId}/items`);
  const itemsUnsub = onSnapshot(itemsRef, (snapshot) => {
    const items = [];
    const changedItemIds = [];
    const currentUid = auth.currentUser?.uid;

    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data();
      if (change.type === 'modified' && data.lastUpdatedBy && data.lastUpdatedBy !== currentUid) {
        changedItemIds.push(change.doc.id);
      }
    });

    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() });
    });

    if (onItemsUpdate) onItemsUpdate(items, changedItemIds);
  }, (err) => {
    console.error("Items sync error:", err);
    if (onError) onError(err);
  });
  registerUnsubscribe(itemsUnsub);

  const activityQuery = query(
    collection(db, `rooms/${roomId}/activity`),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  const activityUnsub = onSnapshot(activityQuery, (snapshot) => {
    const activities = [];
    snapshot.forEach((docSnap) => {
      activities.push({ id: docSnap.id, ...docSnap.data() });
    });
    if (onActivityUpdate) onActivityUpdate(activities);
  }, (err) => {
    console.error("Activity sync error:", err);
  });
  registerUnsubscribe(activityUnsub);
}

export function initConnectionTracker(indicatorEl) {
  if (!indicatorEl) return;

  function updateStatus() {
    if (navigator.onLine) {
      indicatorEl.classList.remove('offline');
      indicatorEl.innerHTML = `<span class="connection-dot"></span><span>Live Ledger</span>`;
    } else {
      indicatorEl.classList.add('offline');
      indicatorEl.innerHTML = `<span class="connection-dot"></span><span>Offline</span>`;
    }
  }

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  updateStatus();

  return () => {
    window.removeEventListener('online', updateStatus);
    window.removeEventListener('offline', updateStatus);
  };
}

window.addEventListener('beforeunload', cleanupListeners);
window.addEventListener('pagehide', cleanupListeners);