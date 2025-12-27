import { ClickType } from "./MouseActions";
import { CoordinateMode } from "./types";

/**
 * Key input event data.
 */
export interface KeyInput {
  key: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

/**
 * Callback type for when a coordinate is completed.
 */
export type CoordinateCallback = (coord: string, subCell: number | null, clickType: ClickType) => void;

/**
 * Callback type for input changes.
 */
export type InputChangeCallback = (input: string[], mode: CoordinateMode) => void;

/**
 * InputHandler manages keyboard input for the coordinate selection system.
 * It handles key events, input buffering, and triggers callbacks when coordinates are complete.
 * 
 * Input patterns:
 * - 2-char mode: 2 alphanumeric chars for coordinate + 1 digit (1-9) for subcell = 3 chars total
 * - 3-char mode: 3 chars (2 alphanumeric + 1 digit 0-9) for coordinate + optional subcell (1-9) = 3-4 chars total
 */
export class InputHandler {
  private currentInput: string[] = [];
  private onCoordinateComplete: CoordinateCallback;
  private onInputChange: InputChangeCallback;
  private clickType: ClickType = "left";
  private coordinateMode: CoordinateMode = "2-char";

  constructor(
    onCoordinateComplete: CoordinateCallback,
    onInputChange: InputChangeCallback
  ) {
    this.onCoordinateComplete = onCoordinateComplete;
    this.onInputChange = onInputChange;
  }

  /**
   * Sets the coordinate mode.
   */
  setCoordinateMode(mode: CoordinateMode): void {
    this.coordinateMode = mode;
  }

  /**
   * Gets the current coordinate mode.
   */
  getCoordinateMode(): CoordinateMode {
    return this.coordinateMode;
  }

  /**
   * Gets the coordinate length for the current mode.
   */
  getCoordLength(): number {
    return this.coordinateMode === "2-char" ? 2 : 3;
  }

  /**
   * Gets the maximum input length for the current mode.
   * 2-char: 2 coord + 1 subcell = 3
   * 3-char: 3 coord + 1 optional subcell = 4
   */
  getMaxInputLength(): number {
    return this.coordinateMode === "2-char" ? 3 : 4;
  }

  /**
   * Gets the current input buffer.
   */
  getCurrentInput(): string[] {
    return [...this.currentInput];
  }

  /**
   * Gets the current click type.
   */
  getClickType(): ClickType {
    return this.clickType;
  }

  /**
   * Sets the click type for the next action.
   */
  setClickType(type: ClickType): void {
    this.clickType = type;
  }

  /**
   * Clears the current input buffer.
   */
  clear(): void {
    this.currentInput = [];
    this.clickType = "left";
    this.onInputChange(this.currentInput, this.coordinateMode);
  }

  /**
   * Cycles through click types: left -> right -> double -> left
   */
  cycleClickType(): void {
    const types: ClickType[] = ["left", "right", "double"];
    const currentIndex = types.indexOf(this.clickType);
    this.clickType = types[(currentIndex + 1) % types.length];
  }

  /**
   * Handles a keyboard event.
   * @param event - The keyboard event
   * @returns true if the event was handled
   */
  handleKeyEvent(event: KeyboardEvent): boolean {
    event.preventDefault();

    // Escape clears input
    if (event.key === "Escape") {
      this.clear();
      return true;
    }

    // Backspace removes last character
    if (event.key === "Backspace") {
      this.currentInput = this.currentInput.slice(0, -1);
      this.onInputChange(this.currentInput, this.coordinateMode);
      return true;
    }

    // Tab cycles through click types: left -> right -> double
    if (event.key === "Tab") {
      this.cycleClickType();
      return true;
    }

    const maxLen = this.getMaxInputLength();
    const coordLen = this.getCoordLength();
    
    // Max input length reached
    if (this.currentInput.length >= maxLen) return true;

    // Only accept keys when not holding Ctrl+Alt (reserved for activation)
    if (!event.ctrlKey || !event.altKey) {
      const key = event.key.toUpperCase();
      
      if (this.coordinateMode === "2-char") {
        // 2-char mode: 2 alphanumeric for coord + 1 digit (1-9) for subcell
        if (this.currentInput.length < coordLen) {
          // First 2 chars: accept A-Z and 0-9
          if (/^[A-Z0-9]$/.test(key)) {
            this.currentInput.push(key);
            this.onInputChange(this.currentInput, this.coordinateMode);
            return true;
          }
        } else if (this.currentInput.length === coordLen) {
          // 3rd char (subcell): only accept 1-9
          if (/^[1-9]$/.test(key)) {
            this.currentInput.push(key);
            this.onInputChange(this.currentInput, this.coordinateMode);
            
            const coord = this.currentInput.slice(0, coordLen).join("");
            const subCell = parseInt(this.currentInput[coordLen], 10);
            this.onCoordinateComplete(coord, subCell, this.clickType);
            return true;
          }
        }
      } else {
        // 3-char mode: 2 alphanumeric + 1 digit (0-9) for coord + optional subcell (1-9)
        if (this.currentInput.length < 2) {
          // First 2 chars: accept A-Z and 0-9
          if (/^[A-Z0-9]$/.test(key)) {
            this.currentInput.push(key);
            this.onInputChange(this.currentInput, this.coordinateMode);
            return true;
          }
        } else if (this.currentInput.length === 2) {
          // 3rd char (part of coord): accept 0-9 only
          if (/^[0-9]$/.test(key)) {
            this.currentInput.push(key);
            this.onInputChange(this.currentInput, this.coordinateMode);
            return true;
          }
        } else if (this.currentInput.length === coordLen) {
          // 4th char (subcell): only accept 1-9, triggers completion
          if (/^[1-9]$/.test(key)) {
            this.currentInput.push(key);
            this.onInputChange(this.currentInput, this.coordinateMode);
            
            const coord = this.currentInput.slice(0, coordLen).join("");
            const subCell = parseInt(this.currentInput[coordLen], 10);
            this.onCoordinateComplete(coord, subCell, this.clickType);
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Triggers completion for the current coordinate without subcell.
   * Useful for 3-char mode where user wants to click center.
   */
  completeWithoutSubcell(): boolean {
    const coordLen = this.getCoordLength();
    if (this.currentInput.length >= coordLen) {
      const coord = this.currentInput.slice(0, coordLen).join("");
      this.onCoordinateComplete(coord, null, this.clickType);
      return true;
    }
    return false;
  }

  /**
   * Creates a keyboard event listener that can be attached to the window.
   */
  createEventListener(): (event: KeyboardEvent) => void {
    return (event: KeyboardEvent) => this.handleKeyEvent(event);
  }
}
