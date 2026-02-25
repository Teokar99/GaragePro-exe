use crate::db::get_connection;
use crate::models::{DashboardStats, ServiceItem, ServiceRecordWithDetails};
use chrono::{Datelike, Utc};
use rusqlite::Result;

pub fn get_stats() -> Result<DashboardStats> {
    let conn = get_connection()?;

    let customers_count: i32 = conn.query_row("SELECT COUNT(*) FROM customers", [], |row| {
        row.get(0)
    })?;

    let vehicles_count: i32 = conn.query_row("SELECT COUNT(*) FROM vehicles", [], |row| {
        row.get(0)
    })?;

    let current_date = Utc::now();
    let current_year = current_date.year();
    let current_month = current_date.month();
    let month_start = format!("{:04}-{:02}-01", current_year, current_month);
    let next_month = if current_month == 12 {
        format!("{:04}-01-01", current_year + 1)
    } else {
        format!("{:04}-{:02}-01", current_year, current_month + 1)
    };

    let monthly_services: i32 = conn.query_row(
        "SELECT COUNT(*) FROM service_records WHERE date >= ?1 AND date < ?2",
        [&month_start, &next_month],
        |row| row.get(0),
    )?;

    let total_revenue: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total), 0.0) FROM service_records WHERE date >= ?1 AND date < ?2",
            [&month_start, &next_month],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    Ok(DashboardStats {
        customers_count,
        vehicles_count,
        monthly_services,
        total_revenue,
    })
}

pub fn get_recent_services(limit: u32) -> Result<Vec<ServiceRecordWithDetails>> {
    let conn = get_connection()?;

    let mut stmt = conn.prepare(
        "SELECT sr.id, sr.vehicle_id, sr.mechanic_id, sr.date, sr.description, sr.mileage,
                sr.notes, sr.services_json, sr.subtotal, sr.vat, sr.total, sr.created_at, sr.updated_at,
                v.make, v.model, v.year, v.license_plate, c.id, c.name, c.phone
         FROM service_records sr
         INNER JOIN vehicles v ON sr.vehicle_id = v.id
         INNER JOIN customers c ON v.customer_id = c.id
        ORDER BY COALESCE(sr.updated_at, sr.created_at) DESC, sr.date DESC
         LIMIT ?1",
    )?;

    let services = stmt
        .query_map([limit], |row| {
            let services_json: String = row.get(7)?;
            let services: Vec<ServiceItem> = serde_json::from_str(&services_json)
                .unwrap_or_else(|_| vec![]);

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
        })?
        .collect();

    services
}
