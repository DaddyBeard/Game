/**
 * MISSIONS MODEL - Sistema de Micro-Objetivos
 * Define todas las misiones del juego según sky_tycoon_situaciones_y_misiones_de_micro_objetivos.md
 */

export const MISSIONS = {
    // BLOQUE 1 – EARLY GAME
    M1_FIRST_PLANE: {
        id: 'M1_FIRST_PLANE',
        name: 'Nuestro primer avión',
        context: 'La aerolínea aún no tiene flota. No hay negocio sin aviones.',
        category: 'early',
        activation: {
            type: 'condition',
            check: (game) => {
                const fleetSize = game.managers.fleet.ownedPlanes?.length || 0;
                return fleetSize === 0;
            }
        },
        objective: 'Comprar cualquier avión disponible',
        successCriteria: {
            type: 'fleet_size',
            value: 1,
            check: (game) => {
                const fleetSize = game.managers.fleet.ownedPlanes?.length || 0;
                const result = fleetSize >= 1;
                if (result) {
                    console.log(`✅ M1: Flota tiene ${fleetSize} avión(es)`);
                }
                return result;
            }
        },
        failureCriteria: null, // No aplica
        reward: {
            reputation: 10,
            money: 50000,
            unlock: 'M2_FIRST_ROUTE'
        },
        consequence: 'Desbloquea misiones de rutas',
        completed: false
    },

    M2_FIRST_ROUTE: {
        id: 'M2_FIRST_ROUTE',
        name: 'La primera ruta',
        context: 'Un avión parado es dinero perdido. Es hora de volar.',
        category: 'early',
        activation: {
            type: 'condition',
            check: (game) => {
                const fleetSize = game.managers.fleet.ownedPlanes?.length || 0;
                const routes = game.managers.routes.getRoutes() || [];
                // Verificar rutas activas (con status 'active' o sin status para compatibilidad)
                const routesCount = routes.filter(r => !r.status || r.status === 'active').length;
                return fleetSize >= 1 && routesCount === 0;
            },
            requires: ['M1_FIRST_PLANE'] // Requiere que M1 esté completada
        },
        objective: 'Abrir una ruta doméstica',
        successCriteria: {
            type: 'routes_count',
            value: 1,
            check: (game) => {
                const routes = game.managers.routes.getRoutes() || [];
                // Verificar rutas activas (con status 'active' o sin status definido para compatibilidad)
                const activeRoutes = routes.filter(r => !r.status || r.status === 'active');
                const routesCount = activeRoutes.length;
                const result = routesCount >= 1;
                if (result) {
                    console.log(`✅ M2: Se encontraron ${routesCount} ruta(s) activa(s)`, {
                        totalRoutes: routes.length,
                        activeRoutes: activeRoutes.map(r => ({ id: r.id, origin: r.origin, dest: r.dest, status: r.status }))
                    });
                } else {
                    console.log(`⏳ M2: Esperando ruta... Total: ${routes.length}, Activas: ${routesCount}`);
                }
                return result;
            }
        },
        failureCriteria: null,
        reward: {
            reputation: 15,
            money: 100000,
            unlock: 'M3_FIRST_PROFIT'
        },
        consequence: 'Comienza el ciclo económico',
        completed: false
    },

    M3_FIRST_PROFIT: {
        id: 'M3_FIRST_PROFIT',
        name: 'El primer beneficio',
        context: 'No basta con volar, hay que ganar dinero.',
        category: 'early',
        activation: {
            type: 'condition',
            check: (game) => {
                const routes = game.managers.routes.getRoutes() || [];
                const routesCount = routes.filter(r => !r.status || r.status === 'active').length;
                return routesCount >= 1;
            },
            requires: ['M2_FIRST_ROUTE']
        },
        objective: 'Obtener beneficio neto positivo en un ciclo',
        successCriteria: {
            type: 'profit_cycle',
            value: 1,
            check: (game) => {
                // Verificar que hubo beneficio en el último ciclo económico
                const lastEconomy = game.state.lastEconomy || { net: 0 };
                return lastEconomy.net > 0;
            }
        },
        failureCriteria: null,
        reward: {
            reputation: 20,
            money: 150000,
            unlock: null
        },
        consequence: 'Se presenta el concepto de rentabilidad',
        completed: false,
        trackProgress: {
            type: 'economy_cycles',
            consecutive: false,
            positiveCount: 0
        }
    },

    // BLOQUE 2 – MID GAME
    M4_INTERNATIONAL: {
        id: 'M4_INTERNATIONAL',
        name: 'Más allá de casa',
        context: 'El mercado local se queda pequeño.',
        category: 'mid',
        activation: {
            type: 'condition',
            check: (game) => {
                const level = game.state.level || 1;
                const hasStableProfit = game.state.cumulativeProfit > 500000; // Beneficios estables
                return level >= 3 && hasStableProfit;
            }
        },
        objective: 'Abrir primera ruta internacional',
        successCriteria: {
            type: 'international_route',
            check: (game) => {
                const allRoutes = game.managers.routes.getRoutes() || [];
                const routes = allRoutes.filter(r => !r.status || r.status === 'active');
                const mainHub = game.state.mainHub;
                if (!mainHub) return false;
                
                const mainHubRegion = game.state.mainHubRegion;
                const mainAirport = game.managers.routes.getAirport(mainHub);
                
                // Una ruta es internacional si va a otra región
                return routes.some(route => {
                    const destAirport = game.managers.routes.getAirport(route.dest);
                    return destAirport && destAirport.regionId && destAirport.regionId !== mainHubRegion;
                });
            }
        },
        failureCriteria: {
            type: 'severe_losses',
            check: (game) => {
                const lastEconomy = game.state.lastEconomy || { net: 0 };
                return lastEconomy.net < -1000000; // Pérdidas severas
            }
        },
        reward: {
            reputation: 30,
            money: 250000,
            unlock: null
        },
        consequence: 'Se desbloquean rutas largas',
        completed: false
    },

    M5_CONTROLLED_GROWTH: {
        id: 'M5_CONTROLLED_GROWTH',
        name: 'Crecimiento controlado',
        context: 'Crecer demasiado rápido puede destruir una aerolínea.',
        category: 'mid',
        activation: {
            type: 'condition',
            check: (game) => {
                const routes = game.managers.routes.getRoutes() || [];
                const routesCount = routes.filter(r => !r.status || r.status === 'active').length;
                return routesCount >= 3;
            }
        },
        objective: 'Mantener beneficios durante 3 ciclos',
        successCriteria: {
            type: 'consecutive_profit',
            value: 3,
            check: (game) => {
                // Se verifica en el MissionManager
                return false; // Delegado al manager
            }
        },
        failureCriteria: {
            type: 'negative_cycle',
            check: (game) => {
                const lastEconomy = game.state.lastEconomy || { net: 0 };
                return lastEconomy.net < 0;
            }
        },
        reward: {
            reputation: 25,
            money: 200000,
            costReduction: 0.1, // 10% reducción temporal de costes (3 ciclos)
            unlock: null
        },
        consequence: 'Introduce estabilidad como mecánica',
        completed: false,
        trackProgress: {
            type: 'economy_cycles',
            consecutive: true,
            positiveCount: 0,
            required: 3
        }
    },

    // BLOQUE 3 – MID/LATE GAME
    M6_BAD_ROUTE: {
        id: 'M6_BAD_ROUTE',
        name: 'Ruta problemática',
        context: 'Una ruta genera ingresos, pero está perdiendo dinero.',
        category: 'mid_late',
        activation: {
            type: 'condition',
            check: (game) => {
                const allRoutes = game.managers.routes.getRoutes() || [];
                const routes = allRoutes.filter(r => !r.status || r.status === 'active');
                // Buscar ruta con beneficios negativos pero que aún genera ingresos
                return routes.some(route => {
                    // Una ruta problemática es una que tiene ingresos pero genera pérdidas netas
                    // Por ahora verificamos si hay rutas con bajo rendimiento (ingresos < costos estimados)
                    const routeRevenue = route.dailyRevenue || 0;
                    // Simplificado: si una ruta tiene ingresos muy bajos comparado con la distancia (señal de problemas)
                    const costEstimate = route.distance * 10; // Estimación simple
                    return routeRevenue > 0 && routeRevenue < costEstimate * 0.8;
                });
            }
        },
        objective: 'Recuperar la rentabilidad sin cerrar la ruta',
        successCriteria: {
            type: 'route_recovery',
            value: 2,
            check: (game) => {
                // Se verifica en el MissionManager
                return false;
            }
        },
        failureCriteria: {
            type: 'route_closed',
            check: (game, mission) => {
                // Verificar si la ruta problemática fue cerrada
                return mission.trackProgress?.routeClosed || false;
            }
        },
        reward: {
            reputation: 20,
            money: 150000,
            unlock: null
        },
        consequence: 'Enseña gestión de crisis',
        completed: false,
        trackProgress: {
            type: 'route_recovery',
            routeId: null,
            positiveCycles: 0,
            required: 2,
            routeClosed: false
        }
    },

    M7_COMPETITOR_ATTACK: {
        id: 'M7_COMPETITOR_ATTACK',
        name: 'La competencia ataca',
        context: 'Una aerolínea rival entra en tu mercado principal.',
        category: 'mid_late',
        activation: {
            type: 'condition',
            check: (game) => {
                const allRoutes = game.managers.routes.getRoutes() || [];
                const routes = allRoutes.filter(r => !r.status || r.status === 'active');
                // Buscar rutas con competencia alta
                return routes.some(route => {
                    const competition = game.managers.competitors?.getCompetitionLevelForRoute?.(route.origin, route.dest);
                    return competition === 'high' || competition === 'Alta';
                });
            }
        },
        objective: 'Mantener beneficios en esa ruta',
        successCriteria: {
            type: 'competitor_resistance',
            value: 2,
            check: (game) => {
                // Se verifica en el MissionManager
                return false;
            }
        },
        failureCriteria: {
            type: 'route_loss',
            check: (game, mission) => {
                const trackedRoute = mission.trackProgress?.routeId;
                if (!trackedRoute) return false;
                
                const route = game.managers.routes.getRoutes()?.find(r => r.id === trackedRoute);
                if (!route || route.status !== 'active') return false;
                
                const lastEconomy = game.state.lastEconomy || { net: 0 };
                return route.dailyRevenue < 0 || lastEconomy.net < 0;
            }
        },
        reward: {
            reputation: 30,
            money: 200000,
            unlock: null
        },
        consequence: 'Humaniza a la IA rival',
        completed: false,
        trackProgress: {
            type: 'competitor_battle',
            routeId: null,
            positiveCycles: 0,
            required: 2
        }
    },

    // BLOQUE 4 – LATE GAME
    M8_OPERATIONAL_CRISIS: {
        id: 'M8_OPERATIONAL_CRISIS',
        name: 'Crisis operacional',
        context: 'Un aumento de costes amenaza la estabilidad.',
        category: 'late',
        activation: {
            type: 'event',
            check: (game) => {
                // Se activa por evento aleatorio de costes
                const activeEvents = game.state.activeEvents || [];
                return activeEvents.some(e => 
                    e.type === 'COST_INCREASE' || 
                    e.type === 'FUEL_CRISIS' ||
                    (e.costMultiplier && e.costMultiplier > 1.2)
                );
            }
        },
        objective: 'Evitar pérdidas globales',
        successCriteria: {
            type: 'crisis_survival',
            check: (game, mission) => {
                // Sobrevivir la crisis manteniendo balance positivo
                if (!mission.trackProgress?.crisisStarted) return false;
                
                const lastEconomy = game.state.lastEconomy || { net: 0 };
                return lastEconomy.net > 0 && game.state.money > 0;
            }
        },
        failureCriteria: {
            type: 'excessive_debt',
            check: (game) => {
                const totalDebt = game.managers.economy?.getTotalDebt?.() || 0;
                return totalDebt > game.state.money * 2; // Deuda excesiva
            }
        },
        reward: {
            reputation: 50,
            money: 500000,
            unlock: null
        },
        consequence: 'Refuerza la sensación de liderazgo',
        completed: false,
        trackProgress: {
            type: 'crisis_survival',
            crisisStarted: false,
            survivedCycles: 0,
            required: 1
        }
    }
};

