# FKBR - Keyboard-Driven Mouse Control

A mouseless application that overlays the screen with chord coordinates, allowing you to control mouse clicks using only your keyboard. Built with Tauri, React, and TypeScript.

## Features

- **Full Screen Grid Overlay**: Displays a coordinate grid over your entire screen
- **Chord-Based Navigation**: Use 2-character coordinates to select any area on screen
- **Sub-Cell Precision**: After selecting a cell, choose from a 2x2 or 3x3 sub-grid for precise clicking
- **Left & Right Click Support**: Toggle between left and right click modes
- **Global Keyboard Shortcut**: Activate the overlay from anywhere with `Ctrl+Alt+I`
- **Transparent Overlay**: Semi-transparent background so you can see the content underneath

## Usage

### Activating the Overlay

Press `Ctrl+Alt+I` to show the overlay grid.

### Selecting a Target

1. **Enter Coordinate**: Type a 2-character coordinate (e.g., `AA`, `B3`, `XY`) to highlight a cell
2. **Select Sub-Cell**: Type a number (1-9 for 3x3 grid, 1-4 for 2x2 grid) to select the precise location within the cell
3. **Click Executes**: The mouse will move to the selected position and click

### Keyboard Controls

| Key | Action |
|-----|--------|
| `Ctrl+Alt+I` | Show/activate overlay |
| `A-Z`, `0-9` | Enter coordinate characters |
| `Tab` | Toggle between left and right click mode |
| `Backspace` | Delete last character |
| `Escape` | Clear input and reset |

### Click Modes

- **Left Click** (default): Standard left mouse button click
- **Right Click**: Right mouse button click for context menus

The current click mode is displayed at the bottom of the screen.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) package manager
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Setup

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev

# Build for production
pnpm tauri build
```

### Project Structure

```
fkbr/
├── src/                    # Frontend React/TypeScript
│   ├── lib/               # Core library modules
│   │   ├── types.ts       # Type definitions
│   │   ├── utils.ts       # Utility functions
│   │   ├── GridController.ts    # Grid management
│   │   ├── InputHandler.ts      # Keyboard input handling
│   │   └── MouseActions.ts      # Mouse action invocations
│   └── App.tsx            # Main application component
├── src-tauri/             # Backend Rust/Tauri
│   └── src/
│       ├── lib.rs         # Main library and Tauri commands
│       ├── mouse.rs       # MouseController struct
│       └── main.rs        # Application entry point
└── package.json
```

## Architecture

### Frontend (TypeScript/React)

- **GridController**: Manages the grid overlay, cell generation, and highlighting
- **InputHandler**: Handles keyboard input and coordinate parsing
- **MouseActions**: Wraps Tauri invoke calls for mouse operations

### Backend (Rust)

- **MouseController**: Encapsulates mouse operations using the `enigo` library
- **Tauri Commands**: `click_at`, `left_click`, `right_click` for mouse actions

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- [Tauri Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## License

MIT
