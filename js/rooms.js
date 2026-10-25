

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

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
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

        transaction.set(codeRef, {
          roomId: roomId,
          roomName: roomName.trim(),
          status: "open",
          ownerUid: currentUser.uid,
          createdAt: serverTimestamp()
        });

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

        const memberRef = doc(db, `rooms/${roomId}/members`, currentUser.uid);
        transaction.set(memberRef, {
          uid: currentUser.uid,
          displayName: displayName,
          role: "owner",
          joinedAt: serverTimestamp()
        });

        const userRoomRef = doc(db, `users/${currentUser.uid}/rooms`, roomId);
        transaction.set(userRoomRef, {
          roomId: roomId,
          name: roomName.trim(),
          code: candidateCode,
          role: "owner",
          joinedAt: serverTimestamp(),
          lastOpenedAt: serverTimestamp()
        });

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
    await updateDoc(doc(db, `users/${currentUser.uid}/rooms`, roomId), {
      lastOpenedAt: serverTimestamp()
    }).catch(() => {});
    return roomId;
  }

  await runTransaction(db, async (transaction) => {
    const roomRef = doc(db, "rooms", roomId);
    const roomSnap = await transaction.get(roomRef);

    if (!roomSnap.exists()) {
      throw new Error("Room document not found.");
    }
    const currentMemberCount = roomSnap.data().memberCount || 1;

    transaction.set(memberRef, {
      uid: currentUser.uid,
      displayName: displayName,
      role: "member",
      joinedAt: serverTimestamp()
    });

    transaction.update(roomRef, {
      memberCount: currentMemberCount + 1,
      updatedAt: serverTimestamp()
    });

    const userRoomRef = doc(db, `users/${currentUser.uid}/rooms`, roomId);
    transaction.set(userRoomRef, {
      roomId: roomId,
      name: codeData.roomName,
      code: codeData.code,
      role: "member",
      joinedAt: serverTimestamp(),
      lastOpenedAt: serverTimestamp()
    });

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
 * @param {string} roomId
 */
export async function leaveRoom(roomId) {
  if (!isConfigured() || !auth.currentUser) return;
  const currentUser = auth.currentUser;
  const displayName = await resolveDisplayName(currentUser);

  
  const roomSnap = await getDoc(doc(db, "rooms", roomId));
  if (!roomSnap.exists()) return;

  if (roomSnap.data().ownerUid === currentUser.uid) {
    throw new Error("The room host cannot leave the room. You may close the room instead.");
  }

  
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

    
    const currentMemberCount = freshRoomSnap.data().memberCount || 1;
    const currentSubtotal = freshRoomSnap.data().subtotal || 0;
    const currentItemCount = freshRoomSnap.data().itemCount || 0;

    transaction.update(doc(db, "rooms", roomId), {
      memberCount: Math.max(1, currentMemberCount - 1),
      subtotal: Math.max(0, currentSubtotal + subtotalDelta),
      itemCount: Math.max(0, currentItemCount + itemCountDelta),
      updatedAt: serverTimestamp()
    });

    
    transaction.delete(doc(db, `rooms/${roomId}/members`, currentUser.uid));

    
    transaction.delete(doc(db, `users/${currentUser.uid}/rooms`, roomId));

    
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