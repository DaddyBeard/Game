import { CONTRACT_TIERS, getTierForLevel, getAvailableTiers, getRandomCompanyName, calculateContractDailyRevenue, getContractDuration } from '../models/contractTypes.js';
import { FuelSystem } from '../models/fuelSystem.js';
import { FuelProviders } from '../models/fuelProviders.js';

export class EconomyManager {
    constructor(game) {
        this.game = game;
        this.acc = 0;

        // Contract types (imported directly)
        this.CONTRACT_TYPES = CONTRACT_TIERS;
        this.getTierForLevel = getTierForLevel;
        this.getAvailableTiers = getAvailableTiers;
        this.getRandomCompanyName = getRandomCompanyName;
        this.calculateContractDailyRevenue = calculateContractDailyRevenue;
        this.getContractDuration = getContractDuration;

        // Fuel systems
        this.fuelSystem = new FuelSystem(game);
        this.fuelProviders = new FuelProviders(game);

        console.log('✅ Contract system initialized');

        // Cost coefficients (tunable for balance)
        // Calibrado para que combustible sea ~40% del coste total
        this.COSTS = {
            fuelPricePerKg: 0.55,      // $ per kg burned (40% del coste)
            crewBase: 2400,            // $ per flight (tripulación base)
            crewPerKm: 0.4,            // $ per km (sobrevuelo, dietas)
            cleaningTurn: 800,         // $ per turnaround (limpieza)
            maintReservePerKm: 8,      // $ reserve per km flown (mantenimiento)
            airportFeePerPop: 85       // $ per million pop per airport (tasas)
        };

        // Seasonal demand system
        this.lastFuelUpdate = Date.now();
    }

    get fuelIndex() {
        return this.fuelSystem.getIndex();
    }

    update(delta) {
        // Fuel price moves diariamente via FuelSystem (hook en TimeManager)
    }

    /**
     * Get seasonal demand multiplier (0.8-1.3x)
     * Summer (Jun-Aug): Tourism +20%
     * Winter (Dec-Jan): Business +15%
     * Spring/Fall: Normal
     */
    getSeasonalDemandFactor() {
        const gameDate = new Date(this.game.state.date);
        const month = gameDate.getMonth(); // 0=Jan, 11=Dec

        // Summer tourism (June=5, July=6, August=7)
        if (month >= 5 && month <= 7) {
            return 1.20; // +20% demand in summer
        }
        
        // Winter business (December=11, January=0)
        if (month === 11 || month === 0) {
            return 1.15; // +15% demand in winter
        }
        
        // Spring/Fall normal
        return 1.0;
    }

    /**
     * Random economic events (5% daily chance)
     * Returns multiplier: 0.8-1.3
     * DEPRECATED: Use planned events system instead
     */
    getEventMultiplier() {
        // Try to use new planned events system if available
        try {
            if (this.game.state.activeEvents && Array.isArray(this.game.state.activeEvents)) {
                let demandMult = 1.0;
                let costMult = 1.0;
                const oneDay = 24 * 60 * 60 * 1000;
                
                this.game.state.activeEvents.forEach(evt => {
                    const age = (this.game.state.date - evt.startDate) / oneDay;
                    if (age < evt.durationDays) {
                        if (evt.demandMultiplier) demandMult *= evt.demandMultiplier;
                        if (evt.costMultiplier) costMult *= evt.costMultiplier;
                    }
                });
                
                // Return demand multiplier (cost is handled separately in calculateRouteCosts)
                return Math.max(0.5, Math.min(2.0, demandMult));
            }
        } catch (err) {
            // Fall back to random events
        }
        
        // Fallback: random economic events
        if (Math.random() < 0.05) { // 5% chance
            const events = [
                { mult: 0.75, label: '✈️ Strike! Demand -25%' },
                { mult: 0.80, label: '⚡ Weather delays -20%' },
                { mult: 0.85, label: '🛫 Congestion -15%' },
                { mult: 1.15, label: '🎉 Festival +15%' },
                { mult: 1.25, label: '💼 Trade conference +25%' },
                { mult: 1.30, label: '🎊 Holiday rush +30%' }
            ];
            
            const event = events[Math.floor(Math.random() * events.length)];
            console.log(`📢 Event: ${event.label}`);
            return event.mult;
        }
        return 1.0;
    }

    /**
     * Calculate recommended price based on competence and reputation
     * Returns: {recommendedPrice, elasticity, avgCompetitorPrice}
     */
    calculateRecommendedPrice(originId, destId, currentPrice = 1.0) {
        let avgCompetitorPrice = 1.0;
        
        if (originId && destId && this.game.managers?.competitors) {
            const competitors = this.game.managers.competitors.getCompetitorsOnRoute(originId, destId);
            if (competitors.length > 0) {
                avgCompetitorPrice = competitors.reduce((sum, c) => sum + (c.priceMultiplier || 1.0), 0) / competitors.length;
            }
        }

        // Elasticity: reputation affects price sensitivity
        const rep = this.game.state.reputation || 50;
        const repFactor = rep / 100; // 0-1

        // Recommended: slightly below competitor average if low rep, can be higher if high rep
        const recommendedPrice = avgCompetitorPrice * (0.95 + (repFactor * 0.15)); // 0.95x to 1.10x of competitor

        const elasticity = {
            priceElasticity: repFactor, // Higher rep = less price sensitive (can charge more)
            currentPrice,
            recommendedPrice,
            avgCompetitorPrice,
            suggestion: currentPrice > recommendedPrice * 1.1 ? 'Demasiado caro' : currentPrice < recommendedPrice * 0.9 ? 'Muy barato' : 'Óptimo'
        };

        return elasticity;
    }

