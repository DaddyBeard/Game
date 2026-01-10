export class FuelProviders {
    constructor(game) {
        this.game = game;
        
        // Tres proveedores globales (empresas reales)
        this.providers = [
            {
                id: 'shell',
                name: 'Shell Aviation',
                personality: 'Conservadora, robusta',
                color: '#DD1D21' // Rojo Shell
            },
            {
                id: 'bp',
                name: 'BP Air',
                personality: 'Adaptable, oportunista',
                color: '#00893E' // Verde BP
            },
            {
                id: 'totalenergies',
                name: 'TotalEnergies Aviation',
                personality: 'Competitiva, agresiva',
                color: '#0057A3' // Azul Total
            }
        ];

        // Perfiles de contrato (arquetipos)
        this.profiles = {
            estable: {
                name: 'Estable',
                icon: '🟢',
                priceMultiplier: 1.05,          // +5% sobre spot
                volatilityRange: 0.02,           // ±2%
                breakPenalty: 0.10,              // 10% del costo total
                durationDays: [60, 90],
                volumeMultiplier: [0.8, 1.2],    // 80-120% del consumo estimado
                flexibility: 'baja',
                risk: 'Bajo',
                description: 'Precio estable, compromisos largos, penalizaciones suaves'
            },
            agresivo: {
                name: 'Agresivo',
                icon: '🟡',
                priceMultiplier: 0.92,           // -8% sobre spot
                volatilityRange: 0.08,           // ±8%
                breakPenalty: 0.35,              // 35% del costo total
                durationDays: [30, 60],
                volumeMultiplier: [1.0, 1.5],
                flexibility: 'nula',
                risk: 'Alto',
                description: 'Precio bajo inicial, penalizaciones duras, riesgo alto'
            },
            flexible: {
                name: 'Flexible',
                icon: '🔵',
                priceMultiplier: 1.08,           // +8% sobre spot
                volatilityRange: 0.05,           // ±5%
                breakPenalty: 0.05,              // 5% del costo total
                durationDays: [15, 30],
                volumeMultiplier: [0.5, 1.0],
                flexibility: 'alta',
                risk: 'Medio',
                description: 'Contratos cortos, fácil salida, precio moderado'
            }
        };

        this.initState();
    }

    defaultState() {
        return {
            providers: this.providers.map(p => ({
                id: p.id,
                currentProfile: this.randomProfile(),
                profileSince: this.game.state.date,
                nextRotation: this.game.state.date + this.randomRotationDays() * 24 * 60 * 60 * 1000,
                lastOfferGeneration: null
            })),
            offers: [],
            history: [] // Histórico de rotaciones
        };
    }

    initState() {
        if (!this.game.state.fuelProviders) {
            this.game.state.fuelProviders = this.defaultState();
        }
    }

    randomProfile() {
        const profiles = ['estable', 'agresivo', 'flexible'];
        return profiles[Math.floor(Math.random() * profiles.length)];
    }

    randomRotationDays() {
        return 30 + Math.floor(Math.random() * 31); // 30-60 días
    }

    getUnlockedProviders(level) {
        if (level <= 2) return 1;
        if (level <= 4) return 2;
        return 3;
    }

    /**
     * Generar ofertas de contratos de combustible
     * @param {number} level - Nivel del jugador
     * @returns {Array} Ofertas generadas
     */
    generateOffers(level) {
        this.initState();
        const state = this.game.state.fuelProviders;
        const fuel = this.game.state.fuel;
        const spotPrice = fuel.spotPrice || 1.0;
        const inCrisis = fuel.inCrisis || false;
        const marketState = fuel.marketState || 'ESTABLE';

        const unlockedCount = this.getUnlockedProviders(level);
        const activeProviders = state.providers.slice(0, unlockedCount);

        const offers = [];
        const now = this.game.state.date;

        // Estimar consumo diario del jugador
        const estimatedDailyConsumption = this.estimateDailyConsumption();

        activeProviders.forEach(providerState => {
            const provider = this.providers.find(p => p.id === providerState.id);
            const profileKey = providerState.currentProfile;
            const profile = this.profiles[profileKey];

            // Calcular precio base con multiplicador de perfil
            let basePrice = spotPrice * profile.priceMultiplier;

            // Ajustes por estado del mercado
            if (inCrisis) {
                // En crisis, perfil "estable" es más caro, "agresivo" más barato (oportunista)
                if (profileKey === 'estable') basePrice *= 1.10;
                if (profileKey === 'agresivo') basePrice *= 0.95;
            }
            if (marketState === 'VOLATIL') {
                if (profileKey === 'flexible') basePrice *= 0.98; // Flexible es mejor en volatilidad
            }

            // Añadir volatilidad al precio
            const volatility = (Math.random() - 0.5) * 2 * profile.volatilityRange;
            const finalPrice = Math.max(0.5, basePrice * (1 + volatility));

            // Duración aleatoria dentro del rango del perfil
            const [minDur, maxDur] = profile.durationDays;
            const duration = minDur + Math.floor(Math.random() * (maxDur - minDur + 1));

            // Volumen basado en consumo estimado
            const [minMult, maxMult] = profile.volumeMultiplier;
            const volumeMultiplier = minMult + Math.random() * (maxMult - minMult);
            const baseVolume = estimatedDailyConsumption * duration * volumeMultiplier;
            const volume = Math.round(baseVolume / 10000) * 10000; // Redondear a 10,000L

            const offer = {
                id: `offer-${provider.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                provider: provider.id,
                providerName: provider.name,
                providerColor: provider.color,
                profile: profileKey,
                profileData: profile,
                price: parseFloat(finalPrice.toFixed(3)),
                volume: Math.max(10000, volume), // Mínimo 10,000L
                duration: duration,
                breakPenalty: profile.breakPenalty,
                generatedAt: now,
                expiresAt: now + (7 * 24 * 60 * 60 * 1000), // Expira en 7 días
                spotPriceAtGeneration: spotPrice
            };

            offers.push(offer);
        });

        state.offers = offers;
        state.providers.forEach(p => {
            p.lastOfferGeneration = now;
        });

        this.game.save();
        return offers;
    }

    estimateDailyConsumption() {
        // Estimar consumo basado en rutas activas
        const routes = this.game.managers.routes.getRoutes() || [];
        let totalLiters = 0;

        routes.forEach(route => {
            const assignments = Array.isArray(route.assignments) ? route.assignments :
                (route.assignedPlane ? [{ planeId: route.assignedPlane }] : []);
            assignments.forEach(a => {
                const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === a.planeId);
                if (!plane) return;
                const dist = route.distance || 0;
                const fuelBurn = plane.fuelBurn || 0;
                totalLiters += dist * fuelBurn * 0.8;
            });
        });

        // Si no hay rutas, estimar basado en nivel (para jugadores nuevos)
        if (totalLiters === 0) {
            const level = this.game.state.level || 1;
            totalLiters = level * 20000; // 20,000L por nivel como base
        }

        return totalLiters;
    }

    /**
     * Rotar perfiles de proveedores (llamado diariamente)
     */
    rotateProfiles() {
        this.initState();
        const state = this.game.state.fuelProviders;
        const now = this.game.state.date;
        const marketState = this.game.state.fuel.marketState;
        const inCrisis = this.game.state.fuel.inCrisis;

        let rotated = false;

        state.providers.forEach(provider => {
            if (now >= provider.nextRotation) {
                const oldProfile = provider.currentProfile;
                
                // Elegir nuevo perfil (evitar repetir el mismo)
                let newProfile;
                const profiles = Object.keys(this.profiles);
                const availableProfiles = profiles.filter(p => p !== oldProfile);

                // Influencias del mercado en la probabilidad de perfiles
                if (inCrisis) {
                    // En crisis, más probable que ofrezcan "estable"
                    newProfile = Math.random() < 0.5 ? 'estable' : availableProfiles[Math.floor(Math.random() * availableProfiles.length)];
                } else if (marketState === 'BAJISTA') {
                    // Mercado bajista, más ofertas "agresivas"
                    newProfile = Math.random() < 0.4 ? 'agresivo' : availableProfiles[Math.floor(Math.random() * availableProfiles.length)];
                } else {
                    // Random normal
                    newProfile = availableProfiles[Math.floor(Math.random() * availableProfiles.length)];
                }

                provider.currentProfile = newProfile;
                provider.profileSince = now;
                provider.nextRotation = now + this.randomRotationDays() * 24 * 60 * 60 * 1000;

                // Guardar en historial
                state.history.push({
                    provider: provider.id,
                    oldProfile,
                    newProfile,
                    date: now,
                    reason: inCrisis ? 'crisis' : marketState.toLowerCase()
                });

                rotated = true;
            }
        });

        if (rotated) {
            // Regenerar ofertas cuando hay rotación
            const level = this.game.state.level || 1;
            this.generateOffers(level);
            this.game.save();
        }

        return rotated;
    }

    /**
     * Obtener oferta por ID
     */
    getOffer(offerId) {
        this.initState();
        return this.game.state.fuelProviders.offers.find(o => o.id === offerId);
    }

    /**
     * Comprar contrato desde una oferta específica
     */
    purchaseFromOffer(offerId) {
        const offer = this.getOffer(offerId);
        if (!offer) {
            return { success: false, msg: 'Oferta no encontrada' };
        }

        const now = this.game.state.date;
        if (now > offer.expiresAt) {
            return { success: false, msg: 'Esta oferta ha expirado' };
        }

        // Validar límites (delegado a fuelSystem)
        const level = this.game.state.level || 1;
        const activeContracts = this.game.managers.economy.fuelSystem.getActiveContracts();
        const maxContracts = this.game.managers.economy.fuelSystem.maxActiveContracts(level);
        
        if (activeContracts.length >= maxContracts) {
            return { success: false, msg: `Máximo ${maxContracts} contratos activos para tu nivel` };
        }

        // Validar cobertura 85%
        if (!this.game.managers.economy.fuelSystem.validateCoverage(offer.volume, offer.duration)) {
            return { success: false, msg: 'Este contrato excedería el 85% de cobertura recomendada' };
        }

        // Validar fondos
        const totalCost = offer.volume * offer.price;
        if (this.game.state.money < totalCost) {
            return { success: false, msg: 'Fondos insuficientes' };
        }

        // Crear contrato
        const contract = {
            id: 'fuel-' + Date.now(),
            provider: offer.provider,
            providerName: offer.providerName,
            profile: offer.profile,
            volume: offer.volume,
            price: offer.price,
            startDate: now,
            endDate: now + (offer.duration * 24 * 60 * 60 * 1000),
            used: 0,
            status: 'active',
            breakPenalty: offer.breakPenalty,
            purchasedFromOffer: offerId
        };

        this.game.state.fuel.contracts.push(contract);
        this.game.state.money -= totalCost;

        // Remover oferta usada
        this.game.state.fuelProviders.offers = this.game.state.fuelProviders.offers.filter(o => o.id !== offerId);

        this.game.save();

        return {
            success: true,
            msg: `Contrato ${offer.providerName}: ${offer.volume.toLocaleString()}L @ $${offer.price.toFixed(3)}/L (${offer.duration}d)`,
            contract
        };
    }

    /**
     * Limpiar ofertas expiradas
     */
    cleanExpiredOffers() {
        this.initState();
        const now = this.game.state.date;
        const state = this.game.state.fuelProviders;
        const beforeCount = state.offers.length;
        
        state.offers = state.offers.filter(o => now <= o.expiresAt);
        
        if (state.offers.length < beforeCount) {
            this.game.save();
        }
    }
}
