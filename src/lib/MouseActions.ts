/**
 * @file MouseActions.ts
 * @description Frontend interface for mouse operations.
 * Provides a clean TypeScript API for invoking Rust mouse commands.
 * 
 * @author Fanaperana
 * @license MIT
 * @see https://github.com/Fanaperana/fkbr
 */

import { invoke } from "@tauri-apps/api/core";

/**
 * Types of mouse clicks supported by the application.
 */
export type ClickType = "left" | "right" | "middle" | "double";

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
    if (clickType === "double") {
      await this.doubleClick(x, y);
      return;
    }
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

  /**
   * Performs a double click at the specified coordinates.
   * @param x - The x coordinate on the screen
   * @param y - The y coordinate on the screen
   */
  static async doubleClick(x: number, y: number): Promise<void> {
    await invoke("double_click", {
      x: Math.floor(x),
      y: Math.floor(y),
    });
  }

  /**
   * Scrolls at the specified coordinates.
   * @param x - The x coordinate on the screen
   * @param y - The y coordinate on the screen
   * @param amount - Positive for scroll up, negative for scroll down
   */
  static async scrollAt(x: number, y: number, amount: number): Promise<void> {
    await invoke("scroll_at", {
      x: Math.floor(x),
      y: Math.floor(y),
      amount,
    });
  }

  /**
   * Starts a drag operation from the specified coordinates.
   * @param x - The x coordinate on the screen
   * @param y - The y coordinate on the screen
   */
  static async dragStart(x: number, y: number): Promise<void> {
    await invoke("drag_start", {
      x: Math.floor(x),
      y: Math.floor(y),
    });
  }

  /**
   * Ends a drag operation at the specified coordinates.
   * @param x - The x coordinate on the screen
   * @param y - The y coordinate on the screen
   */
  static async dragEnd(x: number, y: number): Promise<void> {
    await invoke("drag_end", {
      x: Math.floor(x),
      y: Math.floor(y),
    });
  }
}
