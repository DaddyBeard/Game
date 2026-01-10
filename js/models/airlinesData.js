/**
 * Airline Data - Complete List with Profiles, Alliances, and Regions
 * 49 Airlines with realistic data for SkyTycoon
 */

export const AIRLINES_DATA = [
  // ============================================
  // AEROLÍNEAS PREMIUM (Lujo/Servicio Premium)
  // ============================================
  {
    id: 'rival_1',
    name: 'Qatar Airways',
    hub: 'DOH',
    profile: 'premium',
    reputation: 95,
    dailyIncome: 480000,
    fleetSize: 230,
    color: '#800000',
    alliance: 'oneworld',
    region: 'Oriente Medio'
  },
  {
    id: 'rival_2',
    name: 'Singapore Airlines',
    hub: 'SIN',
    profile: 'premium',
    reputation: 94,
    dailyIncome: 460000,
    fleetSize: 140,
    color: '#003366',
    alliance: 'star-alliance',
    region: 'Asia Pacífico'
  },
  {
    id: 'rival_3',
    name: 'Emirates',
    hub: 'DXB',
    profile: 'premium',
    reputation: 93,
    dailyIncome: 520000,
    fleetSize: 260,
    color: '#c8102e',
    alliance: 'independent',
    region: 'Oriente Medio'
  },
  {
    id: 'rival_4',
    name: 'ANA All Nippon Airways',
    hub: 'HND',
    profile: 'premium',
    reputation: 92,
    dailyIncome: 380000,
    fleetSize: 200,
    color: '#003da5',
    alliance: 'star-alliance',
    region: 'Asia Pacífico'
  },
  {
    id: 'rival_5',
    name: 'Cathay Pacific',
    hub: 'HKG',
    profile: 'premium',
    reputation: 91,
    dailyIncome: 360000,
    fleetSize: 150,
    color: '#006666',
    alliance: 'oneworld',
    region: 'Asia Pacífico'
  },
  {
    id: 'rival_6',
    name: 'Japan Airlines',
    hub: 'NRT',
    profile: 'premium',
    reputation: 90,
    dailyIncome: 340000,
    fleetSize: 170,
    color: '#b30000',
    alliance: 'oneworld',
    region: 'Asia Pacífico'
  },
  {
    id: 'rival_7',
    name: 'EVA Air',
    hub: 'TPE',
    profile: 'premium',
    reputation: 87,
    dailyIncome: 320000,
    fleetSize: 90,
    color: '#00703c',
    alliance: 'star-alliance',
    region: 'Asia Pacífico'
  },
  {
    id: 'rival_8',
    name: 'Swiss International Air Lines',
    hub: 'ZRH',
    profile: 'premium',
    reputation: 84,
    dailyIncome: 260000,
    fleetSize: 100,
    color: '#ff0000',
    alliance: 'star-alliance',
    region: 'Europa'
  },
  {
    id: 'rival_9',
    name: 'Korean Air',
    hub: 'ICN',
    profile: 'premium',
    reputation: 86,
    dailyIncome: 350000,
    fleetSize: 160,
    color: '#00a0e2',
    alliance: 'skyteam',
    region: 'Asia Pacífico'
  },
  {
    id: 'rival_10',
    name: 'Etihad Airways',
    hub: 'AUH',
    profile: 'premium',
    reputation: 81,
    dailyIncome: 340000,
    fleetSize: 100,
    color: '#a39161',
    alliance: 'independent',
    region: 'Oriente Medio'
  },
  {
    id: 'rival_11',
    name: 'Vistara',
    hub: 'DEL',
    profile: 'premium',
    reputation: 79,
    dailyIncome: 210000,
    fleetSize: 70,
    color: '#4b2e83',
    alliance: 'star-alliance',
    region: 'Asia Pacífico'
  },

  // ============================================
  // AEROLÍNEAS FULL-SERVICE (Red Global Completa)
  // ============================================
  {
    id: 'rival_12',
    name: 'Turkish Airlines',
    hub: 'IST',
    profile: 'full-service',
    reputation: 88,
    dailyIncome: 400000,
    fleetSize: 320,
    color: '#d40000',
    alliance: 'star-alliance',
    region: 'Oriente Medio'
  },
  {
    id: 'rival_13',
    name: 'Air France',
    hub: 'CDG',
    profile: 'full-service',
    reputation: 85,
    dailyIncome: 390000,
    fleetSize: 280,
    color: '#002395',
    alliance: 'skyteam',
    region: 'Europa'
  },
  {
    id: 'rival_14',
    name: 'British Airways',
    hub: 'LHR',
    profile: 'full-service',
    reputation: 83,
    dailyIncome: 420000,
    fleetSize: 260,
    color: '#003478',
    alliance: 'oneworld',
    region: 'Europa'
  },
  {
    id: 'rival_15',
    name: 'Lufthansa',
    hub: 'FRA',
    profile: 'full-service',
    reputation: 82,
    dailyIncome: 430000,
    fleetSize: 300,
    color: '#ffcc00',
    alliance: 'star-alliance',
    region: 'Europa'
  },
  {
    id: 'rival_16',
    name: 'Hainan Airlines',
    hub: 'HAK',
    profile: 'full-service',
    reputation: 82,
    dailyIncome: 300000,
    fleetSize: 180,
    color: '#d82020',
    alliance: 'independent',
    region: 'Asia Pacífico'
  },
  {
    id: 'rival_17',
    name: 'Iberia',
    hub: 'MAD',
    profile: 'full-service',
    reputation: 80,
    dailyIncome: 320000,
    fleetSize: 160,
    color: '#ffcc00',
    alliance: 'oneworld',
    region: 'Europa'
  },
  {
    id: 'rival_18',
    name: 'Virgin Atlantic',
    hub: 'LGW',
    profile: 'full-service',
    reputation: 78,
    dailyIncome: 260000,
    fleetSize: 50,
    color: '#c8102e',
    alliance: 'independent',
    region: 'Europa'
  },
  {
    id: 'rival_19',
    name: 'KLM Royal Dutch Airlines',
    hub: 'AMS',
    profile: 'full-service',
    reputation: 81,
    dailyIncome: 340000,
    fleetSize: 170,
    color: '#00a1de',
    alliance: 'skyteam',
    region: 'Europa'
  },
  {
    id: 'rival_20',
    name: 'Saudi Arabian Airlines',
    hub: 'JED',
    profile: 'full-service',
    reputation: 77,
    dailyIncome: 280000,
    fleetSize: 140,
    color: '#006633',
    alliance: 'skyteam',
    region: 'Oriente Medio'
  },
  {
    id: 'rival_21',
    name: 'Delta Air Lines',
    hub: 'ATL',
    profile: 'full-service',
    reputation: 79,
    dailyIncome: 480000,
    fleetSize: 350,
    color: '#003478',
    alliance: 'skyteam',
    region: 'Norteamérica'
  },
  {
    id: 'rival_22',
    name: 'Air Canada',
    hub: 'YYZ',
    profile: 'full-service',
    reputation: 76,
    dailyIncome: 300000,
    fleetSize: 200,
    color: '#d80621',
    alliance: 'star-alliance',
    region: 'Norteamérica'
  },
  {
    id: 'rival_23',
    name: 'Qantas Airways',
    hub: 'SYD',
    profile: 'full-service',
    reputation: 80,
    dailyIncome: 330000,
    fleetSize: 150,
    color: '#e0001b',
    alliance: 'oneworld',
    region: 'Asia Pacífico'
  },
  {
    id: 'rival_24',
    name: 'Air New Zealand',
    hub: 'AKL',
    profile: 'full-service',
    reputation: 79,
    dailyIncome: 230000,
    fleetSize: 90,
    color: '#00263a',
    alliance: 'star-alliance',
    region: 'Asia Pacífico'
  },
  {
    id: 'rival_25',
    name: 'LATAM Airlines',
    hub: 'GRU',
    profile: 'full-service',
    reputation: 75,
    dailyIncome: 360000,
    fleetSize: 280,
    color: '#c0003b',
    alliance: 'oneworld',
    region: 'Latinoamérica'
  },
  {
    id: 'rival_26',
    name: 'Aeromexico',
    hub: 'MEX',
    profile: 'full-service',
    reputation: 76,
    dailyIncome: 260000,
    fleetSize: 130,
    color: '#003e6b',
    alliance: 'skyteam',
    region: 'Latinoamérica'
  },
  {
    id: 'rival_27',
    name: 'Ethiopian Airlines',
    hub: 'ADD',
    profile: 'full-service',
    reputation: 74,
    dailyIncome: 240000,
    fleetSize: 130,
    color: '#008000',
    alliance: 'star-alliance',
    region: 'África'
  },
  {
    id: 'rival_28',
    name: 'Azul Brazilian Airlines',
    hub: 'VCP',
    profile: 'full-service',
    reputation: 74,
    dailyIncome: 220000,
    fleetSize: 140,
    color: '#00338d',
    alliance: 'independent',
    region: 'Latinoamérica'
  },

  // ============================================
  // AEROLÍNEAS REGIONAL-PREMIUM (Especialistas Regionales)
  // ============================================
  {
    id: 'rival_29',
    name: 'Fiji Airways',
    hub: 'NAN',
    profile: 'regional-premium',
    reputation: 81,
    dailyIncome: 140000,
    fleetSize: 20,
    color: '#4b3621',
    alliance: 'oneworld',
    region: 'Asia Pacífico'
  },
  {
    id: 'rival_30',
    name: 'Bangkok Airways',
    hub: 'BKK',
    profile: 'regional-premium',
    reputation: 75,
    dailyIncome: 160000,
    fleetSize: 40,
    color: '#0073cf',
    alliance: 'independent',
    region: 'Asia Pacífico'
  },
  {
    id: 'rival_31',
    name: 'Alaska Airlines',
    hub: 'SEA',
    profile: 'regional-premium',
    reputation: 77,
    dailyIncome: 220000,
    fleetSize: 230,
    color: '#0066cc',
    alliance: 'oneworld',
    region: 'Norteamérica'
  },
  {
    id: 'rival_32',
    name: 'Finnair',
    hub: 'HEL',
    profile: 'regional-premium',
    reputation: 78,
    dailyIncome: 180000,
    fleetSize: 75,
    color: '#003580',
    alliance: 'oneworld',
    region: 'Europa'
  },
  {
    id: 'rival_33',
    name: 'Aegean Airlines',
    hub: 'ATH',
    profile: 'regional-premium',
    reputation: 76,
    dailyIncome: 140000,
    fleetSize: 60,
    color: '#003da5',
    alliance: 'star-alliance',
    region: 'Europa'
  },
  {
    id: 'rival_34',
    name: 'GOL Transportes Aéreos',
    hub: 'GIG',
    profile: 'regional-premium',
    reputation: 72,
    dailyIncome: 180000,
    fleetSize: 150,
    color: '#ffc72c',
    alliance: 'independent',
    region: 'Latinoamérica'
  },
  {
    id: 'rival_35',
    name: 'AirAsia X',
    hub: 'KUL',
    profile: 'regional-premium',
    reputation: 70,
    dailyIncome: 160000,
    fleetSize: 65,
    color: '#ff0000',
    alliance: 'independent',
    region: 'Asia Pacífico'
  },

  // ============================================
  // AEROLÍNEAS LOW-COST (Bajo Costo)
  // ============================================
  {
    id: 'rival_36',
    name: 'Ryanair',
    hub: 'DUB',
    profile: 'low-cost',
    reputation: 62,
    dailyIncome: 320000,
    fleetSize: 520,
    color: '#0066cc',
    alliance: 'independent',
    region: 'Europa'
  },
  {
    id: 'rival_37',
    name: 'EasyJet',
    hub: 'LTN',
    profile: 'low-cost',
    reputation: 65,
    dailyIncome: 280000,
    fleetSize: 340,
    color: '#ff8800',
    alliance: 'independent',
    region: 'Europa'
  },
  {
    id: 'rival_38',
    name: 'Wizz Air',
    hub: 'BUD',
    profile: 'low-cost',
    reputation: 63,
    dailyIncome: 240000,
    fleetSize: 380,
    color: '#341e72',
    alliance: 'independent',
    region: 'Europa'
  },
  {
    id: 'rival_39',
    name: 'Southwest Airlines',
    hub: 'DAL',
    profile: 'low-cost',
    reputation: 68,
    dailyIncome: 380000,
    fleetSize: 750,
    color: '#ffb81c',
    alliance: 'independent',
    region: 'Norteamérica'
  },
  {
    id: 'rival_40',
    name: 'Spirit Airlines',
    hub: 'MIA',
    profile: 'low-cost',
    reputation: 58,
    dailyIncome: 200000,
    fleetSize: 160,
    color: '#ffb81c',
    alliance: 'independent',
    region: 'Norteamérica'
  },
  {
    id: 'rival_41',
    name: 'Frontier Airlines',
    hub: 'DEN',
    profile: 'low-cost',
    reputation: 59,
    dailyIncome: 180000,
    fleetSize: 120,
    color: '#50b848',
    alliance: 'independent',
    region: 'Norteamérica'
  },
  {
    id: 'rival_42',
    name: 'AirAsia',
    hub: 'KUL',
    profile: 'low-cost',
    reputation: 64,
    dailyIncome: 260000,
    fleetSize: 280,
    color: '#ff0000',
    alliance: 'independent',
    region: 'Asia Pacífico'
  },
  {
    id: 'rival_43',
    name: 'Lion Air',
    hub: 'CGK',
    profile: 'low-cost',
    reputation: 60,
    dailyIncome: 240000,
    fleetSize: 210,
    color: '#ffd100',
    alliance: 'independent',
    region: 'Asia Pacífico'
  },
  {
    id: 'rival_44',
    name: 'Cebu Pacific',
    hub: 'CEB',
    profile: 'low-cost',
    reputation: 63,
    dailyIncome: 180000,
    fleetSize: 90,
    color: '#003da5',
    alliance: 'independent',
    region: 'Asia Pacífico'
  },
  {
    id: 'rival_45',
    name: 'Vueling',
    hub: 'BCN',
    profile: 'low-cost',
    reputation: 66,
    dailyIncome: 220000,
    fleetSize: 160,
    color: '#ffc400',
    alliance: 'independent',
    region: 'Europa'
  },
  {
    id: 'rival_46',
    name: 'Flydubai',
    hub: 'DXB',
    profile: 'low-cost',
    reputation: 64,
    dailyIncome: 160000,
    fleetSize: 75,
    color: '#003da5',
    alliance: 'independent',
    region: 'Oriente Medio'
  },
  {
    id: 'rival_47',
    name: 'Norwegian Air',
    hub: 'OSL',
    profile: 'low-cost',
    reputation: 61,
    dailyIncome: 140000,
    fleetSize: 90,
    color: '#002f87',
    alliance: 'independent',
    region: 'Europa'
  },
  {
    id: 'rival_48',
    name: 'JetBlue',
    hub: 'JFK',
    profile: 'low-cost',
    reputation: 67,
    dailyIncome: 280000,
    fleetSize: 290,
    color: '#003da5',
    alliance: 'independent',
    region: 'Norteamérica'
  },
  {
    id: 'rival_49',
    name: 'Allegiant Air',
    hub: 'LAS',
    profile: 'low-cost',
    reputation: 57,
    dailyIncome: 140000,
    fleetSize: 120,
    color: '#006bb6',
    alliance: 'independent',
    region: 'Norteamérica'
  }
];

