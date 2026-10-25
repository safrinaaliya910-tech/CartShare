/**
 * @file app.js
 * @description Main application bootstrapper.
 * Manages global navbar auth state, setup warning banners, and landing page interactions.
 */

import { auth, isConfigured, renderSetupWarningIfUnconfigured } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { showToast } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Show setup warning if Firebase credentials are placeholder
  renderSetupWarningIfUnconfigured();

  // 2. Global navbar authentication state synchronization
  syncNavbarAuth();

  // 3. Landing page interactive elements
  initLandingInteractions();
});

/**
 * Updates navbar buttons depending on whether a user is logged in
 */
function syncNavbarAuth() {
  const authNavGuest = document.getElementById('navGuestActions');
  const authNavUser = document.getElementById('navUserActions');
  const navUserBadge = document.getElementById('navUserBadge');

  if (!isConfigured()) return;

  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (authNavGuest) authNavGuest.classList.add('d-none');
      if (authNavUser) authNavUser.classList.remove('d-none');
      if (navUserBadge) {
        navUserBadge.textContent = user.displayName || user.email?.split('@')[0] || 'Desk';
      }
    } else {
      if (authNavGuest) authNavGuest.classList.remove('d-none');
      if (authNavUser) authNavUser.classList.add('d-none');
    }
  });
}

/**
 * Initializes landing page specific UI enhancements
 */
function initLandingInteractions() {
  // Sample invite ticket click to copy
  const sampleTicket = document.getElementById('sampleInviteTicket');
  if (sampleTicket) {
    sampleTicket.addEventListener('click', () => {
      navigator.clipboard?.writeText('CS-7K29');
      showToast('Sample code "CS-7K29" copied to clipboard!', 'info');
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Staggered reveal for ledger step rows
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
      observer.observe(el);
    });
  }
}
