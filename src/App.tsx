import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Window } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";

import "./App.css";
import {
  GridConfig,
  DEFAULT_CONFIG,
  GridCell,
  getSubCellConfig,
  GridController,
  MouseActions,
  ClickType,
  getSubCellCenter,
} from "./lib";
import { SettingsDialog, SettingsManager } from "./lib/Settings";

const appWindow = new Window("main");

// Remove window decorations on focus
appWindow.listen("tauri://focus", async () => {
  await appWindow.setDecorations(false);
});

// Load and apply saved shortcut on startup
SettingsManager.getShortcut().then(async (config) => {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("update_shortcut", {
      modifiers: config.modifiers,
      key: config.key,
    });
  } catch (e) {
    console.error("Failed to load saved shortcut:", e);
  }
});

/**
 * GridCellComponent renders a single grid cell.
 */
interface GridCellProps {
  cell: GridCell;
  isActive: boolean;
  showSubCells: boolean;
  subCellGridSize: number;
}

function GridCellComponent({
  cell,
  isActive,
  showSubCells,
  subCellGridSize,
}: GridCellProps) {
  return (
    <div
      id={cell.coord}
      className={`
        absolute
        border border-dashed border-yellow-700 border-opacity-40 
        text-[cornsilk] text-xs
        flex items-center justify-center
        overflow-hidden
        bg-white bg-opacity-20
        ${isActive ? "!border-yellow-400 !border-solid z-10" : ""}
      `}
      style={{
        left: `${cell.x}px`,
        top: `${cell.y}px`,
        width: `${cell.width}px`,
        height: `${cell.height}px`,
        textShadow: "1px 0px 5px black",
      }}
    >
      {showSubCells ? (
        <div 
          className="grid w-full h-full overflow-hidden"
          style={{ gridTemplateColumns: `repeat(${subCellGridSize}, 1fr)` }}
        >
          {Array.from({ length: subCellGridSize * subCellGridSize }, (_, i) => (
            <div
              key={i}
              id={`sub-cell${i + 1}`}
              className="flex items-center justify-center border border-yellow-700 border-dashed border-opacity-20 text-[10px] leading-none"
            >
              {i + 1}
            </div>
          ))}
        </div>
      ) : (
        cell.coord
      )}
    </div>
  );
}

/**
 * InputDisplay shows the current input state and click mode.
 */
interface InputDisplayProps {
  currentInput: string[];
  clickType: ClickType;
  coordLength: number; // How many chars for coordinate (2 or 3)
}

function InputDisplay({ currentInput, clickType, coordLength }: InputDisplayProps) {
  const getClickStyle = () => {
    switch (clickType) {
      case "left":
        return { border: "border-yellow-400", text: "text-yellow-400", label: "L-CLICK" };
      case "right":
        return { border: "border-orange-400", text: "text-orange-400", label: "R-CLICK" };
      case "double":
        return { border: "border-green-400", text: "text-green-400", label: "DBL-CLICK" };
      default:
        return { border: "border-yellow-400", text: "text-yellow-400", label: "L-CLICK" };
    }
  };
  
  const style = getClickStyle();
  
  // Create placeholder string based on mode
  const placeholder = "_".repeat(coordLength);
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
      {/* Current input display */}
      <div className="bg-black bg-opacity-50 border border-yellow-700 border-opacity-40 px-4 py-2 rounded-md flex items-center gap-3">
        <span 
          className="font-mono text-xl tracking-wider"
          style={{ color: "cornsilk", textShadow: "1px 0px 5px black" }}
        >
          {currentInput.length > 0 ? currentInput.join("") : placeholder}
        </span>
        
        {/* Click mode indicator */}
        <div 
          className={`px-3 py-1 rounded border text-sm font-semibold ${style.border} ${style.text}`}
          style={{ textShadow: "1px 0px 3px black" }}
        >
          {style.label}
        </div>
      </div>
      
      {/* Help text */}
      <span 
        className="text-xs text-opacity-50"
        style={{ color: "cornsilk", opacity: 0.5 }}
      >
        Tab: cycle mode
      </span>
    </div>
  );
}

/**
 * Main App component.
 */
