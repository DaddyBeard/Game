/**
 * Core Game Logic
 */
import { TimeManager } from '../managers/timeManager.js';
import { EconomyManager } from '../managers/economyManager.js';
import { StoryManager } from '../story/storyManager.js';
import { FleetManager } from '../managers/fleetManager.js';
import { RouteManager } from '../managers/routeManager.js';
import { CompetitorManager } from '../managers/competitorManager.js';
import { MissionManager } from '../managers/missionManager.js';
import { AIRPORTS, Airport } from '../models/airport.js';
import { DB } from './db.js';
import { LEVEL_REQUIREMENTS } from '../models/progressionModel.js';
import { LevelSystem, getStartingMoney } from '../models/levelSystem.js';
import { getRegionByAirport } from '../models/regionsData.js';

export class GameManager {
    constructor() {
        this.state = {
            companyName: "SkyStart Airlines",
            companyIATA: null, // Código IATA de la aerolínea (ej: MAD para Madrid)
            money: 999999999, // 999M Start
            reputation: 50,
            reputationHistory: [], // [{date, delta, reason, routeId}]
            energy: 100, // Action points for manual tasks
            date: new Date(2025, 0, 1).getTime(),
            level: 1,
            isPaused: false,
            lastEconomy: { gross: 0, costs: 0, net: 0 },
            mainHub: null, // Hub principal seleccionado
            mainHubCategory: null, // Categoría del hub principal (para cálculos de alcance)
            mainHubRegion: null, // Región del hub principal (para expansión regional)
            hubs: {}, // {hubId: {id, name, slots, dailyFee, level, ...}}
            cumulativeProfit: 0, // Suma de beneficios netos (nunca baja)
            levelUpNotifications: [],
            economyHistory: [], // [{date, revenue, costs, net, margin%, avgLoad, fuelIndex, seasonalFactor, routes}]
            activeEvents: [], // Planned events: [{id, name, type, startDate, durationDays, demandMultiplier, costMultiplier}]
            fuel: { basePrice: 1.0, spotPrice: 1.0, marketState: 'ESTABLE', daysLeft: 10, history: [], contracts: [], lastUpdateDay: null, lastShock: null },
            fuelContracts: [], // [{id, volume, price, startDate, endDate, used}]
            corporateContracts: [], // [{id, tier, company, routeId, revenue, frequency, startDate, endDate, status, performance}]
            corporateContractOffers: [], // [{id, tier, company, duration, dailyRevenue, requirements, generatedDate}]
            lastContractOfferGeneration: null, // Última vez que se generaron ofertas
            loans: [], // [{id, amount, interestRate, monthlyPayment, startDate, remainingPayments}]
            // ==============================================
            // TRACKING OPERATIVO PARA CONTRATOS
            // ==============================================
            operativeMetrics: {
                // {routeId: {delays: n, cancellations: n, priceChanges: n, totalFlights: n}}
                byRoute: {},
                // {date, reason, routeId, impactedContracts: []}
                incidents: []
            },
            // ==============================================
            // SISTEMA DE MICRO-OBJETIVOS
            // ==============================================
            completedMissions: [], // IDs de misiones completadas
            activeMission: null, // Misión activa actual
            missionHistory: [], // Historial de misiones completadas
            missionNotifications: [] // Notificaciones pendientes para UI
        };

        this.managers = {
            time: new TimeManager(this),
            economy: new EconomyManager(this),
            story: new StoryManager(this),
            fleet: new FleetManager(this),
            routes: new RouteManager(this),
            competitors: new CompetitorManager(this),
            missions: new MissionManager(this)
        };
        
        // Sistema de niveles y progresión
        this.levelSystem = new LevelSystem(this);

        this.lastTick = 0;
        
        // DEBUG: Método temporal para testing de eventos (solo en desarrollo)
        const DEBUG_MODE = window.location.hostname === 'localhost';
        if (DEBUG_MODE) {
            window.forceTestEvent = () => {
                const testEvent = {
                    id: 'test-' + Date.now(),
                    name: 'Festival de Música (TEST)',
                    description: 'Evento de prueba para debugging',
                    type: 'positive',
                    startDate: this.state.date,
                    durationDays: 3,
                    demandMultiplier: 1.25,
                    costMultiplier: 1.0,
                    targetedRoutes: null
                };
                this.state.activeEvents.push(testEvent);
                console.log('✅ [DEBUG] Test event added:', testEvent);
                this.save();
                // Nota: UIManager se accede a través de window.app.ui, no this.managers.ui
                if (window.app && window.app.ui && window.app.ui.renderEconomy) {
                    window.app.ui.renderEconomy();
                }
                return testEvent;
            };
        }
    }

