use crate::backup::{create_backup as create_backup_impl, list_backups as list_backups_impl, restore_backup as restore_backup_impl, get_last_backup_date as get_last_backup_date_impl, BackupInfo};

#[tauri::command]
pub fn create_backup() -> Result<String, String> {
    create_backup_impl()
}

#[tauri::command]
pub fn restore_backup(path: String) -> Result<(), String> {
    restore_backup_impl(path)
}

#[tauri::command]
pub fn list_backups() -> Result<Vec<BackupInfo>, String> {
    list_backups_impl()
}

#[tauri::command]
pub fn get_last_backup_date() -> Result<String, String> {
    get_last_backup_date_impl()
}
