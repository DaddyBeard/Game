export class RivalManager {
    constructor(game) {
        this.game = game;
        this.rivals = [];
        this._initialized = false;
    }

    initRivals() {
        // Prevenir ejecución múltiple
        if (this._initialized) {
            return this.rivals;
        }

        // Crear 3 rivales ficticios en hubs distintos al del jugador
        const mainHub = this.game.state.mainHub;
        console.log('🎯 Initializing rivals. Main hub:', mainHub);
        
        const allRivals = [
            {
                id: 'rival_1',
                name: 'Iberia Plus',
                hub: 'MAD',
                profile: 'legacy',
                reputation: 65,
                dailyIncome: 150000,
                fleetSize: 8,
                color: '#f59e0b'
            },
            {
                id: 'rival_2',
                name: 'Ryanair Sky',
                hub: 'BCN',
                profile: 'low-cost',
                reputation: 45,
                dailyIncome: 120000,
                fleetSize: 12,
                color: '#3b82f6'
            },
            {
                id: 'rival_3',
                name: 'Lufthansa Express',
                hub: 'CDG',
                profile: 'premium',
                reputation: 78,
                dailyIncome: 180000,
                fleetSize: 10,
                color: '#8b5cf6'
            },
            {
                id: 'rival_4',
                name: 'American Wings',
                hub: 'JFK',
                profile: 'legacy',
                reputation: 55,
                dailyIncome: 140000,
                fleetSize: 9,
                color: '#ec4899'
            },
            {
                id: 'rival_5',
                name: 'KLM Sky',
                hub: 'AMS',
                profile: 'legacy',
                reputation: 70,
                dailyIncome: 155000,
                fleetSize: 7,
                color: '#06b6d4'
            }
        ];

        console.log('All rivals before filter:', allRivals.length);
        console.log('Filtering out hub:', mainHub);
        
        // Filtrar rivales que no sean en el hub principal
        this.rivals = allRivals.filter(r => {
            console.log(`  Checking ${r.name} (hub: ${r.hub}) - keep: ${r.hub !== mainHub}`);
            return r.hub !== mainHub;
        });
        
        console.log('✅ Rivals initialized:', this.rivals.length, this.rivals.map(r => r.name));
        
        // Inicializar varianza aleatoria
        this.rivals.forEach(rival => {
            rival.variance = Math.random() * 0.3 - 0.15; // ±15%
        });

        this._initialized = true;
        return this.rivals;
    }

    updateRivals() {
        // Actualizar datos ficticios de rivales (cambios lentos)
        this.rivals.forEach(rival => {
            // Ingresos varían entre ±20%
            const change = (Math.random() - 0.5) * 0.4;
            rival.variance += change * 0.1;
            rival.variance = Math.max(-0.3, Math.min(0.3, rival.variance));

            // Reputación cambia muy lentamente
            const repChange = (Math.random() - 0.5) * 2;
            rival.reputation = Math.max(20, Math.min(95, rival.reputation + repChange));
        });
    }

    getRanking() {
        // Si no hay rivales inicializados y hay hub, inicializar ahora
        if (!this.rivals || this.rivals.length === 0) {
            if (this.game.state.mainHub) {
                console.log('⚠️ Rivales no inicializados. Inicializando ahora...');
                this.initRivals();
            } else {
                return [];
            }
        }

        // Retorna ranking de todas las aerolíneas (jugador + rivales)
        const playerIncome = this.game.state.lastEconomy?.gross || 50000;
        const playerReputation = this.game.state.reputation || 50;

        const player = {
            name: this.game.state.companyName,
            dailyIncome: playerIncome,
            reputation: playerReputation,
            isPlayer: true,
            color: '#10b981'
        };

        const rivalList = this.rivals.map(r => ({
            name: r.name,
            dailyIncome: Math.floor(r.dailyIncome * (1 + r.variance)),
            reputation: r.reputation,
            isPlayer: false,
            color: r.color
        }));

        // Crear ranking completo ordenado por ingresos
        const allAirlines = [player, ...rivalList];
        const sortedRanking = allAirlines
            .sort((a, b) => b.dailyIncome - a.dailyIncome)
            .map((airline, i) => ({
                ...airline,
                position: i + 1
            }));

        return sortedRanking;
    }

    getPlayerPosition() {
        const ranking = this.getRanking();
        const playerPos = ranking.find(a => a.isPlayer);
        return playerPos ? playerPos.position : 1;
    }

    getTotalRivals() {
        return (this.rivals?.length || 0) + 1; // +1 para incluir al jugador
    }

    getPlayerRankPosition() {
        // Retorna solo la posición del jugador
        return this.getRanking().find(a => a.isPlayer)?.position || 1;
    }

    getCompetitionFactorForRoute(origin, dest) {
        // Penaliza ligeramente el factor de ocupación si hay rivales con hub en origen o destino
        if (!origin || !dest) return 1.0;
        // Asegurar rivales inicializados
        if (!this._initialized && this.game.state.mainHub) {
            this.initRivals();
        }
        const rivalsHere = (this.rivals || []).filter(r => r.hub === origin || r.hub === dest).length;
        // 5% de penalización por rival, mínimo 0.85x
        const factor = Math.max(0.85, Math.pow(0.95, rivalsHere));
        return factor;
    }

    getRivalCountAtEndpoints(origin, dest) {
        if (!origin || !dest) return 0;
        if (!this._initialized && this.game.state.mainHub) {
            this.initRivals();
        }
        return (this.rivals || []).filter(r => r.hub === origin || r.hub === dest).length;
    }

    getCompetitionLabelForRoute(origin, dest) {
        const count = this.getRivalCountAtEndpoints(origin, dest);
        if (count >= 2) return 'Alta';
        if (count === 1) return 'Media';
        return 'Baja';
    }

    getRivalPriceOnRoute(origin, dest) {
        // Returns average price multiplier from rivals on this route
        if (!origin || !dest) return 1.0;
        if (!this._initialized && this.game.state.mainHub) {
            this.initRivals();
        }
        
        const rivalsHere = (this.rivals || []).filter(r => r.hub === origin || r.hub === dest);
        if (rivalsHere.length === 0) return 1.0;
        
        // Calculate average based on rival profile
        let totalPrice = 0;
        rivalsHere.forEach(rival => {
            // Low-cost: 0.75-0.85, Legacy: 0.95-1.05, Premium: 1.15-1.25
            if (rival.profile === 'low-cost') {
                totalPrice += 0.8;
            } else if (rival.profile === 'premium') {
                totalPrice += 1.2;
            } else {
                totalPrice += 1.0; // legacy
            }
        });
        
        return totalPrice / rivalsHere.length;
    }
}
