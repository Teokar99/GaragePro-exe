use crate::db::{generate_uuid, get_connection};
use crate::models::{Customer, CustomerWithVehicleCount, CustomerWithVehicles, PaginatedResult, Vehicle,};
use chrono::Utc;
use rusqlite::Result;
use serde::{Deserialize, Serialize};

pub fn list_customers(
    search: Option<String>,
    page: u32,
    per_page: u32,
) -> Result<PaginatedResult<CustomerWithVehicleCount>> {
    let conn = get_connection()?;
    let offset = (page - 1) * per_page;

let (where_clause, search_param) = match search {
    Some(s) if !s.trim().is_empty() => {
        let s_norm = crate::db::normalize_gr(s.trim());
        let search_pattern = format!("%{}%", s_norm);

        (
            "WHERE c.name_search  LIKE ?1
               OR c.email_search LIKE ?1
               OR c.phone_search LIKE ?1
               OR c.afm_search   LIKE ?1",
            Some(search_pattern),
        )
    }
    _ => ("", None),
};



    let total: i32 = if let Some(ref param) = search_param {
        conn.query_row(
            &format!("SELECT COUNT(*) FROM customers c {}", where_clause),
            [param],
            |row| row.get(0),
        )?
    } else {
        conn.query_row("SELECT COUNT(*) FROM customers", [], |row| row.get(0))?
    };

    let query = format!(
        "SELECT c.id, c.name, c.email, c.phone, c.address, c.afm, c.created_at, c.updated_at,
         (SELECT COUNT(*) FROM vehicles v WHERE v.customer_id = c.id) as vehicle_count
         FROM customers c
         {}
         ORDER BY c.name ASC
         LIMIT ?{} OFFSET ?{}",
        where_clause,
        if search_param.is_some() { "2" } else { "1" },
        if search_param.is_some() { "3" } else { "2" }
    );

    let mut stmt = conn.prepare(&query)?;

    let items: Vec<CustomerWithVehicleCount> = if let Some(ref param) = search_param {
        let rows = stmt.query_map(
            [param, &per_page.to_string(), &offset.to_string()],
            |row| {
                Ok(CustomerWithVehicleCount {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    email: row.get(2)?,
                    phone: row.get(3)?,
                    address: row.get(4)?,
                    afm: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                    vehicle_count: row.get(8)?,
                })
            },
        )?;

        rows.collect::<Result<Vec<_>, _>>()?
    } else {
        let rows = stmt.query_map(
            [&per_page.to_string(), &offset.to_string()],
            |row| {
                Ok(CustomerWithVehicleCount {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    email: row.get(2)?,
                    phone: row.get(3)?,
                    address: row.get(4)?,
                    afm: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                    vehicle_count: row.get(8)?,
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
#[derive(Debug, Serialize, Deserialize)]
pub struct CustomerStats {
    pub total_customers: i32,
    pub total_vehicles: i32,
}
pub fn get_customer_stats() -> Result<CustomerStats> {
    let conn = get_connection()?;

    let total_customers: i32 =
        conn.query_row("SELECT COUNT(*) FROM customers", [], |row| row.get(0))?;

    let total_vehicles: i32 =
        conn.query_row("SELECT COUNT(*) FROM vehicles", [], |row| row.get(0))?;

    Ok(CustomerStats {
        total_customers,
        total_vehicles,
    })
}



pub fn list_all_customers() -> rusqlite::Result<Vec<Customer>> {
    let conn = get_connection()?;

    let mut stmt = conn.prepare(
        "SELECT id, name, email, phone, address, afm, created_at, updated_at
         FROM customers
         ORDER BY name ASC",
    )?;

    let rows = stmt.query_map([], |row| {
        Ok(Customer {
            id: row.get(0)?,
            name: row.get(1)?,
            email: row.get(2)?,
            phone: row.get(3)?,
            address: row.get(4)?,
            afm: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        })
    })?;

    rows.collect::<rusqlite::Result<Vec<_>>>()
}
pub fn list_all_customers_with_vehicle_count(
) -> rusqlite::Result<Vec<CustomerWithVehicleCount>> {
    let conn = get_connection()?;

    let mut stmt = conn.prepare(
        "
        SELECT 
          c.id,
          c.name,
          c.email,
          c.phone,
          c.address,
          c.afm,
          c.created_at,
          c.updated_at,
          COUNT(v.id) as vehicle_count
        FROM customers c
        LEFT JOIN vehicles v ON v.customer_id = c.id
        GROUP BY c.id
        ORDER BY c.name ASC
        ",
    )?;

    let rows = stmt.query_map([], |row| {
        Ok(CustomerWithVehicleCount {
            id: row.get(0)?,
            name: row.get(1)?,
            email: row.get(2)?,
            phone: row.get(3)?,
            address: row.get(4)?,
            afm: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
            vehicle_count: row.get(8)?,
        })
    })?;

    rows.collect::<rusqlite::Result<Vec<_>>>()
}


pub fn create_customer(
    name: String,
    email: Option<String>,
    phone: Option<String>,
    address: Option<String>,
    afm: Option<String>,
) -> Result<Customer> {
    let conn = get_connection()?;
    let id = generate_uuid();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO customers (id, name, email, phone, address, afm, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        rusqlite::params![&id, &name, &email, &phone, &address, &afm, &now, &now],
    )?;

    Ok(Customer {
        id,
        name,
        email,
        phone,
        address,
        afm,
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn update_customer(
    id: String,
    name: String,
    email: Option<String>,
    phone: Option<String>,
    address: Option<String>,
    afm: Option<String>,
) -> Result<Customer> {
    let conn = get_connection()?;
    let updated_at = Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE customers SET name = ?1, email = ?2, phone = ?3, address = ?4, afm = ?5, updated_at = ?6
         WHERE id = ?7",
        rusqlite::params![&name, &email, &phone, &address, &afm, &updated_at, &id],
    )?;

    let customer = conn.query_row(
        "SELECT id, name, email, phone, address, afm, created_at, updated_at FROM customers WHERE id = ?1",
        [&id],
        |row| {
            Ok(Customer {
                id: row.get(0)?,
                name: row.get(1)?,
                email: row.get(2)?,
                phone: row.get(3)?,
                address: row.get(4)?,
                afm: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        },
    )?;

    Ok(customer)
}

pub fn delete_customer(id: String) -> Result<()> {
    let conn = get_connection()?;
    let rows_affected = conn.execute("DELETE FROM customers WHERE id = ?1", [&id])?;

    if rows_affected == 0 {
        return Err(rusqlite::Error::QueryReturnedNoRows);
    }

    Ok(())
}

pub fn get_customer_with_vehicles(id: String) -> Result<Option<CustomerWithVehicles>> {
    let conn = get_connection()?;

    let customer = conn.query_row(
        "SELECT id, name, email, phone, address, afm, created_at, updated_at FROM customers WHERE id = ?1",
        [&id],
        |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, Option<String>>(4)?,
                row.get::<_, Option<String>>(5)?,
                row.get::<_, String>(6)?,
                row.get::<_, String>(7)?,
            ))
        },
    );

    match customer {
        Ok((cid, name, email, phone, address, afm, created_at, updated_at)) => {
            let mut stmt = conn.prepare(
                "SELECT id, customer_id, make, model, year, license_plate, vin, created_at, updated_at
                 FROM vehicles WHERE customer_id = ?1 ORDER BY created_at DESC",
            )?;

            let vehicles = stmt
                .query_map([&cid], |row| {
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
                .collect::<Result<Vec<Vehicle>>>()?;

            Ok(Some(CustomerWithVehicles {
                id: cid,
                name,
                email,
                phone,
                address,
                afm,
                created_at,
                updated_at,
                vehicles,
            }))
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}
