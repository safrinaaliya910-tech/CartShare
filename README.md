# CartShare — The Market, Together.

CartShare is an award-winning editorial, real-time group shopping web app built on the **"Market Ledger"** design concept. It brings a boutique grocer's printed ledger, stall tickets, and stamped receipts to life for hostel roommates, collective households, families, and teams.

Groups create or join a shared shopping room with an invite code, browse a curated product catalogue ("The Stalls"), fill **one consolidated basket** in real time from different devices, track a delivery threshold target via the **Delivery Runway**, inspect individual contributions in the **Fair Share Ledger**, and print a clean shopping summary receipt.

---

## 1. Tech Stack (Zero Build Step)

- **UI & Presentation**: Semantic HTML5, CSS3 Custom Properties, Responsive Grid & Flexbox.
- **Framework & Icons**: Bootstrap 5.3 via CDN (grid, modal, offcanvas, toast; heavily customized so it never looks like default Bootstrap), Bootstrap Icons CDN.
- **Typography**: Google Fonts — *Fraunces* (editorial serif headings), *DM Sans* (body & UI), *DM Mono* (prices, invite codes, receipt numerals).
- **Architecture**: Vanilla JavaScript ES6+ utilizing native browser ES modules (`<script type="module">`).
- **Database & Sync**: Firebase modular SDK v10+ via CDN ES-module imports (`firebase-app`, `firebase-auth`, `firebase-firestore`).
- **Data Integrity**: Monetary values stored as integer paise (1 Rupee = 100 Paise) to avoid floating-point math issues. Single Source of Truth: subtotal and item count are calculated live directly from the items snapshot.

---

## 2. File Structure

```text
CartShare/
├── index.html            # Landing page (asymmetric hero, grocery collage, sample invite ticket, feature ledger)
├── login.html            # Auth sign-in with two-panel layout & password reset
├── register.html         # Auth registration with profile creation
├── dashboard.html        # Market Desk (room list, live subtotal updates, create room modal, quick join)
├── join.html             # Invite code validation & room preview join
├── room.html             # Hero shared shopping room (3-zone desktop layout, mobile bottom sheet)
├── css/
│   ├── style.css         # Design system tokens, paper-and-ink styling, rubber stamps, custom controls
│   ├── responsive.css    # Mobile adaptations, horizontal scroller, touch targets, offcanvas tabs
│   └── print.css         # Print stylesheet hiding browser chrome for clean A4 grocery summary
├── js/
│   ├── firebase-config.js# Modular SDK CDN init, placeholder detector & warning banner
│   ├── utils.js          # escapeHtml, formatCurrency (paise to ₹), relativeTime, debounce, toasts
│   ├── auth.js           # Firebase auth services, route guards (requireAuth), error mappings
│   ├── app.js            # Navbar auth state, setup warning triggers, landing interactions
│   ├── dashboard.js      # Market Desk logic, active room listeners, create modal
│   ├── rooms.js          # Room generation with collision-free codes, atomic join, leave, close
│   ├── products.js       # Curated catalogue (38 items across 7 categories) with filter helpers
│   ├── cart.js           # Transactional cart operations with Smart Merge & per-member caps
│   ├── sync.js           # Real-time Firestore onSnapshot listeners & unsubscribe manager
│   ├── activity.js       # Formatted room event stream with relative timestamps
│   ├── ledger.js         # Fair Share Ledger individual contribution calculations & reconciliation
│   ├── runway.js         # Delivery Runway progress ruler with gap-filling catalogue suggestions
│   └── receipt.js        # Printable shopping summary receipt builder
├── assets/
│   └── images/
│       └── logo.svg      # Custom boutique market ledger SVG logo
├── firestore.rules       # Production security rules with multi-user isolation
├── firebase.json         # Hosting & rules deployment configuration
├── FIREBASE_SETUP.md     # Beginner step-by-step setup guide
└── README.md             # Project documentation & manual QA checklist
```

---

## 3. Signature Features

### 01. The Delivery Runway
A horizontal track styled like a ruler with tick marks at 0%, 25%, 50%, 75%, and 100%. A travelling basket marker progresses toward a goal flag labelled with the target rupee threshold. When the target is reached, the runway stamps **TARGET REACHED**. If the cart is below threshold, it offers **"Fits the gap"** recommendations for catalogue items with price $\le$ remaining deficit.

### 02. The Fair Share Ledger
A clean tabular breakdown detailing each member's contributed item count, rupee amount, and percentage share with individual colour-coded share bars. A mathematical assertion verifies that $\sum (\text{member contributions}) \equiv \text{group subtotal}$. Accompanied by a permanent notice: *"Value of items each member added. This is not an amount owed."*

### 03. Smart Merge & Duplicate Guard
When different shoppers add the same item, CartShare avoids duplicate lines. The item document ID in Firestore is the stable product ID (e.g. `p_organic_cow_milk_1l`), consolidating contributions into a single line while keeping individual member steppers isolated.

