import { AIRLINES_DATA } from '../models/airlinesData.js';
import { AIRPORTS } from '../models/airport.js';

/**
 * Competitor Manager - Maneja 49 aerolíneas competidoras predefinidas
 * Las líneas aéreas operan desde sus hubs definidos en AIRLINES_DATA
 */

export class CompetitorManager {
    constructor(game) {
        this.game = game;
        this.competitors = {}; // { airlineName: { hub, routes, marketShare, aggressiveness } }
        this.initializeCompetitors();
    }

    /**
     * Inicializa competidores usando las 49 aerolíneas predefinidas de AIRLINES_DATA
     */
    initializeCompetitors() {
        const availableAirports = Object.values(AIRPORTS);
        
        // Crear competidores desde AIRLINES_DATA
        AIRLINES_DATA.forEach(airline => {
            const hubAirport = AIRPORTS[airline.hub];
            
            if (!hubAirport) {
                console.warn(`⚠️ Hub no encontrado para ${airline.name}: ${airline.hub}`);
                return;
            }

            const competitor = {
                name: airline.name,
                hub: airline.hub,
                hubName: hubAirport.name,
                hubs: [airline.hub], // Lista de hubs que opera
                routes: [], // Rutas que opera
                marketShare: 0.05, // 5% inicial
                aggressiveness: Math.random() * 0.8 + 0.3, // 0.3-1.1
                basePrice: 50,
                priceMultiplier: 1.0,
                reputation: airline.reputation || 70,
                dailyIncome: airline.dailyIncome || 250000,
                color: airline.color || this.generateColor(),
                fleetSize: airline.fleetSize || 100,
                expansion: 0, // Contador de expansión (0-1 scala)
                fuelContracts: [], // Contratos de combustible de la IA
                lastFuelPurchase: null // Última vez que compró contrato
            };

            // Generar rutas iniciales SOLO desde el hub principal
            // Fórmula más realista: ~1 ruta por cada 10-15 aviones, mínimo 4
            const numRoutesToCreate = Math.max(4, Math.floor(airline.fleetSize / 12));
            for (let i = 0; i < numRoutesToCreate; i++) {
                // Seleccionar aeropuerto destino aleatorio
                const destAirport = availableAirports[Math.floor(Math.random() * availableAirports.length)];
                
                // No volar a su propio hub
                if (destAirport.id !== competitor.hub && destAirport.id) {
                    // Frecuencias realistas basadas en flota
                    const frequency = this.calculateFrequency(airline.fleetSize);
                    
                    competitor.routes.push({
                        origin: competitor.hub,
                        dest: destAirport.id,
                        frequency: frequency
                    });
                }
            }

            this.competitors[airline.name] = competitor;
        });

        console.log(`🏢 ${AIRLINES_DATA.length} aerolíneas competidoras inicializadas desde sus hubs`);
    }

    /**
     * Obtiene competidores activos en una ruta específica
     */
    getCompetitorsOnRoute(originId, destId) {
        return Object.values(this.competitors).filter(competitor => {
            // Un competidor opera en una ruta si tiene esa ruta o si está cercano
            return competitor.routes.some(r => 
                (r.origin === originId && r.dest === destId) ||
                (r.origin === destId && r.dest === originId)
            );
        });
    }

    /**
     * Calcula el impacto de competencia en la demanda
     * Retorna multiplicador (0.5 = 50% menos demanda, 1.5 = 50% más demanda)
     */
    calculateCompetitionImpact(originId, destId) {
        const competitors = this.getCompetitorsOnRoute(originId, destId);
        
        if (competitors.length === 0) return 1.0; // Sin competencia
        
        // Cada competidor reduce demanda ~15%
        const impactFactor = 1 - (competitors.length * 0.15);
        return Math.max(0.4, impactFactor); // Mínimo 40% de demanda
    }

