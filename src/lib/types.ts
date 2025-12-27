/**
 * Represents a single cell in the grid overlay.
 */
export interface GridCell {
  /** The coordinate identifier for this cell (e.g., "AA", "B3") */
  coord: string;
  /** The x position on screen in pixels */
  x: number;
  /** The y position on screen in pixels */
  y: number;
  /** The width of the cell in pixels */
  width: number;
  /** The height of the cell in pixels */
  height: number;
  /** Whether this cell is currently highlighted */
  isHighlighted?: boolean;
}

/**
 * Coordinate mode determines how many characters are used for targeting.
 * - "2-char": Uses AA format (676 max cells, requires subcell 1-9 for click)
 * - "3-char": Uses AA1 format (6084 max positions, subcell included in coord)
 */
export type CoordinateMode = "2-char" | "3-char";

/**
 * Configuration for the grid system.
 */
export interface GridConfig {
  /** Coordinate input mode */
  coordinateMode: CoordinateMode;
  /** Target number of cells (will be adjusted to fit screen) */
  targetCellCount: number;
  /** Minimum size of each cell in pixels */
  minCellSize: number;
  /** Maximum size of each cell in pixels */
  maxCellSize: number;
}

/**
 * For backward compatibility
 */
export type Config = GridConfig;

/**
 * Maximum cells for each coordinate mode.
 * 2-char: 36 * 36 = 1296 cells (A-Z + 0-9)
 * 3-char: 36 * 36 * 10 = 12960 cells (2 alphanumeric + 1 digit)
 */
export const MAX_CELLS = {
  "2-char": 1296,   // AA to 99
  "3-char": 12960,  // AA0 to 999 (2 alphanumeric + digit 0-9)
};

/**
 * Get recommended cell count based on screen size.
 * Returns a value that creates reasonably sized cells.
 */
export function getRecommendedCellCount(
  screenWidth: number,
  screenHeight: number,
  mode: CoordinateMode
): number {
  const screenArea = screenWidth * screenHeight;
  
  // Target cell sizes based on mode
  // 2-char mode: larger cells since subcells add precision
  // 3-char mode: can have more cells since we have more coordinates
  const targetCellArea = mode === "2-char" ? 2500 : 1600; // ~50x50 or ~40x40 pixels
  
  let recommended = Math.floor(screenArea / targetCellArea);
  
  // Clamp to max cells
  recommended = Math.min(recommended, MAX_CELLS[mode]);
  
  return recommended;
}

/**
 * Validate and adjust cell count to valid values.
 */
export function validateCellCount(count: number, mode: CoordinateMode): number {
  const max = MAX_CELLS[mode];
  return Math.max(16, Math.min(count, max)); // Min 16 cells
}

/**
 * Get valid cell count options for the settings UI.
 * Returns useful values for different grid densities.
 */
export function getValidCellCountOptions(mode: CoordinateMode): number[] {
  const max = MAX_CELLS[mode];
  
  // Common useful grid sizes
  const options = [
    100, 200, 300, 400, 500, 600, 800, 1000, 1296
  ];
  
  if (mode === "3-char") {
    options.push(1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000, 12960);
  }
  
  return options.filter(n => n <= max);
}

/**
 * Default configuration values.
 * Auto-detects optimal settings on first run.
 */
export const DEFAULT_CONFIG: GridConfig = {
  coordinateMode: "2-char",
  targetCellCount: 400, // 20x20 grid, will be adjusted based on screen
  minCellSize: 25,
  maxCellSize: 60,
};

/**
 * Sub-cell configuration for precise clicking.
 */
export interface SubCellConfig {
  /** Number of columns in the sub-cell grid */
  columns: number;
  /** Number of rows in the sub-cell grid */
  rows: number;
}

/**
 * Get sub-cell grid configuration based on cell size.
 * Uses 3x3 for standard cells, 2x2 for small cells.
 */
export function getSubCellConfig(width: number, height: number): SubCellConfig {
  if (width < 25 && height < 25) {
    return { columns: 2, rows: 2 };
  }
  return { columns: 3, rows: 3 };
}
