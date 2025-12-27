# FKBR - Copilot Instructions

## Project Overview

FKBR (F*cking Keyboard) is a mouseless desktop application that enables keyboard-driven mouse control. Built with Tauri (Rust backend) + React/TypeScript frontend.

## Tech Stack

- **Frontend**: React 18+, TypeScript, Tailwind CSS, Vite
- **Backend**: Rust, Tauri v2
- **Input Simulation**: enigo crate
- **Storage**: tauri-plugin-store
- **Shortcuts**: tauri-plugin-global-shortcut

## Semantic Versioning

This project follows [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH (e.g., 1.2.3)
```

### Version Bumping Rules

- **MAJOR** (1.x.x → 2.0.0): Breaking changes, incompatible API changes
- **MINOR** (1.1.x → 1.2.0): New features, backward compatible
- **PATCH** (1.1.1 → 1.1.2): Bug fixes, backward compatible

### Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature (bumps MINOR)
- `fix`: Bug fix (bumps PATCH)
- `docs`: Documentation only
- `style`: Formatting, no code change
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance tasks
- `build`: Build system changes
- `ci`: CI configuration

**Breaking Changes:** Add `!` after type or `BREAKING CHANGE:` in footer (bumps MAJOR)

```bash
# Examples
feat(grid): add 3-char coordinate mode
fix(click): correct subcell position calculation
feat!: redesign settings API
docs: update README with challenge messaging
```

### Versioning Files

Update version in these files when releasing:
1. `package.json` - `"version": "x.x.x"`
2. `src-tauri/Cargo.toml` - `version = "x.x.x"`
3. `src-tauri/tauri.conf.json` - `"version": "x.x.x"`

## Project Structure

```
fkbr/
├── src/                        # React/TypeScript frontend
│   ├── lib/
│   │   ├── types.ts            # Type definitions & config
│   │   ├── utils.ts            # Grid calculations, coordinates
│   │   ├── GridController.ts   # Grid overlay management
│   │   ├── InputHandler.ts     # Keyboard input handling
│   │   ├── MouseActions.ts     # Tauri invoke wrappers
│   │   └── Settings.tsx        # Settings dialog
│   └── App.tsx                 # Main application component
├── src-tauri/                  # Rust backend
│   └── src/
│       ├── lib.rs              # Tauri commands & app setup
│       ├── mouse.rs            # MouseController (enigo)
│       └── main.rs             # Entry point
├── .github/
│   └── copilot-instructions.md # This file
└── README.md
```

## Development Guidelines

### Code Style

**TypeScript:**
- Use functional components with hooks
- Export types/interfaces from `types.ts`
- Use JSDoc comments for public functions
- Prefer `const` over `let`

**Rust:**
- Use `///` doc comments for public items
- Use `//!` for module-level docs
- Handle errors with `Result<T, String>`
- Use descriptive error messages

### Adding New Features

1. Create GitHub issue describing the feature
2. Branch from `master` (or work on master for small changes)
3. Implement with proper comments
4. Update README if user-facing
5. Commit with conventional commit message
6. Reference issue in commit: `Closes #XX`

### Testing

```bash
# Run in development
pnpm tauri dev

# Build for production
pnpm tauri build

# Build for Linux (via WSL)
wsl bash -c "cd /mnt/d/CODING/fkbr && pnpm tauri build"
```

## Key Concepts

### Coordinate System

- **2-char mode**: AA-99 (1,296 cells × 9 subcells = 11,664 positions)
- **3-char mode**: AA0-999 (12,960 cells × 9 subcells = 116,640 positions)

### Click Flow

1. User presses activation shortcut (Ctrl+Alt+I)
2. Grid overlay appears on screen
3. User types coordinate (e.g., "BD")
4. Cell highlights, shows subcell grid
5. User types subcell (1-9)
6. Click executes at center-weighted random position
7. Overlay hides

### Tauri Commands

```rust
// Available commands (lib.rs)
click_at(x, y, click_type)
left_click(x, y)
right_click(x, y)
double_click(x, y)
scroll_at(x, y, amount)
drag_start(x, y)
drag_end(x, y)
update_shortcut(modifiers, key)
open_settings()
```

## Future Features

- [ ] Multi-monitor support
- [ ] Custom grid colors/themes
- [ ] Drag-and-drop mode
- [ ] Quick actions (scroll, drag presets)
- [ ] Accessibility improvements
- [ ] macOS/Linux full support

## Resources

- [Tauri v2 Docs](https://v2.tauri.app/)
- [enigo Crate](https://docs.rs/enigo)
- [React Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
 