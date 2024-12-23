import { Config } from "./types";

const LETTERS: string[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const NUMBERS: string[] = Array.from({ length: 9 }, (_, i) =>
  (i + 1).toString()
);

export function calculateIdealCellSize(
  screenWidth: number,
  screenHeight: number,
  config: Config
): number {
  // Target having around 400-600 cells total to ensure we have enough coordinates
  const targetCellCount = 1000;
  const screenArea = screenWidth * screenHeight;
  const idealCellArea = screenArea / targetCellCount;
  const idealCellSize = Math.sqrt(idealCellArea);

  // Clamp between min and max sizes
  return Math.max(
    config.minCellSize,
    Math.min(config.maxCellSize, Math.floor(idealCellSize))
  );
}
// Keep track of used coordinates to prevent duplicates
export const usedCoordinates = new Set<string>();

// export function generateCoordinate(
//   row: number,
//   col: number,
//   totalColumns: number
// ): string {
//   // Base coordinate generation
//   const position = row * totalColumns + col;

//   // We'll use a different approach that guarantees uniqueness by using the position
//   // to generate coordinates in a more systematic way

//   // First, calculate how many double-character combinations we can have
//   const baseComboCount =
//     LETTERS.length * Math.max(NUMBERS.length, LETTERS.length);

//   // If position exceeds our base combinations, we need a prefix
//   const needsPrefix = position >= baseComboCount;

//   let coordinate: string;

//   if (needsPrefix) {
//     // Calculate prefix from remaining position
//     const prefixChar =
//       LETTERS[Math.floor(position / baseComboCount) % LETTERS.length];
//     const remainingPosition = position % baseComboCount;

//     // Generate the two-character part based on the remaining position
//     const firstChar =
//       LETTERS[
//         Math.floor(remainingPosition / Math.max(NUMBERS.length, LETTERS.length))
//       ];
//     const secondChar =
//       remainingPosition % 2 === 0
//         ? NUMBERS[remainingPosition % NUMBERS.length]
//         : LETTERS[remainingPosition % LETTERS.length];

//     coordinate = `${prefixChar}${firstChar}${secondChar}`;
//   } else {
//     // For positions that don't need a prefix, use a simpler scheme
//     const firstChar =
//       LETTERS[Math.floor(position / Math.max(NUMBERS.length, LETTERS.length))];
//     const secondChar =
//       position % 2 === 0
//         ? NUMBERS[position % NUMBERS.length]
//         : LETTERS[position % LETTERS.length];

//     coordinate = `${firstChar}${secondChar}`;
//   }

//   // Keep track of used coordinates
//   if (usedCoordinates.has(coordinate)) {
//     // If we somehow get a collision, append a number to make it unique
//     let i = 1;
//     while (usedCoordinates.has(`${coordinate}${i}`)) {
//       i++;
//     }
//     coordinate = `${coordinate}${i}`;
//   }

//   usedCoordinates.add(coordinate);
//   return coordinate;
// }

export function generateCoordinate(
    row: number,
    col: number,
    totalColumns: number
  ): string {
    const ALL_CHARS = [...LETTERS, ...NUMBERS]; // Combine letters and numbers
    const totalCombinations = ALL_CHARS.length * ALL_CHARS.length; // Total 2-char combos
  
    // Calculate the absolute position in a flat array
    const position = row * totalColumns + col;
  
    // Check if we need to use prefixes
    const needsPrefix = (position >= totalCombinations);
  
    let coordinate: string;
  
    if (needsPrefix) {
      // Use a prefix from letters based on the position
      const prefixIndex = Math.floor(position / totalCombinations);
      const prefix = ALL_CHARS[prefixIndex % ALL_CHARS.length];
  
      // Remaining position for the base 2-character combination
      const basePosition = position % totalCombinations;
      const firstChar = ALL_CHARS[Math.floor(basePosition / ALL_CHARS.length)];
      const secondChar = ALL_CHARS[basePosition % ALL_CHARS.length];
  
      coordinate = `${prefix}${firstChar}${secondChar}`;
    } else {
      // Simple 2-character combination
      const firstChar = ALL_CHARS[Math.floor(position / ALL_CHARS.length)];
      const secondChar = ALL_CHARS[position % ALL_CHARS.length];
  
      coordinate = `${firstChar}${secondChar}`;
    }
  
    // Ensure uniqueness
    if (usedCoordinates.has(coordinate)) {
      throw new Error(`Duplicate coordinate generated: ${coordinate}`);
    }
  
    usedCoordinates.add(coordinate);
    return coordinate;
  }
  