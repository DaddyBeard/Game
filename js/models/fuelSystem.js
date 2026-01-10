export class FuelSystem {
    constructor(game) {
        this.game = game;
        this.marketStates = [
            { name: 'ESTABLE', range: [-0.01, 0.01], duration: [10, 20] },
            { name: 'ALCISTA', range: [0.01, 0.03], duration: [7, 18] },
            { name: 'BAJISTA', range: [-0.03, -0.01], duration: [7, 18] },
            { name: 'VOLATIL', range: [-0.05, 0.05], duration: [5, 12] }
        ];
        this.shocks = [
            { label: 'Conflicto', delta: 0.30 },
            { label: 'Sobreproduccion', delta: -0.20 },
            { label: 'Regulacion', delta: 0.15 }
        ];
        this.initState();
    }

    defaultState() {
        return {
            basePrice: 1.0,       // Precio base $/L
            spotPrice: 1.0,       // Precio spot actual $/L
            marketState: 'ESTABLE',
            daysLeft: 10,
            history: [],
            contracts: [],
            lastUpdateDay: null,
            lastShock: null,
            crisisStartDate: null,  // Cuándo empezó la crisis
            crisisDays: 0,          // Días en crisis
            inCrisis: false         // Flag de crisis activa
        };
    }

    initState() {
        if (!this.game.state.fuel) {
            this.game.state.fuel = this.defaultState();
        }
        const fuel = this.game.state.fuel;
        fuel.contracts = Array.isArray(fuel.contracts) ? fuel.contracts : [];

        // Migrar contratos antiguos si existen
        if (Array.isArray(this.game.state.fuelContracts) && this.game.state.fuelContracts.length > 0 && fuel.contracts.length === 0) {
            fuel.contracts = this.game.state.fuelContracts.map(c => ({ ...c }));
        }
    }

    getIndex() {
        const fuel = this.game.state.fuel || this.defaultState();
        return (fuel.spotPrice || 1) / (fuel.basePrice || 1);
    }

    randRange(min, max) {
        return min + (Math.random() * (max - min));
    }

    pickMarketState() {
        const choice = this.marketStates[Math.floor(Math.random() * this.marketStates.length)] || this.marketStates[0];
        return {
            name: choice.name,
            range: choice.range,
            daysLeft: Math.max(5, Math.round(this.randRange(choice.duration[0], choice.duration[1])))
        };
    }

    maybeShock() {
        if (Math.random() < 0.12) {
            const shock = this.shocks[Math.floor(Math.random() * this.shocks.length)];
            return shock;
        }
        return null;
    }

    updateDaily() {
        this.initState();
        const fuel = this.game.state.fuel;
        const todayKey = new Date(this.game.state.date).toDateString();
        if (fuel.lastUpdateDay === todayKey) return; // Evitar doble ejecución

        // Cambiar estado si expira
        if (fuel.daysLeft <= 0 || !fuel.marketState) {
            const next = this.pickMarketState();
            fuel.marketState = next.name;
            fuel.daysLeft = next.daysLeft;
        }

        // Delta según estado
        const stateDef = this.marketStates.find(s => s.name === fuel.marketState) || this.marketStates[0];
        let delta = this.randRange(stateDef.range[0], stateDef.range[1]);

        // Shock ocasional
        const shock = this.maybeShock();
        if (shock) {
            delta += shock.delta;
            fuel.lastShock = { label: shock.label, delta: shock.delta, date: this.game.state.date };
        } else {
            fuel.lastShock = null;
        }

        // Actualizar precio spot
        fuel.spotPrice = this.clamp(fuel.spotPrice * (1 + delta), 0.5, 3.0);
        fuel.daysLeft = Math.max(0, fuel.daysLeft - 1);
        fuel.lastUpdateDay = todayKey;

        // CRISIS DETECTION: Precio ≥25% sobre base durante ≥45 días
        const crisisThreshold = fuel.basePrice * 1.25;
        if (fuel.spotPrice >= crisisThreshold) {
            if (!fuel.inCrisis) {
                fuel.inCrisis = true;
                fuel.crisisStartDate = this.game.state.date;
                fuel.crisisDays = 1;
                console.log('🚨 CRISIS DE COMBUSTIBLE INICIADA');
            } else {
                fuel.crisisDays++;
            }
        } else {
            // Salida de crisis
            if (fuel.inCrisis) {
                console.log('✅ Crisis de combustible terminada después de', fuel.crisisDays, 'días');
                fuel.inCrisis = false;
                fuel.crisisStartDate = null;
                fuel.crisisDays = 0;
            }
        }

        // Registrar histórico (máx 90 días)
        fuel.history.push({ date: this.game.state.date, spot: fuel.spotPrice, state: fuel.marketState });
        if (fuel.history.length > 90) {
            fuel.history = fuel.history.slice(-90);
        }

        // Limpiar contratos vencidos o agotados
        this.cleanExpiredContracts();
        
        // Telemetría diaria (depuración)
        const activeContracts = this.getActiveContracts();
        console.log('⛽ Fuel Daily Update:', {
            state: fuel.marketState,
            spotPrice: fuel.spotPrice.toFixed(3),
            delta: delta.toFixed(3),
            shock: shock ? shock.label : 'none',
            activeContracts: activeContracts.length,
            totalVolume: activeContracts.reduce((s, c) => s + (c.volume - c.used), 0).toLocaleString() + 'L',
            daysLeft: fuel.daysLeft
        });
    }

    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    allowedDurations(level) {
        if (level >= 9) return [30, 60, 90, 180];
        if (level >= 7) return [30, 60, 90, 180];
        if (level >= 5) return [30, 60, 90];
        if (level >= 3) return [30, 60];
        return [];
    }

    volumeCaps(level) {
        // Límites progresivos por nivel
        if (level >= 9) return { min: 10000, max: 500000 };
        if (level >= 7) return { min: 10000, max: 500000 };
        if (level >= 5) return { min: 10000, max: 300000 };
        if (level >= 3) return { min: 10000, max: 150000 };
        return { min: 0, max: 0 };
    }

    maxActiveContracts(level) {
        // Límite de contratos simultáneos según nivel
        if (level >= 8) return 3;  // Late game
        if (level >= 4) return 2;  // Mid game
        return 1;                  // Early game
    }

    estimatedDailyConsumption() {
        // Calcular consumo diario estimado basado en rutas activas
        const routes = this.game.managers.routes.getRoutes();
        let total = 0;
        routes.forEach(route => {
            const assignments = Array.isArray(route.assignments) && route.assignments.length > 0
                ? route.assignments
                : (route.assignedPlane ? [{ planeId: route.assignedPlane }] : []);
            assignments.forEach(a => {
                const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === a.planeId);
                if (plane) {
                    const fuelBurn = plane.baseStats?.fuelBurn || 35;
                    total += route.distance * fuelBurn * 0.8; // kg → litros (aprox)
                }
            });
        });
        return total;
    }

    validateCoverage(newVolume, newDuration) {
        // Validar que la cobertura total no exceda 85% del consumo estimado
        const dailyConsumption = this.estimatedDailyConsumption();
        if (dailyConsumption === 0) return true; // Sin rutas, permitir
        
        const active = this.getActiveContracts();
        const currentCoverage = active.reduce((s, c) => s + (c.volume - c.used), 0);
        const totalCoverage = currentCoverage + newVolume;
        const daysOfCoverage = totalCoverage / dailyConsumption;
        
        // Máximo 85% de cobertura permitida
        return daysOfCoverage <= (newDuration * 0.85);
    }

    purchaseContract(volumeLiters, durationDays) {
        this.initState();
        const fuel = this.game.state.fuel;
        const level = this.game.state.level || 1;
        const allowed = this.allowedDurations(level);
        if (allowed.length === 0) {
            return { success: false, msg: 'Debes ser nivel 3 para acceder a contratos de combustible.' };
        }
        if (!allowed.includes(durationDays)) {
            return { success: false, msg: `Duración no disponible para tu nivel. Permitidas: ${allowed.join(', ')} días.` };
        }

        const { min, max } = this.volumeCaps(level);
        if (volumeLiters < min) {
            return { success: false, msg: `Volumen mínimo ${min.toLocaleString()}L` };
        }
        if (volumeLiters > max) {
            return { success: false, msg: `Volumen máximo ${max.toLocaleString()}L para tu nivel` };
        }

        // NUEVO: Límite de contratos activos
        const activeContracts = this.getActiveContracts();
        const maxContracts = this.maxActiveContracts(level);
        if (activeContracts.length >= maxContracts) {
            return { success: false, msg: `Máximo ${maxContracts} contratos activos para tu nivel. Espera que uno expire.` };
        }

        // NUEVO: Validar cobertura máxima 85%
        if (!this.validateCoverage(volumeLiters, durationDays)) {
            return { success: false, msg: 'Este contrato excedería el 85% de cobertura recomendada. Reduce volumen o espera.' };
        }

        const pricePerLiter = fuel.spotPrice;
        const totalCost = volumeLiters * pricePerLiter;
        if ((this.game.state.money || 0) < totalCost) {
            return { success: false, msg: 'Fondos insuficientes' };
        }

        const contract = {
            id: 'fuel-' + Date.now(),
            volume: volumeLiters,
            price: pricePerLiter,
            startDate: this.game.state.date,
            endDate: this.game.state.date + (durationDays * 24 * 60 * 60 * 1000),
            used: 0,
            status: 'active'
        };

        fuel.contracts.push(contract);
        this.game.state.money -= totalCost;
        this.game.save();

        return {
            success: true,
            msg: `Contrato: ${volumeLiters.toLocaleString()}L @ $${pricePerLiter.toFixed(3)}/L (${durationDays} días)` ,
            contract
        };
    }

    /**
     * Purchase spot fuel block at current market price
     * Behaves like a short-term contract with no provider
     */
    purchaseSpotBlock(volumeLiters, durationDays) {
        this.initState();
        const fuel = this.game.state.fuel;
        const level = this.game.state.level || 1;

        const allowed = this.allowedDurations(level);
        if (allowed.length === 0) {
            return { success: false, msg: 'Debes ser nivel 3 para comprar volumen de mercado.' };
        }
        if (!allowed.includes(durationDays)) {
            return { success: false, msg: `Duración no disponible para tu nivel. Permitidas: ${allowed.join(', ')} días.` };
        }

        const { min, max } = this.volumeCaps(level);
        if (volumeLiters < min) {
            return { success: false, msg: `Volumen mínimo ${min.toLocaleString()}L` };
        }
        if (volumeLiters > max) {
            return { success: false, msg: `Volumen máximo ${max.toLocaleString()}L para tu nivel` };
        }

        // Validate active contract limits (spot blocks count towards limit)
        const activeContracts = this.getActiveContracts();
        const maxContracts = this.maxActiveContracts(level);
        if (activeContracts.length >= maxContracts) {
            return { success: false, msg: `Máximo ${maxContracts} contratos/volúmenes activos para tu nivel.` };
        }

        // Validate 85% coverage cap
        if (!this.validateCoverage(volumeLiters, durationDays)) {
            return { success: false, msg: 'Esta compra excedería el 85% de cobertura recomendada. Reduce volumen o duración.' };
        }

        const pricePerLiter = fuel.spotPrice || 1.0;
        const totalCost = volumeLiters * pricePerLiter;
        if ((this.game.state.money || 0) < totalCost) {
            return { success: false, msg: 'Fondos insuficientes' };
        }

        const contract = {
            id: 'spot-' + Date.now(),
            provider: 'market',
            providerName: 'Mercado Spot',
            profile: 'spot',
            volume: volumeLiters,
            price: pricePerLiter,
            startDate: this.game.state.date,
            endDate: this.game.state.date + (durationDays * 24 * 60 * 60 * 1000),
            used: 0,
            status: 'active',
            breakPenalty: 0
        };

        fuel.contracts.push(contract);
        this.game.state.money -= totalCost;
        this.game.save();

        return {
            success: true,
            msg: `Compra Spot: ${volumeLiters.toLocaleString()}L @ $${pricePerLiter.toFixed(3)}/L (${durationDays} días)`,
            contract
        };
    }

    getActiveContracts() {
        const now = this.game.state.date;
        this.initState();
        return (this.game.state.fuel.contracts || []).filter(c => c.status === 'active' && c.used < c.volume && now <= c.endDate);
    }

    getEffectivePrice() {
        const active = this.getActiveContracts();
        if (active.length === 0) return this.game.state.fuel.spotPrice || 1.0;
        active.sort((a, b) => a.price - b.price);
        return active[0].price;
    }

    consume(liters) {
        const active = this.getActiveContracts().sort((a, b) => a.price - b.price);
        if (active.length === 0 || liters <= 0) return;
        let remaining = liters;
        for (const c of active) {
            if (remaining <= 0) break;
            const available = c.volume - c.used;
            const use = Math.min(available, remaining);
            c.used += use;
            remaining -= use;
            if (c.used >= c.volume) {
                c.status = 'depleted';
            }
        }
    }

    cleanExpiredContracts() {
        this.initState();
        const now = this.game.state.date;
        this.game.state.fuel.contracts = (this.game.state.fuel.contracts || []).filter(c => {
            if (c.status === 'depleted' || now > c.endDate) {
                return false;
            }
            return true;
        });
    }

    getAlerts() {
        // Generar alertas para UI
        const alerts = [];
        const fuel = this.game.state.fuel;
        const active = this.getActiveContracts();
        const now = this.game.state.date;

        // Alertas de contratos próximos a expirar (≤5 días)
        active.forEach(c => {
            const daysLeft = (c.endDate - now) / (24 * 60 * 60 * 1000);
            if (daysLeft <= 5 && daysLeft > 0) {
                alerts.push({
                    type: 'warning',
                    title: '⛽ Contrato expirando',
                    msg: `${Math.ceil(daysLeft)} días restantes (${(c.volume - c.used).toLocaleString()}L)`,
                    action: 'Renovar contrato'
                });
            }
        });

        // Alerta de variación de precio ±10% en últimos 5 días
        if (fuel.history.length >= 5) {
            const last5 = fuel.history.slice(-5);
            const firstPrice = last5[0].spot;
            const lastPrice = last5[last5.length - 1].spot;
            const variation = ((lastPrice - firstPrice) / firstPrice) * 100;
            if (Math.abs(variation) >= 10) {
                alerts.push({
                    type: variation > 0 ? 'danger' : 'success',
                    title: '📊 Variación de precio',
                    msg: `${variation > 0 ? '+' : ''}${variation.toFixed(1)}% en 5 días`,
                    action: variation > 0 ? 'Considera comprar contrato' : 'Buen momento para contratos'
                });
            }
        }

        // Alerta de crisis prolongada
        if (fuel.inCrisis && fuel.crisisDays >= 45) {
            alerts.push({
                type: 'danger',
                title: '🚨 CRISIS PROLONGADA',
                msg: `${fuel.crisisDays} días con precio alto. Impacto en rentabilidad.`,
                action: 'Revisar rutas y contratos'
            });
        }

        // Alerta de cambio de estado de mercado
        if (fuel.daysLeft === 1) {
            alerts.push({
                type: 'info',
                title: '🔄 Cambio de mercado inminente',
                msg: `Estado actual: ${fuel.marketState}. Cambiará mañana.`,
                action: null
            });
        }

        // Alerta si no hay contratos y hay crisis
        if (fuel.inCrisis && active.length === 0) {
            alerts.push({
                type: 'warning',
                title: '⚠️ Sin protección',
                msg: 'Crisis activa sin contratos. Costos de combustible muy altos.',
                action: 'Comprar contrato urgente'
            });
        }

        return alerts;
    }

    getEfficiencyMetrics() {
        // Métricas de eficiencia de contratos
        const active = this.getActiveContracts();
        const fuel = this.game.state.fuel;
        let totalSavings = 0;
        let totalLoss = 0;

        active.forEach(c => {
            const remaining = c.volume - c.used;
            const diff = (fuel.spotPrice - c.price) * remaining;
            if (diff > 0) totalSavings += diff;
            else totalLoss += Math.abs(diff);
        });

        return {
            totalSavings,
            totalLoss,
            netSavings: totalSavings - totalLoss,
            avgContractPrice: active.length > 0 ? active.reduce((s, c) => s + c.price, 0) / active.length : 0,
            spotPrice: fuel.spotPrice,
            effectivePrice: this.getEffectivePrice(),
            coverageDays: this.estimatedDailyConsumption() > 0 
                ? active.reduce((s, c) => s + (c.volume - c.used), 0) / this.estimatedDailyConsumption()
                : 0
        };
    }
}
