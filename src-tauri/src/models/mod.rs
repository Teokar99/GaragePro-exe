use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppUser {
    pub id: String,
    pub full_name: String,
    pub role: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Customer {
    pub id: String,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub afm: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomerWithVehicleCount {
    pub id: String,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub afm: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub vehicle_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vehicle {
    pub id: String,
    pub customer_id: String,
    pub make: String,
    pub model: String,
    pub year: i32,
    pub license_plate: Option<String>,
    pub vin: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VehicleWithCustomer {
    pub id: String,
    pub customer_id: String,
    pub make: String,
    pub model: String,
    pub year: i32,
    pub license_plate: Option<String>,
    pub vin: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub customer_name: String,
    pub customer_email: Option<String>,
    pub customer_phone: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomerWithVehicles {
    pub id: String,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub afm: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub vehicles: Vec<Vehicle>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceItem {
    pub description: String,
    pub quantity: f64,
    pub unit_price: f64,
    pub total: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceRecord {
    pub id: String,
    pub vehicle_id: String,
    pub mechanic_id: Option<String>,
    pub date: String,
    pub description: Option<String>,
    pub mileage: Option<i32>,
    pub notes: Option<String>,
    pub services: Vec<ServiceItem>,
    pub subtotal: f64,
    pub vat: f64,
    pub total: f64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceRecordWithDetails {
    pub id: String,
    pub vehicle_id: String,
    pub mechanic_id: Option<String>,
    pub date: String,
    pub description: Option<String>,
    pub mileage: Option<i32>,
    pub notes: Option<String>,
    pub services: Vec<ServiceItem>,
    pub subtotal: f64,
    pub vat: f64,
    pub total: f64,
    pub created_at: String,
    pub updated_at: String,
    pub vehicle_make: String,
    pub vehicle_model: String,
    pub vehicle_year: i32,
    pub vehicle_license_plate: Option<String>,
    pub customer_id: String,
    pub customer_name: String,
    pub customer_phone: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardStats {
    pub customers_count: i32,
    pub vehicles_count: i32,
    pub monthly_services: i32,
    pub total_revenue: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginatedResult<T> {
    pub items: Vec<T>,
    pub total: i32,
    pub page: u32,
    pub per_page: u32,
    pub total_pages: u32,
}
