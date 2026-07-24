# Tic Tac Toe 🎓 — Chalkboard Edition

Pure **HTML + CSS + JavaScript** — teen alag files me clean tarike se likha gaya
(no framework, no build step, no external JS library). Chalkboard-classroom
theme wala tic-tac-toe jisme hand-drawn chalk animation, confetti, aur smart
computer opponent hai.

## 📁 File structure
```
tic-tac-toe/
├── TicTacToe.html   # Structure / markup
├── TicTacToe.css    # Chalkboard theme, animations, responsive layout
└── TicTacToe.js     # Game logic, AI (minimax), sound, confetti, save/load
```
Teeno file **same folder** me rakhna zaroori hai — HTML andar se CSS aur JS ko
relative path (`TicTacToe.css`, `TicTacToe.js`) se load karta hai.

## ▶️ Kaise chalayein
`TicTacToe.html` ko double-click karo, seedha browser me khul jayega. Koi
installation, server, ya internet zaroori nahi (Google Fonts ke alawa, jo
optional hai — fonts na load ho to bhi game chalega, bas font fallback ho jayega).

## ✨ Features

**Game modes**
- 👥 **Two Players** — same device pe baari-baari khelo, dono ke naam customize kar sakte ho
- 🤖 **Vs Computer** — 3 difficulty levels:
  - Easy — random moves
  - Medium — jeetne/bachne ka basic logic + kabhi-kabhi random
  - Hard — unbeatable minimax AI (best case draw hi kar sakte ho)

**Interactive touches**
- Hand-drawn chalk animation — X aur O jaise koi chalk se abhi-abhi likh raha ho
- Jeetne wali line par glowing animated underline
- Jeetne par color-matched **confetti burst** 🎉
- Har move / win / draw par subtle sound (Web Audio se generate — koi audio file nahi chahiye), mute button available
- Computer ke turn par "thinking..." dots animation
- Board ke andar ambient chalk-dust particles (subtle atmosphere)
- Keyboard-friendly: Arrow keys se cell-to-cell navigate karo, Enter/Space se mark place karo
- Scores, player names, mode, aur difficulty — sab **localStorage** me save hote hain, browser band karke wapas aao to bhi yaad rahega

## 🕹️ Controls
- Cell par click/tap karo mark place karne ke liye
- Keyboard: Tab se cell focus karo, Arrow keys se move, Enter/Space se place
- **New Round** — score maintain rehta hai, agla round shuru (starter alternate hota hai fairness ke liye)
- **Reset Match** — sab scores clear karke fresh start
- 🔊/🔇 icon — sound on/off

## 🎨 Customize karna ho to
- Colors: `TicTacToe.css` ke top me `:root{ }` ke andar CSS variables hain
  (`--chalk-coral`, `--chalk-teal`, `--chalk-yellow`, `--wood`, etc.) — inhe
  badal ke poora theme change kar sakte ho
- Fonts: HTML ke `<head>` me Google Fonts link hai (`Caveat`, `Space Grotesk`, `JetBrains Mono`)
- AI difficulty logic: `TicTacToe.js` me `getCPUMove()` function

## 🌐 Browser support
Modern browsers (Chrome, Edge, Safari, Firefox) — desktop, mobile, tablet sab
pe fully responsive aur touch-friendly hai.

---

## 🚀 GitHub par push kaise karo

### 1. Local repo banao
```bash
cd tic-tac-toe
git init
git add .
git commit -m "Initial commit: Tic Tac Toe chalkboard edition"
```

### 2. GitHub par naya repository banao
- github.com → **New repository** → naam do (e.g. `tic-tac-toe`) → **Create repository**
  (README add mat karo, wo already local hai)

### 3. Connect aur push
```bash
git branch -M main
git remote add origin https://github.com/<your-username>/tic-tac-toe.git
git push -u origin main
```

### 4. Future changes
```bash
git add .
git commit -m "describe your change here"
git push
```

### 5. Free hosting — GitHub Pages
1. Repo → **Settings** → **Pages**
2. Source: **Deploy from a branch** → Branch: `main`, folder: `/ (root)` → **Save**
3. 1-2 min baad live: `https://<your-username>.github.io/tic-tac-toe/TicTacToe.html`

   (Tip: agar chaho to `TicTacToe.html` ko `index.html` rename kar do taaki link
   seedha `https://<your-username>.github.io/tic-tac-toe/` ho jaye)

### 6. Alternative — Netlify / Vercel
- Netlify: repo import karo, build command khaali chodo, publish directory `/`
- Vercel: repo import karo, framework "Other" select karo — static site detect ho jayega