function App() {
  const [config, setConfig] = useState<GridConfig>(DEFAULT_CONFIG);
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [currentInput, setCurrentInput] = useState<string[]>([]);
  const [clickType, setClickType] = useState<ClickType>("left");
  const [activeCoord, setActiveCoord] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Load saved grid config on startup
  useEffect(() => {
    SettingsManager.getGridConfig().then(setConfig);
  }, []);

  // Listen for settings open event from system tray
  useEffect(() => {
    const unlisten = listen("open-settings", () => {
      setShowSettings(true);
    });
    
    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  // Grid controller instance
  const gridController = useMemo(() => new GridController(config), [config]);

  // Calculate and update grid on resize
  const recalculateGrid = useCallback(() => {
    gridController.calculateCells(window.innerWidth, window.innerHeight);
    setGridCells(gridController.getCells());
  }, [gridController]);

  useEffect(() => {
    recalculateGrid();
    window.addEventListener("resize", recalculateGrid);
    return () => window.removeEventListener("resize", recalculateGrid);
  }, [recalculateGrid]);

  // Get coordinate length based on config mode
  const coordLength = config.coordinateMode === "2-char" ? 2 : 3;
  const maxInputLength = coordLength + 1; // Coord + subcell

  // Handle keyboard input
  const handleKeyEvent = useCallback(
    (event: KeyboardEvent) => {
      event.preventDefault();

      // Escape clears input and hides overlay
      if (event.key === "Escape") {
        setCurrentInput([]);
        setActiveCoord(null);
        appWindow.hide();
        return;
      }

      // Backspace removes last character
      if (event.key === "Backspace") {
        setCurrentInput((prev) => {
          const newInput = prev.slice(0, -1);
          if (newInput.length < coordLength) {
            setActiveCoord(null);
          }
          return newInput;
        });
        return;
      }

      // Tab is handled in keydown event
      if (event.key === "Tab") {
        return;
      }

      // Max input length reached
      if (currentInput.length >= maxInputLength) return;

      // Accept keys
      if (!event.ctrlKey || !event.altKey) {
        const key = event.key.toUpperCase();
        
        if (config.coordinateMode === "2-char") {
          // 2-char mode: 2 alphanumeric for coord + 1 digit (1-9) for subcell
          if (currentInput.length < coordLength) {
            if (/^[A-Z0-9]$/.test(key)) {
              setCurrentInput((prev) => {
                const newInput = [...prev, key];
                // When we have full coord, highlight the cell
                if (newInput.length === coordLength) {
                  const coord = newInput.join("");
                  setActiveCoord(coord);
                }
                return newInput;
              });
            }
          } else if (currentInput.length === coordLength) {
            // Subcell: accept 1-9 only
            if (/^[1-9]$/.test(key)) {
              setCurrentInput((prev) => [...prev, key]);
            }
          }
        } else {
          // 3-char mode: 2 alphanumeric + 1 digit for coord + 1 digit (1-9) for subcell
          if (currentInput.length < 2) {
            // First 2 chars: accept A-Z and 0-9
            if (/^[A-Z0-9]$/.test(key)) {
              setCurrentInput((prev) => [...prev, key]);
            }
          } else if (currentInput.length === 2) {
            // 3rd char (part of coord): accept 0-9 only
            if (/^[0-9]$/.test(key)) {
              setCurrentInput((prev) => {
                const newInput = [...prev, key];
                // When we have full coord, highlight the cell
                const coord = newInput.join("");
                setActiveCoord(coord);
                return newInput;
              });
            }
          } else if (currentInput.length === coordLength) {
            // Subcell: accept 1-9 only
            if (/^[1-9]$/.test(key)) {
              setCurrentInput((prev) => [...prev, key]);
            }
          }
        }
      }
    },
    [currentInput, coordLength, maxInputLength, config.coordinateMode]
  );

  useEffect(() => {
    // Use keydown for Tab to prevent default browser behavior
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault();
        // Cycle through: left -> right -> double -> left
        setClickType((prev) => {
          switch (prev) {
            case "left": return "right";
            case "right": return "double";
            case "double": return "left";
            default: return "left";
          }
        });
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyEvent);
    };
  }, [handleKeyEvent]);

  // Handle sub-cell selection and click execution
  const subCellTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if we have a complete coordinate + subcell
    const hasFullInput = currentInput.length === maxInputLength && activeCoord;
    
    if (hasFullInput) {
      const cellElement = document.getElementById(activeCoord);
      if (!cellElement) return;

      const rect = cellElement.getBoundingClientRect();
      const subCellIndex = parseInt(currentInput[coordLength], 10);
      const { columns } = getSubCellConfig(rect.width, rect.height);

      const { x, y } = getSubCellCenter(rect, subCellIndex, columns);

      // Execute the click
      const executeClick = async () => {
        if (clickType === "left") {
          await MouseActions.leftClick(x, y);
        } else if (clickType === "right") {
          await MouseActions.rightClick(x, y);
        } else if (clickType === "double") {
          await MouseActions.doubleClick(x, y);
        }
      };

      executeClick().finally(() => {
        setCurrentInput([]);
        setActiveCoord(null);
      });
    }

    // Clean up sub-cell display after timeout (when coord is complete but no subcell yet)
    if (currentInput.length === coordLength && activeCoord) {
      subCellTimeoutRef.current = window.setTimeout(() => {
        setCurrentInput([]);
        setActiveCoord(null);
      }, 5000);
    }

    return () => {
      if (subCellTimeoutRef.current) {
        clearTimeout(subCellTimeoutRef.current);
      }
    };
  }, [currentInput, activeCoord, clickType, coordLength, maxInputLength]);

  // Determine sub-cell grid size for active cell
  const getSubCellGridSize = useCallback((coord: string) => {
    const cell = gridCells.find((c) => c.coord === coord);
    if (!cell) return 3;
    const { columns } = getSubCellConfig(cell.width, cell.height);
    return columns;
  }, [gridCells]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-10 overflow-hidden">
      {/* Grid container with absolute positioned cells */}
      <div className="relative w-screen h-screen">
        {gridCells.map((cell, index) => {
          const isActive = activeCoord === cell.coord;
          // Show subcells when we have a complete coordinate
          const showSubCells = isActive && currentInput.length >= coordLength;
          const subCellGridSize = showSubCells ? getSubCellGridSize(cell.coord) : 3;

          return (
            <GridCellComponent
              key={index}
              cell={cell}
              isActive={isActive}
              showSubCells={showSubCells}
              subCellGridSize={subCellGridSize}
            />
          );
        })}
      </div>
      <InputDisplay currentInput={currentInput} clickType={clickType} coordLength={coordLength} />
      <SettingsDialog 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        onGridConfigChange={setConfig}
      />
    </div>
  );
}

export default App;
