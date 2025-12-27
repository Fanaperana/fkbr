import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Window } from "@tauri-apps/api/window";

import "./App.css";
import {
  Config,
  DEFAULT_CONFIG,
  GridCell,
  getSubCellConfig,
  GridController,
  MouseActions,
  ClickType,
  getSubCellCenter,
} from "./lib";

const appWindow = new Window("main");

// Remove window decorations on focus
appWindow.listen("tauri://focus", async () => {
  await appWindow.setDecorations(false);
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
        border-r border-b border-dashed border-yellow-700 border-opacity-40 
        text-[cornsilk] text-xs
        flex items-center justify-center
        transition-colors
        !bg-white !bg-opacity-20
        ${isActive ? "border-t border-l !border-yellow-400" : ""}
      `}
      style={{
        width: `${cell.width}px`,
        height: `${cell.height}px`,
        textShadow: "1px 0px 5px black",
      }}
    >
      {showSubCells ? (
        <div 
          className="grid w-full h-full"
          style={{ gridTemplateColumns: `repeat(${subCellGridSize}, 1fr)` }}
        >
          {Array.from({ length: subCellGridSize * subCellGridSize }, (_, i) => (
            <div
              key={i}
              id={`sub-cell${i + 1}`}
              className="flex items-center justify-center border-b border-r border-yellow-700 border-dashed border-opacity-20"
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
}

function InputDisplay({ currentInput, clickType }: InputDisplayProps) {
  const isLeftClick = clickType === "left";
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
      {/* Current input display */}
      <div className="bg-black bg-opacity-50 border border-yellow-700 border-opacity-40 px-4 py-2 rounded-md flex items-center gap-3">
        <span 
          className="font-mono text-xl tracking-wider"
          style={{ color: "cornsilk", textShadow: "1px 0px 5px black" }}
        >
          {currentInput.length > 0 ? currentInput.join("") : "_ _"}
        </span>
        
        {/* Click mode indicator */}
        <div 
          className={`
            px-3 py-1 rounded border text-sm font-semibold
            ${isLeftClick 
              ? "border-yellow-400 text-yellow-400" 
              : "border-orange-400 text-orange-400"
            }
          `}
          style={{ textShadow: "1px 0px 3px black" }}
        >
          {isLeftClick ? "L-CLICK" : "R-CLICK"}
        </div>
      </div>
      
      {/* Help text */}
      <span 
        className="text-xs text-opacity-50"
        style={{ color: "cornsilk", opacity: 0.5 }}
      >
        Tab: toggle
      </span>
    </div>
  );
}

/**
 * Main App component.
 */
function App() {
  const [config] = useState<Config>(DEFAULT_CONFIG);
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [gridDimensions, setGridDimensions] = useState({ columns: 0, rows: 0 });
  const [currentInput, setCurrentInput] = useState<string[]>([]);
  const [clickType, setClickType] = useState<ClickType>("left");
  const [activeCoord, setActiveCoord] = useState<string | null>(null);

  // Grid controller instance
  const gridController = useMemo(() => new GridController(config), [config]);

  // Calculate and update grid on resize
  const recalculateGrid = useCallback(() => {
    gridController.calculateCells(window.innerWidth, window.innerHeight);
    setGridCells(gridController.getCells());
    setGridDimensions(gridController.getDimensions());
  }, [gridController]);

  useEffect(() => {
    recalculateGrid();
    window.addEventListener("resize", recalculateGrid);
    return () => window.removeEventListener("resize", recalculateGrid);
  }, [recalculateGrid]);

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
          if (newInput.length < 2) {
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

      // Max input length is 3
      if (currentInput.length >= 3) return;

      // Accept alphanumeric keys
      if (!event.ctrlKey || !event.altKey) {
        const key = event.key.toUpperCase();
        if (/^[A-Z0-9]$/.test(key)) {
          setCurrentInput((prev) => {
            const newInput = [...prev, key];

            // When we have 2 characters, highlight the cell
            if (newInput.length === 2) {
              const coord = newInput.join("");
              setActiveCoord(coord);
            }

            return newInput;
          });
        }
      }
    },
    [currentInput]
  );

  useEffect(() => {
    // Use keydown for Tab to prevent default browser behavior
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault();
        setClickType((prev) => (prev === "left" ? "right" : "left"));
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
    if (currentInput.length === 3 && activeCoord) {
      const cellElement = document.getElementById(activeCoord);
      if (!cellElement) return;

      const rect = cellElement.getBoundingClientRect();
      const subCellIndex = parseInt(currentInput[2], 10);
      const { columns } = getSubCellConfig(rect.width, rect.height);

      const { x, y } = getSubCellCenter(rect, subCellIndex, columns);

      // Execute the click
      const executeClick = async () => {
        if (clickType === "left") {
          await MouseActions.leftClick(x, y);
        } else {
          await MouseActions.rightClick(x, y);
        }
      };

      executeClick().finally(() => {
        setCurrentInput([]);
        setActiveCoord(null);
      });
    }

    // Clean up sub-cell display after timeout
    if (currentInput.length === 2) {
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
  }, [currentInput, activeCoord, clickType]);

  // Determine sub-cell grid size for active cell
  const getSubCellGridSize = useCallback((coord: string) => {
    const cell = gridCells.find((c) => c.coord === coord);
    if (!cell) return 3;
    const { columns } = getSubCellConfig(cell.width, cell.height);
    return columns;
  }, [gridCells]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-10">
      <div
        className="grid gap-0"
        style={{
          gridTemplateColumns: `repeat(${gridDimensions.columns}, minmax(0, 1fr))`,
          width: "100vw",
          height: "100vh",
        }}
      >
        {gridCells.map((cell, index) => {
          const isActive = activeCoord === cell.coord;
          const showSubCells = isActive && currentInput.length >= 2;
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
      <InputDisplay currentInput={currentInput} clickType={clickType} />
    </div>
  );
}

export default App;
