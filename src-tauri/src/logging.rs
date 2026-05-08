use simplelog::*;
use std::fs::{self, OpenOptions};
use tauri::api::path::local_data_dir;

pub fn init_logging() {
    let log_dir = match local_data_dir() {
        Some(d) => d.join("GaragePro").join("logs"),
        None => {
            eprintln!("[GaragePro] Could not determine local data dir for logs");
            return;
        }
    };

    if let Err(e) = fs::create_dir_all(&log_dir) {
        eprintln!("[GaragePro] Failed to create log directory: {}", e);
        return;
    }

    let log_path = log_dir.join("garagepro.log");

    let log_file = match OpenOptions::new().create(true).append(true).open(&log_path) {
        Ok(f) => f,
        Err(e) => {
            eprintln!("[GaragePro] Failed to open log file: {}", e);
            return;
        }
    };

    let config = ConfigBuilder::new()
        .set_time_format_rfc2822()
        .build();

    let mut loggers: Vec<Box<dyn SharedLogger>> = vec![
        WriteLogger::new(LevelFilter::Info, config.clone(), log_file),
    ];

    // Only write to terminal in debug builds (release has no console window on Windows)
    #[cfg(debug_assertions)]
    loggers.push(
        TermLogger::new(LevelFilter::Debug, config, TerminalMode::Mixed, ColorChoice::Auto)
    );

    // ok() — init fails if called twice (e.g. in tests), which is harmless
    CombinedLogger::init(loggers).ok();

    log::info!("=== GaragePro started. Log file: {} ===", log_path.display());
}

pub fn log_file_path() -> Option<String> {
    local_data_dir().map(|d| {
        d.join("GaragePro")
            .join("logs")
            .join("garagepro.log")
            .to_string_lossy()
            .into_owned()
    })
}
