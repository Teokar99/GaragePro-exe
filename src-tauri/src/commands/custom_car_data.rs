use crate::repositories::custom_car_data::{self, CustomCarEntry};

#[tauri::command]
pub fn get_all_custom_makes() -> Result<Vec<String>, String> {
    custom_car_data::get_all_custom_makes().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_custom_models_for_make(make: String) -> Result<Vec<String>, String> {
    custom_car_data::get_custom_models_for_make(make).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_custom_entry(make: String, model: Option<String>) -> Result<CustomCarEntry, String> {
    custom_car_data::add_custom_entry(make, model).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_all_custom_entries() -> Result<Vec<CustomCarEntry>, String> {
    custom_car_data::list_all_custom_entries().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_custom_entry(id: String) -> Result<(), String> {
    custom_car_data::delete_custom_entry(id).map_err(|e| e.to_string())
}
