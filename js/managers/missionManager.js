/**
 * MISSION MANAGER - Gestiona el sistema de micro-objetivos
 * Integrado con el game loop para verificar progreso y completar misiones
 */

import { MISSIONS, getMission, canActivateMission, checkMissionSuccess, checkMissionFailure } from '../models/missionsModel.js';

export class MissionManager {
    constructor(game) {
        this.game = game;
        this.activeMission = null;
        this.completedMissions = [];
        this.missionHistory = []; // Historial de misiones completadas
    }

    /**
     * Inicializar el sistema de misiones
     */
    init() {
        // Cargar misiones completadas desde el estado
        if (this.game.state.completedMissions) {
            this.completedMissions = [...this.game.state.completedMissions];
        }
        
        // Buscar misión activa en el estado
        if (this.game.state.activeMission) {
            const missionData = this.game.state.activeMission;
            this.activeMission = getMission(missionData.id);
            if (this.activeMission) {
                // Restaurar progreso de seguimiento
                this.activeMission.trackProgress = missionData.trackProgress || {};
                this.activeMission.activatedAt = missionData.activatedAt;
            }
        }
        
        // Intentar activar una nueva misión si no hay activa
        if (!this.activeMission) {
            this.checkAndActivateMission();
        }
    }

    /**
     * Verificar y activar nuevas misiones
     */
    checkAndActivateMission() {
        // Solo una misión principal activa a la vez
        if (this.activeMission && !this.activeMission.completed) {
            return;
        }

        // Buscar misión que pueda activarse
        const allMissions = Object.values(MISSIONS);
        
        for (const mission of allMissions) {
            // Skip si ya está completada
            if (this.completedMissions.includes(mission.id)) {
                continue;
            }

            // Verificar si puede activarse
            const canActivate = canActivateMission(mission, this.game, this.completedMissions);
            if (canActivate) {
                console.log(`🎯 Intentando activar misión: ${mission.id}`, {
                    completed: this.completedMissions,
                    canActivate
                });
                this.activateMission(mission);
                return;
            }
        }
    }

    /**
     * Activar una misión
     */
    activateMission(mission) {
        if (!mission) return;

        // Crear copia de la misión para modificar
        this.activeMission = {
            ...mission,
            activatedAt: this.game.state.date || Date.now(),
            trackProgress: mission.trackProgress ? { ...mission.trackProgress } : {}
        };

        // Guardar en estado
        this.game.state.activeMission = {
            id: this.activeMission.id,
            activatedAt: this.activeMission.activatedAt,
            trackProgress: this.activeMission.trackProgress
        };

        // Inicializar progreso específico según tipo
        this.initializeMissionProgress(this.activeMission);

        console.log(`🎯 Misión activada: ${this.activeMission.name}`, {
            context: this.activeMission.context,
            objective: this.activeMission.objective
        });

        // Guardar notificación para que UI la muestre cuando esté lista
        if (!this.game.state.missionNotifications) {
            this.game.state.missionNotifications = [];
        }
        this.game.state.missionNotifications.push({
            type: 'activated',
            mission: {
                id: this.activeMission.id,
                name: this.activeMission.name,
                context: this.activeMission.context,
                objective: this.activeMission.objective
            },
            timestamp: Date.now()
        });
    }

