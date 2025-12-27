use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager, Runtime, Window,
};
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

mod mouse;

use mouse::MouseController;

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

/// Sets up the system tray for the application.
fn setup_tray<R: Runtime>(app: &tauri::App<R>) -> Result<(), Box<dyn std::error::Error>> {
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&quit_item])?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .menu_on_left_click(true)
        .on_menu_event(|app, event| {
            if event.id == "quit" {
                app.exit(0);
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
            Ok(())
        })
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![click_at, left_click, right_click])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
