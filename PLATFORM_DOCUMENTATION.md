# 🏏 Real-Time Sports Auction Platform — Comprehensive System Documentation

> **Status:** Production Ready | **Latency Target:** Sub-50ms | **Consistency:** Strict ACID Zero-Overdraft Guarantee  
> **Platform URL:** [http://localhost:4000](http://localhost:4000)  
> **Admin Console:** [http://localhost:4000/admin](http://localhost:4000/admin) *(Passcode: `AUCTIONEER2026` or `admin`)*  
> **Franchise Desk:** [http://localhost:4000/franchise](http://localhost:4000/franchise)  

---

## 📑 Table of Contents
1. [Platform Overview & Architecture](#1-platform-overview--architecture)
2. [Description of Each User Interface & Screen](#2-description-of-each-user-interface--screen)
3. [Description of Each Tournament Setting & Control](#3-description-of-each-tournament-setting--control)
4. [Description of Each Data Entity & Schema Fields](#4-description-of-each-data-entity--schema-fields)
5. [Description of Each Rule, Invariant & Constraint](#5-description-of-each-rule-invariant--constraint)
6. [Description of Each API Endpoint & WebSocket Event](#6-description-of-each-api-endpoint--websocket-event)
7. [Automated Verification & Integrity Tests](#7-automated-verification--integrity-tests)

---

## 1. Platform Overview & Architecture

The **Real-Time Sports Auction Platform** is a web-based, event-driven live sports bidding system designed for professional leagues (such as IPL, Premier League, or custom sports leagues). It achieves **sub-50ms roundtrip latency** between a franchise clicking "BID" and every connected screen updating simultaneously, while mathematically enforcing that no team can overspend its digital purse or claim the same player concurrently.

### Technology Stack
- **Backend Runtime:** Node.js (TypeScript) + Express & Fastify architecture.
- **Duplex WebSocket Engine:** Socket.IO with WebSocket binary frame support and instant state fanout.
- **Concurrency & Locking:** In-memory asynchronous mutex (`AsyncLock`) implementing row-level locks on players and teams (`player:${id}`, `team:${id}`).
- **Data Persistence:** In-memory transactional database with append-only immutable JSONL audit ledger (`data/bidding_ledger.jsonl`).
- **Frontend Layer:** React 18, Vite, Tailwind CSS, Lucide icons, Web Audio API sound synthesizers.

---

## 2. Description of Each User Interface & Screen

### 2.1 Admin Console (Auctioneer Command Desk)
* **Access Route:** `/admin`
* **Security:** Gated behind a security checkpoint requiring the Master Key (`AUCTIONEER2026` or `admin`).
* **Purpose:** The authoritative master cockpit where the auctioneer conducts the auction in real time.
* **Core Modules Present:**
  1. **Tournament Configuration Banners:**
     - **Minimum Base Price Banner:** Displays active reserve floor (`₹2.00 Cr`, `₹1.00 Cr`, etc.) with quick-preset chips (`₹20 L`, `₹50 L`, `₹1.0 Cr`, `₹1.5 Cr`, `₹2.0 Cr`) and custom modal opener.
     - **Maximum Purse Balance Banner:** Displays active team salary cap with quick-preset chips (`₹80 Cr`, `₹90 Cr`, `₹100 Cr`, `₹110 Cr`, `₹120 Cr`) and custom modal opener.
  2. **Player on Block (Hero Card):**
     - Large visual card displaying the player currently being auctioned: photo, name, category, base reserve price, current high bid, and the leading franchise with their official color branding.
  3. **Tactile Gavel Controls:**
     - **"GOING 1" (First Call):** Broadcasts fair warning tone to all franchises.
     - **"GOING 2" (Second Call):** Intensifies visual alerts.
     - **"SOLD! Drop Gavel":** Atomically executes the sale, deducts money from the winning franchise's purse, assigns player to the team roster, and commits the immutable ledger entry.
     - **"UNSOLD (Pass Lot)":** Closes the lot and marks the player as unsold.
     - **"Open Bidding":** Opens the floor for franchises to submit live bids.
     - **"Pause / Resume":** Halts all incoming bids during dispute resolution.
  4. **Official Player Queue & Roster Catalogue:**
     - Complete searchable catalogue of all registered players.
     - Status filters: `ALL`, `UPCOMING`, `SOLD`, `UNSOLD`.
     - View switchers: **Grid Card Mode** or **Compact Table Mode**.
     - Action buttons to **"Bring to Block"** (make active) or **"Edit"** player details.
  5. **Modals Available:**
     - **+ Add Player Modal:** Register new players with Name, Role, Base Price, and Photo.
     - **Edit Teams Modal:** Update Franchise Name, 3-letter Code, Custom Logo (URL or file upload), and Individual Maximum Purse.
     - **Common Minimum Base Price Modal:** Configure unified reserve floor with bulk-update toggle.
     - **Maximum Purse Balance Modal:** Configure team salary cap with automatic spent-purse reconciliation.

---

### 2.2 Franchise Desk (Team Owner Cockpit)
* **Access Route:** `/franchise`
* **Purpose:** The dedicated bidding interface used by team owners and auction tables during live bidding.
* **Core Modules Present:**
  1. **Franchise Floor Matrix (4×2 Grid Mode):**
     - Displays all 8 tournament franchises in an intuitive grid view.
     - Inside each franchise card:
       - Official team name & franchise badge.
       - **Themed Yellow/Gold Logo Container:** High-contrast frame showcasing franchise logo.
       - **Wallet Balance:** Live available purse formatted in Crores/Lakhs (`₹XX.XX Cr`), with the maximum purse limit (`Max: ₹XXX.XX Cr`) indicated directly beneath.
       - **Roster Counter:** Real-time squad counter (`0/11 Players`) with overseas player tracker (`(X OS)`).
       - **Tactile [BID] Button:** Large one-click bidding trigger. When clicked, instantly fires a bid with sub-50ms latency.
  2. **Live Auction Block Bar (Top Panel):**
     - Shows current player on block, current leading bid amount, and next minimum bid increment slab.
  3. **Visual Leadership Cues:**
     - **LEADER Badge (Green):** Highlights the franchise currently holding the winning bid with a bouncing crown badge.
     - **OUTBID Alert (Red):** Instantly triggers when another franchise outbids you.
     - Dynamic button disablement when a team cannot afford the next bid, has filled all squad slots, or exceeds the overseas quota.

---

### 2.3 Stadium Live Tracker (Public Spectator Broadcast Display)
* **Access Route:** `/` (Home)
* **Purpose:** High-impact, television/stadium broadcast display for audiences and media.
* **Core Modules Present:**
  1. **Marquee Player Spotlight Stage:**
     - High-definition stage showing the active player, national flag, photo, and dynamic price counter.
  2. **Winning Bidder Branding:**
     - Broadcast cards dynamically re-theme their background lighting and glowing borders to match the leading franchise's official primary color.
  3. **Live Bidding Ticker:**
     - Streaming list of all bids submitted in chronological order with microsecond timestamps and team badges.
  4. **Tournament Leaderboard:**
     - Live ranking of franchises showing remaining purse, players acquired, and budget burn rate.
  5. **Recent Transactions Reel:**
     - Horizontal ticker showing the latest marquee sales and prices.

---

### 2.4 Player Auction Registration Portal
* **Access Route:** Dedicated Navigation Tab `Player Registration`
* **Purpose:** Official digital enrollment portal where players register their profiles for the live tournament auction.
* **Streamlined Registration Fields:**
  - **Player Full Name (Required):** Official player display name.
  - **Age (Required):** Player age (14–55 years).
  - **Contact Number (Required):** Phone / WhatsApp contact number on record.
  - **Player Photo / Avatar (Required):** Instant file upload (converted to base64) or Image URL, with live circular preview and sample avatars.
  - **Primary Playing Role (Required):** Interactive card selector for **Batter**, **Bowler**, **All-Rounder**, and **Wicketkeeper**.
  - **Batting & Bowling Style:** Right-hand/Left-hand bat, and Bowling style.
  - **Base Price Allocation:** Automatically adopts the tournament's active **Common Minimum Base Price** (`minBasePrice`) managed by the Admin.
* **Real-Time Live Card Preview:** Live interactive preview card updates in real-time as the applicant types.
* **Instant Pool Enrollment:** Upon submission, the player is assigned an official Lot Number and immediately injected into the live auction pool across all Admin, Franchise, and Stadium screens via WebSocket.

---

## 3. Description of Each Tournament Setting & Control

### 3.1 Common Minimum Base Price
* **What it does:** Sets the tournament-wide reserve price floor for all players.
* **Controls in Admin:**
  - One-click presets: `₹20 L`, `₹50 L`, `₹1.0 Cr`, `₹1.5 Cr`, `₹2.0 Cr`.
  - Custom input: Any amount (e.g. `₹75,00,000`).
  - **Apply to Pool Toggle:** When enabled, immediately updates all upcoming/unsold players in the auction pool without touching active live bids or already-sold lots.
  - **Player Registration Default:** Any new player registered automatically adopts this base price as default.

### 3.2 Maximum Purse Balance per Team
* **What it does:** Sets the total salary cap / purse allowance allocated to each franchise for the tournament.
* **Controls in Admin:**
  - One-click presets: `₹80 Cr`, `₹90 Cr`, `₹100 Cr`, `₹110 Cr`, `₹120 Cr`.
  - Custom input: Any amount (e.g. `₹95,00,00,000`).
  - **Automated Purse Reconciliation:** When updated, preserves all funds spent on acquired players and recalculates remaining wallet balance (`remainingPurse = newTotalPurse - spentPurse`).
  - **Individual Overrides:** Admin can also set custom purse caps for specific teams via `Edit Teams`.

### 3.3 Total Players Per Team (Squad Slot Limit)
* **What it does:** Sets the maximum roster / squad size limit (`maxSlots`) per franchise for the tournament.
* **Controls in Admin:**
  - Header Quick Pill: `Squad Cap: 11P` displaying live active setting.
  - Dedicated Tournament Banner: 1-click quick presets (`11P`, `15P`, `18P`, `20P`, `25P`) and `Custom...` button.
  - Interactive Modal: Side-by-side comparison (Current Squad Limit vs. Selected Limit), numeric input stepper, and presets.
  - **Apply to All Teams Toggle:** Updates `maxSlots` across all franchise teams simultaneously.
  - **Individual Team Overrides:** Can customize `Slots` per franchise in the `Edit Teams` modal.
  - **Bid Rules Enforcement:** The ACID bidding engine instantly locks out teams whose roster is full (`currentSlots >= maxSlots`) with error `ROSTER_LIMIT_REACHED`.

### 3.4 Dynamic Purse Reserve Protection Rule (Mandatory Squad Completion)
* **What it does:** Prevents any franchise from overbidding on an individual player if doing so would leave them without enough purse balance to acquire their remaining squad slots at the Minimum Base Price.
* **Formula Enforced by ACID Engine:**
  - `Remaining Slots Needed = Max(0, Target Squad Slots - (Current Slots + 1))`
  - `Required Purse Reserve = Remaining Slots Needed × Common Minimum Base Price`
  - `Max Allowable Bid = Remaining Purse Balance - Required Purse Reserve`
* **Real-Time UI & Server Safeguards:**
  - In `FranchiseDesk.tsx`, the `[BID]` button dynamically turns into **`RESERVE LOCKED`** whenever the next bid would violate this reserve.
  - Each franchise box displays a live **`Max Bid Cap: ₹X.XX Cr`** indicator.
  - Bids attempted above the cap are blocked on the server with error `PURSE_RESERVE_VIOLATION` explaining the exact number of slots and funds that must be preserved.

### 3.5 Manual Gavel & Timer Management
* **What it does:** Allows the auctioneer to control bidding manually with full authority.
* **Behavior:** The automatic countdown timer is disabled per user requirements; auction lots open, transition through warnings (Going 1, Going 2), and close (Sold / Unsold) exclusively via the auctioneer's gavel strikes.

---

## 4. Description of Each Data Entity & Schema Fields

### 4.1 Team Entity
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier (e.g., `team-mi`, `team-csk`). |
| `name` | `string` | Full franchise name (e.g., "Mumbai Indians"). |
| `code` | `string` | 2-4 letter uppercase abbreviation (e.g., "MI", "CSK"). |
| `logo` | `string` | Image URL or base64 data URI of the team logo. |
| `primaryColor` | `string` | Hex code for branding & visual illumination (e.g., `#004BA0`). |
| `secondaryColor` | `string` | Accent hex color code. |
| `totalPurse` | `number` | Maximum salary cap allocated in INR (e.g., `1000000000` = 100 Cr). |
| `remainingPurse` | `number` | Currently available unspent balance in INR. |
| `maxSlots` | `number` | Maximum allowed players in the squad (default: `11`). |
| `minSlots` | `number` | Minimum mandatory players required to complete squad (default: `11`). |
| `currentSlots` | `number` | Count of players currently signed. |
| `maxOverseas` | `number` | Maximum foreign players allowed (default: `4`). |
| `currentOverseas` | `number` | Count of foreign players currently signed. |
| `playersAcquired` | `string[]` | Array of player IDs won by this franchise. |

---

### 4.2 Player Entity
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier (e.g., `player-1`, `player-1712...`). |
| `name` | `string` | Player full name (e.g., "Virat Kohli"). |
| `role` | `enum` | Player category: `'Batter'` \| `'Bowler'` \| `'All-Rounder'` \| `'Wicketkeeper'`. |
| `country` | `string` | Nationality / home country. |
| `isOverseas` | `boolean` | Flag indicating foreign player status. |
| `basePrice` | `number` | Opening reserve price in INR (e.g., `20000000` = 2.0 Cr). |
| `currentBid` | `number` | Current highest active bid on block in INR. |
| `currentHighBidderId` | `string \| null` | ID of the leading team holding current bid. |
| `status` | `enum` | `'UPCOMING'` \| `'ON_BLOCK'` \| `'SOLD'` \| `'UNSOLD'`. |
| `soldPrice` | `number \| null` | Final hammer sale price in INR. |
| `winningTeamId` | `string \| null` | ID of the team that purchased the player. |
| `avatarUrl` | `string` | Image URL or uploaded photo of the player. |
| `orderIndex` | `number` | Lot number in the auction catalogue sequence. |

---

### 4.3 Bid Ledger Entry Entity (Audit Trail)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique ledger entry ID (e.g., `bid-1712...`). |
| `auctionId` | `string` | Identifier of the auction session. |
| `playerId` | `string` | ID of the player being bid on. |
| `teamId` | `string` | ID of the franchise placing the bid. |
| `teamName` | `string` | Denormalized team name for instant auditing. |
| `teamCode` | `string` | Denormalized team code. |
| `teamColor` | `string` | Primary hex color for rendering timeline badges. |
| `bidAmount` | `number` | Submitted bid value in INR. |
| `bidSequence` | `number` | Monotonically increasing sequence number for this lot. |
| `timestamp` | `number` | Epoch millisecond timestamp of server acceptance. |

---

## 5. Description of Each Rule, Invariant & Constraint

1. **Digital Purse Non-Negative Invariant:**
   A franchise's `remainingPurse` can **never drop below zero**. Every bid is pre-checked and atomically deducted inside a transactional row lock.
2. **Purse Reserve Constraint Formula:**
   To guarantee a team doesn't blow its budget early and fail to fill required squad slots, the engine checks:
   $$\text{Remaining Purse} - \text{Bid} \ge (\text{Min Slots} - \text{Current Slots} - 1) \times \text{Session Min Base Price}$$
3. **Dynamic Bid Increment Slabs:**
   The required minimum increment automatically scales with the current bid price:
   - **Under ₹1.00 Cr:** +₹10,00,000 (+10 L)
   - **₹1.00 Cr to ₹5.00 Cr:** +₹25,00,000 (+25 L)
   - **₹5.00 Cr to ₹10.00 Cr:** +₹50,00,000 (+50 L)
   - **Above ₹10.00 Cr:** +₹1,00,00,000 (+1.0 Cr)
4. **Self-Bidding Prevention:**
   A team that already holds the current highest bid cannot bid against itself.
5. **Roster Slot & Overseas Quota Caps:**
   - A team cannot bid if its squad is full (`currentSlots >= maxSlots`).
   - A team cannot bid on an overseas player if overseas slots are exhausted (`currentOverseas >= maxOverseas`).
6. **Concurrent Mutex Locks:**
   Incoming bids acquire row-level locks on both `player:${id}` and `team:${id}`, guaranteeing serialized evaluation and absolute zero outbid collisions.

---

## 6. Description of Each API Endpoint & WebSocket Event

### REST Endpoints
| HTTP Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/snapshot` | Returns complete live auction state snapshot. |
| `GET` | `/api/teams` | Returns all tournament teams and purse details. |
| `GET` | `/api/players` | Returns all registered players and statuses. |
| `GET` | `/api/ledger` | Returns the entire chronological audit ledger. |
| `POST` | `/api/players` | Registers a new player into the pool. |
| `PUT` | `/api/players/:id` | Updates an existing player's details. |
| `PUT` | `/api/teams/:id` | Updates a team's name, code, logo, or purse. |
| `POST` | `/api/settings/min-base-price` | Sets common minimum base price across pool. |
| `POST` | `/api/settings/max-purse` | Sets maximum purse balance across teams. |
| `POST` | `/api/reset` | Resets auction session to initial seeded state. |

### WebSocket Events (Duplex)
| Event Name | Direction | Payload / Purpose |
| :--- | :--- | :--- |
| `auction:state_update` | Server ➔ All Clients | Complete snapshot broadcast after any state change. |
| `auction:hammer_action` | Server ➔ All Clients | Broadcasts sound cues and banner alerts for Gavel strikes. |
| `franchise:place_bid` | Franchise Desk ➔ Server | One-click bid submission with sub-50ms processing. |
| `auctioneer:select_player` | Admin ➔ Server | Puts a specific player on the auction block. |
| `auctioneer:start_bidding` | Admin ➔ Server | Opens the floor for bidding on active player. |
| `auctioneer:hammer_strike` | Admin ➔ Server | Triggers Going 1, Going 2, SOLD, or UNSOLD. |
| `auctioneer:toggle_pause` | Admin ➔ Server | Pauses or resumes the auction session. |
| `auctioneer:set_min_base_price` | Admin ➔ Server | Updates tournament common base price. |
| `auctioneer:set_max_purse` | Admin ➔ Server | Updates tournament maximum purse balance. |

---

## 7. Automated Verification & Integrity Tests

The platform includes a built-in automated test suite (`backend/src/testEngine.ts`) verifying 24 core invariants:
- **5-Way Simultaneous Race Conditions:** Five simulated franchises bidding within the same millisecond; verifies exactly one succeeds and all others receive clean, serialized rejections.
- **Zero-Overdraft Enforcement:** Verifies bids exceeding wallet balance are strictly rejected.
- **Roster & Overseas Boundary Checks:** Verifies rejection when limits are exceeded.
- **Hammer Double-Claim Prevention:** Verifies a player can never be awarded to two franchises.

Run the test suite anytime:
```powershell
cd backend
npm run build
node dist/testEngine.js
```
