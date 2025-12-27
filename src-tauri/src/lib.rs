//! # FKBR - F*cking Keyboard
//! 
//! Backend library for the FKBR mouseless application.
//! Provides Tauri commands for mouse control, system tray, and global shortcuts.
//! 
//! ## Architecture
//! - `mouse.rs`: MouseController for input simulation via enigo
//! - Tauri commands: click_at, left_click, right_click, double_click, scroll_at, etc.
//! - Global shortcut handler for overlay activation
//! - System tray with settings access
//! 
//! @author Fanaperana
//! @license MIT
//! @see https://github.com/Fanaperana/fkbr

use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager, Runtime, Window, Emitter,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

mod mouse;

use mouse::MouseController;

/// Global state to track the current shortcut
static CURRENT_SHORTCUT: Mutex<Option<Shortcut>> = Mutex::new(None);

/// Click types supported by the application.
#[derive(serde::Deserialize, Clone, Copy)]
#[serde(rename_all = "lowercase")]
pub enum ClickType {
    Left,
    Right,
    Middle,
}

impl Default for ClickType {
    fn default() -> Self {
        ClickType::Left
    }
}

/// Performs a mouse click at the specified coordinates.
///
/// This command hides the overlay window, moves the cursor to the target position,
/// performs the specified click action, and saves the window state.
#[tauri::command]
fn click_at<R: Runtime>(
    app: AppHandle<R>,
    window: Window<R>,
    x: i32,
    y: i32,
    click_type: Option<ClickType>,
) -> Result<(), String> {
    // Save window state before hiding
    app.save_window_state(StateFlags::all())
        .map_err(|e| format!("Failed to save window state: {}", e))?;

    // Create mouse controller
    let mut controller = MouseController::new()?;

    // Hide the overlay window before clicking
    window
        .hide()
        .map_err(|e| format!("Failed to hide window: {}", e))?;

    // Move to position
    controller.move_to(x, y)?;

    // Perform the appropriate click action
    match click_type.unwrap_or_default() {
        ClickType::Left => controller.left_click()?,
        ClickType::Right => controller.right_click()?,
        ClickType::Middle => controller.middle_click()?,
    }

    Ok(())
}

/// Performs a left click at the specified coordinates.
/// Convenience wrapper around click_at for left clicks.
#[tauri::command]
fn left_click<R: Runtime>(
    app: AppHandle<R>,
    window: Window<R>,
    x: i32,
    y: i32,
) -> Result<(), String> {
    click_at(app, window, x, y, Some(ClickType::Left))
}

/// Performs a right click at the specified coordinates.
/// Convenience wrapper around click_at for right clicks.
#[tauri::command]
fn right_click<R: Runtime>(
    app: AppHandle<R>,
    window: Window<R>,
    x: i32,
    y: i32,
) -> Result<(), String> {
    click_at(app, window, x, y, Some(ClickType::Right))
}

/// Performs a double click at the specified coordinates.
#[tauri::command]
fn double_click<R: Runtime>(
    app: AppHandle<R>,
    window: Window<R>,
    x: i32,
    y: i32,
) -> Result<(), String> {
    // Save window state before hiding
    app.save_window_state(StateFlags::all())
        .map_err(|e| format!("Failed to save window state: {}", e))?;

    let mut controller = MouseController::new()?;
    
    window
        .hide()
        .map_err(|e| format!("Failed to hide window: {}", e))?;

    controller.move_to(x, y)?;
    controller.double_click()
}

/// Scrolls at the specified coordinates.
/// Positive amount scrolls up, negative scrolls down.
#[tauri::command]
fn scroll_at<R: Runtime>(
    app: AppHandle<R>,
    window: Window<R>,
    x: i32,
    y: i32,
    amount: i32,
) -> Result<(), String> {
    app.save_window_state(StateFlags::all())
        .map_err(|e| format!("Failed to save window state: {}", e))?;

    let mut controller = MouseController::new()?;
    
    window
        .hide()
        .map_err(|e| format!("Failed to hide window: {}", e))?;

    controller.move_to(x, y)?;
    controller.scroll(amount)
}

/// Starts a drag operation from the specified coordinates.
#[tauri::command]
fn drag_start<R: Runtime>(
    _app: AppHandle<R>,
    _window: Window<R>,
    x: i32,
    y: i32,
) -> Result<(), String> {
    let mut controller = MouseController::new()?;
    controller.move_to(x, y)?;
    controller.press_left()
}

/// Ends a drag operation at the specified coordinates.
#[tauri::command]
fn drag_end<R: Runtime>(
    app: AppHandle<R>,
    window: Window<R>,
    x: i32,
    y: i32,
) -> Result<(), String> {
    app.save_window_state(StateFlags::all())
        .map_err(|e| format!("Failed to save window state: {}", e))?;

    let mut controller = MouseController::new()?;
    
    window
        .hide()
        .map_err(|e| format!("Failed to hide window: {}", e))?;

    controller.move_to(x, y)?;
    controller.release_left()
}

/// Parse modifier string to Modifiers enum
fn parse_modifiers(mods: &[String]) -> Modifiers {
    let mut result = Modifiers::empty();
    for m in mods {
        match m.as_str() {
            "Control" => result |= Modifiers::CONTROL,
            "Alt" => result |= Modifiers::ALT,
            "Shift" => result |= Modifiers::SHIFT,
            "Super" => result |= Modifiers::SUPER,
            _ => {}
        }
    }
    result
}