    /**
     * Inicializar progreso de seguimiento según tipo de misión
     */
    initializeMissionProgress(mission) {
        if (!mission.trackProgress) return;

        switch (mission.id) {
            case 'M5_CONTROLLED_GROWTH':
                // Inicializar seguimiento de ciclos consecutivos
                mission.trackProgress.positiveCount = 0;
                mission.trackProgress.lastEconomyNet = this.game.state.lastEconomy?.net || 0;
                break;

            case 'M6_BAD_ROUTE':
                // Identificar ruta problemática (bajo rendimiento)
                const allRoutesM6 = this.game.managers.routes.getRoutes() || [];
                const routesM6 = allRoutesM6.filter(r => !r.status || r.status === 'active');
                const problematicRoute = routesM6.find(route => {
                    const routeRevenue = route.dailyRevenue || 0;
                    const costEstimate = route.distance * 10;
                    return routeRevenue > 0 && routeRevenue < costEstimate * 0.8;
                });
                if (problematicRoute) {
                    mission.trackProgress.routeId = problematicRoute.id;
                    mission.trackProgress.initialRevenue = problematicRoute.dailyRevenue || 0;
                }
                break;

            case 'M7_COMPETITOR_ATTACK':
                // Identificar ruta con competencia
                const allRoutesM7 = this.game.managers.routes.getRoutes() || [];
                const routesWithComp = allRoutesM7.filter(r => !r.status || r.status === 'active');
                const competitiveRoute = routesWithComp.find(route => {
                    const competition = this.game.managers.competitors?.getCompetitionLevelForRoute?.(route.origin, route.dest);
                    return competition === 'high' || competition === 'Alta';
                });
                if (competitiveRoute) {
                    mission.trackProgress.routeId = competitiveRoute.id;
                    mission.trackProgress.initialRevenue = competitiveRoute.dailyRevenue || 0;
                }
                break;

            case 'M8_OPERATIONAL_CRISIS':
                // Marcar inicio de crisis
                mission.trackProgress.crisisStarted = true;
                mission.trackProgress.initialMoney = this.game.state.money || 0;
                break;
        }
    }

    /**
     * Actualizar progreso de misiones (llamado desde game loop)
     */
    update() {
        if (!this.activeMission || this.activeMission.completed) {
            this.checkAndActivateMission();
            return;
        }

        // Actualizar progreso según tipo de misión PRIMERO
        this.updateMissionProgress(this.activeMission);

        // Verificar criterios de éxito (después de actualizar progreso)
        if (this.checkMissionSuccessInternal(this.activeMission)) {
            console.log(`✅ Misión ${this.activeMission.id} completada exitosamente`);
            this.completeMission(this.activeMission, true);
            return;
        }

        // Verificar criterios de fallo
        if (this.activeMission.failureCriteria && checkMissionFailure(this.activeMission, this.game)) {
            this.completeMission(this.activeMission, false);
            return;
        }
    }

    /**
     * Verificar éxito de misión (con lógica interna para misiones complejas)
     */
    checkMissionSuccessInternal(mission) {
        if (!mission) return false;

        // Para misiones con criterios simples, usar función estándar
        if (mission.successCriteria.type === 'fleet_size' || 
            mission.successCriteria.type === 'routes_count' ||
            mission.successCriteria.type === 'profit_cycle' ||
            mission.successCriteria.type === 'international_route') {
            const result = checkMissionSuccess(mission, this.game);
            if (result && mission.id === 'M2_FIRST_ROUTE') {
                // Debug para M2
                const routes = this.game.managers.routes.getRoutes() || [];
                console.log(`🔍 M2 Debug: Total rutas: ${routes.length}, Activas: ${routes.filter(r => !r.status || r.status === 'active').length}`);
            }
            return result;
        }

        // Para misiones con seguimiento de progreso
        if (mission.trackProgress) {
            switch (mission.id) {
                case 'M5_CONTROLLED_GROWTH':
                    const required = mission.trackProgress.required || 3;
                    const current = mission.trackProgress.positiveCount || 0;
                    return current >= required;

                case 'M6_BAD_ROUTE':
                    const reqCycles = mission.trackProgress.required || 2;
                    const posCycles = mission.trackProgress.positiveCycles || 0;
                    return posCycles >= reqCycles;

                case 'M7_COMPETITOR_ATTACK':
                    const req = mission.trackProgress.required || 2;
                    const pos = mission.trackProgress.positiveCycles || 0;
                    return pos >= req;

                case 'M8_OPERATIONAL_CRISIS':
                    // Se verifica con checkMissionSuccess estándar
                    return checkMissionSuccess(mission, this.game);

                default:
                    return checkMissionSuccess(mission, this.game);
            }
        }

        return checkMissionSuccess(mission, this.game);
    }

