import { invoke } from "@tauri-apps/api/core";

/**
 * Types of mouse clicks supported by the application.
 */
export type ClickType = "left" | "right" | "middle";

/**
 * MouseActions handles all mouse-related operations through Tauri commands.
 * This class provides a clean interface for performing mouse actions.
 */
export class MouseActions {
  /**
   * Performs a click at the specified screen coordinates.
   * @param x - The x coordinate on the screen
   * @param y - The y coordinate on the screen
   * @param clickType - The type of click to perform (default: "left")
   */
  static async clickAt(x: number, y: number, clickType: ClickType = "left"): Promise<void> {
    await invoke("click_at", {
      x: Math.floor(x),
      y: Math.floor(y),
      clickType,
    });
  }

  /**
   * Performs a left click at the specified coordinates.
   * @param x - The x coordinate on the screen
   * @param y - The y coordinate on the screen
   */
  static async leftClick(x: number, y: number): Promise<void> {
    await invoke("left_click", {
      x: Math.floor(x),
      y: Math.floor(y),
    });
  }

  /**
   * Performs a right click at the specified coordinates.
   * @param x - The x coordinate on the screen
   * @param y - The y coordinate on the screen
   */
  static async rightClick(x: number, y: number): Promise<void> {
    await invoke("right_click", {
      x: Math.floor(x),
      y: Math.floor(y),
    });
  }
}