/// Parse key string to Code enum
fn parse_key(key: &str) -> Option<Code> {
    match key {
        "A" => Some(Code::KeyA),
        "B" => Some(Code::KeyB),
        "C" => Some(Code::KeyC),
        "D" => Some(Code::KeyD),
        "E" => Some(Code::KeyE),
        "F" => Some(Code::KeyF),
        "G" => Some(Code::KeyG),
        "H" => Some(Code::KeyH),
        "I" => Some(Code::KeyI),
        "J" => Some(Code::KeyJ),
        "K" => Some(Code::KeyK),
        "L" => Some(Code::KeyL),
        "M" => Some(Code::KeyM),
        "N" => Some(Code::KeyN),
        "O" => Some(Code::KeyO),
        "P" => Some(Code::KeyP),
        "Q" => Some(Code::KeyQ),
        "R" => Some(Code::KeyR),
        "S" => Some(Code::KeyS),
        "T" => Some(Code::KeyT),
        "U" => Some(Code::KeyU),
        "V" => Some(Code::KeyV),
        "W" => Some(Code::KeyW),
        "X" => Some(Code::KeyX),
        "Y" => Some(Code::KeyY),
        "Z" => Some(Code::KeyZ),
        "F1" => Some(Code::F1),
        "F2" => Some(Code::F2),
        "F3" => Some(Code::F3),
        "F4" => Some(Code::F4),
        "F5" => Some(Code::F5),
        "F6" => Some(Code::F6),
        "F7" => Some(Code::F7),
        "F8" => Some(Code::F8),
        "F9" => Some(Code::F9),
        "F10" => Some(Code::F10),
        "F11" => Some(Code::F11),
        "F12" => Some(Code::F12),
        _ => None,
    }
}

/// Updates the global shortcut
#[tauri::command]
fn update_shortcut<R: Runtime>(
    app: AppHandle<R>,
    modifiers: Vec<String>,
    key: String,
) -> Result<(), String> {
    let mods = parse_modifiers(&modifiers);
    let code = parse_key(&key).ok_or_else(|| format!("Invalid key: {}", key))?;
    
    // Unregister old shortcut
    if let Ok(mut current) = CURRENT_SHORTCUT.lock() {
        if let Some(old_shortcut) = current.take() {
            let _ = app.global_shortcut().unregister(old_shortcut);
        }
        
        // Create and register new shortcut
        let new_shortcut = Shortcut::new(Some(mods), code);
        app.global_shortcut()
            .register(new_shortcut)
            .map_err(|e| format!("Failed to register shortcut: {}", e))?;
        
        *current = Some(new_shortcut);
    }
    
    Ok(())
}

/// Opens the settings dialog
#[tauri::command]
fn open_settings<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    app.emit("open-settings", ())
        .map_err(|e| format!("Failed to emit event: {}", e))
}

/// Sets up the system tray for the application.
fn setup_tray<R: Runtime>(app: &tauri::App<R>) -> Result<(), Box<dyn std::error::Error>> {
    // Shortcut info items (disabled, just for display)
    let shortcut_header = MenuItem::with_id(app, "header", "⌨️ Keyboard Shortcuts", false, None::<&str>)?;
    let show_overlay = MenuItem::with_id(app, "show", "  Ctrl+Alt+I  →  Show Overlay", false, None::<&str>)?;
    let click_info = MenuItem::with_id(app, "click", "  [Coord]+[1-9]  →  Click at position", false, None::<&str>)?;
    let mode_info = MenuItem::with_id(app, "mode", "  Tab  →  Cycle: L-Click / R-Click / Dbl-Click", false, None::<&str>)?;
    let escape_info = MenuItem::with_id(app, "escape", "  Esc  →  Clear input / Hide overlay", false, None::<&str>)?;
    
    let separator1 = PredefinedMenuItem::separator(app)?;
    let settings_item = MenuItem::with_id(app, "settings", "⚙️ Settings...", true, None::<&str>)?;
    let separator2 = PredefinedMenuItem::separator(app)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    
    let menu = Menu::with_items(app, &[
        &shortcut_header,
        &show_overlay,
        &click_info,
        &mode_info,
        &escape_info,
        &separator1,
        &settings_item,
        &separator2,
        &quit_item,
    ])?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(true)
        .tooltip("FKBR - Keyboard Mouse Control\nCtrl+Alt+I to activate")
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "quit" => app.exit(0),
                "settings" => {
                    // Show main window and emit settings event
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                    let _ = app.emit("open-settings", ());
                }
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            setup_tray(app)?;
            
            // Register default global shortcut on Rust side for reliability
            let default_shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyI);
            
            // Store the current shortcut
            if let Ok(mut current) = CURRENT_SHORTCUT.lock() {
                *current = Some(default_shortcut);
            }
            
            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(move |app, _shortcut, event| {
                        // Check if this is the current shortcut
                        if let ShortcutState::Pressed = event.state {
                            // Show and focus the main window
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    })
                    .build(),
            )?;
            
            // Register the default shortcut
            app.global_shortcut().register(default_shortcut)?;
            
            Ok(())
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            click_at,
            left_click,
            right_click,
            double_click,
            scroll_at,
            drag_start,
            drag_end,
            update_shortcut,
            open_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
