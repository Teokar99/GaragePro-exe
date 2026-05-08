#[tauri::command]
pub fn log_to_file(level: String, message: String) {
    match level.as_str() {
        "error" => log::error!("[UI] {}", message),
        "warn"  => log::warn!("[UI] {}", message),
        "info"  => log::info!("[UI] {}", message),
        _       => log::debug!("[UI] {}", message),
    }
}

#[tauri::command]
pub fn get_log_path() -> Option<String> {
    crate::logging::log_file_path()
}
