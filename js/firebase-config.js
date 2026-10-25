/**
 * @file firebase-config.js
 * @description Initializes Firebase modular SDK v10 via CDN.
 * Contains configuration object with helpful detection for placeholder values.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// REPLACE THESE WITH YOUR OWN FIREBASE PROJECT CONFIGURATION
// Find these in Firebase Console -> Project Settings -> General -> Your apps -> Web app
const firebaseConfig = {
  apiKey: "AIzaSyAp3Dnb5NiDJmZkE667wEyZQChTCqAqSxQ",
  authDomain: "cart-share-92744.firebaseapp.com",
  projectId: "cart-share-92744",
  storageBucket: "cart-share-92744.firebasestorage.app",
  messagingSenderId: "625158091971",
  appId:"1:625158091971:web:af8bf043a121b9c2afde76",
  measurementId: "G-XYMDCN1ZNN"
};

/**
 * Checks whether the configuration is still using placeholder values
 * @returns {boolean}
 */
export function isConfigured() {
  return !(
    !firebaseConfig.apiKey ||
    firebaseConfig.apiKey.includes("YOUR_API_KEY") ||
    firebaseConfig.projectId.includes("your-project-id")
  );
}

let appInstance = null;
let authInstance = null;
let dbInstance = null;

if (isConfigured()) {
  try {
    appInstance = initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn(
    "CartShare: Firebase configuration is not set. See FIREBASE_SETUP.md to connect your project."
  );
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const config = firebaseConfig;

/**
 * Helper to display a friendly setup banner when Firebase is not configured.
 */
export function renderSetupWarningIfUnconfigured() {
  if (isConfigured()) return;

  const existing = document.getElementById("firebase-setup-warning");
  if (existing) return;

  const banner = document.createElement("div");
  banner.id = "firebase-setup-warning";
  banner.className = "setup-warning-banner";
  banner.innerHTML = `
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-exclamation-triangle-fill text-warning fs-5"></i>
        <span><strong>Firebase Setup Required:</strong> Connect your Firebase project in <code>js/firebase-config.js</code> to enable real-time collaboration.</span>
      </div>
      <a href="README.md" target="_blank" class="btn btn-sm btn-outline-dark font-mono">View Guide</a>
    </div>
  `;

  const main = document.querySelector("main") || document.body;
  if (main.firstChild) {
    main.insertBefore(banner, main.firstChild);
  } else {
    main.appendChild(banner);
  }
}
