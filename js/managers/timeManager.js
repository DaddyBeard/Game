export class TimeManager {
    constructor(game) {
        this.game = game;
        this.speed = 1; // Label of current speed (e.g., 1,2,5)
        this.accumulator = 0;
        // Mapping: real milliseconds per game MINUTE (más granular)
        this.SPEED_MINUTE_MS = {
            0.5: 2083.33, // ~50 min per day (2083ms per game minute)
            1: 1041.67,   // ~25 min per day (1041ms per game minute)
            2: 520.83,    // ~12.5 min per day (520ms per game minute)
            5: 208.33,    // ~5 min per day (208ms per game minute)
            10: 104.17,   // ~2.5 min per day (104ms per game minute)
            20: 52.08     // ~1.25 min per day (52ms per game minute)
        };
        this.minuteLengthMs = this.SPEED_MINUTE_MS[1];
        this.isPaused = false; // NEW: Local pause control
        this.lastUpdate = 0; // Para detectar parones largos
        this.lastEventCheck = Date.now(); // Track when we last checked for events
    }

    // NEW: Toggle pause state
    togglePause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    // NEW: Set game speed (selects ms per game minute)
    setSpeed(newSpeed) {
        this.speed = newSpeed;
        const mapped = this.SPEED_MINUTE_MS[newSpeed];
        if (mapped) {
            this.minuteLengthMs = mapped;
        }
        return this.speed;
    }

    // DEV: Set a custom minute length in ms
    setCustomMinuteLength(ms) {
        if (typeof ms === 'number' && ms > 10) {
            this.minuteLengthMs = ms;
        }
        return this.minuteLengthMs;
    }

    update(delta) {
        // Check local pause instead of state
        if (this.isPaused) {
            return;
        }

        // Protección contra parones largos (ej: pestaña inactiva)
        // Si delta es mayor a 5 segundos, limitarlo para evitar saltos grandes
        const safeDelta = Math.min(delta, 5000);

        // Accumulate real time
        this.accumulator += safeDelta;

        const minuteLength = this.minuteLengthMs;

        // Avanzar minutos en lugar de horas para progresión más suave
        if (this.accumulator >= minuteLength) {
            const minutesPassed = Math.floor(this.accumulator / minuteLength);
            this.advanceTime(minutesPassed);
            this.accumulator %= minuteLength;
            
            // Debug: log cada vez que avanza el tiempo (solo en modo debug y ocasionalmente)
            const DEBUG_MODE = window.location.hostname === 'localhost';
            if (DEBUG_MODE && Math.random() < 0.01) {
                const currentDate = new Date(this.game.state.date);
                console.log('⏰ [DEBUG] Time advanced:', minutesPassed, 'minutes. Current time:', currentDate.toLocaleString('es-ES'));
            }
        }

        this.lastUpdate = performance.now();
    }

    advanceTime(minutes) {
        // Store old date for comparison
        const oldDate = new Date(this.game.state.date);
        const oldDay = oldDate.getDate();
        const oldHour = oldDate.getHours();

        // Add minutes to date (1 minute = 60000 ms)
        const msPerMinute = 60000;
        this.game.state.date += minutes * msPerMinute;

        // Check if we crossed into a new day
        const newDate = new Date(this.game.state.date);
        const newDay = newDate.getDate();
        const newHour = newDate.getHours();

        // Auto-apply theme based on game time (if user hasn't set manual override)
        if (oldHour !== newHour) {
            this.applyThemeBasedOnTime();
        }

        // Trigger daily economy processing when day changes
        if (oldDay !== newDay) {
            // Check for new events
            this.checkAndTriggerEvents();

            // Actualizar mercado de combustible (cadencia diaria)
            if (this.game.managers.economy?.fuelSystem) {
                this.game.managers.economy.fuelSystem.updateDaily();
            }
            
            this.game.managers.economy.processDaily();
            
            // Generate contract offers every 7 days
            if (newDay % 7 === 0) {
                this.game.managers.economy.generateContractOffers();
            }
            
            // Update competidores (precios, rutas)
            if (this.game.managers.competitors) {
                this.game.managers.competitors.updateCompetitorPrices();
                this.game.managers.competitors.updateCompetitorRoutes();
            }
        }
    }

    /**
     * Check if new events should trigger today
     */
    async checkAndTriggerEvents() {
        console.log('🎲 Checking for events...');
        try {
            // Dynamic import to avoid circular dependencies
            const eventsModule = await import('../models/eventsModel.js');
            const { checkEventOccurrence, getActiveEvents } = eventsModule;
            
            // Initialize activeEvents array if not exists
            if (!this.game.state.activeEvents) {
                console.log('⚙️ Initializing activeEvents array');
                this.game.state.activeEvents = [];
            }
            
            // Check for new event today
            const { triggered, event } = checkEventOccurrence();
            console.log('🎲 Event check result:', { triggered, eventName: event?.name });
            if (triggered && event) {
                this.game.state.activeEvents.push(event);
                console.log(`📅 Evento: ${event.name} (${event.durationDays} días)`);
                
                // Notify UI if available
                if (this.game.managers?.ui?.showNotification) {
                    this.game.managers.ui.showNotification(
                        event.name,
                        event.description,
                        event.type === 'negative' ? 'warning' : 'success'
                    );
                }
            }
            
            // Clean up expired events
            const beforeCount = this.game.state.activeEvents.length;
            const active = getActiveEvents(this.game.state);
            this.game.state.activeEvents = active;
                        console.log(`📊 Events status: ${beforeCount} → ${active.length} active`);
            
        } catch (err) {
            console.warn('⚠️ Events system error:', err);
        }
    }

    /**
     * Aplica tema automáticamente según la hora LOCAL del sistema
     * Solo si el usuario no tiene un override manual
     */
    applyThemeBasedOnTime() {
        // Check if user has manual override
        const themeMode = localStorage.getItem('theme-mode') || 'auto';
        if (themeMode !== 'auto') return; // User has manual preference

        // Usar hora LOCAL del sistema, no del juego
        const now = new Date();
        const hour = now.getHours();
        
        // 6:00-20:00 = día (light), 20:00-6:00 = noche (dark)
        const shouldBeLight = hour >= 6 && hour < 20;
        const currentTheme = document.body.getAttribute('data-theme');
        const targetTheme = shouldBeLight ? 'light' : 'dark';

        if (currentTheme !== targetTheme) {
            document.body.setAttribute('data-theme', targetTheme);
            // Update icon if UI manager is available
            if (this.game.managers?.ui?.updateThemeIcon) {
                this.game.managers.ui.updateThemeIcon(themeMode, targetTheme);
            }
            // Update map theme
            if (this.game.managers?.ui?.updateMapTheme) {
                this.game.managers.ui.updateMapTheme(targetTheme);
            }
        }
    }
}