/**
 * Alliance Groups for Strategic Partnerships
 */
export const ALLIANCES = {
  'oneworld': ['Qatar Airways', 'Singapore Airlines', 'Cathay Pacific', 'Japan Airlines', 'British Airways', 'Iberia', 'Fiji Airways', 'Alaska Airlines', 'Finnair', 'LATAM Airlines', 'Qantas Airways'],
  'star-alliance': ['ANA All Nippon Airways', 'EVA Air', 'Swiss International Air Lines', 'Korean Air', 'Vistara', 'Turkish Airlines', 'Air Canada', 'Lufthansa', 'Air New Zealand', 'Aegean Airlines', 'Ethiopian Airlines'],
  'skyteam': ['Korean Air', 'Air France', 'KLM Royal Dutch Airlines', 'Delta Air Lines', 'Saudi Arabian Airlines', 'Aeromexico'],
  'independent': ['Emirates', 'Etihad Airways', 'Hainan Airlines', 'Virgin Atlantic', 'Azul Brazilian Airlines', 'Bangkok Airways', 'AirAsia X', 'Ryanair', 'EasyJet', 'Wizz Air', 'Southwest Airlines', 'Spirit Airlines', 'Frontier Airlines', 'AirAsia', 'Lion Air', 'Cebu Pacific', 'Vueling', 'Flydubai', 'Norwegian Air', 'JetBlue', 'Allegiant Air', 'GOL Transportes Aéreos']
};

