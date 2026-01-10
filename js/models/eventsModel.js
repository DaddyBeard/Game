/**
 * PLANNED EVENTS SYSTEM
 * 
 * Generates scheduled events that affect demand, revenue, and costs
 * Events are probabilistic daily occurrences that impact game economy
 */

export const PLANNED_EVENTS = {
    // POSITIVE EVENTS
    festival: {
        id: 'festival',
        name: '🎉 Festival Local',
        type: 'positive',
        demandMultiplier: 1.30,  // +30% demand
        durationDays: 3,
        affectedRoutes: 'regional',  // Affects routes within 800km
        description: 'Festival local aumenta turismo y demanda de vuelos cortos'
    },
    
    conference: {
        id: 'conference',
        name: '💼 Conferencia de Negocios',
        type: 'positive',
        demandMultiplier: 1.25,
        durationDays: 2,
        affectedRoutes: 'major',  // Affects major business routes
        description: 'Conferencia aumenta viajeros de negocios'
    },
    
    holiday: {
        id: 'holiday',
        name: '🎊 Vacaciones Escolares',
        type: 'positive',
        demandMultiplier: 1.20,
        durationDays: 7,
        affectedRoutes: 'all',
        description: 'Vacaciones escolares impulsan viajes en familia'
    },
    
    sports: {
        id: 'sports',
        name: '🏆 Evento Deportivo',
        type: 'positive',
        demandMultiplier: 1.35,
        durationDays: 4,
        affectedRoutes: 'specific',  // Only certain routes
        description: 'Evento deportivo atrae aficionados'
    },
    
    weather_good: {
        id: 'weather_good',
        name: '☀️ Buen Tiempo',
        type: 'positive',
        demandMultiplier: 1.10,
        durationDays: 2,
        affectedRoutes: 'all',
        description: 'Buen clima favorece viajes'
    },
    
    // NEGATIVE EVENTS
    strike: {
        id: 'strike',
        name: '✈️ Huelga Gremial',
        type: 'negative',
        demandMultiplier: 0.60,  // -40% demand
        costMultiplier: 1.50,    // +50% costs
        durationDays: 3,
        affectedRoutes: 'all',
        description: 'Huelga reduce demanda y aumenta costos'
    },
    
    weather_bad: {
        id: 'weather_bad',
        name: '⛈️ Tormenta',
        type: 'negative',
        demandMultiplier: 0.75,  // -25% demand
        costMultiplier: 1.20,    // +20% costs (delays, fuel)
        durationDays: 2,
        affectedRoutes: 'all',
        description: 'Tormenta causa cancelaciones y retrasos'
    },
    
    congestion: {
        id: 'congestion',
        name: '🛫 Congestión Aeroportuaria',
        type: 'negative',
        demandMultiplier: 0.85,  // -15% demand
        costMultiplier: 1.35,    // +35% costs (waiting, delays)
        durationDays: 1,
        affectedRoutes: 'major',
        description: 'Congestión causa retrasos y costos adicionales'
    },
    
    fuel_spike: {
        id: 'fuel_spike',
        name: '⛽ Pico de Combustible',
        type: 'negative',
        costMultiplier: 1.40,    // +40% fuel costs
        durationDays: 5,
        affectedRoutes: 'all',
        description: 'Subida del precio del combustible'
    },
    
    demand_drop: {
        id: 'demand_drop',
        name: '📉 Caída de Demanda',
        type: 'negative',
        demandMultiplier: 0.70,  // -30% demand
        durationDays: 3,
        affectedRoutes: 'all',
        description: 'Baja demanda general en el mercado'
    },
    
    // SPECIAL EVENTS
    new_competitor: {
        id: 'new_competitor',
        name: '🚀 Nuevo Competidor',
        type: 'competitive',
        demandMultiplier: 0.90,  // -10% demand (market share)
        durationDays: 14,
        affectedRoutes: 'all',
        description: 'Nueva aerolínea entra al mercado'
    },
    
    runway_maintenance: {
        id: 'runway_maintenance',
        name: '🔧 Mantenimiento de Pista',
        type: 'operational',
        costMultiplier: 1.25,    // +25% costs (longer delays)
        durationDays: 3,
        affectedRoutes: 'specific',
        description: 'Cierre parcial de pista aumenta costos'
    }
};

/**
 * Event probabilities per day (values 0-1)
 * Higher = more likely to occur
 */
export const EVENT_PROBABILITIES = {
    festival: 0.02,        // 2% chance daily
    conference: 0.03,
    holiday: 0.01,         // Less frequent
    sports: 0.02,
    weather_good: 0.05,    // More frequent
    weather_bad: 0.08,
    strike: 0.01,          // Rare
    congestion: 0.04,
    fuel_spike: 0.02,
    demand_drop: 0.03,
    new_competitor: 0.005, // Very rare
    runway_maintenance: 0.01
};

/**
 * Check if event should trigger today
 * Returns: { triggered: boolean, event: eventObj | null }
 */
export function checkEventOccurrence() {
    for (const [eventId, probability] of Object.entries(EVENT_PROBABILITIES)) {
        if (Math.random() < probability) {
            const event = PLANNED_EVENTS[eventId];
            return {
                triggered: true,
                event: { ...event, startDate: Date.now() }
            };
        }
    }
    return { triggered: false, event: null };
}

/**
 * Get all active events for a given date
 * Returns array of active event objects
 */
export function getActiveEvents(gameState) {
    const now = gameState.date || Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    return (gameState.activeEvents || []).filter(evt => {
        const age = (now - evt.startDate) / oneDay;
        return age < evt.durationDays;
    });
}

/**
 * Calculate cumulative demand multiplier from all active events
 * Returns number: 0.5 to 2.0
 */
export function calculateEventDemandMultiplier(gameState) {
    const active = getActiveEvents(gameState);
    let multiplier = 1.0;
    
    active.forEach(evt => {
        if (evt.demandMultiplier) {
            multiplier *= evt.demandMultiplier;
        }
    });
    
    return Math.max(0.5, Math.min(2.0, multiplier));
}

/**
 * Calculate cumulative cost multiplier from all active events
 * Returns number: 0.8 to 2.0
 */
export function calculateEventCostMultiplier(gameState) {
    const active = getActiveEvents(gameState);
    let multiplier = 1.0;
    
    active.forEach(evt => {
        if (evt.costMultiplier) {
            multiplier *= evt.costMultiplier;
        }
    });
    
    return Math.max(0.8, Math.min(2.0, multiplier));
}

/**
 * Check if event affects specific route
 * Returns boolean
 */
export function eventAffectsRoute(event, originId, destId, allAirports) {
    if (event.affectedRoutes === 'all') return true;
    
    if (event.affectedRoutes === 'regional') {
        // Only regional routes (< 800km)
        const origin = allAirports[originId];
        const dest = allAirports[destId];
        if (!origin || !dest) return false;
        
        const dx = origin.lat - dest.lat;
        const dy = origin.lon - dest.lon;
        const distKm = Math.sqrt(dx * dx + dy * dy) * 111; // Rough conversion
        return distKm < 800;
    }
    
    if (event.affectedRoutes === 'major') {
        // Only major airports (pop > 2M)
        const origin = allAirports[originId];
        const dest = allAirports[destId];
        if (!origin || !dest) return false;
        return (origin.pop > 2) && (dest.pop > 2);
    }
    
    // 'specific' = randomly affects some routes
    if (event.affectedRoutes === 'specific') {
        return Math.random() < 0.6; // 60% affected
    }
    
    return true;
}