    /**
     * Método centralizado para ajustar reputación con cap automático 0-100
     * @param {number} delta - Cambio en reputación (positivo o negativo)
     * @returns {number} Nueva reputación después del ajuste
     */
    adjustReputation(delta) {
        this.state.reputation = Math.max(0, Math.min(100, (this.state.reputation || 50) + delta));
        return this.state.reputation;
    }

    checkLevelUp() {
        // Usar el nuevo sistema de niveles si está disponible
        if (this.levelSystem) {
            const check = this.levelSystem.canLevelUp();
            if (check.can) {
                const result = this.levelSystem.levelUp();
                if (result.success) {
                    this.state.levelUpNotifications.push({
                        level: result.newLevel,
                        unlocks: result.newUnlocks,
                        timestamp: this.state.date
                    });
                    console.log(`🎉 Level Up! ${result.oldLevel} → ${result.newLevel}`);
                    return true;
                }
            }
            return false;
        }
        
        // Fallback al sistema antiguo (compatibilidad)
        const currentLevel = this.state.level;
        const nextReq = LEVEL_REQUIREMENTS[currentLevel + 1];
        if (!nextReq) return false; // Max level reached or undefined

        const fleetCount = this.managers.fleet.ownedPlanes.length;
        const routesCount = this.managers.routes.getRoutes().length;
        const reputation = this.state.reputation || 0;
        const profit = this.state.cumulativeProfit || 0;

        const meets = (
            reputation >= nextReq.reputation &&
            fleetCount >= nextReq.fleetSize &&
            routesCount >= nextReq.activeRoutes &&
            profit >= nextReq.cumulativeProfit
        );

        if (meets) {
            this.state.level = currentLevel + 1;
            this.state.levelUpNotifications.push({
                date: this.state.date,
                level: this.state.level,
                unlocks: nextReq.unlocksAircraft || []
            });
            console.log(`🎉 Level Up! Now Level ${this.state.level}`);
            this.save();
        }
    }

    async newGame() {
        this.state.money = 999999999;
        this.state.reputation = 50;
        this.state.date = new Date(2025, 0, 1).getTime();
        this.state.lastEconomy = { gross: 0, costs: 0, net: 0 };
        this.state.mainHub = null;
        this.state.mainHubCategory = null;
        this.state.hubs = {};
        this.state.cumulativeProfit = 0;
        this.state.companyName = "SkyStart Airlines"; // Resetear nombre por defecto
        this.state.companyIATA = null; // Resetear IATA

        // Reset managers data
        this.managers.fleet.ownedPlanes = [];
        this.managers.routes.routes = [];

        await this.save();
        this.managers.story.startIntro();
    }

