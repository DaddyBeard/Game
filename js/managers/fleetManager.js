import { Aircraft, AIRCRAFT_TYPES } from '../models/aircraft.js';

export class FleetManager {
    constructor(game) {
        this.game = game;
        this.ownedPlanes = []; // List of Aircraft API objects
    }

    loadData(data) {
        // Hydrate plain objects back to classes
        if (data && Array.isArray(data)) {
            this.ownedPlanes = data.map(pData => {
                const plane = new Aircraft(pData.typeId);
                Object.assign(plane, pData);
                plane.deliveredAt = pData.deliveredAt || this.game.state.date || Date.now();
                plane.hoursFlown = pData.hoursFlown || 0;
                plane.totalRevenue = pData.totalRevenue || 0;
                plane.totalPassengers = pData.totalPassengers || 0;
                return plane;
            });
        }
    }

    getFlatData() {
        return this.ownedPlanes; // These are objects, simplify if needed for saving
    }

    canAfford(typeId) {
        const type = AIRCRAFT_TYPES[typeId];
        return this.game.state.money >= type.price;
    }

    isAircraftUnlocked(typeId) {
        const currentLevel = this.game.state.level || 1;
        const LEVEL_REQUIREMENTS = window.LEVEL_REQUIREMENTS || {};
        
        for (let i = 1; i <= currentLevel; i++) {
            const req = LEVEL_REQUIREMENTS[i];
            if (req && req.unlocksAircraft && req.unlocksAircraft.includes(typeId)) {
                return true;
            }
        }
        
        return false;
    }

    buyAircraft(typeId, config = null, customRegistration = null) {
        if (!this.isAircraftUnlocked(typeId)) {
            return { success: false, msg: "Este avión está bloqueado por nivel" };
        }
        if (!this.canAfford(typeId)) return { success: false, msg: "Fondos insuficientes" };

        const type = AIRCRAFT_TYPES[typeId];

        // Transaction
        this.game.state.money -= type.price;

        // Create Instance with optional custom registration
        const newPlane = new Aircraft(typeId, config, customRegistration);
        newPlane.deliveredAt = this.game.state.date || Date.now();

        // Apply Config
        if (!config) {
            newPlane.configuration = { economy: type.seats, premium: 0, business: 0 };
        }

        this.ownedPlanes.push(newPlane);

        // Auto-save
        this.game.save();

        return { success: true, plane: newPlane };
    }

    getStats() {
        const count = this.ownedPlanes.length;
        if (count === 0) {
            return {
                count: 0,
                avgCondition: 0,
                avgAgeDays: 0,
                totalHours: 0,
                totalRevenue: 0
            };
        }

        const now = this.game.state.date || Date.now();
        const avgCondition = this.ownedPlanes.reduce((sum, p) => sum + (p.condition || 0), 0) / count;
        const avgAgeDays = this.ownedPlanes.reduce((sum, p) => {
            const delivered = p.deliveredAt || now;
            return sum + Math.max(0, (now - delivered) / 86400000);
        }, 0) / count;

        const totalHours = this.ownedPlanes.reduce((sum, p) => sum + (p.hoursFlown || 0), 0);
        const totalRevenue = this.ownedPlanes.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);

        return {
            count,
            avgCondition,
            avgAgeDays,
            totalHours,
            totalRevenue
        };
    }

    sellAircraft(instanceId) {
        const idx = this.ownedPlanes.findIndex(p => p.instanceId === instanceId);
        if (idx === -1) return;

        const plane = this.ownedPlanes[idx];
        const resaleValue = plane.baseStats.price * 0.7; // Simple depreciation logic

        this.game.state.money += resaleValue;
        this.ownedPlanes.splice(idx, 1);

        this.game.save();
    }

    processDailyWear() {
        // Decrease condition for flying planes
        this.ownedPlanes.forEach(plane => {
            if (plane.status === "FLIGHT") {
                // Random wear 0.5% - 1.5% per day
                const wear = 0.5 + Math.random();
                plane.condition = Math.max(0, plane.condition - wear);
            } else if (plane.status === "MAINT") {
                this.checkMaintenanceProgress(plane);
            }
        });
    }

    startMaintenance(instanceId, type) { // type: 'A' or 'B'
        const plane = this.ownedPlanes.find(p => p.instanceId === instanceId);
        if (!plane) return { success: false, msg: "Avión no encontrado" };
        if (plane.status !== "IDLE") return { success: false, msg: "El avión debe estar IDLE (sin ruta)" };

        let cost = 0;
        let duration = 0;

        if (type === 'A') {
            cost = 10000;
            duration = 1; // days
        } else if (type === 'B') {
            cost = 50000;
            duration = 3; // days
        }

        if (this.game.state.money < cost) return { success: false, msg: "Fondos insuficientes" };

        // Transaction
        this.game.state.money -= cost;
        plane.status = "MAINT";
        plane.maintType = type;
        plane.maintDaysLeft = duration;

        return { success: true };
    }

    checkMaintenanceProgress(plane) {
        if (plane.maintDaysLeft > 0) {
            plane.maintDaysLeft--;
        }

        if (plane.maintDaysLeft <= 0) {
            this.finishMaintenance(plane);
        }
    }

    finishMaintenance(plane) {
        plane.status = "IDLE";
        delete plane.maintDaysLeft;

        if (plane.maintType === 'A') {
            plane.condition = Math.min(100, plane.condition + 20);
        } else {
            plane.condition = 100;
        }

        delete plane.maintType;
        // Notify?
        console.log(`Maintenance finished for ${plane.registration}`);
    }
}
