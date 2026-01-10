/**
 * LEVEL SYSTEM - Sistema Central de Progresión
 * Gestiona niveles 1-10, desbloqueos y expansión basada en hub
 */

import { REGIONS, getRegionByAirport, getAccessibleRegions } from './regionsData.js';

// ==========================================
// CONFIGURACIÓN DE NIVELES 1-10
// ==========================================
export const LEVEL_CONFIG = {
    1: {
        level: 1,
        name: "Startup Airline",
        nameEs: "Aerolínea Emergente",
        description: "Tu aventura comienza. Operaciones domésticas básicas.",
        icon: "🛫",
        
        requirements: {
            reputation: 0,
            fleetSize: 0,
            activeRoutes: 0,
            cumulativeProfit: 0
        },
        
        limits: {
            maxFleet: 3,
            maxRoutes: 3,
            maxSecondaryHubs: 0,
            maxFuelContracts: 1,
            maxCorporateContracts: 1
        },
        
        unlocks: {
            aircraft: ['A320', 'B738', 'E170'],
            fuelProviders: ['shell'],
            fuelProfiles: ['estable'],
            contractTiers: ['LOCAL'],
            hubCategories: []
        },
        
        expansion: {
            rangeMultiplier: 1,
            regionDepth: 1
        },
        
        bonuses: {
            maintenanceDiscount: 0,
            fuelDiscount: 0,
            reputationMultiplier: 1.0
        }
    },
    
    2: {
        level: 2,
        name: "Regional Carrier",
        nameEs: "Transportista Regional",
        description: "Expansión regional. Primeras rutas europeas.",
        icon: "✈️",
        
        requirements: {
            reputation: 50,
            fleetSize: 2,
            activeRoutes: 2,
            cumulativeProfit: 1000000
        },
        
        limits: {
            maxFleet: 5,
            maxRoutes: 5,
            maxSecondaryHubs: 0,
            maxFuelContracts: 1,
            maxCorporateContracts: 1
        },
        
        unlocks: {
            aircraft: ['A321', 'B752', 'E175', 'E190', 'ATR72'],
            fuelProviders: ['shell'],
            fuelProfiles: ['estable'],
            contractTiers: ['LOCAL'],
            hubCategories: []
        },
        
        expansion: {
            rangeMultiplier: 2,
            regionDepth: 2
        },
        
        bonuses: {
            maintenanceDiscount: 0.02,
            fuelDiscount: 0,
            reputationMultiplier: 1.0
        }
    },
    
    3: {
        level: 3,
        name: "Established Operator",
        nameEs: "Operador Establecido",
        description: "Operador establecido. Acceso a nuevos mercados y proveedores.",
        icon: "🌍",
        
        requirements: {
            reputation: 60,
            fleetSize: 4,
            activeRoutes: 4,
            cumulativeProfit: 10000000
        },
        
        limits: {
            maxFleet: 8,
            maxRoutes: 8,
            maxSecondaryHubs: 1,
            maxFuelContracts: 2,
            maxCorporateContracts: 1
        },
        
        unlocks: {
            aircraft: ['A20N', 'B38M', 'CRJ7', 'DH8D', 'E195', 'C208'],
            fuelProviders: ['shell', 'bp'],
            fuelProfiles: ['estable', 'flexible'],
            contractTiers: ['LOCAL', 'REGIONAL'],
            hubCategories: ['Regional Hub', 'Small Airport']
        },
        
        expansion: {
            rangeMultiplier: 3,
            regionDepth: 3
        },
        
        bonuses: {
            maintenanceDiscount: 0.03,
            fuelDiscount: 0.02,
            reputationMultiplier: 1.05
        }
    },
    
    4: {
        level: 4,
        name: "Growing Airline",
        nameEs: "Aerolínea en Crecimiento",
        description: "Aerolínea en crecimiento. Primer widebody disponible.",
        icon: "📈",
        
        requirements: {
            reputation: 70,
            fleetSize: 6,
            activeRoutes: 6,
            cumulativeProfit: 50000000
        },
        
        limits: {
            maxFleet: 12,
            maxRoutes: 12,
            maxSecondaryHubs: 2,
            maxFuelContracts: 2,
            maxCorporateContracts: 1
        },
        
        unlocks: {
            aircraft: ['A21N', 'B39M', 'B788', 'CRJ9', 'E195E2', 'AT45'],
            fuelProviders: ['shell', 'bp'],
            fuelProfiles: ['estable', 'flexible'],
            contractTiers: ['LOCAL', 'REGIONAL'],
            hubCategories: ['Regional Hub', 'Small Airport', 'Secondary Hub']
        },
        
        expansion: {
            rangeMultiplier: 4,
            regionDepth: 4
        },
        
        bonuses: {
            maintenanceDiscount: 0.05,
            fuelDiscount: 0.03,
            reputationMultiplier: 1.08
        }
    },
    
    5: {
        level: 5,
        name: "International Carrier",
        nameEs: "Transportista Internacional",
        description: "Carrier internacional. Rutas intercontinentales a Oriente Medio.",
        icon: "🌐",
        
        requirements: {
            reputation: 75,
            fleetSize: 8,
            activeRoutes: 8,
            cumulativeProfit: 100000000
        },
        
        limits: {
            maxFleet: 16,
            maxRoutes: 16,
            maxSecondaryHubs: 3,
            maxFuelContracts: 3,
            maxCorporateContracts: 2
        },
        
        unlocks: {
            aircraft: ['A359', 'B77W', 'B763', 'LATD', 'KNG360'],
            fuelProviders: ['shell', 'bp', 'totalenergies'],
            fuelProfiles: ['estable', 'flexible', 'agresivo'],
            contractTiers: ['LOCAL', 'REGIONAL', 'NATIONAL'],
            hubCategories: ['Regional Hub', 'Small Airport', 'Secondary Hub', 'Major Hub']
        },
        
        expansion: {
            rangeMultiplier: 5,
            regionDepth: 5
        },
        
        bonuses: {
            maintenanceDiscount: 0.07,
            fuelDiscount: 0.05,
            reputationMultiplier: 1.10
        }
    },
    
    6: {
        level: 6,
        name: "Major Airline",
        nameEs: "Aerolínea Mayor",
        description: "Aerolínea mayor. Rutas transatlánticas desbloqueadas.",
        icon: "🏆",
        
        requirements: {
            reputation: 78,
            fleetSize: 10,
            activeRoutes: 10,
            cumulativeProfit: 200000000
        },
        
        limits: {
            maxFleet: 20,
            maxRoutes: 20,
            maxSecondaryHubs: 4,
            maxFuelContracts: 3,
            maxCorporateContracts: 2
        },
        
        unlocks: {
            aircraft: ['B789', 'A35K', 'B772', 'F7X', 'PHE100'],
            fuelProviders: ['shell', 'bp', 'totalenergies'],
            fuelProfiles: ['estable', 'flexible', 'agresivo'],
            contractTiers: ['LOCAL', 'REGIONAL', 'NATIONAL'],
            hubCategories: ['Regional Hub', 'Small Airport', 'Secondary Hub', 'Major Hub']
        },
        
        expansion: {
            rangeMultiplier: 6,
            regionDepth: 6
        },
        
        bonuses: {
            maintenanceDiscount: 0.08,
            fuelDiscount: 0.06,
            reputationMultiplier: 1.12
        }
    },
    
    7: {
        level: 7,
        name: "Flag Carrier",
        nameEs: "Aerolínea de Bandera",
        description: "Aerolínea de bandera. Contratos multinacionales disponibles.",
        icon: "🚀",
        
        requirements: {
            reputation: 80,
            fleetSize: 12,
            activeRoutes: 10,
            cumulativeProfit: 300000000
        },
        
        limits: {
            maxFleet: 25,
            maxRoutes: 25,
            maxSecondaryHubs: 5,
            maxFuelContracts: 4,
            maxCorporateContracts: 2
        },
        
        unlocks: {
            aircraft: ['A388', 'B78X', 'B744', 'F8X', 'PHE300'],
            fuelProviders: ['shell', 'bp', 'totalenergies'],
            fuelProfiles: ['estable', 'flexible', 'agresivo'],
            contractTiers: ['LOCAL', 'REGIONAL', 'NATIONAL', 'MULTINATIONAL'],
            hubCategories: ['Regional Hub', 'Small Airport', 'Secondary Hub', 'Major Hub']
        },
        
        expansion: {
            rangeMultiplier: 7,
            regionDepth: 7
        },
        
        bonuses: {
            maintenanceDiscount: 0.10,
            fuelDiscount: 0.07,
            reputationMultiplier: 1.15
        }
    },
    
    8: {
        level: 8,
        name: "Premium Carrier",
        nameEs: "Transportista Premium",
        description: "Carrier premium. Operaciones de carga disponibles.",
        icon: "💎",
        
        requirements: {
            reputation: 85,
            fleetSize: 14,
            activeRoutes: 12,
            cumulativeProfit: 500000000
        },
        
        limits: {
            maxFleet: 30,
            maxRoutes: 30,
            maxSecondaryHubs: 6,
            maxFuelContracts: 4,
            maxCorporateContracts: 2
        },
        
        unlocks: {
            aircraft: ['A332', 'A333', 'B738F', 'G550', 'CJ3'],
            fuelProviders: ['shell', 'bp', 'totalenergies'],
            fuelProfiles: ['estable', 'flexible', 'agresivo'],
            contractTiers: ['LOCAL', 'REGIONAL', 'NATIONAL', 'MULTINATIONAL'],
            hubCategories: ['Regional Hub', 'Small Airport', 'Secondary Hub', 'Major Hub', 'Mega Hub']
        },
        
        expansion: {
            rangeMultiplier: 8,
            regionDepth: 8
        },
        
        bonuses: {
            maintenanceDiscount: 0.12,
            fuelDiscount: 0.08,
            reputationMultiplier: 1.18
        }
    },
    
    9: {
        level: 9,
        name: "Global Carrier",
        nameEs: "Transportista Global",
        description: "Carrier global. Red mundial y contratos estratégicos.",
        icon: "🌟",
        
        requirements: {
            reputation: 88,
            fleetSize: 15,
            activeRoutes: 12,
            cumulativeProfit: 700000000
        },
        
        limits: {
            maxFleet: 40,
            maxRoutes: 40,
            maxSecondaryHubs: 7,
            maxFuelContracts: 5,
            maxCorporateContracts: 3
        },
        
        unlocks: {
            aircraft: ['B763F', 'B77F', 'A221', 'G7500'],
            fuelProviders: ['shell', 'bp', 'totalenergies'],
            fuelProfiles: ['estable', 'flexible', 'agresivo'],
            contractTiers: ['LOCAL', 'REGIONAL', 'NATIONAL', 'MULTINATIONAL', 'GLOBAL'],
            hubCategories: ['Regional Hub', 'Small Airport', 'Secondary Hub', 'Major Hub', 'Mega Hub']
        },
        
        expansion: {
            rangeMultiplier: 9,
            regionDepth: 9
        },
        
        bonuses: {
            maintenanceDiscount: 0.14,
            fuelDiscount: 0.10,
            reputationMultiplier: 1.20
        }
    },
    
    10: {
        level: 10,
        name: "Legendary Airline",
        nameEs: "Aerolínea Legendaria",
        description: "Leyenda de la aviación. Sin límites operativos.",
        icon: "👑",
        
        requirements: {
            reputation: 90,
            fleetSize: 15,
            activeRoutes: 12,
            cumulativeProfit: 1000000000
        },
        
        limits: {
            maxFleet: -1,
            maxRoutes: -1,
            maxSecondaryHubs: -1,
            maxFuelContracts: 6,
            maxCorporateContracts: 3
        },
        
        unlocks: {
            aircraft: ['A332F', 'B744F', 'AN124', 'A223'],
            fuelProviders: ['shell', 'bp', 'totalenergies'],
            fuelProfiles: ['estable', 'flexible', 'agresivo'],
            contractTiers: ['LOCAL', 'REGIONAL', 'NATIONAL', 'MULTINATIONAL', 'GLOBAL'],
            hubCategories: ['Regional Hub', 'Small Airport', 'Secondary Hub', 'Major Hub', 'Mega Hub']
        },
        
        expansion: {
            rangeMultiplier: 10,
            regionDepth: 100
        },
        
        bonuses: {
            maintenanceDiscount: 0.15,
            fuelDiscount: 0.12,
            reputationMultiplier: 1.25
        }
    }
};

