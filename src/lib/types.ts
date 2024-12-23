export interface GridCell {
  coord: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isHighlighted?: boolean;
}

export interface Config {
  minCellSize: number;
  maxCellSize: number;
}

export const DEFAULT_CONFIG: Config = {
    minCellSize: 40,  // Minimum size of each cell
    maxCellSize: 80   // Maximum size of each cell
  };
  