    /**
     * Actualiza precios de competidores dinámicamente
     * Se llama cada "día" del juego
     */
    updateCompetitorPrices() {
        const fuel = this.game.state.fuel;
        const inCrisis = fuel?.inCrisis || false;
        const spotPrice = fuel?.spotPrice || 1.0;
        const now = this.game.state.date;

        Object.values(this.competitors).forEach(competitor => {
            // NUEVO: IA usa combustible (nivel ≥4)
            const aiLevel = Math.floor(competitor.fleetSize / 50); // Aproximación de nivel basada en flota
            if (aiLevel >= 4) {
                this.manageAIFuelContracts(competitor, spotPrice, inCrisis, now);
            }

            // Los competidores agresivos bajan precios más
            // Los pasivos mantienen precios altos
            const priceAdjustment = 0.95 + (Math.random() * 0.1); // -5% a +5%
            const aggressivityBonus = 1 - (competitor.aggressiveness * 0.05);
            
            // NUEVO: Durante crisis, IA sin contratos sube precios +5-10%
            let crisisAdjustment = 1.0;
            if (inCrisis && this.getActiveAIContracts(competitor).length === 0) {
                crisisAdjustment = 1.05 + (Math.random() * 0.05); // +5% a +10%
            }
            // IA con contratos puede bajar precios ligeramente
            else if (inCrisis && this.getActiveAIContracts(competitor).length > 0) {
                crisisAdjustment = 0.98; // -2%
            }
            
            competitor.priceMultiplier = competitor.priceMultiplier * priceAdjustment * aggressivityBonus * crisisAdjustment;
            
            // Clamp entre 0.8 y 1.3
            competitor.priceMultiplier = Math.max(0.8, Math.min(1.3, competitor.priceMultiplier));
        });
    }

    /**
     * Gestiona contratos de combustible para IA
     * IA conservadora prefiere contratos, agresiva usa spot
     */
    manageAIFuelContracts(competitor, spotPrice, inCrisis, now) {
        // Limpiar contratos vencidos
        competitor.fuelContracts = competitor.fuelContracts.filter(c => now <= c.endDate);

        // Decisión mensual (30% probabilidad/mes)
        const daysSinceLastPurchase = competitor.lastFuelPurchase 
            ? (now - competitor.lastFuelPurchase) / (24 * 60 * 60 * 1000)
            : 999;

        if (daysSinceLastPurchase >= 30 && Math.random() < 0.30) {
            // IA conservadora (aggressiveness <0.6) prefiere contratos
            // IA agresiva (aggressiveness >0.8) usa spot
            const shouldBuyContract = competitor.aggressiveness < 0.6 
                || (inCrisis && Math.random() < 0.7); // Durante crisis, 70% compran

            if (shouldBuyContract) {
                // Comprar contrato simple (30 días, volumen estimado)
                const estimatedVolume = competitor.fleetSize * 1000; // Estimación simple
                const contract = {
                    price: spotPrice,
                    volume: estimatedVolume,
                    startDate: now,
                    endDate: now + (30 * 24 * 60 * 60 * 1000)
                };
                competitor.fuelContracts.push(contract);
                competitor.lastFuelPurchase = now;
            }
        }
    }

    /**
     * Obtener contratos activos de IA
     */
    getActiveAIContracts(competitor) {
        const now = this.game.state.date;
        return (competitor.fuelContracts || []).filter(c => now <= c.endDate);
    }

    /**
     * Calcula el máximo de rutas que una aerolínea puede operar según su flota
     */
    calculateMaxRoutes(fleetSize) {
        // Fórmula realista: 1 avión puede operar ~2 segmentos diarios
        // Si tienes 100 aviones, puedes tener ~50 rutas
        return Math.max(3, Math.floor(fleetSize / 2));
    }

    /**
     * Calcula frecuencias realistas basadas en flota disponible
     */
    calculateFrequency(fleetSize) {
        // Flota pequeña (< 100): 1-2 frecuencias
        // Flota mediana (100-300): 2-4 frecuencias
        // Flota grande (> 300): 4-8+ frecuencias
        if (fleetSize < 100) return Math.max(1, Math.floor(fleetSize / 50));
        if (fleetSize < 300) return Math.max(2, Math.floor(fleetSize / 75));
        return Math.max(3, Math.floor(fleetSize / 100));
    }

