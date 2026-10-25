/**
 * @file cart.js
 * @description Real-time transactional operations on the shared shopping cart.
 * Enforces per-member quantity limits (max 20), Smart Merge consolidation,
 * and isolated contribution updates.
 */

import { db, auth, isConfigured } from './firebase-config.js';
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { showToast } from './utils.js';

export const MAX_MEMBER_QTY = 20;

// Flag to guard against rapid double-clicks while transactions run
let isTransactionPending = false;

/**
 * Adds 1 unit of a product to the user's contribution in the shared cart
 * @param {string} roomId 
 * @param {any} product 
 * @returns {Promise<boolean>}
 */
export async function addItem(roomId, product) {
  if (isTransactionPending) return false;
  if (!isConfigured() || !auth.currentUser) {
    showToast("Please sign in to add items.", "error");
    return false;
  }

  isTransactionPending = true;
  const currentUser = auth.currentUser;
  const myUid = currentUser.uid;
  const displayName = currentUser.displayName || "Shopper";
  const itemRef = doc(db, `rooms/${roomId}/items`, product.id);
  const roomRef = doc(db, "rooms", roomId);
  const activityRef = doc(collection(db, `rooms/${roomId}/activity`));

  let isSmartMerge = false;

  try {
    await runTransaction(db, async (transaction) => {
      const roomSnap = await transaction.get(roomRef);
      if (!roomSnap.exists()) {
        throw new Error("Room does not exist.");
      }
      if (roomSnap.data().status !== 'open') {
        throw new Error("This room is closed and no longer accepting items.");
      }

      const itemSnap = await transaction.get(itemRef);
      const unitPrice = product.priceInPaise;
      let oldLineTotal = 0;
      let newLineTotal = 0;
      let oldTotalQty = 0;
      let newTotalQty = 0;

      if (!itemSnap.exists()) {
        // First addition of this product to shared cart
        const contributions = { [myUid]: 1 };
        const contributorNames = { [myUid]: displayName };
        newTotalQty = 1;
        newLineTotal = unitPrice;

        transaction.set(itemRef, {
          productId: product.id,
          name: product.name,
          unitPrice: unitPrice,
          image: product.image,
          unit: product.unit || '',
          category: product.category,
          totalQty: 1,
          contributions: contributions,
          contributorNames: contributorNames,
          updatedAt: serverTimestamp(),
          lastUpdatedBy: myUid
        });

        transaction.set(activityRef, {
          type: "add",
          actorUid: myUid,
          actorName: displayName,
          productId: product.id,
          productName: product.name,
          qty: 1,
          createdAt: serverTimestamp()
        });
      } else {
        // Smart Merge: item already in basket
        const data = itemSnap.data();
        const contributions = { ...(data.contributions || {}) };
        const contributorNames = { ...(data.contributorNames || {}) };
        const currentMyQty = contributions[myUid] || 0;

        if (currentMyQty >= MAX_MEMBER_QTY) {
          throw new Error(`You can add at most ${MAX_MEMBER_QTY} units of an item.`);
        }

        isSmartMerge = true;
        const updatedMyQty = currentMyQty + 1;
        contributions[myUid] = updatedMyQty;
        contributorNames[myUid] = displayName;

        oldTotalQty = data.totalQty || 0;
        oldLineTotal = oldTotalQty * unitPrice;

        newTotalQty = Object.values(contributions).reduce((sum, q) => sum + q, 0);
        newLineTotal = newTotalQty * unitPrice;

        transaction.update(itemRef, {
          totalQty: newTotalQty,
          contributions: contributions,
          contributorNames: contributorNames,
          updatedAt: serverTimestamp(),
          lastUpdatedBy: myUid
        });

        transaction.set(activityRef, {
          type: "increase",
          actorUid: myUid,
          actorName: displayName,
          productId: product.id,
          productName: product.name,
          qty: updatedMyQty,
          createdAt: serverTimestamp()
        });
      }

      // Update room denormalized subtotal & count
      const currentRoomData = roomSnap.data();
      const subtotalDelta = newLineTotal - oldLineTotal;
      const countDelta = newTotalQty - oldTotalQty;

      transaction.update(roomRef, {
        subtotal: Math.max(0, (currentRoomData.subtotal || 0) + subtotalDelta),
        itemCount: Math.max(0, (currentRoomData.itemCount || 0) + countDelta),
        updatedAt: serverTimestamp()
      });
    });

    if (isSmartMerge) {
      showToast(`Already in shared basket — added 1 more ${product.name}.`, "info");
    } else {
      showToast(`Added ${product.name} to shared basket.`, "success");
    }
    return true;
  } catch (err) {
    console.error("addItem error:", err);
    showToast(err.message || "Failed to add item to basket.", "error");
    return false;
  } finally {
    isTransactionPending = false;
  }
}

