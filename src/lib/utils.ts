/**
 * @file utils.ts
 * @description Utility functions for grid calculations and coordinate generation.
 * Handles cell sizing, grid dimensions, coordinate mapping, and click positioning.
 * 
 * @author Fanaperana
 * @license MIT
 * @see https://github.com/Fanaperana/fkbr
 */

import { GridConfig, MAX_CELLS, CoordinateMode } from "./types";

/** Characters for coordinate generation (A-Z + 0-9 = 36 chars) */
const COORD_CHARS: string[] = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  ..."0123456789".split(""),
];

/** Digits for third character in 3-char mode (0-9) */
const DIGITS: string[] = "0123456789".split("");

/** Maximum cells for 2-char mode (36 * 36 = 1296) */
const MAX_2CHAR_CELLS = COORD_CHARS.length * COORD_CHARS.length;

/** Maximum cells for 3-char mode (36 * 36 * 10 = 12960) */
const MAX_3CHAR_CELLS = COORD_CHARS.length * COORD_CHARS.length * DIGITS.length;

/**
 * Calculates the ideal cell size based on screen dimensions and configuration.
 * 
 * @param screenWidth - The screen width in pixels
 * @param screenHeight - The screen height in pixels
 * @param config - The grid configuration
 * @returns The calculated ideal cell size in pixels
 */
export function calculateIdealCellSize(
  screenWidth: number,
  screenHeight: number,
  config: GridConfig
): number {
  // Use target cell count from config, clamped to max
  const maxCells = MAX_CELLS[config.coordinateMode];
  const targetCellCount = Math.min(config.targetCellCount, maxCells);
  
  const screenArea = screenWidth * screenHeight;
  const idealCellArea = screenArea / targetCellCount;
  const idealCellSize = Math.sqrt(idealCellArea);

  return Math.max(
    config.minCellSize,
    Math.min(config.maxCellSize, Math.floor(idealCellSize))
  );
}

/**
 * Calculates grid dimensions based on screen size and config.
 */
export function calculateGridDimensions(
  screenWidth: number,
  screenHeight: number,
  config: GridConfig
): { columns: number; rows: number; cellSize: number } {
  const cellSize = calculateIdealCellSize(screenWidth, screenHeight, config);
  const columns = Math.floor(screenWidth / cellSize);
  const rows = Math.floor(screenHeight / cellSize);
  
  // Ensure we don't exceed max cells
  const maxCells = MAX_CELLS[config.coordinateMode];
  const totalCells = columns * rows;
  
  if (totalCells > maxCells) {
    // Reduce to fit within max
    const scale = Math.sqrt(maxCells / totalCells);
    return {
      columns: Math.floor(columns * scale),
      rows: Math.floor(rows * scale),
      cellSize: Math.ceil(cellSize / scale),
    };
  }
  
  return { columns, rows, cellSize };
}

/** Tracks used coordinates to prevent duplicates */
export const usedCoordinates = new Set<string>();

/** Current coordinate mode */
let currentCoordMode: CoordinateMode = "2-char";

/**
 * Sets the coordinate mode for generation.
 */
export function setCoordinateMode(mode: CoordinateMode): void {
  currentCoordMode = mode;
}

/**
 * Generates a unique coordinate string for a grid cell.
 * - 2-char mode: Uses A-Z and 0-9 for 1296 combinations (AA, A1, 99, etc.)
 * - 3-char mode: Uses 2 alphanumeric + 1 digit for 12960 combinations (AA0, A19, 999, etc.)
 * 
 * @param row - The row index
 * @param col - The column index
 * @param totalColumns - The total number of columns in the grid
 * @param mode - Optional coordinate mode override
 * @returns A unique coordinate string (2 or 3 characters)
 * @throws Error if position exceeds available coordinates or duplicate
 */
export function generateCoordinate(
  row: number,
  col: number,
  totalColumns: number,
  mode?: CoordinateMode
): string {
  const coordMode = mode || currentCoordMode;
  const position = row * totalColumns + col;
  
  let coordinate: string;
  
  if (coordMode === "3-char") {
    // 3-char mode: 2 alphanumeric + 1 digit
    if (position >= MAX_3CHAR_CELLS) {
      throw new Error(`Position ${position} exceeds max 3-char coordinates (${MAX_3CHAR_CELLS})`);
    }
    
    const digitIndex = position % DIGITS.length;
    const remaining = Math.floor(position / DIGITS.length);
    const secondIndex = remaining % COORD_CHARS.length;
    const firstIndex = Math.floor(remaining / COORD_CHARS.length);
    
    coordinate = `${COORD_CHARS[firstIndex]}${COORD_CHARS[secondIndex]}${DIGITS[digitIndex]}`;
  } else {
    // 2-char mode: 2 alphanumeric
    if (position >= MAX_2CHAR_CELLS) {
      throw new Error(`Position ${position} exceeds max 2-char coordinates (${MAX_2CHAR_CELLS})`);
    }
    
    const firstChar = COORD_CHARS[Math.floor(position / COORD_CHARS.length)];
    const secondChar = COORD_CHARS[position % COORD_CHARS.length];
    coordinate = `${firstChar}${secondChar}`;
  }

  if (usedCoordinates.has(coordinate)) {
    throw new Error(`Duplicate coordinate generated: ${coordinate}`);
  }
  usedCoordinates.add(coordinate);
  return coordinate;
}

/**
 * Generates a value with center-weighted distribution.
 * Uses a simple triangular distribution that favors the center.
 * 
 * @returns A value between 0 and 1, weighted toward 0.5
 */
function centerWeightedRandom(): number {
  // Average of two random numbers creates triangular distribution centered at 0.5
  return (Math.random() + Math.random()) / 2;
}

/**
 * Calculates a click point within a sub-cell's surface area.
 * Uses center-weighted distribution to favor the middle of the subcell
 * while still allowing natural variation across the clickable area.
 * 
 * @param parentRect - The bounding rect of the parent cell
 * @param subCellIndex - The 1-based index of the sub-cell (1-9 for 3x3, 1-4 for 2x2)
 * @param gridSize - The grid size (2 for 2x2, 3 for 3x3)
 * @param edgePadding - Percentage of padding from edges (0-0.4), default 0.1 (10% from edges)
 * @returns Coordinates within the sub-cell area, weighted toward center
 */
export function getSubCellCenter(
  parentRect: DOMRect,
  subCellIndex: number,
  gridSize: number,
  edgePadding: number = 0.1
): { x: number; y: number } {
  const cellWidth = parentRect.width / gridSize;
  const cellHeight = parentRect.height / gridSize;
  
  const index = subCellIndex - 1; // Convert to 0-based
  const col = index % gridSize;
  const row = Math.floor(index / gridSize);
  
  // Calculate the subcell's top-left corner
  const subCellX = parentRect.x + (col * cellWidth);
  const subCellY = parentRect.y + (row * cellHeight);
  
  // Calculate safe clickable area (avoiding edges where borders/dividers might be)
  const safeWidth = cellWidth * (1 - 2 * edgePadding);
  const safeHeight = cellHeight * (1 - 2 * edgePadding);
  const offsetX = cellWidth * edgePadding;
  const offsetY = cellHeight * edgePadding;
  
  // Generate center-weighted position within safe area
  const x = subCellX + offsetX + (centerWeightedRandom() * safeWidth);
  const y = subCellY + offsetY + (centerWeightedRandom() * safeHeight);
  
  return { x, y };
}
