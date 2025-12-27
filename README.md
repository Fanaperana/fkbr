# 🎯 FKBR - F*cking Keyboard

> **"Your mouse is a crutch. Prove me wrong."**

How long can YOU go without touching your mouse? I challenge you to try **FKBR** (Freaking/F*cking Keyboard) — a desktop app that lets you click *anywhere* on your screen using only your keyboard.

No mouse. No trackpad. Just pure keyboard supremacy.

---

## 🔥 The Challenge

```
Day 1:   "This is impossible"
Day 3:   "Okay, I'm getting faster"  
Day 7:   "Wait, where's my mouse?"
Day 14:  "Mouse? Never heard of her."
```

**Track your streak. Beat your record. Flex on mouse users.**

---

## ⚡ How It Works

1. Press `Ctrl+Alt+I` → Grid overlay appears
2. Type 2-3 chars (e.g., `AA`, `B5`, `XY0`) → Cell highlights
3. Type 1-9 → Click that exact spot
4. Done. No mouse involved. 😎

```
┌─────────────────────────────────────┐
│  AA  AB  AC  AD  AE  AF  AG  AH ... │
│  BA  BB  BC  BD  BE  BF  BG  BH ... │
│  CA  CB  CC  CD  CE  CF  CG  CH ... │
│  ...                                │
│           ┌───────────┐             │
│           │ 1 │ 2 │ 3 │             │
│     [BD]  │ 4 │ 5 │ 6 │  ← subcells │
│           │ 7 │ 8 │ 9 │             │
│           └───────────┘             │
└─────────────────────────────────────┘

Type "BD5" → clicks center of cell BD
Type "BD1" → clicks top-left of cell BD
```

---

## 🎮 Controls

| Key | What it does |
|-----|--------------|
| `Ctrl+Alt+I` | Summon the grid (customizable) |
| `A-Z`, `0-9` | Type coordinates |
| `1-9` | Pick subcell & click |
| `Tab` | Cycle: Left → Right → Double click |
| `Backspace` | Undo last char |
| `Escape` | Abort mission, hide grid |

---

## 🏆 Modes

| Mode | Coordinates | Max Cells | Total Click Positions |
|------|-------------|-----------|----------------------|
| **2-Char** | `AA` to `99` | 1,296 | 11,664 |
| **3-Char** | `AA0` to `999` | 12,960 | 116,640 |

*Choose your precision. Configure in Settings.*

---

## 🚀 Installation

### Download
Grab the latest release from [Releases](https://github.com/Fanaperana/fkbr/releases).

### Build from source

```bash
# Prerequisites: Node.js 18+, pnpm, Rust

git clone https://github.com/Fanaperana/fkbr.git
cd fkbr
pnpm install
pnpm tauri build
```

---

## ⚙️ Settings

Right-click the system tray icon → **Settings**

- **Custom shortcut**: Pick your own activation combo
- **Grid density**: More cells = more precision
- **Coordinate mode**: 2-char or 3-char

---

## 🛠️ Built With

- **[Tauri](https://tauri.app/)** - Lightweight desktop framework
- **[React](https://react.dev/)** + **TypeScript** - Frontend
- **[Rust](https://www.rust-lang.org/)** - Backend & mouse control
- **[enigo](https://github.com/enigo-rs/enigo)** - Cross-platform input simulation

---

## 📁 Project Structure

```
fkbr/
├── src/                    # React/TypeScript frontend
│   ├── lib/
│   │   ├── GridController.ts    # Grid overlay logic
│   │   ├── InputHandler.ts      # Keyboard input
│   │   ├── MouseActions.ts      # Click commands
│   │   └── Settings.tsx         # Settings dialog
│   └── App.tsx
├── src-tauri/              # Rust backend
│   └── src/
│       ├── lib.rs          # Tauri commands
│       └── mouse.rs        # MouseController
└── package.json
```

---

## 🤝 Contributing

Found a bug? Want a feature? PRs welcome.

Or just star the repo and flex your mouse-free lifestyle. ⭐

---

## 📜 License

MIT — Do whatever you want.

---

<p align="center">
  <b>🐭 Mice are for clicking. Keyboards are for winners. 🏆</b>
</p>
