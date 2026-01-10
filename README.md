# 🎲 Universal Game Night Scorer

A lightweight, offline-capable web application for tracking scores in various tabletop games. Built as a **single-file solution** (HTML/JS/CSS), it runs directly in any browser without a backend server or internet connection.

## 🌟 Key Features

* **Zero Install:** Runs in any modern browser (Mobile & Desktop).
* **Offline First:** State is saved automatically to your device's `localStorage`. Refreshing the page or closing the browser does not lose your game.
* **Smart Undo:** A robust undo stack handles multi-phase turns (e.g., backing out of a score submission returns you to the bidding phase).
* **Dealer Tracking:** Automatically tracks and highlights the Dealer (or Starter) for each round.
* **Leaderboard:** Persistent tracking of wins across game sessions.
* **Wake Lock:** Prevents your phone screen from dimming while the app is open.

---

## 🎮 Supported Games & Rules

### 1. Shanghai (Shang-Hi / California Rummy)
* **Type:** Low Score Wins.
* **Phases:** Scoring only.
* **Contracts:** Pre-loaded with standard 10 rounds (e.g., "2 Sets of 3", "1 Set, 1 Run", etc.).
* **Team Play:** Supports 2-player teams. Both partners share a score and goals.
* **Randomize Goals:** Optional setting to shuffle the contract order. In Team Mode, both partners receive the *same* randomized goal for that round.

### 2. Spades
* **Type:** Target Score (default 500).
* **Phases:** Bidding -> Trick Taking.
* **Scoring Logic:**
    * **Bags:** Tracks overtricks (sandbags). Accumulating 10 bags results in a -100 point penalty.
    * **Nil / Blind Nil:** Special buttons for 0 bids. Nil = 100/-100. Blind Nil = 200/-200.
    * **Teams:** Bids and tricks are combined for the partnership.
* **Visuals:** History table displays a detailed "Stack" view showing `Bid / Actual` on the left and the `Round Score` on the right.

### 3. Old Hell (Oh Hell / Up and Down the River)
* **Type:** High Score Wins.
* **Phases:** Bidding -> Scoring.
* **Hand Size:** Automatically calculates hand size based on player count (e.g., 52 cards / 4 players = 13 rounds down to 1).
* **"The Hook":** Enforces the rule that total bids cannot equal the number of cards dealt (Dealer is "screwed").
* **Trump:** Tracks the Trump suit for each round in the history.
* **Scoring:** Binary input (Made/Missed). 10 + Bid for making it; 0 for missing.

### 4. Hearts
* **Type:** Low Score Wins.
* **Target:** Game ends when a player hits 100 points.
* **Validation:** Ensures round scores sum to **26** (or **0** if shooting the moon).
* **Passing:** Displays the passing direction for the current round (Left, Right, Across, Hold).
* **Moon Button:** A "Moon" helper sets the shooter to 0 and all others to 26 automatically.

### 5. Mexican Train Dominoes
* **Type:** Low Score Wins.
* **Rounds:** Counts down from Double-12 to Double-0.
* **Starter:** Allows manual selection of who played the "Starter" domino (displayed visually as a Domino SVG).
* **Validation:** Requires exactly one player to have a score of 0 (the winner of the round).

### 6. Rummikub
* **Type:** High Score Wins.
* **Scoring Logic:** The winner (0) receives the **sum** of all other players' tile values as a positive score. Losers receive their tile values as negative points.

### 7. Triominos
* **Type:** Low Score Wins (Golf style).
* **Validation:** Enforces strictly one winner (0 score) per round.

### 8. Qwirkle
* **Type:** High Score Wins.
* **Helpers:** Quick-add buttons for common scores:
    * **Q:** +6 points.
    * **QQ:** +12 points (Double Qwirkle).
    * **Finish:** +6 points (End game bonus).

---

## 🚀 How to Host & Play

### Option 1: GitHub Pages (Recommended)
1.  Fork this repository.
2.  Go to **Settings > Pages**.
3.  Select `main` branch and `/root` folder.
4.  Your app will be live at `https://your-username.github.io/your-repo-name/`.

### Option 2: Run Locally
Simply double-click the `index.html` file on your computer. To get it on your phone without hosting, you can email the file to yourself, though hosting is preferred for local storage persistence.

### Option 3: Netlify Drop
Drag and drop the folder containing `index.html` into [Netlify Drop](https://app.netlify.com/drop) for an instant secure URL.

---

## 🛠️ Technical Details

* **Stack:** Vanilla HTML5, CSS3, ES6 JavaScript.
* **Architecture:**
    * `GameBase`: Abstract base class handling history stack, snapshots, and common validation.
    * `Game Classes`: Individual classes (e.g., `SpadesGame`) extend `GameBase` to implement specific scoring rules and UI phases.
    * `State Management`: A global `state` object is serialized to `localStorage` on every transaction.
* **CSS Variables:** Theming is handled via CSS variables (`--primary`, `--accent`), allowing the color scheme to adapt instantly when switching game types.
