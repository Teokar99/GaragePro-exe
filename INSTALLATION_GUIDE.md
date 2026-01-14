# GaragePro Installation Guide

## Building the MSI Installer

### Prerequisites
1. Windows 10 or later
2. Rust toolchain installed (https://rustup.rs/)
3. Node.js 18+ and npm
4. WiX Toolset v3 (automatically installed by Tauri)

### Build Commands

#### Development Build
```bash
npm install
npm run tauri:dev
```

#### Production MSI Installer
```bash
npm install
npm run tauri:build
```

The MSI installer will be created in:
```
src-tauri/target/release/bundle/msi/GaragePro_0.1.0_x64_en-US.msi
```

## Installation Process

### Fresh Installation
1. Double-click the MSI installer file
2. Follow the installation wizard
3. Application installs to: `C:\Program Files\GaragePro\`
4. Launch GaragePro from Start Menu or Desktop shortcut
5. First Run Wizard will appear to set up admin PIN

### Data Storage Locations

#### Application Database
- **Location**: `C:\Users\<username>\AppData\Local\GaragePro\app.db`
- **Contains**: All customers, vehicles, services, and user data
- **Preserved**: YES - kept during updates and uninstalls

#### Backups
- **Location**: `C:\Users\<username>\Documents\GaragePro\Backups\`
- **Format**: `app_backup_YYYYMMDD_HHMMSS.db`
- **Preserved**: YES - kept during updates and uninstalls

#### Last Backup Tracker
- **Location**: `C:\Users\<username>\Documents\GaragePro\last_backup.txt`
- **Contains**: Date of last automatic backup
- **Preserved**: YES

## Updating GaragePro

### Update Process
1. Close GaragePro if running
2. Run the new MSI installer
3. Installer detects existing installation
4. Application files are updated in Program Files
5. **User data is automatically preserved** in AppData
6. Launch updated version

### Important Notes
- Database and backups are NEVER deleted during updates
- All user data is preserved in AppData/Local and Documents
- No manual backup needed before updating
- Automatic backup runs on first launch after update

## Uninstalling GaragePro

### Uninstall Process
1. Open Windows Settings > Apps
2. Find "GaragePro" in the list
3. Click Uninstall
4. Follow the wizard

### What Gets Removed
- Application files in Program Files
- Start Menu shortcuts
- Desktop shortcuts

### What Gets Preserved
- Database in AppData/Local/GaragePro/
- Backups in Documents/GaragePro/Backups/
- All user data and settings

### Complete Removal
If you want to completely remove all data:
1. Uninstall GaragePro normally
2. Manually delete: `C:\Users\<username>\AppData\Local\GaragePro\`
3. Manually delete: `C:\Users\<username>\Documents\GaragePro\`

## Troubleshooting

### Installation Issues

#### "Windows protected your PC" warning
- Click "More info"
- Click "Run anyway"
- This appears because the installer is not digitally signed

#### WebView2 Installation
- The installer includes WebView2 bootstrapper
- Internet connection required for first-time WebView2 installation
- WebView2 is required for the application to run

### Runtime Issues

#### Database locked or in use
- Close all GaragePro instances
- End any GaragePro processes in Task Manager
- Restart the application

#### Missing data after update
- Check: `C:\Users\<username>\AppData\Local\GaragePro\app.db` exists
- Restore from backup in Documents/GaragePro/Backups/
- Use Settings > Backup > Restore to restore a backup

#### Permission errors
- Run GaragePro as Administrator (right-click > Run as administrator)
- Check folder permissions for AppData/Local/GaragePro

## Security Notes

### Database Security
- Database stored in user's AppData (not shared)
- Each Windows user has separate database
- PIN-protected access within application
- No network access (local-only application)

### Backup Security
- Backups stored in user's Documents folder
- Automatic daily backups on startup
- Manual backups available in Settings
- Consider backing up Documents folder regularly

## Multi-User Scenarios

### Shared Computer
- Each Windows user has separate GaragePro database
- No data sharing between Windows users
- Each user must complete First Run Wizard

### Single User, Multiple Computers
- Database is NOT synced between computers
- Must manually copy database file between computers
- Or use backup/restore feature to transfer data

## Network Installation (NOT Recommended)

GaragePro is designed as a single-user, local application. Network installations are not supported or recommended.

If you need multi-user access:
- Consider installing on each user's computer separately
- Use backup/restore to share data periodically
- Or manually copy database file (when application is closed)

## System Requirements

### Minimum Requirements
- Windows 10 or later (64-bit)
- 2 GB RAM
- 100 MB disk space
- 1280x600 screen resolution

### Recommended
- Windows 11
- 4 GB RAM
- SSD storage
- 1920x1080 screen resolution
