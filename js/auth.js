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

let registrationPromise = null;

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

export async function resolveDisplayName(user = auth.currentUser) {
  if (!user) return DEFAULT_NAME;

  const authName = (user.displayName || '').trim();
  if (authName) return authName;

  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    const storedName = snap.exists() ? (snap.data().displayName || '').trim() : '';
    if (storedName) {
      try {
        await updateProfile(user, { displayName: storedName });
      } catch (e) {}
      return storedName;
    }
  } catch (err) {
    console.warn('Could not read users/{uid} profile:', err);
  }

  const prefix = (user.email || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
  const name = prefix
    ? prefix.replace(/\b\w/g, (c) => c.toUpperCase())
    : DEFAULT_NAME;

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

export async function registerUser(name, email, password) {
  if (!isConfigured()) {
    throw new Error('Firebase configuration missing. See FIREBASE_SETUP.md.');
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim();

  let finish;
  registrationPromise = new Promise((resolve) => {
    finish = resolve;
  });

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: cleanName });

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

    try {
      await user.reload();
    } catch (e) {}

    return auth.currentUser || user;
  } finally {
    finish();
    registrationPromise = null;
  }
}

export async function loginUser(email, password) {
  if (!isConfigured()) {
    throw new Error('Firebase configuration missing. See FIREBASE_SETUP.md.');
  }

  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
  await resolveDisplayName(userCredential.user).catch(() => {});
  return userCredential.user;
}

export async function resetPassword(email) {
  if (!isConfigured()) {
    throw new Error('Firebase configuration missing. See FIREBASE_SETUP.md.');
  }

  await sendPasswordResetEmail(auth, email.trim());
}

export async function logoutUser() {
  if (!isConfigured()) return;

  await signOut(auth);
  window.location.href = 'index.html';
}

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

export function onUserChanged(callback) {
  if (!isConfigured()) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}