    /**
     * Actualizar progreso específico de cada misión
     */
    updateMissionProgress(mission) {
        if (!mission.trackProgress) return;

        switch (mission.id) {
            case 'M3_FIRST_PROFIT':
                // Ya se verifica en checkMissionSuccess, no necesita tracking adicional
                break;

            case 'M5_CONTROLLED_GROWTH':
                // Seguimiento de ciclos consecutivos positivos
                const lastNet = this.game.state.lastEconomy?.net || 0;
                const previousNet = mission.trackProgress.lastEconomyNet || 0;
                
                if (lastNet > 0) {
                    // Nuevo ciclo positivo
                    if (previousNet > 0 || mission.trackProgress.positiveCount === 0) {
                        mission.trackProgress.positiveCount++;
                    } else {
                        // Se rompió la cadena, reiniciar
                        mission.trackProgress.positiveCount = 1;
                    }
                } else if (lastNet < 0) {
                    // Ciclo negativo, reiniciar contador
                    mission.trackProgress.positiveCount = 0;
                }
                
                mission.trackProgress.lastEconomyNet = lastNet;
                break;

            case 'M6_BAD_ROUTE':
                // Verificar si la ruta fue cerrada
                if (mission.trackProgress.routeId) {
                    const allRoutesM6 = this.game.managers.routes.getRoutes() || [];
                    const route = allRoutesM6.find(r => r.id === mission.trackProgress.routeId);
                    if (!route || (route.status && route.status !== 'active')) {
                        mission.trackProgress.routeClosed = true;
                    } else {
                        // Verificar si la ruta está generando beneficios positivos
                        const lastEconomy = this.game.state.lastEconomy || { net: 0 };
                        if (lastEconomy.net >= 0) {
                            mission.trackProgress.positiveCycles = (mission.trackProgress.positiveCycles || 0) + 1;
                        } else {
                            mission.trackProgress.positiveCycles = 0;
                        }
                    }
                }
                break;

            case 'M7_COMPETITOR_ATTACK':
                // Verificar beneficios en la ruta competitiva
                if (mission.trackProgress.routeId) {
                    const allRoutesM7 = this.game.managers.routes.getRoutes() || [];
                    const route = allRoutesM7.find(r => r.id === mission.trackProgress.routeId);
                    if (route && (!route.status || route.status === 'active')) {
                        const routeRevenue = route.dailyRevenue || 0;
                        if (routeRevenue > 0) {
                            mission.trackProgress.positiveCycles = (mission.trackProgress.positiveCycles || 0) + 1;
                        } else {
                            mission.trackProgress.positiveCycles = 0;
                        }
                    }
                }
                break;

            case 'M8_OPERATIONAL_CRISIS':
                // Verificar supervivencia de la crisis
                if (mission.trackProgress.crisisStarted) {
                    const lastEconomy = this.game.state.lastEconomy || { net: 0 };
                    if (lastEconomy.net > 0 && this.game.state.money > 0) {
                        mission.trackProgress.survivedCycles = (mission.trackProgress.survivedCycles || 0) + 1;
                    }
                }
                break;
        }

        // Guardar progreso en estado
        if (this.game.state.activeMission) {
            this.game.state.activeMission.trackProgress = mission.trackProgress;
        }
    }

