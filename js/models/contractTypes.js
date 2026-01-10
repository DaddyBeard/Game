/**
 * SISTEMA DE CONTRATOS CORPORATIVOS — TIPOS POR TIER
 * Basado en nivel del jugador (1-10)
 * Cada tier aumenta complejidad, requisitos y recompensas
 */

export const CONTRACT_TIERS = {
    // ==============================================
    // NIVEL 1-2: CONTRATOS LOCALES (INTRODUCCIÓN)
    // ==============================================
    LOCAL: {
        tier: 'LOCAL',
        minLevel: 1,
        maxLevel: 2,
        companies: [
            'Local Transport Co',
            'Regional Travel Agency',
            'City Business Group',
            'Municipal Government',
            'Local University',
            'Hospital Network'
        ],
        durationDays: { min: 7, max: 14 },
        dailyRevenueMultiplier: { min: 0.10, max: 0.20 }, // 10-20% del ingreso ruta
        requirements: {
            minRoutes: 1,
            minFleet: 1,
            minReputation: 40,
            hubRequired: false,
            maxActiveContracts: 1
        },
        operativeRequirements: {
            minPunctuality: 85, // %
            maxCancellations: 3,
            priceStability: null // No se requiere
        },
        penalties: {
            fineMultiplier: 0.20, // 20% del ingreso diario
            reputationLoss: 5,
            forcedCancel: false
        },
        rewards: {
            reputationBonus: 2,
            unlockSpecial: null
        },
        description: 'Empresa local buscando servicio de transporte básico. Bajo riesgo, bajo retorno.'
    },

    // ==============================================
    // NIVEL 3-4: CONTRATOS REGIONALES
    // ==============================================
    REGIONAL: {
        tier: 'REGIONAL',
        minLevel: 3,
        maxLevel: 4,
        companies: [
            'Regional Airlines Group',
            'State Transport Ministry',
            'Regional Corporation',
            'Chamber of Commerce',
            'Telecom Regional',
            'Banking Group'
        ],
        durationDays: { min: 14, max: 30 },
        dailyRevenueMultiplier: { min: 0.20, max: 0.35 }, // 20-35%
        requirements: {
            minRoutes: 2,
            minFleet: 2,
            minReputation: 55,
            hubRequired: false,
            maxActiveContracts: 1
        },
        operativeRequirements: {
            minPunctuality: 88,
            maxCancellations: 2,
            priceStability: false // Cambios de precio penalizados
        },
        penalties: {
            fineMultiplier: 0.30,
            reputationLoss: 10,
            forcedCancel: false
        },
        rewards: {
            reputationBonus: 5,
            unlockSpecial: null
        },
        description: 'Corporación regional. Requiere estabilidad operativa y relaciones duraderas.'
    },

    // ==============================================
    // NIVEL 5-6: CONTRATOS NACIONALES
    // ==============================================
    NATIONAL: {
        tier: 'NATIONAL',
        minLevel: 5,
        maxLevel: 6,
        companies: [
            'National Government',
            'Ministry of Defense',
            'National Airways',
            'National Telecom',
            'National Finance Corp',
            'Strategic Industry Group'
        ],
        durationDays: { min: 30, max: 60 },
        dailyRevenueMultiplier: { min: 0.35, max: 0.50 }, // 35-50%
        requirements: {
            minRoutes: 3,
            minFleet: 4,
            minReputation: 70,
            hubRequired: true,
            maxActiveContracts: 2
        },
        operativeRequirements: {
            minPunctuality: 90,
            maxCancellations: 1,
            priceStability: true // Precios fijos
        },
        penalties: {
            fineMultiplier: 0.50,
            reputationLoss: 15,
            forcedCancel: true // Posible cancelación automática
        },
        rewards: {
            reputationBonus: 10,
            unlockSpecial: 'national_hub_discount'
        },
        description: 'Contrato nacional estratégico. Exige operación profesional y hub dedicado.'
    },

    // ==============================================
    // NIVEL 7-8: CONTRATOS MULTINACIONALES
    // ==============================================
    MULTINATIONAL: {
        tier: 'MULTINATIONAL',
        minLevel: 7,
        maxLevel: 8,
        companies: [
            'Global Corporation Inc',
            'International Logistics',
            'Multinational Bank',
            'Global Tech Company',
            'International Airlines',
            'World Trade Organization'
        ],
        durationDays: { min: 60, max: 90 },
        dailyRevenueMultiplier: { min: 0.50, max: 0.70 }, // 50-70%
        requirements: {
            minRoutes: 5,
            minFleet: 8,
            minReputation: 80,
            hubRequired: true,
            multipleHubsRequired: 2,
            maxActiveContracts: 2
        },
        operativeRequirements: {
            minPunctuality: 93,
            maxCancellations: 0,
            priceStability: true
        },
        penalties: {
            fineMultiplier: 0.75,
            reputationLoss: 20,
            forcedCancel: true
        },
        rewards: {
            reputationBonus: 15,
            unlockSpecial: 'multinational_premium'
        },
        description: 'Corporación multinacional. Define tu aerolínea como socio corporativo profesional.'
    },

    // ==============================================
    // NIVEL 9-10: CONTRATOS GLOBALES ESTRATÉGICOS
    // ==============================================
    GLOBAL: {
        tier: 'GLOBAL',
        minLevel: 9,
        maxLevel: 10,
        companies: [
            'United Nations',
            'Global Parliament',
            'World Health Organization',
            'International Space Agency',
            'Global Alliance',
            'Strategic Partnership'
        ],
        durationDays: { min: 90, max: 180 },
        dailyRevenueMultiplier: { min: 0.70, max: 0.90 }, // 70-90%
        requirements: {
            minRoutes: 8,
            minFleet: 12,
            minReputation: 90,
            hubRequired: true,
            multipleHubsRequired: 3,
            maxActiveContracts: 3
        },
        operativeRequirements: {
            minPunctuality: 95,
            maxCancellations: 0,
            priceStability: true
        },
        penalties: {
            fineMultiplier: 1.0,
            reputationLoss: 30,
            forcedCancel: true
        },
        rewards: {
            reputationBonus: 20,
            unlockSpecial: 'global_prestige'
        },
        description: 'Apuesta estratégica global. Raro pero transformacional. Define tu legado en la industria.'
    }
};

