use crate::repositories::auth;
use crate::state::{AppState, User};
use tauri::State;

#[derive(Debug, serde::Serialize)]
pub struct AuthResponse {
    pub success: bool,
    pub user: Option<User>,
    pub message: Option<String>,
}

#[tauri::command]
pub fn check_first_run() -> Result<bool, String> {
    auth::is_first_run().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn setup_admin_pin(full_name: String, pin: String) -> Result<User, String> {
    let app_user = auth::create_admin(full_name, pin).map_err(|e| e.to_string())?;

    Ok(User {
        id: app_user.id,
        full_name: app_user.full_name,
        role: app_user.role,
    })
}

#[tauri::command]
pub fn login_with_pin(pin: String, state: State<AppState>) -> Result<AuthResponse, String> {
    match auth::verify_pin(pin).map_err(|e| e.to_string())? {
        Some(app_user) => {
            let user = User {
                id: app_user.id,
                full_name: app_user.full_name,
                role: app_user.role,
            };

            state.set_user(Some(user.clone()));

            Ok(AuthResponse {
                success: true,
                user: Some(user),
                message: None,
            })
        }
        None => Ok(AuthResponse {
            success: false,
            user: None,
            message: Some("Invalid PIN".to_string()),
        }),
    }
}

#[tauri::command]
pub fn logout(state: State<AppState>) -> Result<(), String> {
    state.clear_user();
    Ok(())
}

#[tauri::command]
pub fn check_session(state: State<AppState>) -> Result<Option<User>, String> {
    state.update_activity();
    Ok(state.get_user())
}
