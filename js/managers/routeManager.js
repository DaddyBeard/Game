import { AIRPORTS, Airport } from '../models/airport.js';

export class RouteManager {
    constructor(game) {
        this.game = game;
        this.routes = [];
    }

    loadData(data) {
        if (Array.isArray(data)) {
            this.routes = data.map(route => {
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

    validateRouteByHub(origin, dest) {
        // Check if hub system is active
        if (!this.game.state.mainHub) {
            return { success: true }; // No hub restriction yet
        }

        const currentLevel = this.game.state.level;
        const mainHub = this.game.state.mainHub;
        const hubs = this.game.state.hubs || {};
        const hubIds = Object.keys(hubs);

        // Until level 3: at least one endpoint must touch main hub
        if (currentLevel < 4) {
            const touchesMain = (origin === mainHub || dest === mainHub);
            if (!touchesMain) {
                return {
                    success: false,
                    msg: `Hasta Nivel 4, todas las rutas deben tocar tu hub principal (${mainHub})`
                };
            }
        }

        // From level 4: allow routes between ANY owned hubs (main + secondary)
        if (currentLevel >= 4) {
            const originIsHub = hubIds.includes(origin);
            const destIsHub = hubIds.includes(dest);
            // At least one endpoint must be a hub
            if (!originIsHub && !destIsHub) {
                return {
                    success: false,
                    msg: `Al menos un extremo debe ser uno de tus hubs: ${hubIds.length > 0 ? hubIds.join(', ') : 'ninguno configurado aún'}`
                };
            }
        }

        // Check hub slots availability for both endpoints
        const originHub = hubs[origin];
        const destHub = hubs[dest];

        if (originHub && originHub.slots.used >= originHub.slots.total) {
            return {
                success: false,
                msg: `Hub ${origin} está lleno (${originHub.slots.used}/${originHub.slots.total} slots)`
            };
        }

        if (destHub && destHub.slots.used >= destHub.slots.total) {
            return {
                success: false,
                msg: `Hub ${dest} está lleno (${destHub.slots.used}/${destHub.slots.total} slots)`
            };
        }

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
        const route = {
            id: Date.now() + Math.random().toString(),
            origin: originId,
            dest: destId,
            distance: dist,
            assignedPlane: aircraftInstanceId,
            seats: seats,
            priceMultiplier: priceMultiplier, // Pricing strategy: 0.7 (low-cost) to 1.5 (premium)
            dailyRevenue: this.calculatePotentialRevenue(dist, seats, priceMultiplier),
            hubBase: hubBase // Track which hub this route operates from
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

        // Start first flight immediately
        this.startFlight(plane, route, true);

        this.game.save();
        return { success: true, route: route };
    }

    calculatePotentialRevenue(dist, seats, priceMultiplier = 1.0) {
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
        const finalLoadFactor = 0.85;  // Default load factor

        const revEco = (seats.economy || 0) * baseTicket;
        const revPrm = (seats.premium || 0) * baseTicket * prmMult;
        const revBiz = (seats.business || 0) * baseTicket * bizMult;

        const total = (revEco + revPrm + revBiz) * finalLoadFactor;
        return Math.floor(total);
    }

    calculateLoadFactorByReputation(origin, dest, priceMultiplier = 1.0) {
        // Mapeo: reputación 0 → 0.71 (60%), reputación 100 → 1.18 (100%)
        // A reputación 50 (base) → 1.0 (85%)
        const reputation = this.game.state.reputation || 50;
        // Fórmula: factor = 0.71 + (reputation / 100) * 0.47
        let repFactor = 0.71 + (reputation / 100) * 0.47;
        
        // Competencia local por rivales en origen/destino
        let compFactor = 1.0;
        if (origin && dest && this.game.managers?.rivals?.getCompetitionFactorForRoute) {
            compFactor = this.game.managers.rivals.getCompetitionFactorForRoute(origin, dest);
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
        // Get average price multiplier from rivals on this route
        if (!this.game.managers?.rivals?.getRivalPriceOnRoute) {
            return 1.0; // Default if no rival data
        }
        return this.game.managers.rivals.getRivalPriceOnRoute(origin, dest);
    }

    updateRoutePricing(routeId, newPriceMultiplier) {
        const route = this.routes.find(r => r.id === routeId);
        if (!route) return { success: false, msg: "Ruta no encontrada" };
        
        route.priceMultiplier = Math.max(0.7, Math.min(1.5, newPriceMultiplier));
        route.dailyRevenue = this.calculatePotentialRevenue(
            route.distance, 
            route.seats,
            route.priceMultiplier
        );
        
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

        // Free up the plane
        const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === route.assignedPlane);
        if (plane) {
            plane.status = "IDLE";
            delete plane.routeId;
        }

        // Decrement hub slots
        if (this.game.state.hubs[route.origin] && this.game.state.hubs[route.origin].slots.used > 0) {
            this.game.state.hubs[route.origin].slots.used--;
        }
        if (this.game.state.hubs[route.dest] && this.game.state.hubs[route.dest].slots.used > 0) {
            this.game.state.hubs[route.dest].slots.used--;
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
            const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === route.assignedPlane);
            if (!plane) return;

            // If plane has no active flight but is assigned to route, start one
            if (!plane.activeFlight) {
                this.startFlight(plane, route, true);
            }

            // Check status
            if (now >= plane.activeFlight.arrivalTime) {
                this.processArrival(plane, route);
            }
        });
    }

    processArrival(plane, route) {
        if (!plane.activeFlight) return; // Safety check
        
        // 1. Revenue (only for completed legs? or half per leg? let's give full daily revenue / 2 per leg)
        // Or simpler: Give revenue when completing a full cycle?
        // Let's give revenue on arrival.

        const legRevenue = Math.floor(route.dailyRevenue / 2); // Simple approx
        this.game.state.money += legRevenue;
        this.game.state.reputation += 0.1; // Small rep gain

        const wasOutbound = plane.activeFlight.isOutbound;

        // Estadísticas de aeronave
        const durationHours = (plane.activeFlight?.duration || 0) / 3600000;
        plane.hoursFlown = (plane.hoursFlown || 0) + durationHours;

        const seats = (plane.configuration?.economy || 0) + (plane.configuration?.premium || 0) + (plane.configuration?.business || 0);
        const loadFactor = this.calculateLoadFactorByReputation(route.origin, route.dest);
        const passengers = Math.max(0, Math.floor(seats * 0.85 * loadFactor));

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
}