    /**
     * Project revenue/occupancy/margin at different price points
     * Returns: {price, occupancy, revenue, costs, margin, yield}
     */
    projectRouteMetrics(route, plane, testPrice = 1.0) {
        if (!plane || !route) {
            return {
                testPrice,
                occupancy: 0,
                revenue: 0,
                costs: 0,
                margin: 0,
                yield: 0
            };
        }
        
        const { originDemandFactor, destDemandFactor } = this.game.managers.routes.getDemandFactors(route.origin, route.dest);
        
        const seats = plane.configuration?.economy ? {
            economy: plane.configuration.economy,
            premium: plane.configuration.premium,
            business: plane.configuration.business
        } : (() => {
            const ts = plane.baseStats?.seats || 100;
            return {
                economy: Math.floor(ts * 0.7),
                premium: Math.floor(ts * 0.2),
                business: Math.ceil(ts * 0.1)
            };
        })();

        const baseRevenue = this.game.managers.routes.calculatePotentialRevenue(
            route.distance,
            seats,
            testPrice,
            originDemandFactor,
            destDemandFactor,
            route.origin,
            route.dest,
            route.frequency || 7
        );

        const seasonalFactor = this.getSeasonalDemandFactor();
        const revenue = Math.round(baseRevenue * seasonalFactor);
        const costs = this.calculateRouteCosts(route, plane);
        const margin = revenue - (costs?.total || 0);
        const loadFactor = this.game.managers.routes.calculateLoadFactorSimple(testPrice);

        // Calculate yield
        const baseTicket = 50 + (route.distance * 0.12);
        const avgTicket = (baseTicket * testPrice * (
            seats.economy * 1.0 +
            seats.premium * 2.2 +
            seats.business * 4.0
        )) / (seats.economy + seats.premium + seats.business);
        const yield_ = (avgTicket * loadFactor) / route.distance;

        return {
            testPrice,
            occupancy: loadFactor,
            revenue,
            costs: costs?.total || 0,
            margin,
            yield: yield_
        };
    }

    /**
     * Yield Management: Suggest optimal seat configuration
     * Tests different economy/premium/business mixes and recommends highest yield
     */
    optimizeYieldConfiguration(route, plane) {
        if (!plane) return null;
        
        const totalSeats = plane.baseStats.seats || 100;
        
        // Test configurations: vary premium/business ratios
        const configs = [
            { economy: Math.floor(totalSeats * 0.85), premium: Math.floor(totalSeats * 0.10), business: Math.ceil(totalSeats * 0.05), name: 'Economy Focus' },
            { economy: Math.floor(totalSeats * 0.70), premium: Math.floor(totalSeats * 0.20), business: Math.ceil(totalSeats * 0.10), name: 'Balanced' },
            { economy: Math.floor(totalSeats * 0.60), premium: Math.floor(totalSeats * 0.25), business: Math.ceil(totalSeats * 0.15), name: 'Premium Focus' },
            { economy: Math.floor(totalSeats * 0.50), premium: Math.floor(totalSeats * 0.30), business: Math.ceil(totalSeats * 0.20), name: 'Luxury' }
        ];

        const { originDemandFactor, destDemandFactor } = this.game.managers.routes.getDemandFactors(route.origin, route.dest);
        const currentPrice = route.priceMultiplier || 1.0;

        let bestConfig = null;
        let bestYield = -1;

        configs.forEach(config => {
            const revenue = this.game.managers.routes.calculatePotentialRevenue(
                route.distance,
                { economy: config.economy, premium: config.premium, business: config.business },
                currentPrice,
                originDemandFactor,
                destDemandFactor,
                route.origin,
                route.dest,
                route.frequency || 7
            );

            const baseTicket = 50 + (route.distance * 0.12);
            const avgTicket = (baseTicket * currentPrice * (
                config.economy * 1.0 +
                config.premium * 2.2 +
                config.business * 4.0
            )) / (config.economy + config.premium + config.business);
            
            const loadFactor = this.game.managers.routes.calculateLoadFactorSimple(currentPrice);
            const yield_ = (avgTicket * loadFactor) / route.distance;

            if (yield_ > bestYield) {
                bestYield = yield_;
                bestConfig = {
                    ...config,
                    revenue: Math.floor(revenue),
                    yield: yield_.toFixed(2),
                    recommendation: config.name
                };
            }
        });

        return bestConfig || configs[1]; // Default to balanced if none found
    }

    /**
     * Operational penalties system
     * Generates random operational issues that affect revenue and reputation
     */
    processOperationalPenalties(route, plane) {
        if (!plane || !route) return { penalty: 0, events: [] };

        const penalties = [];
        let totalPenalty = 0;

        // Condition-based issues (worse condition = more issues)
        const conditionPenalty = 100 - Math.min(plane.condition, 100);
        
        // Delay probability: 2% base + 1% per 10 points of age
        const delayChance = 0.02 + (conditionPenalty * 0.01);
        if (Math.random() < delayChance) {
            const delayCost = 2000 + (route.distance * 5); // $ cost from delay
            totalPenalty += delayCost;
            penalties.push({
                type: 'delay',
                message: '⏰ Retraso operacional',
                cost: delayCost,
                timestamp: this.game.state.date
            });
            // Small reputation hit
            this.game.state.reputation = Math.max(0, this.game.state.reputation - 0.5);
        }

        // Cancellation probability: 0.5% base + 0.5% per low condition
        const cancelChance = 0.005 + (Math.max(0, 50 - plane.condition) * 0.0005);
        if (Math.random() < cancelChance) {
            const cancelCost = 5000 + (route.distance * 8); // Heavy penalty
            totalPenalty += cancelCost;
            penalties.push({
                type: 'cancellation',
                message: '❌ Vuelo cancelado',
                cost: cancelCost,
                timestamp: this.game.state.date,
                reputationHit: 5  // Major hit
            });
            this.game.state.reputation = Math.max(0, this.game.state.reputation - 5);
        }

        // Overbooking: Very rare, but possible with high load factors
        const overloadChance = Math.max(0, this.game.managers.routes.calculateLoadFactorSimple?.(route.priceMultiplier || 1.0) - 0.85);
        if (Math.random() < (overloadChance * 0.05)) { // Up to 5% if load > 85%
            const overCost = 3000; // Compensation costs
            totalPenalty += overCost;
            penalties.push({
                type: 'overbooking',
                message: '📈 Overbooking y compensaciones',
                cost: overCost,
                timestamp: this.game.state.date
            });
            this.game.state.reputation = Math.max(0, this.game.state.reputation - 1);
        }

        // Maintenance emergency: Rare for good condition planes
        const maintChance = Math.max(0, (100 - plane.condition) / 10000); // Non-zero only if condition < 100
        if (Math.random() < maintChance) {
            const maintCost = 8000 + (route.distance * 3);
            totalPenalty += maintCost;
            penalties.push({
                type: 'maintenance',
                message: '🔧 Mantenimiento de emergencia',
                cost: maintCost,
                timestamp: this.game.state.date
            });
        }

        // Add events to route if any penalties occurred
        if (penalties.length > 0 && route.events) {
            route.events.push(...penalties);
        }

        return { penalty: totalPenalty, events: penalties };
    }

