/**
 * Core Game Logic
 */
import { TimeManager } from '../managers/timeManager.js';
import { EconomyManager } from '../managers/economyManager.js';
import { StoryManager } from '../story/storyManager.js';
import { FleetManager } from '../managers/fleetManager.js';
import { RouteManager } from '../managers/routeManager.js';
import { RivalManager } from '../managers/rivalManager.js';
import { DB } from './db.js';
import { LEVEL_REQUIREMENTS } from '../models/progressionModel.js';
import { AIRPORTS } from '../models/airport.js';

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
            level: 4,
            isPaused: false,
            lastEconomy: { gross: 0, costs: 0, net: 0 },
            mainHub: null, // Hub principal seleccionado
            hubs: {}, // {hubId: {id, name, slots, dailyFee, level, ...}}
            cumulativeProfit: 0, // Suma de beneficios netos (nunca baja)
            levelUpNotifications: []
        };

        this.managers = {
            time: new TimeManager(this),
            economy: new EconomyManager(this),
            story: new StoryManager(this),
            fleet: new FleetManager(this),
            routes: new RouteManager(this),
            rivals: new RivalManager(this)
        };

        this.lastTick = 0;
    }

    checkLevelUp() {
        const currentLevel = this.state.level;
        const nextReq = LEVEL_REQUIREMENTS[currentLevel + 1];
        if (!nextReq) return; // Max level reached or undefined

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
        this.state.hubs = {};
        this.state.cumulativeProfit = 0;

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

        // Reset state
        this.state.mainHub = selectedHubId;
        this.state.companyName = "SkyStart Airlines"; // Will be customized by player
        this.state.reputation = 50;
        this.state.level = 4;
        this.state.date = new Date(2025, 0, 1).getTime();
        this.state.lastEconomy = { gross: 0, costs: 0, net: 0 };
        this.state.cumulativeProfit = 0;

        // DEV: Set money to 999M for testing
        this.state.money = 999999999;

        // Initialize main hub
        const hubBaseFee = this.getHubDailyFee(selectedHubId);
        this.state.hubs[selectedHubId] = {
            id: selectedHubId,
            name: airport.name,
            city: airport.city,
            slots: { used: 0, total: 4 },
            dailyFee: hubBaseFee,
            level: 1,
            established: this.state.date,
            upgrades: {}
        };

        // Reset managers data
        this.managers.fleet.ownedPlanes = [];
        this.managers.routes.routes = [];

        // Initialize rivals
        this.managers.rivals.initRivals();

        await this.save();

        return { success: true, startingCash: this.state.money };
    }

    getHubDailyFee(hubId) {
        // Fee based on airport size/population
        const airport = AIRPORTS[hubId];
        if (!airport) return 5000;

        // Formula: 2000 + (population * 500)
        return Math.floor(2000 + (airport.pop * 500));
    }

    async loadGame() {
        const data = await DB.loadState();
        if (data) {
            // Merge state
            this.state = { ...this.state, ...(data.state || data) };

            // Hydrate fleet and routes if present
            if (data.fleet) this.managers.fleet.loadData(data.fleet);
            if (data.routes) this.managers.routes.loadData(data.routes);

            // Dev cheat for now
            this.state.money = 999999999;

            console.log("📂 Game Loaded");
        }
    }

    startLoop() {
        const loop = (timestamp) => {
            if (!this.lastTick) this.lastTick = timestamp;
            const delta = timestamp - this.lastTick;

            if (!this.state.isPaused) {
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
    }

    async openSecondaryHub(iataCode) {
        const level = this.state.level || 1;
        const cash = this.state.money || 0;
        const COST = 10000000; // $10M (testing: was $30M)

        if (level < 2) {
            return { success: false, msg: "Requiere nivel 2 o superior." };
        }
        if (cash < COST) {
            return { success: false, msg: "Fondos insuficientes: requiere $10,000,000." };
        }
        const airport = AIRPORTS[iataCode];
        if (!airport) {
            return { success: false, msg: "Aeropuerto inválido." };
        }
        if (this.state.hubs[iataCode]) {
            return { success: false, msg: "Ya tienes un hub en este aeropuerto." };
        }
        // Prevent opening mainHub again
        if (this.state.mainHub === iataCode) {
            return { success: false, msg: "Este ya es tu hub principal." };
        }

        const hubBaseFee = this.getHubDailyFee(iataCode);
        this.state.hubs[iataCode] = {
            id: iataCode,
            name: airport.name,
            city: airport.city,
            slots: { used: 0, total: 2 },
            dailyFee: hubBaseFee,
            level: 1,
            established: this.state.date,
            upgrades: {}
        };

        this.state.money -= COST;
        await this.save();
        return { success: true, msg: `Hub abierto en ${airport.name}.` };
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