// ==========================================
// BONUS POR CATEGORÍA DE HUB INICIAL
// ==========================================
export const HUB_CATEGORY_BONUS = {
    'Mega Hub': {
        rangeBonus: 3000,
        startingMoney: 50000000,
        difficulty: 'Fácil',
        difficultyEn: 'Easy',
        color: '#FFD700',
        description: 'Máximo alcance inicial. Ideal para principiantes.'
    },
    'Major Hub': {
        rangeBonus: 2000,
        startingMoney: 35000000,
        difficulty: 'Normal',
        difficultyEn: 'Normal',
        color: '#C0C0C0',
        description: 'Buen equilibrio entre alcance y desafío.'
    },
    'Secondary Hub': {
        rangeBonus: 1000,
        startingMoney: 20000000,
        difficulty: 'Difícil',
        difficultyEn: 'Hard',
        color: '#CD7F32',
        description: 'Alcance limitado. Requiere planificación estratégica.'
    },
    'Regional Hub': {
        rangeBonus: 500,
        startingMoney: 12000000,
        difficulty: 'Muy Difícil',
        difficultyEn: 'Very Hard',
        color: '#8B4513',
        description: 'Para jugadores experimentados.'
    },
    'Small Airport': {
        rangeBonus: 0,
        startingMoney: 8000000,
        difficulty: 'Extremo',
        difficultyEn: 'Extreme',
        color: '#2F4F4F',
        description: 'El mayor desafío. Sin bonus de alcance.'
    }
};

