# GaragePro - Developer Documentation

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [UUID String IDs](#uuid-string-ids)
6. [Repository Pattern](#repository-pattern)
7. [Authentication System](#authentication-system)
8. [Backup System](#backup-system)
9. [Development Setup](#development-setup)
10. [Building for Production](#building-for-production)
11. [Project Structure](#project-structure)
12. [Key Design Decisions](#key-design-decisions)
13. [Testing Strategy](#testing-strategy)
14. [Performance Considerations](#performance-considerations)
15. [Security Considerations](#security-considerations)

---

## Overview

GaragePro is a desktop garage management system built with Tauri, React, and TypeScript. It's designed to run completely offline with local SQLite storage and automatic daily backups.

**Key Features**:
- Complete offline operation (no network dependencies)
- Secure PIN-based authentication with auto-lock
- Local SQLite database with WAL mode
- Automatic daily backup system (no background processes)
- UUID string-based IDs throughout
- Repository pattern architecture
- Type-safe Rust backend with IPC

**Target Platform**: Windows 10/11 (easily portable to macOS/Linux)

---

## Technology Stack

### Frontend
- **React 18.3.1**: UI framework
- **TypeScript 5.5.3**: Type safety and development experience
- **Vite 5.4.2**: Build tool and dev server
- **Tailwind CSS 3.4.1**: Utility-first CSS framework
- **Recharts 3.2.1**: Charts and graphs for dashboard
- **Lucide React**: Icon library

### Backend
- **Tauri 1.6.x**: Desktop application framework
- **Rust**: Backend language (stable)
- **SQLite**: Embedded database with rusqlite
- **Bcrypt**: PIN hashing (cost factor 10)
- **UUID**: Unique identifier generation
- **Chrono**: Date/time handling

### Build Tools
- **npm**: Package management
- **Tauri CLI**: Application bundling
- **ESLint**: Code linting
- **TypeScript Compiler**: Type checking

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────┐
│         React Frontend              │
│  (TypeScript + Tailwind CSS)        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Pages & Components        │   │
│  │   (UI Layer)                │   │
│  └──────────┬──────────────────┘   │
│             │                       │
│  ┌──────────▼──────────────────┐   │
│  │   Repositories              │   │
│  │   (Data Access Layer)       │   │
│  └──────────┬──────────────────┘   │
│             │                       │
│             │ invoke() - Tauri IPC │
└─────────────┼───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│         Rust Backend                │
│    (Tauri Application)              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Commands                  │   │
│  │   (IPC Handlers)            │   │
│  └──────────┬──────────────────┘   │
│             │                       │
│  ┌──────────▼──────────────────┐   │
│  │   Repositories              │   │
│  │   (Business Logic)          │   │
│  └──────────┬──────────────────┘   │
│             │                       │
│  ┌──────────▼──────────────────┐   │
│  │   Database Module           │   │
│  │   (SQLite with WAL)         │   │
│  └──────────┬──────────────────┘   │
│             │                       │
└─────────────┼───────────────────────┘
              │
              ▼
     ┌────────────────┐
     │  SQLite File   │
     │   app.db       │
     └────────────────┘
```

### Communication Flow

1. **User Action**: User interacts with React component
2. **Repository Call**: Component calls repository method
3. **IPC Invoke**: Repository uses `invoke()` to call Rust command
4. **Command Handler**: Rust command receives and validates input
5. **Business Logic**: Repository method executes database operations
6. **Database Query**: SQLite query executed
7. **Response**: Data flows back through the same chain
8. **UI Update**: Component updates with new data

### State Management

- **Authentication**: React Context (`useAuth`)
- **Auto-Lock**: Custom hook (`useAutoLock`)
- **Permissions**: Custom hook (`usePermissions`)
- **Session**: Tauri AppState (Rust side)
- **Component State**: React useState/useEffect

---

## Database Schema

### Technology

- **Database**: SQLite 3.x
- **WAL Mode**: Write-Ahead Logging for better concurrency
- **Busy Timeout**: 5000ms for handling concurrent access
- **Connection Pool**: Single connection per application instance

### Schema File

Location: `src-tauri/src/db/schema.sql`

### Tables

#### app_users

Stores application users (admin, secretary, mechanic roles).

```sql
CREATE TABLE IF NOT EXISTS app_users (
    id TEXT PRIMARY KEY,              -- UUID string
    full_name TEXT NOT NULL,          -- User's full name
    role TEXT DEFAULT 'admin',        -- Role: admin, secretary, mechanic
    pin_hash TEXT NOT NULL,           -- Bcrypt hash of PIN
    created_at TEXT NOT NULL          -- ISO 8601 timestamp
);
```

**Key Points**:
- `id` is TEXT (UUID string), not INTEGER
- `pin_hash` uses bcrypt with cost factor 10
- No email field (local-only application)
- `role` determines permissions

#### customers

Stores customer information.

```sql
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,              -- UUID string
    name TEXT NOT NULL,               -- Customer name
    email TEXT,                       -- Optional email
    phone TEXT,                       -- Optional phone
    address TEXT,                     -- Optional address
    afm TEXT,                         -- Optional tax ID (AFM)
    created_at TEXT NOT NULL,         -- ISO 8601 timestamp
    updated_at TEXT NOT NULL          -- ISO 8601 timestamp
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
```

**Indexes**:
- `idx_customers_name`: Speeds up name searches

#### vehicles

Stores vehicle information, linked to customers.

```sql
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,              -- UUID string
    customer_id TEXT NOT NULL,        -- Foreign key to customers
    make TEXT NOT NULL,               -- Vehicle make (Toyota, Ford, etc.)
    model TEXT NOT NULL,              -- Vehicle model
    year INTEGER NOT NULL,            -- Manufacturing year
    license_plate TEXT,               -- Optional plate number
    vin TEXT,                         -- Optional VIN
    created_at TEXT NOT NULL,         -- ISO 8601 timestamp
    updated_at TEXT NOT NULL,         -- ISO 8601 timestamp
    FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);
```

**Foreign Keys**:
- `customer_id` → `customers(id)` with CASCADE DELETE
- Deleting a customer deletes all their vehicles

**Indexes**:
- `idx_vehicles_customer_id`: Speeds up vehicle lookups by customer
- `idx_vehicles_license_plate`: Speeds up plate searches

#### service_records

Stores service records for vehicles.

```sql
CREATE TABLE IF NOT EXISTS service_records (
    id TEXT PRIMARY KEY,              -- UUID string
    vehicle_id TEXT NOT NULL,         -- Foreign key to vehicles
    mechanic_id TEXT,                 -- Optional foreign key to app_users
    date TEXT NOT NULL,               -- Service date (YYYY-MM-DD)
    description TEXT,                 -- Optional description
    mileage INTEGER,                  -- Optional mileage
    notes TEXT,                       -- Optional internal notes
    services_json TEXT NOT NULL,      -- JSON array of service items
    subtotal REAL NOT NULL,           -- Subtotal before VAT
    vat REAL NOT NULL,                -- VAT amount
    total REAL NOT NULL,              -- Total with VAT
    created_at TEXT NOT NULL,         -- ISO 8601 timestamp
    updated_at TEXT NOT NULL,         -- ISO 8601 timestamp
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_service_records_vehicle_id ON service_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_records_date ON service_records(date);
```

**Service Items JSON Format**:
```json
[
  {
    "description": "Oil Change",
    "quantity": 1,
    "unit_price": 45.00
  },
  {
    "description": "Brake Pad Replacement",
    "quantity": 2,
    "unit_price": 85.00
  }
]
```

**Foreign Keys**:
- `vehicle_id` → `vehicles(id)` with CASCADE DELETE
- Deleting a vehicle deletes all its service records
- `mechanic_id` is optional (nullable)

**Indexes**:
- `idx_service_records_vehicle_id`: Speeds up service lookups by vehicle
- `idx_service_records_date`: Speeds up date range queries

### Database Initialization

Location: `src-tauri/src/db/mod.rs`

```rust
pub fn initialize_db() -> Result<(), rusqlite::Error> {
    let db_path = get_db_path();
    let conn = Connection::open(&db_path)?;

    // Enable WAL mode for better concurrency
    conn.pragma_update(None, "journal_mode", "WAL")?;

    // Set busy timeout to 5 seconds
    conn.busy_timeout(std::time::Duration::from_millis(5000))?;

    // Execute schema
    conn.execute_batch(include_str!("schema.sql"))?;

    Ok(())
}
```

**Configuration**:
- **WAL Mode**: Better read performance, allows concurrent readers
- **Busy Timeout**: 5 seconds to wait for lock acquisition
- **Schema Execution**: Runs on every startup (idempotent with IF NOT EXISTS)

### Database Location

```
Windows: C:\Users\<username>\AppData\Local\GaragePro\app.db
macOS:   ~/Library/Application Support/GaragePro/app.db
Linux:   ~/.local/share/GaragePro/app.db
```

---

## UUID String IDs

### Design Decision

All IDs in the system are **TEXT fields containing UUID strings**, not INTEGER.

### Rationale

1. **Global Uniqueness**: UUIDs are globally unique, no coordination needed
2. **No Autoincrement Issues**: No gaps, no race conditions
3. **Distributed-Ready**: Future-proof for sync/replication
4. **Merge-Safe**: Backups can be merged without ID conflicts
5. **Security**: Non-sequential IDs are harder to guess
6. **Consistency**: Same ID format throughout entire system

### Implementation

#### Rust Side

```rust
use uuid::Uuid;

// Generate new UUID string
let id = Uuid::new_v4().to_string();
// Returns: "550e8400-e29b-41d4-a716-446655440000"

// Function signatures use String
pub fn create_customer(
    id: String,  // UUID string
    name: String,
    // ...
) -> Result<Customer, rusqlite::Error>
```

#### TypeScript Side

```typescript
// All ID fields are typed as string
interface Customer {
  id: string;  // UUID string
  name: string;
  customer_id?: string;  // Foreign key, also string
  // ...
}

// Repository methods use string IDs
async getCustomer(id: string): Promise<Customer> {
  return await invoke<Customer>('get_customer', { id });
}
```

#### Database

```sql
-- Primary keys are TEXT
CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    -- ...
);

-- Foreign keys are TEXT
CREATE TABLE vehicles (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    FOREIGN KEY(customer_id) REFERENCES customers(id)
);
```

### Important Notes

- **No Parsing**: IDs are strings throughout, never parsed to numbers
- **No Type Conversion**: No `parseInt()` or `as i64` conversions
- **Direct Comparison**: String comparison works fine for UUIDs
- **Index Performance**: TEXT indexes work efficiently with UUIDs
- **Foreign Keys**: TEXT foreign keys work exactly like INTEGER ones

### UUID Format

Format: 8-4-4-4-12 hexadecimal digits
Example: `550e8400-e29b-41d4-a716-446655440000`

- **Version 4**: Random UUIDs
- **Length**: 36 characters (32 hex + 4 hyphens)
- **Case**: Lowercase by convention
- **Probability of Collision**: ~0 for practical purposes

---

## Repository Pattern

### Architecture

The repository pattern abstracts database operations from business logic.

```
Component → Repository → Tauri IPC → Rust Command → Rust Repository → Database
```

### Benefits

1. **Separation of Concerns**: UI doesn't know about database
2. **Testability**: Easy to mock repositories
3. **Type Safety**: Strong typing at all layers
4. **Maintainability**: Changes isolated to one layer
5. **Reusability**: Repository methods can be shared

### Frontend Repositories

Location: `src/lib/repositories/`

#### Example: customersRepository.ts

```typescript
import { invoke } from '@tauri-apps/api/tauri';
import { Customer, TauriCustomer } from '../../types';

export const customersRepository = {
  async listCustomers(
    search: string = '',
    page: number = 1,
    perPage: number = 50
  ): Promise<{ data: TauriCustomer[]; total: number }> {
    return await invoke('list_customers', {
      search,
      page,
      perPage,
    });
  },

  async getCustomer(id: string): Promise<TauriCustomer> {
    return await invoke('get_customer', { id });
  },

  async createCustomer(data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<TauriCustomer> {
    return await invoke('create_customer', { customerData: data });
  },

  async updateCustomer(id: string, data: Partial<Customer>): Promise<TauriCustomer> {
    return await invoke('update_customer', { id, customerData: data });
  },

  async deleteCustomer(id: string): Promise<void> {
    return await invoke('delete_customer', { id });
  },
};
```

**Key Points**:
- All methods are async
- Uses `invoke()` for IPC
- Returns typed data
- No direct database access
- Error handling via try/catch at call site

### Backend Commands

Location: `src-tauri/src/commands/`

#### Example: customers.rs

```rust
use crate::models::{Customer, PaginatedResult};
use crate::repositories::customers;

#[tauri::command]
pub fn list_customers(
    search: Option<String>,
    page: u32,
    per_page: u32,
) -> Result<PaginatedResult<Customer>, String> {
    customers::list_customers(search, page, per_page)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_customer(
    customer_data: serde_json::Value,
) -> Result<Customer, String> {
    // Extract fields from JSON
    let name = customer_data["name"].as_str()
        .ok_or("Name is required")?;
    // ... extract other fields ...

    customers::create_customer(name, email, phone, address, afm)
        .map_err(|e| e.to_string())
}
```

**Key Points**:
- `#[tauri::command]` macro exposes to IPC
- Simple error conversion (`.map_err(|e| e.to_string())`)
- Calls repository methods
- No direct database access

### Backend Repositories

Location: `src-tauri/src/repositories/`

#### Example: customers.rs

```rust
use rusqlite::{params, Connection};
use uuid::Uuid;
use chrono::Local;
use crate::db::get_connection;
use crate::models::Customer;

pub fn create_customer(
    name: String,
    email: Option<String>,
    phone: Option<String>,
    address: Option<String>,
    afm: Option<String>,
) -> Result<Customer, rusqlite::Error> {
    let conn = get_connection()?;
    let id = Uuid::new_v4().to_string();
    let now = Local::now().to_rfc3339();

    conn.execute(
        "INSERT INTO customers (id, name, email, phone, address, afm, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![id, name, email, phone, address, afm, now, now],
    )?;

    get_customer(id)?.ok_or_else(|| {
        rusqlite::Error::QueryReturnedNoRows
    })
}

pub fn get_customer(id: String) -> Result<Option<Customer>, rusqlite::Error> {
    let conn = get_connection()?;

    let mut stmt = conn.prepare(
        "SELECT id, name, email, phone, address, afm, created_at, updated_at
         FROM customers WHERE id = ?1"
    )?;

    let customer = stmt.query_row(params![id], |row| {
        Ok(Customer {
            id: row.get(0)?,
            name: row.get(1)?,
            email: row.get(2)?,
            phone: row.get(3)?,
            address: row.get(4)?,
            afm: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        })
    }).optional()?;

    Ok(customer)
}
```

**Key Points**:
- Direct database access
- UUID generation for new records
- Timestamp generation with chrono
- Proper error propagation
- `.optional()` for nullable results

---

## Authentication System

### Architecture

```
User Input (PIN) → Frontend Repository → Tauri Command → Auth Repository → Database
                                                              ↓
                                                         Session State
```

### PIN Storage

- **Hashing**: Bcrypt with cost factor 10
- **Storage**: `app_users.pin_hash` column
- **Verification**: `bcrypt::verify(pin, hash)`

### First Run

Location: `src/components/auth/FirstRunWizard.tsx`

```typescript
const handleSetup = async () => {
  const result = await authRepository.setupAdminPin(fullName, pin);
  if (result.error) {
    setError(result.error);
  } else {
    // Auto-login after setup
    onComplete();
  }
};
```

Backend: `src-tauri/src/repositories/auth.rs`

```rust
pub fn setup_admin_pin(full_name: String, pin: String) -> Result<User, String> {
    // Check if any users exist
    if count_users()? > 0 {
        return Err("Setup already completed".to_string());
    }

    let id = Uuid::new_v4().to_string();
    let pin_hash = hash_pin(&pin)?;
    let now = Local::now().to_rfc3339();

    conn.execute(
        "INSERT INTO app_users (id, full_name, role, pin_hash, created_at)
         VALUES (?1, ?2, 'admin', ?3, ?4)",
        params![id, full_name, pin_hash, now],
    )?;

    // Create session and return user
    // ...
}
```

### PIN Login

Location: `src/components/auth/PINLogin.tsx`

```typescript
const handleLogin = async () => {
  const result = await authRepository.loginWithPin(pin);
  if (result.error) {
    setError(result.error);
  }
  // User is set in AuthContext
};
```

Backend: `src-tauri/src/repositories/auth.rs`

```rust
pub fn login_with_pin(pin: String, state: tauri::State<AppState>) -> Result<User, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    // Find any user (in single-user mode, just get the first one)
    let mut stmt = conn.prepare(
        "SELECT id, full_name, role, pin_hash FROM app_users LIMIT 1"
    ).map_err(|e| e.to_string())?;

    let user = stmt.query_row([], |row| {
        Ok((
            row.get::<_, String>(0)?,  // id
            row.get::<_, String>(1)?,  // full_name
            row.get::<_, String>(2)?,  // role
            row.get::<_, String>(3)?,  // pin_hash
        ))
    }).map_err(|_| "No users found".to_string())?;

    // Verify PIN
    let pin_valid = bcrypt::verify(&pin, &user.3)
        .map_err(|e| format!("PIN verification failed: {}", e))?;

    if !pin_valid {
        return Err("Invalid PIN".to_string());
    }

    // Create session
    let session_user = User {
        id: user.0,
        full_name: user.1,
        role: user.2,
        email: None,
    };

    state.set_current_user(Some(session_user.clone()));

    Ok(session_user)
}
```

### Session Management

State: `src-tauri/src/state.rs`

```rust
use std::sync::Mutex;
use crate::models::User;

pub struct AppState {
    current_user: Mutex<Option<User>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            current_user: Mutex::new(None),
        }
    }

    pub fn set_current_user(&self, user: Option<User>) {
        let mut current = self.current_user.lock().unwrap();
        *current = user;
    }

    pub fn get_current_user(&self) -> Option<User> {
        let current = self.current_user.lock().unwrap();
        current.clone()
    }
}
```

**Key Points**:
- Session stored in Tauri AppState (in-memory)
- No localStorage usage (more secure)
- Session cleared on logout
- Session lost on application restart (requires re-login)

### Auto-Lock

Location: `src/hooks/useAutoLock.ts`

```typescript
const TIMEOUT_DURATION = 15 * 60 * 1000;  // 15 minutes
const WARNING_DURATION = 14 * 60 * 1000;  // 14 minutes

export const useAutoLock = () => {
  const { user, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);

  const resetTimer = useCallback(() => {
    // Clear existing timers
    // Set warning timer (14 minutes)
    // Set logout timer (15 minutes)
  }, []);

  useEffect(() => {
    // Listen to user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, throttledResetTimer);
    });

    return () => {
      // Cleanup timers and listeners
    };
  }, [user]);

  return { showWarning, dismissWarning };
};
```

**Key Points**:
- Client-side timers (no backend involvement)
- Throttled event listener (1 second throttle)
- Warning at 14 minutes
- Auto-logout at 15 minutes
- Proper cleanup on logout

---

## Backup System

### Design: Startup-Based Backups

GaragePro uses a **startup-based backup strategy** instead of background timers.

### Why This Approach?

1. **Simplicity**: No background processes or threads
2. **Reliability**: Backup runs during controlled application startup
3. **Safety**: Application is not in use during backup
4. **Performance**: No overhead during normal operation
5. **Predictability**: User knows backup happens on first start of day

### Implementation

Location: `src-tauri/src/main.rs`

```rust
fn main() {
    // Initialize database
    db::initialize_db().expect("Failed to initialize database");

    // Check and create backup (runs synchronously)
    if let Err(e) = backup::check_and_create_backup() {
        eprintln!("Warning: Failed to create automatic backup: {}", e);
    }

    // Start Tauri application
    tauri::Builder::default()
        // ... configuration ...
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Key Points**:
- Runs **before** Tauri starts
- Runs **synchronously** (blocks startup)
- Runs **only once** per application launch
- Non-fatal (app continues if backup fails)

### Backup Logic

Location: `src-tauri/src/backup/mod.rs`

```rust
pub fn check_and_create_backup() -> Result<(), String> {
    let today = Local::now().format("%Y-%m-%d").to_string();
    let last_backup = get_last_backup_date().unwrap_or_else(|_| String::new());

    // Only backup if date changed
    if last_backup != today {
        create_backup()?;
    }

    Ok(())
}
```

**Logic**:
1. Get today's date (YYYY-MM-DD)
2. Read last backup date from file
3. If dates don't match, create backup
4. Update last backup date file

### Last Backup Tracking

File: `Documents/GaragePro/last_backup.txt`
Content: `2026-01-14` (YYYY-MM-DD format)

```rust
pub fn get_last_backup_date() -> Result<String, String> {
    let last_backup_file = get_last_backup_file()?;

    if !last_backup_file.exists() {
        return Ok(String::new());
    }

    fs::read_to_string(&last_backup_file)
}

pub fn set_last_backup_date(date: &str) -> Result<(), String> {
    let last_backup_file = get_last_backup_file()?;
    fs::write(&last_backup_file, date)
}
```

### Backup Creation

```rust
pub fn create_backup() -> Result<String, String> {
    let backup_dir = get_backup_dir()?;
    let timestamp = Local::now().format("%Y%m%d_%H%M%S");
    let backup_filename = format!("app_backup_{}.db", timestamp);
    let backup_path = backup_dir.join(&backup_filename);

    let db_path = get_db_path();
    let source_conn = Connection::open(&db_path)?;
    let mut dest_conn = Connection::open(&backup_path)?;

    // Use SQLite backup API (safe, atomic)
    let backup_handle = backup::Backup::new(&source_conn, &mut dest_conn)?;
    backup_handle.run_to_completion(100, Duration::from_millis(10), None)?;

    // Update last backup date
    let today = Local::now().format("%Y-%m-%d").to_string();
    set_last_backup_date(&today)?;

    Ok(backup_path.to_string_lossy().to_string())
}
```

**Key Points**:
- Uses SQLite backup API (not file copy)
- Handles WAL mode correctly
- Atomic operation
- Returns backup path for user feedback

### Backup Restore

```rust
pub fn restore_backup(backup_path: String) -> Result<(), String> {
    // Step 1: Create safety backup
    let safety_backup_path = create_backup()?;

    // Step 2: Remove WAL/SHM files
    let db_path = get_db_path();
    let wal_path = db_path.with_extension("db-wal");
    let shm_path = db_path.with_extension("db-shm");
    if wal_path.exists() { fs::remove_file(&wal_path)?; }
    if shm_path.exists() { fs::remove_file(&shm_path)?; }

    // Step 3: Copy backup over current database
    fs::copy(&backup_file, &db_path).map_err(|e| {
        // Try to rollback to safety backup
        let _ = restore_backup(safety_backup_path);
        format!("Failed to restore backup: {}", e)
    })?;

    // Step 4: Re-initialize database
    crate::db::initialize_db()?;

    Ok(())
}
```

**Safety Features**:
- Safety backup before restore
- Rollback on failure
- WAL/SHM cleanup (prevents corruption)
- Re-initialization after restore

### Backup Location

```
Windows: C:\Users\<username>\Documents\GaragePro\Backups\
macOS:   ~/Documents/GaragePro/Backups/
Linux:   ~/Documents/GaragePro/Backups/
```

### Backup File Format

Format: `app_backup_YYYYMMDD_HHMMSS.db`
Example: `app_backup_20260114_143022.db`

---

## Development Setup

### Prerequisites

- **Node.js**: 18.x or later
- **Rust**: Latest stable (install via rustup)
- **npm**: 8.x or later
- **Git**: For version control

### Clone Repository

```bash
git clone <repository-url>
cd garagepro
```

### Install Dependencies

```bash
# Install npm dependencies
npm install

# Rust dependencies are managed by Cargo (automatic)
```

### Database Setup

Database is created automatically on first run. No manual setup needed.

### Environment Variables

No environment variables required. Application is self-contained.

### Development Commands

```bash
# Frontend development server (without Tauri)
npm run dev

# Full Tauri development (recommended)
npm run tauri:dev

# Frontend build only
npm run build

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

### Development with Hot Reload

```bash
npm run tauri:dev
```

This starts:
1. Vite dev server (frontend with hot reload)
2. Tauri application (with Rust compilation)
3. Automatic reload on file changes

### Project Structure During Development

```
.
├── src/                    # Frontend React code
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and repositories
│   ├── types/             # TypeScript type definitions
│   └── main.tsx           # React entry point
├── src-tauri/             # Backend Rust code
│   ├── src/
│   │   ├── commands/      # Tauri commands (IPC handlers)
│   │   ├── repositories/  # Database repositories
│   │   ├── backup/        # Backup system
│   │   ├── db/            # Database module
│   │   ├── models/        # Rust structs
│   │   ├── state.rs       # Application state
│   │   └── main.rs        # Rust entry point
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── package.json           # npm dependencies
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
└── tailwind.config.js     # Tailwind CSS configuration
```

---

## Building for Production

### Windows Build

```bash
npm run tauri:build
```

This creates:
- `.msi` installer: `src-tauri/target/release/bundle/msi/GaragePro_x.x.x_x64_en-US.msi`
- `.exe` executable: `src-tauri/target/release/GaragePro.exe`

### Build Configuration

Location: `src-tauri/tauri.conf.json`

```json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "GaragePro",
    "version": "0.1.0"
  },
  "tauri": {
    "bundle": {
      "active": true,
      "targets": ["msi"],
      "identifier": "com.garagepro.app",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    }
  }
}
```

### Build Steps

1. **Frontend Build**:
   - Vite bundles React app to `dist/`
   - Minification and optimization
   - Asset bundling

2. **Rust Compilation**:
   - Cargo compiles Rust backend
   - Release optimizations
   - Static linking

3. **Application Bundle**:
   - Tauri combines frontend and backend
   - Creates native installer
   - Signs application (if configured)

### Build Optimization

**Frontend**:
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
});
```

**Backend**:
```toml
# Cargo.toml
[profile.release]
strip = true      # Strip debug symbols
lto = true        # Link-time optimization
opt-level = "z"   # Optimize for size
codegen-units = 1 # Better optimization
```

### Distribution

1. **Sign the MSI** (optional but recommended):
   - Get code signing certificate
   - Use signtool.exe (Windows SDK)
   - Users won't see SmartScreen warnings

2. **Create Installer**:
   - Use the generated `.msi` file
   - No additional setup needed

3. **Update Distribution**:
   - Users can install new version over old
   - Data is preserved (stored separately)

---

## Project Structure

### Frontend Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   │   ├── FirstRunWizard.tsx
│   │   └── PINLogin.tsx
│   ├── customers/      # Customer components
│   │   ├── CustomerForm.tsx
│   │   └── CustomerList.tsx
│   ├── services/       # Service components
│   │   ├── ServiceForm.tsx
│   │   └── ServiceList.tsx
│   ├── vehicles/       # Vehicle components
│   │   ├── VehicleForm.tsx
│   │   └── VehicleCard.tsx
│   ├── settings/       # Settings components
│   │   └── BackupSettings.tsx
│   ├── ui/             # Generic UI components
│   │   └── Modal.tsx
│   └── Layout.tsx      # Main layout component
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx     # Authentication hook
│   ├── useAutoLock.ts  # Auto-lock hook
│   └── usePermissions.ts
├── lib/                # Utilities and libraries
│   ├── repositories/   # Data access layer
│   │   ├── authRepository.ts
│   │   ├── customersRepository.ts
│   │   ├── servicesRepository.ts
│   │   ├── vehiclesRepository.ts
│   │   └── dashboardRepository.ts
│   ├── pdf/           # PDF generation
│   │   └── exportWorkOrder.ts
│   └── utils/         # Utility functions
│       ├── formatters.ts
│       ├── calculations.ts
│       └── errorHandler.ts
├── pages/             # Page components
│   ├── DashboardPage.tsx
│   ├── CustomersPage.tsx
│   ├── ServicesPage.tsx
│   ├── SettingsPage.tsx
│   └── Auth.tsx
├── types/             # TypeScript definitions
│   ├── index.ts
│   ├── customer.ts
│   ├── vehicle.ts
│   ├── service.ts
│   ├── user.ts
│   └── tauri.ts
├── App.tsx            # Root component
├── main.tsx           # React entry point
└── index.css          # Global styles
```

### Backend Structure

```
src-tauri/src/
├── commands/          # Tauri IPC command handlers
│   ├── auth.rs       # Authentication commands
│   ├── customers.rs  # Customer commands
│   ├── vehicles.rs   # Vehicle commands
│   ├── services.rs   # Service commands
│   ├── dashboard.rs  # Dashboard commands
│   ├── backup.rs     # Backup commands
│   └── mod.rs        # Module exports
├── repositories/      # Database access layer
│   ├── auth.rs       # Auth repository
│   ├── customers.rs  # Customer repository
│   ├── vehicles.rs   # Vehicle repository
│   ├── services.rs   # Service repository
│   ├── dashboard.rs  # Dashboard repository
│   └── mod.rs        # Module exports
├── backup/           # Backup system
│   └── mod.rs        # Backup implementation
├── db/               # Database module
│   ├── mod.rs        # DB initialization
│   └── schema.sql    # Database schema
├── models/           # Data models
│   └── mod.rs        # Rust structs
├── state.rs          # Application state
└── main.rs           # Rust entry point
```

---

## Key Design Decisions

### 1. Offline-First Architecture

**Decision**: No network dependencies whatsoever.

**Rationale**:
- Reliability in areas with poor internet
- No subscription or cloud costs
- Complete data privacy
- Faster performance (no API calls)
- Simpler deployment

**Implementation**:
- Local SQLite database
- No REST APIs
- No cloud sync
- Tauri IPC for frontend-backend communication

### 2. UUID String IDs

**Decision**: Use TEXT PRIMARY KEY with UUID strings instead of INTEGER AUTOINCREMENT.

**Rationale**:
- See [UUID String IDs](#uuid-string-ids) section for full details
- Global uniqueness
- Future-proof for sync/replication
- Merge-safe backups
- No coordination needed

**Trade-offs**:
- Slightly larger storage (36 bytes vs 8 bytes)
- Slightly slower joins (negligible for our scale)
- Better security (non-sequential)

### 3. Repository Pattern

**Decision**: Abstract database access behind repository layer.

**Rationale**:
- Separation of concerns
- Easier testing (mock repositories)
- Type safety at all layers
- Centralized error handling
- Easier to refactor

**Alternative Considered**: Direct database access from commands
**Why Rejected**: Harder to test, logic scattered, harder to maintain

### 4. Startup-Based Backups

**Decision**: Create backups on application startup, not on a timer.

**Rationale**:
- No background processes
- No timer coordination
- Simpler implementation
- Predictable behavior
- Safe (app not in use during backup)

**Alternative Considered**: Scheduled background backups
**Why Rejected**: Complex, resource-intensive, potential corruption risks

### 5. PIN-Based Authentication

**Decision**: Use PIN instead of username/password.

**Rationale**:
- Local-only app (no account needed)
- Faster to enter
- Simpler UX
- Still secure with bcrypt
- Common pattern for local apps

**Security**: Bcrypt cost factor 10, same security as passwords

### 6. WAL Mode for SQLite

**Decision**: Use Write-Ahead Logging mode.

**Rationale**:
- Better concurrency (readers don't block writers)
- Faster reads
- Crash safety
- Industry standard for desktop apps

**Configuration**:
```rust
conn.pragma_update(None, "journal_mode", "WAL")?;
```

### 7. Single Tauri Window

**Decision**: Use single window, not multi-window.

**Rationale**:
- Simpler state management
- Better UX (no window juggling)
- Easier navigation
- Lower memory usage

**Alternative Considered**: Multiple windows for different sections
**Why Rejected**: Unnecessary complexity for this use case

### 8. Embedded Charts (Recharts)

**Decision**: Use Recharts for dashboard visualizations.

**Rationale**:
- React-native library
- No canvas complexity
- Good TypeScript support
- Responsive out of the box

**Alternative Considered**: D3.js, Chart.js
**Why Rejected**: More complex, harder to integrate with React

---

## Testing Strategy

### Current Testing Status

**MVP Status**: Manual testing completed (see PHASE13_COMPLETE.md)

**Future Testing Plans**:

### Unit Tests

**Frontend** (Jest + React Testing Library):
```typescript
// Example: useAuth.test.tsx
describe('useAuth', () => {
  it('should login with valid PIN', async () => {
    // Test implementation
  });

  it('should handle invalid PIN', async () => {
    // Test implementation
  });
});
```

**Backend** (Rust built-in tests):
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_customer() {
        // Test implementation
    }

    #[test]
    fn test_backup_creation() {
        let result = create_backup();
        assert!(result.is_ok());
    }
}
```

### Integration Tests

**Repository Tests**:
- Test full flow: component → repository → IPC → database
- Use temporary test database
- Test error cases

**Authentication Tests**:
- First run wizard flow
- PIN login/logout
- Session persistence
- Auto-lock behavior

### End-to-End Tests

**Tauri WebDriver**:
- Test full application flow
- Simulate user interactions
- Verify UI updates

### Manual Testing Checklist

See `PHASE13_COMPLETE.md` for comprehensive manual testing results.

---

## Performance Considerations

### Database Performance

**Indexes**:
- All foreign keys indexed
- Frequently searched columns indexed
- Name columns indexed

**Query Optimization**:
```sql
-- Good: Uses index
SELECT * FROM customers WHERE name LIKE 'John%';

-- Good: Uses index
SELECT * FROM vehicles WHERE customer_id = ?;

-- Good: Uses date index
SELECT * FROM service_records
WHERE date BETWEEN ? AND ?
ORDER BY date DESC;
```

**Pagination**:
- All list queries use LIMIT/OFFSET
- Default page size: 50 records
- Prevents loading thousands of records

### Frontend Performance

**Code Splitting**:
```javascript
// Lazy load pages
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
```

**Memoization**:
```typescript
// Prevent unnecessary re-renders
const MemoizedCustomerList = React.memo(CustomerList);
```

**Debouncing**:
```typescript
// Debounce search input
const debouncedSearch = useMemo(
  () => debounce((term) => setSearchTerm(term), 300),
  []
);
```

### Memory Management

**Frontend**:
- Cleanup event listeners in useEffect
- Clear timers on component unmount
- Avoid memory leaks in state management

**Backend**:
- Connection pool (single connection)
- Proper error handling (no panics)
- Cleanup resources in Drop implementations

### Build Size Optimization

**Frontend Bundle**:
- Tree shaking enabled
- Minification with esbuild
- Code splitting for routes
- Current size: ~1.1 MB (minified)

**Backend Binary**:
- Strip debug symbols
- Link-time optimization (LTO)
- Optimize for size (`opt-level = "z"`)
- Current size: ~15 MB (Windows)

---

## Security Considerations

### Authentication Security

**PIN Hashing**:
- Algorithm: bcrypt
- Cost factor: 10
- Salt: Automatic (generated by bcrypt)

**Session Storage**:
- Stored in Tauri AppState (memory)
- Not in localStorage (more secure)
- Cleared on logout
- Lost on app restart

**Auto-Lock**:
- 15 minutes inactivity timeout
- Warning at 14 minutes
- Proper cleanup of timers

### Database Security

**Local Storage**:
- Database in AppData (user-specific)
- No network exposure
- File system permissions (OS-level)

**SQL Injection Prevention**:
```rust
// Good: Parameterized query
conn.execute(
    "SELECT * FROM customers WHERE id = ?1",
    params![id],
)?;

// Bad: String concatenation (never do this)
// let query = format!("SELECT * FROM customers WHERE id = '{}'", id);
```

**Foreign Key Constraints**:
- Prevent orphaned records
- Maintain referential integrity
- CASCADE DELETE where appropriate

### Application Security

**Input Validation**:
- Frontend: TypeScript types
- Backend: Rust type system
- Database: NOT NULL constraints

**Error Handling**:
- No sensitive data in error messages
- Log errors server-side only
- User-friendly error messages

**Code Signing** (Recommended for production):
```bash
# Sign the MSI installer
signtool sign /f certificate.pfx /p password GaragePro.msi
```

### Update Security

**Manual Updates**:
- User controls when to update
- Data preserved automatically
- No silent updates

**Future: Auto-Update** (Tauri supports):
- Signature verification
- Rollback capability
- User confirmation

---

## Troubleshooting

### Common Development Issues

**Issue**: Rust compilation fails
```bash
# Solution: Update Rust
rustup update stable
```

**Issue**: Database locked error
```rust
// Solution: Increase busy timeout
conn.busy_timeout(Duration::from_millis(5000))?;
```

**Issue**: Hot reload not working
```bash
# Solution: Restart dev server
npm run tauri:dev
```

**Issue**: TypeScript errors
```bash
# Solution: Regenerate types
npx tsc --noEmit
```

### Build Issues

**Issue**: MSI creation fails
```bash
# Solution: Install WiX Toolset
# Download from: https://wixtoolset.org/
```

**Issue**: Large bundle size
```javascript
// Solution: Enable code splitting
// See vite.config.ts
```

### Runtime Issues

**Issue**: Database corruption
```rust
// Solution: Restore from backup
// Or delete database and restart (fresh database)
```

**Issue**: Auto-lock not working
```typescript
// Solution: Check if user activity events are registered
// See useAutoLock.ts
```

---

## Contributing

### Code Style

**TypeScript**:
- ESLint configuration provided
- Prettier for formatting (optional)
- 2-space indentation
- Semicolons required

**Rust**:
- `cargo fmt` for formatting
- `cargo clippy` for linting
- Follow Rust naming conventions
- Document public APIs

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git commit -m "feat: add new feature"

# Push and create pull request
git push origin feature/new-feature
```

### Commit Messages

Format: `type: description`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

### Pull Request Process

1. Create feature branch
2. Make changes
3. Test locally
4. Update documentation
5. Create pull request
6. Code review
7. Merge to main

---

## License

Proprietary software. See LICENSE file for details.

---

## Support

For technical support or questions:
- Documentation: `docs/user-guide.md`
- Issues: Create GitHub issue
- Email: support@garagepro.com (if applicable)

---

## Roadmap

### Completed (v0.1.0 - MVP)
- ✅ Customer management
- ✅ Vehicle management
- ✅ Service records
- ✅ Dashboard with statistics
- ✅ PIN authentication
- ✅ Auto-lock feature
- ✅ Automatic daily backups
- ✅ Backup/restore functionality
- ✅ Work order PDF export
- ✅ Offline operation

### Planned (v0.2.0)
- [ ] User management (multiple users)
- [ ] Role-based permissions (admin/secretary/mechanic)
- [ ] Advanced reporting
- [ ] Custom company information
- [ ] Print work orders
- [ ] Email integration

### Future (v1.0.0)
- [ ] Multi-location support
- [ ] Inventory management
- [ ] Parts catalog
- [ ] Supplier management
- [ ] Employee time tracking
- [ ] Appointment scheduling
- [ ] Customer portal

---

## Acknowledgments

Built with:
- [Tauri](https://tauri.app/) - Desktop application framework
- [React](https://react.dev/) - UI framework
- [SQLite](https://sqlite.org/) - Embedded database
- [Rust](https://www.rust-lang.org/) - Systems programming language

---

**Document Version**: 1.0
**Last Updated**: January 14, 2026
**Applies to**: GaragePro v0.1.0 and later
