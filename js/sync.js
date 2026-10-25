/**
 * @file sync.js
 * @description Manages real-time Firestore listeners (onSnapshot) for the room,
 * tracks member list, cart items, and activity feed, and handles clean unsubscription.
 */

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

/**
 * Registers an unsubscribe callback to be cleared on teardown
 * @param {Function} unsub 
 */
export function registerUnsubscribe(unsub) {
  if (typeof unsub === 'function') {
    activeUnsubscribers.push(unsub);
  }
}

/**
 * Cleans up all active Firestore listeners
 */
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

/**
 * Attaches real-time subscriptions for the shared room
 * @param {string} roomId 
 * @param {Object} callbacks 
 * @param {Function} callbacks.onRoomUpdate
 * @param {Function} callbacks.onMembersUpdate
 * @param {Function} callbacks.onItemsUpdate
 * @param {Function} callbacks.onActivityUpdate
 * @param {Function} callbacks.onError
 */
export function subscribeToRoom(roomId, {
  onRoomUpdate,
  onMembersUpdate,
  onItemsUpdate,
  onActivityUpdate,
  onError
}) {
  if (!isConfigured() || !roomId) return;

  // 1. Subscribe to Room document
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

  // 2. Subscribe to Members collection
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

  // 3. Subscribe to Shared Cart Items
  const itemsRef = collection(db, `rooms/${roomId}/items`);
  const itemsUnsub = onSnapshot(itemsRef, (snapshot) => {
    const items = [];
    const changedItemIds = [];
    const currentUid = auth.currentUser?.uid;

    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data();
      // If updated by someone else, mark for sage flash animation
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

  // 4. Subscribe to Activity stream (last 50, newest first)
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

/**
 * Sets up online/offline status tracking on the window
 * @param {HTMLElement} indicatorEl 
 */
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

// Clean up listeners on page unload
window.addEventListener('beforeunload', cleanupListeners);
window.addEventListener('pagehide', cleanupListeners);