// ==========================================
// CLASE PRINCIPAL DEL SISTEMA DE NIVELES
// ==========================================
export class LevelSystem {
    constructor(game) {
        this.game = game;
    }
    
    /**
     * Obtener configuración del nivel actual
     */
    getCurrentLevelConfig() {
        const level = this.game.state.level || 1;
        return LEVEL_CONFIG[level];
    }
    
    /**
     * Obtener todos los aviones desbloqueados hasta el nivel actual
     */
    getUnlockedAircraft() {
        const level = this.game.state.level || 1;
        const unlocked = new Set();
        
        for (let i = 1; i <= level; i++) {
            const config = LEVEL_CONFIG[i];
            if (config && config.unlocks.aircraft) {
                config.unlocks.aircraft.forEach(a => unlocked.add(a));
            }
        }
        
        return Array.from(unlocked);
    }
    
    /**
     * Verificar si un avión específico está desbloqueado
     */
    isAircraftUnlocked(aircraftId) {
        return this.getUnlockedAircraft().includes(aircraftId);
    }
    
    /**
     * Obtener proveedores de combustible desbloqueados
     */
    getUnlockedFuelProviders() {
        const config = this.getCurrentLevelConfig();
        return config.unlocks.fuelProviders;
    }
    
    /**
     * Obtener perfiles de combustible desbloqueados
     */
    getUnlockedFuelProfiles() {
        const config = this.getCurrentLevelConfig();
        return config.unlocks.fuelProfiles;
    }
    
