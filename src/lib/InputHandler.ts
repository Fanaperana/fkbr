import { ClickType } from "./MouseActions";

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
export type InputChangeCallback = (input: string[]) => void;

/**
 * InputHandler manages keyboard input for the coordinate selection system.
 * It handles key events, input buffering, and triggers callbacks when coordinates are complete.
 */
export class InputHandler {
  private currentInput: string[] = [];
  private onCoordinateComplete: CoordinateCallback;
  private onInputChange: InputChangeCallback;
  private clickType: ClickType = "left";

  constructor(
    onCoordinateComplete: CoordinateCallback,
    onInputChange: InputChangeCallback
  ) {
    this.onCoordinateComplete = onCoordinateComplete;
    this.onInputChange = onInputChange;
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
    this.onInputChange(this.currentInput);
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
      this.onInputChange(this.currentInput);
      return true;
    }

    // Tab toggles between left and right click
    if (event.key === "Tab") {
      this.clickType = this.clickType === "left" ? "right" : "left";
      return true;
    }

    // Max input length is 3 (2 for coordinate + 1 for subcell)
    if (this.currentInput.length >= 3) return true;

    // Only accept alphanumeric keys when not holding Ctrl+Alt
    if (!event.ctrlKey || !event.altKey) {
      const key = event.key.toUpperCase();
      if (/^[A-Z0-9]$/.test(key)) {
        this.currentInput.push(key);
        this.onInputChange(this.currentInput);

        // Check if we have a complete coordinate (3 chars)
        if (this.currentInput.length === 3) {
          const coord = this.currentInput.slice(0, 2).join("");
          const subCell = parseInt(this.currentInput[2], 10);
          this.onCoordinateComplete(coord, subCell, this.clickType);
        }

        return true;
      }
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
