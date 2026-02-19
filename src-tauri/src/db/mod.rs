use rusqlite::{Connection, Result};
use std::fs;
use std::path::PathBuf;
use tauri::api::path::local_data_dir;
use uuid::Uuid;

const SCHEMA_SQL: &str = include_str!("schema.sql");

pub fn normalize_gr(input: &str) -> String {
    let mut out = String::with_capacity(input.len());

    for ch in input.chars() {
        let mapped = match ch {
            'ά' | 'α' | 'Ά' | 'Α' => 'α',
            'έ' | 'ε' | 'Έ' | 'Ε' => 'ε',
            'ή' | 'η' | 'Ή' | 'Η' => 'η',
            'ί' | 'ϊ' | 'ΐ' | 'ι' | 'Ί' | 'Ϊ' => 'ι',
            'ό' | 'ο' | 'Ό' | 'Ο' => 'ο',
            'ύ' | 'ϋ' | 'ΰ' | 'υ' | 'Ύ' | 'Ϋ' => 'υ',
            'ώ' | 'ω' | 'Ώ' | 'Ω' => 'ω',
            _ => ch.to_lowercase().next().unwrap_or(ch),
        };
        out.push(mapped);
    }

    out.trim().to_string()
}

pub fn get_db_path() -> PathBuf {
    let mut path = local_data_dir().expect("Failed to get local data directory");
    path.push("GaragePro");

    if !path.exists() {
        fs::create_dir_all(&path).expect("Failed to create GaragePro directory");
    }

    path.push("app.db");
     // ✅ DEBUG: δείχνει ΠΑΝΤΑ το πραγματικό path της βάσης
    println!("[GaragePro][DB] Using database at: {}", path.display());
    path
}

pub fn initialize_db() -> Result<()> {
    let db_path = get_db_path();
    println!("[GaragePro][DB] Initializing DB at: {}", db_path.display());
    let conn = Connection::open(&db_path)?;

    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "busy_timeout", 5000)?;

    conn.execute_batch(SCHEMA_SQL)?;
    migrate_customers_search_columns(&conn)?;
    Ok(())
}

pub fn migrate_customers_search_columns(conn: &Connection) -> rusqlite::Result<()> {
    let _ = conn.execute("ALTER TABLE customers ADD COLUMN name_search TEXT", []);
    let _ = conn.execute("ALTER TABLE customers ADD COLUMN email_search TEXT", []);
    let _ = conn.execute("ALTER TABLE customers ADD COLUMN phone_search TEXT", []);
    let _ = conn.execute("ALTER TABLE customers ADD COLUMN afm_search TEXT", []);

    let _ = conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_customers_name_search ON customers(name_search)",
        [],
    );
    let _ = conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_customers_email_search ON customers(email_search)",
        [],
    );
    let _ = conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_customers_phone_search ON customers(phone_search)",
        [],
    );
    let _ = conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_customers_afm_search ON customers(afm_search)",
        [],
    );

    Ok(())
}

pub fn backfill_customers_search_columns(conn: &Connection) -> rusqlite::Result<()> {


    let mut stmt = conn.prepare("SELECT id, name, email, phone, afm FROM customers")?;
    let rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,         // id
            row.get::<_, String>(1)?,         // name
            row.get::<_, Option<String>>(2)?, // email
            row.get::<_, Option<String>>(3)?, // phone
            row.get::<_, Option<String>>(4)?, // afm
        ))
    })?;

    for r in rows {
        let (id, name, email, phone, afm) = r?;

        let name_search = normalize_gr(&name);
        let email_search = normalize_gr(email.as_deref().unwrap_or(""));
        let phone_search = normalize_gr(phone.as_deref().unwrap_or(""));
        let afm_search = normalize_gr(afm.as_deref().unwrap_or(""));

        conn.execute(
            "UPDATE customers
             SET name_search = ?1,
                 email_search = ?2,
                 phone_search = ?3,
                 afm_search = ?4
             WHERE id = ?5",
            rusqlite::params![name_search, email_search, phone_search, afm_search, id],
        )?;
    }

    Ok(())
}
 fn customers_search_needs_backfill(conn: &Connection) -> rusqlite::Result<bool> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM customers WHERE name_search IS NULL OR name_search = '' LIMIT 1",
        [],
        |row| row.get(0),
    )?;
    Ok(count > 0)
}
pub fn get_connection() -> Result<Connection> {
    let db_path = get_db_path();
    let conn = Connection::open(&db_path)?;

    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "busy_timeout", 5000)?;

    migrate_customers_search_columns(&conn)?;

    if customers_search_needs_backfill(&conn)? {
        println!("[GaragePro][DB] Running customers search backfill...");
        backfill_customers_search_columns(&conn)?;
    }

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
