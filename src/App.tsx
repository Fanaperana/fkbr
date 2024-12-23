import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Window } from "@tauri-apps/api/window"
import "./App.css";
import { Config, DEFAULT_CONFIG, GridCell } from "./lib/types";
import { calculateIdealCellSize, generateCoordinate, usedCoordinates } from "./lib/utils";
import { register } from "@tauri-apps/plugin-global-shortcut";
// import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  restoreStateCurrent,
  StateFlags,
} from '@tauri-apps/plugin-window-state';

const appWindow = new Window('main');

// async function initShotcut() {
//   await register('CommandOrControl+Alt+I', () => {
//     console.log("SHORTCUT TRIGGERED");
//     appWindow.show();
//   })
// }

appWindow.listen('tauri://focus', async () => {
  await appWindow.setDecorations(false);
});

await register('CommandOrControl+Alt+I', async () => {
  console.log("SHORTCUT TRIGGERED");
  // Ensure the window is visible and focused
  // await appWindow.show();
  // await appWindow.setDecorations(false);
  // // await appWindow.setFocus();
  // // await appWindow.setFullscreen(true);
  // // await appWindow.setAlwaysOnTop(true);
  // // await getCurrentWindow().show();
  // // await getCurrentWindow().setFullscreen(true);
  // // await getCurrentWindow().setAlwaysOnTop(true);

  // // Add a small delay to ensure the window system processes the request
  // setTimeout(async () => {
  //   await appWindow.setFocus();
  //   // await getCurrentWindow().setFocus();
  // }, 100);
  restoreStateCurrent(StateFlags.ALL);
})

