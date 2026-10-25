/**
 * @file ui-effects.js
 * @description Tactile, performant interaction effects: 3D tilt, magnetic buttons,
 * cursor follower, fly-to-basket, animated number counters, and scroll reveals.
 * Respects prefers-reduced-motion and touch device constraints.
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

/**
 * Initializes custom luxury cursor ring on non-touch devices
 */
export function initCustomCursor() {
  if (isTouchDevice || prefersReducedMotion) return;

  const cursor = document.createElement('div');
  cursor.className = 'market-cursor-ring';
  cursor.innerHTML = '<div class="cursor-dot"></div>';
  document.body.appendChild(cursor);

  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  const interactiveSelector = 'a, button, input, select, .product-tile, .category-chip, .tilt-card, .demo-stall-tile';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactiveSelector)) {
      cursor.classList.add('cursor-hover');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactiveSelector)) {
      cursor.classList.remove('cursor-hover');
    }
  });

  function renderCursor() {
    ringX += (mouseX - ringX) * 0.22;
    ringY += (mouseY - ringY) * 0.22;
    cursor.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);
}

/**
 * 3D Tilt effect on element hover
 * @param {string|HTMLElement} target 
 * @param {number} maxTilt 
 */
export function initTilt(target = '.tilt-card', maxTilt = 8) {
  if (isTouchDevice || prefersReducedMotion) return;

  const elements = typeof target === 'string' ? document.querySelectorAll(target) : [target];
  elements.forEach((el) => {
    if (!el || el.dataset.tiltInitialized) return;
    el.dataset.tiltInitialized = 'true';

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const xPercent = (x / rect.width - 0.5) * 2;
      const yPercent = (y / rect.height - 0.5) * 2;

      el.style.transform = `perspective(900px) rotateX(${-yPercent * maxTilt}deg) rotateY(${xPercent * maxTilt}deg) translateY(-4px)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
  });
}

/**
 * Magnetic button pull towards pointer
 * @param {string|HTMLElement} selector 
 */
export function initMagneticButtons(selector = '.btn-magnetic') {
  if (isTouchDevice || prefersReducedMotion) return;

  document.querySelectorAll(selector).forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      btn.style.transform = `translate3d(${x * 0.28}px, ${y * 0.28}px, 0)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate3d(0, 0, 0)';
    });
  });
}

/**
 * Smoothly animates a numerical DOM text content from current to target
 * @param {HTMLElement} element 
 * @param {number} endVal 
 * @param {string} prefix 
 * @param {number} duration 
 */
export function animateCounter(element, endVal, prefix = '₹', duration = 600) {
  if (!element) return;
  if (prefersReducedMotion) {
    element.textContent = `${prefix}${endVal.toLocaleString('en-IN')}`;
    return;
  }

  const startVal = parseInt(element.textContent.replace(/[^0-9]/g, ''), 10) || 0;
  const startTime = performance.now();

  function updateCount(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out quart
    const ease = 1 - Math.pow(1 - progress, 4);
    const current = Math.round(startVal + (endVal - startVal) * ease);

    element.textContent = `${prefix}${current.toLocaleString('en-IN')}`;

    if (progress < 1) {
      requestAnimationFrame(updateCount);
    } else {
      element.textContent = `${prefix}${endVal.toLocaleString('en-IN')}`;
    }
  }

  requestAnimationFrame(updateCount);
}

/**
 * Fly-to-basket particle arc animation
 * @param {HTMLElement} startEl 
 * @param {HTMLElement} targetEl 
 * @param {string} imgSrc 
 */
export function flyToBasket(startEl, targetEl, imgSrc) {
  if (prefersReducedMotion || !startEl || !targetEl) return;

  const startRect = startEl.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();

  const flyer = document.createElement('div');
  flyer.className = 'fly-to-basket-particle';
  if (imgSrc) {
    flyer.style.backgroundImage = `url(${imgSrc})`;
  } else {
    flyer.innerHTML = '<i class="bi bi-bag-plus-fill"></i>';
  }

  flyer.style.left = `${startRect.left + startRect.width / 2 - 18}px`;
  flyer.style.top = `${startRect.top + startRect.height / 2 - 18}px`;
  document.body.appendChild(flyer);

  const deltaX = (targetRect.left + targetRect.width / 2) - (startRect.left + startRect.width / 2);
  const deltaY = (targetRect.top + targetRect.height / 2) - (startRect.top + startRect.height / 2);

  // Trigger arc animation
  requestAnimationFrame(() => {
    flyer.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.2) rotate(25deg)`;
    flyer.style.opacity = '0.2';
  });

  setTimeout(() => {
    flyer.remove();
    targetEl.classList.remove('cart-bump');
    void targetEl.offsetWidth; // Reflow
    targetEl.classList.add('cart-bump');
  }, 550);
}

/**
 * Triggers a celebratory confetti burst made of pure lightweight CSS DOM elements
 * @param {HTMLElement} parentEl 
 */
export function triggerConfettiBurst(parentEl = document.body) {
  if (prefersReducedMotion) return;

  const container = document.createElement('div');
  container.className = 'confetti-burst-container';
  const colors = ['#722F37', '#9CAF88', '#F2B134', '#E4572E', '#F3ECDD'];

  for (let i = 0; i < 32; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.left = '50%';
    piece.style.top = '50%';

    const angle = Math.random() * 360;
    const distance = 60 + Math.random() * 140;
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * distance;
    const y = Math.sin(rad) * distance - 20;

    piece.style.setProperty('--dx', `${x}px`);
    piece.style.setProperty('--dy', `${y}px`);
    piece.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
    container.appendChild(piece);
  }

  parentEl.appendChild(container);
  setTimeout(() => container.remove(), 1200);
}

/**
 * Initializes scroll progress indicator at top of page
 */
export function initScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'market-scroll-progress';
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight > 0) {
      const progress = (window.scrollY / totalHeight) * 100;
      bar.style.width = `${progress}%`;
    }
  }, { passive: true });
}

/**
 * Parallax floating elements on mouse move
 * @param {string} selector 
 */
export function initParallaxFloat(selector = '.parallax-float') {
  if (isTouchDevice || prefersReducedMotion) return;

  const items = document.querySelectorAll(selector);
  if (items.length === 0) return;

  window.addEventListener('mousemove', (e) => {
    const xRatio = (e.clientX / window.innerWidth - 0.5) * 2;
    const yRatio = (e.clientY / window.innerHeight - 0.5) * 2;

    items.forEach((item) => {
      const speed = parseFloat(item.dataset.speed || '15');
      item.style.transform = `translate3d(${xRatio * speed}px, ${yRatio * speed}px, 0)`;
    });
  });
}
