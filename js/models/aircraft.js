/**
 * Aircraft Data & Logic
 */

export const AIRCRAFT_TYPES = {
    // WIDEBODY / HEAVY PASAJEROS
    B744: {
        id: 'B744',
        name: 'Boeing 747-400',
        manufacturer: 'Boeing',
        category: 'Heavy',
        price: 250000000,
        range: 13450,
        speed: 913,
        seats: 416,
        runway: 3300,
        fuelBurn: 50,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Boeing+747-400'
    },
    B77W: {
        id: 'B77W',
        name: 'Boeing 777-300ER',
        manufacturer: 'Boeing',
        category: 'Heavy',
        price: 290000000,
        range: 13650,
        speed: 905,
        seats: 368,
        runway: 3000,
        fuelBurn: 48,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Boeing+777-300ER'
    },
    B772: {
        id: 'B772',
        name: 'Boeing 777-200ER',
        manufacturer: 'Boeing',
        category: 'Heavy',
        price: 260000000,
        range: 14300,
        speed: 905,
        seats: 314,
        runway: 2700,
        fuelBurn: 45,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Boeing+777-200ER'
    },
    B789: {
        id: 'B789',
        name: 'Boeing 787-9',
        manufacturer: 'Boeing',
        category: 'Heavy',
        price: 260000000,
        range: 14140,
        speed: 910,
        seats: 290,
        runway: 2600,
        fuelBurn: 40,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Boeing+787-9'
    },
    B788: {
        id: 'B788',
        name: 'Boeing 787-8',
        manufacturer: 'Boeing',
        category: 'Heavy',
        price: 230000000,
        range: 13620,
        speed: 910,
        seats: 242,
        runway: 2600,
        fuelBurn: 37,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Boeing+787-8'
    },
    B78X: {
        id: 'B78X',
        name: 'Boeing 787-10',
        manufacturer: 'Boeing',
        category: 'Heavy',
        price: 260000000,
        range: 11900,
        speed: 910,
        seats: 330,
        runway: 2800,
        fuelBurn: 42,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Boeing+787-10'
    },
    A332: {
        id: 'A332',
        name: 'Airbus A330-200',
        manufacturer: 'Airbus',
        category: 'Heavy',
        price: 210000000,
        range: 13450,
        speed: 880,
        seats: 260,
        runway: 2600,
        fuelBurn: 38,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Airbus+A330-200'
    },
    A333: {
        id: 'A333',
        name: 'Airbus A330-300',
        manufacturer: 'Airbus',
        category: 'Heavy',
        price: 220000000,
        range: 11300,
        speed: 880,
        seats: 300,
        runway: 2700,
        fuelBurn: 40,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Airbus+A330-300'
    },
    A359: {
        id: 'A359',
        name: 'Airbus A350-900',
        manufacturer: 'Airbus',
        category: 'Heavy',
        price: 280000000,
        range: 15000,
        speed: 910,
        seats: 325,
        runway: 2800,
        fuelBurn: 42,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Airbus+A350-900'
    },
    A35K: {
        id: 'A35K',
        name: 'Airbus A350-1000',
        manufacturer: 'Airbus',
        category: 'Heavy',
        price: 320000000,
        range: 16000,
        speed: 910,
        seats: 366,
        runway: 3000,
        fuelBurn: 45,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Airbus+A350-1000'
    },
    A388: {
        id: 'A388',
        name: 'Airbus A380-800',
        manufacturer: 'Airbus',
        category: 'Heavy',
        price: 430000000,
        range: 15200,
        speed: 910,
        seats: 520,
        runway: 3000,
        fuelBurn: 65,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Airbus+A380-800'
    },
    B763: {
        id: 'B763',
        name: 'Boeing 767-300ER',
        manufacturer: 'Boeing',
        category: 'Heavy',
        price: 180000000,
        range: 11000,
        speed: 860,
        seats: 260,
        runway: 2500,
        fuelBurn: 35,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Boeing+767-300ER'
    },

    // NARROWBODY / MEDIUM
    A319: {
        id: 'A319',
        name: 'Airbus A319',
        manufacturer: 'Airbus',
        category: 'Medium',
        price: 80000000,
        range: 3700,
        speed: 840,
        seats: 140,
        runway: 1800,
        fuelBurn: 22,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Airbus+A319'
    },
    A320: {
        id: 'A320',
        name: 'Airbus A320-200',
        manufacturer: 'Airbus',
        category: 'Medium',
        price: 95000000,
        range: 6100,
        speed: 840,
        seats: 180,
        runway: 1900,
        fuelBurn: 24,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Airbus+A320-200'
    },
    A20N: {
        id: 'A20N',
        name: 'Airbus A320neo',
        manufacturer: 'Airbus',
        category: 'Medium',
        price: 105000000,
        range: 6500,
        speed: 840,
        seats: 186,
        runway: 1900,
        fuelBurn: 22,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Airbus+A320neo'
    },
    A321: {
        id: 'A321',
        name: 'Airbus A321-200',
        manufacturer: 'Airbus',
        category: 'Medium',
        price: 110000000,
        range: 5600,
        speed: 840,
        seats: 210,
        runway: 2100,
        fuelBurn: 26,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Airbus+A321-200'
    },
    A21N: {
        id: 'A21N',
        name: 'Airbus A321neo',
        manufacturer: 'Airbus',
        category: 'Medium',
        price: 120000000,
        range: 7400,
        speed: 840,
        seats: 220,
        runway: 2100,
        fuelBurn: 26,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Airbus+A321neo'
    },
    B738: {
        id: 'B738',
        name: 'Boeing 737-800',
        manufacturer: 'Boeing',
        category: 'Medium',
        price: 90000000,
        range: 5400,
        speed: 840,
        seats: 180,
        runway: 2000,
        fuelBurn: 23,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Boeing+737-800'
    },
    B73H: {
        id: 'B73H',
        name: 'Boeing 737-800 (High Density)',
        manufacturer: 'Boeing',
        category: 'Medium',
        price: 92000000,
        range: 5200,
        speed: 840,
        seats: 189,
        runway: 2000,
        fuelBurn: 24,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Boeing+737-800+HD'
    },
    B38M: {
        id: 'B38M',
        name: 'Boeing 737 MAX 8',
        manufacturer: 'Boeing',
        category: 'Medium',
        price: 110000000,
        range: 6570,
        speed: 840,
        seats: 189,
        runway: 2100,
        fuelBurn: 22,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Boeing+737+MAX+8'
    },
    B39M: {
        id: 'B39M',
        name: 'Boeing 737 MAX 9',
        manufacturer: 'Boeing',
        category: 'Medium',
        price: 115000000,
        range: 6570,
        speed: 840,
        seats: 204,
        runway: 2200,
        fuelBurn: 23,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Boeing+737+MAX+9'
    },
    B752: {
        id: 'B752',
        name: 'Boeing 757-200',
        manufacturer: 'Boeing',
        category: 'Medium',
        price: 95000000,
        range: 7220,
        speed: 880,
        seats: 200,
        runway: 2300,
        fuelBurn: 30,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Boeing+757-200'
    },

    // A220 FAMILY
    A221: {
        id: 'A221',
        name: 'Airbus A220-100',
        manufacturer: 'Airbus',
        category: 'Medium',
        price: 90000000,
        range: 6700,
        speed: 830,
        seats: 120,
        runway: 1800,
        fuelBurn: 18,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Airbus+A220-100'
    },
    A223: {
        id: 'A223',
        name: 'Airbus A220-300',
        manufacturer: 'Airbus',
        category: 'Medium',
        price: 98000000,
        range: 6500,
        speed: 830,
        seats: 145,
        runway: 1850,
        fuelBurn: 19,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Airbus+A220-300'
    },

    // REGIONAL JETS
    E170: {
        id: 'E170',
        name: 'Embraer E170',
        manufacturer: 'Embraer',
        category: 'Regional',
        price: 38000000,
        range: 3800,
        speed: 830,
        seats: 70,
        runway: 1700,
        fuelBurn: 13,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Embraer+E170'
    },
    E175: {
        id: 'E175',
        name: 'Embraer E175',
        manufacturer: 'Embraer',
        category: 'Regional',
        price: 40000000,
        range: 2900,
        speed: 875,
        seats: 76,
        runway: 1700,
        fuelBurn: 14,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Embraer+E175'
    },
    E190: {
        id: 'E190',
        name: 'Embraer E190',
        manufacturer: 'Embraer',
        category: 'Regional',
        price: 50000000,
        range: 4500,
        speed: 830,
        seats: 100,
        runway: 1800,
        fuelBurn: 15,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Embraer+E190'
    },
    E195: {
        id: 'E195',
        name: 'Embraer E195',
        manufacturer: 'Embraer',
        category: 'Regional',
        price: 55000000,
        range: 4200,
        speed: 830,
        seats: 120,
        runway: 1850,
        fuelBurn: 16,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Embraer+E195'
    },
    E195E2: {
        id: 'E195E2',
        name: 'Embraer E195-E2',
        manufacturer: 'Embraer',
        category: 'Regional',
        price: 62000000,
        range: 4665,
        speed: 875,
        seats: 132,
        runway: 1900,
        fuelBurn: 15,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Embraer+E195-E2'
    },
    CRJ7: {
        id: 'CRJ7',
        name: 'Bombardier CRJ700',
        manufacturer: 'Bombardier',
        category: 'Regional',
        price: 32000000,
        range: 2200,
        speed: 830,
        seats: 70,
        runway: 1700,
        fuelBurn: 12,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=CRJ700'
    },
    CRJ9: {
        id: 'CRJ9',
        name: 'Bombardier CRJ900',
        manufacturer: 'Bombardier',
        category: 'Regional',
        price: 35000000,
        range: 2100,
        speed: 840,
        seats: 90,
        runway: 1750,
        fuelBurn: 13,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=CRJ900'
    },

    // TURBOHÉLICE REGIONALES / SMALL
    AT45: {
        id: 'AT45',
        name: 'ATR 42-600',
        manufacturer: 'ATR',
        category: 'Small',
        price: 22000000,
        range: 1500,
        speed: 500,
        seats: 48,
        runway: 1200,
        fuelBurn: 8,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=ATR+42-600'
    },
    ATR72: {
        id: 'ATR72',
        name: 'ATR 72-600',
        manufacturer: 'ATR',
        category: 'Regional',
        price: 28000000,
        range: 1400,
        speed: 510,
        seats: 72,
        runway: 1350,
        fuelBurn: 9,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=ATR+72-600'
    },
    DH8D: {
        id: 'DH8D',
        name: 'Dash 8 Q400',
        manufacturer: 'De Havilland',
        category: 'Regional',
        price: 32000000,
        range: 2000,
        speed: 667,
        seats: 78,
        runway: 1400,
        fuelBurn: 10,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Dash+8+Q400'
    },
    C208: {
        id: 'C208',
        name: 'Cessna 208 Caravan',
        manufacturer: 'Cessna',
        category: 'Small',
        price: 2500000,
        range: 1700,
        speed: 340,
        seats: 9,
        runway: 800,
        fuelBurn: 3,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Cessna+208'
    },

    // CARGO
    B738F: {
        id: 'B738F',
        name: 'Boeing 737-800BCF',
        manufacturer: 'Boeing',
        category: 'Medium',
        price: 60000000,
        range: 3700,
        speed: 820,
        seats: 0,
        runway: 2100,
        fuelBurn: 22,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Boeing+737-800F'
    },
    B763F: {
        id: 'B763F',
        name: 'Boeing 767-300F',
        manufacturer: 'Boeing',
        category: 'Heavy',
        price: 190000000,
        range: 6000,
        speed: 860,
        seats: 2,
        runway: 2500,
        fuelBurn: 40,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Boeing+767-300F'
    },
    B77F: {
        id: 'B77F',
        name: 'Boeing 777F',
        manufacturer: 'Boeing',
        category: 'Heavy',
        price: 280000000,
        range: 9070,
        speed: 900,
        seats: 2,
        runway: 2700,
        fuelBurn: 48,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Boeing+777F'
    },
    A332F: {
        id: 'A332F',
        name: 'Airbus A330-200F',
        manufacturer: 'Airbus',
        category: 'Heavy',
        price: 220000000,
        range: 7400,
        speed: 880,
        seats: 2,
        runway: 2600,
        fuelBurn: 38,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Airbus+A330-200F'
    },
    B744F: {
        id: 'B744F',
        name: 'Boeing 747-400F',
        manufacturer: 'Boeing',
        category: 'Heavy',
        price: 260000000,
        range: 9200,
        speed: 910,
        seats: 4,
        runway: 3300,
        fuelBurn: 55,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Boeing+747-400F'
    },
    AN124: {
        id: 'AN124',
        name: 'Antonov An-124',
        manufacturer: 'Antonov',
        category: 'Heavy',
        price: 280000000,
        range: 4800,
        speed: 800,
        seats: 6,
        runway: 3200,
        fuelBurn: 70,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Antonov+An-124'
    },

    // CHÁRTER / JETS PRIVADOS
    KNG360: {
        id: 'KNG360',
        name: 'Beechcraft King Air 360',
        manufacturer: 'Beechcraft',
        category: 'Small',
        price: 8000000,
        range: 3300,
        speed: 540,
        seats: 9,
        runway: 1100,
        fuelBurn: 5,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=King+Air+360'
    },
    PHE100: {
        id: 'PHE100',
        name: 'Embraer Phenom 100',
        manufacturer: 'Embraer',
        category: 'Small',
        price: 4500000,
        range: 1700,
        speed: 720,
        seats: 5,
        runway: 950,
        fuelBurn: 3,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Phenom+100'
    },
    PHE300: {
        id: 'PHE300',
        name: 'Embraer Phenom 300E',
        manufacturer: 'Embraer',
        category: 'Small',
        price: 9000000,
        range: 3650,
        speed: 830,
        seats: 9,
        runway: 950,
        fuelBurn: 4,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Phenom+300E'
    },
    CJ3: {
        id: 'CJ3',
        name: 'Cessna Citation CJ3+',
        manufacturer: 'Cessna',
        category: 'Small',
        price: 10000000,
        range: 3400,
        speed: 770,
        seats: 7,
        runway: 1000,
        fuelBurn: 4,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Citation+CJ3'
    },
    LATD: {
        id: 'LATD',
        name: 'Cessna Citation Latitude',
        manufacturer: 'Cessna',
        category: 'Medium',
        price: 18000000,
        range: 5000,
        speed: 820,
        seats: 9,
        runway: 1500,
        fuelBurn: 6,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Citation+Latitude'
    },
    F7X: {
        id: 'F7X',
        name: 'Dassault Falcon 7X',
        manufacturer: 'Dassault',
        category: 'Medium',
        price: 45000000,
        range: 11100,
        speed: 900,
        seats: 16,
        runway: 1800,
        fuelBurn: 9,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Falcon+7X'
    },
    F8X: {
        id: 'F8X',
        name: 'Dassault Falcon 8X',
        manufacturer: 'Dassault',
        category: 'Medium',
        price: 52000000,
        range: 11900,
        speed: 900,
        seats: 16,
        runway: 1800,
        fuelBurn: 9,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Falcon+8X'
    },
    G550: {
        id: 'G550',
        name: 'Gulfstream G550',
        manufacturer: 'Gulfstream',
        category: 'Medium',
        price: 45000000,
        range: 12500,
        speed: 900,
        seats: 18,
        runway: 1800,
        fuelBurn: 10,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Gulfstream+G550'
    },
    G7500: {
        id: 'G7500',
        name: 'Bombardier Global 7500',
        manufacturer: 'Bombardier',
        category: 'Heavy',
        price: 72000000,
        range: 14260,
        speed: 950,
        seats: 19,
        runway: 1900,
        fuelBurn: 11,
        image: 'https://placehold.co/600x400/1e293b/FFF?text=Global+7500'
    }
};

