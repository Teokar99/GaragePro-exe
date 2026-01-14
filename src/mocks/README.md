# Mock Data for AutoShop Pro

This folder contains mock data generation utilities to populate the database with realistic test data.

## What's Included

### Files

1. **mockData.ts** - Contains all mock data and generation functions:
   - Dynamic customer generation with random Greek names, emails, phones, and addresses
   - 20 car makes with associated models
   - 20 different service types
   - Functions to generate random vehicles, services, and dates
   - Each generation creates unique data with randomized combinations

2. **seedDatabase.ts** - Database population scripts:
   - `seedDatabase()` - Populates the database with mock data
   - **Guarantees 100% coverage** of all car makes and service types
   - Prevents duplicate entries (checks emails, license plates, and VINs)
   - Generates fresh random data on each run
   - Reports detailed statistics and coverage metrics
   - `clearDatabase()` - Removes all data from the database

3. **DatabaseSeeder.tsx** - UI component for managing mock data:
   - Visual interface to seed or clear the database
   - Progress indicators and success/error messages
   - Safety confirmations for destructive operations
   - Shows detailed results after seeding

## What Gets Created

When you seed the database, you'll get **COMPREHENSIVE COVERAGE** of all data types:

- **Up to 100 Customers** with realistic Greek names, emails, phones, and addresses
  - Generated fresh on each run with random combinations
  - Unique emails to prevent duplicates

- **150-250 Vehicles** with **100% coverage of all 20 car makes**:
  - Toyota, Honda, BMW, Mercedes-Benz, Volkswagen, Audi, Ford, Nissan, Hyundai, Kia, Mazda, Subaru, Volvo, Peugeot, Renault, Seat, Skoda, Opel, Fiat, Citroen
  - Multiple authentic models for each make
  - Random years (2010-2025)
  - Unique license plates (format: ABC-1234)
  - Unique VIN numbers (17 characters)

- **400-800 Service Records** with **100% coverage of all 20 service types**:
  - Oil and Filter Change
  - Brake Pad Replacement
  - Tire Rotation and Balance
  - Air Filter Replacement
  - Battery Replacement
  - Spark Plug Replacement
  - Coolant Flush
  - Transmission Service
  - Wheel Alignment
  - Brake Fluid Change
  - Power Steering Flush
  - Fuel System Cleaning
  - Timing Belt Replacement
  - Suspension Repair
  - AC Recharge
  - Exhaust System Repair
  - Windshield Wiper Replacement
  - Headlight Bulb Replacement
  - Annual Inspection
  - Engine Diagnostic
  - Services spread across dates from January 2023 to present
  - Realistic pricing with 24% VAT calculations
  - Random mileage readings and service notes

## How to Use

### Via UI (Recommended)

1. Log into the application
2. Navigate to "Database Tools" in the sidebar
3. Click "Seed Database" to add mock data
4. Click "Clear Database" to remove all data (with confirmation)

### Programmatically

```typescript
import { seedDatabase, clearDatabase } from './mocks/seedDatabase';

// Add mock data
await seedDatabase();

// Remove all data
await clearDatabase();
```

## Data Structure

### Customers
```typescript
{
  name: string
  email: string
  phone: string
  address: string
}
```

### Vehicles
```typescript
{
  make: string
  model: string
  year: number
  license_plate: string
  vin: string
  customer_id: string
}
```

### Service Records
```typescript
{
  vehicle_id: string
  date: string
  description: string
  mileage: number
  notes: string
  services: Array<{
    description: string
    quantity: number
    unit_price: number
  }>
  subtotal: number
  vat: number
  total: number
}
```

## Notes

- The seeding process may take 2-3 minutes to complete
- **100% Comprehensive Coverage**:
  - System guarantees ALL 20 car makes are represented
  - System guarantees ALL 20 service types are represented
  - Console displays coverage report showing which items were included
  - If any items are missing, they are clearly listed
- **Each run generates completely new random data** - no two seeds are identical
- **Duplicate prevention**:
  - Customers with existing emails are skipped
  - Vehicles with duplicate license plates or VINs are regenerated
  - The system will report how many entries were added vs skipped
- **Detailed Statistics**:
  - Total customers added
  - Total vehicles created
  - Total service records created
  - Coverage percentage for car makes and service types
  - List of any missing items (if applicable)
- You can safely run the seed multiple times - it will only add new unique data
- The clear function permanently deletes ALL data - use with caution
- Services are distributed evenly across dates to simulate realistic business activity
- All monetary values include 24% VAT (Greek standard rate)
- Customer names, emails, and addresses are randomly generated from Greek name/location pools
