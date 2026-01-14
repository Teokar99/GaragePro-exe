use crate::models::{DashboardStats, ServiceRecordWithDetails};
use crate::repositories::dashboard;

#[tauri::command]
pub fn get_dashboard_stats() -> Result<DashboardStats, String> {
    dashboard::get_stats().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_recent_services(limit: u32) -> Result<Vec<ServiceRecordWithDetails>, String> {
    dashboard::get_recent_services(limit).map_err(|e| e.to_string())
}