    async newGameWithHub(selectedHubId) {
        const airport = AIRPORTS[selectedHubId];

        if (!airport) {
            return { success: false, msg: "Hub inválido" };
        }

        // Validate airport database before starting
        const dbValidation = this.validateAirportDatabase();
        if (!dbValidation.success) {
            console.warn('⚠️ Database validation issues:', dbValidation.issues);
        }

        // Reset state with validated parameters
        this.state.mainHub = selectedHubId;
        this.state.mainHubCategory = airport.category || 'Secondary Hub'; // Guardar categoría del hub para cálculos de alcance
        this.state.mainHubRegion = getRegionByAirport(selectedHubId)?.id || null; // Guardar región del hub para expansión regional
        
        // No sobrescribir el nombre si ya fue establecido por el usuario
        if (!this.state.companyName) {
            this.state.companyName = "SkyStart Airlines"; // Default si no se estableció
        }
        this.state.reputation = 50;
        this.state.level = 1; // Start at Level 1, not 4
        this.state.date = new Date(2025, 0, 1).getTime();
        this.state.lastEconomy = { gross: 0, costs: 0, net: 0 };
        this.state.cumulativeProfit = 0;
        this.state.isPaused = false;
        this.state.energy = 100;
        
        // Asegurar que el TimeManager no esté pausado
        this.managers.time.isPaused = false;

        // Usar getStartingMoney() según categoría del hub según LEVEL_SYSTEM
        const hubCategory = this.state.mainHubCategory || 'Secondary Hub';
        this.state.money = getStartingMoney(hubCategory);

        // Initialize main hub with validated parameters
        const hubBaseFee = this.getHubDailyFee(selectedHubId);
        const slotCount = Airport.getSlotCount(airport);
        this.state.hubs[selectedHubId] = {
            id: selectedHubId,
            name: airport.name,
            city: airport.city,
            slots: { used: 0, total: slotCount }, // Use dynamic slot count
            dailyFee: hubBaseFee,
            level: 1,
            established: this.state.date,
            upgrades: {}
        };

        // Reset managers data
        this.managers.fleet.ownedPlanes = [];
        this.managers.routes.routes = [];

        // Competitors are auto-initialized by CompetitorManager constructor

        // Validate final state before saving
        await this.validateAndRestoreGameState();
        
        // Inicializar sistema de misiones después de configurar el juego
        // Resetear estado de misiones para nueva partida
        this.state.completedMissions = [];
        this.state.activeMission = null;
        this.state.missionHistory = [];
        this.state.missionNotifications = [];
        
        if (this.managers.missions) {
            this.managers.missions.init();
        }
        
        await this.save();

        console.log('✅ New Game Started - Parameters Validated:', {
            level: this.state.level,
            mainHub: this.state.mainHub,
            hubSlots: this.state.hubs[selectedHubId].slots.total,
            airportCount: Object.keys(AIRPORTS).length,
            databaseValid: dbValidation.success
        });

        return { success: true, startingCash: this.state.money };
    }

    // Validate entire airport database for integrity
    validateAirportDatabase() {
        const issues = [];
        const requiredFields = ['id', 'name', 'city', 'country', 'region', 'category', 'lat', 'lon', 'pop', 'runway', 'annualPax', 'minLevel'];
        const validCategories = ['mega-hub', 'major-hub', 'secondary-hub', 'regional-hub', 'small-airport'];

        Object.entries(AIRPORTS).forEach(([id, ap]) => {
            // Check required fields
            requiredFields.forEach(field => {
                if (ap[field] === undefined || ap[field] === null) {
                    issues.push(`${id}: Missing field "${field}"`);
                }
            });

            // Validate category
            if (!validCategories.includes(ap.category)) {
                issues.push(`${id}: Invalid category "${ap.category}"`);
            }

            // Validate level range (1-6)
            if (ap.minLevel < 1 || ap.minLevel > 6) {
                issues.push(`${id}: Invalid minLevel ${ap.minLevel} (should be 1-6)`);
            }

            // Validate coordinates
            if (ap.lat < -90 || ap.lat > 90 || ap.lon < -180 || ap.lon > 180) {
                issues.push(`${id}: Invalid coordinates (${ap.lat}, ${ap.lon})`);
            }

            // Validate population > 0
            if (ap.pop <= 0) {
                issues.push(`${id}: Population should be > 0`);
            }

            // Validate annual passengers
            if (ap.annualPax <= 0) {
                issues.push(`${id}: Annual passengers should be > 0`);
            }
        });

        // Check level distribution
        const levelDistribution = {};
        Object.values(AIRPORTS).forEach(ap => {
            levelDistribution[ap.minLevel] = (levelDistribution[ap.minLevel] || 0) + 1;
        });

        console.log('📊 Airport Database Validation:', {
            totalAirports: Object.keys(AIRPORTS).length,
            issuesFound: issues.length,
            levelDistribution
        });

        return {
            success: issues.length === 0,
            issues,
            distribution: levelDistribution
        };
    }

