use crate::db::{generate_uuid, get_connection};
use crate::models::AppUser;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::Utc;
use rusqlite::Result;

pub fn is_first_run() -> Result<bool> {
    let conn = get_connection()?;
    let count: i32 = conn.query_row("SELECT COUNT(*) FROM app_users", [], |row| row.get(0))?;
    Ok(count == 0)
}

pub fn create_admin(full_name: String, pin: String) -> Result<AppUser> {
    let conn = get_connection()?;
    let id = generate_uuid();
    let created_at = Utc::now().to_rfc3339();

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let pin_hash = argon2
        .hash_password(pin.as_bytes(), &salt)
        .map_err(|e| {
            rusqlite::Error::ToSqlConversionFailure(Box::new(std::io::Error::new(
                std::io::ErrorKind::Other,
                e.to_string(),
            )))
        })?
        .to_string();

    conn.execute(
        "INSERT INTO app_users (id, full_name, role, pin_hash, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        [&id, &full_name, &"admin".to_string(), &pin_hash, &created_at],
    )?;

    Ok(AppUser {
        id,
        full_name,
        role: "admin".to_string(),
        created_at,
    })
}

pub fn verify_pin(pin: String) -> Result<Option<AppUser>> {
    let conn = get_connection()?;

    let mut stmt = conn.prepare("SELECT id, full_name, role, pin_hash, created_at FROM app_users")?;
    let mut rows = stmt.query([])?;

    while let Some(row) = rows.next()? {
        let stored_hash: String = row.get(3)?;

        let parsed_hash = PasswordHash::new(&stored_hash).map_err(|e| {
            rusqlite::Error::ToSqlConversionFailure(Box::new(std::io::Error::new(
                std::io::ErrorKind::Other,
                e.to_string(),
            )))
        })?;

        if Argon2::default()
            .verify_password(pin.as_bytes(), &parsed_hash)
            .is_ok()
        {
            return Ok(Some(AppUser {
                id: row.get(0)?,
                full_name: row.get(1)?,
                role: row.get(2)?,
                created_at: row.get(4)?,
            }));
        }
    }

    Ok(None)
}

pub fn get_user(id: String) -> Result<Option<AppUser>> {
    let conn = get_connection()?;

    let mut stmt = conn.prepare(
        "SELECT id, full_name, role, created_at FROM app_users WHERE id = ?1",
    )?;

    let user = stmt.query_row([id], |row| {
        Ok(AppUser {
            id: row.get(0)?,
            full_name: row.get(1)?,
            role: row.get(2)?,
            created_at: row.get(3)?,
        })
    });

    match user {
        Ok(u) => Ok(Some(u)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}