/**
 * Changes caller's contribution quantity by delta (+1 or -1)
 * @param {string} roomId 
 * @param {string} productId 
 * @param {number} delta 
 * @returns {Promise<boolean>}
 */
export async function changeMyQty(roomId, productId, delta) {
  if (isTransactionPending) return false;
  if (!isConfigured() || !auth.currentUser) return false;

  isTransactionPending = true;
  const currentUser = auth.currentUser;
  const myUid = currentUser.uid;
  const displayName = currentUser.displayName || "Shopper";
  const itemRef = doc(db, `rooms/${roomId}/items`, productId);
  const roomRef = doc(db, "rooms", roomId);
  const activityRef = doc(collection(db, `rooms/${roomId}/activity`));

  try {
    await runTransaction(db, async (transaction) => {
      const roomSnap = await transaction.get(roomRef);
      if (!roomSnap.exists()) throw new Error("Room does not exist.");
      if (roomSnap.data().status !== 'open') throw new Error("This room is closed.");

      const itemSnap = await transaction.get(itemRef);
      if (!itemSnap.exists()) return;

      const data = itemSnap.data();
      const contributions = { ...(data.contributions || {}) };
      const contributorNames = { ...(data.contributorNames || {}) };
      const currentMyQty = contributions[myUid] || 0;
      const nextMyQty = currentMyQty + delta;

      if (nextMyQty > MAX_MEMBER_QTY) {
        throw new Error(`Limit of ${MAX_MEMBER_QTY} units per person reached.`);
      }

      const unitPrice = data.unitPrice || 0;
      const oldTotalQty = data.totalQty || 0;
      const oldLineTotal = oldTotalQty * unitPrice;

      let newTotalQty = 0;
      let newLineTotal = 0;

      if (nextMyQty <= 0) {
        // Remove caller's contribution
        delete contributions[myUid];
        delete contributorNames[myUid];

        newTotalQty = Object.values(contributions).reduce((sum, q) => sum + q, 0);
        newLineTotal = newTotalQty * unitPrice;

        if (newTotalQty <= 0) {
          // If no other members contributed, remove item document entirely
          transaction.delete(itemRef);
        } else {
          transaction.update(itemRef, {
            contributions: contributions,
            contributorNames: contributorNames,
            totalQty: newTotalQty,
            updatedAt: serverTimestamp(),
            lastUpdatedBy: myUid
          });
        }

        transaction.set(activityRef, {
          type: "remove",
          actorUid: myUid,
          actorName: displayName,
          productId: productId,
          productName: data.name,
          qty: 0,
          createdAt: serverTimestamp()
        });
      } else {
        // Update caller's contribution
        contributions[myUid] = nextMyQty;
        contributorNames[myUid] = displayName;

        newTotalQty = Object.values(contributions).reduce((sum, q) => sum + q, 0);
        newLineTotal = newTotalQty * unitPrice;

        transaction.update(itemRef, {
          contributions: contributions,
          contributorNames: contributorNames,
          totalQty: newTotalQty,
          updatedAt: serverTimestamp(),
          lastUpdatedBy: myUid
        });

        transaction.set(activityRef, {
          type: delta > 0 ? "increase" : "decrease",
          actorUid: myUid,
          actorName: displayName,
          productId: productId,
          productName: data.name,
          qty: nextMyQty,
          createdAt: serverTimestamp()
        });
      }

      // Update room denormalized subtotal
      const currentRoomData = roomSnap.data();
      const subtotalDelta = newLineTotal - oldLineTotal;
      const countDelta = newTotalQty - oldTotalQty;

      transaction.update(roomRef, {
        subtotal: Math.max(0, (currentRoomData.subtotal || 0) + subtotalDelta),
        itemCount: Math.max(0, (currentRoomData.itemCount || 0) + countDelta),
        updatedAt: serverTimestamp()
      });
    });

    return true;
  } catch (err) {
    console.error("changeMyQty error:", err);
    showToast(err.message || "Failed to update quantity.", "error");
    return false;
  } finally {
    isTransactionPending = false;
  }
}