    /**
     * Completar una misión (éxito o fallo)
     */
    completeMission(mission, success = true) {
        if (!mission) return;

        mission.completed = true;
        mission.completedAt = this.game.state.date || Date.now();
        mission.success = success;

        // Aplicar recompensas si fue exitosa
        if (success && mission.reward) {
            this.applyRewards(mission.reward);
        }

        // Guardar en historial
        this.completedMissions.push(mission.id);
        this.missionHistory.push({
            id: mission.id,
            name: mission.name,
            completedAt: mission.completedAt,
            success: success,
            reward: success ? mission.reward : null
        });

        // Guardar en estado
        this.game.state.completedMissions = [...this.completedMissions];
        this.game.state.activeMission = null;
        this.game.state.missionHistory = [...this.missionHistory];

        console.log(`${success ? '✅' : '❌'} Misión ${success ? 'completada' : 'fallida'}: ${mission.name}`, {
            id: mission.id,
            reward: success ? mission.reward : null
        });

        // Guardar notificación de completación para UI
        if (!this.game.state.missionNotifications) {
            this.game.state.missionNotifications = [];
        }
        this.game.state.missionNotifications.push({
            type: success ? 'completed' : 'failed',
            mission: {
                id: mission.id,
                name: mission.name,
                context: mission.context,
                reward: success ? mission.reward : null
            },
            timestamp: Date.now()
        });

        // Limpiar misión activa
        this.activeMission = null;

        // Buscar nueva misión para activar
        this.checkAndActivateMission();

        // Auto-guardar
        this.game.save();
    }

    /**
     * Aplicar recompensas de una misión
     */
    applyRewards(reward) {
        if (!reward) return;

        // Reputación
        if (reward.reputation) {
            this.game.state.reputation = (this.game.state.reputation || 50) + reward.reputation;
            this.game.state.reputationHistory.push({
                date: this.game.state.date,
                delta: reward.reputation,
                reason: `Misión completada`,
                routeId: null
            });
        }

        // Dinero
        if (reward.money) {
            this.game.state.money = (this.game.state.money || 0) + reward.money;
        }

        // Reducción temporal de costes (para M5)
        if (reward.costReduction) {
            this.game.state.temporaryCostReduction = {
                multiplier: 1 - reward.costReduction,
                expiresAt: this.game.state.date + (3 * 24 * 60 * 60 * 1000), // 3 días
                reason: 'Crecimiento controlado'
            };
        }

        // Desbloqueos (ya se manejan automáticamente con requires)
    }

    /**
     * Obtener misión activa
     */
    getActiveMission() {
        return this.activeMission;
    }

    /**
     * Obtener progreso de misión activa (para UI)
     */
    getMissionProgress() {
        if (!this.activeMission) return null;

        const progress = {
            mission: this.activeMission,
            progress: 0,
            description: ''
        };

        // Calcular progreso según tipo
        switch (this.activeMission.id) {
            case 'M5_CONTROLLED_GROWTH':
                const required = this.activeMission.trackProgress?.required || 3;
                const current = this.activeMission.trackProgress?.positiveCount || 0;
                progress.progress = Math.min(100, (current / required) * 100);
                progress.description = `${current}/${required} ciclos positivos`;
                break;

            case 'M6_BAD_ROUTE':
            case 'M7_COMPETITOR_ATTACK':
                const reqCycles = this.activeMission.trackProgress?.required || 2;
                const posCycles = this.activeMission.trackProgress?.positiveCycles || 0;
                progress.progress = Math.min(100, (posCycles / reqCycles) * 100);
                progress.description = `${posCycles}/${reqCycles} ciclos beneficiosos`;
                break;

            case 'M8_OPERATIONAL_CRISIS':
                progress.progress = this.activeMission.trackProgress?.crisisStarted ? 50 : 0;
                progress.description = this.activeMission.trackProgress?.crisisStarted ? 'Superviviendo crisis...' : 'Esperando crisis';
                break;

            default:
                progress.progress = 0;
                progress.description = 'En progreso...';
        }

        return progress;
    }

    /**
     * Cargar datos del estado guardado
     */
    loadData(data) {
        if (data) {
            this.completedMissions = data.completedMissions || [];
            this.missionHistory = data.missionHistory || [];
        }
    }

    /**
     * Obtener datos para guardar
     */
    getData() {
        return {
            completedMissions: this.completedMissions,
            missionHistory: this.missionHistory,
            activeMission: this.activeMission ? {
                id: this.activeMission.id,
                trackProgress: this.activeMission.trackProgress
            } : null
        };
    }
}
