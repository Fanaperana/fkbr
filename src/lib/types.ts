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
 * Configuration for the grid system.
 */
export interface Config {
  /** Minimum size of each cell in pixels */
  minCellSize: number;
  /** Maximum size of each cell in pixels */
  maxCellSize: number;
}

/**
 * Default configuration values.
 */
export const DEFAULT_CONFIG: Config = {
  minCellSize: 40,
  maxCellSize: 80,
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
 * Smaller cells get a 2x2 grid, larger cells get a 3x3 grid.
 */
export function getSubCellConfig(width: number, height: number): SubCellConfig {
  if (width < 50 && height < 50) {
    return { columns: 2, rows: 2 };
  }
  return { columns: 3, rows: 3 };
}
