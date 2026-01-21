use crate::db::{generate_uuid, get_connection};
use crate::models::{PaginatedResult, ServiceItem, ServiceRecord, ServiceRecordWithDetails};
use chrono::Utc;
use rusqlite::Result;

fn parse_services_json(services_json: &str) -> Vec<ServiceItem> {
    // Πρώτη προσπάθεια: όπως είναι
    println!("parse_services_json called, len={}", services_json.len());
    if let Ok(items) = serde_json::from_str::<Vec<ServiceItem>>(services_json) {
        return items;
    }

    // Tolerant fallback: διορθώνει keys quantity/unit_price <-> qty/unitPrice
    let val: serde_json::Value = match serde_json::from_str(services_json) {
        Ok(v) => v,
        Err(_) => return vec![],
    };

    let arr = match val.as_array() {
        Some(a) => a,
        None => return vec![],
    };

    let mut fixed: Vec<serde_json::Value> = Vec::with_capacity(arr.len());

    for item in arr {
        let mut obj = match item.as_object() {
            Some(o) => o.clone(),
            None => continue,
        };

        // quantity <-> qty
        if !obj.contains_key("qty") && obj.contains_key("quantity") {
            obj.insert("qty".to_string(), obj["quantity"].clone());
        }
        if !obj.contains_key("quantity") && obj.contains_key("qty") {
            obj.insert("quantity".to_string(), obj["qty"].clone());
        }

        // unit_price <-> unitPrice
        if !obj.contains_key("unitPrice") && obj.contains_key("unit_price") {
            obj.insert("unitPrice".to_string(), obj["unit_price"].clone());
        }
        if !obj.contains_key("unit_price") && obj.contains_key("unitPrice") {
            obj.insert("unit_price".to_string(), obj["unitPrice"].clone());
        }

        fixed.push(serde_json::Value::Object(obj));
    }

    serde_json::from_value::<Vec<ServiceItem>>(serde_json::Value::Array(fixed))
        .unwrap_or_else(|_| vec![])
}


pub fn list_services(
    search: Option<String>,
    page: u32,
    per_page: u32,
) -> Result<PaginatedResult<ServiceRecordWithDetails>> {
    let conn = get_connection()?;
    let offset = (page - 1) * per_page;

    let (where_clause, search_param) = match search {
        Some(s) if !s.is_empty() => {
            let search_pattern = format!("%{}%", s);
            (
                "WHERE c.name LIKE ?1 OR v.make LIKE ?1 OR v.model LIKE ?1 OR v.license_plate LIKE ?1 OR sr.description LIKE ?1",
                Some(search_pattern),
            )
        }
        _ => ("", None),
    };

    let total: i32 = if let Some(ref param) = search_param {
        conn.query_row(
            &format!(
                "SELECT COUNT(*) FROM service_records sr
                 INNER JOIN vehicles v ON sr.vehicle_id = v.id
                 INNER JOIN customers c ON v.customer_id = c.id
                 {}",
                where_clause
            ),
            [param],
            |row| row.get(0),
        )?
    } else {
        conn.query_row("SELECT COUNT(*) FROM service_records", [], |row| {
            row.get(0)
        })?
    };

    let query = format!(
        "SELECT sr.id, sr.vehicle_id, sr.mechanic_id, sr.date, sr.description, sr.mileage,
                sr.notes, sr.services_json, sr.subtotal, sr.vat, sr.total, sr.created_at, sr.updated_at,
                v.make, v.model, v.year, v.license_plate, c.id, c.name, c.phone
         FROM service_records sr
         INNER JOIN vehicles v ON sr.vehicle_id = v.id
         INNER JOIN customers c ON v.customer_id = c.id
         {}
         ORDER BY sr.date DESC
         LIMIT ?{} OFFSET ?{}",
        where_clause,
        if search_param.is_some() { "2" } else { "1" },
        if search_param.is_some() { "3" } else { "2" }
    );

    let mut stmt = conn.prepare(&query)?;

    let items: Vec<ServiceRecordWithDetails> = if let Some(ref param) = search_param {
        let rows = stmt.query_map(
            [param, &per_page.to_string(), &offset.to_string()],
            |row| {
                let services_json: String = row.get(7)?;
                let services: Vec<ServiceItem> = parse_services_json(&services_json);

                Ok(ServiceRecordWithDetails {
                    id: row.get(0)?,
                    vehicle_id: row.get(1)?,
                    mechanic_id: row.get(2)?,
                    date: row.get(3)?,
                    description: row.get(4)?,
                    mileage: row.get(5)?,
                    notes: row.get(6)?,
                    services,
                    subtotal: row.get(8)?,
                    vat: row.get(9)?,
                    total: row.get(10)?,
                    created_at: row.get(11)?,
                    updated_at: row.get(12)?,
                    vehicle_make: row.get(13)?,
                    vehicle_model: row.get(14)?,
                    vehicle_year: row.get(15)?,
                    vehicle_license_plate: row.get(16)?,
                    customer_id: row.get(17)?,
                    customer_name: row.get(18)?,
                    customer_phone: row.get(19)?,
                })
            },
        )?;

        rows.collect::<Result<Vec<_>, _>>()?
    } else {
        let rows = stmt.query_map(
            [&per_page.to_string(), &offset.to_string()],
            |row| {
                let services_json: String = row.get(7)?;
                let services: Vec<ServiceItem> = parse_services_json(&services_json);

                Ok(ServiceRecordWithDetails {
                    id: row.get(0)?,
                    vehicle_id: row.get(1)?,
                    mechanic_id: row.get(2)?,
                    date: row.get(3)?,
                    description: row.get(4)?,
                    mileage: row.get(5)?,
                    notes: row.get(6)?,
                    services,
                    subtotal: row.get(8)?,
                    vat: row.get(9)?,
                    total: row.get(10)?,
                    created_at: row.get(11)?,
                    updated_at: row.get(12)?,
                    vehicle_make: row.get(13)?,
                    vehicle_model: row.get(14)?,
                    vehicle_year: row.get(15)?,
                    vehicle_license_plate: row.get(16)?,
                    customer_id: row.get(17)?,
                    customer_name: row.get(18)?,
                    customer_phone: row.get(19)?,
                })
            },
        )?;

        rows.collect::<Result<Vec<_>, _>>()?
    };

    let total_pages = ((total as f32) / (per_page as f32)).ceil() as u32;

    Ok(PaginatedResult {
        items,
        total,
        page,
        per_page,
        total_pages,
    })
}

