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
            'ς' => 'σ', // final sigma → regular sigma so caps/lowercase match
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
    log::debug!("Database path: {}", path.display());
    path
}

pub fn initialize_db() -> Result<()> {
    let db_path = get_db_path();
    log::info!("Initializing DB at: {}", db_path.display());
    let conn = Connection::open(&db_path)?;

    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "busy_timeout", 5000)?;

    conn.execute_batch(SCHEMA_SQL)?;
    migrate_customers_search_columns(&conn)?;
    migrate_vehicles_engine_code(&conn)?;
    migrate_custom_car_data(&conn)?;
    migrate_service_records_description_search(&conn)?;
    migrate_vehicles_license_plate_search(&conn)?;
    migrate_sigma_normalization(&conn)?;
    Ok(())
}

pub fn migrate_vehicles_engine_code(conn: &Connection) -> rusqlite::Result<()> {
    let _ = conn.execute("ALTER TABLE vehicles ADD COLUMN engine_code TEXT", []);
    Ok(())
}

pub fn migrate_vehicles_license_plate_search(conn: &Connection) -> rusqlite::Result<()> {
    let _ = conn.execute("ALTER TABLE vehicles ADD COLUMN license_plate_search TEXT", []);
    let _ = conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate_search ON vehicles(license_plate_search)",
        [],
    );
    // Backfill existing rows
    let plates: Vec<(String, String)> = {
        let mut stmt = conn.prepare(
            "SELECT id, license_plate FROM vehicles WHERE license_plate_search IS NULL AND license_plate IS NOT NULL",
        )?;
        let collected = stmt.query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?
            .collect::<rusqlite::Result<_>>()?;
        collected
    };
    for (id, plate) in plates {
        let plate_search = normalize_gr(&plate);
        conn.execute(
            "UPDATE vehicles SET license_plate_search = ?1 WHERE id = ?2",
            rusqlite::params![plate_search, id],
        )?;
    }
    Ok(())
}

pub fn migrate_service_records_description_search(conn: &Connection) -> rusqlite::Result<()> {
    let _ = conn.execute("ALTER TABLE service_records ADD COLUMN description_search TEXT", []);
    let _ = conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_service_records_description_search ON service_records(description_search)",
        [],
    );
    Ok(())
}

pub fn backfill_service_records_description_search(conn: &Connection) -> rusqlite::Result<()> {
    let mut stmt = conn.prepare("SELECT id, description FROM service_records WHERE description_search IS NULL")?;
    let rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, Option<String>>(1)?,
        ))
    })?;

    for r in rows {
        let (id, description) = r?;
        let description_search = normalize_gr(description.as_deref().unwrap_or(""));
        conn.execute(
            "UPDATE service_records SET description_search = ?1 WHERE id = ?2",
            rusqlite::params![description_search, id],
        )?;
    }
    Ok(())
}

pub fn migrate_sigma_normalization(conn: &Connection) -> rusqlite::Result<()> {
    // Replace final sigma ς→σ in all search columns so uppercase/lowercase Greek matches correctly.
    // ς (U+03C2) never lowercases to σ (U+03C3) in Unicode, so ΓΙΩΡΓΟΣ and Γιώργος would
    // produce different search tokens without this fix.
    conn.execute_batch(
        "UPDATE customers
         SET name_search  = replace(name_search,  'ς', 'σ'),
             email_search = replace(email_search, 'ς', 'σ'),
             phone_search = replace(phone_search, 'ς', 'σ'),
             afm_search   = replace(afm_search,   'ς', 'σ')
         WHERE name_search  LIKE '%ς%'
            OR email_search LIKE '%ς%'
            OR phone_search LIKE '%ς%'
            OR afm_search   LIKE '%ς%';

         UPDATE vehicles
         SET license_plate_search = replace(license_plate_search, 'ς', 'σ')
         WHERE license_plate_search LIKE '%ς%';

         UPDATE service_records
         SET description_search = replace(description_search, 'ς', 'σ')
         WHERE description_search LIKE '%ς%';"
    )?;
    Ok(())
}

pub fn migrate_custom_car_data(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS custom_car_data (
            id TEXT PRIMARY KEY,
            make TEXT NOT NULL,
            model TEXT,
            created_at TEXT NOT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_car_data_make_model
            ON custom_car_data(make, COALESCE(model, ''));",
    )?;
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
    migrate_vehicles_engine_code(&conn)?;
    migrate_custom_car_data(&conn)?;
    migrate_service_records_description_search(&conn)?;
    migrate_vehicles_license_plate_search(&conn)?;

    if customers_search_needs_backfill(&conn)? {
        log::info!("Running customers search backfill...");
        backfill_customers_search_columns(&conn)?;
    }

    backfill_service_records_description_search(&conn)?;
    migrate_sigma_normalization(&conn)?;

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