    /**
     * Obtener tiers de contratos corporativos desbloqueados
     */
    getUnlockedContractTiers() {
        const config = this.getCurrentLevelConfig();
        return config.unlocks.contractTiers;
    }
    
    /**
     * Obtener categorías de hub permitidas para secundarios
     */
    getAllowedHubCategories() {
        const config = this.getCurrentLevelConfig();
        return config.unlocks.hubCategories;
    }
    
    /**
     * Calcular alcance máximo basado en nivel y hub
     */
    calculateMaxRange() {
        const level = this.game.state.level || 1;
        const config = LEVEL_CONFIG[level];
        const hubCategory = this.game.state.mainHubCategory || 'Secondary Hub';
        const hubBonus = HUB_CATEGORY_BONUS[hubCategory]?.rangeBonus || 0;
        
        return (config.expansion.rangeMultiplier * 1500) + hubBonus;
    }
    
    /**
     * Obtener profundidad máxima de regiones
     */
    getMaxRegionDepth() {
        const config = this.getCurrentLevelConfig();
        return config.expansion.regionDepth;
    }
    
    /**
     * Verificar si un aeropuerto está desbloqueado
     * @param {Object} airportData - Datos del aeropuerto (puede ser objeto individual o entrada de AIRPORTS)
     * @param {Object|Array} allAirports - Objeto AIRPORTS o array de aeropuertos
     * @returns {boolean} True si el aeropuerto está desbloqueado
     */
    isAirportUnlocked(airportData, allAirports) {
        const level = this.game.state.level || 1;
        const mainHub = this.game.state.mainHub;
        
        // Si no hay hub principal, solo permitir selección inicial
        if (!mainHub) return true;
        
        // Obtener código IATA del aeropuerto (puede ser airportData.id o la clave del objeto)
        const airportId = airportData.id || airportData.iata;
        if (!airportId) return false;
        
        // El hub principal siempre está desbloqueado
        if (airportId === mainHub) return true;
        
        // 1. Verificar nivel mínimo del aeropuerto
        if (airportData.minLevel && level < airportData.minLevel) {
            return false;
        }
        
        // 2. Obtener datos del hub principal
        // Si allAirports es un objeto (como AIRPORTS), acceder directamente
        let hubAirport;
        if (Array.isArray(allAirports)) {
            hubAirport = allAirports.find(a => (a.id || a.iata) === mainHub);
        } else {
            hubAirport = allAirports[mainHub];
        }
        
        if (!hubAirport) return false;
        
        // 3. Calcular distancia
        const distance = this.calculateDistance(
            hubAirport.lat, hubAirport.lon,
            airportData.lat, airportData.lon
        );
        
        // 4. Verificar alcance
        const maxRange = this.calculateMaxRange();
        if (distance > maxRange) {
            return false;
        }
        
        // 5. Verificar conexión de regiones
        const hubRegion = getRegionByAirport(mainHub);
        const airportRegion = getRegionByAirport(airportId);
        
        if (hubRegion && airportRegion && hubRegion !== airportRegion) {
            const maxDepth = this.getMaxRegionDepth();
            const accessible = getAccessibleRegions(hubRegion, maxDepth);
            
            if (!accessible.some(r => r.regionId === airportRegion)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Obtener lista de aeropuertos desbloqueados
     * @param {Object|Array} allAirports - Objeto AIRPORTS o array de aeropuertos
     * @returns {Object|Array} Objeto o array filtrado con solo aeropuertos desbloqueados
     */
    getUnlockedAirports(allAirports) {
        // Si es un objeto (como AIRPORTS), convertir a array de valores y filtrar
        if (Array.isArray(allAirports)) {
            return allAirports.filter(airport => this.isAirportUnlocked(airport, allAirports));
        } else {
            // Es un objeto, convertir a array, filtrar, y reconstruir objeto
            const unlocked = {};
            Object.entries(allAirports).forEach(([key, airport]) => {
                if (this.isAirportUnlocked(airport, allAirports)) {
                    unlocked[key] = airport;
                }
            });
            return unlocked;
        }
    }
    
    /**
     * Obtener información de desbloqueo de un aeropuerto
     */
    getAirportUnlockInfo(airportData, allAirports) {
        const level = this.game.state.level || 1;
        const mainHub = this.game.state.mainHub;
        
        if (!mainHub) {
            return { unlocked: true, reason: 'Selección inicial' };
        }
        
        if (airportData.id === mainHub) {
            return { unlocked: true, reason: 'Hub principal' };
        }
        
        const info = {
            unlocked: true,
            checks: {
                level: { passed: true, required: airportData.minLevel || 1, current: level },
                distance: { passed: true, required: 0, current: 0 },
                region: { passed: true, required: '', current: '' }
            }
        };
        
        // Check nivel
        if (airportData.minLevel && level < airportData.minLevel) {
            info.unlocked = false;
            info.checks.level.passed = false;
            info.reason = `Requiere nivel ${airportData.minLevel}`;
        }
        
        // Check distancia
        let hubAirport;
        if (Array.isArray(allAirports)) {
            hubAirport = allAirports.find(a => (a.id || a.iata) === mainHub);
        } else {
            hubAirport = allAirports[mainHub];
        }
        
        if (hubAirport) {
            const distance = this.calculateDistance(
                hubAirport.lat, hubAirport.lon,
                airportData.lat, airportData.lon
            );
            const maxRange = this.calculateMaxRange();
            
            info.checks.distance.current = Math.round(distance);
            info.checks.distance.required = maxRange;
            
            if (distance > maxRange) {
                info.unlocked = false;
                info.checks.distance.passed = false;
                info.reason = `Fuera de alcance (${Math.round(distance)} km > ${maxRange} km)`;
            }
        }
        
        // Check región
        const hubRegion = getRegionByAirport(mainHub);
        const airportRegion = getRegionByAirport(airportData.id || airportData.iata);
        
        info.checks.region.current = airportRegion || 'Desconocida';
        info.checks.region.required = hubRegion || 'Desconocida';
        
        if (hubRegion && airportRegion && hubRegion !== airportRegion) {
            const maxDepth = this.getMaxRegionDepth();
            const accessible = getAccessibleRegions(hubRegion, maxDepth);
            
            if (!accessible.some(r => r.regionId === airportRegion)) {
                info.unlocked = false;
                info.checks.region.passed = false;
                info.reason = `Región no conectada (profundidad > ${maxDepth})`;
            }
        }
        
        return info;
    }
    
    /**
     * Calcular distancia entre dos puntos (fórmula de Haversine)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    toRad(deg) {
        return deg * (Math.PI / 180);
    }
    
    /**
     * Obtener límites operativos del nivel actual
     */
    getLimits() {
        const config = this.getCurrentLevelConfig();
        return config.limits;
    }
    
    /**
     * Verificar si se ha alcanzado un límite
     */
    isLimitReached(limitType) {
        const limits = this.getLimits();
        const limit = limits[limitType];
        
        if (limit === -1) return false; // Sin límite
        
        let current = 0;
        switch(limitType) {
            case 'maxFleet':
                // La flota se almacena en managers.fleet.ownedPlanes
                current = this.game.managers?.fleet?.ownedPlanes?.length || 0;
                break;
            case 'maxRoutes':
                // Las rutas se almacenan en managers.routes.routes y se acceden con getRoutes()
                const allRoutes = this.game.managers?.routes?.getRoutes?.() || [];
                current = allRoutes.filter(r => {
                    // Verificar si está activa según diferentes formatos
                    if (Array.isArray(r.assignments)) {
                        return r.assignments.some(a => a?.status === 'ACTIVE' || a?.status === 'active');
                    }
                    return r.status === 'active' || r.status === 'ACTIVE' || r.active === true;
                }).length;
                break;
            case 'maxSecondaryHubs':
                // Contar solo hubs secundarios (excluir mainHub)
                const hubs = this.game.state.hubs || {};
                const mainHub = this.game.state.mainHub;
                current = Object.keys(hubs).filter(hubId => hubId !== mainHub).length;
                break;
            case 'maxFuelContracts':
                current = (this.game.state.fuel?.contracts?.filter(c => c.status === 'active')?.length) || 0;
                break;
            case 'maxCorporateContracts':
                current = (this.game.state.corporateContracts?.filter(c => c.status === 'active')?.length) || 0;
                break;
        }
        
        return current >= limit;
    }
    
    /**
     * Obtener bonificaciones del nivel actual
     */
    getBonuses() {
        const config = this.getCurrentLevelConfig();
        return config.bonuses;
    }
    
    /**
     * Verificar si el jugador puede subir de nivel
     */
    canLevelUp() {
        const currentLevel = this.game.state.level || 1;
        
        if (currentLevel >= 10) {
            return { can: false, reason: 'Nivel máximo alcanzado' };
        }
        
        const nextConfig = LEVEL_CONFIG[currentLevel + 1];
        const state = this.game.state;
        
        // Obtener valores reales desde los managers
        const fleetSize = this.game.managers?.fleet?.ownedPlanes?.length || 0;
        const allRoutes = this.game.managers?.routes?.getRoutes?.() || [];
        const activeRoutes = allRoutes.filter(r => {
            if (Array.isArray(r.assignments)) {
                return r.assignments.some(a => a?.status === 'ACTIVE' || a?.status === 'active');
            }
            return r.status === 'active' || r.status === 'ACTIVE' || r.active === true;
        }).length;
        
        const checks = {
            reputation: {
                current: state.reputation || 0,
                required: nextConfig.requirements.reputation,
                passed: (state.reputation || 0) >= nextConfig.requirements.reputation
            },
            fleetSize: {
                current: fleetSize,
                required: nextConfig.requirements.fleetSize,
                passed: fleetSize >= nextConfig.requirements.fleetSize
            },
            activeRoutes: {
                current: activeRoutes,
                required: nextConfig.requirements.activeRoutes,
                passed: activeRoutes >= nextConfig.requirements.activeRoutes
            },
            cumulativeProfit: {
                current: state.cumulativeProfit || 0,
                required: nextConfig.requirements.cumulativeProfit,
                passed: (state.cumulativeProfit || 0) >= nextConfig.requirements.cumulativeProfit
            }
        };
        
        const allPassed = Object.values(checks).every(c => c.passed);
        
        return {
            can: allPassed,
            checks,
            nextLevel: currentLevel + 1,
            nextConfig
        };
    }
    
    /**
     * Subir de nivel
     */
    levelUp() {
        const check = this.canLevelUp();
        
        if (!check.can) {
            return { success: false, reason: 'Requisitos no cumplidos', checks: check.checks };
        }
        
        const oldLevel = this.game.state.level || 1;
        this.game.state.level = oldLevel + 1;
        
        if (this.game.save) {
            this.game.save();
        }
        
        return {
            success: true,
            oldLevel,
            newLevel: this.game.state.level,
            config: LEVEL_CONFIG[this.game.state.level],
            newUnlocks: LEVEL_CONFIG[this.game.state.level].unlocks
        };
    }
    
    /**
     * Obtener progreso hacia el siguiente nivel
     */
    getLevelProgress() {
        const currentLevel = this.game.state.level || 1;
        
        if (currentLevel >= 10) {
            return { 
                level: 10, 
                progress: 100, 
                isMaxLevel: true,
                config: LEVEL_CONFIG[10]
            };
        }
        
        const nextConfig = LEVEL_CONFIG[currentLevel + 1];
        const state = this.game.state;
        
        // Obtener valores reales desde los managers
        const fleetSize = this.game.managers?.fleet?.ownedPlanes?.length || 0;
        const allRoutes = this.game.managers?.routes?.getRoutes?.() || [];
        const activeRoutes = allRoutes.filter(r => {
            if (Array.isArray(r.assignments)) {
                return r.assignments.some(a => a?.status === 'ACTIVE' || a?.status === 'active');
            }
            return r.status === 'active' || r.status === 'ACTIVE' || r.active === true;
        }).length;
        
        const progress = {
            reputation: {
                current: state.reputation || 0,
                required: nextConfig.requirements.reputation,
                percent: Math.min(100, ((state.reputation || 0) / nextConfig.requirements.reputation) * 100)
            },
            fleetSize: {
                current: fleetSize,
                required: nextConfig.requirements.fleetSize,
                percent: Math.min(100, (fleetSize / nextConfig.requirements.fleetSize) * 100)
            },
            activeRoutes: {
                current: activeRoutes,
                required: nextConfig.requirements.activeRoutes,
                percent: Math.min(100, (activeRoutes / nextConfig.requirements.activeRoutes) * 100)
            },
            cumulativeProfit: {
                current: state.cumulativeProfit || 0,
                required: nextConfig.requirements.cumulativeProfit,
                percent: Math.min(100, ((state.cumulativeProfit || 0) / nextConfig.requirements.cumulativeProfit) * 100)
            }
        };
        
        const overallPercent = (
            progress.reputation.percent + 
            progress.fleetSize.percent + 
            progress.activeRoutes.percent + 
            progress.cumulativeProfit.percent
        ) / 4;
        
        return {
            level: currentLevel,
            nextLevel: currentLevel + 1,
            progress,
            overallPercent: Math.round(overallPercent),
            isMaxLevel: false,
            currentConfig: LEVEL_CONFIG[currentLevel],
            nextConfig
        };
    }
}

// ==========================================
// FUNCIONES DE UTILIDAD
// ==========================================

/**
 * Obtener nivel mínimo requerido para un avión
 */
export function getAircraftMinLevel(aircraftId) {
    for (let level = 1; level <= 10; level++) {
        const config = LEVEL_CONFIG[level];
        if (config.unlocks.aircraft.includes(aircraftId)) {
            return level;
        }
    }
    return 10;
}

/**
 * Obtener todos los aviones de un nivel específico
 */
export function getAircraftForLevel(level) {
    const config = LEVEL_CONFIG[level];
    return config ? config.unlocks.aircraft : [];
}

/**
 * Obtener todos los aviones hasta un nivel
 */
export function getAllAircraftUpToLevel(level) {
    const aircraft = [];
    for (let i = 1; i <= level; i++) {
        const config = LEVEL_CONFIG[i];
        if (config) {
            aircraft.push(...config.unlocks.aircraft);
        }
    }
    return [...new Set(aircraft)];
}

/**
 * Obtener configuración de un nivel
 */
export function getLevelConfig(level) {
    return LEVEL_CONFIG[level] || LEVEL_CONFIG[1];
}

/**
 * Obtener bonus de hub por categoría
 */
export function getHubBonus(category) {
    return HUB_CATEGORY_BONUS[category] || HUB_CATEGORY_BONUS['Secondary Hub'];
}

/**
 * Obtener dinero inicial según categoría de hub
 */
export function getStartingMoney(hubCategory) {
    const bonus = HUB_CATEGORY_BONUS[hubCategory];
    return bonus ? bonus.startingMoney : 20000000;
}
