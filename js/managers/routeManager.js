import { AIRPORTS, Airport } from '../models/airport.js';

export class RouteManager {
    constructor(game) {
        this.game = game;
        this.routes = [];
    }

    loadData(data) {
        if (Array.isArray(data)) {
            this.routes = data.map(route => {
                // Migration: Introduce assignments[] for multi-aircraft routes
                if (!route.assignments) {
                    route.assignments = [];
                    if (route.assignedPlane) {
                        route.assignments.push({
                            planeId: route.assignedPlane,
                            status: 'ACTIVE',
                            frequencyPerDay: 1
                        });
                    }
                }
                // Migration: Add seats property if missing
                if (!route.seats) {
                    const plane = this.game?.managers?.fleet?.ownedPlanes?.find(p => p.instanceId === route.assignedPlane);
                    if (plane) {
                        // Get seats from plane
                        if (plane.configuration && plane.configuration.economy) {
                            route.seats = {
                                economy: plane.configuration.economy,
                                premium: plane.configuration.premium,
                                business: plane.configuration.business
                            };
                        } else {
                            // Default split from baseStats.seats
                            const totalSeats = plane.baseStats.seats || 0;
                            route.seats = {
                                economy: Math.floor(totalSeats * 0.7),
                                premium: Math.floor(totalSeats * 0.2),
                                business: Math.ceil(totalSeats * 0.1)
                            };
                        }
                    } else {
                        // Fallback if plane not found (shouldn't happen)
                        route.seats = { economy: 100, premium: 30, business: 10 }; // Default fallback
                    }
                }
                
                // Migration: Add priceMultiplier if missing
                if (!route.priceMultiplier) {
                    route.priceMultiplier = 1.0;
                }

                // Migration: Add frequency if missing (default 7x per week - daily)
                if (!route.frequency) {
                    route.frequency = 7;
                }

                // Migration: Add events array if missing
                if (!route.events) {
                    route.events = [];
                }

                // Migration: Add lastEventCheck if missing
                if (!route.lastEventCheck) {
                    route.lastEventCheck = this.game?.state?.date || Date.now();
                }

                // Normalize priceMultiplier/frequency defaults
                route.priceMultiplier = route.priceMultiplier || 1.0;
                route.frequency = route.frequency || 7;

                // Recompute dailyRevenue as sum of assignment revenues if assignments exist
                try {
                    if (Array.isArray(route.assignments) && route.assignments.length > 0) {
                        const originAp = AIRPORTS[route.origin];
                        const destAp = AIRPORTS[route.dest];
                        const originDemandFactor = originAp ? Airport.getDemandFactor(originAp) : 1.0;
                        const destDemandFactor = destAp ? Airport.getDemandFactor(destAp) : 1.0;
                        let sum = 0;
                        route.assignments.forEach(a => {
                            const plane = this.game?.managers?.fleet?.ownedPlanes?.find(p => p.instanceId === a.planeId);
                            if (!plane) return;
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
                            sum += this.calculatePotentialRevenue(
                                route.distance,
                                seats,
                                route.priceMultiplier,
                                originDemandFactor,
                                destDemandFactor,
                                route.origin,
                                route.dest,
                                route.frequency
                            );
                        });
                        route.dailyRevenue = Math.floor(sum);
                    }
                } catch (e) {
                    // Best-effort migration; keep existing dailyRevenue on errors
                }
                
                return route;
            });
        }
    }

    getFlatData() {
        return this.routes;
    }

    getDistance(id1, id2) {
        const ap1 = AIRPORTS[id1];
        const ap2 = AIRPORTS[id2];
        if (!ap1 || !ap2) return 0;

        return this.calculateHaversine(ap1.lat, ap1.lon, ap2.lat, ap2.lon);
    }

    getAirport(id) {
        return AIRPORTS[id];
    }

    // Get airports available for player's current level
    getAvailableAirports() {
        const playerLevel = this.game.state.level || 1;
        return Object.entries(AIRPORTS)
            .filter(([id, ap]) => Airport.isUnlockedAtLevel(ap, playerLevel))
            .reduce((acc, [id, ap]) => {
                acc[id] = ap;
                return acc;
            }, {});
    }

    validateRouteByHub(origin, dest) {
        // Enforce: origin must be one of player's owned hubs
        const hubs = this.game.state.hubs || {};
        const hubIds = Object.keys(hubs);

        if (hubIds.length === 0) {
            return { success: false, msg: "No tienes hubs activos. Selecciona un hub antes de crear rutas." };
        }

        const originIsHub = hubIds.includes(origin);
        if (!originIsHub) {
            return { success: false, msg: `El origen debe ser uno de tus hubs: ${hubIds.join(', ')}` };
        }

        // Slots must be available at origin hub
        const originHub = hubs[origin];
        if (originHub && originHub.slots && originHub.slots.total > 0) {
            if (originHub.slots.used >= originHub.slots.total) {
                return { success: false, msg: `Hub ${origin} está lleno (${originHub.slots.used}/${originHub.slots.total} slots)` };
            }
        }

        // Optional: if destination is also our hub, check its slots too
        const destHub = hubs[dest];
        if (destHub && destHub.slots && destHub.slots.total > 0) {
            if (destHub.slots.used >= destHub.slots.total) {
                return { success: false, msg: `Hub ${dest} está lleno (${destHub.slots.used}/${destHub.slots.total} slots)` };
            }
        }

        return { success: true };
    }

