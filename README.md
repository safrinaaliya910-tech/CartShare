# 🧺 CartShare — The Market, Together.

**A real-time collaborative shopping room for roommates, flatmates, and families.**

Stop juggling WhatsApp screenshots and "did we already buy milk?" messages. CartShare lets a group open one shared room, fill one live basket from multiple phones at once, see exactly who added what, track progress toward a free-delivery target, and print a clean shopping summary — all without spreadsheets.

---


## 🎯 The Problem

Group grocery shopping over chat is messy:
- Duplicate orders because nobody saw the message in time
- Forgotten items buried in a scrolling chat thread
- No clarity on who paid for what
- No shared view of whether the cart hit the free-delivery minimum

**CartShare solves all four** with one live, authenticated, real-time shared basket.

---

## 🧩 Core Features

### Authentication & Rooms
- Real email/password accounts via **Firebase Authentication**
- Persistent login sessions — no re-entering credentials on every visit
- Password reset via email
- Create a room with a custom name and an optional delivery threshold
- Unique, collision-proof **4-character invite codes** (`CS-7K29`) generated and reserved atomically
- Join a room by code or by a shareable invite link
- Route protection — protected pages redirect unauthenticated visitors, and invitation intent survives the login/register detour

### The Stalls — Live Product Catalogue
- 50+ curated everyday household items across 9 categories: Fruits & Veg, Dairy & Eggs, Bakery, Pantry & Grains, Spices & Masalas, Snacks, Beverages, Household & Care, and Personal Care
- Live search, category filtering, and sorting (featured, price, A–Z)
- Editorial "market stall" tile design, not a generic e-commerce grid

### The Basket Slip — Real-Time Shared Cart
- Every member's additions sync instantly across all devices via **Cloud Firestore** real-time listeners
- Each cart line shows the combined quantity *and* a per-member contribution breakdown
- Members can only adjust their own quantity — never someone else's
- Firestore **transactions** guard every write, so simultaneous edits from different phones never silently overwrite each other

### 🚀 Signature Feature 1 — Delivery Runway
A live animated progress tracker toward a room's free-delivery threshold. Shows current subtotal, remaining amount, and percentage progress, with a celebratory "Target Reached" moment when the group crosses the line. Suggests nearby-priced items that would close the remaining gap — never added automatically.

### 🤝 Signature Feature 2 — Fair Share Ledger
A transparent, always-reconciled breakdown of exactly how much each member contributed to the shared basket — by item count and by rupee value — with proportional visual bars. Clearly labelled as *contribution value*, not a bill or amount owed.

### 🔗 Signature Feature 3 — Smart Merge & Duplicate Guard
If two members add the same product, CartShare automatically consolidates it into **one** cart line instead of creating confusing duplicates — while still tracking each person's individual contribution underneath. Product identity is based on a stable product ID, not the display name, so similarly-named items never collide incorrectly.

### Room Activity Feed
A real, live timeline of what actually happened in the room — joins, leaves, items added or adjusted — with the acting member and a readable timestamp. No fake or decorative activity.

### Printable Shopping Summary
A clean, properly formatted receipt-style summary — itemised list, subtotal, delivery line, and the fair-share breakdown — built from `window.print()` and dedicated print styles so it comes out readable on paper or as a PDF, with all navigation and interactive UI hidden.

### Room Lifecycle
- Members can leave a room — their contributions are cleanly removed without touching anyone else's
- The room owner can close a room, freezing further changes while keeping the basket and receipt viewable

---

## 🎨 Design — "The Market Ledger"

CartShare's visual identity is a warm, editorial, paper-and-ink market aesthetic — built to feel like a boutique grocer's stamped tickets and printed ledgers, not a generic shopping template.

- **Palette:** Cosmic Latte, Mocha Cream, Deep Burgundy, Sage Green, and a warm accent marigold/tomato, chosen for warmth and legibility rather than default SaaS blues and purples
- **Typography:** Fraunces for expressive display headlines, DM Sans for interface text, DM Mono for prices, codes, and receipt figures
- Rubber-stamp badges, perforated ticket edges, and ruled ledger lines in place of generic rounded cards
- Fully responsive: a distinct, hand-adapted mobile layout — not just a shrunk desktop view
- Subtle, purposeful motion only; respects `prefers-reduced-motion`

---

## 🛠️ Tech Stack

Built strictly with the stack required by the assignment brief — no framework, no build step:

| Layer | Technology |
|---|---|
| Structure | Semantic HTML5 |
| Styling | Custom CSS3 + Bootstrap 5 (heavily customised) |
| Interactivity | Vanilla JavaScript (ES6+ Modules) |
| Auth & Database | Firebase Authentication + Cloud Firestore |
| Icons | Bootstrap Icons |
| Fonts | Google Fonts (Fraunces, DM Sans, DM Mono) |



---

## 📁 Project Structure

```
CartShare/
├── index.html              # Landing page
├── login.html               # Sign in
├── register.html            # Account creation
├── dashboard.html           # Market Desk — room list, create/join
├── join.html                 # Join-by-code flow
├── room.html                  # The shared shopping room
│
├── css/
│   ├── style.css             # Design tokens & core styling
│   ├── responsive.css        # Mobile/tablet layout rules
│   └── print.css             # Receipt print styles
│
├── js/
│   ├── firebase-config.js    # Firebase app initialisation
│   ├── auth.js                 # Auth flows & route guards
│   ├── rooms.js                # Room creation, joining, leaving, closing
│   ├── products.js             # Product catalogue & filtering
│   ├── cart.js                  # Transactional cart operations
│   ├── sync.js                  # Firestore real-time listeners
│   ├── activity.js              # Activity feed rendering
│   ├── ledger.js                # Fair Share Ledger logic
│   ├── runway.js                # Delivery Runway logic
│   ├── receipt.js               # Receipt generation & printing
│   ├── dashboard.js             # Market Desk logic
│   ├── utils.js                 # Shared helpers
│   └── ui-effects.js            # Tilt, magnetic buttons, fly-to-basket, confetti
│
├── assets/
│   └── images/logo.svg
│
├── firestore.rules            # Database security rules
└── README.md
```



### Running locally

Because the app uses native ES modules, it must be served over HTTP, not opened directly as a `file://` path.

```bash
# Any static server works, for example:
python -m http.server 8000


---

## ✅ Manual QA Checklist

- [ ] Register two separate accounts and confirm both stay logged in after refresh
- [ ] Create a room, copy the invite link, and join from a second browser/incognito window
- [ ] Add the same product from both accounts — confirm it merges into one line with separate contributions
- [ ] Adjust one member's quantity — confirm the other member's contribution is untouched
- [ ] Watch the Delivery Runway cross its threshold and reach the celebration state
- [ ] Confirm the Fair Share Ledger total always equals the basket subtotal
- [ ] Print the receipt with an empty and a full basket
- [ ] Try opening a room URL while logged out — confirm it redirects to login and returns you afterward
- [ ] Test the full flow on a phone-width screen

---

## 🔮 Future Enhancements

- Push notifications for room activity
- Per-member settlement calculations
- Recurring/favourite shopping lists
- Multi-language support

---

## 📄 Submission Details

**Project:** CartShare
**Submission format:** `2026_SAFRIN AALIYA.A_CartShare`
**Author:** *Safrin Aaliya A*
**Batch ID:** *July 31-2026*

---

*CartShare — because the best groceries are the ones nobody forgot.* 🧺