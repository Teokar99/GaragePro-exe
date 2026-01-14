use crate::models::{Vehicle, VehicleWithCustomer};
use crate::repositories::vehicles;

#[tauri::command]
pub fn create_vehicle(
    customer_id: String,
    make: String,
    model: String,
    year: i32,
    license_plate: Option<String>,
    vin: Option<String>,
) -> Result<Vehicle, String> {
    vehicles::create_vehicle(customer_id, make, model, year, license_plate, vin)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_vehicles_by_customer(customer_id: String) -> Result<Vec<Vehicle>, String> {
    vehicles::list_vehicles_by_customer(customer_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_vehicle(id: String) -> Result<Option<VehicleWithCustomer>, String> {
    vehicles::get_vehicle(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_vehicle(
    id: String,
    make: String,
    model: String,
    year: i32,
    license_plate: Option<String>,
    vin: Option<String>,
) -> Result<Vehicle, String> {
    vehicles::update_vehicle(id, make, model, year, license_plate, vin).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_vehicle(id: String) -> Result<(), String> {
    vehicles::delete_vehicle(id).map_err(|e| e.to_string())
}
