# Airplay — arcade plane game for Telegram

A casual arcade game that runs as a Telegram Mini App / PWA: fly a plane, dodge obstacles, collect coins, buy new planes and power-ups in the shop. Includes a 2D canvas version and an experimental 3D mode.

## Features

- Endless arcade gameplay with score, best score and lives
- Coins, a shop with unlockable planes and power-ups
- Menu, pause and game-over screens
- Fullscreen portrait PWA manifest for Telegram

## Files

```
index.html   — entry point
game.js      — 2D canvas game
game3d.js    — 3D mode
styles.css   — UI styles
manifest.json
```

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Docs

- [`BOTFATHER_SETUP.md`](BOTFATHER_SETUP.md) — registering the game with @BotFather
- [`MINI_APPS_INTEGRATION.md`](MINI_APPS_INTEGRATION.md) — Telegram Mini Apps integration
- [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md), [`TESTING_GUIDE.md`](TESTING_GUIDE.md)
- [`IMPROVEMENTS_AND_MONETIZATION.md`](IMPROVEMENTS_AND_MONETIZATION.md) — roadmap and monetisation ideas