/**
 * Obtener tier de contrato según nivel
 * @param {number} playerLevel - Nivel del jugador (1-10)
 * @returns {string} Tier ('LOCAL', 'REGIONAL', 'NATIONAL', 'MULTINATIONAL', 'GLOBAL')
 */
export function getTierForLevel(playerLevel) {
    if (playerLevel <= 2) return 'LOCAL';
    if (playerLevel <= 4) return 'REGIONAL';
    if (playerLevel <= 6) return 'NATIONAL';
    if (playerLevel <= 8) return 'MULTINATIONAL';
    return 'GLOBAL';
}

/**
 * Obtener tiers disponibles para nivel del jugador
 * @param {number} playerLevel
 * @returns {Array} Lista de tiers disponibles
 */
export function getAvailableTiers(playerLevel) {
    const available = [];
    Object.values(CONTRACT_TIERS).forEach(tier => {
        if (playerLevel >= tier.minLevel && playerLevel <= tier.maxLevel) {
            available.push(tier);
        }
    });
    return available;
}

/**
 * Generar nombre de empresa aleatorio
 * @param {string} tier - Tier del contrato
 * @returns {string} Nombre de empresa
 */
export function getRandomCompanyName(tier) {
    const tierData = CONTRACT_TIERS[tier];
    const companies = tierData.companies;
    return companies[Math.floor(Math.random() * companies.length)];
}

/**
 * Calcular ingresos diarios para contrato
 * @param {number} routeBaseDailyRevenue - Ingresos base de la ruta
 * @param {string} tier - Tier del contrato
 * @returns {number} Ingresos garantizados diarios
 */
export function calculateContractDailyRevenue(routeBaseDailyRevenue, tier) {
    const tierData = CONTRACT_TIERS[tier];
    const { min, max } = tierData.dailyRevenueMultiplier;
    const multiplier = min + (Math.random() * (max - min));
    return Math.round(routeBaseDailyRevenue * multiplier);
}

/**
 * Calcular duración de contrato
 * @param {string} tier
 * @returns {number} Duración en días
 */
export function getContractDuration(tier) {
    const tierData = CONTRACT_TIERS[tier];
    const { min, max } = tierData.durationDays;
    return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Validar si jugador puede aceptar contrato de tier
 * @param {object} gameState - Estado del juego
 * @param {string} tier - Tier a validar
 * @returns {object} {valid: boolean, reason?: string}
 */
export function validateContractTier(gameState, tier) {
    const tierData = CONTRACT_TIERS[tier];
    
    if (gameState.level < tierData.minLevel) {
        return { valid: false, reason: `Necesitas nivel ${tierData.minLevel}` };
    }
    
    if (gameState.reputation < tierData.requirements.minReputation) {
        return { valid: false, reason: `Necesitas reputación ${tierData.requirements.minReputation}` };
    }
    
    const activeRoutes = gameState.routes ? gameState.routes.filter(r => r.status === 'active').length : 0;
    if (activeRoutes < tierData.requirements.minRoutes) {
        return { valid: false, reason: `Necesitas ${tierData.requirements.minRoutes} rutas activas` };
    }
    
    const fleetSize = gameState.fleet ? gameState.fleet.length : 0;
    if (fleetSize < tierData.requirements.minFleet) {
        return { valid: false, reason: `Necesitas flota de ${tierData.requirements.minFleet} aviones` };
    }
    
    if (tierData.requirements.hubRequired && !gameState.mainHub) {
        return { valid: false, reason: 'Necesitas un hub principal activo' };
    }
    
    // Verificar límite de contratos activos
    const activeContracts = (gameState.corporateContracts || []).filter(c => c.status === 'active').length;
    if (activeContracts >= tierData.requirements.maxActiveContracts) {
        return { valid: false, reason: `Máximo ${tierData.requirements.maxActiveContracts} contratos para este tier` };
    }
    
    return { valid: true };
}