    // Validate and restore critical game parameters
    async validateAndRestoreGameState() {
        // Validate state object has all required fields
        const requiredStateFields = {
            companyName: 'string',
            money: 'number',
            date: 'number',
            level: 'number',
            reputation: 'number',
            isPaused: 'boolean',
            mainHub: 'string',
            hubs: 'object'
        };

        Object.entries(requiredStateFields).forEach(([field, type]) => {
            if (typeof this.state[field] !== type) {
                console.warn(`⚠️ State field "${field}" has wrong type. Resetting...`);
                // Restore to safe defaults
                switch (field) {
                    case 'money':
                        this.state.money = 999999999;
                        break;
                    case 'date':
                        this.state.date = new Date(2025, 0, 1).getTime();
                        break;
                    case 'level':
                        this.state.level = 1;
                        break;
                    case 'reputation':
                        this.state.reputation = 50;
                        break;
                    case 'isPaused':
                        this.state.isPaused = false;
                        break;
                    case 'hubs':
                        this.state.hubs = {};
                        break;
                }
            }
        });

        // Validate level bounds (1-10)
        if (this.state.level < 1) this.state.level = 1;
        if (this.state.level > 10) this.state.level = 10;

        // Validate reputation bounds (0-100)
        if (this.state.reputation < 0) this.state.reputation = 0;
        if (this.state.reputation > 100) this.state.reputation = 100;

        // Validate money is positive
        if (this.state.money < 0) this.state.money = 0;

        // Validate main hub exists in AIRPORTS
        if (!AIRPORTS[this.state.mainHub]) {
            console.warn(`⚠️ Main hub ${this.state.mainHub} not found in database!`);
            this.state.mainHub = 'MAD'; // Fallback to Madrid
        }

        // Validate hubs
        Object.keys(this.state.hubs).forEach(hubId => {
            const hub = this.state.hubs[hubId];
            if (!AIRPORTS[hubId]) {
                console.warn(`⚠️ Removing invalid hub: ${hubId}`);
                delete this.state.hubs[hubId];
            } else {
                // Restore hub slots if missing
                if (!hub.slots) {
                    const ap = AIRPORTS[hubId];
                    hub.slots = { used: 0, total: Airport.getSlotCount(ap) };
                }
                // Validate daily fee
                if (hub.dailyFee === undefined) {
                    hub.dailyFee = this.getHubDailyFee(hubId);
                }
            }
        });

        console.log('✅ Game State Validated and Restored:', {
            level: this.state.level,
            money: this.state.money,
            reputation: this.state.reputation,
            mainHub: this.state.mainHub,
            hubCount: Object.keys(this.state.hubs).length
        });
    }

    getHubDailyFee(hubId) {
        // Fee based on airport size/population and category multiplier
        const airport = AIRPORTS[hubId];
        if (!airport) return 5000;

        // Use Airport static method which includes category multiplier
        return Math.floor(Airport.getDailyFee(airport));
    }

    async loadGame() {
        const data = await DB.loadState();
        if (data) {
            // Merge state
            this.state = { ...this.state, ...(data.state || data) };

            // Ensure new fields exist for legacy saves
            this.state.activeEvents = this.state.activeEvents || [];
            this.state.fuelContracts = this.state.fuelContracts || [];
            this.state.corporateContracts = this.state.corporateContracts || [];
            this.state.loans = this.state.loans || [];

            // Restaurar mainHubCategory y mainHubRegion para partidas antiguas
            if (this.state.mainHub && !this.state.mainHubCategory) {
                const hubAirport = AIRPORTS[this.state.mainHub];
                if (hubAirport) {
                    this.state.mainHubCategory = hubAirport.category || 'Secondary Hub';
                    this.state.mainHubRegion = getRegionByAirport(this.state.mainHub)?.id || null;
                    console.log('✅ Restored hub info for legacy save:', {
                        mainHub: this.state.mainHub,
                        category: this.state.mainHubCategory,
                        region: this.state.mainHubRegion
                    });
                }
            }

            // CRITICAL: Validate and fix date format
            // If date is not a valid timestamp, reset it
            if (typeof this.state.date !== 'number' || this.state.date < 1000000000000 || this.state.date > Date.now() + 86400000) {
                console.warn('⚠️ Invalid date detected:', this.state.date, 'Resetting to default');
                this.state.date = new Date(2025, 0, 1).getTime();
            }

            // Hydrate fleet and routes if present
            if (data.fleet) this.managers.fleet.loadData(data.fleet);
            if (data.routes) this.managers.routes.loadData(data.routes);

            // Inicializar sistema de misiones
            if (this.managers.missions) {
                this.managers.missions.init();
            }

            // Dev cheat for now
            this.state.money = 999999999;

            console.log("📂 Game Loaded", { date: new Date(this.state.date).toISOString() });
        }
    }