function App() {
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [config] = useState<Config>(DEFAULT_CONFIG);
  const [gridDimensions, setGridDimensions] = useState({ columns: 0, rows: 0 });
  const [currentInput, setCurrentInput] = useState<string[]>([]);

  useEffect(() => {
    const calculateGridCells = () => {
      // Clear used coordinates when recalculating grid
      usedCoordinates.clear();
      
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // Calculate ideal cell size based on screen dimensions
      const idealCellSize = calculateIdealCellSize(screenWidth, screenHeight, config);

      // Calculate grid dimensions
      const columns = Math.floor(screenWidth / idealCellSize);
      const rows = Math.floor(screenHeight / idealCellSize);

      // Calculate actual cell size to fill screen
      const cellWidth = Math.floor(screenWidth / columns);
      const cellHeight = Math.floor(screenHeight / rows);

      setGridDimensions({ columns, rows });

      const cells: GridCell[] = [];

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
          const coord = generateCoordinate(i, j, columns);
          
          cells.push({
            coord,
            x: j * cellWidth,
            y: i * cellHeight,
            width: cellWidth,
            height: cellHeight,
            isHighlighted: false
          });
        }
      }
      setGridCells(cells);
    };

    calculateGridCells();

    window.addEventListener('resize', calculateGridCells);
    return () => window.removeEventListener('resize', calculateGridCells);
  }, [config.minCellSize, config.maxCellSize]);

  const highlightCell = (coord: string) => {
    setGridCells(cells => 
      cells.map(cell => ({
        ...cell,
        isHighlighted: cell.coord.toUpperCase() === coord.toUpperCase()
      }))
    );
    
    // Reset highlight after 1 second
    setTimeout(() => {
      setGridCells(cells => 
        cells.map(cell => ({
          ...cell,
          isHighlighted: false
        }))
      );
    }, 1000);
  };

  
  const handleKeyEvent = (event: KeyboardEvent) => {
    event.preventDefault();
    console.log('event', event);

    if (event.key === 'Escape') {
      setCurrentInput([]);
      return;
    }
    
    if (event.key === 'Backspace') {
      setCurrentInput(prev => prev.slice(0, -1));
      return;
    }

    if (currentInput.length >= 3) return;

    if (!event.ctrlKey || !event.altKey) {
      const key = event.key.toUpperCase();
      if (/^[A-Z0-9]$/.test(key)) {
        setCurrentInput(prev => {
          const newInput = [...prev, key];
          if (newInput.length === 2) {
            highlightCell(newInput.join(''));
          }
          return newInput;
        });
      }
    }
  }

  useEffect(()=> {    
    window.addEventListener('keyup', handleKeyEvent);    
    return () => window.removeEventListener('keyup', handleKeyEvent)
  }, [currentInput]);

  useEffect(()=>{
    if (currentInput.length >= 2) {      
      const theCell = document.getElementById(`${currentInput.slice(0, 2).join('').toUpperCase()}`);
      // console.log(theCell, `${currentInput.join('').toUpperCase()}`);

      if (theCell) {
        // Get cell dimensions
        const rect = theCell.getBoundingClientRect();
        const originalContent = theCell.innerHTML;
        theCell.innerHTML = '';

        // Create sub cells based on cell dimensions
        if (rect.width < 50 && rect.height < 50) {
          // Create 2x2 grid
          const grid = document.createElement('div');
          grid.className = 'grid w-full h-full grid-cols-2';
          
          for (let i = 1; i <= 4; i++) {
            const subCell = document.createElement('div');
            subCell.className = 'flex items-center justify-center border-b border-r border-yellow-700 border-dashed border-opacity-20';
            subCell.id = `sub-cell${i}`;
            subCell.textContent = i.toString();
            grid.appendChild(subCell);
          }
          
          theCell.appendChild(grid);
        } else {
          // Create 3x3 grid
          const grid = document.createElement('div');
          grid.className = 'grid w-full h-full grid-cols-3';
          
          for (let i = 1; i <= 9; i++) {
            const subCell = document.createElement('div');
            subCell.className = 'flex items-center justify-center border-b border-r border-yellow-700 border-dashed border-opacity-20';
            subCell.id = `sub-cell${i}`;
            subCell.textContent = i.toString();
            grid.appendChild(subCell);
          }
          
          theCell.appendChild(grid);
        }
      
        theCell.classList.add('border-t','border-l','!border-yellow-400');

        // Function to restore original state
        const restoreCell = () => {
          theCell.innerHTML = originalContent;
          theCell.classList.remove('border-t','border-l','!border-yellow-400');
        };

        // Find subcell by getting the third element of keyboard input
        if (currentInput.length === 3) {
          
          const subCellGrid = document.getElementById(`sub-cell${currentInput[currentInput.length - 1]}`);
          if (subCellGrid) {
            console.log(subCellGrid);
            const clickMode = async (x: number, y: number) => {
              await invoke('click_here', {
                x: Math.floor(x), 
                y: Math.floor(y)
              });
              console.log('clicked', x, y);
            }

            const subCoord = subCellGrid.getBoundingClientRect();
            const [x, y] = [(subCoord.x + (subCoord.width / 2)), (subCoord.y + (subCoord.height / 2))];

            clickMode(x, y).finally(() => {
              setCurrentInput([]);
            });
          }
          
        }

        // Cleanup when currentInput changes or after timeout
        const timeoutId = setTimeout(restoreCell, 5000);
      
        // Return cleanup function
        return () => {
          clearTimeout(timeoutId);
          restoreCell();
        };
      } 
    }
  }, [currentInput]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-10">
      <div 
        className="grid gap-0"
        style={{
          gridTemplateColumns: `repeat(${gridDimensions.columns}, minmax(0, 1fr))`,
          width: '100vw',
          height: '100vh',
        }}
      >
        {gridCells.map((cell, index) => (
          <div
            key={index}
            data-id={`cell-${Math.floor(index / gridDimensions.columns)}-${index % gridDimensions.columns}`}
            id={cell.coord}
            className={`
              border-r border-b border-dashed border-yellow-700 border-opacity-20 
              text-yellow-100 text-opacity-70 text-xs
              flex items-center justify-center
              transition-colors
              hover:bg-white hover:bg-opacity-20
            `}
            style={{
              width: `${cell.width}px`,
              height: `${cell.height}px`,
              textShadow: `0px 0px 1px black`
            }}
            onClick={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              console.log(rect);
              console.log('Cell coordinates:', {
                coord: cell.coord,
                rect,
                screen: {
                  x: e.screenX,
                  y: e.screenY
                }
              });
            }}
          >
            {cell.coord}
          </div>
        ))}
      </div>
      <div className="fixed bottom-0 text-xs text-white text-opacity-50 left-2">
        Current Input: {currentInput.join('')}
      </div>
    </div>
  );
}

export default App;
