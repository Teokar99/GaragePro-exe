const firstNames = [
  "John", "Maria", "George", "Elena", "Dimitris", "Sophia", "Andreas", "Christina",
  "Nikos", "Anna", "Yannis", "Katerina", "Panagiotis", "Vasiliki", "Kostas",
  "Irini", "Christos", "Despina", "Michalis", "Fotini", "Spyros", "Eleni",
  "Alexandros", "Ioanna", "Thanasis", "Angeliki", "Stratos", "Lydia", "Giorgos",
  "Zoe", "Takis", "Olga", "Petros", "Konstantina", "Stelios", "Melina",
  "Dionysis", "Victoria", "Filippos", "Panagiota", "Manolis", "Theodora",
  "Apostolos", "Chrysoula", "Evangelos", "Aikaterini", "Stavros", "Paraskevi",
  "Leonidas", "Dimitra", "Antonis", "Evi", "Giannis", "Vicky", "Panos",
  "Dina", "Tassos", "Marina", "Sakis", "Eleftheria"
];

const lastNames = [
  "Papadopoulos", "Antonopoulos", "Vasiliou", "Nikolaidis", "Georgiou",
  "Christou", "Dimitriou", "Konstantinou", "Petrou", "Ioannou", "Michailidou",
  "Katsaros", "Panou", "Makris", "Stavrou", "Pavlidis", "Kostopoulos",
  "Athanasiou", "Markou", "Theodorou", "Kostaki", "Vlahos", "Samaras",
  "Dimas", "Roussou", "Karamanlis", "Papadaki", "Mitsotakis", "Lambrou",
  "Fotopoulos", "Stefanidou", "Mylonas", "Vogiatzis", "Kanellopoulos",
  "Androulaki", "Galanis", "Solomou", "Drakopoulos", "Alexiou", "Christodoulou",
  "Sideris", "Bouloukos", "Pappas", "Argyropoulos", "Dellis", "Kokkinos",
  "Tzimas", "Tsoukalas", "Zografou", "Kritikos"
];

const emailDomains = ["gmail.com", "yahoo.com", "hotmail.com", "email.com", "outlook.com"];

const greekCities = [
  "Athens", "Kifisias Ave, Athens", "Vouliagmenis Ave, Glyfada", "Patision St, Athens",
  "Mesogion Ave, Athens", "Alexandras Ave, Athens", "Syngrou Ave, Athens", "Pireos St, Athens",
  "Ermou St, Athens", "Stadiou St, Athens", "Panepistimiou St, Athens", "Akadimias St, Athens",
  "Kolonaki, Athens", "Omonia, Athens", "Syntagma, Athens", "Monastiraki, Athens",
  "Psiri, Athens", "Gazi, Athens", "Thissio, Athens", "Plaka, Athens", "Exarcheia, Athens",
  "Pangrati, Athens", "Chalandri, Athens", "Marousi, Athens", "Piraeus", "Kallithea, Athens",
  "Nea Smyrni, Athens", "Voula", "Varkiza, Athens", "Vouliagmeni", "Alimos, Athens",
  "Palaio Faliro, Athens", "Ag. Dimitrios, Athens", "Ilioupoli, Athens", "Dafni, Athens",
  "Egaleo, Athens", "Peristeri, Athens", "Nikaia, Athens", "Korydallos, Athens",
  "Agia Paraskevi, Athens", "Holargos, Athens", "Psychiko, Athens", "Kifisia, Athens",
  "Nea Ionia, Athens", "Metamorfosi, Athens", "Halandri, Athens", "Perama, Athens", "Keratsini, Athens"
];