    /**
     * Listar destinos factibles por autonomía y compatibilidad de pista
     */
    getFeasibleDestinations(aircraftInstanceId, originId) {
        const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === aircraftInstanceId);
        if (!plane) return [];

        const playerLevel = this.game.state.level || 1;
        const originAp = AIRPORTS[originId];
        if (!originAp) return [];

        const result = [];
        for (const [id, ap] of Object.entries(AIRPORTS)) {
            if (!Airport.isUnlockedAtLevel(ap, playerLevel)) continue;
            if (id === originId) continue;
            // Runway compatibility both sides
            if (plane.baseStats.runway > originAp.runway) continue;
            if (plane.baseStats.runway > ap.runway) continue;
            // Range check
            const dist = this.getDistance(originId, id);
            if (dist <= 0) continue;
            if (plane.baseStats.range < dist) continue;
            result.push({ id, dist, runway: ap.runway, city: ap.city, country: ap.country });
        }
        // Sort by distance ascending
        result.sort((a, b) => a.dist - b.dist);
        return result;
    }

    deleteRoute(routeId) {
        const idx = this.routes.findIndex(r => r.id === routeId);
        if (idx === -1) return { success: false, msg: "Ruta no encontrada" };
        const route = this.routes[idx];
        // Free all assigned planes
        if (Array.isArray(route.assignments) && route.assignments.length > 0) {
            route.assignments.forEach(a => {
                const pl = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === a.planeId);
                if (pl) {
                    pl.routeId = null;
                    pl.activeFlight = null;
                    if (pl.status === 'FLIGHT') pl.status = 'IDLE';
                }
            });
        } else {
            const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === route.assignedPlane);
            if (plane) {
                plane.routeId = null;
                if (plane.status === "FLIGHT") {
                    plane.status = "IDLE";
                }
            }
        }

        const hubs = this.game.state.hubs || {};
        const originHub = hubs[route.origin];
        const destHub = hubs[route.dest];
        const decrementTimes = Math.max(1, (Array.isArray(route.assignments) ? route.assignments.length : 1));
        if (originHub && originHub.slots) originHub.slots.used = Math.max(0, originHub.slots.used - decrementTimes);
        if (destHub && destHub.slots) destHub.slots.used = Math.max(0, destHub.slots.used - decrementTimes);

        this.routes.splice(idx, 1);
        this.game.save();
        return { success: true };
    }

    getActiveHubs() {
        return Object.keys(this.game.state.hubs).filter(
            hubId => this.game.state.hubs[hubId].level > 0
        );
    }

    calculateHaversine(lat1, lon1, lat2, lon2) {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c);
    }

    createRoute(originId, destId, aircraftInstanceId, priceMultiplier = 1.0) {
        // Validation
        if (originId === destId) return { success: false, msg: "Destino igual a Origen" };

        // Hub validation
        const hubValidation = this.validateRouteByHub(originId, destId);
        if (!hubValidation.success) return hubValidation;

        const dist = this.getDistance(originId, destId);
        const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === aircraftInstanceId);

        if (!plane) return { success: false, msg: "Avión no encontrado" };
        if (plane.status !== "IDLE") return { success: false, msg: "Avión ocupado" };
        if (plane.baseStats.range < dist) return { success: false, msg: "Rango insuficiente" };
        if (plane.condition < 40) return { success: false, msg: "Avión en mal estado (<40%). Requiere mantenimiento." };

        const originAp = AIRPORTS[originId];
        const destAp = AIRPORTS[destId];

        if (plane.baseStats.runway > originAp.runway || plane.baseStats.runway > destAp.runway) {
            return { success: false, msg: "Pista muy corta para este avión" };
        }

        // Cost Calculation (e.g. $500 + $0.5/km)
        const cost = 5000 + Math.floor(dist * 2);
        if (this.game.state.money < cost) return { success: false, msg: "Sin fondos para abrir ruta" };

        // Determine hub base for this route (which hub to charge slot to)
        const originHub = this.game.state.hubs[originId];
        const destHub = this.game.state.hubs[destId];
        const hubBase = originHub ? originId : (destHub ? destId : this.game.state.mainHub);

        // Seats configuration: derive from plane's baseStats.seats if not using plane.configuration
        let seats;
        if (plane.configuration && plane.configuration.economy) {
            // Using custom configuration
            seats = {
                economy: plane.configuration.economy,
                premium: plane.configuration.premium,
                business: plane.configuration.business
            };
        } else {
            // Default split: 70% economy, 20% premium, 10% business
            const totalSeats = plane.baseStats.seats || 0;
            seats = {
                economy: Math.floor(totalSeats * 0.7),
                premium: Math.floor(totalSeats * 0.2),
                business: Math.ceil(totalSeats * 0.1)
            };
        }

        // Create Route
        const originDemandFactor = Airport.getDemandFactor(originAp);
        const destDemandFactor = Airport.getDemandFactor(destAp);

        const route = {
            id: Date.now() + Math.random().toString(),
            origin: originId,
            dest: destId,
            distance: dist,
            assignedPlane: aircraftInstanceId,
            seats: seats,
            priceMultiplier: priceMultiplier, // Pricing strategy: 0.7 (low-cost) to 1.5 (premium)
            frequency: 7, // Vuelos por semana (1, 2, 3, 7, 14)
            dailyRevenue: this.calculatePotentialRevenue(dist, seats, priceMultiplier, originDemandFactor, destDemandFactor, originId, destId, 7),
            hubBase: hubBase, // Track which hub this route operates from
            events: [], // Array para eventos (cancelaciones, retrasos, overbooking)
            lastEventCheck: this.game.state.date, // Última vez que se verificó eventos
            assignments: [
                { planeId: aircraftInstanceId, status: 'ACTIVE', frequencyPerDay: 1 }
            ]
        };

        // Transaction
        this.game.state.money -= cost;
        this.routes.push(route);

        // Update Plane Status
        plane.status = "FLIGHT";
        plane.routeId = route.id;

        // Update hub slots
        if (this.game.state.hubs[originId]) {
            this.game.state.hubs[originId].slots.used++;
        }
        if (this.game.state.hubs[destId]) {
            this.game.state.hubs[destId].slots.used++;
        }

        // Start first flight immediately for the initial assignment
        this.startFlight(plane, route, true);

        this.game.save();
        return { success: true, route: route };
    }

    calculatePotentialRevenue(dist, seats, priceMultiplier = 1.0, originDemandFactor = 1.0, destDemandFactor = 1.0, originId = null, destId = null, frequency = 7) {
        // Base Price per km per seat type
        // Eco: 1.0x, Premium: 2.2x, Business: 4.0x
        
        // Defensive checks
        if (!dist || dist <= 0) return 0;
        if (!seats) return 0;
        
        const totalSeats = (seats.economy || 0) + (seats.premium || 0) + (seats.business || 0);
        if (totalSeats <= 0) return 0;

        const baseTicket = (50 + (dist * 0.12)) * priceMultiplier;

        // Multipliers
        const prmMult = 2.2;
        const bizMult = 4.0;

        // Load Factor with reputation multiplier
        // DYNAMIC LOAD FACTOR: Based on reputation and pricing
        let finalLoadFactor = 0.85;
        
        if (this.game?.state?.reputation !== undefined) {
            // Reputation: 0 → 0.50, 50 → 0.85, 100 → 0.95
            const reputationFactor = 0.50 + (this.game.state.reputation / 100 * 0.45);
            
            // Price impact: low price (+occupancy), high price (-occupancy)
            let priceFactor = 1.0;
            if (priceMultiplier < 1.0) {
                priceFactor = 1.0 + ((1.0 - priceMultiplier) * 0.20); // Low price = +20% max
            } else if (priceMultiplier > 1.0) {
                priceFactor = 1.0 - ((priceMultiplier - 1.0) * 0.35); // High price = -35% max
            }
            
            finalLoadFactor = reputationFactor * priceFactor;
            // Clamp between 0.40 and 1.0
            finalLoadFactor = Math.max(0.40, Math.min(1.0, finalLoadFactor));
        }

        // Apply demand factors from airport annual passenger volume
        const avgDemandFactor = (originDemandFactor + destDemandFactor) / 2;

        // Aplicar impacto de competencia si está disponible
        let competitionImpact = 1.0;
        if (originId && destId && this.game.managers?.competitors) {
            competitionImpact = this.game.managers.competitors.calculateCompetitionImpact(originId, destId);
        }

        const revEco = (seats.economy || 0) * baseTicket;
        const revPrm = (seats.premium || 0) * baseTicket * prmMult;
        const revBiz = (seats.business || 0) * baseTicket * bizMult;

        // Base revenue PER VUELO
        const revenuePerFlight = (revEco + revPrm + revBiz) * finalLoadFactor * avgDemandFactor * competitionImpact;
        
        // Multiplicar por frecuencia semanal y dividir por 7 para obtener ingreso diario
        const dailyRevenue = (revenuePerFlight * frequency) / 7;
        
        return Math.floor(dailyRevenue);
    }

    calculateLoadFactorByReputation(origin, dest, priceMultiplier = 1.0) {
        // Mapeo: reputación 0 → 0.71 (60%), reputación 100 → 1.18 (100%)
        // A reputación 50 (base) → 1.0 (85%)
        const reputation = this.game.state.reputation || 50;
        // Fórmula: factor = 0.71 + (reputation / 100) * 0.47
        let repFactor = 0.71 + (reputation / 100) * 0.47;
        
        // Competencia local por competidores en origen/destino
        let compFactor = 1.0;
        if (origin && dest && this.game.managers?.competitors?.calculateCompetitionImpact) {
            compFactor = this.game.managers.competitors.calculateCompetitionImpact(origin, dest);
        }
        
        // Pricing impact on load factor
        // Precio bajo (0.7x-0.9x) aumenta ocupación hasta 10%
        // Precio alto (1.1x-1.5x) reduce ocupación hasta 20%
        let priceFactor = 1.0;
        if (priceMultiplier < 1.0) {
            priceFactor = 1.0 + ((1.0 - priceMultiplier) * 0.33); // Max +10% at 0.7x
        } else if (priceMultiplier > 1.0) {
            priceFactor = 1.0 - ((priceMultiplier - 1.0) * 0.4); // Max -20% at 1.5x
        }
        
        return repFactor * compFactor * priceFactor;
    }

    calculateLoadFactorSimple(priceMultiplier = 1.0) {
        // Versión simplificada sin origen/destino para previsualizaciones de UI
        const reputation = this.game.state.reputation || 50;
        let repFactor = 0.71 + (reputation / 100) * 0.47;
        
        // Pricing impact on load factor
        let priceFactor = 1.0;
        if (priceMultiplier < 1.0) {
            priceFactor = 1.0 + ((1.0 - priceMultiplier) * 0.33); // Max +10% at 0.7x
        } else if (priceMultiplier > 1.0) {
            priceFactor = 1.0 - ((priceMultiplier - 1.0) * 0.4); // Max -20% at 1.5x
        }
        
        return repFactor * priceFactor;
    }

    calculateYield(route) {
        // Yield = revenue per passenger-km
        const seats = route.seats || {};
        const totalSeats = (seats.economy || 0) + (seats.premium || 0) + (seats.business || 0);
        if (totalSeats === 0 || route.distance === 0) return 0;
        
        const priceMultiplier = route.priceMultiplier || 1.0;
        const baseTicket = (50 + (route.distance * 0.12)) * priceMultiplier;
        
        // Average ticket price weighted by class
        const avgTicket = (
            (seats.economy * baseTicket) +
            (seats.premium * baseTicket * 2.2) +
            (seats.business * baseTicket * 4.0)
        ) / totalSeats;
        
        return avgTicket / route.distance; // $/pax/km
    }

    getRivalAveragePrice(origin, dest) {
        // Get average price multiplier from competitors on this route
        if (!this.game.managers?.competitors?.calculateCompetitionImpact) {
            return 1.0; // Default if no competitor data
        }
        // Use competition impact as price factor (lower competition = higher prices possible)
        return this.game.managers.competitors.calculateCompetitionImpact(origin, dest);
    }

    getDemandFactors(originId, destId) {
        const originAp = AIRPORTS[originId];
        const destAp = AIRPORTS[destId];
        const originDemandFactor = originAp ? Airport.getDemandFactor(originAp) : 1.0;
        const destDemandFactor = destAp ? Airport.getDemandFactor(destAp) : 1.0;
        return { originDemandFactor, destDemandFactor };
    }

    updateRoutePricing(routeId, newPriceMultiplier) {
        const route = this.routes.find(r => r.id === routeId);
        if (!route) return { success: false, msg: "Ruta no encontrada" };
        
        route.priceMultiplier = Math.max(0.7, Math.min(1.5, newPriceMultiplier));
        
        const originAp = AIRPORTS[route.origin];
        const destAp = AIRPORTS[route.dest];
        const originDemandFactor = originAp ? Airport.getDemandFactor(originAp) : 1.0;
        const destDemandFactor = destAp ? Airport.getDemandFactor(destAp) : 1.0;

        // Sum per-assignment revenue if present, else fallback to route.seats
        if (Array.isArray(route.assignments) && route.assignments.length > 0) {
            let sum = 0;
            route.assignments.forEach(a => {
                const pl = this.game.managers.fleet.ownedPlanes.find(pp => pp.instanceId === a.planeId);
                if (!pl) return;
                const seats = pl.configuration && pl.configuration.economy ? {
                    economy: pl.configuration.economy,
                    premium: pl.configuration.premium,
                    business: pl.configuration.business
                } : (function(){
                    const totalSeats = pl.baseStats.seats || 0;
                    return {
                        economy: Math.floor(totalSeats * 0.7),
                        premium: Math.floor(totalSeats * 0.2),
                        business: Math.ceil(totalSeats * 0.1)
                    };
                })();
                sum += this.calculatePotentialRevenue(route.distance, seats, route.priceMultiplier, originDemandFactor, destDemandFactor, route.origin, route.dest, route.frequency || 7);
            });
            route.dailyRevenue = Math.floor(sum);
        } else {
            route.dailyRevenue = this.calculatePotentialRevenue(
                route.distance, 
                route.seats,
                route.priceMultiplier,
                originDemandFactor,
                destDemandFactor
            );
        }
        
        this.game.save();
        return { success: true, route };
    }


    getRoutes() {
        return this.routes;
    }

    removeRoute(routeId) {
        const routeIdx = this.routes.findIndex(r => r.id === routeId);
        if (routeIdx === -1) return { success: false, msg: "Ruta no encontrada" };

        const route = this.routes[routeIdx];
        // Free up assigned planes
        if (Array.isArray(route.assignments) && route.assignments.length > 0) {
            route.assignments.forEach(a => {
                const pl = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === a.planeId);
                if (pl) {
                    pl.status = 'IDLE';
                    pl.routeId = null;
                    pl.activeFlight = null;
                }
            });
        } else {
            const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === route.assignedPlane);
            if (plane) {
                plane.status = "IDLE";
                delete plane.routeId;
            }
        }

        // Decrement hub slots
        const decrementTimes2 = Math.max(1, (Array.isArray(route.assignments) ? route.assignments.length : 1));
        if (this.game.state.hubs[route.origin] && this.game.state.hubs[route.origin].slots) {
            this.game.state.hubs[route.origin].slots.used = Math.max(0, this.game.state.hubs[route.origin].slots.used - decrementTimes2);
        }
        if (this.game.state.hubs[route.dest] && this.game.state.hubs[route.dest].slots) {
            this.game.state.hubs[route.dest].slots.used = Math.max(0, this.game.state.hubs[route.dest].slots.used - decrementTimes2);
        }

        // Remove route
        this.routes.splice(routeIdx, 1);
        this.game.save();

        return { success: true };
    }

    // --- REAL-TIME FLIGHT LOGIC ---
    // Methods were accidentally placed outside class
    // Moving them inside now...

    startFlight(plane, route, isOutbound) {
        const now = this.game.state.date;
        const speedKmph = plane.baseStats.speed;
        const distKm = route.distance;

        // Flight duration logic...
        const flightHours = distKm / speedKmph;
        const durationMs = flightHours * 3600000;

        plane.activeFlight = {
            routeId: route.id,
            departureTime: now,
            arrivalTime: now + durationMs,
            source: isOutbound ? route.origin : route.dest,
            target: isOutbound ? route.dest : route.origin,
            duration: durationMs,
            isOutbound: isOutbound
        };
    }

    update() {
        const now = this.game.state.date;

        this.routes.forEach(route => {
            // Iterate over assignments if available; fallback to assignedPlane for legacy
            const planesToProcess = [];
            if (Array.isArray(route.assignments) && route.assignments.length > 0) {
                route.assignments.forEach(a => {
                    const p = this.game.managers.fleet.ownedPlanes.find(pp => pp.instanceId === a.planeId);
                    if (p) planesToProcess.push(p);
                });
            } else if (route.assignedPlane) {
                const p = this.game.managers.fleet.ownedPlanes.find(pp => pp.instanceId === route.assignedPlane);
                if (p) planesToProcess.push(p);
            }

            planesToProcess.forEach(plane => {
                if (!plane.activeFlight) {
                    this.startFlight(plane, route, true);
                }
                if (plane.activeFlight && now >= plane.activeFlight.arrivalTime) {
                    this.processArrival(plane, route);
                }
            });
        });
    }

    processArrival(plane, route) {
        if (!plane.activeFlight) return; // Safety check
        
        // Compute per-plane leg revenue based on its own seat config
        const originAp = AIRPORTS[route.origin];
        const destAp = AIRPORTS[route.dest];
        const originDemandFactor = originAp ? Airport.getDemandFactor(originAp) : 1.0;
        const destDemandFactor = destAp ? Airport.getDemandFactor(destAp) : 1.0;
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
        const planeDaily = this.calculatePotentialRevenue(
            route.distance,
            seats,
            route.priceMultiplier,
            originDemandFactor,
            destDemandFactor,
            route.origin,
            route.dest,
            route.frequency
        );
        const legRevenue = Math.floor(planeDaily / 2);
        this.game.state.money += legRevenue;
        // Reputación ahora se procesa solo en processReputation() diario

        const wasOutbound = plane.activeFlight.isOutbound;

        // Estadísticas de aeronave
        const durationHours = (plane.activeFlight?.duration || 0) / 3600000;
        plane.hoursFlown = (plane.hoursFlown || 0) + durationHours;

        const totalSeatsCount = (plane.configuration?.economy || 0) + (plane.configuration?.premium || 0) + (plane.configuration?.business || 0);
        const loadFactor = this.calculateLoadFactorByReputation(route.origin, route.dest);
        const passengers = Math.max(0, Math.floor(totalSeatsCount * 0.85 * loadFactor));

        plane.totalPassengers = (plane.totalPassengers || 0) + passengers;
        plane.totalRevenue = (plane.totalRevenue || 0) + legRevenue;

        const legRouteLabel = wasOutbound ? `${route.origin} ➔ ${route.dest}` : `${route.dest} ➔ ${route.origin}`;
        if (typeof plane.addFlightRecord === 'function') {
            plane.addFlightRecord(this.game.state.date, legRouteLabel, legRevenue, passengers);
        }

        // 2. Return Trip or New Cycle
        // Clear activeFlight to reset state
        plane.activeFlight = null;
        
        // Turnaround time (e.g. 2 hours)
        // For simplicity now: Instant turnaround
        this.startFlight(plane, route, !wasOutbound);
    }

    /**
     * Actualizar frecuencia de una ruta (1, 2, 3, 7, 14 vuelos por semana)
     */
    updateRouteFrequency(routeId, newFrequency) {
        const route = this.routes.find(r => r.id === routeId);
        if (!route) return { success: false, msg: "Ruta no encontrada" };

        const validFrequencies = [1, 2, 3, 7, 14];
        if (!validFrequencies.includes(newFrequency)) {
            return { success: false, msg: "Frecuencia inválida. Debe ser: 1, 2, 3, 7 o 14" };
        }

        const oldFrequency = route.frequency || 7;
        route.frequency = newFrequency;

        // Recalcular ingresos sumando por asignación si existe
        const originAp = AIRPORTS[route.origin];
        const destAp = AIRPORTS[route.dest];
        const originDemandFactor = originAp ? Airport.getDemandFactor(originAp) : 1.0;
        const destDemandFactor = destAp ? Airport.getDemandFactor(destAp) : 1.0;
        if (Array.isArray(route.assignments) && route.assignments.length > 0) {
            let sum = 0;
            route.assignments.forEach(a => {
                const pl = this.game.managers.fleet.ownedPlanes.find(pp => pp.instanceId === a.planeId);
                if (!pl) return;
                const seats = pl.configuration && pl.configuration.economy ? {
                    economy: pl.configuration.economy,
                    premium: pl.configuration.premium,
                    business: pl.configuration.business
                } : (function(){
                    const totalSeats = pl.baseStats.seats || 0;
                    return {
                        economy: Math.floor(totalSeats * 0.7),
                        premium: Math.floor(totalSeats * 0.2),
                        business: Math.ceil(totalSeats * 0.1)
                    };
                })();
                sum += this.calculatePotentialRevenue(route.distance, seats, route.priceMultiplier, originDemandFactor, destDemandFactor, route.origin, route.dest, newFrequency);
            });
            route.dailyRevenue = Math.floor(sum);
        } else {
            route.dailyRevenue = this.calculatePotentialRevenue(
                route.distance,
                route.seats,
                route.priceMultiplier,
                originDemandFactor,
                destDemandFactor,
                route.origin,
                route.dest,
                newFrequency
            );
        }

        this.game.save();
        return { success: true, oldFreq: oldFrequency, newFreq: newFrequency };
    }

    /**
     * Procesar eventos aleatorios en rutas (diario)
     * Llamado desde EconomyManager.processDaily()
     */
    processRouteEvents() {
        const now = this.game.state.date;

        this.routes.forEach(route => {
            // Limpiar eventos antiguos (más de 3 días)
            const threeDaysAgo = now - (3 * 24 * 60 * 60 * 1000);
            route.events = route.events.filter(e => e.timestamp > threeDaysAgo);

            // Solo verificar eventos una vez por día
            const lastCheck = route.lastEventCheck || 0;
            const daysSinceCheck = (now - lastCheck) / (24 * 60 * 60 * 1000);
            if (daysSinceCheck < 1) return;

            route.lastEventCheck = now;

            // Probabilidades de eventos (ajustables)
            // Use first assigned plane for event context if available
            let plane = null;
            if (Array.isArray(route.assignments) && route.assignments.length > 0) {
                plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === route.assignments[0].planeId) || null;
            } else {
                plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === route.assignedPlane);
            }
            if (!plane) return;

            // 1. Cancelación por clima (2% base, aumenta con mal estado del avión)
            const weatherCancelProb = 0.02 + ((100 - plane.condition) / 100 * 0.03);
            if (Math.random() < weatherCancelProb) {
                const revenue = route.dailyRevenue / 7; // Pérdida de un día
                const compensation = Math.floor(revenue * 0.3); // 30% compensación
                
                route.events.push({
                    type: 'cancellation',
                    reason: 'weather',
                    timestamp: now,
                    impact: -revenue - compensation,
                    message: `Vuelo ${route.origin}-${route.dest} cancelado por clima. Pérdidas: $${revenue + compensation}`
                });

                this.game.state.money -= (revenue + compensation);
                this.game.adjustReputation(-1);
                console.log(`❌ ${route.events[route.events.length - 1].message}`);
            }

            // 2. Retraso (5% probabilidad, afecta reputación)
            if (Math.random() < 0.05) {
                const delayHours = Math.floor(Math.random() * 4) + 1; // 1-4 horas
                const repLoss = delayHours * 0.5;

                route.events.push({
                    type: 'delay',
                    hours: delayHours,
                    timestamp: now,
                    impact: -repLoss,
                    message: `Vuelo ${route.origin}-${route.dest} retrasado ${delayHours}h. Reputación: -${repLoss.toFixed(1)}`
                });

                this.game.state.reputation -= repLoss;
                console.log(`⏰ ${route.events[route.events.length - 1].message}`);
            }

            // 3. Overbooking (3% probabilidad, ganancias extra pero riesgo reputacional)
            if (Math.random() < 0.03) {
                const seats = route.seats || {};
                const totalSeats = (seats.economy || 0) + (seats.premium || 0) + (seats.business || 0);
                const extraPassengers = Math.floor(totalSeats * 0.1); // 10% sobreventa
                const extraRevenue = Math.floor(extraPassengers * 150); // ~$150 por pasajero
                const compensationCost = Math.random() < 0.3 ? Math.floor(extraRevenue * 0.5) : 0; // 30% chance de tener que compensar

                const netGain = extraRevenue - compensationCost;
                
                route.events.push({
                    type: 'overbooking',
                    passengers: extraPassengers,
                    timestamp: now,
                    impact: netGain,
                    compensated: compensationCost > 0,
                    message: `Sobreventa en ${route.origin}-${route.dest}: +${extraPassengers} pax, ${compensationCost > 0 ? 'compensación pagada' : 'sin incidencias'}. Neto: $${netGain}`
                });

                this.game.state.money += netGain;
                if (compensationCost > 0) {
                    this.game.state.reputation -= 0.5;
                }
                console.log(`📈 ${route.events[route.events.length - 1].message}`);
            }
        });

        this.game.save();
    }

    /**
     * Obtener eventos recientes de una ruta
     */
    getRouteEvents(routeId, maxDays = 7) {
        const route = this.routes.find(r => r.id === routeId);
        if (!route) return [];

        const cutoff = this.game.state.date - (maxDays * 24 * 60 * 60 * 1000);
        return route.events.filter(e => e.timestamp > cutoff).sort((a, b) => b.timestamp - a.timestamp);
    }

    // --- ASSIGNMENT API ---
    addPlaneToRoute(routeId, planeId, options = {}) {
        const route = this.routes.find(r => r.id === routeId);
        if (!route) return { success: false, msg: 'Ruta no encontrada' };
        const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === planeId);
        if (!plane) return { success: false, msg: 'Avión no encontrado' };

        // Validations
        if (plane.status !== 'IDLE') return { success: false, msg: 'Avión ocupado' };
        if (plane.condition < 40) return { success: false, msg: 'Avión en mal estado (<40%). Requiere mantenimiento.' };
        if (plane.baseStats.range < (route.distance || 0)) return { success: false, msg: 'Rango insuficiente' };
        const originAp = AIRPORTS[route.origin];
        const destAp = AIRPORTS[route.dest];
        if (plane.baseStats.runway > originAp.runway || plane.baseStats.runway > destAp.runway) {
            return { success: false, msg: 'Pista muy corta para este avión' };
        }

        // Check plane not assigned to any other route
        const alreadyAssigned = this.routes.some(r => Array.isArray(r.assignments) && r.assignments.some(a => a.planeId === planeId));
        if (alreadyAssigned) return { success: false, msg: 'El avión ya está asignado a otra ruta' };

        // Ensure assignments array
        if (!Array.isArray(route.assignments)) route.assignments = [];
        if (route.assignments.some(a => a.planeId === planeId)) {
            return { success: false, msg: 'El avión ya está asignado a esta ruta' };
        }

        // Consume hub slots for this additional assignment (one per endpoint if available)
        const originHub = this.game.state.hubs[route.origin];
        const destHub = this.game.state.hubs[route.dest];
        if (originHub && originHub.slots && originHub.slots.total > 0 && originHub.slots.used >= originHub.slots.total) {
            return { success: false, msg: `Hub ${route.origin} está lleno (${originHub.slots.used}/${originHub.slots.total} slots)` };
        }
        if (destHub && destHub.slots && destHub.slots.total > 0 && destHub.slots.used >= destHub.slots.total) {
            return { success: false, msg: `Hub ${route.dest} está lleno (${destHub.slots.used}/${destHub.slots.total} slots)` };
        }

        if (originHub && originHub.slots) originHub.slots.used += 1;
        if (destHub && destHub.slots) destHub.slots.used += 1;

        // Add assignment
        route.assignments.push({
            planeId,
            status: 'ACTIVE',
            frequencyPerDay: options.frequencyPerDay || 1
        });

        // Update plane status
        plane.status = 'FLIGHT';
        plane.routeId = route.id;

        // Recompute route daily revenue as sum of assignments
        const originDemandFactor2 = Airport.getDemandFactor(originAp);
        const destDemandFactor2 = Airport.getDemandFactor(destAp);
        let sum = 0;
        route.assignments.forEach(a => {
            const pl = this.game.managers.fleet.ownedPlanes.find(pp => pp.instanceId === a.planeId);
            if (!pl) return;
            const seats = pl.configuration && pl.configuration.economy ? {
                economy: pl.configuration.economy,
                premium: pl.configuration.premium,
                business: pl.configuration.business
            } : (function(){
                const totalSeats = pl.baseStats.seats || 0;
                return {
                    economy: Math.floor(totalSeats * 0.7),
                    premium: Math.floor(totalSeats * 0.2),
                    business: Math.ceil(totalSeats * 0.1)
                };
            })();
            sum += this.calculatePotentialRevenue(route.distance, seats, route.priceMultiplier, originDemandFactor2, destDemandFactor2, route.origin, route.dest, route.frequency);
        });
        route.dailyRevenue = Math.floor(sum);

        // Start flight for this plane
        this.startFlight(plane, route, true);

        this.game.save();
        return { success: true };
    }

    removePlaneFromRoute(routeId, planeId) {
        const route = this.routes.find(r => r.id === routeId);
        if (!route) return { success: false, msg: 'Ruta no encontrada' };
        if (!Array.isArray(route.assignments)) return { success: false, msg: 'Ruta sin asignaciones' };
        const idx = route.assignments.findIndex(a => a.planeId === planeId);
        if (idx === -1) return { success: false, msg: 'Avión no asignado a esta ruta' };

        // Free plane
        const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === planeId);
        if (plane) {
            plane.status = 'IDLE';
            plane.routeId = null;
            plane.activeFlight = null;
        }

        // Release hub slots consumed by this assignment
        const originHub = this.game.state.hubs[route.origin];
        const destHub = this.game.state.hubs[route.dest];
        if (originHub && originHub.slots && originHub.slots.used > 0) originHub.slots.used -= 1;
        if (destHub && destHub.slots && destHub.slots.used > 0) destHub.slots.used -= 1;

        route.assignments.splice(idx, 1);

        // Recompute daily revenue
        const originAp = AIRPORTS[route.origin];
        const destAp = AIRPORTS[route.dest];
        const originDemandFactor = originAp ? Airport.getDemandFactor(originAp) : 1.0;
        const destDemandFactor = destAp ? Airport.getDemandFactor(destAp) : 1.0;
        let sum = 0;
        route.assignments.forEach(a => {
            const pl = this.game.managers.fleet.ownedPlanes.find(pp => pp.instanceId === a.planeId);
            if (!pl) return;
            const seats = pl.configuration && pl.configuration.economy ? {
                economy: pl.configuration.economy,
                premium: pl.configuration.premium,
                business: pl.configuration.business
            } : (function(){
                const totalSeats = pl.baseStats.seats || 0;
                return {
                    economy: Math.floor(totalSeats * 0.7),
                    premium: Math.floor(totalSeats * 0.2),
                    business: Math.ceil(totalSeats * 0.1)
                };
            })();
            sum += this.calculatePotentialRevenue(route.distance, seats, route.priceMultiplier, originDemandFactor, destDemandFactor, route.origin, route.dest, route.frequency);
        });
        route.dailyRevenue = Math.floor(sum);

        this.game.save();
        return { success: true };
    }

    listAssignments(routeId) {
        const route = this.routes.find(r => r.id === routeId);
        if (!route) return [];
        return Array.isArray(route.assignments) ? route.assignments.slice() : [];
    }

    getPlaneActiveRoute(planeId) {
        const r = this.routes.find(rt => Array.isArray(rt.assignments) && rt.assignments.some(a => a.planeId === planeId));
        return r ? r.id : null;
    }

    computeRouteDaily(routeId) {
        const route = this.routes.find(r => r.id === routeId);
        if (!route) return 0;
        const originAp = AIRPORTS[route.origin];
        const destAp = AIRPORTS[route.dest];
        const originDemandFactor = originAp ? Airport.getDemandFactor(originAp) : 1.0;
        const destDemandFactor = destAp ? Airport.getDemandFactor(destAp) : 1.0;
        let sum = 0;
        if (Array.isArray(route.assignments) && route.assignments.length > 0) {
            route.assignments.forEach(a => {
                const pl = this.game.managers.fleet.ownedPlanes.find(pp => pp.instanceId === a.planeId);
                if (!pl) return;
                const seats = pl.configuration && pl.configuration.economy ? {
                    economy: pl.configuration.economy,
                    premium: pl.configuration.premium,
                    business: pl.configuration.business
                } : (function(){
                    const totalSeats = pl.baseStats.seats || 0;
                    return {
                        economy: Math.floor(totalSeats * 0.7),
                        premium: Math.floor(totalSeats * 0.2),
                        business: Math.ceil(totalSeats * 0.1)
                    };
                })();
                sum += this.calculatePotentialRevenue(route.distance, seats, route.priceMultiplier, originDemandFactor, destDemandFactor, route.origin, route.dest, route.frequency);
            });
        } else {
            // Legacy single-plane estimate
            sum = this.calculatePotentialRevenue(route.distance, route.seats, route.priceMultiplier, originDemandFactor, destDemandFactor, route.origin, route.dest, route.frequency);
        }
        return Math.floor(sum);
    }
}