    /**
     * Actualiza presencia de competidores (añaden rutas y expanden a nuevos hubs)
     */
    updateCompetitorRoutes() {
        const playerRoutes = this.game.managers.routes.getRoutes();
        const availableAirports = Object.values(AIRPORTS);

        Object.values(this.competitors).forEach(competitor => {
            const maxRoutes = this.calculateMaxRoutes(competitor.fleetSize);

            // 2% de probabilidad de expandir a un nuevo hub
            if (Math.random() < 0.02 && competitor.hubs.length < 5) {
                const newHub = availableAirports[Math.floor(Math.random() * availableAirports.length)];
                
                // Verificar que no sea un hub que ya tiene
                if (!competitor.hubs.includes(newHub.id)) {
                    competitor.hubs.push(newHub.id);
                    competitor.expansion = Math.min(1, competitor.expansion + 0.2);
                    console.log(`📈 ${competitor.name} expandió a nuevo hub: ${newHub.id}`);
                    
                    // Crear rutas iniciales desde el nuevo hub (basado en capacidad)
                    const capacityAtNewHub = Math.floor(competitor.fleetSize / competitor.hubs.length / 100);
                    const numNewRoutes = Math.min(capacityAtNewHub, Math.ceil(Math.random() * 3));
                    
                    for (let i = 0; i < numNewRoutes; i++) {
                        const dest = availableAirports[Math.floor(Math.random() * availableAirports.length)];
                        if (dest.id !== newHub.id && !competitor.hubs.includes(dest.id)) {
                            const frequency = this.calculateFrequency(competitor.fleetSize / competitor.hubs.length);
                            competitor.routes.push({
                                origin: newHub.id,
                                dest: dest.id,
                                frequency: frequency
                            });
                        }
                    }
                }
            }

            // Probabilidad de agregar una ruta (aumenta con flota)
            const addRouteProbability = Math.min(0.15, competitor.fleetSize / 1000);
            if (Math.random() < addRouteProbability && competitor.routes.length < maxRoutes) {
                const originHub = competitor.hubs[Math.floor(Math.random() * competitor.hubs.length)];
                const randomDest = availableAirports[Math.floor(Math.random() * availableAirports.length)];
                
                // No volar a sus propios hubs
                if (!competitor.hubs.includes(randomDest.id)) {
                    const frequency = this.calculateFrequency(competitor.fleetSize / competitor.hubs.length);
                    competitor.routes.push({
                        origin: originHub,
                        dest: randomDest.id,
                        frequency: frequency
                    });
                }
            }

            // Probabilidad de remover una ruta (disminuye con flota)
            const removeRouteProbability = Math.max(0.02, 0.08 - (competitor.fleetSize / 1000));
            if (Math.random() < removeRouteProbability && competitor.routes.length > 1) {
                competitor.routes.pop();
            }

            // Guardar métricas base para cálculo de share (normalizaremos en getCompetitionStatus)
            competitor.routeCount = competitor.routes.length;
        });
    }

    /**
     * Obtiene el top 5 competidores por market share
     */
    getTopCompetitors(limit = 5) {
        return Object.values(this.competitors)
            .sort((a, b) => b.marketShare - a.marketShare)
            .slice(0, limit);
    }

    /**
     * Obtiene el label de competencia en una ruta específica (Baja, Media, Alta)
     */
    getCompetitionLabelForRoute(originId, destId) {
        const competitors = this.getCompetitorsOnRoute(originId, destId);
        
        if (competitors.length === 0) return 'Baja';
        if (competitors.length === 1) return 'Media';
        if (competitors.length >= 2) return 'Alta';
        
        return 'Baja';
    }

    /**
     * Genera un color CSS aleatorio para el competidor
     */
    generateColor() {
        const colors = [
            '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
            '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Obtiene info de competencia para mostrar en dashboard
     */
    getCompetitionStatus() {
        const competitorsArr = Object.values(this.competitors);
        // Peso basado en rutas, hubs y tamaño de flota
        const weights = competitorsArr.map(c => {
            const routeWeight = (c.routeCount || c.routes?.length || 0);
            const hubWeight = (c.hubs?.length || 1) * 2;
            const fleetWeight = (c.fleetSize || 50) / 50; // cada 50 aviones suma 1
            return {
                c,
                weight: Math.max(1, routeWeight + hubWeight + fleetWeight)
            };
        });

        const playerRoutes = this.game.managers.routes.getRoutes();
        const playerFleet = this.game.managers.fleet?.ownedPlanes?.length || 1;
        const playerWeight = Math.max(1, (playerRoutes.length * 1.5) + (playerFleet / 5));

        const totalWeight = weights.reduce((s, w) => s + w.weight, 0) + playerWeight;

        // Calcular share normalizado
        weights.forEach(w => {
            w.c.marketShare = totalWeight > 0 ? (w.weight / totalWeight) : 0;
        });
        const playerShare = totalWeight > 0 ? (playerWeight / totalWeight) : 0;

        const topCompetitors = weights
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 5)
            .map(w => w.c);

        return {
            playerShare,
            competitors: topCompetitors,
            totalCompetitors: competitorsArr.length
        };
    }
}
