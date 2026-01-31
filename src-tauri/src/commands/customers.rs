use crate::models::{Customer, CustomerWithVehicleCount, CustomerWithVehicles, PaginatedResult};
use crate::repositories::customers;

#[tauri::command]
pub fn list_customers(
    search: Option<String>,
    page: u32,
    per_page: u32,
) -> Result<PaginatedResult<CustomerWithVehicleCount>, String> {
    customers::list_customers(search, page, per_page).map_err(|e| e.to_string())
}
#[tauri::command]
pub fn list_all_customers() -> Result<Vec<Customer>, String> {
    customers::list_all_customers().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_customer(
    name: String,
    email: Option<String>,
    phone: Option<String>,
    address: Option<String>,
    afm: Option<String>,
) -> Result<Customer, String> {
    customers::create_customer(name, email, phone, address, afm).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_all_customers_with_vehicle_count(
) -> Result<Vec<CustomerWithVehicleCount>, String> {
    customers::list_all_customers_with_vehicle_count()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_customer(
    id: String,
    name: String,
    email: Option<String>,
    phone: Option<String>,
    address: Option<String>,
    afm: Option<String>,
) -> Result<Customer, String> {
    customers::update_customer(id, name, email, phone, address, afm).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_customer(id: String) -> Result<(), String> {
    customers::delete_customer(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_customer_with_vehicles(id: String) -> Result<Option<CustomerWithVehicles>, String> {
    customers::get_customer_with_vehicles(id).map_err(|e| e.to_string())
}
#[tauri::command]
pub fn get_customer_stats() -> Result<crate::repositories::customers::CustomerStats, String> {
    crate::repositories::customers::get_customer_stats().map_err(|e| e.to_string())
}
