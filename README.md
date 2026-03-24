# BODMAS Battle

BODMAS Battle is a production-ready, mobile-style educational math game focused on mastering order of operations through timed gameplay, streaks, and leaderboard competition.

## Features

- BODMAS-based expression generator with `+`, `-`, `×`, `÷`, and brackets
- 3 difficulty modes with increasing complexity
- Timed rounds with animated progress bar and urgency colors
- Instant answer feedback and short explanation per question
- Streak system with visual effects and score bonuses
- Enter-name flow + score validation before game starts
- Global leaderboard (Top 10) with rank medals and crown for #1
- Animated UI: glassmorphism cards, gradient buttons, confetti for high scores
- Persistent best score via `localStorage`
- Optional sound effects with Web Audio fallback

## Tech Stack

- HTML5
- CSS3 (animations, responsive layout, glassmorphism)
- Vanilla JavaScript (modular frontend + API layer)
- PHP (secure score API + leaderboard endpoint)
- JSON file persistence (`data/scores.json`)

## Final Project Structure

```text
bodmas-battle/
│
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── script.js
│   └── api.js
├── assets/
│   ├── sounds/
│   └── images/
├── php/
│   ├── save_score.php
│   ├── get_leaderboard.php
│   └── config.php
├── data/
│   └── scores.json
└── README.md
```

## How to Run Locally

### Option A: Frontend only
1. Open `index.html` in browser.
2. Local gameplay works; leaderboard falls back to browser storage if backend is unavailable.

### Option B: Full stack (recommended)
1. Place project in XAMPP `htdocs` (or any PHP host directory).
2. Start Apache.
3. Open `http://localhost/bodmas-battle/`
4. Scores are stored in `data/scores.json`.

### Option C: PHP built-in server
1. `cd bodmas-battle`
2. `php -S localhost:8000`
3. Open `http://localhost:8000`

## Deployment Guide

### Frontend (Netlify / Vercel)
- Deploy project as static site.
- If PHP backend is separate, set `window.BODMAS_API_BASE_URL` before loading scripts.

### PHP Backend (000webhost / InfinityFree / Render PHP)
- Deploy `php/` and `data/` folders.
- Ensure write permissions for `data/scores.json`.
- Point frontend API base URL to deployed backend domain.

## API Summary

- `POST /php/save_score.php`
  - Body: `{ "name": "Player", "score": 90 }`
- `GET /php/get_leaderboard.php`
  - Returns top 10 scores sorted descending

## Security Basics Included

- Name sanitization (alphanumeric + `_` + `-` + spaces)
- Empty name prevention
- Score range validation to reduce spam
- Method restrictions (`GET`/`POST`/`OPTIONS`)

## Future Improvements

- User accounts and cloud database
- Seasonal leaderboards and filters
- Adaptive difficulty engine based on player performance
- Achievement badges and unlockable themes
