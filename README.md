# 🍉 WaterMelon Survival

A **Terraria-inspired 2D side-scrolling survival browser game** built with **Phaser 3 + TypeScript + Vite**.

Manage your Water, Food, Energy, Health, and Money to survive as long as possible in a handcrafted city.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) 18+

### Install & Run

```bash
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| `A` / `←` | Move left |
| `D` / `→` | Move right |
| `W` / `↑` / `Space` | Jump |
| `E` | Interact with nearby NPC |
| `ESC` | Close dialogue |
| **Mouse** | Click NPCs, click dialogue choices |

---

## 📁 Project Structure

```
src/
  scenes/       BootScene, MenuScene, GameScene, UIScene, GameOverScene, LeaderboardScene
  entities/     Player, NPC
  systems/      StatsSystem, EventSystem, DialogueSystem, ScoreSystem
  ui/           HUD, DialogueBox, Buttons
  data/         npcData, dialogueData, eventsData
  utils/        helpers (clamp, lerpColor, leaderboard localStorage)
  tests/        game.test.ts (Vitest unit tests)
  main.ts       Phaser 3 game entry point
index.html
```

---

## 👥 NPCs

| NPC | Location | Function |
|-----|----------|----------|
| 🧓 Elder Melon | Near start | Tutorial & guidance |
| 💧 Aqua | Water Station | Buy water (₹5–₹20) |
| 🛒 Penny | Shop | Buy food & energy bars |
| ⚙️ Grit | Work Area | Earn money by working |
| 👧 Tiny | Park | Secrets & hints |
| 🤖 Sage | Town Hall | AI analysis & strategy |

---

## ⚡ Random Events

Events trigger automatically and affect stat drain rates:

| Event | Effect | Duration |
|-------|--------|----------|
| 🔥 Heatwave | Water drains 2× faster | 45s |
| 💧 Water Shortage | Water prices +150% | 60s |
| 📈 Price Surge | All prices +40% | 30s |
| ⚡ Energy Blackout | Energy drains 2× faster | 40s |

---

## 🏆 Scoring

```
Score = (survivalMinutes × 100) + (health × 10) + money
```

Scores are saved to **localStorage** (top 10 leaderboard).

---

## 🛠 Scripts

```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Build for production → dist/
npm run preview   # Preview production build
npm run test      # Run Vitest unit tests
```

---

## 🧪 Tests

Run unit tests:
```bash
npm test
```

Test coverage:
- **StatsSystem**: drain per tick, clamping, health dependency, drain modifiers
- **ScoreSystem**: score formula, save/load, ranking
- **EventSystem**: activation, modifiers, duration, cleanup

### Manual Test Checklist

- [ ] Run `npm run dev` → game loads at localhost:5173
- [ ] Enter nickname → click Start Surviving
- [ ] Player moves with A/D, jumps with W
- [ ] Walk near NPC → `[E] Talk` label appears
- [ ] Press E → dialogue box slides up
- [ ] Select a purchase choice → stat changes + floating text
- [ ] Select work → money gained, energy lost
- [ ] Wait ~30s → stat bars visibly drain with smooth animation
- [ ] Let health drop below 30% → red vignette pulses
- [ ] Wait ~90s → random event triggers with banner
- [ ] Let health hit 0 → GameOver scene appears
- [ ] Score saved → Leaderboard shows entry
- [ ] Click Play Again → returns to Menu

---

## 🌍 Deploy

### Vercel / Netlify (recommended)

```bash
npm run build
# Upload dist/ folder to Vercel or Netlify
```

### GitHub Pages

```bash
npm run build
# Set base: './' in vite.config.ts (already configured)
# Push dist/ to gh-pages branch
```

---

## 🎨 Assets

All game assets are **generated programmatically** using Phaser's Graphics API — no external image files required. This means zero asset loading errors and instant setup.