pub fn create_service(
    vehicle_id: String,
    mechanic_id: Option<String>,
    date: String,
    description: Option<String>,
    mileage: Option<i32>,
    notes: Option<String>,
    services: Vec<ServiceItem>,
    subtotal: f64,
    vat: f64,
    total: f64,
) -> Result<ServiceRecord> {
    let conn = get_connection()?;
    let id = generate_uuid();
    let now = Utc::now().to_rfc3339();

    let services_json = serde_json::to_string(&services)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

    conn.execute(
        "INSERT INTO service_records (id, vehicle_id, mechanic_id, date, description, mileage, notes,
                                      services_json, subtotal, vat, total, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        rusqlite::params![
            &id,
            &vehicle_id,
            &mechanic_id,
            &date,
            &description,
            &mileage,
            &notes,
            &services_json,
            &subtotal,
            &vat,
            &total,
            &now,
            &now
        ],
    )?;

    Ok(ServiceRecord {
        id,
        vehicle_id,
        mechanic_id,
        date,
        description,
        mileage,
        notes,
        services,
        subtotal,
        vat,
        total,
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn update_service(
    id: String,
    date: String,
    description: Option<String>,
    mileage: Option<i32>,
    notes: Option<String>,
    services: Vec<ServiceItem>,
    subtotal: f64,
    vat: f64,
    total: f64,
) -> Result<ServiceRecord> {
    let conn = get_connection()?;
    let updated_at = Utc::now().to_rfc3339();

    let services_json = serde_json::to_string(&services)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

    conn.execute(
        "UPDATE service_records SET date = ?1, description = ?2, mileage = ?3, notes = ?4,
                                    services_json = ?5, subtotal = ?6, vat = ?7, total = ?8, updated_at = ?9
         WHERE id = ?10",
        rusqlite::params![
            &date,
            &description,
            &mileage,
            &notes,
            &services_json,
            &subtotal,
            &vat,
            &total,
            &updated_at,
            &id
        ],
    )?;

    let service = conn.query_row(
        "SELECT id, vehicle_id, mechanic_id, date, description, mileage, notes, services_json,
                subtotal, vat, total, created_at, updated_at
         FROM service_records WHERE id = ?1",
        [&id],
        |row| {
            let services_json: String = row.get(7)?;
            let services: Vec<ServiceItem> = parse_services_json(&services_json);

            Ok(ServiceRecord {
                id: row.get(0)?,
                vehicle_id: row.get(1)?,
                mechanic_id: row.get(2)?,
                date: row.get(3)?,
                description: row.get(4)?,
                mileage: row.get(5)?,
                notes: row.get(6)?,
                services,
                subtotal: row.get(8)?,
                vat: row.get(9)?,
                total: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        },
    )?;

    Ok(service)
}

pub fn delete_service(id: String) -> Result<()> {
    let conn = get_connection()?;
    let rows_affected = conn.execute("DELETE FROM service_records WHERE id = ?1", [&id])?;

    if rows_affected == 0 {
        return Err(rusqlite::Error::QueryReturnedNoRows);
    }

    Ok(())
}

pub fn get_service(id: String) -> Result<Option<ServiceRecord>> {
    let conn = get_connection()?;

    let service = conn.query_row(
        "SELECT id, vehicle_id, mechanic_id, date, description, mileage, notes, services_json,
                subtotal, vat, total, created_at, updated_at
         FROM service_records WHERE id = ?1",
        [id],
        |row| {
            let services_json: String = row.get(7)?;
            let services: Vec<ServiceItem> = parse_services_json(&services_json);

            Ok(ServiceRecord {
                id: row.get(0)?,
                vehicle_id: row.get(1)?,
                mechanic_id: row.get(2)?,
                date: row.get(3)?,
                description: row.get(4)?,
                mileage: row.get(5)?,
                notes: row.get(6)?,
                services,
                subtotal: row.get(8)?,
                vat: row.get(9)?,
                total: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        },
    );

    match service {
        Ok(s) => Ok(Some(s)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}

pub fn list_services_by_vehicle(vehicle_id: String) -> Result<Vec<ServiceRecord>> {
    let conn = get_connection()?;

    let mut stmt = conn.prepare(
        "SELECT id, vehicle_id, mechanic_id, date, description, mileage, notes, services_json,
                subtotal, vat, total, created_at, updated_at
         FROM service_records WHERE vehicle_id = ?1 ORDER BY date DESC",
    )?;

    let services = stmt
        .query_map([vehicle_id], |row| {
            let services_json: String = row.get(7)?;
            let services: Vec<ServiceItem> = parse_services_json(&services_json);

            Ok(ServiceRecord {
                id: row.get(0)?,
                vehicle_id: row.get(1)?,
                mechanic_id: row.get(2)?,
                date: row.get(3)?,
                description: row.get(4)?,
                mileage: row.get(5)?,
                notes: row.get(6)?,
                services,
                subtotal: row.get(8)?,
                vat: row.get(9)?,
                total: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        })?
        .collect();

    services
}
