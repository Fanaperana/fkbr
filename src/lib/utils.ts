import { Config } from "./types";

/** Available letters for coordinate generation */
const LETTERS: string[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** Available numbers for coordinate generation */
const NUMBERS: string[] = Array.from({ length: 9 }, (_, i) =>
  (i + 1).toString()
);

/** Combined character set for coordinate generation */
const ALL_CHARS: string[] = [...LETTERS, ...NUMBERS];

/**
 * Calculates the ideal cell size based on screen dimensions and configuration.
 * Aims for approximately 1000 cells for good coverage.
 * 
 * @param screenWidth - The screen width in pixels
 * @param screenHeight - The screen height in pixels
 * @param config - The grid configuration
 * @returns The calculated ideal cell size in pixels
 */
export function calculateIdealCellSize(
  screenWidth: number,
  screenHeight: number,
  config: Config
): number {
  const targetCellCount = 1000;
  const screenArea = screenWidth * screenHeight;
  const idealCellArea = screenArea / targetCellCount;
  const idealCellSize = Math.sqrt(idealCellArea);

  return Math.max(
    config.minCellSize,
    Math.min(config.maxCellSize, Math.floor(idealCellSize))
  );
}

/** Tracks used coordinates to prevent duplicates */
export const usedCoordinates = new Set<string>();

/**
 * Generates a unique coordinate string for a grid cell.
 * 
 * @param row - The row index
 * @param col - The column index
 * @param totalColumns - The total number of columns in the grid
 * @returns A unique coordinate string (2-3 characters)
 * @throws Error if a duplicate coordinate would be generated
 */
export function generateCoordinate(
  row: number,
  col: number,
  totalColumns: number
): string {
  const totalCombinations = ALL_CHARS.length * ALL_CHARS.length;
  const position = row * totalColumns + col;

  const needsPrefix = position >= totalCombinations;

  let coordinate: string;

  if (needsPrefix) {
    const prefixIndex = Math.floor(position / totalCombinations);
    const prefix = ALL_CHARS[prefixIndex % ALL_CHARS.length];

    const basePosition = position % totalCombinations;
    const firstChar = ALL_CHARS[Math.floor(basePosition / ALL_CHARS.length)];
    const secondChar = ALL_CHARS[basePosition % ALL_CHARS.length];

    coordinate = `${prefix}${firstChar}${secondChar}`;
  } else {
    const firstChar = ALL_CHARS[Math.floor(position / ALL_CHARS.length)];
    const secondChar = ALL_CHARS[position % ALL_CHARS.length];

    coordinate = `${firstChar}${secondChar}`;
  }

  if (usedCoordinates.has(coordinate)) {
    throw new Error(`Duplicate coordinate generated: ${coordinate}`);
  }

  usedCoordinates.add(coordinate);
  return coordinate;
}

/**
 * Calculates the center point of a sub-cell within a parent cell.
 * 
 * @param parentRect - The bounding rect of the parent cell
 * @param subCellIndex - The 1-based index of the sub-cell (1-9 for 3x3, 1-4 for 2x2)
 * @param gridSize - The grid size (2 for 2x2, 3 for 3x3)
 * @returns The center coordinates of the sub-cell
 */
export function getSubCellCenter(
  parentRect: DOMRect,
  subCellIndex: number,
  gridSize: number
): { x: number; y: number } {
  const cellWidth = parentRect.width / gridSize;
  const cellHeight = parentRect.height / gridSize;
  
  const index = subCellIndex - 1; // Convert to 0-based
  const col = index % gridSize;
  const row = Math.floor(index / gridSize);
  
  return {
    x: parentRect.x + (col * cellWidth) + (cellWidth / 2),
    y: parentRect.y + (row * cellHeight) + (cellHeight / 2),
  };
}
