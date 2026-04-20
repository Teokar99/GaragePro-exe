use crate::db::{generate_uuid, get_connection};
use crate::models::{PaginatedResult, Vehicle, VehicleWithCustomer};
use chrono::Utc;
use rusqlite::Result;

pub fn create_vehicle(
    customer_id: String,
    make: String,
    model: String,
    year: i32,
    license_plate: Option<String>,
    vin: Option<String>,
    engine_code: Option<String>,
) -> Result<Vehicle> {
    let conn = get_connection()?;
    let id = generate_uuid();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO vehicles (id, customer_id, make, model, year, license_plate, vin, engine_code, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        rusqlite::params![&id, &customer_id, &make, &model, &year, &license_plate, &vin, &engine_code, &now, &now],
    )?;

    Ok(Vehicle {
        id,
        customer_id,
        make,
        model,
        year,
        license_plate,
        vin,
        engine_code,
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn list_vehicles_by_customer(customer_id: String) -> Result<Vec<Vehicle>> {
    let conn = get_connection()?;

    let mut stmt = conn.prepare(
        "SELECT id, customer_id, make, model, year, license_plate, vin, engine_code, created_at, updated_at
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
                engine_code: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?
        .collect();

    vehicles
}

pub fn get_vehicle(id: String) -> Result<Option<VehicleWithCustomer>> {
    let conn = get_connection()?;

    let vehicle = conn.query_row(
        "SELECT v.id, v.customer_id, v.make, v.model, v.year, v.license_plate, v.vin,
                v.engine_code, v.created_at, v.updated_at, c.name, c.email, c.phone
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
                engine_code: row.get(7)?,
                last_mileage: None,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
                customer_name: row.get(10)?,
                customer_email: row.get(11)?,
                customer_phone: row.get(12)?,
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
    engine_code: Option<String>,
) -> Result<Vehicle> {
    let conn = get_connection()?;
    let updated_at = Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE vehicles SET make = ?1, model = ?2, year = ?3, license_plate = ?4, vin = ?5, engine_code = ?6, updated_at = ?7
         WHERE id = ?8",
        rusqlite::params![&make, &model, &year, &license_plate, &vin, &engine_code, &updated_at, &id],
    )?;

    let vehicle = conn.query_row(
        "SELECT id, customer_id, make, model, year, license_plate, vin, engine_code, created_at, updated_at
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
                engine_code: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        },
    )?;

    Ok(vehicle)
}

pub fn list_vehicles(
    search: Option<String>,
    page: u32,
    per_page: u32,
) -> Result<PaginatedResult<VehicleWithCustomer>> {
    let conn = get_connection()?;
    let offset = page.saturating_sub(1) * per_page;

    let map_row = |row: &rusqlite::Row| -> rusqlite::Result<VehicleWithCustomer> {
        Ok(VehicleWithCustomer {
            id: row.get(0)?,
            customer_id: row.get(1)?,
            make: row.get(2)?,
            model: row.get(3)?,
            year: row.get(4)?,
            license_plate: row.get(5)?,
            vin: row.get(6)?,
            engine_code: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
            customer_name: row.get(10)?,
            customer_email: row.get(11)?,
            customer_phone: row.get(12)?,
            last_mileage: row.get(13)?,
        })
    };

    let (total, items) = match search.as_deref().filter(|s| !s.is_empty()) {
        Some(s) => {
            let pattern = format!("%{}%", crate::db::normalize_gr(s.trim()));
            let total: i32 = conn.query_row(
                "SELECT COUNT(*) FROM vehicles v
                 INNER JOIN customers c ON v.customer_id = c.id
                 WHERE c.name_search LIKE ?1 OR c.phone_search LIKE ?1 OR c.email_search LIKE ?1
                    OR v.make LIKE ?1 OR v.model LIKE ?1
                    OR v.license_plate LIKE ?1 OR v.vin LIKE ?1
                    OR v.engine_code LIKE ?1",
                rusqlite::params![&pattern],
                |row| row.get(0),
            )?;

            let mut stmt = conn.prepare(
                "SELECT v.id, v.customer_id, v.make, v.model, v.year,
                        v.license_plate, v.vin, v.engine_code, v.created_at, v.updated_at,
                        c.name, c.email, c.phone,
                        (SELECT sr.mileage FROM service_records sr
                         WHERE sr.vehicle_id = v.id AND sr.mileage IS NOT NULL
                         ORDER BY sr.date DESC LIMIT 1) AS last_mileage
                 FROM vehicles v
                 INNER JOIN customers c ON v.customer_id = c.id
                 WHERE c.name_search LIKE ?1 OR c.phone_search LIKE ?1 OR c.email_search LIKE ?1
                    OR v.make LIKE ?1 OR v.model LIKE ?1
                    OR v.license_plate LIKE ?1 OR v.vin LIKE ?1
                    OR v.engine_code LIKE ?1
                 ORDER BY c.name ASC, v.created_at DESC
                 LIMIT ?2 OFFSET ?3",
            )?;
            let items: Vec<VehicleWithCustomer> = stmt
                .query_map(rusqlite::params![&pattern, &per_page, &offset], map_row)?
                .collect::<Result<_, _>>()?;
            (total, items)
        }
        None => {
            let total: i32 = conn.query_row(
                "SELECT COUNT(*) FROM vehicles",
                [],
                |row| row.get(0),
            )?;
            let mut stmt = conn.prepare(
                "SELECT v.id, v.customer_id, v.make, v.model, v.year,
                        v.license_plate, v.vin, v.engine_code, v.created_at, v.updated_at,
                        c.name, c.email, c.phone,
                        (SELECT sr.mileage FROM service_records sr
                         WHERE sr.vehicle_id = v.id AND sr.mileage IS NOT NULL
                         ORDER BY sr.date DESC LIMIT 1) AS last_mileage
                 FROM vehicles v
                 INNER JOIN customers c ON v.customer_id = c.id
                 ORDER BY c.name ASC, v.created_at DESC
                 LIMIT ?1 OFFSET ?2",
            )?;
            let items: Vec<VehicleWithCustomer> = stmt
                .query_map(rusqlite::params![&per_page, &offset], map_row)?
                .collect::<Result<_, _>>()?;
            (total, items)
        }
    };

    let total_pages = (((total as f32) / (per_page as f32)).ceil() as u32).max(1);

    Ok(PaginatedResult {
        items,
        total,
        page,
        per_page,
        total_pages,
    })
}

pub fn delete_vehicle(id: String) -> Result<()> {
    let conn = get_connection()?;
    let rows_affected = conn.execute("DELETE FROM vehicles WHERE id = ?1", [&id])?;

    if rows_affected == 0 {
        return Err(rusqlite::Error::QueryReturnedNoRows);
    }

    Ok(())
}
