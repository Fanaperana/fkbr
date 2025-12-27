/**
 * @file GridController.ts
 * @description Manages the grid overlay system for keyboard-based navigation.
 * Handles cell generation, layout calculations, and coordinate mapping.
 * 
 * @author Fanaperana
 * @license MIT
 * @see https://github.com/Fanaperana/fkbr
 */

import { GridConfig, GridCell, MAX_CELLS } from "./types";
import { generateCoordinate, usedCoordinates, setCoordinateMode } from "./utils";

/**
 * GridController manages the grid overlay system.
 * It handles grid cell generation, dimensions calculation, and cell highlighting.
 */
export class GridController {
  private cells: GridCell[] = [];
  private columns: number = 0;
  private rows: number = 0;
  private config: GridConfig;

  constructor(config: GridConfig) {
    this.config = config;
  }

  /**
   * Updates the configuration.
   */
  setConfig(config: GridConfig): void {
    this.config = config;
  }

  /**
   * Gets the current grid cells.
   */
  getCells(): GridCell[] {
    return this.cells;
  }

  /**
   * Gets the current grid dimensions.
   */
  getDimensions(): { columns: number; rows: number } {
    return { columns: this.columns, rows: this.rows };
  }

  /**
   * Calculates and generates grid cells based on screen dimensions.
   * Fills the entire screen without gaps.
   * @param screenWidth - The width of the screen
   * @param screenHeight - The height of the screen
   */
  calculateCells(screenWidth: number, screenHeight: number): void {
    // Clear used coordinates when recalculating grid
    usedCoordinates.clear();
    
    // Set coordinate mode for generation
    setCoordinateMode(this.config.coordinateMode);

    const maxCells = MAX_CELLS[this.config.coordinateMode];
    
    // Calculate optimal grid dimensions based on screen aspect ratio
    const aspectRatio = screenWidth / screenHeight;
    
    // Start with target cell count from config
    let targetCells = Math.min(this.config.targetCellCount, maxCells);
    
    // Calculate rows and columns that best match the aspect ratio
    // For a grid of N cells with aspect ratio R, optimal is:
    // cols = sqrt(N * R), rows = sqrt(N / R)
    this.columns = Math.round(Math.sqrt(targetCells * aspectRatio));
    this.rows = Math.round(Math.sqrt(targetCells / aspectRatio));
    
    // Ensure we don't exceed max cells
    while (this.columns * this.rows > maxCells) {
      if (this.columns > this.rows) {
        this.columns--;
      } else {
        this.rows--;
      }
    }
    
    // Ensure minimum grid size
    this.columns = Math.max(this.columns, 4);
    this.rows = Math.max(this.rows, 4);

    // Calculate cell dimensions to exactly fill the screen (no gaps)
    const cellWidth = screenWidth / this.columns;
    const cellHeight = screenHeight / this.rows;

    const cells: GridCell[] = [];

    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.columns; j++) {
        const coord = generateCoordinate(i, j, this.columns);

        // Use floor for position and ceil for size to ensure full coverage
        const x = Math.floor(j * cellWidth);
        const y = Math.floor(i * cellHeight);
        // Next cell position - current position = this cell's actual size
        const nextX = Math.floor((j + 1) * cellWidth);
        const nextY = Math.floor((i + 1) * cellHeight);
        const width = nextX - x;
        const height = nextY - y;

        cells.push({
          coord,
          x,
          y,
          width,
          height,
          isHighlighted: false,
        });
      }
    }

    this.cells = cells;
  }

  /**
   * Highlights a cell by its coordinate.
   * @param coord - The coordinate string to highlight
   */
  highlightCell(coord: string): void {
    this.cells = this.cells.map((cell) => ({
      ...cell,
      isHighlighted: cell.coord.toUpperCase() === coord.toUpperCase(),
    }));
  }

  /**
   * Clears all cell highlights.
   */
  clearHighlights(): void {
    this.cells = this.cells.map((cell) => ({
      ...cell,
      isHighlighted: false,
    }));
  }

  /**
   * Finds a cell by its coordinate.
   * @param coord - The coordinate string to find
   */
  findCell(coord: string): GridCell | undefined {
    return this.cells.find(
      (cell) => cell.coord.toUpperCase() === coord.toUpperCase()
    );
  }
}
