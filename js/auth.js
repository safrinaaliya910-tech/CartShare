/**
 * @file auth.js
 * @description Authentication service using Firebase modular Auth SDK.
 * Handles login, registration, logout, password reset, route guards
 * and reliable display-name resolution.
 */

import { auth, db, isConfigured } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { showToast } from './utils.js';

const DEFAULT_NAME = 'Market Shopper';

// While a registration is saving the profile, redirects must wait for it.
let registrationPromise = null;

/**
 * Maps Firebase auth error codes to friendly customer messages
 * @param {string} code
 * @returns {string}
 */
export function mapAuthError(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Try signing in.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled in Firebase Console.';
    case 'auth/weak-password':
      return 'Please choose a stronger password (at least 6 characters).';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your details.';
    case 'auth/too-many-requests':
      return 'Access temporarily blocked due to too many failed attempts. Try again in a moment.';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connection.';
    default:
      return 'Authentication failed. Please verify your credentials and try again.';
  }
}

/**
 * Resolves the best available display name for a user and repairs missing data.
 * Order: Auth profile name -> users/{uid} document -> email prefix -> default.
 * @param {any} user Firebase user (defaults to the current user)
 * @returns {Promise<string>}
 */
export async function resolveDisplayName(user = auth.currentUser) {
  if (!user) return DEFAULT_NAME;

  // 1. Name stored on the Auth profile
  const authName = (user.displayName || '').trim();
  if (authName) return authName;

  // 2. Name stored in the Firestore profile document
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    const storedName = snap.exists() ? (snap.data().displayName || '').trim() : '';
    if (storedName) {
      try { await updateProfile(user, { displayName: storedName }); } catch (e) { /* non-fatal */ }
      return storedName;
    }
  } catch (err) {
    console.warn('Could not read users/{uid} profile:', err);
  }

  // 3. Build a readable name from the email prefix (asha.k@x.com -> "Asha K")
  const prefix = (user.email || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
  const name = prefix
    ? prefix.replace(/\b\w/g, (c) => c.toUpperCase())
    : DEFAULT_NAME;

  // Save it so every later screen sees the same name
  try {
    await updateProfile(user, { displayName: name });
    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        displayName: name,
        email: (user.email || '').toLowerCase(),
        createdAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not save repaired display name:', err);
  }

  return name;
}

/**
 * Registers a new user with email, password, and display name
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Promise<any>}
 */
export async function registerUser(name, email, password) {
  if (!isConfigured()) {
    throw new Error('Firebase configuration missing. See FIREBASE_SETUP.md.');
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim();

  // Hold redirects until the profile is fully saved
  let finish;
  registrationPromise = new Promise((resolve) => { finish = resolve; });

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;

    // Save name on the Auth profile
    await updateProfile(user, { displayName: cleanName });

    // Save profile record in Firestore
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: cleanName,
        email: cleanEmail.toLowerCase(),
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Could not write initial users/{uid} document:', err);
    }

    // Refresh the cached user so displayName is available immediately
    try { await user.reload(); } catch (e) { /* non-fatal */ }

    return auth.currentUser || user;
  } finally {
    finish();
    registrationPromise = null;
  }
}

/**
 * Signs in user with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<any>}
 */
export async function loginUser(email, password) {
  if (!isConfigured()) {
    throw new Error('Firebase configuration missing. See FIREBASE_SETUP.md.');
  }
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
  // Repair a missing name (older accounts) right after login
  await resolveDisplayName(userCredential.user).catch(() => {});
  return userCredential.user;
}

/**
 * Sends a password reset email
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
  if (!isConfigured()) {
    throw new Error('Firebase configuration missing. See FIREBASE_SETUP.md.');
  }
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Signs out current user
 * @returns {Promise<void>}
 */
export async function logoutUser() {
  if (!isConfigured()) return;
  await signOut(auth);
  window.location.href = 'index.html';
}

/**
 * Guard for protected pages: redirects unauthenticated users to login
 * @returns {Promise<any>} resolves with currentUser
 */
export function requireAuth() {
  return new Promise((resolve) => {
    if (!isConfigured()) {
      resolve(null);
      return;
    }

    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(user);
      } else {
        const currentUrl = window.location.pathname + window.location.search;
        window.location.href = `login.html?redirect=${encodeURIComponent(currentUrl)}`;
      }
    });
  });
}

/**
 * Guard for guest-only pages (login/register): redirects logged-in users onward.
 * Waits for an in-progress registration to finish saving the profile first.
 */
export function redirectIfAuthenticated() {
  if (!isConfigured()) return;
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    if (registrationPromise) {
      await registrationPromise.catch(() => {});
    }

    const redirectUrl = new URLSearchParams(window.location.search).get('redirect');
    if (redirectUrl) {
      window.location.href = decodeURIComponent(redirectUrl);
    } else {
      window.location.href = 'dashboard.html';
    }
  });
}

/**
 * Watches auth state and triggers callback
 * @param {Function} callback
 */
export function onUserChanged(callback) {
  if (!isConfigured()) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}