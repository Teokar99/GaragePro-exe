use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::time::Instant;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub full_name: String,
    pub role: String,
}

#[derive(Debug)]
pub struct SessionData {
    pub current_user: Option<User>,
    pub last_activity: Instant,
}

pub struct AppState {
    pub session: Mutex<SessionData>,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            session: Mutex::new(SessionData {
                current_user: None,
                last_activity: Instant::now(),
            }),
        }
    }

    pub fn update_activity(&self) {
        if let Ok(mut session) = self.session.lock() {
            session.last_activity = Instant::now();
        }
    }

    pub fn set_user(&self, user: Option<User>) {
        if let Ok(mut session) = self.session.lock() {
            session.current_user = user;
            session.last_activity = Instant::now();
        }
    }

    pub fn get_user(&self) -> Option<User> {
        if let Ok(session) = self.session.lock() {
            session.current_user.clone()
        } else {
            None
        }
    }

    pub fn clear_user(&self) {
        if let Ok(mut session) = self.session.lock() {
            session.current_user = None;
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