    consumeDailyFuel() {
        // NUEVO: Consumir combustible UNA VEZ por día desde contratos
        const routes = this.game.managers.routes.getRoutes() || [];
        let totalFuelLiters = 0;
        
        routes.forEach(route => {
            const assignments = Array.isArray(route.assignments) ? route.assignments : 
                                (route.assignedPlane ? [{ planeId: route.assignedPlane }] : []);
            assignments.forEach(a => {
                const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === a.planeId);
                if (!plane) return;
                const dist = route.distance || 0;
                const fuelBurn = plane.fuelBurn || 0;
                const fuelLiters = dist * fuelBurn * 0.8;
                totalFuelLiters += fuelLiters;
            });
        });
        
        // Consumir del pool de contratos
        if (totalFuelLiters > 0) {
            this.fuelSystem.consume(totalFuelLiters);
        }
    }

    processDaily() {
        console.log("💰 Economy: Processing Daily Revenue");
        
        // Consumir combustible de contratos (UNA VEZ por día)
        this.consumeDailyFuel();
        
        // Rotar perfiles de proveedores de combustible (si es necesario)
        this.fuelProviders.rotateProfiles();
        
        // Limpiar ofertas expiradas
        this.fuelProviders.cleanExpiredOffers();
        
        let totalGross = 0;
        let totalCosts = 0;
        let hubFees = 0;
        let totalNet = 0;

        // 1. Route Revenue
        const routes = this.game.managers.routes.getRoutes();
        routes.forEach(route => {
            const hasAssignments = Array.isArray(route.assignments) && route.assignments.length > 0;
            if (hasAssignments) {
                route.assignments.forEach(a => {
                    const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === a.planeId);
                    if (!plane) return;

                    // Compute per-assignment daily revenue using plane seats
                    const seats = plane.configuration && plane.configuration.economy ? {
                        economy: plane.configuration.economy,
                        premium: plane.configuration.premium,
                        business: plane.configuration.business
                    } : (function(){
                        const totalSeats = plane.baseStats.seats || 0;
                        return {
                            economy: Math.floor(totalSeats * 0.7),
                            premium: Math.floor(totalSeats * 0.2),
                            business: Math.ceil(totalSeats * 0.1)
                        };
                    })();

                    const { originDemandFactor: originFactor, destDemandFactor: destFactor } =
                        this.game.managers.routes.getDemandFactors(route.origin, route.dest);

                    const baseDaily = this.game.managers.routes.calculatePotentialRevenue(
                        route.distance,
                        seats,
                        route.priceMultiplier || 1.0,
                        originFactor,
                        destFactor,
                        route.origin,
                        route.dest,
                        route.frequency || 7
                    );

                    // Apply seasonal, event, and fuel price multipliers
                    const seasonalFactor = this.getSeasonalDemandFactor();
                    const eventFactor = this.getEventMultiplier();
                    const fluctuation = 0.9 + (Math.random() * 0.2);
                    
                    const revenue = Math.floor(baseDaily * seasonalFactor * eventFactor * fluctuation);
                    const costs = this.calculateRouteCosts(route, plane);
                    let profit = revenue - costs.total;

                    // Apply operational penalties
                    const opPenalties = this.processOperationalPenalties(route, plane);
                    if (opPenalties.penalty > 0) {
                        profit -= opPenalties.penalty;
                        // Also remove penalty from money
                        this.game.state.money -= opPenalties.penalty;
                    }

                    totalGross += revenue;
                    totalCosts += costs.total + opPenalties.penalty;
                    totalNet += profit;

                    // Track statistics for this plane
                    const totalSeatsCalc = (seats.economy || 0) + (seats.premium || 0) + (seats.business || 0);
                    const passengers = Math.floor(totalSeatsCalc * 0.85);
                    plane.addFlightRecord(
                        this.game.state.date,
                        `${route.origin}-${route.dest}`,
                        profit,
                        passengers
                    );
                });
            } else {
                // Legacy single-plane behavior
                const seasonalFactor = this.getSeasonalDemandFactor();
                const eventFactor = this.getEventMultiplier();
                const fluctuation = 0.9 + (Math.random() * 0.2);
                const revenue = Math.floor((route.dailyRevenue || 0) * seasonalFactor * eventFactor * fluctuation);
                const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === route.assignedPlane);
                const costs = this.calculateRouteCosts(route, plane);
                const profit = revenue - costs.total;
                totalGross += revenue;
                totalCosts += costs.total;
                totalNet += profit;
                if (plane) {
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

        // 4. Process Route Events (cancelaciones, retrasos, overbooking)
        this.game.managers.routes.processRouteEvents();

        // 5. Process Daily Reputation
        this.processReputation(routes);

        // 5.5 Clean expired fuel contracts (Semana 3)
        this.cleanExpiredFuelContracts();

        // 5.6 Clean expired corporate contracts (Semana 3)
        this.cleanExpiredCorporateContracts();

        // 5.7 Process loan payments (monthly, on day 1) (Semana 3)
        const dayOfMonth = new Date(this.game.state.date).getDate();
        if (dayOfMonth === 1) {
            const loanPayments = this.processLoanPayments();
            totalCosts += loanPayments;
            totalNet -= loanPayments;
        }

        // 5.8 Add corporate contract revenue (guaranteed) (Semana 3)
        const corporateRevenue = this.getCorporateContractRevenue();
        if (corporateRevenue > 0) {
            totalGross += corporateRevenue;
            totalNet += corporateRevenue;
        }

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

        // 7. Register daily economy snapshot to history (for charts/analytics)
        if (!this.game.state.economyHistory) {
            this.game.state.economyHistory = [];
        }

        const routeCount = routes.length;
        const avgLoadSum = routes.reduce((sum, r) => {
            const assignments = Array.isArray(r.assignments) && r.assignments.length > 0 ? r.assignments : (r.assignedPlane ? [{planeId: r.assignedPlane}] : []);
            const planeLoads = assignments.map(a => {
                const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === a.planeId);
                if (!plane) return 0;
                const seats = plane.configuration?.economy ? {
                    economy: plane.configuration.economy,
                    premium: plane.configuration.premium,
                    business: plane.configuration.business
                } : (() => {
                    const ts = plane.baseStats.seats || 0;
                    return {economy: Math.floor(ts * 0.7), premium: Math.floor(ts * 0.2), business: Math.ceil(ts * 0.1)};
                })();
                const priceMultiplier = r.priceMultiplier || 1.0;
                return this.game.managers.routes.calculateLoadFactorSimple(priceMultiplier);
            }).reduce((a, b) => a + b, 0);
            return sum + planeLoads;
        }, 0);
        const avgLoad = routeCount ? (avgLoadSum / (routeCount * (routes.reduce((s, r) => s + (Array.isArray(r.assignments) ? r.assignments.length : 1), 0)))) : 0;

        const marginPct = totalGross ? ((totalNet / totalGross) * 100) : 0;

        this.game.state.economyHistory.push({
            date: this.game.state.date,
            revenue: totalGross,
            costs: totalCosts,
            net: totalNet,
            marginPct: marginPct,
            avgLoad: avgLoad,
            fuelIndex: this.fuelIndex,
            seasonalFactor: this.getSeasonalDemandFactor(),
            routes: routeCount
        });

        // Mantener histórico limitado a últimos 60 días
        if (this.game.state.economyHistory.length > 60) {
            this.game.state.economyHistory = this.game.state.economyHistory.slice(-60);
        }

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

        // AGING SYSTEM: Increase costs based on plane age
        let ageWearFactor = 1.0;
        if (plane?.deliveredAt) {
            const ageDays = Math.max(0, (this.game.state.date - plane.deliveredAt) / 86400000);
            ageWearFactor = 1.0 + (ageDays / 1500); // +1% cost per 1500 days (~4 years)
        }

        // FUEL HEDGING: Use contracts if any are active, otherwise market price
        const fuelLitersNeeded = dist * fuelBurn * 0.8; // Aproximación kg -> litros
        const effectiveFuelPricePerLiter = this.fuelSystem.getEffectivePrice();
        // NOTE: consume() is called once per day in processDaily(), NOT here!
        // This method only calculates the cost, it doesn't modify fuel contract state
        
        // Convertir a $/kg manteniendo coeficiente base
        const actualFuelPrice = (effectiveFuelPricePerLiter / 0.8) * fuelPricePerKg;

        const fuelCost = dist * fuelBurn * actualFuelPrice * ageWearFactor;
        const crewCost = crewBase + (dist * crewPerKm);
        const cleaningCost = cleaningTurn;
        const maintReserve = (dist * maintReservePerKm) * ageWearFactor; // Maintenance scales with age
        const airportFees = ((origin?.pop || 5) + (dest?.pop || 5)) * airportFeePerPop;

        // HUB EFFICIENCY: Apply cost bonus if hub has multiple routes
        const hubEfficiencyBonus = this.calculateHubEfficiencyBonus(route.origin, route.dest);
        const subtotal = fuelCost + crewCost + cleaningCost + maintReserve + airportFees;
        const total = Math.round(subtotal * (1 - hubEfficiencyBonus));

        return {
            fuelCost,
            crewCost,
            cleaningCost,
            maintReserve,
            airportFees,
            total,
            ageWearFactor,
            contractUsed: this.fuelSystem.getActiveContracts().length > 0, // Flag hedging usado
            hubEfficiencyBonus // Bonus aplicado (0-15%)
        };
    }

    /**
     * Calculate hub efficiency bonus based on route density
     * More routes from same hub = lower operational costs
     */
    calculateHubEfficiencyBonus(originHub, destHub) {
        const routes = this.game.managers.routes.getRoutes();
        
        // Count routes departing from origin hub
        const originRoutes = routes.filter(r => r.origin === originHub).length;
        // Count routes arriving at dest hub
        const destRoutes = routes.filter(r => r.dest === destHub).length;
        
        // Average density
        const avgDensity = (originRoutes + destRoutes) / 2;
        
        // Bonus scale: 1-5 routes = 5%, 6-10 = 10%, 11+ = 15%
        let bonus = 0;
        if (avgDensity >= 11) bonus = 0.15;
        else if (avgDensity >= 6) bonus = 0.10;
        else if (avgDensity >= 1) bonus = 0.05;
        
        return bonus;
    }

    processReputation(routes) {
        const operationalRep = this.calculateOperationalReputation(routes); // -3 a +3
        const strategicRep = this.calculateStrategicReputation(routes);     // -2 a +2
        
        let totalRepDelta = operationalRep + strategicRep;
        
        // NUEVO: Penalización por crisis de combustible sin contratos
        const fuel = this.game.state.fuel;
        if (fuel?.inCrisis && fuel.crisisDays >= 45) {
            const activeContracts = this.fuelSystem.getActiveContracts();
            if (activeContracts.length === 0) {
                totalRepDelta -= 1.0; // -1% reputación/día durante crisis sin protección
                console.log('🔥 Penalización crisis combustible: -1.0 reputación (sin contratos)');
            }
        }
        
        totalRepDelta = Math.max(-5, Math.min(5, totalRepDelta));
        
        // Usar método centralizado con cap automático
        this.game.adjustReputation(totalRepDelta);

        if (totalRepDelta !== 0) {
            console.log(`⭐ Reputación: ${totalRepDelta > 0 ? '+' : ''}${totalRepDelta.toFixed(2)} (Op:${operationalRep.toFixed(1)} Str:${strategicRep.toFixed(1)}) → ${Math.round(this.game.state.reputation)}/100`);
        }

        // Mantener historial limitado a últimos 30 días
        if (!this.game.state.reputationHistory) {
            this.game.state.reputationHistory = [];
        }
        if (this.game.state.reputationHistory.length > 30 * Math.max(1, routes.length)) {
            this.game.state.reputationHistory = this.game.state.reputationHistory.slice(-30 * Math.max(1, routes.length));
        }

        // Update competitor data
        if (this.game.managers.competitors) {
            this.game.managers.competitors.updateCompetitorRoutes();
            this.game.managers.competitors.updateCompetitorPrices();
        }
    }

    /**
     * Reputación Operacional: Calidad del servicio día a día
     * Rango: -3 a +3 puntos diarios
     */
    calculateOperationalReputation(routes) {
        let totalRepDelta = 0;

        routes.forEach(route => {
            const assignments = Array.isArray(route.assignments) && route.assignments.length > 0
                ? route.assignments
                : (route.assignedPlane ? [{ planeId: route.assignedPlane }] : []);
            
            assignments.forEach(a => {
                const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === a.planeId);
                if (!plane) return;

                let repDelta = 0;

                // 1. Condición del avión (puntualidad y confiabilidad)
                if (plane.condition > 80) {
                    repDelta += 0.4;  // Muy confiable
                } else if (plane.condition > 60) {
                    repDelta += 0.1;  // Aceptable
                } else if (plane.condition < 40) {
                    repDelta -= 0.8;  // Problemas
                }

                // 2. Confort (asientos premium)
                const premiumSeats = (plane.configuration.premium || 0) + (plane.configuration.business || 0);
                const totalSeats = plane.baseStats.seats;
                if (premiumSeats > 0 && totalSeats > 0) {
                    repDelta += 0.15 * (premiumSeats / totalSeats);
                }

                // 3. Precio competitivo vs competidores
                const priceMultiplier = route.priceMultiplier || 1.0;
                if (priceMultiplier > 1.2) {
                    repDelta -= 0.25; // Precios muy altos
                } else if (priceMultiplier > 1.1) {
                    repDelta -= 0.1;  // Precios altos
                } else if (priceMultiplier < 0.9) {
                    repDelta += 0.15; // Precios bajos (buena percepción)
                }

                totalRepDelta += repDelta;

                // Log en historial
                if (!this.game.state.reputationHistory) {
                    this.game.state.reputationHistory = [];
                }
                this.game.state.reputationHistory.push({
                    date: this.game.state.date,
                    delta: repDelta,
                    reason: `${plane.registration} - Cond:${Math.round(plane.condition)}% Premium:${premiumSeats}/${totalSeats} Precio:${(priceMultiplier*100).toFixed(0)}%`,
                    routeId: route.id,
                    type: 'operational'
                });
            });
        });

        return Math.max(-3, Math.min(3, totalRepDelta));
    }

    /**
     * Reputación Estratégica: Escala, infraestructura y presencia global
     * Rango: -2 a +2 puntos diarios
     */
    calculateStrategicReputation(routes) {
        let strategicDelta = 0;

        // 1. Prestigio de Red (Hubs)
        const hubCount = Object.keys(this.game.state.hubs || {}).length;
        const hubBonus = Math.min(0.8, hubCount * 0.2); // +0.2 por hub, max +0.8
        strategicDelta += hubBonus;

        // 2. Conectividad Global (Regiones únicas)
        const uniqueRegions = new Set();
        routes.forEach(r => {
            const originAp = window.AIRPORTS?.[r.origin];
            const destAp = window.AIRPORTS?.[r.dest];
            if (originAp?.region) uniqueRegions.add(originAp.region);
            if (destAp?.region) uniqueRegions.add(destAp.region);
        });
        const globalPresence = 
            uniqueRegions.size >= 4 ? 0.6 :  // Presencia en 4+ regiones
            uniqueRegions.size >= 3 ? 0.4 :  // 3 regiones
            uniqueRegions.size >= 2 ? 0.2 :  // 2 regiones
            0;
        strategicDelta += globalPresence;

        // 3. Tamaño de Flota
        const fleetSize = this.game.managers.fleet.ownedPlanes.length;
        const fleetTier = 
            fleetSize >= 20 ? 0.5 :  // Aerolínea grande
            fleetSize >= 10 ? 0.3 :  // Mediana
            fleetSize >= 5  ? 0.1 :  // Pequeña
            0;                        // Startup
        strategicDelta += fleetTier;

        // 4. Modernidad de Flota (Edad Promedio)
        if (fleetSize > 0) {
            const now = this.game.state.date || Date.now();
            const totalAge = this.game.managers.fleet.ownedPlanes.reduce((sum, plane) => {
                const deliveredAt = plane.deliveredAt || now;
                const ageDays = Math.max(0, (now - deliveredAt) / 86400000);
                return sum + ageDays;
            }, 0);
            const avgAge = totalAge / fleetSize;
            const modernityBonus = 
                avgAge < 60  ? 0.3 :   // Flota muy nueva
                avgAge < 120 ? 0.15 :  // Nueva
                avgAge < 250 ? 0 :     // Media
                -0.2;                  // Envejecida
            strategicDelta += modernityBonus;
        }

        // 5. Densidad de Red (Rutas por Hub)
        if (hubCount > 0) {
            const routesPerHub = routes.length / hubCount;
            const efficiencyBonus = 
                routesPerHub >= 8  ? 0.4 :  // Red muy densa
                routesPerHub >= 5  ? 0.2 :  // Buena cobertura
                routesPerHub >= 3  ? 0.1 :  // Básica
                -0.15;                      // Red débil
            strategicDelta += efficiencyBonus;
        }

        // 6. Diversidad de Flota (Categorías)
        const fleetCategories = new Set(this.game.managers.fleet.ownedPlanes.map(p => p.baseStats.category));
        const diversityBonus = 
            fleetCategories.size >= 3 ? 0.3 :  // Flota versátil
            fleetCategories.size >= 2 ? 0.15 : // Dos categorías
            0;                                  // Monótipo
        strategicDelta += diversityBonus;

        // 7. Cuota de Mercado
        const marketShare = this.game.managers.competitors?.getCompetitionStatus()?.playerShare || 0;
        const scaleBonus = 
            marketShare >= 0.10 ? 0.5 :  // 10%+ del mercado (líder)
            marketShare >= 0.05 ? 0.3 :  // 5%+
            marketShare >= 0.02 ? 0.1 :  // 2%+
            0;
        strategicDelta += scaleBonus;

        // 8. Frecuencias Altas (Preferencia de Pasajeros)
        if (routes.length > 0) {
            const avgFrequency = routes.reduce((s, r) => s + (r.frequency || 7), 0) / routes.length;
            const frequencyBonus = 
                avgFrequency >= 14 ? 0.3 :  // Múltiples vuelos diarios
                avgFrequency >= 10 ? 0.15 : // Alta frecuencia
                0;
            strategicDelta += frequencyBonus;
        }

        // Log estratégico en historial
        if (!this.game.state.reputationHistory) {
            this.game.state.reputationHistory = [];
        }
        this.game.state.reputationHistory.push({
            date: this.game.state.date,
            delta: strategicDelta,
            reason: `Estratégico: ${hubCount}hubs ${uniqueRegions.size}reg ${fleetSize}aviones ${(marketShare*100).toFixed(1)}%share`,
            type: 'strategic'
        });

        return Math.max(-2, Math.min(2, strategicDelta));
    }

    // ==========================================
    // SEMANA 3: FUEL HEDGING SYSTEM
    // ==========================================

    /**
     * Purchase fuel contract at fixed price
     * @param {number} volumeLiters - Liters to purchase
     * @param {number} durationDays - Contract duration
     * @returns {object} {success, msg, contract?}
     */
    purchaseFuelContract(volumeLiters, durationDays) {
        return this.fuelSystem.purchaseContract(volumeLiters, durationDays);
    }

    /**
     * Purchase spot fuel volume at market price
     */
    purchaseSpotFuel(volumeLiters, durationDays) {
        return this.fuelSystem.purchaseSpotBlock(volumeLiters, durationDays);
    }

    /**
     * Get effective fuel price (considers active contracts)
     * @returns {number} Price per liter
     */
    getEffectiveFuelPrice() {
        return this.fuelSystem.getEffectivePrice();
    }

    /**
     * Consume fuel from contracts (called when calculating costs)
     * @param {number} liters - Fuel consumed
     */
    consumeFuelFromContracts(liters) {
        this.fuelSystem.consume(liters);
    }

    /**
     * Clean up expired contracts
     */
    cleanExpiredFuelContracts() {
        this.fuelSystem.cleanExpiredContracts();
    }

    // ==========================================
    // SEMANA 3: CORPORATE CONTRACTS
    // ==========================================

    /**
     * Create corporate contract (guaranteed revenue)
     * @param {string} company - Company name
    // ==========================================
    // SEMANA 3: CORPORATE CONTRACTS (OLD SYSTEM - DEPRECATED)
    // Keeping for backward compatibility but not used in UI
    // ==========================================

    /**
     * Get active corporate contract revenue
     */
    getCorporateContractRevenue() {
        if (!this.game.state.corporateContracts) return 0;
        
        const now = this.game.state.date;
        const active = this.game.state.corporateContracts.filter(c => 
            c.status === 'active' && now >= c.startDate && now <= c.endDate
        );

        return active.reduce((sum, c) => sum + c.dailyRevenue, 0);
    }

    /**
     * Clean expired corporate contracts
     */
    cleanExpiredCorporateContracts() {
        if (!this.game.state.corporateContracts) return;
        
        const now = this.game.state.date;
        this.game.state.corporateContracts = this.game.state.corporateContracts.filter(c => {
            if (now > c.endDate) {
                console.log(`📋 Contrato corporativo expirado: ${c.company}`);
                return false;
            }
            return true;
        });
    }

    // ==========================================
    // SEMANA 3: CREDIT SYSTEM
    // ==========================================

    /**
     * Request a bank loan
     * @param {number} amount - Loan amount
     * @param {number} monthsDuration - Loan duration in months
     * @returns {object} {success, msg, loan?}
     */
    requestLoan(amount, monthsDuration) {
        if (!this.game.state.loans) this.game.state.loans = [];

        // Loan limits based on assets
        const maxLoan = this.calculateMaxLoanAmount();
        if (amount > maxLoan) {
            return { success: false, msg: `Límite de préstamo: $${maxLoan.toLocaleString()}` };
        }

        // Interest rates based on risk (reputation)
        const rep = this.game.state.reputation || 50;
        const baseRate = 0.08; // 8% base
        const riskMultiplier = (100 - rep) / 50; // Poor rep = higher rate
        const interestRate = baseRate * Math.max(1.0, riskMultiplier); // Capped at base rate if good rep

        const monthlyPayment = (amount / monthsDuration) + (amount * interestRate / 12);
        const totalPayments = monthsDuration;

        const loan = {
            id: 'loan-' + Date.now(),
            amount,
            interestRate,
            monthlyPayment: Math.round(monthlyPayment),
            startDate: this.game.state.date,
            monthsRemaining: monthsDuration,
            totalPayments,
            status: 'active'
        };

        this.game.state.loans.push(loan);
        this.game.state.money += amount;
        this.game.save();

        const effectiveRate = (interestRate * 100).toFixed(1);
        return { 
            success: true, 
            msg: `Préstamo: $${amount.toLocaleString()} @ ${effectiveRate}% tasa, $${loan.monthlyPayment.toLocaleString()}/mes`,
            loan 
        };
    }

    /**
     * Calculate maximum loan amount based on assets and reputation
     */
    calculateMaxLoanAmount() {
        // Formula: (fleet value + daily income * 30) * multiplier
        const fleetValue = this.game.managers.fleet.ownedPlanes.length * 100000; // Approx
        const dailyIncome = (this.game.state.lastEconomy?.gross || 100000);
        const monthlyIncome = dailyIncome * 30;
        
        const rep = this.game.state.reputation || 50;
        const repMultiplier = 0.5 + (rep / 100); // 0.5x to 1.5x

        const maxLoan = Math.floor((fleetValue + monthlyIncome * 3) * repMultiplier);
        return Math.min(maxLoan, 500000000); // Hard cap $500M
    }

    /**
     * Process monthly loan payments
     */
    processLoanPayments() {
        if (!this.game.state.loans) return 0;

        let totalPayments = 0;

        this.game.state.loans = this.game.state.loans.filter(loan => {
            if (loan.status !== 'active') return false;

            loan.monthsRemaining--;
            const payment = loan.monthlyPayment;
            
            this.game.state.money -= payment;
            totalPayments += payment;

            if (loan.monthsRemaining <= 0) {
                console.log(`💳 Préstamo pagado: $${loan.amount.toLocaleString()}`);
                return false; // Remove completed loan
            }

            return true;
        });

        if (totalPayments > 0) {
            console.log(`💳 Pagos de préstamo: -$${totalPayments.toLocaleString()}`);
        }

        return totalPayments;
    }

    /**
     * Get total outstanding loan debt
     */
    getTotalDebt() {
        if (!this.game.state.loans) return 0;
        
        return this.game.state.loans
            .filter(l => l.status === 'active')
            .reduce((sum, l) => sum + (l.amount * (l.monthsRemaining / l.totalPayments)), 0);
    }

    // ==========================================
    // SEMANA 3 FASE 1: CORPORATE CONTRACT SYSTEM
    // ==========================================

    /**
     * Load contract types from module
     */

    /**
     * Generate contract offers based on player level
     * Called weekly by timeManager
     * @returns {Array} Array of contract offers
     */
    generateContractOffers() {
        const playerLevel = this.game.state.level || 1;
        const now = this.game.state.date;

        console.log('🔍 generateContractOffers DEBUG:', {
            playerLevel,
            lastGeneration: this.game.state.lastContractOfferGeneration,
            timeSince: this.game.state.lastContractOfferGeneration 
                ? (now - this.game.state.lastContractOfferGeneration) / (24 * 60 * 60 * 1000)
                : 'never',
            currentOffers: this.game.state.corporateContractOffers?.length || 0
        });

        // Check if already generated recently
        if (this.game.state.lastContractOfferGeneration) {
            const timeSinceLastGeneration = (now - this.game.state.lastContractOfferGeneration) / (24 * 60 * 60 * 1000);
            if (timeSinceLastGeneration < 7) {
                console.log('⏭️ Skipping generation - generated recently');
                return (this.game.state.corporateContractOffers || []);
            }
        }

        // Get available tiers for current level
        const availableTiers = Object.values(this.CONTRACT_TYPES).filter(tier => 
            playerLevel >= tier.minLevel && playerLevel <= tier.maxLevel
        );

        console.log('🎯 Available tiers for level', playerLevel, ':', availableTiers.map(t => t.tier));

        // Also include lower tiers that player can still access
        const lowerTiers = Object.values(this.CONTRACT_TYPES).filter(tier => 
            playerLevel >= tier.minLevel && tier.minLevel < playerLevel
        );

        // Combine both (current level + accessible lower tiers)
        const allAccessibleTiers = [...new Set([...availableTiers, ...lowerTiers])];

        console.log('🎯 All accessible tiers:', allAccessibleTiers.map(t => t.tier));

        if (allAccessibleTiers.length === 0) {
            console.warn('⚠️ No available tiers for level', playerLevel);
            return [];
        }

        // Generate 2-3 random offers
        const offerCount = Math.floor(Math.random() * 2) + 2; // 2 or 3
        const offers = [];

        // Always include 1 LOCAL tier offer (easy to accept)
        const localTier = this.CONTRACT_TYPES.LOCAL;
        if (localTier && playerLevel >= localTier.minLevel) {
            const company = this.getRandomCompanyNameInternal(localTier);
            const duration = this.getContractDurationInternal(localTier);
            const routes = (this.game.state.routes || []).filter(r => r.status === 'active');
            let baseRevenue = 3000;
            if (routes.length > 0) {
                const route = routes[Math.floor(Math.random() * routes.length)];
                baseRevenue = route.dailyRevenue || 3000;
            }
            const dailyRevenue = this.calculateContractDailyRevenueInternal(baseRevenue, localTier);

            offers.push({
                id: 'offer-' + Date.now() + '-local',
                tier: localTier.tier,
                tierData: localTier,
                company,
                duration,
                dailyRevenue,
                totalRevenue: dailyRevenue * duration,
                upfrontFee: Math.round(dailyRevenue * duration * 0.10),
                generatedDate: now,
                expiresDate: now + (7 * 24 * 60 * 60 * 1000),
                description: localTier.description
            });
        }

        // Generate remaining offers from accessible tiers
        for (let i = offers.length; i < offerCount; i++) {
            const tier = allAccessibleTiers[Math.floor(Math.random() * allAccessibleTiers.length)];
            const company = this.getRandomCompanyNameInternal(tier);
            const duration = this.getContractDurationInternal(tier);
            
            // Get base revenue (from random route or default value)
            const routes = (this.game.state.routes || []).filter(r => r.status === 'active');
            let baseRevenue = 5000; // Default base revenue
            
            if (routes.length > 0) {
                const route = routes[Math.floor(Math.random() * routes.length)];
                baseRevenue = route.dailyRevenue || 5000;
            }
            
            const dailyRevenue = this.calculateContractDailyRevenueInternal(baseRevenue, tier);

            const offer = {
                id: 'offer-' + Date.now() + '-' + i,
                tier: tier.tier,
                tierData: tier,
                company,
                duration,
                dailyRevenue,
                totalRevenue: dailyRevenue * duration,
                upfrontFee: Math.round(dailyRevenue * duration * 0.10),
                generatedDate: now,
                expiresDate: now + (7 * 24 * 60 * 60 * 1000), // 7 days to decide
                description: tier.description
            };

            offers.push(offer);
        }

        // Replace old offers with new ones
        this.game.state.corporateContractOffers = offers;
        this.game.state.lastContractOfferGeneration = now;

        console.log(`📩 Generated ${offers.length} contract offers for level ${playerLevel}:`, offers);
        return offers;
    }

    /**
     * Get random company name from tier
     */
    getRandomCompanyNameInternal(tier) {
        const companies = tier.companies;
        return companies[Math.floor(Math.random() * companies.length)];
    }

    /**
     * Get contract duration for tier
     */
    getContractDurationInternal(tier) {
        const { min, max } = tier.durationDays;
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    /**
     * Calculate daily revenue for contract
     */
    calculateContractDailyRevenueInternal(routeBaseDailyRevenue, tier) {
        const { min, max } = tier.dailyRevenueMultiplier;
        const multiplier = min + (Math.random() * (max - min));
        return Math.round(routeBaseDailyRevenue * multiplier);
    }

    /**
     * Validar si un contrato cumple requisitos
     * @param {string} offerId - ID de oferta
     * @returns {object} {valid: boolean, reasons: []}
     */
    validateContractAcceptance(offerId) {
        const offer = (this.game.state.corporateContractOffers || []).find(o => o.id === offerId);
        if (!offer) {
            return { valid: false, reasons: ['Oferta no encontrada'] };
        }

        const reasons = [];
        const tier = offer.tierData;

        console.log('🔍 VALIDATING CONTRACT:', {
            offerId,
            tier: tier.tier,
            gameState: {
                level: this.game.state.level,
                reputation: this.game.state.reputation,
                routesFromManager: this.game.managers.routes?.getRoutes()?.length,
                fleetFromManager: this.game.managers.fleet?.ownedPlanes?.length,
                mainHub: this.game.state.mainHub
            }
        });

        // Check level
        if (this.game.state.level < tier.minLevel) {
            reasons.push(`Necesitas nivel ${tier.minLevel} (actual: ${this.game.state.level})`);
        }

        // Check reputation
        if (this.game.state.reputation < tier.requirements.minReputation) {
            reasons.push(`Necesitas reputación ${tier.requirements.minReputation} (actual: ${this.game.state.reputation})`);
        }

        // Check active routes (from RouteManager, not state)
        const allRoutes = this.game.managers.routes?.getRoutes() || [];
        const activeRoutes = allRoutes.filter(r => {
            // Active if any assignment has status ACTIVE
            let isActive = Array.isArray(r.assignments) && r.assignments.some(a => {
                return a?.status === 'ACTIVE' || a?.status === 'active' || a?.status === true;
            });
            // Legacy fallbacks
            if (!isActive && typeof r.status === 'string') {
                isActive = r.status.toUpperCase() === 'ACTIVE';
            }
            if (!isActive && r.active === true) {
                isActive = true;
            }
            // Fallback: assigned plane currently flying
            if (!isActive && r.assignedPlane) {
                const pl = this.game.managers.fleet?.ownedPlanes?.find(p => p.instanceId === r.assignedPlane);
                if (pl && pl.status === 'FLIGHT') isActive = true;
            }
            return isActive;
        }).length;
        console.log('🔍 Routes check:', {
            totalRoutes: allRoutes.length,
            activeRoutes,
            required: tier.requirements.minRoutes,
            routeStatuses: allRoutes.map(r => ({
                id: r.id,
                assignments: Array.isArray(r.assignments) ? r.assignments.map(a => a.status) : null,
                legacyStatus: r.status,
                legacyActiveFlag: r.active
            }))
        });
        
        if (activeRoutes < tier.requirements.minRoutes) {
            reasons.push(`Necesitas ${tier.requirements.minRoutes} rutas activas (actual: ${activeRoutes})`);
        }

        // Check fleet size (from FleetManager, not state)
        const fleetSize = this.game.managers.fleet?.ownedPlanes?.length || 0;
        console.log('🔍 Fleet check:', {
            fleetSize,
            required: tier.requirements.minFleet
        });
        
        if (fleetSize < tier.requirements.minFleet) {
            reasons.push(`Necesitas flota de ${tier.requirements.minFleet} aviones (actual: ${fleetSize})`);
        }

        // Check hub requirement
        if (tier.requirements.hubRequired && !this.game.state.mainHub) {
            reasons.push('Necesitas un hub principal activo');
        }

        // Check active contract limit
        const activeContracts = (this.game.state.corporateContracts || []).filter(c => c.status === 'active').length;
        if (activeContracts >= tier.requirements.maxActiveContracts) {
            reasons.push(`Máximo ${tier.requirements.maxActiveContracts} contratos activos para este tier`);
        }

        // Check money for upfront fee
        if (this.game.state.money < offer.upfrontFee) {
            reasons.push(`Necesitas $${offer.upfrontFee.toLocaleString()} para pago inicial`);
        }

        return {
            valid: reasons.length === 0,
            reasons
        };
    }

    /**
     * Accept a contract offer
     * @param {string} offerId - Contract offer ID
     * @param {string} routeId - Route to bind to
     * @returns {object} {success, msg, contract?}
     */
    acceptContractOffer(offerId, routeId) {
        const offer = (this.game.state.corporateContractOffers || []).find(o => o.id === offerId);
        if (!offer) {
            return { success: false, msg: 'Oferta no encontrada' };
        }

        // Validate acceptance
        const validation = this.validateContractAcceptance(offerId);
        if (!validation.valid) {
            return { success: false, msg: validation.reasons.join(' • ') };
        }

        // Find route via RouteManager
        const route = this.game.managers.routes?.getRoutes()?.find(r => r.id === routeId);
        if (!route) {
            return { success: false, msg: 'Ruta no encontrada' };
        }

        // Check if route already has contract
        const existingContract = (this.game.state.corporateContracts || []).find(c => 
            c.routeId === routeId && c.status === 'active'
        );
        if (existingContract) {
            return { success: false, msg: 'Esta ruta ya tiene un contrato corporativo activo' };
        }

        // Deduct upfront fee
        this.game.state.money -= offer.upfrontFee;

        // Create contract
        const now = this.game.state.date;
        const contract = {
            id: 'contract-' + Date.now(),
            offerId,
            tier: offer.tier,
            company: offer.company,
            routeId,
            dailyRevenue: offer.dailyRevenue,
            seatsReserved: Math.floor((route.seats.economy + route.seats.premium + route.seats.business) * 0.40),
            startDate: now,
            endDate: now + (offer.duration * 24 * 60 * 60 * 1000),
            duration: offer.duration,
            status: 'active',
            performance: {
                delays: 0,
                cancellations: 0,
                totalFlights: 0,
                pricingViolations: 0
            }
        };

        // Add to active contracts
        (this.game.state.corporateContracts = this.game.state.corporateContracts || []).push(contract);

        // Remove offer
        this.game.state.corporateContractOffers = this.game.state.corporateContractOffers.filter(o => o.id !== offerId);

        console.log(`✅ Contract accepted: ${contract.company} on ${route.origin}→${route.dest}`);

        // Persist changes
        this.game.save();

        return { 
            success: true, 
            msg: `Contrato con ${offer.company} firmado. Ingresos garantizados: $${offer.dailyRevenue.toLocaleString()}/día`,
            contract 
        };
    }
}


