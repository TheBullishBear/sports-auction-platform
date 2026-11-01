# 🏏 Real-Time Sports Auction Platform

A high-performance, real-time web-based sports auction platform engineered for **sub-50ms live bidding latency** and **strict ACID consistency**.

---

## 🌟 Key Architecture & Capabilities

### 1. Database & Transactional Concurrency
- **Row-Level Mutex Locking**: Prevents race conditions and guarantees that two franchises can never successfully claim the same player simultaneously.
- **Strict Digital Purse Invariants**: Enforces `remaining_purse >= 0` check constraints to prevent overdrafts.
- **Purse Reserve Constraint Engine**: Validates that teams reserve sufficient purse to sign mandatory minimum roster slots at base price before approving any bid:
  $$\text{Remaining Purse} - \text{Bid} \ge (\text{Min Required Slots} - \text{Current Slots} - 1) \times \text{Base Price}$$
- **Append-Only Immutable Bidding Ledger**: High-resolution timestamped ledger with monotonic sequence tracking.

### 2. Real-Time State Machine (Backend)
- **Duplex WebSocket Engine (Socket.IO / Fastify)**: Sub-50ms roundtrip broadcast fanout.
- **Authoritative Finite State Machine (FSM)**:
  `IDLE` ➔ `BID_PENDING` ➔ `BIDDING_ACTIVE` ➔ `HAMMER_GOING_1` ➔ `HAMMER_GOING_2` ➔ `HAMMER_FINAL_CALL` ➔ `SOLD` / `UNSOLD`.
- **Dynamic Anti-Sniping**: Automatically resets timer to +10s if any bid is received with $< 8$ seconds remaining on the clock.
- **Multi-Tier Bid Validation**: Budget, increment slabs, roster limit, overseas quota, self-bidding rejection.

### 3. User Interfaces (Frontend)
- **Admin Console (Auctioneer Desk)**:
  - Interactive player on-block queue selector
  - Tactile Hammer Strikes ("Going Once", "Going Twice", "SOLD! Drop Gavel", "Pass Lot")
  - Clock controls (15s / 20s / 30s timers, Pause / Resume)
- **Franchise Desk (Team Owner Cockpit)**:
  - Multi-franchise switcher (MI, CSK, RCB, KKR, GT, SRH)
  - One-Click Instant Bid button with dynamic increment slab calculation (+10L, +25L, +50L, +1 Cr)
  - Visual status pill: `LEADING (Green)` vs `OUTBID (Red alert)`
  - Real-time purse burn telemetry & roster quota meters
- **Stadium Live Tracker (Public Spectator Display)**:
  - Broadcast stage with player photos, country flags, and career statistics
  - High active bid spotlight with winning franchise color branding
  - Real-time live bidding war ticker with microsecond timestamps
  - Recent sales transactions reel
  - Tournament franchise purse leaderboard

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ (Node.js LTS portable runtime is included in the project tools)

### 1. Start the Real-Time Backend Server (Port 4000)
```bash
cd backend
npm run build
npm start
```

### 2. Start the Frontend Application (Port 5173)
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Automated Verification Suite
To run the automated concurrency, row lock, and constraint verification tests:
```bash
cd backend
npm run build
node dist/testEngine.js
```
All 24 automated test cases verify:
- Simultaneous 5-way bid race condition handling
- Zero overdraft guarantee
- Minimum purse reserve invariant
- Overseas roster quota enforcement
- Double-claim prevention on hammer drops
