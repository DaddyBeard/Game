/**
 * REGIONS DATA - Definición de regiones geográficas y conexiones
 * Usado para el sistema de expansión progresiva basada en hub inicial
 */

export const REGIONS = {
    // ==========================================
    // EUROPA OCCIDENTAL
    // ==========================================
    SPAIN: {
        id: 'SPAIN',
        name: 'España',
        continent: 'EUROPE',
        baseUnlockLevel: 1,
        connections: ['PORTUGAL', 'FRANCE', 'MOROCCO', 'ALGERIA'],
        airports: ['MAD', 'BCN', 'AGP', 'SVQ', 'PMI', 'IBZ', 'BIO', 'VLC', 'TFS', 'TFN', 'LPA', 'JEZ', 'OVD', 'REU', 'BZA', 'XCN', 'MLN']
    },
    
    PORTUGAL: {
        id: 'PORTUGAL',
        name:  'Portugal',
        continent:  'EUROPE',
        baseUnlockLevel: 1,
        connections: ['SPAIN', 'MOROCCO'],
        airports: ['LIS', 'OPO', 'FAO']
    },
    
    FRANCE: {
        id: 'FRANCE',
        name:  'Francia',
        continent: 'EUROPE',
        baseUnlockLevel: 1,
        connections: ['SPAIN', 'UK_IRELAND', 'BENELUX', 'GERMANY', 'SWITZERLAND', 'ITALY'],
        airports: ['CDG', 'ORY', 'LYS', 'NCE', 'TLS', 'MRS', 'BVA', 'NTE', 'BOD']
    },
    
    UK_IRELAND: {
        id: 'UK_IRELAND',
        name: 'Reino Unido e Irlanda',
        continent: 'EUROPE',
        baseUnlockLevel: 1,
        connections:  ['FRANCE', 'BENELUX', 'NORDIC', 'ICELAND'],
        airports: ['LHR', 'LGW', 'STN', 'LCY', 'LTN', 'MAN', 'BHX', 'EDI', 'GLA', 'LPL', 'DUB', 'CRK', 'SNN']
    },
    
    GERMANY: {
        id: 'GERMANY',
        name:  'Alemania',
        continent: 'EUROPE',
        baseUnlockLevel: 1,
        connections: ['FRANCE', 'BENELUX', 'NORDIC', 'CENTRAL_EUROPE', 'SWITZERLAND'],
        airports: ['FRA', 'MUC', 'BER', 'DUS', 'HAM', 'CGN', 'STR']
    },
    
    BENELUX: {
        id: 'BENELUX',
        name: 'Bélgica y Países Bajos',
        continent: 'EUROPE',
        baseUnlockLevel: 2,
        connections: ['UK_IRELAND', 'FRANCE', 'GERMANY'],
        airports: ['AMS', 'BRU', 'CRL', 'ROT', 'EIN']
    },
    
    SWITZERLAND: {
        id: 'SWITZERLAND',
        name:  'Suiza',
        continent: 'EUROPE',
        baseUnlockLevel: 2,
        connections: ['FRANCE', 'GERMANY', 'ITALY', 'CENTRAL_EUROPE'],
        airports:  ['ZRH', 'GVA', 'BSL']
    },
    
    // ==========================================
    // EUROPA DEL SUR Y MEDITERRÁNEO
    // ==========================================
    ITALY: {
        id: 'ITALY',
        name: 'Italia',
        continent: 'EUROPE',
        baseUnlockLevel: 2,
        connections: ['FRANCE', 'SWITZERLAND', 'CENTRAL_EUROPE', 'GREECE', 'BALKANS'],
        airports: ['FCO', 'MXP', 'BGY', 'VCE', 'NAP']
    },
    
    GREECE: {
        id: 'GREECE',
        name:  'Grecia',
        continent: 'EUROPE',
        baseUnlockLevel: 3,
        connections: ['ITALY', 'BALKANS', 'TURKEY', 'CYPRUS'],
        airports: ['ATH', 'RHO']
    },
    
    CYPRUS: {
        id: 'CYPRUS',
        name: 'Chipre',
        continent: 'EUROPE',
        baseUnlockLevel: 3,
        connections: ['GREECE', 'TURKEY', 'MIDDLE_EAST_LEVANT'],
        airports: ['LCA']
    },
    
    // ==========================================
    // EUROPA CENTRAL Y ORIENTAL
    // ==========================================
    CENTRAL_EUROPE: {
        id: 'CENTRAL_EUROPE',
        name: 'Europa Central',
        continent: 'EUROPE',
        baseUnlockLevel: 2,
        connections: ['GERMANY', 'ITALY', 'BALKANS', 'EASTERN_EUROPE', 'SWITZERLAND'],
        airports: ['VIE', 'PRG', 'BUD']
    },
    
    EASTERN_EUROPE: {
        id: 'EASTERN_EUROPE',
        name: 'Europa Oriental',
        continent: 'EUROPE',
        baseUnlockLevel: 3,
        connections: ['CENTRAL_EUROPE', 'NORDIC', 'BALKANS', 'RUSSIA', 'TURKEY'],
        airports: ['WAW', 'KRK']
    },
    
    BALKANS: {
        id: 'BALKANS',
        name: 'Balcanes',
        continent: 'EUROPE',
        baseUnlockLevel: 3,
        connections:  ['ITALY', 'CENTRAL_EUROPE', 'EASTERN_EUROPE', 'GREECE', 'TURKEY'],
        airports: ['BEG', 'ZAG']
    },
    
    // ==========================================
    // EUROPA NÓRDICA
    // ==========================================
    NORDIC: {
        id: 'NORDIC',
        name: 'Europa Nórdica',
        continent:  'EUROPE',
        baseUnlockLevel: 2,
        connections: ['UK_IRELAND', 'GERMANY', 'EASTERN_EUROPE', 'RUSSIA', 'ICELAND'],
        airports: ['OSL', 'ARN', 'CPH', 'HEL', 'TRD']
    },
    
    ICELAND: {
        id: 'ICELAND',
        name:  'Islandia',
        continent: 'EUROPE',
        baseUnlockLevel: 4,
        connections: ['UK_IRELAND', 'NORDIC', 'NORTH_AMERICA_EAST'],
        airports: ['KEF']
    },
    
    // ==========================================
    // ORIENTE MEDIO
    // ==========================================
    TURKEY: {
        id: 'TURKEY',
        name: 'Turquía',
        continent: 'MIDDLE_EAST',
        baseUnlockLevel: 3,
        connections: ['GREECE', 'BALKANS', 'EASTERN_EUROPE', 'MIDDLE_EAST_GULF', 'CAUCASUS'],
        airports: ['IST', 'ISL']
    },
    
    MIDDLE_EAST_GULF:  {
        id: 'MIDDLE_EAST_GULF',
        name: 'Golfo Pérsico',
        continent: 'MIDDLE_EAST',
        baseUnlockLevel: 4,
        connections: ['TURKEY', 'MIDDLE_EAST_LEVANT', 'SOUTH_ASIA', 'EAST_AFRICA'],
        airports: ['DXB', 'DOH', 'AUH', 'DWC', 'JED', 'RUH']
    },
    
    MIDDLE_EAST_LEVANT: {
        id:  'MIDDLE_EAST_LEVANT',
        name:  'Levante',
        continent: 'MIDDLE_EAST',
        baseUnlockLevel: 4,
        connections: ['TURKEY', 'MIDDLE_EAST_GULF', 'NORTH_AFRICA', 'CYPRUS'],
        airports: ['AMM']
    },
    
    // ==========================================
    // ÁFRICA
    // ==========================================
    MOROCCO: {
        id: 'MOROCCO',
        name: 'Marruecos',
        continent: 'AFRICA',
        baseUnlockLevel:  2,
        connections: ['SPAIN', 'PORTUGAL', 'ALGERIA', 'WEST_AFRICA'],
        airports: ['CMN', 'RAK']
    },
    
    ALGERIA: {
        id: 'ALGERIA',
        name:  'Argelia',
        continent: 'AFRICA',
        baseUnlockLevel: 3,
        connections: ['SPAIN', 'FRANCE', 'MOROCCO', 'NORTH_AFRICA'],
        airports:  ['ALG']
    },
    
    NORTH_AFRICA: {
        id: 'NORTH_AFRICA',
        name: 'Norte de África',
        continent: 'AFRICA',
        baseUnlockLevel: 4,
        connections: ['ALGERIA', 'ITALY', 'MIDDLE_EAST_LEVANT', 'WEST_AFRICA', 'EAST_AFRICA'],
        airports:  ['CAI']
    },
    
    WEST_AFRICA: {
        id: 'WEST_AFRICA',
        name: 'África Occidental',
        continent:  'AFRICA',
        baseUnlockLevel: 6,
        connections: ['MOROCCO', 'NORTH_AFRICA', 'EAST_AFRICA', 'SOUTH_AMERICA_EAST'],
        airports: ['LOS', 'ACC']
    },
    
    EAST_AFRICA: {
        id: 'EAST_AFRICA',
        name: 'África Oriental',
        continent: 'AFRICA',
        baseUnlockLevel: 5,
        connections: ['NORTH_AFRICA', 'MIDDLE_EAST_GULF', 'SOUTHERN_AFRICA', 'SOUTH_ASIA'],
        airports: ['ADD', 'NBO', 'DAR']
    },
    
    SOUTHERN_AFRICA: {
        id: 'SOUTHERN_AFRICA',
        name: 'África del Sur',
        continent: 'AFRICA',
        baseUnlockLevel: 6,
        connections: ['EAST_AFRICA', 'WEST_AFRICA'],
        airports: ['JNB', 'CPT']
    },
    
    // ==========================================
    // NORTEAMÉRICA
    // ==========================================
    NORTH_AMERICA_EAST: {
        id:  'NORTH_AMERICA_EAST',
        name: 'Norteamérica Este',
        continent: 'NORTH_AMERICA',
        baseUnlockLevel: 5,
        connections: ['UK_IRELAND', 'ICELAND', 'NORTH_AMERICA_CENTRAL', 'CARIBBEAN', 'CANADA'],
        airports: ['JFK', 'BOS', 'IAD', 'MIA', 'ATL']
    },
    
    NORTH_AMERICA_CENTRAL:  {
        id: 'NORTH_AMERICA_CENTRAL',
        name: 'Norteamérica Central',
        continent: 'NORTH_AMERICA',
        baseUnlockLevel: 6,
        connections: ['NORTH_AMERICA_EAST', 'NORTH_AMERICA_WEST', 'CANADA', 'MEXICO'],
        airports: ['ORD', 'DFW', 'DEN', 'DAL', 'PHX', 'LAS']
    },
    
    NORTH_AMERICA_WEST: {
        id: 'NORTH_AMERICA_WEST',
        name: 'Norteamérica Oeste',
        continent: 'NORTH_AMERICA',
        baseUnlockLevel: 6,
        connections: ['NORTH_AMERICA_CENTRAL', 'CANADA', 'MEXICO', 'EAST_ASIA', 'OCEANIA'],
        airports: ['LAX', 'SFO', 'SEA']
    },
    
    CANADA: {
        id: 'CANADA',
        name:  'Canadá',
        continent: 'NORTH_AMERICA',
        baseUnlockLevel: 5,
        connections: ['NORTH_AMERICA_EAST', 'NORTH_AMERICA_CENTRAL', 'NORTH_AMERICA_WEST'],
        airports: ['YYZ', 'YVR', 'YUL']
    },
    
    MEXICO: {
        id: 'MEXICO',
        name:  'México',
        continent:  'NORTH_AMERICA',
        baseUnlockLevel:  5,
        connections: ['NORTH_AMERICA_CENTRAL', 'NORTH_AMERICA_WEST', 'CARIBBEAN', 'CENTRAL_AMERICA'],
        airports:  ['MEX', 'CUN']
    },
    
    // ==========================================
    // CENTROAMÉRICA Y CARIBE
    // ==========================================
    CARIBBEAN: {
        id: 'CARIBBEAN',
        name: 'Caribe',
        continent: 'CENTRAL_AMERICA',
        baseUnlockLevel: 6,
        connections: ['NORTH_AMERICA_EAST', 'MEXICO', 'CENTRAL_AMERICA', 'SOUTH_AMERICA_NORTH'],
        airports: []
    },
    
    CENTRAL_AMERICA: {
        id: 'CENTRAL_AMERICA',
        name: 'Centroamérica',
        continent: 'CENTRAL_AMERICA',
        baseUnlockLevel: 6,
        connections: ['MEXICO', 'CARIBBEAN', 'SOUTH_AMERICA_NORTH'],
        airports: []
    },
    
    // ==========================================
    // SUDAMÉRICA
    // ==========================================
    SOUTH_AMERICA_NORTH: {
        id: 'SOUTH_AMERICA_NORTH',
        name:  'Sudamérica Norte',
        continent: 'SOUTH_AMERICA',
        baseUnlockLevel: 6,
        connections: ['CARIBBEAN', 'CENTRAL_AMERICA', 'SOUTH_AMERICA_WEST', 'SOUTH_AMERICA_EAST'],
        airports: ['BOG', 'MDE']
    },
    
    SOUTH_AMERICA_WEST:  {
        id: 'SOUTH_AMERICA_WEST',
        name: 'Sudamérica Oeste',
        continent: 'SOUTH_AMERICA',
        baseUnlockLevel: 7,
        connections: ['SOUTH_AMERICA_NORTH', 'SOUTH_AMERICA_EAST', 'SOUTH_AMERICA_SOUTH'],
        airports: ['LIM', 'SCL']
    },
    
    SOUTH_AMERICA_EAST:  {
        id: 'SOUTH_AMERICA_EAST',
        name: 'Sudamérica Este',
        continent: 'SOUTH_AMERICA',
        baseUnlockLevel: 7,
        connections:  ['SOUTH_AMERICA_NORTH', 'SOUTH_AMERICA_WEST', 'SOUTH_AMERICA_SOUTH', 'WEST_AFRICA'],
        airports:  ['GRU', 'GIG', 'SDU', 'VCP']
    },
    
    SOUTH_AMERICA_SOUTH:  {
        id: 'SOUTH_AMERICA_SOUTH',
        name: 'Sudamérica Sur',
        continent: 'SOUTH_AMERICA',
        baseUnlockLevel: 7,
        connections:  ['SOUTH_AMERICA_WEST', 'SOUTH_AMERICA_EAST'],
        airports: ['EZE', 'AEP']
    },
    
    // ==========================================
    // ASIA
    // ==========================================
    RUSSIA: {
        id: 'RUSSIA',
        name: 'Rusia',
        continent: 'ASIA',
        baseUnlockLevel: 5,
        connections: ['EASTERN_EUROPE', 'NORDIC', 'CENTRAL_ASIA', 'EAST_ASIA'],
        airports: ['SVO', 'DME']
    },
    
    CAUCASUS: {
        id: 'CAUCASUS',
        name: 'Cáucaso',
        continent: 'ASIA',
        baseUnlockLevel: 5,
        connections: ['TURKEY', 'RUSSIA', 'CENTRAL_ASIA', 'MIDDLE_EAST_GULF'],
        airports: []
    },
    
    CENTRAL_ASIA: {
        id: 'CENTRAL_ASIA',
        name: 'Asia Central',
        continent: 'ASIA',
        baseUnlockLevel: 6,
        connections: ['RUSSIA', 'CAUCASUS', 'SOUTH_ASIA', 'EAST_ASIA'],
        airports:  []
    },
    
    SOUTH_ASIA: {
        id: 'SOUTH_ASIA',
        name: 'Asia del Sur',
        continent: 'ASIA',
        baseUnlockLevel: 6,
        connections: ['MIDDLE_EAST_GULF', 'CENTRAL_ASIA', 'SOUTHEAST_ASIA', 'EAST_AFRICA'],
        airports: ['DEL', 'BOM']
    },
    
    SOUTHEAST_ASIA: {
        id: 'SOUTHEAST_ASIA',
        name: 'Sudeste Asiático',
        continent: 'ASIA',
        baseUnlockLevel: 7,
        connections: ['SOUTH_ASIA', 'EAST_ASIA', 'OCEANIA'],
        airports: ['SIN', 'BKK', 'KUL', 'CGK', 'MNL', 'HAN', 'SGN', 'CEB']
    },
    
    EAST_ASIA: {
        id: 'EAST_ASIA',
        name: 'Asia Oriental',
        continent:  'ASIA',
        baseUnlockLevel: 8,
        connections: ['RUSSIA', 'CENTRAL_ASIA', 'SOUTHEAST_ASIA', 'NORTH_AMERICA_WEST', 'OCEANIA'],
        airports: ['HND', 'NRT', 'PVG', 'HKG', 'ICN', 'TPE', 'PEK', 'HAK']
    },
    
    // ==========================================
    // OCEANÍA
    // ==========================================
    OCEANIA: {
        id: 'OCEANIA',
        name: 'Oceanía',
        continent: 'OCEANIA',
        baseUnlockLevel: 8,
        connections: ['SOUTHEAST_ASIA', 'EAST_ASIA', 'NORTH_AMERICA_WEST', 'PACIFIC_ISLANDS'],
        airports: ['SYD', 'MEL', 'BNE', 'AKL']
    },
    
    PACIFIC_ISLANDS: {
        id: 'PACIFIC_ISLANDS',
        name: 'Islas del Pacífico',
        continent: 'OCEANIA',
        baseUnlockLevel: 9,
        connections: ['OCEANIA', 'EAST_ASIA', 'NORTH_AMERICA_WEST'],
        airports: ['NAN']
    }
};

