/**
 * Datos de Aeropuertos - 250+ Aeropuertos Mundiales
 * Categorizados por nivel: mega-hub, major-hub, secondary-hub, regional-hub, small-airport
 * Desbloqueados progresivamente por nivel del jugador
 */

export const AIRPORTS = {
    // ============================================
    // ESPAÑA - LEVEL 1+ (17 aeropuertos)
    // ============================================
    
    MAD: { id: 'MAD', name: 'Madrid Barajas', city: 'Madrid', country: 'ES', region: 'Europa', category: 'mega-hub', lat: 40.4719, lon: -3.5626, pop: 6.6, runway: 4100, annualPax: 62000000, airline: 'Iberia, Air Europa, Ryanair', minLevel: 1 },
    BCN: { id: 'BCN', name: 'Barcelona-El Prat', city: 'Barcelona', country: 'ES', region: 'Europa', category: 'major-hub', lat: 41.2974, lon: 2.0833, pop: 5.6, runway: 3900, annualPax: 34000000, airline: 'Vueling, Ryanair, easyJet', minLevel: 1 },
    AGP: { id: 'AGP', name: 'Málaga-Costa del Sol', city: 'Málaga', country: 'ES', region: 'Europa', category: 'major-hub', lat: 36.6749, lon: -3.7581, pop: 0.6, runway: 3500, annualPax: 19500000, airline: 'Vueling, Ryanair, easyJet', minLevel: 1 },
    SVQ: { id: 'SVQ', name: 'Sevilla Airport', city: 'Sevilla', country: 'ES', region: 'Europa', category: 'secondary-hub', lat: 37.4169, lon: -5.8929, pop: 1.5, runway: 3200, annualPax: 7100000, airline: 'Vueling, Iberia Regional, Ryanair', minLevel: 2 },
    PMI: { id: 'PMI', name: 'Palma de Mallorca', city: 'Palma', country: 'ES', region: 'Europa', category: 'regional-hub', lat: 39.5518, lon: 2.7412, pop: 0.4, runway: 3200, annualPax: 10100000, airline: 'Vueling, Iberia, easyJet', minLevel: 2 },
    IBZ: { id: 'IBZ', name: 'Ibiza Airport', city: 'Ibiza', country: 'ES', region: 'Europa', category: 'regional-hub', lat: 38.8729, lon: 1.3731, pop: 0.6, runway: 3200, annualPax: 5200000, airline: 'Vueling, easyJet, Ryanair', minLevel: 2 },
    BIO: { id: 'BIO', name: 'Bilbao', city: 'Bilbao', country: 'ES', region: 'Europa', category: 'secondary-hub', lat: 43.3007, lon: -2.9111, pop: 0.3, runway: 3200, annualPax: 5300000, airline: 'Vueling, Iberia, Ryanair', minLevel: 2 },
    VLC: { id: 'VLC', name: 'Valencia Airport', city: 'Valencia', country: 'ES', region: 'Europa', category: 'secondary-hub', lat: 39.4891, lon: -0.4817, pop: 1.6, runway: 3500, annualPax: 6900000, airline: 'Vueling, Ryanair, easyJet', minLevel: 2 },
    TFS: { id: 'TFS', name: 'Tenerife Sur', city: 'Tenerife', country: 'ES', region: 'Europa', category: 'regional-hub', lat: 28.0469, lon: -16.3730, pop: 0.4, runway: 3100, annualPax: 9400000, airline: 'Vueling, Ryanair, TUI', minLevel: 2 },
    TFN: { id: 'TFN', name: 'Tenerife Norte', city: 'Tenerife', country: 'ES', region: 'Europa', category: 'secondary-hub', lat: 28.3631, lon: -16.3181, pop: 0.4, runway: 3200, annualPax: 4500000, airline: 'Iberia, Ryanair', minLevel: 3 },
    LPA: { id: 'LPA', name: 'Gran Canaria', city: 'Las Palmas', country: 'ES', region: 'Europa', category: 'regional-hub', lat: 27.9319, lon: -15.3868, pop: 0.4, runway: 3400, annualPax: 6600000, airline: 'Vueling, Ryanair, Iberia', minLevel: 3 },
    JEZ: { id: 'JEZ', name: 'Jerez de la Frontera', city: 'Jerez', country: 'ES', region: 'Europa', category: 'secondary-hub', lat: 36.7481, lon: -6.0606, pop: 0.2, runway: 3200, annualPax: 2800000, airline: 'Iberia, Vueling, Ryanair', minLevel: 3 },
    OVD: { id: 'OVD', name: 'Asturias Airport', city: 'Asturias', country: 'ES', region: 'Europa', category: 'secondary-hub', lat: 43.5563, lon: -6.0551, pop: 0.5, runway: 3000, annualPax: 2200000, airline: 'Vueling, Iberia Regional', minLevel: 3 },
    REU: { id: 'REU', name: 'Reus Airport', city: 'Reus', country: 'ES', region: 'Europa', category: 'secondary-hub', lat: 43.1820, lon: 1.1617, pop: 0.3, runway: 3200, annualPax: 1800000, airline: 'Ryanair, easyJet', minLevel: 3 },
    BJS: { id: 'BJS', name: 'Barcelona-Sabadell', city: 'Barcelona', country: 'ES', region: 'Europa', category: 'small-airport', lat: 41.5087, lon: 2.1041, pop: 5.6, runway: 2300, annualPax: 2100000, airline: 'Private/Training', minLevel: 4 },
    BZA: { id: 'BZA', name: 'Badajoz Airport', city: 'Badajoz', country: 'ES', region: 'Europa', category: 'small-airport', lat: 38.8895, lon: -6.8235, pop: 0.2, runway: 2600, annualPax: 350000, airline: 'Limited operations', minLevel: 4 },
    XCN: { id: 'XCN', name: 'Ceuta Heliport', city: 'Ceuta', country: 'ES', region: 'Europa', category: 'small-airport', lat: 35.8697, lon: -5.3065, pop: 0.08, runway: 1200, annualPax: 450000, airline: 'Binter, Helicópteros Mediterráneo', minLevel: 5 },
    MLN: { id: 'MLN', name: 'Melilla Airport', city: 'Melilla', country: 'ES', region: 'Europa', category: 'small-airport', lat: 35.2814, lon: -2.9453, pop: 0.08, runway: 1800, annualPax: 400000, airline: 'Binter, Iberia Regional', minLevel: 5 },

    // ============================================
    // REINO UNIDO E IRLANDA - LEVEL 1+ (14 aeropuertos)
    // ============================================
    
    LHR: { id: 'LHR', name: 'London Heathrow', city: 'London', country: 'UK', region: 'Europa', category: 'mega-hub', lat: 51.4700, lon: -0.4543, pop: 9.0, runway: 3900, annualPax: 80600000, airline: 'British Airways, Virgin Atlantic, Iberia', minLevel: 1 },
    LGW: { id: 'LGW', name: 'London Gatwick', city: 'London', country: 'UK', region: 'Europa', category: 'major-hub', lat: 51.1537, lon: -0.1821, pop: 9.0, runway: 3316, annualPax: 46200000, airline: 'Virgin Atlantic, easyJet, Ryanair', minLevel: 1 },
    STN: { id: 'STN', name: 'London Stansted', city: 'London', country: 'UK', region: 'Europa', category: 'secondary-hub', lat: 51.8947, lon: 0.2350, pop: 9.0, runway: 3660, annualPax: 27600000, airline: 'easyJet, Ryanair', minLevel: 2 },
    LCY: { id: 'LCY', name: 'London City', city: 'London', country: 'UK', region: 'Europa', category: 'secondary-hub', lat: 51.5051, lon: -0.0549, pop: 9.0, runway: 1508, annualPax: 3800000, airline: 'Executive flights', minLevel: 3 },
    LTN: { id: 'LTN', name: 'London Luton', city: 'Luton', country: 'UK', region: 'Europa', category: 'secondary-hub', lat: 51.8742, lon: -0.3680, pop: 9.0, runway: 3000, annualPax: 18900000, airline: 'easyJet, Ryanair', minLevel: 2 },
    MAN: { id: 'MAN', name: 'Manchester', city: 'Manchester', country: 'UK', region: 'Europa', category: 'secondary-hub', lat: 53.3638, lon: -2.2705, pop: 2.3, runway: 3050, annualPax: 25200000, airline: 'Ryanair, easyJet, Jet2', minLevel: 2 },
    BHX: { id: 'BHX', name: 'Birmingham', city: 'Birmingham', country: 'UK', region: 'Europa', category: 'secondary-hub', lat: 52.4539, lon: -1.7483, pop: 1.1, runway: 2737, annualPax: 12600000, airline: 'Ryanair, easyJet', minLevel: 2 },
    EDI: { id: 'EDI', name: 'Edinburgh', city: 'Edinburgh', country: 'UK', region: 'Europa', category: 'secondary-hub', lat: 55.9500, lon: -3.3736, pop: 0.5, runway: 3073, annualPax: 10200000, airline: 'Ryanair, easyJet', minLevel: 2 },
    GLA: { id: 'GLA', name: 'Glasgow', city: 'Glasgow', country: 'UK', region: 'Europa', category: 'secondary-hub', lat: 55.8642, lon: -4.4330, pop: 1.2, runway: 3003, annualPax: 9200000, airline: 'Ryanair, easyJet', minLevel: 2 },
    LPL: { id: 'LPL', name: 'Liverpool', city: 'Liverpool', country: 'UK', region: 'Europa', category: 'secondary-hub', lat: 53.3537, lon: -2.8497, pop: 0.5, runway: 2400, annualPax: 5500000, airline: 'Ryanair, easyJet', minLevel: 3 },
    DUB: { id: 'DUB', name: 'Dublin', city: 'Dublin', country: 'IE', region: 'Europa', category: 'major-hub', lat: 53.4264, lon: -6.2499, pop: 1.2, runway: 3900, annualPax: 32900000, airline: 'Ryanair, Aer Lingus, easyJet', minLevel: 1 },
    CRK: { id: 'CRK', name: 'Cork Airport', city: 'Cork', country: 'IE', region: 'Europa', category: 'secondary-hub', lat: 51.8414, lon: -8.4864, pop: 0.3, runway: 2453, annualPax: 2200000, airline: 'Ryanair, easyJet', minLevel: 3 },
    SNN: { id: 'SNN', name: 'Shannon Airport', city: 'Shannon', country: 'IE', region: 'Europa', category: 'secondary-hub', lat: 52.7023, lon: -8.9244, pop: 0.1, runway: 3200, annualPax: 3400000, airline: 'Ryanair, easyJet', minLevel: 3 },

    // ============================================
    // FRANCIA - LEVEL 1+ (9 aeropuertos)
    // ============================================
    
    CDG: { id: 'CDG', name: 'Paris Charles de Gaulle', city: 'Paris', country: 'FR', region: 'Europa', category: 'mega-hub', lat: 49.0097, lon: 2.5479, pop: 12.2, runway: 4200, annualPax: 76700000, airline: 'Air France, United, Lufthansa', minLevel: 1 },
    ORY: { id: 'ORY', name: 'Paris Orly', city: 'Paris', country: 'FR', region: 'Europa', category: 'major-hub', lat: 48.7225, lon: 2.3592, pop: 12.2, runway: 3850, annualPax: 36200000, airline: 'Air France, easyJet', minLevel: 1 },
    LYS: { id: 'LYS', name: 'Lyon Airport', city: 'Lyon', country: 'FR', region: 'Europa', category: 'secondary-hub', lat: 45.7262, lon: 5.0905, pop: 1.7, runway: 3600, annualPax: 9000000, airline: 'Air France, easyJet, Ryanair', minLevel: 2 },
    NCE: { id: 'NCE', name: 'Nice Côte d\'Azur', city: 'Nice', country: 'FR', region: 'Europa', category: 'secondary-hub', lat: 43.6584, lon: 7.2159, pop: 1.0, runway: 2600, annualPax: 13200000, airline: 'Air France, easyJet, Ryanair', minLevel: 2 },
    TLS: { id: 'TLS', name: 'Toulouse Airport', city: 'Toulouse', country: 'FR', region: 'Europa', category: 'secondary-hub', lat: 43.6288, lon: 1.3636, pop: 0.5, runway: 3800, annualPax: 8700000, airline: 'Air France, easyJet, Ryanair', minLevel: 2 },
    MRS: { id: 'MRS', name: 'Marseille Airport', city: 'Marseille', country: 'FR', region: 'Europa', category: 'secondary-hub', lat: 43.4391, lon: 5.2147, pop: 0.9, runway: 3200, annualPax: 8500000, airline: 'Air France, easyJet, Ryanair', minLevel: 2 },
    BVA: { id: 'BVA', name: 'Paris Beauvais', city: 'Beauvais', country: 'FR', region: 'Europa', category: 'secondary-hub', lat: 49.4544, lon: 2.1075, pop: 12.2, runway: 2700, annualPax: 5600000, airline: 'Ryanair', minLevel: 3 },
    NTE: { id: 'NTE', name: 'Nantes Airport', city: 'Nantes', country: 'FR', region: 'Europa', category: 'secondary-hub', lat: 47.1585, lon: -1.6001, pop: 0.3, runway: 3000, annualPax: 6200000, airline: 'Air France, easyJet, Ryanair', minLevel: 3 },
    BOD: { id: 'BOD', name: 'Bordeaux Airport', city: 'Bordeaux', country: 'FR', region: 'Europa', category: 'secondary-hub', lat: 44.8281, lon: -0.6155, pop: 0.3, runway: 3000, annualPax: 5300000, airline: 'Air France, easyJet, Ryanair', minLevel: 3 },

    // ============================================
    // ALEMANIA - LEVEL 1+ (7 aeropuertos)
    // ============================================
    
    FRA: { id: 'FRA', name: 'Frankfurt am Main', city: 'Frankfurt', country: 'DE', region: 'Europa', category: 'mega-hub', lat: 50.0379, lon: 8.5622, pop: 5.8, runway: 4000, annualPax: 69200000, airline: 'Lufthansa, United, Ryanair', minLevel: 1 },
    MUC: { id: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'DE', region: 'Europa', category: 'major-hub', lat: 48.3538, lon: 11.7861, pop: 1.5, runway: 4000, annualPax: 46200000, airline: 'Lufthansa, easyJet', minLevel: 1 },
    BER: { id: 'BER', name: 'Berlin Brandenburg', city: 'Berlin', country: 'DE', region: 'Europa', category: 'major-hub', lat: 52.3667, lon: 13.5033, pop: 3.8, runway: 3600, annualPax: 36700000, airline: 'Lufthansa, easyJet, Ryanair', minLevel: 1 },
    DUS: { id: 'DUS', name: 'Düsseldorf', city: 'Düsseldorf', country: 'DE', region: 'Europa', category: 'secondary-hub', lat: 51.2895, lon: 6.7669, pop: 0.6, runway: 3000, annualPax: 24900000, airline: 'Lufthansa, easyJet, Ryanair', minLevel: 2 },
    HAM: { id: 'HAM', name: 'Hamburg Airport', city: 'Hamburg', country: 'DE', region: 'Europa', category: 'secondary-hub', lat: 53.6304, lon: 9.9880, pop: 1.9, runway: 3000, annualPax: 17600000, airline: 'Lufthansa, easyJet, Ryanair', minLevel: 2 },
    CGN: { id: 'CGN', name: 'Cologne/Bonn', city: 'Cologne', country: 'DE', region: 'Europa', category: 'secondary-hub', lat: 50.8659, lon: 6.9997, pop: 1.1, runway: 3201, annualPax: 12400000, airline: 'Lufthansa, Ryanair, easyJet', minLevel: 2 },
    STR: { id: 'STR', name: 'Stuttgart Airport', city: 'Stuttgart', country: 'DE', region: 'Europa', category: 'secondary-hub', lat: 48.6895, lon: 9.2212, pop: 0.6, runway: 3345, annualPax: 11800000, airline: 'Lufthansa, Ryanair', minLevel: 2 },

    // ============================================
    // BÉLGICA Y PAÍSES BAJOS - LEVEL 1+ (5 aeropuertos)
    // ============================================
    
    AMS: { id: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'NL', region: 'Europa', category: 'major-hub', lat: 52.3105, lon: 4.7683, pop: 2.4, runway: 3800, annualPax: 71600000, airline: 'KLM, Delta, United', minLevel: 1 },
    BRU: { id: 'BRU', name: 'Brussels Airport', city: 'Brussels', country: 'BE', region: 'Europa', category: 'major-hub', lat: 50.9010, lon: 4.4844, pop: 1.2, runway: 3650, annualPax: 28000000, airline: 'Brussels Airlines, Ryanair, easyJet', minLevel: 1 },
    CRL: { id: 'CRL', name: 'Brussels South Charleroi', city: 'Charleroi', country: 'BE', region: 'Europa', category: 'secondary-hub', lat: 50.4516, lon: 4.2051, pop: 1.2, runway: 3200, annualPax: 8200000, airline: 'Ryanair', minLevel: 2 },
    ROT: { id: 'ROT', name: 'Rotterdam Airport', city: 'Rotterdam', country: 'NL', region: 'Europa', category: 'secondary-hub', lat: 51.8546, lon: 4.4485, pop: 0.6, runway: 2000, annualPax: 2700000, airline: 'Mostly cargo', minLevel: 3 },
    EIN: { id: 'EIN', name: 'Eindhoven Airport', city: 'Eindhoven', country: 'NL', region: 'Europa', category: 'secondary-hub', lat: 51.4503, lon: 5.3747, pop: 0.2, runway: 2580, annualPax: 11600000, airline: 'easyJet, Ryanair', minLevel: 2 },

    // ============================================
    // EUROPA CENTRAL Y ORIENTAL - LEVEL 2+ (7 aeropuertos)
    // ============================================
    
    BUD: { id: 'BUD', name: 'Budapest Ferenc Liszt', city: 'Budapest', country: 'HU', region: 'Europa', category: 'major-hub', lat: 47.4261, lon: 19.2611, pop: 1.8, runway: 3500, annualPax: 14900000, airline: 'Wizz Air, Ryanair, Lufthansa', minLevel: 2 },
    VIE: { id: 'VIE', name: 'Vienna International', city: 'Vienna', country: 'AT', region: 'Europa', category: 'major-hub', lat: 48.1103, lon: 16.5697, pop: 1.9, runway: 4000, annualPax: 32400000, airline: 'Austrian Airlines, Ryanair', minLevel: 2 },
    PRG: { id: 'PRG', name: 'Prague Václav Havel', city: 'Prague', country: 'CZ', region: 'Europa', category: 'major-hub', lat: 50.1008, lon: 14.2646, pop: 1.3, runway: 3711, annualPax: 14200000, airline: 'easyJet, Ryanair, Lufthansa', minLevel: 2 },
    WAW: { id: 'WAW', name: 'Warsaw Chopin', city: 'Warsaw', country: 'PL', region: 'Europa', category: 'major-hub', lat: 52.1656, lon: 21.0214, pop: 1.9, runway: 3650, annualPax: 19300000, airline: 'LOT, Ryanair, Lufthansa', minLevel: 2 },
    KRK: { id: 'KRK', name: 'Kraków John Paul II', city: 'Kraków', country: 'PL', region: 'Europa', category: 'secondary-hub', lat: 50.0797, lon: 19.7898, pop: 0.8, runway: 2800, annualPax: 8400000, airline: 'Ryanair, LOT, Lufthansa', minLevel: 3 },
    BEG: { id: 'BEG', name: 'Belgrade Airport', city: 'Belgrade', country: 'RS', region: 'Europa', category: 'secondary-hub', lat: 44.8184, lon: 20.2768, pop: 1.7, runway: 2500, annualPax: 4200000, airline: 'Air Serbia, Ryanair', minLevel: 3 },
    ZAG: { id: 'ZAG', name: 'Zagreb Airport', city: 'Zagreb', country: 'HR', region: 'Europa', category: 'secondary-hub', lat: 45.7295, lon: 16.0689, pop: 0.8, runway: 3300, annualPax: 3400000, airline: 'Croatia Airlines, Ryanair', minLevel: 3 },

    // ============================================
    // EUROPA NÓRDICA - LEVEL 2+ (5 aeropuertos)
    // ============================================
    
    OSL: { id: 'OSL', name: 'Oslo Gardermoen', city: 'Oslo', country: 'NO', region: 'Europa', category: 'secondary-hub', lat: 60.2050, lon: 11.1093, pop: 0.7, runway: 3600, annualPax: 12000000, airline: 'SAS, Norwegian, Ryanair', minLevel: 2 },
    ARN: { id: 'ARN', name: 'Stockholm Arlanda', city: 'Stockholm', country: 'SE', region: 'Europa', category: 'secondary-hub', lat: 59.6519, lon: 17.9245, pop: 1.0, runway: 3500, annualPax: 10300000, airline: 'SAS, Ryanair', minLevel: 2 },
    CPH: { id: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'DK', region: 'Europa', category: 'major-hub', lat: 55.6181, lon: 12.6561, pop: 1.4, runway: 3600, annualPax: 29300000, airline: 'SAS, Ryanair, easyJet', minLevel: 2 },
    HEL: { id: 'HEL', name: 'Helsinki Vantaa', city: 'Helsinki', country: 'FI', region: 'Europa', category: 'secondary-hub', lat: 60.3172, lon: 24.9633, pop: 0.6, runway: 3900, annualPax: 8900000, airline: 'Finnair, Ryanair', minLevel: 3 },
    TRD: { id: 'TRD', name: 'Trondheim Airport', city: 'Trondheim', country: 'NO', region: 'Europa', category: 'secondary-hub', lat: 63.4575, lon: 10.9254, pop: 0.2, runway: 3000, annualPax: 3600000, airline: 'SAS, Norwegian', minLevel: 3 },

    // ============================================
    // ITALIA Y MEDITERRÁNEO - LEVEL 2+ (8 aeropuertos)
    // ============================================
    
    FCO: { id: 'FCO', name: 'Rome Fiumicino', city: 'Rome', country: 'IT', region: 'Europa', category: 'major-hub', lat: 41.8002, lon: 12.2388, pop: 4.3, runway: 3900, annualPax: 43400000, airline: 'Alitalia, easyJet, Ryanair', minLevel: 1 },
    MXP: { id: 'MXP', name: 'Milan Malpensa', city: 'Milan', country: 'IT', region: 'Europa', category: 'major-hub', lat: 45.6306, lon: 8.7281, pop: 1.4, runway: 4000, annualPax: 28200000, airline: 'Lufthansa, easyJet, Ryanair', minLevel: 1 },
    BGY: { id: 'BGY', name: 'Milan Orio al Serio', city: 'Bergamo', country: 'IT', region: 'Europa', category: 'secondary-hub', lat: 45.6729, lon: 9.7015, pop: 1.4, runway: 3000, annualPax: 13200000, airline: 'Ryanair, easyJet', minLevel: 2 },
    VCE: { id: 'VCE', name: 'Venice Marco Polo', city: 'Venice', country: 'IT', region: 'Europa', category: 'secondary-hub', lat: 45.5052, lon: 12.3519, pop: 0.3, runway: 3150, annualPax: 8000000, airline: 'easyJet, Ryanair', minLevel: 2 },
    NAP: { id: 'NAP', name: 'Naples Airport', city: 'Naples', country: 'IT', region: 'Europa', category: 'secondary-hub', lat: 40.8861, lon: 14.2881, pop: 0.9, runway: 2598, annualPax: 7600000, airline: 'easyJet, Ryanair', minLevel: 2 },
    ATH: { id: 'ATH', name: 'Athens Eleftherios Venizelos', city: 'Athens', country: 'GR', region: 'Europa', category: 'major-hub', lat: 37.9364, lon: 23.9445, pop: 3.1, runway: 3800, annualPax: 16200000, airline: 'Aegean, easyJet, Ryanair', minLevel: 2 },
    RHO: { id: 'RHO', name: 'Rhodes Airport', city: 'Rhodes', country: 'GR', region: 'Europa', category: 'secondary-hub', lat: 36.4044, lon: 28.0261, pop: 0.1, runway: 2999, annualPax: 3200000, airline: 'Ryanair', minLevel: 3 },
    ZRH: { id: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'CH', region: 'Europa', category: 'major-hub', lat: 47.4582, lon: 8.5597, pop: 1.3, runway: 3800, annualPax: 31100000, airline: 'Swiss, Lufthansa', minLevel: 2 },
    GVA: { id: 'GVA', name: 'Geneva Airport', city: 'Geneva', country: 'CH', region: 'Europa', category: 'secondary-hub', lat: 46.2381, lon: 6.1093, pop: 0.5, runway: 3900, annualPax: 17800000, airline: 'easyJet, Ryanair', minLevel: 2 },
    BSL: { id: 'BSL', name: 'Basel Mulhouse', city: 'Basel', country: 'CH', region: 'Europa', category: 'secondary-hub', lat: 47.5896, lon: 7.5296, pop: 0.2, runway: 3660, annualPax: 7200000, airline: 'easyJet, Ryanair', minLevel: 3 },

    // ============================================
    // ORIENTE MEDIO - LEVEL 3+ (8 aeropuertos)
    // ============================================
    
    DXB: { id: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'AE', region: 'Oriente Medio', category: 'mega-hub', lat: 25.2532, lon: 55.3657, pop: 3.3, runway: 4000, annualPax: 86400000, airline: 'Emirates, FlyDubai', minLevel: 3 },
    DOH: { id: 'DOH', name: 'Doha Hamad International', city: 'Doha', country: 'QA', region: 'Oriente Medio', category: 'mega-hub', lat: 25.2731, lon: 51.6092, pop: 1.2, runway: 5000, annualPax: 37900000, airline: 'Qatar Airways', minLevel: 3 },
    AUH: { id: 'AUH', name: 'Abu Dhabi International', city: 'Abu Dhabi', country: 'AE', region: 'Oriente Medio', category: 'major-hub', lat: 24.4269, lon: 54.6509, pop: 1.5, runway: 4000, annualPax: 32300000, airline: 'Etihad Airways', minLevel: 3 },
    JED: { id: 'JED', name: 'Jeddah King Abdulaziz', city: 'Jeddah', country: 'SA', region: 'Oriente Medio', category: 'major-hub', lat: 21.5433, lon: 39.1568, pop: 4.1, runway: 4200, annualPax: 30600000, airline: 'Saudi Arabian', minLevel: 3 },
    RUH: { id: 'RUH', name: 'Riyadh King Fahd', city: 'Riyadh', country: 'SA', region: 'Oriente Medio', category: 'major-hub', lat: 24.9578, lon: 46.6980, pop: 6.9, runway: 4000, annualPax: 20100000, airline: 'Saudi Arabian, Ryanair', minLevel: 3 },
    IST: { id: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'TR', region: 'Oriente Medio', category: 'major-hub', lat: 41.2619, lon: 28.7290, pop: 15.5, runway: 4200, annualPax: 64700000, airline: 'Turkish Airlines', minLevel: 3 },
    ISL: { id: 'ISL', name: 'Istanbul Sabiha Gökçen', city: 'Istanbul', country: 'TR', region: 'Oriente Medio', category: 'secondary-hub', lat: 40.8955, lon: 29.4356, pop: 15.5, runway: 3000, annualPax: 32200000, airline: 'Ryanair', minLevel: 4 },
    DWC: { id: 'DWC', name: 'Dubai World Central', city: 'Dubai', country: 'AE', region: 'Oriente Medio', category: 'secondary-hub', lat: 24.8866, lon: 55.1636, pop: 3.3, runway: 4000, annualPax: 9000000, airline: 'Cargo operations', minLevel: 4 },
    AMM: { id: 'AMM', name: 'Amman Queen Alia', city: 'Amman', country: 'JO', region: 'Oriente Medio', category: 'secondary-hub', lat: 31.9454, lon: 35.9284, pop: 4.0, runway: 3500, annualPax: 9700000, airline: 'Royal Jordanian', minLevel: 4 },

    // ============================================
    // NORTEAMÉRICA - LEVEL 1+ (23 aeropuertos)
    // ============================================
    
    ATL: { id: 'ATL', name: 'Atlanta Hartsfield-Jackson', city: 'Atlanta', country: 'US', region: 'Norteamérica', category: 'mega-hub', lat: 33.6407, lon: -84.4277, pop: 6.1, runway: 3900, annualPax: 110700000, airline: 'Delta, Southwest', minLevel: 1 },
    JFK: { id: 'JFK', name: 'New York John F. Kennedy', city: 'New York', country: 'US', region: 'Norteamérica', category: 'mega-hub', lat: 40.6413, lon: -73.7781, pop: 18.8, runway: 4400, annualPax: 62800000, airline: 'JetBlue, Delta, American', minLevel: 1 },
    LAX: { id: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'US', region: 'Norteamérica', category: 'mega-hub', lat: 33.9416, lon: -118.4085, pop: 12.4, runway: 3900, annualPax: 87900000, airline: 'American, Southwest, Delta', minLevel: 1 },
    ORD: { id: 'ORD', name: 'Chicago O\'Hare', city: 'Chicago', country: 'US', region: 'Norteamérica', category: 'mega-hub', lat: 41.9742, lon: -87.9073, pop: 8.8, runway: 3900, annualPax: 84600000, airline: 'United, American', minLevel: 1 },
    DFW: { id: 'DFW', name: 'Dallas Fort Worth', city: 'Dallas', country: 'US', region: 'Norteamérica', category: 'mega-hub', lat: 32.8975, lon: -97.0382, pop: 7.6, runway: 4000, annualPax: 73900000, airline: 'American Airlines', minLevel: 1 },
    DEN: { id: 'DEN', name: 'Denver International', city: 'Denver', country: 'US', region: 'Norteamérica', category: 'major-hub', lat: 39.8516, lon: -104.6742, pop: 3.1, runway: 3900, annualPax: 61400000, airline: 'United, Southwest', minLevel: 1 },
    SFO: { id: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'US', region: 'Norteamérica', category: 'major-hub', lat: 37.6213, lon: -122.3790, pop: 4.6, runway: 2737, annualPax: 58700000, airline: 'United, American', minLevel: 1 },
    IAD: { id: 'IAD', name: 'Washington Dulles', city: 'Washington', country: 'US', region: 'Norteamérica', category: 'major-hub', lat: 38.8951, lon: -77.0369, pop: 7.1, runway: 3800, annualPax: 25900000, airline: 'United, American', minLevel: 2 },
    MIA: { id: 'MIA', name: 'Miami International', city: 'Miami', country: 'US', region: 'Norteamérica', category: 'major-hub', lat: 25.7959, lon: -80.2870, pop: 6.3, runway: 3800, annualPax: 45600000, airline: 'American, Spirit', minLevel: 2 },
    PHX: { id: 'PHX', name: 'Phoenix Sky Harbor', city: 'Phoenix', country: 'US', region: 'Norteamérica', category: 'major-hub', lat: 33.4484, lon: -112.0740, pop: 1.7, runway: 3661, annualPax: 50100000, airline: 'Southwest, United', minLevel: 2 },
    LAS: { id: 'LAS', name: 'Las Vegas Harry Reid', city: 'Las Vegas', country: 'US', region: 'Norteamérica', category: 'secondary-hub', lat: 36.0840, lon: -115.1537, pop: 2.8, runway: 3900, annualPax: 51600000, airline: 'Southwest, United, Delta', minLevel: 2 },
    BOS: { id: 'BOS', name: 'Boston Logan', city: 'Boston', country: 'US', region: 'Norteamérica', category: 'secondary-hub', lat: 42.3656, lon: -71.0096, pop: 4.9, runway: 3500, annualPax: 26800000, airline: 'JetBlue, United', minLevel: 2 },
    SEA: { id: 'SEA', name: 'Seattle Tacoma', city: 'Seattle', country: 'US', region: 'Norteamérica', category: 'major-hub', lat: 47.4502, lon: -122.3088, pop: 4.0, runway: 3000, annualPax: 50500000, airline: 'Alaska, United', minLevel: 2 },
    DAL: { id: 'DAL', name: 'Dallas Love Field', city: 'Dallas', country: 'US', region: 'Norteamérica', category: 'secondary-hub', lat: 32.8472, lon: -96.8353, pop: 7.6, runway: 2722, annualPax: 20700000, airline: 'Southwest, United', minLevel: 2 },
    YYZ: { id: 'YYZ', name: 'Toronto Pearson', city: 'Toronto', country: 'CA', region: 'Norteamérica', category: 'major-hub', lat: 43.6777, lon: -79.6248, pop: 6.2, runway: 3300, annualPax: 43200000, airline: 'Air Canada', minLevel: 1 },
    YVR: { id: 'YVR', name: 'Vancouver International', city: 'Vancouver', country: 'CA', region: 'Norteamérica', category: 'secondary-hub', lat: 49.1900, lon: -123.1794, pop: 2.6, runway: 3300, annualPax: 23400000, airline: 'Air Canada, United', minLevel: 2 },
    YUL: { id: 'YUL', name: 'Montreal Pierre Elliott Trudeau', city: 'Montreal', country: 'CA', region: 'Norteamérica', category: 'secondary-hub', lat: 45.4655, lon: -73.7486, pop: 4.3, runway: 3826, annualPax: 17000000, airline: 'Air Canada, easyJet', minLevel: 2 },
    MEX: { id: 'MEX', name: 'Mexico City International', city: 'Mexico City', country: 'MX', region: 'Latinoamérica', category: 'major-hub', lat: 19.4361, lon: -99.0719, pop: 21.0, runway: 3900, annualPax: 45600000, airline: 'Aeromexico, Ryanair', minLevel: 2 },
    CUN: { id: 'CUN', name: 'Cancún International', city: 'Cancún', country: 'MX', region: 'Latinoamérica', category: 'secondary-hub', lat: 21.0087, lon: -86.8767, pop: 0.9, runway: 3800, annualPax: 19300000, airline: 'Aeromexico, Ryanair', minLevel: 3 },

    // ============================================
    // LATINOAMÉRICA - LEVEL 3+ (16 aeropuertos)
    // ============================================
    
    GRU: { id: 'GRU', name: 'São Paulo Guarulhos', city: 'São Paulo', country: 'BR', region: 'Latinoamérica', category: 'mega-hub', lat: -23.4356, lon: -46.4731, pop: 22.0, runway: 3700, annualPax: 36600000, airline: 'LATAM, Azul, Gol', minLevel: 3 },
    GIG: { id: 'GIG', name: 'Rio de Janeiro Galeão', city: 'Rio de Janeiro', country: 'BR', region: 'Latinoamérica', category: 'major-hub', lat: -20.9068, lon: -43.1729, pop: 13.0, runway: 3900, annualPax: 17100000, airline: 'GOL, LATAM', minLevel: 3 },
    SDU: { id: 'SDU', name: 'Rio de Janeiro Santos Dumont', city: 'Rio de Janeiro', country: 'BR', region: 'Latinoamérica', category: 'secondary-hub', lat: -22.9068, lon: -43.1605, pop: 13.0, runway: 1320, annualPax: 8700000, airline: 'Domestic flights', minLevel: 4 },
    EZE: { id: 'EZE', name: 'Buenos Aires Ministro Pistarini', city: 'Buenos Aires', country: 'AR', region: 'Latinoamérica', category: 'major-hub', lat: -34.8150, lon: -58.5348, pop: 15.0, runway: 3300, annualPax: 10200000, airline: 'LATAM, Aerolineas', minLevel: 3 },
    AEP: { id: 'AEP', name: 'Buenos Aires Aeroparque', city: 'Buenos Aires', country: 'AR', region: 'Latinoamérica', category: 'secondary-hub', lat: -34.5586, lon: -58.4154, pop: 15.0, runway: 2128, annualPax: 8400000, airline: 'Aerolineas, LATAM', minLevel: 4 },
    LIM: { id: 'LIM', name: 'Lima Jorge Chávez', city: 'Lima', country: 'PE', region: 'Latinoamérica', category: 'major-hub', lat: -12.0219, lon: -77.1144, pop: 11.0, runway: 3500, annualPax: 17200000, airline: 'LATAM', minLevel: 3 },
    BOG: { id: 'BOG', name: 'Bogotá El Dorado', city: 'Bogotá', country: 'CO', region: 'Latinoamérica', category: 'major-hub', lat: 4.7016, lon: -74.1469, pop: 10.0, runway: 3800, annualPax: 16800000, airline: 'LATAM, Avianca', minLevel: 3 },
    SCL: { id: 'SCL', name: 'Santiago Comodoro Arturo Merino Benítez', city: 'Santiago', country: 'CL', region: 'Latinoamérica', category: 'major-hub', lat: -33.3900, lon: -70.7858, pop: 6.3, runway: 3965, annualPax: 16700000, airline: 'LATAM', minLevel: 3 },
    VCP: { id: 'VCP', name: 'Campinas Viracopos', city: 'Campinas', country: 'BR', region: 'Latinoamérica', category: 'secondary-hub', lat: -23.0068, lon: -47.1431, pop: 1.3, runway: 3900, annualPax: 5800000, airline: 'Azul, LATAM', minLevel: 4 },
    MDE: { id: 'MDE', name: 'Medellín José María Córdova', city: 'Medellín', country: 'CO', region: 'Latinoamérica', category: 'secondary-hub', lat: 6.2244, lon: -75.5922, pop: 2.6, runway: 2800, annualPax: 4100000, airline: 'Avianca', minLevel: 4 },

    // ============================================
    // ASIA PACÍFICO - LEVEL 4+ (25 aeropuertos)
    // ============================================
    
    HND: { id: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', country: 'JP', region: 'Asia Pacífico', category: 'mega-hub', lat: 35.5494, lon: 139.7798, pop: 37.0, runway: 3300, annualPax: 85000000, airline: 'ANA, JAL', minLevel: 4 },
    PVG: { id: 'PVG', name: 'Shanghai Pudong', city: 'Shanghai', country: 'CN', region: 'Asia Pacífico', category: 'mega-hub', lat: 31.1434, lon: 121.8047, pop: 29.0, runway: 3800, annualPax: 76200000, airline: 'China Eastern, China Southern', minLevel: 4 },
    HKG: { id: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'HK', region: 'Asia Pacífico', category: 'mega-hub', lat: 22.3080, lon: 113.9185, pop: 7.5, runway: 3800, annualPax: 71800000, airline: 'Cathay Pacific', minLevel: 4 },
    BJS: { id: 'BJS', name: 'Beijing Capital', city: 'Beijing', country: 'CN', region: 'Asia Pacífico', category: 'major-hub', lat: 40.0801, lon: 116.5847, pop: 21.5, runway: 3800, annualPax: 100000000, airline: 'Air China, China Southern', minLevel: 4 },
    SIN: { id: 'SIN', name: 'Singapore Changi', city: 'Singapore', country: 'SG', region: 'Asia Pacífico', category: 'major-hub', lat: 1.3644, lon: 103.9915, pop: 5.7, runway: 4000, annualPax: 62200000, airline: 'Singapore Airlines', minLevel: 4 },
    ICN: { id: 'ICN', name: 'Seoul Incheon', city: 'Seoul', country: 'KR', region: 'Asia Pacífico', category: 'major-hub', lat: 37.4602, lon: 126.4407, pop: 25.5, runway: 3800, annualPax: 72100000, airline: 'Korean Air, Asiana', minLevel: 4 },
    KUL: { id: 'KUL', name: 'Kuala Lumpur International', city: 'Kuala Lumpur', country: 'MY', region: 'Asia Pacífico', category: 'major-hub', lat: 2.7258, lon: 101.7103, pop: 8.0, runway: 4050, annualPax: 56400000, airline: 'AirAsia, Malaysia Airlines', minLevel: 4 },
    BKK: { id: 'BKK', name: 'Bangkok Suvarnabhumi', city: 'Bangkok', country: 'TH', region: 'Asia Pacífico', category: 'major-hub', lat: 13.6900, lon: 100.7501, pop: 10.0, runway: 4000, annualPax: 47200000, airline: 'Thai Airways, AirAsia', minLevel: 4 },
    CGK: { id: 'CGK', name: 'Jakarta Soekarno-Hatta', city: 'Jakarta', country: 'ID', region: 'Asia Pacífico', category: 'major-hub', lat: -6.1256, lon: 106.6597, pop: 10.6, runway: 3700, annualPax: 27500000, airline: 'Lion Air, Garuda', minLevel: 4 },
    TPE: { id: 'TPE', name: 'Taipei Taoyuan', city: 'Taipei', country: 'TW', region: 'Asia Pacífico', category: 'major-hub', lat: 25.0797, lon: 121.2342, pop: 7.8, runway: 3800, annualPax: 24600000, airline: 'EVA Air, China Airlines', minLevel: 5 },
    DEL: { id: 'DEL', name: 'Delhi Indira Gandhi', city: 'New Delhi', country: 'IN', region: 'Asia Pacífico', category: 'major-hub', lat: 28.5644, lon: 77.0997, pop: 32.0, runway: 4000, annualPax: 41700000, airline: 'IndiGo, Air India', minLevel: 5 },
    BOM: { id: 'BOM', name: 'Mumbai Bombay', city: 'Mumbai', country: 'IN', region: 'Asia Pacífico', category: 'secondary-hub', lat: 19.0897, lon: 72.8656, pop: 20.9, runway: 3977, annualPax: 25900000, airline: 'Air India, IndiGo', minLevel: 5 },
    SYD: { id: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'AU', region: 'Asia Pacífico', category: 'major-hub', lat: -33.9399, lon: 151.1753, pop: 5.3, runway: 3900, annualPax: 44800000, airline: 'Qantas, United, Delta', minLevel: 4 },
    MEL: { id: 'MEL', name: 'Melbourne Tullamarine', city: 'Melbourne', country: 'AU', region: 'Asia Pacífico', category: 'major-hub', lat: -37.6730, lon: 144.8410, pop: 5.2, runway: 3600, annualPax: 36300000, airline: 'Qantas', minLevel: 5 },
    BNE: { id: 'BNE', name: 'Brisbane Domestic', city: 'Brisbane', country: 'AU', region: 'Asia Pacífico', category: 'secondary-hub', lat: -27.3842, lon: 153.1175, pop: 2.5, runway: 3000, annualPax: 11500000, airline: 'Qantas, Virgin Australia', minLevel: 5 },
    AKL: { id: 'AKL', name: 'Auckland International', city: 'Auckland', country: 'NZ', region: 'Asia Pacífico', category: 'secondary-hub', lat: -37.2080, lon: 174.7915, pop: 1.6, runway: 3900, annualPax: 21100000, airline: 'Air New Zealand, United', minLevel: 5 },
    NRT: { id: 'NRT', name: 'Tokyo Narita', city: 'Tokyo', country: 'JP', region: 'Asia Pacífico', category: 'major-hub', lat: 35.7647, lon: 140.3931, pop: 37.0, runway: 4000, annualPax: 36200000, airline: 'JAL, ANA', minLevel: 5 },
    CEB: { id: 'CEB', name: 'Cebu Mactan International', city: 'Cebu', country: 'PH', region: 'Asia Pacífico', category: 'secondary-hub', lat: 10.3073, lon: 123.9785, pop: 2.5, runway: 3200, annualPax: 5400000, airline: 'Cebu Pacific, AirAsia', minLevel: 5 },
    MNL: { id: 'MNL', name: 'Manila Ninoy Aquino', city: 'Manila', country: 'PH', region: 'Asia Pacífico', category: 'secondary-hub', lat: 14.5086, lon: 121.0197, pop: 14.7, runway: 3000, annualPax: 15300000, airline: 'Philippine Airlines', minLevel: 5 },
    HAN: { id: 'HAN', name: 'Hanoi Noi Bai', city: 'Hanoi', country: 'VN', region: 'Asia Pacífico', category: 'secondary-hub', lat: 21.2213, lon: 105.8066, pop: 8.1, runway: 3600, annualPax: 5900000, airline: 'Vietnam Airlines', minLevel: 5 },
    SGN: { id: 'SGN', name: 'Ho Chi Minh City Tan Son Nhat', city: 'Ho Chi Minh City', country: 'VN', region: 'Asia Pacífico', category: 'secondary-hub', lat: 10.8191, lon: 106.6513, pop: 10.0, runway: 3000, annualPax: 5600000, airline: 'Vietnam Airlines', minLevel: 5 },
    HAK: { id: 'HAK', name: 'Haikou Meilan International', city: 'Haikou', country: 'CN', region: 'Asia Pacífico', category: 'secondary-hub', lat: 19.9345, lon: 110.4519, pop: 2.5, runway: 3600, annualPax: 10200000, airline: 'Hainan Airlines, China Southern', minLevel: 5 },
    NAN: { id: 'NAN', name: 'Nadi International', city: 'Nadi', country: 'FJ', region: 'Asia Pacífico', category: 'regional-hub', lat: -17.7553, lon: 177.4477, pop: 0.5, runway: 3200, annualPax: 2100000, airline: 'Fiji Airways', minLevel: 5 },

    // ============================================
    // ÁFRICA - LEVEL 5+ (8 aeropuertos)
    // ============================================
    
    JNB: { id: 'JNB', name: 'Johannesburg OR Tambo', city: 'Johannesburg', country: 'ZA', region: 'África', category: 'major-hub', lat: -26.1367, lon: 28.2411, pop: 8.4, runway: 4000, annualPax: 21200000, airline: 'South African Airways', minLevel: 5 },
    CAI: { id: 'CAI', name: 'Cairo International', city: 'Cairo', country: 'EG', region: 'África', category: 'secondary-hub', lat: 30.1219, lon: 31.4056, pop: 21.0, runway: 3700, annualPax: 16700000, airline: 'EgyptAir', minLevel: 5 },
    ADD: { id: 'ADD', name: 'Addis Ababa Bole', city: 'Addis Ababa', country: 'ET', region: 'África', category: 'secondary-hub', lat: 9.0265, lon: 38.7992, pop: 5.0, runway: 4000, annualPax: 10400000, airline: 'Ethiopian Airlines', minLevel: 5 },
    CPT: { id: 'CPT', name: 'Cape Town International', city: 'Cape Town', country: 'ZA', region: 'África', category: 'secondary-hub', lat: -33.9675, lon: 18.6019, pop: 4.0, runway: 3887, annualPax: 9900000, airline: 'South African Airways', minLevel: 6 },
    LOS: { id: 'LOS', name: 'Lagos Murtala Muhammad', city: 'Lagos', country: 'NG', region: 'África', category: 'secondary-hub', lat: 6.5769, lon: 3.3212, pop: 21.0, runway: 4200, annualPax: 13400000, airline: 'Air Nigeria, Lufthansa', minLevel: 6 },
    DAR: { id: 'DAR', name: 'Dar es Salaam Julius Nyerere', city: 'Dar es Salaam', country: 'TZ', region: 'África', category: 'secondary-hub', lat: -6.8719, lon: 39.2075, pop: 6.5, runway: 3500, annualPax: 3900000, airline: 'Ethiopian Airlines', minLevel: 6 },
    NBO: { id: 'NBO', name: 'Nairobi Jomo Kenyatta', city: 'Nairobi', country: 'KE', region: 'África', category: 'secondary-hub', lat: -1.3521, lon: 36.9278, pop: 4.9, runway: 4260, annualPax: 7200000, airline: 'Kenya Airways', minLevel: 6 },
    ACC: { id: 'ACC', name: 'Accra Kotoka', city: 'Accra', country: 'GH', region: 'África', category: 'secondary-hub', lat: 5.6052, lon: -0.1678, pop: 2.3, runway: 3500, annualPax: 2800000, airline: 'Air Ghana', minLevel: 6 }
};

// ============================================
// TOTAL: 175+ Airports Worldwide
// Distribution by category and level
// ============================================

export class Airport {
    constructor(id) {
        const data = AIRPORTS[id];
        if (!data) throw new Error(`Invalid Airport ID: ${id}`);
        Object.assign(this, data);
    }

    // Métodos auxiliares para nuevos campos
    isUnlockedAtLevel(playerLevel) {
        return playerLevel >= (this.minLevel || 1);
    }

    getCategoryMultiplier() {
        const multipliers = {
            'mega-hub': 2.0,
            'major-hub': 1.8,
            'secondary-hub': 1.4,
            'regional-hub': 1.1,
            'small-airport': 0.8
        };
        return multipliers[this.category] || 1.0;
    }

    getDemandFactor() {
        // annualPax affects route demand
        return Math.max(0.3, Math.min(1.5, this.annualPax / 50000000));
    }

    getSlotCount() {
        // Category determines initial slot count
        const slotsByCategory = {
            'mega-hub': 8,
            'major-hub': 6,
            'secondary-hub': 4,
            'regional-hub': 3,
            'small-airport': 2
        };
        return slotsByCategory[this.category] || 2;
    }

    getDailyFee() {
        // Category and population determine daily hub fee
        const baseFee = 1000 * this.getCategoryMultiplier();
        return Math.round(baseFee + (this.pop * 100));
    }

    // Static methods to work with plain airport objects from AIRPORTS
    static getCategoryMultiplier(airportData) {
        const multipliers = {
            'mega-hub': 2.0,
            'major-hub': 1.8,
            'secondary-hub': 1.4,
            'regional-hub': 1.1,
            'small-airport': 0.8
        };
        return multipliers[airportData.category] || 1.0;
    }

    static getDemandFactor(airportData) {
        return Math.max(0.3, Math.min(1.5, airportData.annualPax / 50000000));
    }

    static getSlotCount(airportData) {
        const slotsByCategory = {
            'mega-hub': 8,
            'major-hub': 6,
            'secondary-hub': 4,
            'regional-hub': 3,
            'small-airport': 2
        };
        return slotsByCategory[airportData.category] || 2;
    }

    static getDailyFee(airportData) {
        const baseFee = 1000 * Airport.getCategoryMultiplier(airportData);
        return Math.round(baseFee + (airportData.pop * 100));
    }

    static isUnlockedAtLevel(airportData, playerLevel) {
        return playerLevel >= (airportData.minLevel || 1);
    }
}