export class Aircraft {
    constructor(typeId, configuration = { economy: 0, business: 0, premium: 0 }, customRegistration = null) {
        const type = AIRCRAFT_TYPES[typeId];
        if (!type) throw new Error("Invalid Aircraft Type");

        // Static Stats
        this.typeId = typeId;
        this.name = type.name;
        this.baseStats = type;

        // Dynamic State
        this.instanceId = Date.now() + Math.random().toString(16).slice(2); // Unique ID
        this.condition = 100; // %
        this.hoursFlown = 0;
        this.location = "HUB"; // Hub airport code
        this.status = "IDLE"; // IDLE, FLIGHT, MAINT
        this.configuration = configuration;
        this.registration = customRegistration || this.generateRegistration();
        this.deliveredAt = Date.now();

        // Statistics
        this.totalRevenue = 0;
        this.totalPassengers = 0;
        this.flightHistory = []; // Last 10 flights
    }

    generateRegistration() {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return "N-" + Math.floor(100 + Math.random() * 900) + letters[Math.floor(Math.random() * 26)] + letters[Math.floor(Math.random() * 26)];
    }

    addFlightRecord(date, route, revenue, passengers) {
        this.flightHistory.unshift({
            date: new Date(date).toLocaleDateString('es-ES'),
            route: route,
            revenue: revenue,
            passengers: passengers
        });

        // Keep only last 10
        if (this.flightHistory.length > 10) {
            this.flightHistory.pop();
        }

        this.totalRevenue += revenue;
        this.totalPassengers += passengers;
    }
}
