//! # MouseController Module
//! 
//! Handles all mouse-related operations for FKBR.
//! Wraps the enigo library to provide cross-platform input simulation.
//! 
//! ## Features
//! - Move cursor to absolute screen coordinates
//! - Left, right, middle, and double click
//! - Scroll wheel (vertical)
//! - Drag operations (press/release)
//! 
//! @author Fanaperana
//! @license MIT
//! @see https://github.com/Fanaperana/fkbr

use enigo::{Button, Coordinate, Direction::{Click, Press, Release}, Enigo, Mouse, Settings};

/// MouseController handles all mouse-related operations for the application.
/// It wraps the enigo library to provide a clean interface for mouse actions.
pub struct MouseController {
    enigo: Enigo,
}

impl MouseController {
    /// Creates a new MouseController instance.
    pub fn new() -> Result<Self, String> {
        let enigo = Enigo::new(&Settings::default())
            .map_err(|e| format!("Failed to create Enigo instance: {}", e))?;
        Ok(Self { enigo })
    }

    /// Moves the mouse cursor to the specified absolute screen coordinates.
    pub fn move_to(&mut self, x: i32, y: i32) -> Result<(), String> {
        self.enigo
            .move_mouse(x, y, Coordinate::Abs)
            .map_err(|e| format!("Failed to move mouse: {}", e))
    }

    /// Performs a left mouse button click at the current cursor position.
    pub fn left_click(&mut self) -> Result<(), String> {
        self.enigo
            .button(Button::Left, Click)
            .map_err(|e| format!("Failed to perform left click: {}", e))
    }

    /// Performs a right mouse button click at the current cursor position.
    pub fn right_click(&mut self) -> Result<(), String> {
        self.enigo
            .button(Button::Right, Click)
            .map_err(|e| format!("Failed to perform right click: {}", e))
    }

    /// Performs a middle mouse button click at the current cursor position.
    pub fn middle_click(&mut self) -> Result<(), String> {
        self.enigo
            .button(Button::Middle, Click)
            .map_err(|e| format!("Failed to perform middle click: {}", e))
    }

    /// Performs a double left click at the current cursor position.
    pub fn double_click(&mut self) -> Result<(), String> {
        self.left_click()?;
        std::thread::sleep(std::time::Duration::from_millis(50));
        self.left_click()
    }

    /// Scrolls the mouse wheel vertically (positive = up, negative = down).
    pub fn scroll(&mut self, amount: i32) -> Result<(), String> {
        self.enigo
            .scroll(amount, enigo::Axis::Vertical)
            .map_err(|e| format!("Failed to scroll: {}", e))
    }

    /// Presses and holds the left mouse button (for drag start).
    pub fn press_left(&mut self) -> Result<(), String> {
        self.enigo
            .button(Button::Left, Press)
            .map_err(|e| format!("Failed to press left button: {}", e))
    }

    /// Releases the left mouse button (for drag end).
    pub fn release_left(&mut self) -> Result<(), String> {
        self.enigo
            .button(Button::Left, Release)
            .map_err(|e| format!("Failed to release left button: {}", e))
    }

    /// Moves to coordinates and performs a left click.
    pub fn click_at(&mut self, x: i32, y: i32) -> Result<(), String> {
        self.move_to(x, y)?;
        self.left_click()
    }

    /// Moves to coordinates and performs a right click.
    pub fn right_click_at(&mut self, x: i32, y: i32) -> Result<(), String> {
        self.move_to(x, y)?;
        self.right_click()
    }
}

impl Default for MouseController {
    fn default() -> Self {
        Self::new().expect("Failed to create default MouseController")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mouse_controller_creation() {
        let controller = MouseController::new();
        assert!(controller.is_ok());
    }
}
