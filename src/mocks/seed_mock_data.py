import argparse
import json
import random
import sqlite3
import string
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Tuple

VAT_RATE = 0.24

FIRST_NAMES = [
    "Giorgos","Dimitris","Nikos","Kostas","Giannis","Panagiotis","Vasilis","Christos",
    "Maria","Eleni","Katerina","Georgia","Sofia","Anna","Dora","Ioanna"
]
LAST_NAMES = [
    "Papadopoulos","Nikolaou","Georgiou","Oikonomou","Pappas","Vasiliou","Christou",
    "Iordanou","Karagiannis","Ioannidis","Karantonis","Efthymiou","Koutroulia"
]
STREETS = ["Kifisias", "Mesogeion", "Patision", "Syngrou", "Poseidonos", "Acharnon", "Tatoiou", "Panepistimiou"]
CITIES = ["Athens", "Marousi", "Chalandri", "Gerakas", "Piraeus", "Peristeri", "Glyfada", "Nea Ionia"]

MAKES_MODELS = [
    ("Toyota", ["Yaris","Corolla","Auris","RAV4"]),
    ("Volkswagen", ["Golf","Polo","Passat","Tiguan"]),
    ("Ford", ["Fiesta","Focus","Kuga"]),
    ("BMW", ["116i","318i","520d","X1"]),
    ("Mercedes", ["A180","C200","E220","GLA200"]),
    ("Hyundai", ["i10","i20","i30","Tucson"]),
    ("Kia", ["Picanto","Rio","Ceed","Sportage"]),
    ("Opel", ["Corsa","Astra","Insignia"]),
    ("Audi", ["A1","A3","A4","Q3"]),
]

SERVICE_DESCRIPTIONS = [
    "Oil change", "Oil filter", "Air filter", "Cabin filter", "Brake pads", "Brake discs",
    "Battery replacement", "Spark plugs", "Coolant flush", "AC recharge", "Wheel alignment",
    "Tire change", "Engine diagnostics", "Timing belt", "Water pump", "Transmission service",
    "Wiper blades", "Bulb replacement", "Suspension check", "Throttle cleaning"
]

def iso_now() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"

def iso_random_date(within_years: int = 5) -> str:
    days = random.randint(0, within_years * 365)
    dt = datetime.utcnow() - timedelta(days=days, hours=random.randint(0, 23), minutes=random.randint(0, 59))
    return dt.replace(microsecond=0).isoformat() + "Z"

def gen_uuid() -> str:
    return str(uuid.uuid4())

def gen_email(first: str, last: str, i: int) -> str:
    dom = random.choice(["gmail.com","outlook.com","yahoo.com","hotmail.com"])
    return f"{first.lower()}.{last.lower()}{i}@{dom}"

def gen_phone() -> str:
    # Greek-like mobile/landline-ish
    prefix = random.choice(["69", "21"])
    rest = "".join(random.choice(string.digits) for _ in range(8))
    return prefix + rest

def gen_address() -> str:
    return f"{random.choice(STREETS)} {random.randint(1, 199)}, {random.choice(CITIES)}"

def gen_afm() -> str:
    return "".join(random.choice(string.digits) for _ in range(9))

def gen_license_plate(used: set) -> str:
    # Simple format: ABC-1234
    while True:
        letters = "".join(random.choice(string.ascii_uppercase) for _ in range(3))
        nums = "".join(random.choice(string.digits) for _ in range(4))
        plate = f"{letters}-{nums}"
        if plate not in used:
            used.add(plate)
            return plate

def make_service_lines(min_lines=1, max_lines=15) -> Tuple[List[Dict], float]:
    n = random.randint(min_lines, max_lines)
    lines = []
    subtotal = 0.0
    for idx in range(n):
        desc = random.choice(SERVICE_DESCRIPTIONS)
        qty = random.randint(1, 4)
        unit_price = round(random.uniform(8, 250), 2)
        line_total = qty * unit_price
        subtotal += line_total
        lines.append({
            "id": int(datetime.utcnow().timestamp() * 1000) + idx,
            "description": desc,
            "quantity": qty,
            "unit_price": unit_price
        })
    subtotal = round(subtotal, 2)
    return lines, subtotal

