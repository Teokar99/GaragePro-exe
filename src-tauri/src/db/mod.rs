use rusqlite::{Connection, Result};
use std::fs;
use std::path::PathBuf;
use tauri::api::path::local_data_dir;
use uuid::Uuid;

const SCHEMA_SQL: &str = include_str!("schema.sql");

pub fn get_db_path() -> PathBuf {
    let mut path = local_data_dir().expect("Failed to get local data directory");
    path.push("GaragePro");

    if !path.exists() {
        fs::create_dir_all(&path).expect("Failed to create GaragePro directory");
    }

    path.push("app.db");
    path
}

pub fn initialize_db() -> Result<()> {
    let db_path = get_db_path();
    let conn = Connection::open(&db_path)?;

    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "busy_timeout", 5000)?;

    conn.execute_batch(SCHEMA_SQL)?;

    Ok(())
}

pub fn get_connection() -> Result<Connection> {
    let db_path = get_db_path();
    let conn = Connection::open(&db_path)?;

    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "busy_timeout", 5000)?;

    Ok(conn)
}

pub fn generate_uuid() -> String {
    Uuid::new_v4().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_uuid() {
        let uuid1 = generate_uuid();
        let uuid2 = generate_uuid();

        assert_ne!(uuid1, uuid2);
        assert_eq!(uuid1.len(), 36);
    }

    #[test]
    fn test_db_path() {
        let path = get_db_path();
        assert!(path.to_str().unwrap().contains("GaragePro"));
        assert!(path.to_str().unwrap().ends_with("app.db"));
    }
}
