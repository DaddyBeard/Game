export class EconomyManager {
    constructor(game) {
        this.game = game;
        this.acc = 0;

        // Cost coefficients (tunable for balance)
        this.COSTS = {
            fuelPricePerKg: 0.8,       // $ per kg burned
            crewBase: 1200,            // $ per flight
            crewPerKm: 0.2,            // $ per km (overflight, allowances)
            cleaningTurn: 500,         // $ per turnaround
            maintReservePerKm: 5,      // $ reserve per km flown
            airportFeePerPop: 50       // $ per million pop per airport
        };
    }

    update(delta) {
        // Here we could handle continuous fluctuation
    }

    processDaily() {
        console.log("💰 Economy: Processing Daily Revenue");
        let totalGross = 0;
        let totalCosts = 0;
        let hubFees = 0;
        let totalNet = 0;

        // 1. Route Revenue
        const routes = this.game.managers.routes.getRoutes();
        routes.forEach(route => {
            // Basic randomized fluctuation +- 10%
            const fluctuation = 0.9 + (Math.random() * 0.2);
            const revenue = Math.floor(route.dailyRevenue * fluctuation);

            const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === route.assignedPlane);
            const costs = this.calculateRouteCosts(route, plane);
            const profit = revenue - costs.total;

            totalGross += revenue;
            totalCosts += costs.total;
            totalNet += profit;

            // Track statistics for assigned plane
            if (plane) {
                // Estimate passengers (based on load factor 85%)
                const seats = route.seats || plane.configuration || {};
                const totalSeats = (seats.economy || 0) + (seats.premium || 0) + (seats.business || 0);
                const passengers = Math.floor(totalSeats * 0.85);

                plane.addFlightRecord(
                    this.game.state.date,
                    `${route.origin}-${route.dest}`,
                    profit,
                    passengers
                );
            }
        });

        // 2. Hub Daily Fees
        Object.entries(this.game.state.hubs).forEach(([hubId, hub]) => {
            if (hub.level > 0) {
                // Fee only for used slots
                const fee = hub.dailyFee * hub.slots.used;
                hubFees += fee;
                totalCosts += fee;
                totalNet -= fee;
            }
        });

        if (hubFees > 0) {
            console.log(`🏢 Hub Fees: $${hubFees}`);
        }

        // 3. Process Fleet Condition
        this.game.managers.fleet.processDailyWear();

        // 4. Process Daily Reputation
        this.processReputation(routes);

        // 5. Apply to Bank
        this.game.state.money += totalNet;

        // 5. Store cumulative profit (only positive days)
        if (totalNet > 0) {
            this.game.state.cumulativeProfit += totalNet;
        }

        // 6. Store summary for UI
        this.game.state.lastEconomy = {
            gross: totalGross,
            costs: totalCosts,
            net: totalNet
        };

        // Notification
        if (totalNet !== 0) {
            // If we had a notification system:
            // this.game.ui.showToast(`Ingresos diarios: $${totalRevenue}`);
            console.log(`Daily Net: ${totalNet} (gross ${totalGross}, costs ${totalCosts}, hub fees ${hubFees})`);
        }

        // Check progression after daily processing
        if (typeof this.game.checkLevelUp === 'function') {
            this.game.checkLevelUp();
        }
    }

    calculateRouteCosts(route, plane) {
        const { fuelPricePerKg, crewBase, crewPerKm, cleaningTurn, maintReservePerKm, airportFeePerPop } = this.COSTS;
        const dist = route.distance || 0;
        const fuelBurn = plane?.baseStats?.fuelBurn || 35; // kg per km default
        const origin = this.game.managers.routes.getAirport?.(route.origin) || null;
        const dest = this.game.managers.routes.getAirport?.(route.dest) || null;

        const fuelCost = dist * fuelBurn * fuelPricePerKg;
        const crewCost = crewBase + (dist * crewPerKm);
        const cleaningCost = cleaningTurn;
        const maintReserve = dist * maintReservePerKm;
        const airportFees = ((origin?.pop || 5) + (dest?.pop || 5)) * airportFeePerPop;

        const total = Math.round(fuelCost + crewCost + cleaningCost + maintReserve + airportFees);

        return {
            fuelCost,
            crewCost,
            cleaningCost,
            maintReserve,
            airportFees,
            total
        };
    }

    processReputation(routes) {
        let totalRepDelta = 0;

        routes.forEach(route => {
            const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === route.assignedPlane);
            if (!plane) return;

            let repDelta = 0;

            // 1. Condición del avión (puntualidad)
            if (plane.condition > 80) {
                repDelta += 0.5;  // Muy confiable
            } else if (plane.condition > 60) {
                repDelta += 0.1;  // Aceptable
            } else if (plane.condition < 40) {
                repDelta -= 1.0;  // Problemas
            }

            // 2. Confort (asientos premium)
            const premiumSeats = (plane.configuration.premium || 0) + (plane.configuration.business || 0);
            const totalSeats = plane.baseStats.seats;
            if (premiumSeats > 0) {
                repDelta += 0.2 * (premiumSeats / totalSeats);
            }

            // 3. Precio competitivo vs rivales
            const priceMultiplier = route.priceMultiplier || 1.0;
            const rivalPrice = this.game.managers.rivals?.getRivalPriceOnRoute?.(route.origin, route.dest) || 1.0;
            const priceDiff = priceMultiplier - rivalPrice;
            
            if (priceDiff > 0.2) {
                // Mucho más caro que rivales: pierde reputación
                repDelta -= 0.3;
            } else if (priceDiff > 0.1) {
                // Algo más caro: ligera penalización
                repDelta -= 0.1;
            } else if (priceDiff < -0.1) {
                // Más barato: gana reputación (precio competitivo)
                repDelta += 0.2;
            }

            // Acumular por ruta
            totalRepDelta += repDelta;

            // Registrar en historial
            if (!this.game.state.reputationHistory) {
                this.game.state.reputationHistory = [];
            }

            this.game.state.reputationHistory.push({
                date: this.game.state.date,
                delta: repDelta,
                reason: `${plane.registration} - Cond:${Math.round(plane.condition)}% Premium:${premiumSeats}/${totalSeats} Precio:${(priceMultiplier*100).toFixed(0)}%`,
                routeId: route.id
            });
        });

        // Limitar delta diario a ±5 puntos
        totalRepDelta = Math.max(-5, Math.min(5, totalRepDelta));

        // Aplicar y capped a 0-100
        this.game.state.reputation = Math.max(0, Math.min(100, 
            this.game.state.reputation + totalRepDelta
        ));

        if (totalRepDelta !== 0) {
            console.log(`⭐ Reputación: ${totalRepDelta > 0 ? '+' : ''}${totalRepDelta.toFixed(2)} → ${Math.round(this.game.state.reputation)}/100`);
        }

        // Mantener historial limitado a últimos 30 días
        if (this.game.state.reputationHistory.length > 30 * Math.max(1, routes.length)) {
            this.game.state.reputationHistory = this.game.state.reputationHistory.slice(-30 * Math.max(1, routes.length));
        }

        // Update rival data
        if (this.game.managers.rivals) {
            this.game.managers.rivals.updateRivals();
        }
    }
}