def connect(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    return conn

def truncate_all(conn: sqlite3.Connection):
    # order matters due to FK
    conn.execute("DELETE FROM service_records;")
    conn.execute("DELETE FROM vehicles;")
    conn.execute("DELETE FROM customers;")

def seed(db_path: str, customers_count: int, vehicles_min: int, vehicles_max: int,
         service_records_min: int, service_records_max: int,
         lines_min: int, lines_max: int, truncate: bool):
    conn = connect(db_path)

    # ✅ ΠΑΝΤΑ ορισμένα από την αρχή
    customers = []
    vehicles = []
    service_records = []

    try:
        cur = conn.cursor()

        if truncate:
            print("Truncating customers/vehicles/service_records...")
            truncate_all(conn)
            conn.commit()  # ✅ commit μετά το truncate

        now = iso_now()
        used_plates = set()

        # --- Generate customers + vehicles + service_records ---
        for i in range(customers_count):
            cid = gen_uuid()
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            name = f"{first} {last}"
            email = gen_email(first, last, i)
            phone = gen_phone()
            address = gen_address()
            afm = gen_afm()

            customers.append((cid, name, email, phone, address, afm, now, now))

            vcount = random.randint(vehicles_min, vehicles_max)
            for _ in range(vcount):
                vid = gen_uuid()
                make, models = random.choice(MAKES_MODELS)
                model = random.choice(models)
                year = random.randint(2000, 2025)
                plate = gen_license_plate(used_plates)
                vin = None if random.random() < 0.35 else "".join(
                    random.choice(string.ascii_uppercase + string.digits) for _ in range(17)
                )

                vehicles.append((vid, cid, make, model, year, plate, vin, now, now))

                scount = random.randint(service_records_min, service_records_max)
                for _sr in range(scount):
                    sid = gen_uuid()
                    date = iso_random_date(within_years=5)
                    mileage = random.randint(1_000, 380_000)
                    notes = random.choice(["", "Customer requested quick check", "Noise reported", "Recheck in 2 weeks", ""])
                    lines, subtotal = make_service_lines(lines_min, lines_max)
                    vat = round(subtotal * VAT_RATE, 2)
                    total = round(subtotal + vat, 2)
                    description = " | ".join([l["description"] for l in lines])[:255]

                    service_records.append((
                        sid, vid, None, date, description, mileage,
                        notes if notes else None,
                        json.dumps(lines, ensure_ascii=False),
                        subtotal, vat, total, now, now
                    ))

        print(f"Inserting: customers={len(customers)}, vehicles={len(vehicles)}, service_records={len(service_records)}")

        # ❌ ΜΗΝ βάλεις BEGIN εδώ
        # conn.execute("BEGIN;")

        cur.executemany("""
            INSERT INTO customers (id, name, email, phone, address, afm, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, customers)

        cur.executemany("""
            INSERT INTO vehicles (id, customer_id, make, model, year, license_plate, vin, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, vehicles)

        cur.executemany("""
            INSERT INTO service_records (
                id, vehicle_id, mechanic_id, date, description, mileage, notes,
                services_json, subtotal, vat, total, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, service_records)

        conn.commit()
        print("✅ Done.")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", required=True, help="Path to app.db")
    ap.add_argument("--customers", type=int, default=1400)
    ap.add_argument("--vehicles-min", type=int, default=1)
    ap.add_argument("--vehicles-max", type=int, default=6)
    ap.add_argument("--sr-min", type=int, default=0, help="Service records per vehicle (min)")
    ap.add_argument("--sr-max", type=int, default=5, help="Service records per vehicle (max)")
    ap.add_argument("--lines-min", type=int, default=1, help="Lines per service record (min)")
    ap.add_argument("--lines-max", type=int, default=15, help="Lines per service record (max)")
    ap.add_argument("--truncate", action="store_true", help="Delete existing customers/vehicles/service_records before seeding")
    args = ap.parse_args()

    if args.vehicles_min > args.vehicles_max:
        raise SystemExit("vehicles-min must be <= vehicles-max")
    if args.sr_min > args.sr_max:
        raise SystemExit("sr-min must be <= sr-max")
    if args.lines_min > args.lines_max:
        raise SystemExit("lines-min must be <= lines-max")

    seed(
        db_path=args.db,
        customers_count=args.customers,
        vehicles_min=args.vehicles_min,
        vehicles_max=args.vehicles_max,
        service_records_min=args.sr_min,
        service_records_max=args.sr_max,
        lines_min=args.lines_min,
        lines_max=args.lines_max,
        truncate=args.truncate
    )

if __name__ == "__main__":
    main()
