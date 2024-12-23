#[allow(unused_imports)]
use tauri::{AppHandle, Manager, Runtime, Window};
#[allow(unused_imports)]
use enigo::{
    Button, Coordinate,
    Direction::Click,
    Enigo, Mouse, Settings,
};
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
};
#[allow(unused_imports)]
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

#[tauri::command]
fn click_here<R: Runtime>(app: AppHandle<R>, window: Window<R>, x: i32, y: i32) {
    app.save_window_state(StateFlags::all()).unwrap();
    let mut enigo = Enigo::new(&Settings::default()).unwrap();
    window.hide().unwrap();
    let _ = enigo.move_mouse(x, y, Coordinate::Abs);
    let _ = enigo.button(Button::Left, Click);
    // let _ = enigo.button(Button::Left, Click);
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit_i])?;
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .menu_on_left_click(true)
                .build(app)?;
            Ok(())
        })
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, click_here])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
