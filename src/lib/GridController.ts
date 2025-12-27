import { Config, GridCell } from "./types";
import { calculateIdealCellSize, generateCoordinate, usedCoordinates } from "./utils";

/**
 * GridController manages the grid overlay system.
 * It handles grid cell generation, dimensions calculation, and cell highlighting.
 */
export class GridController {
  private cells: GridCell[] = [];
  private columns: number = 0;
  private rows: number = 0;
  private config: Config;

  constructor(config: Config) {
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
   * @param screenWidth - The width of the screen
   * @param screenHeight - The height of the screen
   */
  calculateCells(screenWidth: number, screenHeight: number): void {
    // Clear used coordinates when recalculating grid
    usedCoordinates.clear();

    // Calculate ideal cell size based on screen dimensions
    const idealCellSize = calculateIdealCellSize(screenWidth, screenHeight, this.config);

    // Calculate grid dimensions
    this.columns = Math.floor(screenWidth / idealCellSize);
    this.rows = Math.floor(screenHeight / idealCellSize);

    // Calculate actual cell size to fill screen
    const cellWidth = Math.floor(screenWidth / this.columns);
    const cellHeight = Math.floor(screenHeight / this.rows);

    const cells: GridCell[] = [];

    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.columns; j++) {
        const coord = generateCoordinate(i, j, this.columns);

        cells.push({
          coord,
          x: j * cellWidth,
          y: i * cellHeight,
          width: cellWidth,
          height: cellHeight,
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

  /**
   * Updates the configuration.
   * @param config - The new configuration
   */
  setConfig(config: Config): void {
    this.config = config;
  }
}