---

## 4. Firebase Configuration & Security Rules

### Configuration
Update `/js/firebase-config.js` with your Firebase web configuration (see `FIREBASE_SETUP.md` for a beginner walkthrough). If the keys remain placeholders, CartShare shows an informative banner at the top of the screen rather than crashing.

### Security Rules Highlights (`firestore.rules`)
- `users/{uid}`: Locked strictly to that authenticated user.
- `roomCodes/{code}`: Authenticated users can fetch individual codes to join. Creation requires `ownerUid == request.auth.uid`. Updates restricted to the owner.
- `rooms/{roomId}`: Read limited to members. Updates from members allow only denormalized counter/timestamp updates with bounds checking. Settings updates restricted to the owner.
- `rooms/{roomId}/items/{productId}`: Updates enforce that callers can only modify their own entry in `contributions`:
  ```javascript
  request.resource.data.contributions.diff(resource.data.contributions).affectedKeys().hasOnly([request.auth.uid])
  ```
- `rooms/{roomId}/activity/{id}`: Append-only by room members with verified actor ID and server timestamp.

### Testing Rules in Firebase Rules Playground
1. **Allowed**: Member reading item doc `/rooms/ROOM1/items/p_basmati_1kg` where `/rooms/ROOM1/members/USER1` exists.
2. **Allowed**: Member updating only their UID key in `contributions` from 1 to 2.
3. **Denied**: Member attempting to tamper with another member's quantity in `contributions`.
4. **Denied**: Unauthenticated user trying to read `/rooms/ROOM1`.

---

## 5. Running Locally & Testing

Because CartShare uses standard browser ES modules (`<script type="module">`), it must be served over HTTP:

1. **VS Code Live Server**: Right-click `index.html` and click **Open with Live Server**.
2. **Python**: `python3 -m http.server 3000`
3. **Node/npx**: `npx serve .`

### Testing with Multiple Shoppers
1. Open a regular browser tab and sign up as User A (e.g. `asha@hostel.edu`).
2. Open a new room `"Hostel Wing B"` and note the invite code (e.g. `CS-3K9M`).
3. Open an **Incognito / Private tab** and sign up as User B (e.g. `rohan@hostel.edu`).
4. On User B's Market Desk, enter `CS-3K9M` into **Join with an Invite Code**.
5. Add items from both tabs and observe instant real-time synchronization, Smart Merge badges, Delivery Runway progression, and Fair Share Ledger reconciliation.

---

## 6. Manual QA Checklist

| Test Case | Steps | Expected Result | Verified? |
|---|---|---|---|
| **Register & Login** | Register 2 distinct accounts; sign out and sign in. | Profiles created in `users/{uid}`; redirected cleanly. | [x] Code verified |
| **Room Creation** | User A creates a room with name and ₹500 threshold. | CS-XXXX code generated; owner role set; redirected to room. | [x] Code verified |
| **Join by Code** | User B enters code into Market Desk or `/join.html?code=...`. | Room name preview displayed; atomic transaction joins room. | [x] Code verified |
| **Smart Merge** | Both User A & User B add `Farm Fresh A2 Cow Milk`. | 1 single line in cart; "MERGED" badge; "You 1 · Rohan 1". | [x] Code verified |
| **Stepper Isolation** | User A increments milk; User B clicks minus on their portion. | Steppers only affect the caller's quantity; max 20 cap enforced. | [x] Code verified |
| **Delivery Runway** | Add items up to ₹500; observe runway marker and tick marks. | Smooth fill; stamps "TARGET REACHED" at ₹500; offers gap products below. | [x] Code verified |
| **Fair Share Ledger** | Inspect ledger table at various quantities. | Sum of members exactly equals live subtotal; percentages tally. | [x] Code verified |
| **Printable Receipt** | Click "Summary & Receipt"; trigger Print / Save PDF. | Clean black-and-white grocery receipt; all site chrome hidden. | [x] Code verified |
| **Leave & Close** | Member leaves (contributions cleared); Owner closes room (items locked). | Dynamic status stamp changes to CLOSED; controls disabled. | [x] Code verified |
| **Responsiveness** | Resize browser down to 320px width. | No horizontal scroll; sticky bottom basket bar triggers offcanvas bottom sheet. | [x] Code verified |

---

## 7. Known Limitations & Future Enhancements

- **Catalogue**: The product catalogue is a curated local dataset in `js/products.js` with realistic Indian grocery pricing and Unsplash photography, not connected to a live physical supermarket inventory.
- **Payments**: CartShare is a collaborative planning and cart-building tool; it does not process online payments (UPI/cards). The printed receipt is an itemised shopping summary, not a tax invoice.
- **Future Enhancements**: Integration with grocery quick-commerce APIs (e.g. Blinkit, Zepto, Swiggy Instamart), offline write queue using Firestore offline persistence cache, and customizable room currency options.
