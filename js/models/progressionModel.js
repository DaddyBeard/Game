/**
 * PROGRESSION MODEL - Wrapper de Compatibilidad
 * Mantiene compatibilidad con código existente usando levelSystem.js
 */

import { LEVEL_CONFIG, getAircraftMinLevel, getAllAircraftUpToLevel } from './levelSystem.js';

// Generar LEVEL_REQUIREMENTS desde LEVEL_CONFIG para compatibilidad
export const LEVEL_REQUIREMENTS = {};

for (let level = 1; level <= 10; level++) {
    const config = LEVEL_CONFIG[level];
    LEVEL_REQUIREMENTS[level] = {
        level: level,
        reputation: config.requirements.reputation,
        fleetSize: config.requirements.fleetSize,
        activeRoutes: config.requirements.activeRoutes,
        cumulativeProfit: config.requirements.cumulativeProfit,
        unlocksAircraft: config.unlocks.aircraft,
        unlocksHub: config.unlocks.hubCategories.length > 0
    };
}

/**
 * Obtener requisitos para un nivel
 */
export function getLevelRequirements(level) {
    return LEVEL_REQUIREMENTS[level] || LEVEL_REQUIREMENTS[1];
}

/**
 * Verificar si un avión está desbloqueado para un nivel
 */
export function isAircraftUnlockedForLevel(aircraftId, playerLevel) {
    const minLevel = getAircraftMinLevel(aircraftId);
    return playerLevel >= minLevel;
}

/**
 * Obtener todos los aviones desbloqueados hasta un nivel
 */
export function getAllUnlockedAircraft(playerLevel) {
    return getAllAircraftUpToLevel(playerLevel);
}

// Re-exportar funciones del levelSystem
export { getAircraftMinLevel, LEVEL_CONFIG } from './levelSystem.js';