    startLoop() {
        const DEBUG_MODE = window.location.hostname === 'localhost';
        if (DEBUG_MODE) {
            console.log('🔄 Game loop started, isPaused:', this.managers.time.isPaused);
        }
        const loop = (timestamp) => {
            if (!this.lastTick) {
                this.lastTick = timestamp;
                requestAnimationFrame(loop);
                return;
            }
            
            const delta = timestamp - this.lastTick;

            if (!this.managers.time.isPaused) {
                this.update(delta);
            }

            this.lastTick = timestamp;
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    update(delta) {
        // Propagate update to managers
        this.managers.time.update(delta);
        this.managers.economy.update(delta);
        this.managers.routes.update();
        
        // Actualizar sistema de misiones (verificar progreso y completar)
        if (this.managers.missions) {
            this.managers.missions.update();
        }
    }

    async openSecondaryHub(iataCode) {
        const level = this.state.level || 1;
        const cash = this.state.money || 0;
        const airport = AIRPORTS[iataCode];
        
        if (!airport) {
            return { success: false, msg: "Aeropuerto inválido." };
        }

        // Base cost applies category multiplier
        const baseCost = 10000000; // $10M base
        const categoryMultiplier = Airport.getCategoryMultiplier(airport);
        const COST = Math.floor(baseCost * categoryMultiplier);

        if (level < 2) {
            return { success: false, msg: "Requiere nivel 2 o superior." };
        }
        if (cash < COST) {
            return { success: false, msg: `Fondos insuficientes: requiere $${COST.toLocaleString()}.` };
        }
        if (this.state.hubs[iataCode]) {
            return { success: false, msg: "Ya tienes un hub en este aeropuerto." };
        }
        // Prevent opening mainHub again
        if (this.state.mainHub === iataCode) {
            return { success: false, msg: "Este ya es tu hub principal." };
        }

        const slotCount = Airport.getSlotCount(airport);
        const hubBaseFee = this.getHubDailyFee(iataCode);
        this.state.hubs[iataCode] = {
            id: iataCode,
            name: airport.name,
            city: airport.city,
            slots: { used: 0, total: slotCount },
            dailyFee: hubBaseFee,
            level: 1,
            established: this.state.date,
            upgrades: {}
        };

        this.state.money -= COST;
        await this.save();
        return { success: true, msg: `Hub abierto en ${airport.name}. Slots: ${slotCount}. Coste diario: $${hubBaseFee.toLocaleString()}` };
    }

    async upgradeHubSlots(hubId) {
        const hub = this.state.hubs?.[hubId];
        if (!hub) {
            return { success: false, msg: "Hub no encontrado." };
        }

        const COST = 5000000; // $5M
        const cash = this.state.money || 0;

        if (cash < COST) {
            return { success: false, msg: "Fondos insuficientes: requiere $5,000,000." };
        }

        hub.slots.total += 2;
        this.state.money -= COST;
        await this.save();
        return { success: true, msg: `Agregados 2 slots en ${hub.name}.` };
    }

    async upgradeHubRunway(hubId) {
        const hub = this.state.hubs?.[hubId];
        if (!hub) {
            return { success: false, msg: "Hub no encontrado." };
        }

        const COST = 3000000; // $3M
        const cash = this.state.money || 0;

        if (cash < COST) {
            return { success: false, msg: "Fondos insuficientes: requiere $3,000,000." };
        }

        if (!hub.upgrades) hub.upgrades = {};
        hub.upgrades.runwayLevel = (hub.upgrades.runwayLevel || 0) + 1;

        // Reduce daily fee by 10% per level
        const reduction = 1 - (hub.upgrades.runwayLevel * 0.1);
        hub.dailyFee = Math.max(1000, Math.floor(hub.dailyFee * reduction));

        this.state.money -= COST;
        await this.save();
        return { success: true, msg: `Pista mejorada a nivel ${hub.upgrades.runwayLevel}.` };
    }

    async save() {
        const payload = {
            state: this.state,
            fleet: this.managers.fleet.getFlatData(),
            routes: this.managers.routes.getFlatData()
        };

        await DB.saveState(payload);
        console.log("💾 Auto-Saved");
    }
}
