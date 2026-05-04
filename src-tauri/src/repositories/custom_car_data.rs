use crate::db::{generate_uuid, get_connection};
use chrono::Utc;
use rusqlite::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomCarEntry {
    pub id: String,
    pub make: String,
    pub model: Option<String>,
    pub created_at: String,
}

pub fn get_all_custom_makes() -> Result<Vec<String>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT DISTINCT make FROM custom_car_data ORDER BY make ASC",
    )?;
    let makes = stmt
        .query_map([], |row| row.get(0))?
        .collect::<Result<Vec<String>, _>>()?;
    Ok(makes)
}

pub fn get_custom_models_for_make(make: String) -> Result<Vec<String>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT model FROM custom_car_data WHERE make = ?1 AND model IS NOT NULL ORDER BY model ASC",
    )?;
    let models = stmt
        .query_map([&make], |row| row.get(0))?
        .collect::<Result<Vec<String>, _>>()?;
    Ok(models)
}

pub fn add_custom_entry(make: String, model: Option<String>) -> Result<CustomCarEntry> {
    let conn = get_connection()?;
    let id = generate_uuid();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT OR IGNORE INTO custom_car_data (id, make, model, created_at) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![&id, &make, &model, &now],
    )?;

    let entry = conn.query_row(
        "SELECT id, make, model, created_at FROM custom_car_data
         WHERE make = ?1 AND COALESCE(model, '') = COALESCE(?2, '')",
        rusqlite::params![&make, &model],
        |row| {
            Ok(CustomCarEntry {
                id: row.get(0)?,
                make: row.get(1)?,
                model: row.get(2)?,
                created_at: row.get(3)?,
            })
        },
    )?;

    Ok(entry)
}

pub fn list_all_custom_entries() -> Result<Vec<CustomCarEntry>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, make, model, created_at FROM custom_car_data ORDER BY make ASC, model ASC",
    )?;
    let entries = stmt
        .query_map([], |row| {
            Ok(CustomCarEntry {
                id: row.get(0)?,
                make: row.get(1)?,
                model: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?
        .collect::<Result<Vec<CustomCarEntry>, _>>()?;
    Ok(entries)
}

pub fn delete_custom_entry(id: String) -> Result<()> {
    let conn = get_connection()?;
    let rows = conn.execute("DELETE FROM custom_car_data WHERE id = ?1", [&id])?;
    if rows == 0 {
        return Err(rusqlite::Error::QueryReturnedNoRows);
    }
    Ok(())
}
