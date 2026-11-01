# 🏏 Real-Time Sports Auction & Live Cricket Scoring Platform

A comprehensive, production-ready platform featuring:
1. **Real-Time Sports Auction Suite**: Sub-50ms live bidding latency, ACID concurrency engine, and franchise desks.
2. **Mobile-First Live Cricket Scoring & Tournament PWA**: Event-sourced ball-by-ball thumb scoring at ground level, automated ICC Net Run Rate (NRR) points table, Orange/Purple cap leaderboards, and instant WhatsApp scorecard graphics.

---

## 🌟 Cricket Scoring & Tournament Management Module

### 1. Event-Sourced Deterministic Reducer
- **Zero Invariant Drift**: Every ball is stored as an immutable event in the match ledger (`BallEvent`).
- **Instant 1-Click Undo**: Removing the last delivery automatically recalculates overs, bowler spells, striker rotation, boundaries, and run rates deterministically.
- **Auditable Ball Editing**: Modify any delivery in the ledger, and the entire innings state re-evaluates cleanly.
- **Accurate Cricket Rules**:
  - Wides & No-Balls add runs without advancing the legal delivery count (`0.1`, `0.2` ... `0.6`).
  - Automatic strike rotation on odd runs ($1, 3, 5$) and at the conclusion of each over (6 legal balls).
  - Free Hit indicator activated automatically on the delivery following any No-Ball (restricting dismissals to Run Out only).
  - Over quota validation: Enforces maximum overs per bowler (e.g., max 2 overs per bowler in a 5-over or 10-over match).

### 2. Mobile-First 1-Hand Thumb Scoring Console (`#cricket-scorer`)
- Built for ground-level scoring under bright outdoor sunlight with a high-contrast **Sunlight Mode** toggle.
- Large tactile thumb keypad:
  - `0` (Dot), `1`, `2`, `3`
  - `4` (Boundary - Emerald), `6` (Maximum - Purple)
  - `+1 Wide`, `+1 No Ball`, `+1 Bye`, `+1 Leg Bye`
  - `OUT / WICKET` (Opens quick modal for dismissal type, catcher/fielder, and incoming batter)
  - `Undo Ball` (Instant rollback with haptic feedback)
- Auto-prompts for:
  - Match Toss (Winner & Bat/Bowl decision)
  - Playing Openers & Opening Bowler
  - Next Bowler at the end of each over

### 3. Public Spectator Match Center (`#cricket-match`)
- Live real-time WebSocket sync (zero manual refresh needed).
- Hero live score banner: Current score, wickets, overs, CRR, Target, RRR.
- Interactive Scorecards:
  - Batting: Runs, Balls, 4s, 6s, Strike Rate, Dismissal text.
  - Bowling: Overs, Maidens, Runs, Wickets, Economy, Dots.
  - Fall of Wickets & Current Partnership tracker.
- Real-time natural text ball-by-ball commentary feed.
- **WhatsApp Share & Export**:
  - 1-Click "Copy WhatsApp Summary" formatted in WhatsApp bold markdown with live match URL.
  - 1-Click "Download Scorecard Graphic" using HTML5 Canvas for sharing directly to WhatsApp groups and social media.

### 4. Tournament Hub & Standings (`#cricket-tournament`)
- Automated Points Table with official ICC Net Run Rate (NRR) computation:
  $$\text{NRR} = \left(\frac{\text{Total Runs Scored}}{\text{Total Overs Faced}}\right) - \left(\frac{\text{Total Runs Conceded}}{\text{Total Overs Bowled}}\right)$$
  *(Treats all-out innings as the full quota of overs).*
- 🟠 **Orange Cap**: Top run-scorers with strike rates and boundary counts.
- 🟣 **Purple Cap**: Top wicket-takers with economy rates.
- **Auction Integration**: 1-Click button to import teams and acquired players from your completed Auction database directly into a tournament!

---

## 📱 PWA (Progressive Web App) Installation

The scoring module is fully installable on mobile phones:
1. Open the platform URL in **Chrome (Android)** or **Safari (iOS)**.
2. Tap the browser menu (**⋮** on Android, or Share icon on iOS).
3. Select **"Add to Home Screen"** or **"Install App"**.
4. The app will launch in fullscreen standalone mode with native app performance!

---

## 🛠️ Setup & Local Development

### Prerequisites
- Node.js 18+ (Node.js LTS portable runtime is included in the project tools)

### Environment Variables
| Variable | Description | Default |
|---|---|---|
| `PORT` | Listening port for Express & Socket.io | `4000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |

### 1. Build and Run Local Server
```bash
# Unified Build
npm run build

# Start Platform Server
npm start
```
Open **`http://localhost:4000`** in your browser.

### 2. Available Platform URL Routes
- **Auctioneer Console:** `http://localhost:4000/#admin`
- **Franchise Bidding Desk:** `http://localhost:4000/#franchise`
- **Stadium Auction Tracker:** `http://localhost:4000/#public`
- **Player Registration:** `http://localhost:4000/#register`
- **Cricket Live Scorer:** `http://localhost:4000/#cricket-scorer`
- **Cricket Match Center:** `http://localhost:4000/#cricket-match`
- **Cricket Tournament Hub:** `http://localhost:4000/#cricket-tournament`

---

## 🧪 Automated Unit Test Suite

Run the automated scoring engine unit tests verifying legal ball counts, extras, strike rotation, free hits, undo replay, and NRR math:
```bash
npx ts-node backend/src/cricketScoringEngine.test.ts
```

All 16 unit tests verify:
- Wides/No-balls do not advance legal delivery count.
- Odd runs swap striker & non-striker.
- End-of-over swaps ends.
- Free hit activates on delivery following No-Ball.
- Undo correctly restores score and batter stats.
- Accurate ICC Net Run Rate calculations.

---

## 🚀 1-Click Cloud Deployment (Render.com)

1. Double-click [`deploy_to_cloud.bat`](./deploy_to_cloud.bat) in the project folder to automatically compile, commit, and push updates to GitHub.
2. Render automatically detects commits on branch `main` and deploys live in ~1–2 minutes!