function generateRandomCustomer() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const name = `${firstName} ${lastName}`;

  const emailPrefix = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 999)}`;
  const emailDomain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
  const email = `${emailPrefix}@${emailDomain}`;

  const phone = `555-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`;

  const streetNumber = Math.floor(Math.random() * 200) + 1;
  const city = greekCities[Math.floor(Math.random() * greekCities.length)];
  const address = `${streetNumber} ${city}`;

  return { name, email, phone, address };
}

export function generateMockCustomers(count: number) {
  const customers = [];
  for (let i = 0; i < count; i++) {
    customers.push(generateRandomCustomer());
  }
  return customers;
}

export const mockCustomers = [
  { name: "John Smith", email: "john.smith@email.com", phone: "555-0101", address: "123 Main St, Athens" },
  { name: "Maria Papadopoulos", email: "maria.p@gmail.com", phone: "555-0102", address: "45 Kifisias Ave, Athens" },
  { name: "George Antonopoulos", email: "g.antonopoulos@yahoo.com", phone: "555-0103", address: "78 Vouliagmenis Ave, Glyfada" },
  { name: "Elena Vasiliou", email: "elena.v@hotmail.com", phone: "555-0104", address: "12 Patision St, Athens" },
  { name: "Dimitris Nikolaidis", email: "dim.nikolaidis@gmail.com", phone: "555-0105", address: "34 Mesogion Ave, Athens" },
  { name: "Sophia Georgiou", email: "sophia.g@email.com", phone: "555-0106", address: "56 Alexandras Ave, Athens" },
  { name: "Andreas Christou", email: "andreas.c@yahoo.com", phone: "555-0107", address: "89 Syngrou Ave, Athens" },
  { name: "Christina Dimitriou", email: "christina.d@gmail.com", phone: "555-0108", address: "23 Pireos St, Athens" },
  { name: "Nikos Konstantinou", email: "nikos.k@hotmail.com", phone: "555-0109", address: "67 Athinas St, Athens" },
  { name: "Anna Petrou", email: "anna.petrou@email.com", phone: "555-0110", address: "90 Ermou St, Athens" },
  { name: "Yannis Ioannou", email: "yannis.i@gmail.com", phone: "555-0111", address: "15 Stadiou St, Athens" },
  { name: "Katerina Michailidou", email: "kat.m@yahoo.com", phone: "555-0112", address: "42 Panepistimiou St, Athens" },
  { name: "Panagiotis Katsaros", email: "panos.k@gmail.com", phone: "555-0113", address: "78 Akadimias St, Athens" },
  { name: "Vasiliki Panou", email: "vicky.p@hotmail.com", phone: "555-0114", address: "31 Kolonaki Sq, Athens" },
  { name: "Kostas Makris", email: "kostas.m@email.com", phone: "555-0115", address: "54 Omonia Sq, Athens" },
  { name: "Irini Stavrou", email: "irini.s@gmail.com", phone: "555-0116", address: "87 Syntagma Sq, Athens" },
  { name: "Christos Pavlidis", email: "chris.p@yahoo.com", phone: "555-0117", address: "21 Monastiraki, Athens" },
  { name: "Despina Kostopoulos", email: "despina.k@hotmail.com", phone: "555-0118", address: "65 Psiri, Athens" },
  { name: "Michalis Athanasiou", email: "michalis.a@gmail.com", phone: "555-0119", address: "98 Gazi, Athens" },
  { name: "Fotini Markou", email: "fotini.m@email.com", phone: "555-0120", address: "13 Thissio, Athens" },
  { name: "Spyros Theodorou", email: "spyros.t@yahoo.com", phone: "555-0121", address: "47 Plaka, Athens" },
  { name: "Eleni Kostaki", email: "eleni.k@gmail.com", phone: "555-0122", address: "72 Exarcheia, Athens" },
  { name: "Alexandros Vlahos", email: "alex.v@hotmail.com", phone: "555-0123", address: "36 Pangrati, Athens" },
  { name: "Ioanna Samaras", email: "ioanna.s@email.com", phone: "555-0124", address: "81 Chalandri, Athens" },
  { name: "Thanasis Dimas", email: "thanasis.d@gmail.com", phone: "555-0125", address: "19 Marousi, Athens" },
  { name: "Angeliki Roussou", email: "angeliki.r@yahoo.com", phone: "555-0126", address: "52 Piraeus, Athens" },
  { name: "Stratos Karamanlis", email: "stratos.k@hotmail.com", phone: "555-0127", address: "94 Kallithea, Athens" },
  { name: "Lydia Papadaki", email: "lydia.p@gmail.com", phone: "555-0128", address: "27 Nea Smyrni, Athens" },
  { name: "Giorgos Mitsotakis", email: "giorgos.m@email.com", phone: "555-0129", address: "63 Voula, Athens" },
  { name: "Zoe Lambrou", email: "zoe.l@yahoo.com", phone: "555-0130", address: "88 Varkiza, Athens" },
  { name: "Takis Fotopoulos", email: "takis.f@gmail.com", phone: "555-0131", address: "14 Vouliagmeni, Athens" },
  { name: "Olga Stefanidou", email: "olga.s@hotmail.com", phone: "555-0132", address: "49 Alimos, Athens" },
  { name: "Petros Mylonas", email: "petros.m@email.com", phone: "555-0133", address: "76 Palaio Faliro, Athens" },
  { name: "Konstantina Vogiatzis", email: "dina.v@gmail.com", phone: "555-0134", address: "22 Ag. Dimitrios, Athens" },
  { name: "Stelios Kanellopoulos", email: "stelios.k@yahoo.com", phone: "555-0135", address: "58 Ilioupoli, Athens" },
  { name: "Melina Androulaki", email: "melina.a@hotmail.com", phone: "555-0136", address: "93 Dafni, Athens" },
  { name: "Dionysis Galanis", email: "dionysis.g@gmail.com", phone: "555-0137", address: "26 Egaleo, Athens" },
  { name: "Victoria Solomou", email: "victoria.s@email.com", phone: "555-0138", address: "61 Peristeri, Athens" },
  { name: "Filippos Drakopoulos", email: "filippos.d@yahoo.com", phone: "555-0139", address: "97 Nikaia, Athens" },
  { name: "Panagiota Alexiou", email: "panagiota.a@gmail.com", phone: "555-0140", address: "30 Korydallos, Athens" },
  { name: "Manolis Christodoulou", email: "manolis.c@hotmail.com", phone: "555-0141", address: "66 Agia Paraskevi, Athens" },
  { name: "Theodora Sideris", email: "theodora.s@email.com", phone: "555-0142", address: "11 Holargos, Athens" },
  { name: "Apostolos Bouloukos", email: "apostolos.b@gmail.com", phone: "555-0143", address: "44 Psychiko, Athens" },
  { name: "Chrysoula Pappas", email: "chrysoula.p@yahoo.com", phone: "555-0144", address: "79 Kifisia, Athens" },
  { name: "Evangelos Argyropoulos", email: "evangelos.a@hotmail.com", phone: "555-0145", address: "17 Nea Ionia, Athens" },
  { name: "Aikaterini Dellis", email: "aikaterini.d@gmail.com", phone: "555-0146", address: "53 Metamorfosi, Athens" },
  { name: "Stavros Kokkinos", email: "stavros.k@email.com", phone: "555-0147", address: "86 Halandri, Athens" },
  { name: "Paraskevi Tzimas", email: "evi.t@yahoo.com", phone: "555-0148", address: "20 Agioi Anargyroi, Athens" },
  { name: "Leonidas Tsoukalas", email: "leonidas.t@gmail.com", phone: "555-0149", address: "55 Perama, Athens" },
  { name: "Dimitra Zografou", email: "dimitra.z@hotmail.com", phone: "555-0150", address: "91 Keratsini, Athens" }
];

export const carMakes = [
  "Toyota", "Honda", "BMW", "Mercedes-Benz", "Volkswagen", "Audi", "Ford",
  "Nissan", "Hyundai", "Kia", "Mazda", "Subaru", "Volvo", "Peugeot",
  "Renault", "Seat", "Skoda", "Opel", "Fiat", "Citroen"
];

export const carModels: { [key: string]: string[] } = {
  "Toyota": ["Corolla", "Camry", "RAV4", "Yaris", "Aygo", "C-HR"],
  "Honda": ["Civic", "Accord", "CR-V", "Jazz", "HR-V"],
  "BMW": ["3 Series", "5 Series", "X3", "X5", "1 Series"],
  "Mercedes-Benz": ["C-Class", "E-Class", "GLC", "A-Class", "GLE"],
  "Volkswagen": ["Golf", "Polo", "Passat", "Tiguan", "T-Roc"],
  "Audi": ["A3", "A4", "Q3", "Q5", "A6"],
  "Ford": ["Focus", "Fiesta", "Kuga", "Puma", "Mondeo"],
  "Nissan": ["Qashqai", "Juke", "Micra", "X-Trail", "Leaf"],
  "Hyundai": ["i20", "i30", "Tucson", "Kona", "Santa Fe"],
  "Kia": ["Ceed", "Sportage", "Picanto", "Rio", "Stonic"],
  "Mazda": ["3", "CX-3", "CX-5", "2", "6"],
  "Subaru": ["Outback", "Forester", "XV", "Impreza"],
  "Volvo": ["XC40", "XC60", "V40", "V60", "S60"],
  "Peugeot": ["208", "308", "2008", "3008", "5008"],
  "Renault": ["Clio", "Megane", "Captur", "Kadjar", "Scenic"],
  "Seat": ["Ibiza", "Leon", "Arona", "Ateca", "Tarraco"],
  "Skoda": ["Fabia", "Octavia", "Kamiq", "Karoq", "Kodiaq"],
  "Opel": ["Corsa", "Astra", "Crossland", "Grandland", "Insignia"],
  "Fiat": ["500", "Panda", "Tipo", "500X", "500L"],
  "Citroen": ["C3", "C4", "C3 Aircross", "C5 Aircross", "Berlingo"]
};

export const serviceDescriptions = [
  "Oil and Filter Change",
  "Brake Pad Replacement",
  "Tire Rotation and Balance",
  "Air Filter Replacement",
  "Battery Replacement",
  "Spark Plug Replacement",
  "Coolant Flush",
  "Transmission Service",
  "Wheel Alignment",
  "Brake Fluid Change",
  "Power Steering Flush",
  "Fuel System Cleaning",
  "Timing Belt Replacement",
  "Suspension Repair",
  "AC Recharge",
  "Exhaust System Repair",
  "Windshield Wiper Replacement",
  "Headlight Bulb Replacement",
  "Annual Inspection",
  "Engine Diagnostic"
];

export const serviceNotes = [
  "Customer reported strange noise",
  "Routine maintenance",
  "Follow-up from previous service",
  "Customer noticed warning light",
  "Pre-purchase inspection",
  "Scheduled maintenance per manufacturer",
  "Customer requested full check-up",
  "Urgent repair needed",
  "Preventive maintenance",
  "Customer reported vibration"
];

function generateLicensePlate(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const plate =
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    '-' +
    numbers[Math.floor(Math.random() * numbers.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    numbers[Math.floor(Math.random() * numbers.length)];
  return plate;
}

function generateVIN(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) {
    vin += chars[Math.floor(Math.random() * chars.length)];
  }
  return vin;
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export function generateVehicle() {
  const make = carMakes[Math.floor(Math.random() * carMakes.length)];
  const models = carModels[make];
  const model = models[Math.floor(Math.random() * models.length)];
  const currentYear = new Date().getFullYear();
  const year = currentYear - Math.floor(Math.random() * 15);

  return {
    make,
    model,
    year,
    license_plate: generateLicensePlate(),
    vin: generateVIN()
  };
}

export function generateService(vehicleId: string, serviceDate?: Date) {
  const numServices = Math.floor(Math.random() * 3) + 1;
  const services = [];

  for (let i = 0; i < numServices; i++) {
    const description = serviceDescriptions[Math.floor(Math.random() * serviceDescriptions.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;
    const unitPrice = (Math.random() * 200 + 30).toFixed(2);

    services.push({
      description,
      quantity,
      unit_price: parseFloat(unitPrice)
    });
  }

  const subtotal = services.reduce((sum, s) => sum + (s.quantity * s.unit_price), 0);
  const vat = subtotal * 0.24;
  const total = subtotal + vat;

  const date = serviceDate || getRandomDate(
    new Date(2023, 0, 1),
    new Date()
  );

  const mileage = Math.floor(Math.random() * 150000) + 10000;
  const notes = serviceNotes[Math.floor(Math.random() * serviceNotes.length)];

  return {
    vehicle_id: vehicleId,
    date: date.toISOString().split('T')[0],
    description: services.map(s => s.description).join(' | '),
    mileage,
    notes,
    services,
    subtotal,
    vat,
    total
  };
}
