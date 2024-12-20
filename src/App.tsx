import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Window } from "@tauri-apps/api/window"
import "./App.css";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";

const appWindow = new Window('main');

interface GridCell {
  coord: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Config {
  gridSize: number;
}

const DEFAULT_CONFIG: Config = {
  gridSize: 40
};

const COLUMNS: string[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ROWS: string[] = Array.from({ length: 9 }, (_, i) => (i + 1).toString());

function generateCoordinate(index: number): string {
  const upperLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerLetters = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '123456789';
  
  // For each letter we have:
  // 52 letter pairs (AA-AZ, Aa-Az) + 18 number combinations (A1-A9 and 1A-9A)
  const combinationsPerLetter = (26 + 26) + (9 * 2);
  const currentLetter = upperLetters[Math.floor(index / combinationsPerLetter)];
  
  if (!currentLetter) {
    console.warn('Ran out of coordinates at index:', index);
    return 'XX'; // fallback coordinate
  }
  
  // Get position within the current letter's combinations
  const positionInGroup = index % combinationsPerLetter;
  
  if (positionInGroup < 52) {
    // First 52 combinations are letter pairs (AA-AZ, then Aa-Az)
    if (positionInGroup < 26) {
      // Uppercase pairs (AA-AZ)
      return `${currentLetter}${upperLetters[positionInGroup]}`;
    } else {
      // Lowercase pairs (Aa-Az)
      return `${currentLetter}${lowerLetters[positionInGroup - 26]}`;
    }
  } else {
    // Remaining combinations are number pairs
    const numberPosition = (positionInGroup - 52) % 18;
    const number = numbers[Math.floor(numberPosition / 2)];
    
    // Alternate between number-first and letter-first
    return numberPosition % 2 === 0 
      ? `${currentLetter}${number}` 
      : `${number}${currentLetter}`;
  }
}


function App() {

  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [config] = useState<Config>(DEFAULT_CONFIG);
  const [lastClicked, setLastClicked] = useState<string | null>(null);

  useEffect(() => {
    const calculateGridCells = () => {
      const screenWidth: number = window.innerWidth;
      const screenHeight: number = window.innerHeight;
      const cellWidth: number = screenWidth / config.gridSize;
      const cellHeight: number = screenHeight / config.gridSize;

      const cells: GridCell[] = [];
      let coordIndex = 0;

      for (let i = 0; i < config.gridSize; i++) {
        for (let j = 0; j < config.gridSize; j++) {
          // Generate unique coordinate
          const coord = generateCoordinate(coordIndex++);
          
          // Calculate absolute screen position
          const x = Math.round(j * cellWidth);
          const y = Math.round(i * cellHeight);
          
          cells.push({
            coord,
            x,
            y,
            width: Math.round(cellWidth),
            height: Math.round(cellHeight),
          });
        }
      }
      setGridCells(cells);
    };

    calculateGridCells();

    window.addEventListener('resize', calculateGridCells);
    return () => window.removeEventListener('resize', calculateGridCells);
  }, [config.gridSize]);

  let cords = Array<String>();
  const handleKeyEvent = (event: KeyboardEvent) => {
    event.preventDefault();
    console.log('event', event);

    if (cords.length > 2) {
      return;
    }

    if (event.code.startsWith("Key")) {
      cords.push(event.key);
    }

    if (event.key === 'Backspace' || event.code === 'Backspace') {
      cords.pop();
    }


    console.log('cords', cords)
  }

  useEffect(()=> {
    window.addEventListener('keyup', handleKeyEvent);
    return () => window.removeEventListener('keyup', handleKeyEvent)
  }, []);

  // useEffect(() => {
  //   let cords = Array<String>();
  //   window.addEventListener('keyup', function (event: KeyboardEvent) {
  //     event.preventDefault();
  //     console.log(event);


  //   });
  //   const handleKeyPress = async (e: KeyboardEvent): Promise<void> => {
  //     e.preventDefault();
  //     // if (!isVisible) return;

  //     // console.log(e.code)
  //     if(cords.length > 2) {
        
  //       cords = [];
  //     }

  //     // Build the coordinate as we type
  //     const key = e.key.toUpperCase();
  //     const cell = gridCells.find(c => c.coord === key);
      
  //     if (cell) {
  //       try {
  //         setLastClicked(key);
  //         const screenX = Math.round(cell.x + cell.width / 2);
  //         const screenY = Math.round(cell.y + cell.height / 2);
          
  //         // setDebugInfo(`Clicking at: ${screenX}, ${screenY}`);
          
  //         // await invoke('move_mouse', {
  //         //   x: screenX,
  //         //   y: screenY,
  //         // });
          
  //         setTimeout(() => {
  //           setIsVisible(false);
  //           setLastClicked(null);
  //         }, 100);
  //       } catch (error) {
  //         console.error('Failed to move mouse:', error);
  //       }
  //     }
  //   };

  //   window.addEventListener('keypress', handleKeyPress);
  //   return () => window.removeEventListener('keypress', handleKeyPress);
  // }, [isVisible, gridCells]);

  // Shortcut registration useEffect remains the same
  useEffect(() => {
    const registerShortcut = async () => {
      try {
        await register('Alt+G', () => {
          setIsVisible(prev => !prev);
          setLastClicked(null);
        });
      } catch (error) {
        console.error('Failed to register shortcut:', error);
      }
    };

    registerShortcut();

    return () => {
      unregister('Alt+G').catch(console.error);
    };
  }, []);

  // async function initShotcut() {
  //   await register('CommandOrControl+Alt+I', () => {
  //     console.log("SHORTCUT TRIGGERED");
  //   })
  // }

  // useEffect(() => {
  //   initShotcut()
  // }, []);

  
  // "resizable": false,
  // "fullscreen": true,
  // "decorations": false,
  // "transparent": true,
  // "backgroundColor": null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center">
      <div 
        className="grid bg-opacity-50 gap-0"
        style={{
          gridTemplateColumns: `repeat(${config.gridSize}, minmax(0, 1fr))`,
          width: '100vw',
          height: '100vh',
        }}
      >
        {gridCells.map((cell, index) => (
          <div
            key={index}
            data-id={`cell-${Math.floor(index / config.gridSize)}-${index % config.gridSize}`}
            className={`
              border border-dashed border-yellow-700 border-opacity-20 
              text-white text-opacity-30 text-[10px]
              flex items-center justify-center
              aspect-square
              transition-colors
              ${cell.coord === lastClicked ? 'bg-yellow-300 bg-opacity-30' : ''}
              hover:bg-white hover:bg-opacity-20
            `}
            onClick={(e) => {

              console.log((e.target as HTMLElement).getBoundingClientRect());
              console.log('Screen coordinates:', {
                  x: e.screenX,
                  y: e.screenY
              });
          }}
          >
            {cell.coord}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
