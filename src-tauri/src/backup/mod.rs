use chrono::Local;
use rusqlite::{backup, Connection};
use std::fs;
use std::path::PathBuf;
use tauri::api::path::document_dir;

use crate::db::get_db_path;

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct BackupInfo {
    pub filename: String,
    pub path: String,
    pub created_at: String,
    pub size: u64,
}

pub fn get_backup_dir() -> Result<PathBuf, String> {
    let mut path = document_dir().ok_or("Failed to get documents directory")?;
    path.push("GaragePro");
    path.push("Backups");

    if !path.exists() {
        fs::create_dir_all(&path).map_err(|e| format!("Failed to create backup directory: {}", e))?;
    }

    Ok(path)
}

pub fn get_last_backup_file() -> Result<PathBuf, String> {
    let mut path = document_dir().ok_or("Failed to get documents directory")?;
    path.push("GaragePro");

    if !path.exists() {
        fs::create_dir_all(&path).map_err(|e| format!("Failed to create GaragePro directory: {}", e))?;
    }

    path.push("last_backup.txt");
    Ok(path)
}

pub fn get_last_backup_date() -> Result<String, String> {
    let last_backup_file = get_last_backup_file()?;

    if !last_backup_file.exists() {
        return Ok(String::new());
    }

    fs::read_to_string(&last_backup_file)
        .map_err(|e| format!("Failed to read last backup date: {}", e))
}

pub fn set_last_backup_date(date: &str) -> Result<(), String> {
    let last_backup_file = get_last_backup_file()?;
    fs::write(&last_backup_file, date)
        .map_err(|e| format!("Failed to write last backup date: {}", e))
}

pub fn create_backup() -> Result<String, String> {
    let backup_dir = get_backup_dir()?;
    let timestamp = Local::now().format("%Y%m%d_%H%M%S");
    let backup_filename = format!("app_backup_{}.db", timestamp);
    let backup_path = backup_dir.join(&backup_filename);

    let db_path = get_db_path();

    if !db_path.exists() {
        return Err("Database file does not exist".to_string());
    }

    let source_conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open source database: {}", e))?;

    let mut dest_conn = Connection::open(&backup_path)
        .map_err(|e| format!("Failed to create backup database: {}", e))?;

    let backup_handle = backup::Backup::new(&source_conn, &mut dest_conn)
        .map_err(|e| format!("Failed to create backup handle: {}", e))?;

    backup_handle
        .run_to_completion(100, std::time::Duration::from_millis(10), None)
        .map_err(|e| format!("Failed to complete backup: {}", e))?;

    let today = Local::now().format("%Y-%m-%d").to_string();
    set_last_backup_date(&today)?;

    Ok(backup_path.to_string_lossy().to_string())
}

pub fn restore_backup(backup_path: String) -> Result<(), String> {
    let backup_file = PathBuf::from(&backup_path);

    if !backup_file.exists() {
        return Err("Backup file does not exist".to_string());
    }

    let safety_backup_path = create_backup()
        .map_err(|e| format!("Failed to create safety backup before restore: {}", e))?;

    let db_path = get_db_path();

    let wal_path = db_path.with_extension("db-wal");
    let shm_path = db_path.with_extension("db-shm");
    if wal_path.exists() {
        fs::remove_file(&wal_path)
            .map_err(|e| format!("Failed to remove WAL file: {}", e))?;
    }
    if shm_path.exists() {
        fs::remove_file(&shm_path)
            .map_err(|e| format!("Failed to remove SHM file: {}", e))?;
    }

    fs::copy(&backup_file, &db_path)
        .map_err(|e| {
            let _ = restore_backup(safety_backup_path);
            format!("Failed to restore backup: {}", e)
        })?;

    crate::db::initialize_db()
        .map_err(|e| format!("Failed to initialize restored database: {}", e))?;

    Ok(())
}

pub fn list_backups() -> Result<Vec<BackupInfo>, String> {
    let backup_dir = get_backup_dir()?;

    let mut backups = Vec::new();

    let entries = fs::read_dir(&backup_dir)
        .map_err(|e| format!("Failed to read backup directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("db") {
            if let Some(filename) = path.file_name().and_then(|s| s.to_str()) {
                let metadata = fs::metadata(&path)
                    .map_err(|e| format!("Failed to read file metadata: {}", e))?;

                let created_at = metadata.modified()
                    .ok()
                    .and_then(|t| {
                        let datetime: chrono::DateTime<Local> = t.into();
                        Some(datetime.format("%Y-%m-%d %H:%M:%S").to_string())
                    })
                    .unwrap_or_else(|| "Unknown".to_string());

                backups.push(BackupInfo {
                    filename: filename.to_string(),
                    path: path.to_string_lossy().to_string(),
                    created_at,
                    size: metadata.len(),
                });
            }
        }
    }

    backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(backups)
}

pub fn check_and_create_backup() -> Result<(), String> {
    let today = Local::now().format("%Y-%m-%d").to_string();
    let last_backup = get_last_backup_date().unwrap_or_else(|_| String::new());

    if last_backup != today {
        create_backup()?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_backup_dir_creation() {
        let result = get_backup_dir();
        assert!(result.is_ok());
        let path = result.unwrap();
        assert!(path.exists());
    }
}