/**
 * Obtener misión por ID
 */
export function getMission(id) {
    return MISSIONS[id] ? { ...MISSIONS[id] } : null;
}

/**
 * Obtener todas las misiones de una categoría
 */
export function getMissionsByCategory(category) {
    return Object.values(MISSIONS).filter(m => m.category === category);
}

/**
 * Obtener misiones completadas
 */
export function getCompletedMissions(completedIds = []) {
    return completedIds.map(id => getMission(id)).filter(m => m !== null);
}

/**
 * Verificar si una misión puede activarse
 */
export function canActivateMission(mission, game, completedMissions = []) {
    if (!mission) return false;
    if (mission.completed) return false;
    
    // Verificar requisitos previos
    if (mission.activation.requires) {
        const hasAllRequirements = mission.activation.requires.every(reqId => 
            completedMissions.includes(reqId)
        );
        if (!hasAllRequirements) return false;
    }
    
    // Verificar condición de activación
    try {
        return mission.activation.check(game);
    } catch (error) {
        console.error(`Error checking activation for mission ${mission.id}:`, error);
        return false;
    }
}

/**
 * Verificar criterios de éxito de una misión
 */
export function checkMissionSuccess(mission, game) {
    if (!mission || !mission.successCriteria) return false;
    
    try {
        if (mission.successCriteria.check) {
            return mission.successCriteria.check(game, mission);
        }
        return false;
    } catch (error) {
        console.error(`Error checking success for mission ${mission.id}:`, error);
        return false;
    }
}

/**
 * Verificar criterios de fallo de una misión
 */
export function checkMissionFailure(mission, game) {
    if (!mission || !mission.failureCriteria) return false;
    
    try {
        if (mission.failureCriteria.check) {
            return mission.failureCriteria.check(game, mission);
        }
        return false;
    } catch (error) {
        console.error(`Error checking failure for mission ${mission.id}:`, error);
        return false;
    }
}