/**
 * Obtener región por código de aeropuerto
 * @param {string} airportCode - Código IATA del aeropuerto
 * @returns {string|null} ID de la región o null si no se encuentra
 */
export function getRegionByAirport(airportCode) {
    for (const [regionId, region] of Object.entries(REGIONS)) {
        if (region.airports.includes(airportCode)) {
            return regionId;
        }
    }
    return null;
}

/**
 * Obtener regiones conectadas a una región
 * @param {string} regionId - ID de la región
 * @returns {string[]} Array de IDs de regiones conectadas
 */
export function getConnectedRegions(regionId) {
    const region = REGIONS[regionId];
    return region ?  region.connections : [];
}

/**
 * Obtener todas las regiones accesibles desde una región inicial
 * Usa BFS para calcular la profundidad de conexión
 * @param {string} startRegionId - Región de inicio
 * @param {number} maxDepth - Profundidad máxima de búsqueda
 * @returns {Array} Array de objetos {regionId, depth}
 */
export function getAccessibleRegions(startRegionId, maxDepth = 10) {
    const visited = new Set();
    const queue = [{ region: startRegionId, depth:  0 }];
    const result = [];
    
    while (queue.length > 0) {
        const { region, depth } = queue.shift();
        
        if (visited.has(region) || depth > maxDepth) continue;
        visited.add(region);
        
        result.push({ regionId: region, depth });
        
        const connections = getConnectedRegions(region);
        for (const conn of connections) {
            if (!visited.has(conn)) {
                queue.push({ region: conn, depth: depth + 1 });
            }
        }
    }
    
    return result;
}

/**
 * Verificar si una región es accesible desde otra
 * @param {string} fromRegion - Región de origen
 * @param {string} toRegion - Región de destino
 * @param {number} maxDepth - Profundidad máxima permitida
 * @returns {boolean} True si es accesible
 */
export function isRegionAccessible(fromRegion, toRegion, maxDepth) {
    const accessible = getAccessibleRegions(fromRegion, maxDepth);
    return accessible.some(r => r.regionId === toRegion);
}

/**
 * Obtener información de una región
 * @param {string} regionId - ID de la región
 * @returns {Object|null} Datos de la región
 */
export function getRegionInfo(regionId) {
    return REGIONS[regionId] || null;
}
