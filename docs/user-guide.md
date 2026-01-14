# GaragePro User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [First-Time Setup](#first-time-setup)
4. [Logging In](#logging-in)
5. [Dashboard](#dashboard)
6. [Managing Customers](#managing-customers)
7. [Managing Vehicles](#managing-vehicles)
8. [Managing Service Records](#managing-service-records)
9. [Backup and Restore](#backup-and-restore)
10. [Security and Auto-Lock](#security-and-auto-lock)
11. [Settings](#settings)
12. [Troubleshooting](#troubleshooting)
13. [Data Storage](#data-storage)
14. [PIN Recovery](#pin-recovery)

---

## Introduction

GaragePro is a complete garage management system designed for auto repair shops. It helps you manage customers, vehicles, service records, and generate professional work orders. The application runs entirely offline on your Windows computer with automatic daily backups.

### Key Features

- Complete offline operation (no internet required)
- Customer and vehicle management
- Service record tracking with detailed work orders
- Automatic daily backups
- Secure PIN-based authentication
- Auto-lock after 15 minutes of inactivity
- Professional PDF work order generation
- Revenue tracking and analytics

---

## Installation

### System Requirements

- Windows 10 or Windows 11
- 200 MB free disk space
- No internet connection required after installation

### Installation Steps

1. **Download the Installer**
   - Download the `GaragePro_setup.msi` file

2. **Run the Installer**
   - Double-click the `.msi` file
   - If Windows SmartScreen appears, click "More info" then "Run anyway"
   - Follow the installation wizard
   - Click "Next" through the prompts
   - Click "Install" to begin installation
   - Click "Finish" when complete

3. **Launch GaragePro**
   - Find GaragePro in your Start Menu
   - Or double-click the desktop shortcut if created

### Installation Location

The application is installed in:
```
C:\Program Files\GaragePro\
```

Your data is stored separately in:
```
C:\Users\<YourUsername>\AppData\Local\GaragePro\
```

This means your data survives application updates and reinstallation.

---

## First-Time Setup

When you launch GaragePro for the first time, you'll see the **First Run Wizard**.

### Creating Your Admin Account

1. **Enter Your Full Name**
   - This will appear in the application header
   - Example: "John Smith" or "Garage Manager"

2. **Create Your PIN**
   - Enter a 4-6 digit PIN code
   - This PIN will be required to access the application
   - Choose something memorable but not obvious
   - Example: 5728, 123456

3. **Confirm Your PIN**
   - Re-enter the same PIN to confirm
   - Must match exactly

4. **Click "Complete Setup"**
   - Your admin account will be created
   - You'll be automatically logged in
   - The application is now ready to use

### Important Notes

- The PIN is securely encrypted and cannot be recovered
- If you forget your PIN, see [PIN Recovery](#pin-recovery)
- Only one admin account can be created during first run
- Additional users can be added later from Settings

---

## Logging In

After the first setup, you'll see the PIN login screen each time you start the application.

### Login Process

1. **Enter Your PIN**
   - Type your 4-6 digit PIN
   - Numbers only

2. **Click "Login"**
   - If correct, you'll be taken to the Dashboard
   - If incorrect, you'll see an error message

### Failed Login Attempts

- There is no lockout after failed attempts
- Take your time and try again
- If you've forgotten your PIN, see [PIN Recovery](#pin-recovery)

---

## Dashboard

The Dashboard is your home screen, showing an overview of your garage operations.

### Dashboard Statistics

**Total Customers**
- Shows the total number of customers in your database

**Total Vehicles**
- Shows the total number of vehicles registered

**Total Revenue**
- Shows the sum of all completed service records
- Includes VAT

**Monthly Services**
- Shows the number of services completed this month
- Resets on the 1st of each month

### Recent Services

The bottom section shows the 5 most recent service records:
- Customer name
- Vehicle make and model
- Service date
- Total amount

Click on any service to view full details.

---

## Managing Customers

### Viewing Customers

1. Click **"Customers"** in the left sidebar
2. You'll see a list of all customers with:
   - Name
   - Phone number
   - Email
   - Number of vehicles
   - Actions (Edit, Delete)

### Adding a New Customer

1. Click the **"Add Customer"** button (top right)
2. Fill in the form:
   - **Name** (required): Customer's full name
   - **Phone** (optional): Contact phone number
   - **Email** (optional): Email address
   - **Address** (optional): Physical address
   - **AFM** (optional): Tax identification number
3. Click **"Save"**

### Editing a Customer

1. Find the customer in the list
2. Click the **"Edit"** button (pencil icon)
3. Update any information
4. Click **"Save"**

### Deleting a Customer

1. Find the customer in the list
2. Click the **"Delete"** button (trash icon)
3. Confirm the deletion

**Warning**: Deleting a customer will also delete:
- All their vehicles
- All service records for those vehicles

This action cannot be undone (unless you restore from a backup).

### Searching Customers

Use the search box at the top to filter customers by:
- Name
- Phone number
- Email

Results update as you type.

### Filtering Customers

Use the filter dropdown to show:
- **All**: All customers
- **Recent**: Customers added in the last 30 days
- **Multi-Vehicle**: Customers with more than one vehicle

### Pagination

- By default, 50 customers are shown per page
- Use the page numbers at the bottom to navigate
- Change the records per page in the dropdown

---

## Managing Vehicles

Vehicles are always associated with a customer.

### Adding a Vehicle

**Option 1: From Customers Page**
1. Go to Customers page
2. Find the customer
3. Click **"Add Vehicle"** next to their name
4. Fill in the vehicle details:
   - **Make** (required): Brand (e.g., Toyota, Ford)
   - **Model** (required): Model name (e.g., Corolla, F-150)
   - **Year** (required): Manufacturing year (e.g., 2020)
   - **License Plate** (optional): Plate number
   - **VIN** (optional): Vehicle Identification Number
5. Click **"Save"**

**Option 2: From Top Menu**
1. Click **"Add Vehicle"** in the top menu
2. Select the customer from the dropdown
3. Fill in vehicle details
4. Click **"Save"**

### Viewing a Customer's Vehicles

1. Go to the Customers page
2. Find the customer
3. Their vehicle count is shown in the list
4. Click **"View"** to see full customer details including all vehicles

### Editing a Vehicle

1. View the customer's details
2. Find the vehicle
3. Click **"Edit"**
4. Update the information
5. Click **"Save"**

### Deleting a Vehicle

1. View the customer's details
2. Find the vehicle
3. Click **"Delete"**
4. Confirm the deletion

**Warning**: Deleting a vehicle will also delete all service records for that vehicle. This action cannot be undone.

---

## Managing Service Records

Service records track all work performed on vehicles.

### Viewing Service Records

1. Click **"Services"** in the left sidebar
2. You'll see a list of all services with:
   - Customer name
   - Vehicle information
   - Service date
   - Total amount
   - Actions

### Creating a New Service Record

1. Click **"New Service"** button
2. Fill in the service details:

**Basic Information**
- **Customer**: Select from dropdown
- **Vehicle**: Select one of the customer's vehicles
- **Service Date**: Date the work was performed
- **Mileage** (optional): Current vehicle mileage

**Service Items**
- Click **"Add Service Item"** to add each item
- For each item, enter:
  - **Description**: What was done (e.g., "Oil Change", "Brake Pad Replacement")
  - **Quantity**: How many (default: 1)
  - **Unit Price**: Price per unit in EUR
- Click the trash icon to remove an item

**Calculations**
- **Subtotal**: Automatically calculated (sum of all items)
- **VAT (24%)**: Automatically calculated
- **Total**: Subtotal + VAT

**Additional Information**
- **Notes** (optional): Internal notes about the service

3. Click **"Create Service"** to save

### Editing a Service Record

1. Find the service in the list
2. Click **"Edit"**
3. Update any information
4. Click **"Save"**

Note: You cannot change the customer or vehicle after creation.

### Deleting a Service Record

1. Find the service in the list
2. Click **"Delete"**
3. Confirm the deletion

### Searching Services

Use the search box to find services by:
- Customer name
- Vehicle make/model
- License plate

### Filtering Services

Use the filter options to show:
- Services for a specific vehicle
- Services for a specific customer
- Services within a date range

### Exporting Work Orders

1. View a service record
2. Click **"Export PDF"**
3. A professional work order will be generated
4. Choose where to save the PDF
5. Print or email to customer

The work order includes:
- Your garage information
- Customer and vehicle details
- Complete list of services performed
- Itemized pricing
- Total with VAT

---

## Backup and Restore

GaragePro automatically protects your data with daily backups.

### Automatic Daily Backups

- **When**: Every time you start the application
- **Frequency**: Once per day (first startup of each day)
- **Location**: `C:\Users\<YourUsername>\Documents\GaragePro\Backups\`
- **File Format**: `app_backup_YYYYMMDD_HHMMSS.db`
- **Example**: `app_backup_20260114_143022.db`

**Important Notes**:
- Backups are created automatically, no action needed
- Only one automatic backup is created per day
- Backups do not happen in the background
- Closing and reopening the app on the same day won't create another backup

### Manual Backups

You can create a backup at any time:

1. Click **"Settings"** in the left sidebar
2. Scroll to the **Backup Settings** section
3. Click **"Create Manual Backup"**
4. Wait for the success message
5. The backup is saved in the Backups folder

**When to create manual backups**:
- Before making major changes
- Before deleting many records
- After entering important data
- Before updates or maintenance

### Viewing Available Backups

1. Go to Settings → Backup Settings
2. Scroll to **"Available Backups"**
3. You'll see a list of all backups with:
   - Filename
   - Date and time created
   - File size

### Restoring from a Backup

**Warning**: Restoring will replace all current data with the data from the backup.

1. Go to Settings → Backup Settings
2. Find the backup you want to restore
3. Click **"Restore"**
4. Read the warning carefully
5. Click **"Restore Backup"** to confirm

**What happens during restore**:
1. A safety backup of your current database is created automatically
2. The selected backup replaces your current database
3. The application is ready to use with the restored data

**If something goes wrong**:
- The safety backup can be used to recover
- Look for the most recent backup (created just before the restore)

### Backup Storage

Backups are stored in:
```
C:\Users\<YourUsername>\Documents\GaragePro\Backups\
```

You can:
- Copy backups to external drives for extra safety
- Delete old backups to free up space
- Keep important backups indefinitely

**Recommended backup strategy**:
- Keep at least 7 days of automatic backups
- Keep monthly backups for the past year
- Store critical backups on external media

---

## Security and Auto-Lock

### PIN Security

Your PIN is:
- Encrypted using bcrypt (industry-standard security)
- Never stored in plain text
- Cannot be recovered or reset without data loss

### Auto-Lock Feature

For security, GaragePro automatically locks after inactivity.

**How it works**:
- After **14 minutes** of inactivity, a warning appears
- After **15 minutes** of inactivity, you're automatically logged out
- You'll need to enter your PIN again to continue

**What counts as activity**:
- Mouse movement
- Keyboard input
- Clicking
- Scrolling
- Touch input (on touch screens)

**Warning Dialog**:
- Appears at 14 minutes
- Shows countdown timer
- Click **"Continue Working"** to stay logged in
- Resets the 15-minute timer

**After auto-lock**:
- You'll see the PIN login screen
- Enter your PIN to continue
- All your work is saved automatically

### Manual Logout

You can log out at any time:
1. Click your name in the top-right corner
2. Click **"Logout"**
3. You'll return to the PIN login screen

---

## Settings

Access settings by clicking **"Settings"** in the left sidebar.

### Current Settings Available

**Backup Settings**
- View last automatic backup date
- Create manual backups
- View all available backups
- Restore from backups

### Future Settings (Coming Soon)

- Change PIN
- Application theme (dark/light mode)
- Company information for work orders
- VAT rate configuration
- Currency settings
- Report preferences

---

## Troubleshooting

### Application Won't Start

**Solution 1: Restart your computer**
- Close all applications
- Restart Windows
- Try launching GaragePro again

**Solution 2: Reinstall the application**
- Uninstall GaragePro from Windows Settings → Apps
- Download the installer again
- Reinstall

Note: Your data is safe even if you uninstall the application.

### Forgot My PIN

See [PIN Recovery](#pin-recovery) below.

### Data Not Showing

**Check if you're looking at the right date range or filters**
- Clear all search filters
- Check date range filters
- Reset pagination to page 1

**Check if backup was recently restored**
- If you restored an old backup, recent data won't be present
- Restore the safety backup if this was a mistake

### Backup Failed

**Possible causes**:
- Insufficient disk space
- Documents folder not accessible
- File permissions issue

**Solutions**:
1. Free up disk space (at least 100 MB)
2. Check that Documents folder exists
3. Run GaragePro as Administrator (right-click → Run as Administrator)

### PDF Export Not Working

**Check available disk space**:
- Ensure you have at least 50 MB free
- Choose a location you have write access to

**Try a different location**:
- Export to Desktop instead of Documents
- Export to a different drive

### Application Running Slowly

**Possible causes**:
- Too many records (10,000+ services)
- Antivirus scanning the database
- Low system resources

**Solutions**:
1. Archive old service records
2. Add GaragePro to antivirus exclusions
3. Close other applications
4. Restart the application

---

## Data Storage

Understanding where your data is stored is important for backups and troubleshooting.

### Application Files

**Installation location**:
```
C:\Program Files\GaragePro\
```

Contains:
- Application executable
- System libraries
- Configuration files

### Database Location

**Main database**:
```
C:\Users\<YourUsername>\AppData\Local\GaragePro\app.db
```

This file contains:
- All customers
- All vehicles
- All service records
- User accounts and PINs
- All application data

**Database technology**:
- SQLite (industry-standard embedded database)
- WAL (Write-Ahead Logging) mode for crash safety
- Automatic integrity checks

### Backup Location

**Automatic and manual backups**:
```
C:\Users\<YourUsername>\Documents\GaragePro\Backups\
```

Contains:
- Daily automatic backups
- Manual backups
- Safety backups (created before restore)

### Why Data Survives Updates

Your data is stored in:
- **AppData\Local** (main database)
- **Documents** (backups)

Application updates only replace:
- **Program Files** (application files)

This means:
- Updating GaragePro keeps all your data
- Uninstalling GaragePro keeps all your data
- Reinstalling GaragePro keeps all your data

### Manually Backing Up Everything

To create a complete backup:
1. Close GaragePro
2. Copy the entire folder:
   ```
   C:\Users\<YourUsername>\AppData\Local\GaragePro\
   ```
3. Paste it to:
   - External USB drive
   - Network location
   - Cloud storage (Dropbox, OneDrive, etc.)

To restore:
1. Close GaragePro
2. Copy the backed-up folder back to:
   ```
   C:\Users\<YourUsername>\AppData\Local\GaragePro\
   ```
3. Start GaragePro

---

## PIN Recovery

If you forget your PIN, there is no way to recover it without losing your data.

### Option 1: Restore from Backup (Recommended)

If you have a recent backup:
1. Go to Settings → Backup Settings
2. Restore the most recent backup
3. Try your PIN again

This works because you probably remember the PIN you were using when the backup was created.

### Option 2: Start Fresh (Data Loss)

If you have no backups or can't remember any previous PIN:

**Before starting fresh**:
- Try every PIN combination you might have used
- Check if you wrote it down anywhere
- Ask anyone who might know it

**To start fresh**:
1. Close GaragePro
2. Open File Explorer
3. Navigate to:
   ```
   C:\Users\<YourUsername>\AppData\Local\GaragePro\
   ```
4. Rename `app.db` to `app.db.old` (this saves your data just in case)
5. Start GaragePro
6. You'll see the First Run Wizard again
7. Create a new admin account with a new PIN

**Note**: This creates a completely fresh database. Your old data is preserved in `app.db.old` if you need it later.

### Option 3: Professional Data Recovery

If you have critical data and forgot your PIN:
1. Keep your database file safe (`app.db`)
2. Contact technical support
3. Professional tools can extract data from the database

The data itself is not encrypted, only the PIN. The database can be opened with SQLite tools if needed.

### Preventing PIN Loss

**Best practices**:
1. Write down your PIN in a secure location (not on your computer)
2. Store it in a password manager
3. Share it with a trusted person
4. Keep regular backups
5. Choose a memorable but secure PIN

---

## Tips and Best Practices

### Data Entry Tips

1. **Consistent naming**: Use consistent formats for names and vehicle makes
2. **Complete information**: Fill in all available fields for better reports
3. **Regular updates**: Keep customer contact information up to date
4. **Detailed descriptions**: Write clear service descriptions for clarity

### Workflow Recommendations

1. **Start of day**: Check the dashboard for overview
2. **New customer walk-in**: Add customer → Add vehicle → Create service
3. **Existing customer**: Search customer → Select vehicle → Create service
4. **End of day**: Review today's services, verify all are entered

### Backup Strategy

1. **Daily**: Automatic backup (happens automatically)
2. **Weekly**: Check that automatic backups are working
3. **Monthly**: Create manual backup and copy to external drive
4. **Major events**: Manual backup before mass deletions or major changes

### Performance Tips

1. **Regular maintenance**: Restart the application weekly
2. **Archive old data**: Keep the database under 10,000 service records
3. **Search efficiently**: Use specific search terms rather than browsing
4. **Close when not in use**: Saves system resources

### Security Tips

1. **Lock when away**: Log out or let auto-lock engage when away from computer
2. **Keep PIN private**: Don't share your PIN with unauthorized users
3. **Regular backups**: Protect against data loss
4. **Physical security**: Keep the computer in a secure location

---

## Support and Updates

### Getting Help

For technical support or questions:
- Refer to this user guide
- Check the troubleshooting section
- Contact your software provider

### Checking for Updates

Currently, updates must be installed manually:
1. Download the new installer
2. Run the installer
3. Your data will be preserved automatically

Future versions may include automatic update notifications.

### Feature Requests

If you'd like to see new features in GaragePro:
- Contact your software provider
- Describe the feature and how it would help
- Provide examples of similar features in other software

---

## Keyboard Shortcuts

Coming in future versions:
- Ctrl+N: New service
- Ctrl+F: Focus search
- Ctrl+S: Save current form
- Esc: Close modal/cancel

---

## Glossary

**PIN**: Personal Identification Number - Your access code to the application

**VAT**: Value Added Tax - Tax applied to services (default 24%)

**Service Record**: A complete record of work performed on a vehicle

**Work Order**: A printed document detailing services performed and charges

**Backup**: A copy of your database saved at a specific point in time

**Restore**: Replacing your current database with a previous backup

**Auto-lock**: Automatic logout after period of inactivity

**UUID**: Universal Unique Identifier - The internal ID format used for all records

**SQLite**: The database technology used by GaragePro

**WAL Mode**: Write-Ahead Logging - A database safety feature

---

## Version Information

**Current Version**: 0.1.0 (MVP)

**Release Date**: January 2026

**Platform**: Windows 10/11

**Technology**: Tauri Desktop Application

---

## Legal and Privacy

### Data Privacy

- All data is stored locally on your computer
- No data is sent to the internet
- No telemetry or analytics are collected
- No account registration required
- You have complete control of your data

### Data Ownership

- You own all data entered into GaragePro
- You can export or backup your data at any time
- You can delete the application and data at any time

### License

GaragePro is proprietary software. See your license agreement for terms of use.

---

## Conclusion

Thank you for using GaragePro. This application is designed to make your garage management efficient and reliable. With proper use of backups and security features, your data will remain safe and accessible.

For the best experience:
- Keep your PIN secure but memorable
- Maintain regular backups
- Keep your Windows system updated
- Close the application when not in use

Happy garage managing!

---

**Document Version**: 1.0
**Last Updated**: January 14, 2026
**Applies to**: GaragePro v0.1.0 and later
