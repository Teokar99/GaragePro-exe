use crate::models::{PaginatedResult, ServiceItem, ServiceRecord, ServiceRecordWithDetails};
use crate::repositories::services;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceInput {
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
}

#[tauri::command]
pub fn list_services(
    search: Option<String>,
    page: u32,
    per_page: u32,
) -> Result<PaginatedResult<ServiceRecordWithDetails>, String> {
    services::list_services(search, page, per_page).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_service(service_data: ServiceInput) -> Result<ServiceRecord, String> {
    services::create_service(
        service_data.vehicle_id,
        service_data.mechanic_id,
        service_data.date,
        service_data.description,
        service_data.mileage,
        service_data.notes,
        service_data.services,
        service_data.subtotal,
        service_data.vat,
        service_data.total,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_service(id: String, service_data: ServiceInput) -> Result<ServiceRecord, String> {
    services::update_service(
        id,
        service_data.date,
        service_data.description,
        service_data.mileage,
        service_data.notes,
        service_data.services,
        service_data.subtotal,
        service_data.vat,
        service_data.total,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_service(id: String) -> Result<(), String> {
    services::delete_service(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_service(id: String) -> Result<Option<ServiceRecord>, String> {
    services::get_service(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_services_by_vehicle(vehicle_id: String) -> Result<Vec<ServiceRecord>, String> {
    services::list_services_by_vehicle(vehicle_id).map_err(|e| e.to_string())
}
