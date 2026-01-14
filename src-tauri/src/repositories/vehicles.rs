use crate::db::{generate_uuid, get_connection};
use crate::models::{Vehicle, VehicleWithCustomer};
use chrono::Utc;
use rusqlite::Result;

pub fn create_vehicle(
    customer_id: String,
    make: String,
    model: String,
    year: i32,
    license_plate: Option<String>,
    vin: Option<String>,
) -> Result<Vehicle> {
    let conn = get_connection()?;
    let id = generate_uuid();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO vehicles (id, customer_id, make, model, year, license_plate, vin, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![&id, &customer_id, &make, &model, &year, &license_plate, &vin, &now, &now],
    )?;

    Ok(Vehicle {
        id,
        customer_id,
        make,
        model,
        year,
        license_plate,
        vin,
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn list_vehicles_by_customer(customer_id: String) -> Result<Vec<Vehicle>> {
    let conn = get_connection()?;

    let mut stmt = conn.prepare(
        "SELECT id, customer_id, make, model, year, license_plate, vin, created_at, updated_at
         FROM vehicles WHERE customer_id = ?1 ORDER BY created_at DESC",
    )?;

    let vehicles = stmt
        .query_map([customer_id], |row| {
            Ok(Vehicle {
                id: row.get(0)?,
                customer_id: row.get(1)?,
                make: row.get(2)?,
                model: row.get(3)?,
                year: row.get(4)?,
                license_plate: row.get(5)?,
                vin: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?
        .collect();

    vehicles
}

pub fn get_vehicle(id: String) -> Result<Option<VehicleWithCustomer>> {
    let conn = get_connection()?;

    let vehicle = conn.query_row(
        "SELECT v.id, v.customer_id, v.make, v.model, v.year, v.license_plate, v.vin,
                v.created_at, v.updated_at, c.name, c.email, c.phone
         FROM vehicles v
         INNER JOIN customers c ON v.customer_id = c.id
         WHERE v.id = ?1",
        [id],
        |row| {
            Ok(VehicleWithCustomer {
                id: row.get(0)?,
                customer_id: row.get(1)?,
                make: row.get(2)?,
                model: row.get(3)?,
                year: row.get(4)?,
                license_plate: row.get(5)?,
                vin: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                customer_name: row.get(9)?,
                customer_email: row.get(10)?,
                customer_phone: row.get(11)?,
            })
        },
    );

    match vehicle {
        Ok(v) => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}

pub fn update_vehicle(
    id: String,
    make: String,
    model: String,
    year: i32,
    license_plate: Option<String>,
    vin: Option<String>,
) -> Result<Vehicle> {
    let conn = get_connection()?;
    let updated_at = Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE vehicles SET make = ?1, model = ?2, year = ?3, license_plate = ?4, vin = ?5, updated_at = ?6
         WHERE id = ?7",
        rusqlite::params![&make, &model, &year, &license_plate, &vin, &updated_at, &id],
    )?;

    let vehicle = conn.query_row(
        "SELECT id, customer_id, make, model, year, license_plate, vin, created_at, updated_at
         FROM vehicles WHERE id = ?1",
        [&id],
        |row| {
            Ok(Vehicle {
                id: row.get(0)?,
                customer_id: row.get(1)?,
                make: row.get(2)?,
                model: row.get(3)?,
                year: row.get(4)?,
                license_plate: row.get(5)?,
                vin: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        },
    )?;

    Ok(vehicle)
}

pub fn delete_vehicle(id: String) -> Result<()> {
    let conn = get_connection()?;
    let rows_affected = conn.execute("DELETE FROM vehicles WHERE id = ?1", [&id])?;

    if rows_affected == 0 {
        return Err(rusqlite::Error::QueryReturnedNoRows);
    }

    Ok(())
}
