/**
 * @file rooms.js
 * @description Manages shared shopping rooms: atomic creation, joining with unique code,
 * leaving, closing, and invite sharing.
 */

import { db, auth, isConfigured } from './firebase-config.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { normalizeRoomCode, rupeesToPaise, showToast } from './utils.js';
import { resolveDisplayName } from './auth.js';

// Alphabet without ambiguous glyphs: excludes 0, O, 1, I, L
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * Generates random 4-character suffix from unambiguous alphabet
 * @returns {string}
 */
function generateCodeSuffix() {
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
  }
  return result;
}

/**
 * Atomically creates a new room with a collision-free invite code
 * @param {string} roomName
 * @param {number} thresholdRupees
 * @param {number} deliveryChargeRupees
 * @returns {Promise<string>} roomId
 */
export async function createRoom(roomName, thresholdRupees = 500, deliveryChargeRupees = 40) {
  if (!isConfigured() || !auth.currentUser) {
    throw new Error("You must be signed in to open a room.");
  }

  const currentUser = auth.currentUser;
  const displayName = await resolveDisplayName(currentUser);
  const thresholdPaise = rupeesToPaise(thresholdRupees);
  const deliveryChargePaise = rupeesToPaise(deliveryChargeRupees);

  let attempts = 0;
  const maxAttempts = 8;

  while (attempts < maxAttempts) {
    attempts++;
    const candidateCode = "CS-" + generateCodeSuffix();
    const codeRef = doc(db, "roomCodes", candidateCode);
    const newRoomRef = doc(collection(db, "rooms"));
    const roomId = newRoomRef.id;

    try {
      const createdRoomId = await runTransaction(db, async (transaction) => {
        const codeSnap = await transaction.get(codeRef);
        if (codeSnap.exists()) {
          // Collision, retry with new code
          return null;
        }

        // 1. Reserve code doc
        transaction.set(codeRef, {
          roomId: roomId,
          roomName: roomName.trim(),
          status: "open",
          ownerUid: currentUser.uid,
          createdAt: serverTimestamp()
        });

        // 2. Set room document
        transaction.set(newRoomRef, {
          name: roomName.trim(),
          code: candidateCode,
          ownerUid: currentUser.uid,
          status: "open",
          threshold: thresholdPaise,
          deliveryCharge: deliveryChargePaise,
          memberCount: 1,
          subtotal: 0,
          itemCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // 3. Add owner as first member
        const memberRef = doc(db, `rooms/${roomId}/members`, currentUser.uid);
        transaction.set(memberRef, {
          uid: currentUser.uid,
          displayName: displayName,
          role: "owner",
          joinedAt: serverTimestamp()
        });

        // 4. Record room under user's profile
        const userRoomRef = doc(db, `users/${currentUser.uid}/rooms`, roomId);
        transaction.set(userRoomRef, {
          roomId: roomId,
          name: roomName.trim(),
          code: candidateCode,
          role: "owner",
          joinedAt: serverTimestamp(),
          lastOpenedAt: serverTimestamp()
        });

        // 5. Initial activity doc
        const activityRef = doc(collection(db, `rooms/${roomId}/activity`));
        transaction.set(activityRef, {
          type: "create",
          actorUid: currentUser.uid,
          actorName: displayName,
          details: "opened the market room",
          createdAt: serverTimestamp()
        });

        return roomId;
      });

      if (createdRoomId) {
        return createdRoomId;
      }
    } catch (err) {
      console.error(`Attempt ${attempts} to create room failed:`, err);
      if (attempts >= maxAttempts) throw err;
    }
  }

  throw new Error("Unable to reserve a unique invite code. Please try again.");
}

/**
 * Look up room details from an invite code before joining
 * @param {string} rawCode
 * @returns {Promise<any>}
 */
export async function lookupRoomCode(rawCode) {
  const code = normalizeRoomCode(rawCode);
  if (!/^CS-[A-Z0-9]{4}$/.test(code)) {
    throw new Error("Invalid code format. Codes look like 'CS-7K29'.");
  }

  const codeSnap = await getDoc(doc(db, "roomCodes", code));
  if (!codeSnap.exists()) {
    throw new Error("We couldn't find a room with that code. Check it and try again.");
  }

  const data = codeSnap.data();
  if (data.status !== "open") {
    throw new Error("This room is closed and no longer accepting new shoppers.");
  }

  return { code, ...data };
}

/**
 * Joins a room using an invite code
 * @param {string} rawCode
 * @returns {Promise<string>} roomId
 */
export async function joinRoomByCode(rawCode) {
  if (!isConfigured() || !auth.currentUser) {
    throw new Error("You must be signed in to join a room.");
  }

  const codeData = await lookupRoomCode(rawCode);
  const roomId = codeData.roomId;
  const currentUser = auth.currentUser;
  const displayName = await resolveDisplayName(currentUser);

  const memberRef = doc(db, `rooms/${roomId}/members`, currentUser.uid);
  const memberSnap = await getDoc(memberRef);

  if (memberSnap.exists()) {
    // Already a member, update last opened time and enter
    await updateDoc(doc(db, `users/${currentUser.uid}/rooms`, roomId), {
      lastOpenedAt: serverTimestamp()
    }).catch(() => {});
    return roomId;
  }

  // Atomically join the room
  await runTransaction(db, async (transaction) => {
    const roomRef = doc(db, "rooms", roomId);
    const roomSnap = await transaction.get(roomRef);

    if (!roomSnap.exists()) {
      throw new Error("Room document not found.");
    }
    const currentMemberCount = roomSnap.data().memberCount || 1;

    // Add member record
    transaction.set(memberRef, {
      uid: currentUser.uid,
      displayName: displayName,
      role: "member",
      joinedAt: serverTimestamp()
    });

    // Increment member count in room
    transaction.update(roomRef, {
      memberCount: currentMemberCount + 1,
      updatedAt: serverTimestamp()
    });

    // Record under user's profile
    const userRoomRef = doc(db, `users/${currentUser.uid}/rooms`, roomId);
    transaction.set(userRoomRef, {
      roomId: roomId,
      name: codeData.roomName,
      code: codeData.code,
      role: "member",
      joinedAt: serverTimestamp(),
      lastOpenedAt: serverTimestamp()
    });

    // Log join activity
    const activityRef = doc(collection(db, `rooms/${roomId}/activity`));
    transaction.set(activityRef, {
      type: "join",
      actorUid: currentUser.uid,
      actorName: displayName,
      details: "joined the market room",
      createdAt: serverTimestamp()
    });
  });

  return roomId;
}

/**
 * Member leaves the room: cleans up their contributions and deletes membership
 * @param {string} roomId
 */
export async function leaveRoom(roomId) {
  if (!isConfigured() || !auth.currentUser) return;
  const currentUser = auth.currentUser;
  const displayName = await resolveDisplayName(currentUser);

  // Check if owner
  const roomSnap = await getDoc(doc(db, "rooms", roomId));
  if (!roomSnap.exists()) return;

  if (roomSnap.data().ownerUid === currentUser.uid) {
    throw new Error("The room host cannot leave the room. You may close the room instead.");
  }

  // Get all items in room to clean up my contributions
  const itemsColl = collection(db, `rooms/${roomId}/items`);
  const itemsSnap = await getDocs(itemsColl);

  await runTransaction(db, async (transaction) => {
    const freshRoomSnap = await transaction.get(doc(db, "rooms", roomId));
    if (!freshRoomSnap.exists()) return;

    let subtotalDelta = 0;
    let itemCountDelta = 0;

    for (const itemDoc of itemsSnap.docs) {
      const itemData = itemDoc.data();
      const contributions = itemData.contributions || {};
      const myQty = contributions[currentUser.uid] || 0;

      if (myQty > 0) {
        const itemRef = doc(db, `rooms/${roomId}/items`, itemDoc.id);
        const newContributions = { ...contributions };
        delete newContributions[currentUser.uid];

        const newContributorNames = { ...(itemData.contributorNames || {}) };
        delete newContributorNames[currentUser.uid];

        const remainingTotalQty = Object.values(newContributions).reduce((sum, q) => sum + q, 0);

        if (remainingTotalQty <= 0) {
          transaction.delete(itemRef);
        } else {
          transaction.update(itemRef, {
            contributions: newContributions,
            contributorNames: newContributorNames,
            totalQty: remainingTotalQty,
            updatedAt: serverTimestamp(),
            lastUpdatedBy: currentUser.uid
          });
        }

        subtotalDelta -= myQty * (itemData.unitPrice || 0);
        itemCountDelta -= myQty;
      }
    }

    // Decrement member count & update denormalized totals
    const currentMemberCount = freshRoomSnap.data().memberCount || 1;
    const currentSubtotal = freshRoomSnap.data().subtotal || 0;
    const currentItemCount = freshRoomSnap.data().itemCount || 0;

    transaction.update(doc(db, "rooms", roomId), {
      memberCount: Math.max(1, currentMemberCount - 1),
      subtotal: Math.max(0, currentSubtotal + subtotalDelta),
      itemCount: Math.max(0, currentItemCount + itemCountDelta),
      updatedAt: serverTimestamp()
    });

    // Delete member document
    transaction.delete(doc(db, `rooms/${roomId}/members`, currentUser.uid));

    // Delete user room bookmark
    transaction.delete(doc(db, `users/${currentUser.uid}/rooms`, roomId));

    // Log leave activity
    const activityRef = doc(collection(db, `rooms/${roomId}/activity`));
    transaction.set(activityRef, {
      type: "leave",
      actorUid: currentUser.uid,
      actorName: displayName,
      details: "left the room",
      createdAt: serverTimestamp()
    });
  });
}

/**
 * Owner closes the room: sets status to 'closed'
 * @param {string} roomId
 * @param {string} code
 */
export async function closeRoom(roomId, code) {
  if (!isConfigured() || !auth.currentUser) return;
  const currentUser = auth.currentUser;

  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) return;

  if (roomSnap.data().ownerUid !== currentUser.uid) {
    throw new Error("Only the room host can close the room.");
  }

  const displayName = await resolveDisplayName(currentUser);

  // Log close activity BEFORE closing (the rules only allow logging while the room is open)
  try {
    await setDoc(doc(collection(db, `rooms/${roomId}/activity`)), {
      type: "close",
      actorUid: currentUser.uid,
      actorName: displayName,
      details: "closed the market room",
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("Could not log close activity:", err);
  }

  await updateDoc(roomRef, {
    status: "closed",
    updatedAt: serverTimestamp()
  });

  if (code) {
    await updateDoc(doc(db, "roomCodes", code), {
      status: "closed"
    }).catch(() => {});
  }
}

/**
 * Copies the invite code to clipboard
 * @param {string} code
 */
export async function copyInviteCode(code) {
  try {
    await navigator.clipboard.writeText(code);
    showToast(`Invite code ${code} copied!`, "success");
  } catch {
    showToast(`Invite code: ${code}`);
  }
}

/**
 * Copies full invite join link to clipboard
 * @param {string} code
 */
export async function copyInviteLink(code) {
  const joinUrl = `${window.location.origin}/join.html?code=${encodeURIComponent(code)}`;
  try {
    await navigator.clipboard.writeText(joinUrl);
    showToast("Shareable invite link copied to clipboard!", "success");
  } catch {
    showToast(`Join link: ${joinUrl}`);
  }
}