/**
 * Removes all units of a product contributed by caller
 * @param {string} roomId 
 * @param {string} productId 
 * @returns {Promise<boolean>}
 */
export async function removeMine(roomId, productId) {
  if (isTransactionPending) return false;
  if (!isConfigured() || !auth.currentUser) return false;

  isTransactionPending = true;
  const currentUser = auth.currentUser;
  const myUid = currentUser.uid;
  const displayName = currentUser.displayName || "Shopper";
  const itemRef = doc(db, `rooms/${roomId}/items`, productId);
  const roomRef = doc(db, "rooms", roomId);
  const activityRef = doc(collection(db, `rooms/${roomId}/activity`));

  try {
    await runTransaction(db, async (transaction) => {
      const roomSnap = await transaction.get(roomRef);
      if (!roomSnap.exists()) throw new Error("Room does not exist.");
      if (roomSnap.data().status !== 'open') throw new Error("This room is closed.");

      const itemSnap = await transaction.get(itemRef);
      if (!itemSnap.exists()) return;

      const data = itemSnap.data();
      const contributions = { ...(data.contributions || {}) };
      const contributorNames = { ...(data.contributorNames || {}) };
      const myQty = contributions[myUid] || 0;
      if (myQty <= 0) return;

      const unitPrice = data.unitPrice || 0;
      const oldTotalQty = data.totalQty || 0;
      const oldLineTotal = oldTotalQty * unitPrice;

      delete contributions[myUid];
      delete contributorNames[myUid];

      const newTotalQty = Object.values(contributions).reduce((sum, q) => sum + q, 0);
      const newLineTotal = newTotalQty * unitPrice;

      if (newTotalQty <= 0) {
        transaction.delete(itemRef);
      } else {
        transaction.update(itemRef, {
          contributions: contributions,
          contributorNames: contributorNames,
          totalQty: newTotalQty,
          updatedAt: serverTimestamp(),
          lastUpdatedBy: myUid
        });
      }

      transaction.set(activityRef, {
        type: "remove",
        actorUid: myUid,
        actorName: displayName,
        productId: productId,
        productName: data.name,
        qty: 0,
        createdAt: serverTimestamp()
      });

      const currentRoomData = roomSnap.data();
      transaction.update(roomRef, {
        subtotal: Math.max(0, (currentRoomData.subtotal || 0) + (newLineTotal - oldLineTotal)),
        itemCount: Math.max(0, (currentRoomData.itemCount || 0) + (newTotalQty - oldTotalQty)),
        updatedAt: serverTimestamp()
      });
    });

    showToast("Removed your portion from the basket.", "info");
    return true;
  } catch (err) {
    console.error("removeMine error:", err);
    showToast(err.message || "Failed to remove item.", "error");
    return false;
  } finally {
    isTransactionPending = false;
  }
}
