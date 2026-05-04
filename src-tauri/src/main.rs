// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod backup;
mod commands;
mod db;
mod models;
mod repositories;
mod state;

use state::AppState;

fn main() {
  db::initialize_db().expect("Failed to initialize database");

  if let Err(e) = backup::check_and_create_backup() {
    eprintln!("Warning: Failed to create automatic backup: {}", e);
  }

  tauri::Builder::default()
    .manage(AppState::new())
    .invoke_handler(tauri::generate_handler![
      commands::auth::check_first_run,
      commands::customers::list_all_customers,
      commands::customers::list_all_customers_with_vehicle_count,
      commands::auth::setup_admin_pin,
      commands::auth::login_with_pin,
      commands::auth::logout,
      commands::auth::check_session,
      commands::backup::create_backup,
      commands::backup::restore_backup,
      commands::backup::list_backups,
      commands::backup::get_last_backup_date,
      commands::dashboard::get_dashboard_stats,
      commands::dashboard::get_recent_services,
      commands::customers::list_customers,
      commands::customers::create_customer,
      commands::customers::update_customer,
      commands::customers::delete_customer,
      commands::customers::get_customer_with_vehicles,
      commands::vehicles::list_vehicles,
      commands::vehicles::create_vehicle,
      commands::vehicles::list_vehicles_by_customer,
      commands::vehicles::get_vehicle,
      commands::vehicles::update_vehicle,
      commands::vehicles::delete_vehicle,
      commands::custom_car_data::get_all_custom_makes,
      commands::custom_car_data::get_custom_models_for_make,
      commands::custom_car_data::add_custom_entry,
      commands::custom_car_data::list_all_custom_entries,
      commands::custom_car_data::delete_custom_entry,
      commands::services::list_services,
      commands::services::create_service,
      commands::services::update_service,
      commands::services::delete_service,
      commands::services::get_service,
      commands::services::list_services_by_vehicle,
      commands::customers::get_customer_stats,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