/**
 * Region Groups
 */
export const REGIONS = {
  'Asia Pacífico': ['Singapore Airlines', 'ANA All Nippon Airways', 'Cathay Pacific', 'Japan Airlines', 'EVA Air', 'Korean Air', 'Vistara', 'Hainan Airlines', 'Qantas Airways', 'Air New Zealand', 'Fiji Airways', 'Bangkok Airways', 'AirAsia X', 'AirAsia', 'Lion Air', 'Cebu Pacific'],
  'Europa': ['Swiss International Air Lines', 'Iberia', 'KLM Royal Dutch Airlines', 'British Airways', 'Air France', 'Lufthansa', 'Virgin Atlantic', 'Finnair', 'Aegean Airlines', 'Ryanair', 'EasyJet', 'Wizz Air', 'Vueling', 'Norwegian Air'],
  'Norteamérica': ['Delta Air Lines', 'Air Canada', 'Alaska Airlines', 'Southwest Airlines', 'Spirit Airlines', 'Frontier Airlines', 'JetBlue', 'Allegiant Air'],
  'Latinoamérica': ['LATAM Airlines', 'Aeromexico', 'GOL Transportes Aéreos', 'Azul Brazilian Airlines'],
  'Oriente Medio': ['Qatar Airways', 'Emirates', 'Etihad Airways', 'Turkish Airlines', 'Saudi Arabian Airlines', 'Flydubai'],
  'África': ['Ethiopian Airlines']
};

/**
 * Profile Characteristics for Gameplay
 * Affects competition style and pricing strategy
 */
export const PROFILE_TRAITS = {
  'premium': {
    priceMultiplier: 1.3,       // 30% higher prices
    qualityBonus: 0.95,         // High reputation helps occupancy
    competitiveAggressiveness: 0.4,
    description: 'Lujo y servicio premium'
  },
  'full-service': {
    priceMultiplier: 1.0,       // Normal prices
    qualityBonus: 0.8,          // Balanced
    competitiveAggressiveness: 0.6,
    description: 'Red global completa'
  },
  'regional-premium': {
    priceMultiplier: 0.95,      // Slightly below average
    qualityBonus: 0.85,         // Good quality
    competitiveAggressiveness: 0.5,
    description: 'Especialistas regionales'
  },
  'low-cost': {
    priceMultiplier: 0.65,      // 35% lower prices
    qualityBonus: 0.6,          // Lower reputation helps less
    competitiveAggressiveness: 0.8,
    description: 'Bajo costo - alta competencia'
  }
};
