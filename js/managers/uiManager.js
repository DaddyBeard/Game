import { AIRCRAFT_TYPES } from '../models/aircraft.js';
import { AIRPORTS, Airport } from '../models/airport.js';
import { LEVEL_REQUIREMENTS } from '../models/progressionModel.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        
        // Cache de elementos DOM para evitar búsquedas repetidas
        this.elementCache = {};
        
        // Formatters reutilizables
        this.formatters = {
            currency: new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency: 'USD', 
                maximumFractionDigits: 0 
            }),
            currencyES: new Intl.NumberFormat('es-ES', { 
                style: 'currency', 
                currency: 'USD', 
                maximumFractionDigits: 0 
            })
        };
        
        this.elements = {
            money: this.getElement('money-val'),
            date: this.getElement('game-date'),
            views: document.querySelectorAll('.view'),
            navBtns: document.querySelectorAll('.nav-btn'),
            modalOverlay: this.getElement('modal-container'),
            modalTitle: this.getElement('modal-title'),
            modalBody: this.getElement('modal-body'),
            modalActions: this.getElement('modal-actions'),
            closeBtn: document.querySelector('.close-btn'),

            // Time controls
            btnPause: this.getElement('btn-pause'),
            btnSpeed1x: this.getElement('btn-speed-1x'),
            btnSpeed2x: this.getElement('btn-speed-2x'),
            btnSpeed5x: this.getElement('btn-speed-5x')
        };

        this.views = {
            home: this.getElement('home-view'),
            dashboard: this.getElement('dashboard-view'),
            routes: this.getElement('routes-view'),
            fleet: this.getElement('fleet-view'),
            economy: this.getElement('economy-view'),
            fuel: this.getElement('fuel-view'),
            hubs: this.getElement('hubs-view'),
            market: this.getElement('market-view'),
            menu: this.getElement('menu-view')
        };

        // UI State
        this.rankShowTop10 = false;
        this.tipsShown = {}; // Track which tips have been shown
        this.completedActions = {}; // Track user milestones

        // Interactive Map State
        this.mapState = {
            scale: 1,
            offsetX: 0,
            offsetY: 0,
            isDragging: false,
            lastX: 0,
            lastY: 0
        };

        // Theme system
        this.themeMode = localStorage.getItem('theme-mode') || 'auto'; // 'auto', 'light', 'dark'
        
        // Timers/intervals para limpieza
        this.activeTimers = [];

        this.setupNavigation();
        this.setupModal();
        this.setupTimeControls();
        this.setupKeyboardShortcuts();
        this.initializeTheme();
        this.setupThemeToggle();
    }
    
    /**
     * Método helper para obtener y cachear elementos DOM
     * @param {string} id - ID del elemento
     * @param {boolean} forceRefresh - Si es true, fuerza la búsqueda del elemento incluso si está cacheado
     * @returns {HTMLElement|null} Elemento DOM o null
     */
    getElement(id, forceRefresh = false) {
        if (forceRefresh || !this.elementCache[id]) {
            const element = document.getElementById(id);
            // Solo cachear si el elemento existe (no cachear null)
            if (element) {
                this.elementCache[id] = element;
            } else if (forceRefresh) {
                // Si forceRefresh y no existe, limpiar el cache
                delete this.elementCache[id];
            }
            return element;
        }
        return this.elementCache[id];
    }
    
    /**
     * Método helper para crear timeouts que se pueden limpiar
     * @param {Function} callback - Función a ejecutar
     * @param {number} delay - Delay en ms
     * @returns {number} ID del timeout
     */
    setTimeout(callback, delay) {
        const id = window.setTimeout(() => {
            callback();
            this.activeTimers = this.activeTimers.filter(t => t !== id);
        }, delay);
        this.activeTimers.push(id);
        return id;
    }
    
    /**
     * Limpiar todos los timers activos
     */
    cleanup() {
        this.activeTimers.forEach(id => clearTimeout(id));
        this.activeTimers = [];
    }

    init() {
        this.currentMoney = this.game.state.money;
        this.targetMoney = this.game.state.money;

        // Validate that mainHub is set, otherwise show setup
        if (!this.game.state.mainHub) {
            this.showSetupScreen();
        } else {
            // Si ya hay un hub seleccionado, mostrar la vista de inicio (que contiene el mapa)
            this.switchView('home');
            // Actualizar el HUD inmediatamente
            this.updateHUD();
            
            // Asegurar que el tiempo no esté pausado
            if (this.game.managers.time.isPaused) {
                this.game.managers.time.togglePause();
                this.updatePauseButton(false);
            }
        }
    }

    showSetupScreen() {
        // Usar el overlay del HTML en lugar de crear uno nuevo
        const overlay = this.getElement('hub-selection-overlay');
        if (!overlay) {
            console.error('Hub selection overlay not found in HTML');
            return;
        }

        // Mostrar el overlay
        overlay.classList.remove('hidden');

        // Obtener elementos del formulario (cacheados)
        const companyNameInput = this.getElement('company-name-input');
        const companyIataInput = this.getElement('company-iata-input');
        const hubGrid = this.getElement('hub-grid');
        const hubSearch = this.getElement('hub-search');
        const hubRegionFilter = this.getElement('hub-region-filter');
        const btnConfirmHub = this.getElement('btn-confirm-hub');

        // Limpiar valores por defecto
        if (companyNameInput) companyNameInput.value = '';
        if (companyIataInput) companyIataInput.value = '';

        // Obtener aeropuertos disponibles (nivel 1)
        const availableAirports = Object.entries(AIRPORTS)
            .filter(([code, airport]) => airport.minLevel === 1)
            .sort(([, a], [, b]) => (b.pop || 0) - (a.pop || 0));

        // Obtener regiones únicas para el filtro
        const regions = [...new Set(availableAirports.map(([, ap]) => ap.region))].sort();
        if (hubRegionFilter) {
            hubRegionFilter.innerHTML = '<option value="">Todas las regiones</option>' +
                regions.map(region => `<option value="${region}">${region}</option>`).join('');
        }

        // Variable para almacenar el hub seleccionado
        let selectedHubId = null;

        // Función para renderizar los hubs
        const renderHubs = (filteredAirports = availableAirports) => {
            if (!hubGrid) return;

            hubGrid.innerHTML = filteredAirports.map(([code, airport]) => {
                const dailyFee = this.game.getHubDailyFee(code);
                const formatter = this.formatters.currencyES;
                
                const categoryIcon = airport.category === 'mega-hub' ? '🌟' : 
                                    airport.category === 'major-hub' ? '⭐' : '';

                return `
                    <div class="hub-card" data-hub-id="${code}">
                        <div class="hub-card-header">
                            <div class="hub-card-title">${airport.name}</div>
                            <div class="hub-card-iata">${code}</div>
                        </div>
                        <div class="hub-card-body">
                            <div class="hub-card-stat">
                                <span class="hub-card-stat-label">Ciudad:</span>
                                <span class="hub-card-stat-value">${airport.city}</span>
                            </div>
                            <div class="hub-card-stat">
                                <span class="hub-card-stat-label">País:</span>
                                <span class="hub-card-stat-value">${airport.country}</span>
                            </div>
                            <div class="hub-card-stat">
                                <span class="hub-card-stat-label">Región:</span>
                                <span class="hub-card-stat-value">${airport.region}</span>
                            </div>
                            <div class="hub-card-stat">
                                <span class="hub-card-stat-label">Categoría:</span>
                                <span class="hub-card-stat-value">${categoryIcon} ${airport.category.replace('-', ' ')}</span>
                            </div>
                            <div class="hub-card-stat">
                                <span class="hub-card-stat-label">Población:</span>
                                <span class="hub-card-stat-value">${airport.pop}M</span>
                            </div>
                            <div class="hub-card-cost">
                                💰 Tarifa diaria: ${formatter.format(dailyFee)}
                            </div>
                </div>
            </div>
        `;
            }).join('');

            // Agregar event listeners a las cards
            hubGrid.querySelectorAll('.hub-card').forEach(card => {
                card.addEventListener('click', () => {
                    // Remover selección anterior
                    hubGrid.querySelectorAll('.hub-card').forEach(c => c.classList.remove('selected'));
                    // Seleccionar nueva card
                    card.classList.add('selected');
                    selectedHubId = card.dataset.hubId;
                    
                    // Validar formulario completo
                    validateForm();
                });
            });
        };

        // Renderizar hubs iniciales
        renderHubs();

        // Filtro de búsqueda
        if (hubSearch) {
            hubSearch.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const regionFilter = hubRegionFilter?.value || '';
                
                const filtered = availableAirports.filter(([code, airport]) => {
                    const matchesSearch = !searchTerm || 
                        airport.name.toLowerCase().includes(searchTerm) ||
                        airport.city.toLowerCase().includes(searchTerm) ||
                        airport.country.toLowerCase().includes(searchTerm) ||
                        code.toLowerCase().includes(searchTerm);
                    
                    const matchesRegion = !regionFilter || airport.region === regionFilter;
                    
                    return matchesSearch && matchesRegion;
                });
                
                renderHubs(filtered);
            });
        }

        // Filtro de región
        if (hubRegionFilter) {
            hubRegionFilter.addEventListener('change', () => {
                const searchTerm = hubSearch?.value.toLowerCase() || '';
                const regionFilter = hubRegionFilter.value;
                
                const filtered = availableAirports.filter(([code, airport]) => {
                    const matchesSearch = !searchTerm || 
                        airport.name.toLowerCase().includes(searchTerm) ||
                        airport.city.toLowerCase().includes(searchTerm) ||
                        airport.country.toLowerCase().includes(searchTerm) ||
                        code.toLowerCase().includes(searchTerm);
                    
                    const matchesRegion = !regionFilter || airport.region === regionFilter;
                    
                    return matchesSearch && matchesRegion;
                });
                
                renderHubs(filtered);
            });
        }

        // Botón de confirmación
        if (btnConfirmHub) {
            btnConfirmHub.addEventListener('click', () => {
                if (!selectedHubId) {
                    alert('Por favor selecciona un hub principal');
                    return;
                }
                this.handleSetupComplete(selectedHubId);
            });
        }

        // Validar campos del formulario para habilitar botón
        const validateForm = () => {
            const nameValid = companyNameInput?.value.trim().length > 0;
            const iataValid = companyIataInput?.value.trim().length === 2;
            const hubValid = selectedHubId !== null;
            
            if (btnConfirmHub) {
                btnConfirmHub.disabled = !(nameValid && iataValid && hubValid);
            }
        };

        if (companyNameInput) {
            companyNameInput.addEventListener('input', validateForm);
        }
        if (companyIataInput) {
            companyIataInput.addEventListener('input', validateForm);
        }
    }

    async handleSetupComplete(selectedHubId = null) {
        const companyNameInput = this.getElement('company-name-input');
        const companyIataInput = this.getElement('company-iata-input');
        const overlay = this.getElement('hub-selection-overlay');

        const companyName = companyNameInput?.value.trim() || '';
        const companyIATA = companyIataInput?.value.trim().toUpperCase() || '';
        const mainHub = selectedHubId || '';

        if (!companyName) {
            alert('Ingresa un nombre para tu aerolínea');
            return;
        }
        if (!companyIATA || companyIATA.length !== 2) {
            alert('Ingresa un código IATA válido (2 letras)');
            return;
        }
        if (!mainHub) {
            alert('Selecciona un hub principal');
            return;
        }

        // Apply setup
        this.game.state.companyName = companyName;
        this.game.state.companyIATA = companyIATA;
        
        // Call newGameWithHub
        const result = await this.game.newGameWithHub(mainHub);
        if (!result.success) {
            alert('Error: ' + result.msg);
            return;
        }

        // Ocultar overlay
        if (overlay) {
            overlay.classList.add('hidden');
        }

        // Inicializar valores de dinero antes de mostrar el dashboard
        this.currentMoney = this.game.state.money || 0;
        this.targetMoney = this.game.state.money || 0;
        
        // Asegurar que el elemento money está cacheado y actualizado
        if (!this.elements.money) {
            this.elements.money = this.getElement('money-val');
        }
        if (this.elements.money) {
            const formatter = this.formatters.currency;
            this.elements.money.textContent = formatter.format(this.game.state.money || 0);
        }
        
        // Show home view (which contains the map)
        this.switchView('home');
        // Actualizar HUD después de completar el setup
        this.updateHUD();
        
        // Asegurar que el tiempo no esté pausado después del setup
        this.game.managers.time.isPaused = false;
        this.updatePauseButton(false);
        
        console.log('✅ Setup complete! Company:', companyName, 'IATA:', companyIATA, 'Hub:', mainHub);
        console.log('⏰ Time state after setup - isPaused:', this.game.managers.time.isPaused, 'speed:', this.game.managers.time.speed);
    }

    updateHUD() {
        this.targetMoney = this.game.state.money || 0;
        
        // Actualizar dinero en el header (money-val) con animación suave
        // Asegurar que currentMoney está inicializado antes de animar
        if (this.currentMoney === undefined || this.currentMoney === null) {
            this.currentMoney = this.targetMoney;
        }
        this.animateMoney();

        // Asegurarse de que el elemento date existe y está cacheado
        if (!this.elements.date) {
            this.elements.date = this.getElement('game-date');
        }

        if (this.elements.date && this.game.state.date) {
        const dateObj = new Date(this.game.state.date);
        const day = dateObj.getDate();
        const month = dateObj.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
        const year = dateObj.getFullYear();
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getSeconds()).padStart(2, '0');

            // Formato: día mes(abreviado) año hora:minutos:segundos
            // Ejemplo: 1 ENE 2025 12:30:45
        this.elements.date.textContent = `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
        }

        // Also keep dashboard KPIs in sync (usar elementos cacheados)
        const formatter = this.formatters.currency;
        const moneyEl = this.getElement('dash-money');
        const routesEl = this.getElement('dash-routes');
        const fleetEl = this.getElement('dash-fleet');
        const revenueEl = this.getElement('dash-revenue');
        const costsEl = this.getElement('dash-costs');
        const netEl = this.getElement('dash-net');

        if (moneyEl) moneyEl.textContent = formatter.format(this.game.state.money);

        const routes = this.game.managers.routes.getRoutes();
        if (routesEl) routesEl.textContent = routes.length;

        const fleet = this.game.managers.fleet.ownedPlanes;
        if (fleetEl) fleetEl.textContent = fleet.length;

        const totalRevenue = routes.reduce((sum, r) => sum + r.dailyRevenue, 0);
        if (revenueEl) revenueEl.textContent = formatter.format(totalRevenue);

        const lastEco = this.game.state.lastEconomy;
        if (costsEl) costsEl.textContent = formatter.format(lastEco?.costs || 0);
        if (netEl) netEl.textContent = formatter.format(lastEco?.net || 0);

        // Update reputation in status bar (usar elementos cacheados)
        const reputationEl = this.getElement('reputation-val');
        const reputation = this.game.state.reputation || 50;
        if (reputationEl) {
            reputationEl.textContent = `${Math.round(reputation)}/100`;
        }

        // Update reputation in dashboard card
        const dashRepEl = this.getElement('dash-reputation');
        if (dashRepEl) {
            dashRepEl.textContent = `${Math.round(reputation)}/100`;
        }

        // Update reputation bar in dashboard if visible
        const repBar = this.getElement('rep-bar');
        if (repBar) {
            repBar.style.width = `${reputation}%`;
        }

        // Update load factor info
        const repTrend = this.getElement('rep-trend');
        if (repTrend) {
            const loadFactor = this.game.managers.routes.calculateLoadFactorByReputation?.();
            if (loadFactor) {
                const occupancy = Math.round(loadFactor * 85);
                repTrend.textContent = `↓ Factor ocupación: ${occupancy}%`;
            }
        }

        // Update ranking dynamically
        this.renderRanking();

        // Update alerts
        this.renderAlerts();

        // Update level progress
        this.renderLevelProgress();

        // Update level badge (usar elementos cacheados)
        const levelEl = this.getElement('level-val');
        if (levelEl) levelEl.textContent = `Lv ${this.game.state.level || 1}`;

        // Update compact level progress ring
        const ringEl = this.getElement('level-progress');
        if (ringEl) {
            const pct = Math.max(0, Math.min(100, Math.round(this.calculateLevelProgressPercent())));
            ringEl.style.background = `conic-gradient(#22c55e ${pct}%, rgba(255,255,255,0.2) ${pct}%)`;
            ringEl.style.cursor = 'pointer';

            // Tooltip: breakdown por categoría
            const breakdown = this.getLevelProgressBreakdown?.();
            if (breakdown) {
                const { rep, fleet, routes, profit, targets } = breakdown;
                const tip = [
                    `⭐ Rep: ${rep.curr}/${targets.reputation} (${Math.round(rep.pct * 100)}%)`,
                    `✈️ Flota: ${fleet.curr}/${targets.fleetSize} (${Math.round(fleet.pct * 100)}%)`,
                    `🗺️ Rutas: ${routes.curr}/${targets.activeRoutes} (${Math.round(routes.pct * 100)}%)`,
                    `💵 Beneficio: $${(profit.curr||0).toLocaleString()}/$${(targets.cumulativeProfit||0).toLocaleString()} (${Math.round(profit.pct * 100)}%)`
                ].join('\n');
                ringEl.title = tip;
            }

            // Click: ir al panel de nivel
            if (!ringEl._hasClick) {
                ringEl.addEventListener('click', () => {
                    this.switchView('dashboard');
                    const panel = this.getElement('level-panel');
                    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
                ringEl._hasClick = true;
            }
        }

        // Show level-up notifications once
        const notifs = this.game.state.levelUpNotifications || [];
        if (notifs.length > 0) {
            const last = notifs[notifs.length - 1];
            const unlocks = last.unlocks || [];
            let msg = `🎉 ¡Nivel ${last.level} alcanzado!`;
            if (unlocks.length > 0) {
                msg += `\n✈️ Nuevos aviones: ${unlocks.join(', ')}`;
            }
            this.showError(msg);
            // Clear to avoid repeated alerts
            this.game.state.levelUpNotifications = [];
            this.game.save();
        }

        // Toggle secondary hub action visibility
        const hubBtn = this.getElement('btn-open-hub');
        if (hubBtn) {
            const level = this.game.state.level || 1;
            const cash = this.game.state.money || 0;
            const canOpen = level >= 2 && cash >= 10000000;
            hubBtn.style.display = canOpen ? 'block' : 'none';
            if (!hubBtn._hasClick) {
                hubBtn.addEventListener('click', () => this.showOpenHubModal());
                hubBtn._hasClick = true;
            }
        }

        // Check and show tips
        this.checkAndShowTips();
    }

    calculateLevelProgressPercent() {
        const breakdown = this.getLevelProgressBreakdown();
        if (!breakdown) return 0;
        const avg = (breakdown.rep.pct + breakdown.fleet.pct + breakdown.routes.pct + breakdown.profit.pct) / 4;
        return avg * 100;
    }

    getNextLevelRequirements() {
        const level = this.game.state.level || 1;
        const next = level + 1;
        
        // Use imported LEVEL_REQUIREMENTS
        if (LEVEL_REQUIREMENTS[next]) {
            return LEVEL_REQUIREMENTS[next];
        }
        
        // Fallback to basic requirements (without unlocks)
        const defaults = {
            2: { reputation: 50, fleetSize: 2, activeRoutes: 2, cumulativeProfit: 1000000, unlocksAircraft: ['A340', 'B777'], unlocksHub: false },
            3: { reputation: 60, fleetSize: 4, activeRoutes: 4, cumulativeProfit: 10000000, unlocksAircraft: ['B787', 'A350'], unlocksHub: false },
            4: { reputation: 70, fleetSize: 6, activeRoutes: 6, cumulativeProfit: 50000000, unlocksAircraft: ['B777', 'A380'], unlocksHub: true },
            5: { reputation: 75, fleetSize: 8, activeRoutes: 8, cumulativeProfit: 100000000, unlocksAircraft: ['A380'], unlocksHub: true },
            6: { reputation: 78, fleetSize: 10, activeRoutes: 10, cumulativeProfit: 200000000, unlocksAircraft: [], unlocksHub: true },
            7: { reputation: 80, fleetSize: 12, activeRoutes: 10, cumulativeProfit: 300000000, unlocksAircraft: [], unlocksHub: true },
            8: { reputation: 85, fleetSize: 14, activeRoutes: 12, cumulativeProfit: 500000000, unlocksAircraft: [], unlocksHub: true },
            9: { reputation: 88, fleetSize: 15, activeRoutes: 12, cumulativeProfit: 700000000, unlocksAircraft: [], unlocksHub: true },
            10: { reputation: 90, fleetSize: 15, activeRoutes: 12, cumulativeProfit: 1000000000, unlocksAircraft: [], unlocksHub: true }
        };
        return defaults[next] || defaults[10];
    }

    getLevelProgressBreakdown() {
        const reqs = this.getNextLevelRequirements();
        if (!reqs) return null;
        const repCurr = Math.max(0, Math.min(100, Math.round(this.game.state.reputation || 0)));
        const fleetCurr = this.game.managers.fleet.ownedPlanes.length;
        const routesCurr = this.game.managers.routes.getRoutes().length;
        const profitCurr = this.game.state.cumulativeProfit || 0;

        return {
            targets: reqs,
            rep: { curr: repCurr, pct: Math.min(1, repCurr / reqs.reputation) },
            fleet: { curr: fleetCurr, pct: Math.min(1, fleetCurr / reqs.fleetSize) },
            routes: { curr: routesCurr, pct: Math.min(1, routesCurr / reqs.activeRoutes) },
            profit: { curr: profitCurr, pct: Math.min(1, profitCurr / reqs.cumulativeProfit) }
        };
    }

    animateMoney() {
        // Asegurar que el elemento money existe y está cacheado
        // Si no existe, intentar obtenerlo de nuevo (por si el DOM no estaba listo al inicializar)
        if (!this.elements.money) {
            this.elements.money = this.getElement('money-val', true); // forceRefresh = true
        }
        
        if (!this.elements.money) {
            // Si aún no existe después de intentar, salir silenciosamente
            // El elemento podría no estar en el DOM aún
            return;
        }
        
        // Si currentMoney no está inicializado o hay una diferencia muy grande, actualizar directamente
        if (this.currentMoney === undefined || this.currentMoney === null) {
            this.currentMoney = this.targetMoney;
        }
        
        const diff = this.targetMoney - this.currentMoney;
        
        // Si la diferencia es muy grande (>1M) o si currentMoney es 0 y targetMoney no, actualizar directamente
        if (Math.abs(diff) > 1000000 || (this.currentMoney === 0 && this.targetMoney > 0)) {
            this.currentMoney = this.targetMoney;
        } else if (Math.abs(diff) < 1) {
            this.currentMoney = this.targetMoney;
        } else {
            // Smooth lerp para animación suave (solo si la diferencia es pequeña)
            this.currentMoney += diff * 0.15;
        }

        const formatter = this.formatters.currency;
        this.elements.money.textContent = formatter.format(Math.round(this.currentMoney));

        // Add animation class when changing (solo si hubo cambio significativo)
        if (Math.abs(diff) > 100) {
            this.elements.money.classList.add('count-up');
            this.setTimeout(() => this.elements.money.classList.remove('count-up'), 400);
        }
    }

    /**
     * Inicializa el tema al cargar la aplicación
     */
    initializeTheme() {
        const mode = this.themeMode;
        
        if (mode === 'auto') {
            // Aplicar según hora LOCAL del sistema
            const now = new Date();
            const hour = now.getHours();
            const theme = (hour >= 6 && hour < 20) ? 'light' : 'dark';
            document.body.setAttribute('data-theme', theme);
        } else {
            // Aplicar tema manual
            document.body.setAttribute('data-theme', mode);
        }
        
        this.updateThemeIcon(mode, document.body.getAttribute('data-theme'));
    }

    /**
     * Configura el botón de toggle de tema
     */
    setupThemeToggle() {
        const btn = this.getElement('btn-theme-toggle');
        if (!btn) return;

        btn.addEventListener('click', () => {
            this.cycleTheme();
        });
    }

    /**
     * Cicla entre modos: auto → light → dark → auto
     */
    cycleTheme() {
        const modes = ['auto', 'light', 'dark'];
        const currentIndex = modes.indexOf(this.themeMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        const newMode = modes[nextIndex];
        
        this.themeMode = newMode;
        localStorage.setItem('theme-mode', newMode);
        
        let appliedTheme;
        if (newMode === 'auto') {
            // Aplicar según hora LOCAL del sistema
            const now = new Date();
            const hour = now.getHours();
            appliedTheme = (hour >= 6 && hour < 20) ? 'light' : 'dark';
        } else {
            appliedTheme = newMode;
        }
        
        document.body.setAttribute('data-theme', appliedTheme);
        this.updateThemeIcon(newMode, appliedTheme);
        
        // Update map theme if map exists
        this.updateMapTheme(appliedTheme);
        
        // Feedback visual
        const modeNames = { auto: 'Automático', light: 'Claro', dark: 'Oscuro' };
        this.showError(`Tema: ${modeNames[newMode]}`);
    }

    /**
     * Actualiza el icono del botón de tema
     * @param {string} mode - 'auto', 'light', 'dark'
     * @param {string} appliedTheme - 'light' o 'dark' (tema efectivo)
     */
    updateThemeIcon(mode, appliedTheme) {
        const iconEl = document.getElementById('theme-icon');
        if (!iconEl) return;

        // Iconos FA según modo
        const icons = {
            auto: 'fa-circle-half-stroke',  // Medio círculo (auto)
            light: 'fa-sun',  // Sol (modo claro forzado)
            dark: 'fa-moon'   // Luna (modo oscuro forzado)
        };
        
        const iconClass = icons[mode] || 'fa-circle-half-stroke';
        iconEl.innerHTML = `<i class="fa-solid ${iconClass}"></i>`;
        
        // Tooltip descriptivo
        const btn = this.getElement('btn-theme-toggle');
        if (btn) {
            const modeNames = { auto: 'Automático', light: 'Claro', dark: 'Oscuro' };
            const themeNames = { light: 'Claro', dark: 'Oscuro' };
            const tip = mode === 'auto' 
                ? `Tema: ${modeNames[mode]} (Actual: ${themeNames[appliedTheme]})`
                : `Tema: ${modeNames[mode]}`;
            btn.title = tip;
        }
    }

    setupNavigation() {
        this.elements.navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                this.switchView(targetId);
            });
        });
    }

    switchView(viewId) {
        // Update Buttons
        this.elements.navBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.target === viewId);
        });

        // Handle window resize for map
        window.addEventListener('resize', () => {
            if (this.map) this.map.invalidateSize();
        });

        // Hide all views first
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
            v.classList.add('hidden');
            v.style.display = 'none';
        });

        // Show target View (usar views cacheados)
        const view = this.views[viewId] || this.getElement(`${viewId}-view`);
        if (view) {
            view.classList.remove('hidden');
            view.style.display = 'block';
            this.setTimeout(() => view.classList.add('active'), 10);

            // Refresh content
            if (viewId === 'home') {
                // Inicializar o actualizar el mapa en la vista de inicio
                this.setTimeout(() => {
                    if (!this.map) {
                        this.initMap();
                    } else {
                        // El mapa ya existe, solo invalidar el tamaño para que se ajuste al contenedor
                        this.map.invalidateSize();
                    }
                    this.updateMap();
                }, 100);
            }
            if (viewId === 'dashboard') this.renderDashboard();
            if (viewId === 'market') this.renderMarket();
            if (viewId === 'fleet') this.renderFleet();
            if (viewId === 'economy') this.renderEconomy();
            if (viewId === 'hubs') this.buildHubsView();
            if (viewId === 'fuel') this.renderFuel();
            if (viewId === 'routes') {
                this.renderRoutes();
            }
        }
    }

    // --- FUEL VIEW RENDERER ---
    renderFuel(historyDays = 14) {
        const container = this.getElement('fuel-panel');
        if (!container) return;
        container.innerHTML = this.renderFuelPanel(historyDays);
        
        // Limpiar cache de botones dinámicos después de cambiar innerHTML
        delete this.elementCache['btn-purchase-fuel-contract'];
        // Wire purchase button (legacy, now hidden)
        const fuelBtn = this.getElement('btn-purchase-fuel-contract');
        if (fuelBtn) {
            fuelBtn.addEventListener('click', () => this.showFuelContractModal());
        }
        
        // Wire provider purchase buttons
        const providerBtns = document.querySelectorAll('.btn-purchase-from-provider');
        providerBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const offerId = btn.dataset.offerId;
                this.purchaseFromProvider(offerId);
            });
        });
        
        // Wire history selector buttons
        const historyBtns = document.querySelectorAll('.fuel-history-btn');
        historyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const days = parseInt(btn.dataset.days);
                this.renderFuel(days);
            });
        });

        // Wire spot purchase button
        const spotBtn = document.getElementById('btn-purchase-spot');
        if (spotBtn) {
            spotBtn.addEventListener('click', () => this.showSpotPurchaseModal());
        }
    }

    purchaseFromProvider(offerId) {
        const result = this.game.managers.economy.fuelProviders.purchaseFromOffer(offerId);
        
        if (result.success) {
            this.showNotification('Contrato Adquirido', result.msg, 'success');
            // Refresh fuel view
            this.setTimeout(() => this.renderFuel(14), 100);
            // Update dashboard (usar elemento cacheado)
            const dashMoney = this.getElement('dash-money');
            if (dashMoney) {
                dashMoney.innerText = this.formatters.currency.format(this.game.state.money);
            }
        } else {
            this.showNotification('Error', result.msg, 'error');
        }
    }

    setupModal() {
        // Close on X or Background
        this.elements.closeBtn.addEventListener('click', () => this.hideModal());
        this.elements.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.elements.modalOverlay) this.hideModal();
        });
    }

    showModal(title, contentHtml, actionsHtml = '') {
        // Reset to default
        this.elements.modalOverlay.classList.remove('immersive');
        this.elements.modalTitle.parentElement.style.display = 'flex';
        this.elements.modalActions.style.display = 'block';
        this.elements.modalBody.style.padding = '20px'; // Revert padding if changed

        this.elements.modalTitle.textContent = title;
        this.elements.modalBody.innerHTML = contentHtml;
        this.elements.modalActions.innerHTML = actionsHtml;

        this.elements.modalOverlay.classList.remove('hidden');
    }

    showImmersiveModal(html) {
        this.elements.modalOverlay.classList.add('immersive');
        this.elements.modalTitle.parentElement.style.display = 'none'; // Hide default header
        this.elements.modalActions.style.display = 'none'; // Hide default actions footer

        // Force large modal size with inline styles
        const modalContent = this.elements.modalOverlay.querySelector('.modal-content');
        modalContent.style.width = '100%';
        modalContent.style.maxWidth = '600px';
        modalContent.style.height = '85vh';
        modalContent.style.maxHeight = '85vh';
        modalContent.style.display = 'flex';
        modalContent.style.flexDirection = 'column';

        // We inject everything into body, which we strip padding from
        this.elements.modalBody.style.padding = '0';
        this.elements.modalBody.style.flex = '1';
        this.elements.modalBody.style.overflowY = 'auto';
        this.elements.modalBody.innerHTML = html;

        this.elements.modalOverlay.classList.remove('hidden');
    }

    hideModal() {
        this.elements.modalOverlay.classList.add('hidden');
        this.elements.modalOverlay.classList.remove('immersive');

        // Restore defaults for next time
        setTimeout(() => {
            this.elements.modalTitle.parentElement.style.display = 'flex';
            this.elements.modalActions.style.display = 'block';
            this.elements.modalBody.style.padding = '20px';
        }, 300);
    }

    // --- DASHBOARD RENDERER ---
    renderDashboard() {
        // Usar formatter cacheado
        const formatter = this.formatters.currency;

        // Get elements (usar cache)
        const moneyEl = this.getElement('dash-money');
        const routesEl = this.getElement('dash-routes');
        const fleetEl = this.getElement('dash-fleet');
        const revenueEl = this.getElement('dash-revenue');
        const costsEl = this.getElement('dash-costs');
        const netEl = this.getElement('dash-net');

        if (moneyEl) moneyEl.textContent = formatter.format(this.game.state.money);

        const routes = this.game.managers.routes.getRoutes();
        if (routesEl) routesEl.textContent = routes.length;

        const fleet = this.game.managers.fleet.ownedPlanes;
        if (fleetEl) fleetEl.textContent = fleet.length;

        // Calculate total daily revenue (expected) and show last processed costs
        const totalRevenue = routes.reduce((sum, r) => sum + r.dailyRevenue, 0);
        if (revenueEl) revenueEl.textContent = formatter.format(totalRevenue);

        const lastEco = this.game.state.lastEconomy;
        if (costsEl) costsEl.textContent = formatter.format(lastEco?.costs || 0);
        if (netEl) netEl.textContent = formatter.format(lastEco?.net || 0);

        // Render ranking
        this.renderRanking();

        // Render alerts
        this.renderAlerts();

        // Render level progress
        this.renderLevelProgress();

        // Render unlock progress
        this.renderUnlockProgress();

        // renderCompetitionStatus suprimido para evitar duplicar ranking; la info se integra en renderRanking
    }

    // --- ECONOMY RENDERER ---
    renderEconomy() {
        const container = this.getElement('economy-panel');
        if (!container) return;

        const formatter = this.formatters.currency;
        const routes = this.game.managers.routes.getRoutes();
        const seasonalFactor = this.game.managers.economy?.getSeasonalDemandFactor?.() || 1;
        const fuelIndex = this.game.managers.economy?.fuelIndex || 1;

        const totals = {
            revenue: 0,
            costs: 0,
            fuel: 0,
            crew: 0,
            cleaning: 0,
            maintenance: 0,
            airport: 0,
            loadFactorSum: 0,
            flights: 0,
            priceSum: 0
        };

        const routeRows = [];

        const calcLoadFactor = (priceMultiplier = 1.0) => {
            const rep = this.game.state.reputation || 50;
            const reputationFactor = 0.50 + (rep / 100 * 0.45);
            let priceFactor = 1.0;
            if (priceMultiplier < 1.0) {
                priceFactor = 1.0 + ((1.0 - priceMultiplier) * 0.20);
            } else if (priceMultiplier > 1.0) {
                priceFactor = 1.0 - ((priceMultiplier - 1.0) * 0.35);
            }
            const lf = Math.max(0.40, Math.min(1.0, reputationFactor * priceFactor));
            return lf;
        };

        routes.forEach(route => {
            const assignments = Array.isArray(route.assignments) && route.assignments.length > 0
                ? route.assignments
                : (route.assignedPlane ? [{ planeId: route.assignedPlane }] : []);

            assignments.forEach(a => {
                const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === a.planeId);
                if (!plane) return;

                const seats = plane.configuration && plane.configuration.economy ? {
                    economy: plane.configuration.economy,
                    premium: plane.configuration.premium,
                    business: plane.configuration.business
                } : (() => {
                    const totalSeats = plane.baseStats.seats || 0;
                    return {
                        economy: Math.floor(totalSeats * 0.7),
                        premium: Math.floor(totalSeats * 0.2),
                        business: Math.ceil(totalSeats * 0.1)
                    };
                })();

                const { originDemandFactor, destDemandFactor } = this.game.managers.routes.getDemandFactors(route.origin, route.dest);
                const priceMultiplier = route.priceMultiplier || 1.0;

                const baseDaily = this.game.managers.routes.calculatePotentialRevenue(
                    route.distance,
                    seats,
                    priceMultiplier,
                    originDemandFactor,
                    destDemandFactor,
                    route.origin,
                    route.dest,
                    route.frequency || 7
                );

                const revenue = Math.round(baseDaily * seasonalFactor);
                const costs = this.game.managers.economy.calculateRouteCosts(route, plane);
                const margin = revenue - (costs?.total || 0);

                const loadFactor = calcLoadFactor(priceMultiplier);

                totals.revenue += revenue;
                totals.costs += costs?.total || 0;
                totals.fuel += costs?.fuelCost || 0;
                totals.crew += costs?.crewCost || 0;
                totals.cleaning += costs?.cleaningCost || 0;
                totals.maintenance += costs?.maintReserve || 0;
                totals.airport += costs?.airportFees || 0;
                totals.loadFactorSum += loadFactor;
                totals.flights += 1;
                totals.priceSum += priceMultiplier;

                routeRows.push({
                    label: `${route.origin}-${route.dest}`,
                    revenue,
                    costs: costs?.total || 0,
                    margin,
                    load: loadFactor
                });
            });
        });

        const avgLoad = totals.flights ? (totals.loadFactorSum / totals.flights) : 0;
        const avgPrice = totals.flights ? (totals.priceSum / totals.flights) : 1;
        const net = totals.revenue - totals.costs;
        const marginPct = totals.revenue ? (net / totals.revenue) * 100 : 0;

        const sorted = routeRows.sort((a, b) => b.margin - a.margin);
        const topRoutes = sorted.slice(0, 5);
        const bottomRoutes = sorted.slice(-5);

        const renderList = (items) => {
            if (!items.length) return '<div style="color:#94a3b8;">Sin datos</div>';
            return items.map(item => {
                const color = item.margin >= 0 ? '#22c55e' : '#ef4444';
                return `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:0.65rem; border:1px solid rgba(148,163,184,0.25); border-radius:10px;">
                        <div>
                            <div style="font-weight:700; color:#e2e8f0;">${item.label}</div>
                            <div style="font-size:0.85rem; color:#94a3b8;">Ocupación ${(item.load*100).toFixed(0)}%</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="color:${color}; font-weight:700;">${formatter.format(item.margin)}</div>
                            <div style="font-size:0.8rem; color:#cbd5e1;">Ing ${formatter.format(item.revenue)} · G ${formatter.format(item.costs)}</div>
                        </div>
                    </div>`;
            }).join('');
        };

        const conceptList = `
            <ul style="margin:0; padding-left:1.1rem; color:#cbd5e1;">
                <li>Ingresos: distancia, tipo de asiento, reputación → ocupación, precio, competencia, demanda estacional.</li>
                <li>Costos: combustible (índice ${ (fuelIndex*100).toFixed(0) }%), tripulación, limpieza, mantenimiento, tasas aeroportuarias.</li>
                <li>Reputación alta (80-100) = ocupación 90-100%; reputación baja (<40) = 40-60%.</li>
                <li>Precio: low-cost (+ocupación, menos yield) vs premium (menos ocupación, más yield).</li>
                <li>Edad de flota: aviones viejos suben costos de combustible y mantenimiento.</li>
            </ul>
        `;

        const infoCards = `
            <div class="hero-card">
                <h3 style="margin:0 0 0.75rem 0; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">KPIs Económicos</h3>
                <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); gap: 0.75rem;">
                    <div class="kpi-card"><span class="label">Ingresos/día</span><span class="value" style="color:#4ade80;">${formatter.format(totals.revenue)}</span></div>
                    <div class="kpi-card"><span class="label">Costos/día</span><span class="value" style="color:#f87171;">${formatter.format(totals.costs)}</span></div>
                    <div class="kpi-card"><span class="label">Margen</span><span class="value" style="color:${net>=0?'#22c55e':'#ef4444'};">${formatter.format(net)} (${marginPct.toFixed(1)}%)</span></div>
                    <div class="kpi-card"><span class="label">Ocupación media</span><span class="value">${(avgLoad*100).toFixed(0)}%</span></div>
                    <div class="kpi-card"><span class="label">Precio medio</span><span class="value">${avgPrice.toFixed(2)}x</span></div>
                    <div class="kpi-card"><span class="label">Factor estacional</span><span class="value">${(seasonalFactor*100).toFixed(0)}%</span></div>
                </div>
            </div>

            <div class="hero-card">
                <h3 style="margin:0 0 0.75rem 0; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">Ingresos por Ruta (Top 5)</h3>
                <div style="display:flex; flex-direction:column; gap:0.5rem;">${renderList(topRoutes)}</div>
            </div>

            <div class="hero-card">
                <h3 style="margin:0 0 0.75rem 0; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">Rutas en Riesgo (Bottom 5)</h3>
                <div style="display:flex; flex-direction:column; gap:0.5rem;">${renderList(bottomRoutes)}</div>
            </div>

            <div class="hero-card">
                <h3 style="margin:0 0 0.75rem 0; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">Costos Desglosados</h3>
                <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
                    <div class="kpi-card"><span class="label">Combustible</span><span class="value">${formatter.format(totals.fuel)}</span></div>
                    <div class="kpi-card"><span class="label">Tripulación</span><span class="value">${formatter.format(totals.crew)}</span></div>
                    <div class="kpi-card"><span class="label">Limpieza</span><span class="value">${formatter.format(totals.cleaning)}</span></div>
                    <div class="kpi-card"><span class="label">Mantenimiento</span><span class="value">${formatter.format(totals.maintenance)}</span></div>
                    <div class="kpi-card"><span class="label">Tasas Aeroportuarias</span><span class="value">${formatter.format(totals.airport)}</span></div>
                    <div class="kpi-card"><span class="label">Índice Combustible</span><span class="value">${(fuelIndex*100).toFixed(0)}%</span></div>
                </div>
            </div>

            <div class="hero-card">
                <h3 style="margin:0 0 0.75rem 0; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">Conceptos Clave</h3>
                ${conceptList}
            </div>

            ${this.renderActiveEvents()}

            ${this.renderContractOffers()}

            ${this.renderCreditSystem()}

            <div class="hero-card">
                <h3 style="margin:0 0 0.75rem 0; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">Histórico (Últimos 7 días)</h3>
                ${this.renderEconomyHistory(7)}
            </div>

            <div class="hero-card">
                <h3 style="margin:0 0 0.75rem 0; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">Histórico (Últimos 30 días)</h3>
                ${this.renderEconomyHistory(30)}
            </div>
        `;

        if (!routeRows.length) {
            container.innerHTML = `
                <div class="hero-card">
                    <h3 style="margin:0 0 0.75rem 0; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">Economía</h3>
                    <div style="color:#94a3b8;">Aún no hay rutas activas. Crea tu primera ruta para ver métricas económicas.</div>
                </div>`;
            return;
        }

        container.innerHTML = infoCards;
        
        // Event listener for fuel contract purchase button
        const fuelBtn = document.getElementById('btn-purchase-fuel-contract');
        if (fuelBtn) {
            fuelBtn.addEventListener('click', () => this.showFuelContractModal());
        }

        // Event listener for loan request button
        this.setupCreditSystemListeners();

        // Event listeners for contract offers
        this.setupContractOfferListeners();
    }

    /**
     * Render economy history as mini sparkline and table
     */
    renderActiveEvents() {
        const activeEvents = this.game.state.activeEvents || [];
        console.log('📅 renderActiveEvents called, events count:', activeEvents.length);
        if (activeEvents.length === 0) {
            console.log('📅 No active events to display');
            return '';
        }
        
        const oneDay = 24 * 60 * 60 * 1000;
        const now = this.game.state.date;
        
        const eventCards = activeEvents.map(evt => {
            const age = (now - evt.startDate) / oneDay;
            const remaining = Math.max(0, evt.durationDays - age);
            const progress = Math.min(100, (age / evt.durationDays) * 100);
            
            let bgColor = 'rgba(34,197,94,0.12)';
            let borderColor = 'rgba(34,197,94,0.3)';
            let textColor = '#10b981';
            
            if (evt.type === 'negative') {
                bgColor = 'rgba(239,68,68,0.12)';
                borderColor = 'rgba(239,68,68,0.3)';
                textColor = '#ef4444';
            } else if (evt.type === 'competitive') {
                bgColor = 'rgba(245,158,11,0.12)';
                borderColor = 'rgba(245,158,11,0.3)';
                textColor = '#f59e0b';
            } else if (evt.type === 'operational') {
                bgColor = 'rgba(59,130,246,0.12)';
                borderColor = 'rgba(59,130,246,0.3)';
                textColor = '#3b82f6';
            }
            
            // Calcular signos de los multiplicadores
            const demandChange = evt.demandMultiplier > 1 ? `+${((evt.demandMultiplier - 1) * 100).toFixed(0)}%` : 
                                 evt.demandMultiplier < 1 ? `${((evt.demandMultiplier - 1) * 100).toFixed(0)}%` : 'Sin cambio';
            const costChange = evt.costMultiplier > 1 ? `+${((evt.costMultiplier - 1) * 100).toFixed(0)}%` : 
                               evt.costMultiplier < 1 ? `${((evt.costMultiplier - 1) * 100).toFixed(0)}%` : 'Sin cambio';
            const demandColor = evt.demandMultiplier > 1 ? '#10b981' : evt.demandMultiplier < 1 ? '#ef4444' : '#64748b';
            const costColor = evt.costMultiplier > 1 ? '#ef4444' : evt.costMultiplier < 1 ? '#10b981' : '#64748b';
            
            return `
                <div style="background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 10px; padding: 12px; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <div style="color: ${textColor}; font-weight: 700; font-size: 0.95rem;">${evt.name}</div>
                        <div style="color: #94a3b8; font-size: 0.75rem;">${remaining.toFixed(1)} días</div>
                    </div>
                    <div style="color: #cbd5e1; font-size: 0.85rem; margin-bottom: 8px;">${evt.description}</div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; font-size: 0.8rem;">
                        <div style="background: rgba(255,255,255,0.05); padding: 6px; border-radius: 6px; border-left: 2px solid ${demandColor};">
                            <div style="color: #94a3b8; margin-bottom: 2px;">Demanda</div>
                            <div style="color: ${demandColor}; font-weight: 700;">${demandChange}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); padding: 6px; border-radius: 6px; border-left: 2px solid ${costColor};">
                            <div style="color: #94a3b8; margin-bottom: 2px;">Costos</div>
                            <div style="color: ${costColor}; font-weight: 700;">${costChange}</div>
                        </div>
                    </div>
                    
                    <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                        <div style="height: 100%; background: ${textColor}; width: ${progress}%; transition: width 0.3s;"></div>
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="hero-card">
                <h3 style="margin:0 0 0.75rem 0; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">📅 Eventos Activos</h3>
                ${eventCards}
            </div>
        `;
    }

    renderFuelPanel(historyDays = 14) {
        const fuelState = this.game.state.fuel || { spotPrice: 1, marketState: 'ESTABLE', history: [], contracts: [] };
        const fuelIndex = this.game.managers.economy.fuelIndex || 1;
        const marketPrice = fuelState.spotPrice || 1;
        const marketState = fuelState.marketState || 'ESTABLE';
        const history = (fuelState.history || []).slice(-historyDays);
        const lastSpot = history.length ? history[history.length - 1].spot : marketPrice;
        const firstSpot = history.length ? history[0].spot : lastSpot;
        const trendPct = firstSpot ? ((lastSpot - firstSpot) / firstSpot) * 100 : 0;
        const trendIcon = trendPct > 1 ? '📈' : trendPct < -1 ? '📉' : '➡️';
        const trendColor = trendPct > 1 ? '#10b981' : trendPct < -1 ? '#ef4444' : '#cbd5e1';

        // NUEVO: Obtener alertas y métricas
        const alerts = this.game.managers.economy.fuelSystem.getAlerts();
        const metrics = this.game.managers.economy.fuelSystem.getEfficiencyMetrics();
        const inCrisis = fuelState.inCrisis || false;
        const crisisDays = fuelState.crisisDays || 0;

        const level = this.game.state.level || 1;
        const allowedDurations = this.game.managers.economy.fuelSystem.allowedDurations(level);
        const volumeCaps = this.game.managers.economy.fuelSystem.volumeCaps(level);

        // Mostrar contratos que: tienen volumen, no expirado, y tienen capacidad disponible
        const activeContracts = (fuelState.contracts || []).filter(c => {
            const hasCapacity = c.used < c.volume;
            const notExpired = this.game.state.date <= c.endDate;
            const isValid = c.volume && c.price && c.endDate;
            return isValid && notExpired && hasCapacity;
        });

        // NUEVO: Calcular métricas de inventario
        const totalLitersAvailable = activeContracts.reduce((sum, c) => sum + (c.volume - c.used), 0);
        const estimatedDailyConsumption = this.game.managers.economy.fuelProviders.estimateDailyConsumption();
        const daysOfCoverage = estimatedDailyConsumption > 0 ? totalLitersAvailable / estimatedDailyConsumption : 0;
        const depletionDate = daysOfCoverage > 0 
            ? new Date(this.game.state.date + (daysOfCoverage * 24 * 60 * 60 * 1000))
            : null;
        const usingSpot = totalLitersAvailable === 0;
        const avgContractPrice = activeContracts.length > 0
            ? activeContracts.reduce((sum, c) => sum + c.price, 0) / activeContracts.length
            : 0;

        // Resumen de costos de combustible por día (estimado)
        let fuelPerDay = 0;
        const routes = this.game.managers.routes.getRoutes();
        routes.forEach(route => {
            const assignments = Array.isArray(route.assignments) && route.assignments.length > 0
                ? route.assignments
                : (route.assignedPlane ? [{ planeId: route.assignedPlane }] : []);
            assignments.forEach(a => {
                const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === a.planeId);
                if (!plane) return;
                const costs = this.game.managers.economy.calculateRouteCosts(route, plane);
                fuelPerDay += costs.fuelCost || 0;
            });
        });

        const spark = history.map(h => h.spot);
        const maxSpot = Math.max(...spark, marketPrice);
        const minSpot = Math.min(...spark, marketPrice);
        const range = Math.max(0.001, maxSpot - minSpot);
        const sparkHTML = spark.map(val => {
            const pct = ((val - minSpot) / range) * 100;
            return `<div style="flex:1; background: linear-gradient(180deg, #3b82f6, #0ea5e9); height:${Math.max(8, pct * 0.6)}px; border-radius:2px;"></div>`;
        }).join('');

        let contractsHTML = '';
        if (activeContracts.length > 0) {
            contractsHTML = activeContracts.map(c => {
                const remaining = c.volume - c.used;
                const progress = (c.used / c.volume) * 100;
                const daysLeft = Math.max(0, (c.endDate - this.game.state.date) / (24 * 60 * 60 * 1000));
                const savings = (marketPrice - c.price) * remaining;
                const savingsColor = savings > 0 ? '#10b981' : '#ef4444';
            
                return `
                    <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                            <div style="color: #cbd5e1; font-size: 0.85rem; font-weight: 600;">$${c.price.toFixed(3)}/L</div>
                            <div style="color: #94a3b8; font-size: 0.75rem;">${daysLeft.toFixed(0)} días</div>
                        </div>
                        <div style="color: #94a3b8; font-size: 0.75rem; margin-bottom: 4px;">
                            ${remaining.toLocaleString()}L restantes (${(100 - progress).toFixed(0)}%)
                        </div>
                        <div style="width: 100%; height: 3px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb); width: ${progress}%;"></div>
                        </div>
                        <div style="color: ${savingsColor}; font-size: 0.7rem; margin-top: 4px;">
                            ${savings > 0 ? 'Ahorro' : 'Pérdida'}: $${Math.abs(savings).toFixed(0)}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            contractsHTML = '<div style="color: #94a3b8; font-size: 0.85rem; text-align: center; padding: 12px;">Sin contratos activos</div>';
        }

        const allowedMsg = allowedDurations.length === 0
            ? 'Disponible a partir de nivel 3'
            : `Duraciones: ${allowedDurations.join(', ')} días · Volumen ${volumeCaps.min.toLocaleString()}-${volumeCaps.max.toLocaleString()}L`;

        return `
            <div class="hero-card">
                <h3 style="margin:0 0 0.75rem 0; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">⛽ Combustible</h3>
        
                <!-- Panel de métricas de inventario -->
                <div style="background: linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(15,23,42,0.6) 100%); 
                            border: 1px solid rgba(59,130,246,0.3); border-radius: 10px; padding: 14px; margin-bottom: 14px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <div style="color:#60a5fa; font-weight:700; font-size:0.95rem;">📊 Estado de Inventario</div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            ${usingSpot 
                                ? '<span style="color:#ef4444; font-size:0.75rem; background:rgba(239,68,68,0.15); padding:4px 8px; border-radius:4px;">⛽ Usando Spot</span>'
                                : '<span style="color:#10b981; font-size:0.75rem; background:rgba(16,185,129,0.15); padding:4px 8px; border-radius:4px;">✅ Bajo Contrato</span>'
                            }
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:10px;">
                        <div>
                            <div style="color:#64748b; font-size:0.7rem; margin-bottom:2px;">Litros Disponibles</div>
                            <div style="color:#3b82f6; font-weight:700; font-size:1rem;">${totalLitersAvailable.toLocaleString()} L</div>
                        </div>
                        <div>
                            <div style="color:#64748b; font-size:0.7rem; margin-bottom:2px;">Consumo Diario</div>
                            <div style="color:#cbd5e1; font-weight:700; font-size:1rem;">${estimatedDailyConsumption.toLocaleString()} L</div>
                        </div>
                        <div>
                            <div style="color:#64748b; font-size:0.7rem; margin-bottom:2px;">Días de Cobertura</div>
                            <div style="color:${daysOfCoverage > 5 ? '#10b981' : daysOfCoverage > 2 ? '#f59e0b' : '#ef4444'}; font-weight:700; font-size:1rem;">
                                ${daysOfCoverage > 0 ? daysOfCoverage.toFixed(1) : '0'} días
                            </div>
                        </div>
                        <div>
                            <div style="color:#64748b; font-size:0.7rem; margin-bottom:2px;">${usingSpot ? 'Precio Spot' : 'Precio Promedio'}</div>
                            <div style="color:#cbd5e1; font-weight:700; font-size:1rem;">
                                $${(usingSpot ? marketPrice : avgContractPrice).toFixed(3)}/L
                            </div>
                        </div>
                    </div>

                    ${depletionDate ? `
                        <div style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.08);">
                            <div style="color:#64748b; font-size:0.75rem;">
                                Agotamiento estimado: 
                                <span style="color:${daysOfCoverage > 5 ? '#cbd5e1' : '#ef4444'}; font-weight:600;">
                                    ${depletionDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                ${daysOfCoverage < 3 ? ' <span style="color:#ef4444;">⚠️ Crítico</span>' : ''}
                            </div>
                        </div>
                    ` : `
                        <div style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.08);">
                            <div style="color:#f59e0b; font-size:0.75rem; display:flex; align-items:center; gap:4px;">
                                <span>⚠️</span>
                                <span>Sin contratos activos. Operando a precio spot del mercado.</span>
                            </div>
                        </div>
                    `}
                </div>
                
                ${inCrisis ? `
                <div style="background: rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); border-radius:8px; padding:12px; margin-bottom:12px;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                        <span style="font-size:1.2rem;">🚨</span>
                        <div style="color:#ef4444; font-weight:700; font-size:0.95rem;">CRISIS DE COMBUSTIBLE</div>
                    </div>
                    <div style="color:#fca5a5; font-size:0.85rem;">Precio alto durante ${crisisDays} días. Rutas con margen bajo en riesgo.</div>
                </div>
                ` : ''}

                ${alerts.length > 0 ? `
                <div style="margin-bottom:12px;">
                    ${alerts.map(alert => {
                        const bgColors = { danger: 'rgba(239,68,68,0.12)', warning: 'rgba(245,158,11,0.12)', success: 'rgba(16,185,129,0.12)', info: 'rgba(59,130,246,0.12)' };
                        const borderColors = { danger: 'rgba(239,68,68,0.3)', warning: 'rgba(245,158,11,0.3)', success: 'rgba(16,185,129,0.3)', info: 'rgba(59,130,246,0.3)' };
                        const textColors = { danger: '#ef4444', warning: '#f59e0b', success: '#10b981', info: '#3b82f6' };
                        return `
                            <div style="background:${bgColors[alert.type]}; border:1px solid ${borderColors[alert.type]}; border-radius:8px; padding:10px; margin-bottom:8px;">
                                <div style="color:${textColors[alert.type]}; font-weight:700; font-size:0.85rem; margin-bottom:2px;">${alert.title}</div>
                                <div style="color:#cbd5e1; font-size:0.75rem;">${alert.msg}</div>
                                ${alert.action ? `<div style="color:#94a3b8; font-size:0.7rem; margin-top:4px; font-style:italic;">→ ${alert.action}</div>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
                ` : ''}
                <div style="display:flex; gap:12px; align-items:center; margin-bottom:10px;">
                    <div style="background: rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.35); padding:10px 12px; border-radius:8px; flex:1; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <div style="color:#94a3b8; font-size:0.75rem;">Estado</div>
                            <div style="color:#cbd5e1; font-weight:700;">${marketState}</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="color:#3b82f6; font-weight:700; font-size:1.1rem;">$${marketPrice.toFixed(3)}/L</div>
                            <div style="color:${trendColor}; font-size:0.8rem;">${trendIcon} ${(trendPct).toFixed(1)}%</div>
                        </div>
                    </div>
                    <div style="flex:1; background: rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.35); padding:10px 12px; border-radius:8px;">
                        <div style="color:#94a3b8; font-size:0.75rem;">Combustible/día (estimado)</div>
                        <div style="color:#10b981; font-weight:700; font-size:1.05rem;">$${Math.round(fuelPerDay).toLocaleString()}</div>
                        <div style="color:#64748b; font-size:0.7rem;">Basado en rutas activas</div>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <div style="color:#94a3b8; font-size:0.75rem;">Historial de Precio</div>
                        <div style="display:flex; gap:6px;">
                            <button class="fuel-history-btn" data-days="7" style="padding:4px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:${historyDays===7?'rgba(59,130,246,0.3)':'rgba(255,255,255,0.05)'}; color:#cbd5e1; font-size:0.75rem; cursor:pointer;">7d</button>
                            <button class="fuel-history-btn" data-days="14" style="padding:4px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:${historyDays===14?'rgba(59,130,246,0.3)':'rgba(255,255,255,0.05)'}; color:#cbd5e1; font-size:0.75rem; cursor:pointer;">14d</button>
                            <button class="fuel-history-btn" data-days="30" style="padding:4px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:${historyDays===30?'rgba(59,130,246,0.3)':'rgba(255,255,255,0.05)'}; color:#cbd5e1; font-size:0.75rem; cursor:pointer;">30d</button>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px; align-items:flex-end; height:48px;">${sparkHTML || '<div style="color:#94a3b8; font-size:0.8rem;">Sin historial</div>'}</div>
                </div>

                ${fuelState.lastShock ? `
                <div style="background: rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.3); border-radius:8px; padding:10px; margin-bottom:10px;">
                    <div style="color:#94a3b8; font-size:0.75rem; margin-bottom:4px;">⚡ Último Shock</div>
                    <div style="color:#f59e0b; font-weight:700; font-size:0.9rem;">${fuelState.lastShock.label}</div>
                    <div style="color:#cbd5e1; font-size:0.75rem; margin-top:2px;">${fuelState.lastShock.delta > 0 ? '+' : ''}${(fuelState.lastShock.delta * 100).toFixed(1)}% · ${new Date(fuelState.lastShock.date).toLocaleDateString('es-ES')}</div>
                </div>
                ` : ''}

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">
                    <div style="background: rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px;">
                        <div style="color:#94a3b8; font-size:0.75rem;">Contratos activos</div>
                        <div style="color:#10b981; font-weight:700; font-size:1.05rem;">${activeContracts.length}</div>
                        <div style="color:#64748b; font-size:0.7rem;">${activeContracts.reduce((s,c)=>s+(c.volume-c.used),0).toLocaleString()}L restantes</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px;">
                        <div style="color:#94a3b8; font-size:0.75rem;">Disponibilidad</div>
                        <div style="color:#cbd5e1; font-weight:700; font-size:0.95rem;">${allowedMsg}</div>
                    </div>
                </div>

                ${metrics.netSavings !== 0 ? `
                <div style="background: ${metrics.netSavings > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; border:1px solid ${metrics.netSavings > 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}; border-radius:8px; padding:10px; margin-bottom:10px;">
                    <div style="color:#94a3b8; font-size:0.75rem; margin-bottom:4px;">📊 Eficiencia de Contratos</div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:8px; font-size:0.75rem;">
                        <div>
                            <div style="color:#94a3b8;">Precio efectivo</div>
                            <div style="color:#3b82f6; font-weight:700;">$${metrics.effectivePrice.toFixed(3)}/L</div>
                        </div>
                        <div>
                            <div style="color:#94a3b8;">Cobertura</div>
                            <div style="color:#cbd5e1; font-weight:700;">${metrics.coverageDays.toFixed(1)} días</div>
                        </div>
                        <div>
                            <div style="color:#94a3b8;">${metrics.netSavings > 0 ? 'Ahorro neto' : 'Pérdida neta'}</div>
                            <div style="color:${metrics.netSavings > 0 ? '#10b981' : '#ef4444'}; font-weight:700;">$${Math.abs(metrics.netSavings).toFixed(0)}</div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <div style="margin-bottom:10px;">
                    ${contractsHTML}
                </div>

                ${this.renderFuelMarket(historyDays)}

                <div style="margin-top:12px;">
                    <h4 style="margin:0 0 8px 0; color:#cbd5e1; font-size:0.95rem;">🛢️ OFERTAS DE PROVEEDORES</h4>
                    ${this.renderFuelOffers(level)}
                </div>

                <button id="btn-purchase-fuel-contract" class="modal-btn btn-primary" style="width: 100%; margin-top: 4px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 10px; font-size: 0.9rem; display:none;">
                    📝 Comprar Contrato (Legacy)
                </button>
            </div>
        `;
    }

    renderFuelOffers(level) {
        const providers = this.game.managers.economy.fuelProviders;
        const offers = providers.game.state.fuelProviders?.offers || [];
        
        // Generar ofertas si no existen o están vacías
        if (offers.length === 0) {
            providers.generateOffers(level);
            return this.renderFuelOffers(level); // Re-render con ofertas nuevas
        }

        const spotPrice = this.game.state.fuel.spotPrice || 1.0;

        let html = '<div style="margin-top:16px;"><h4 style="margin:0 0 12px 0; color:#cbd5e1; font-size:0.95rem;">🛢️ OFERTAS DE PROVEEDORES</h4>';

        offers.forEach(offer => {
            const savingsVsSpot = ((spotPrice - offer.price) / spotPrice) * 100;
            const savingsColor = savingsVsSpot > 0 ? '#10b981' : '#ef4444';
            const savingsText = savingsVsSpot > 0 ? `${savingsVsSpot.toFixed(1)}% ahorro` : `${Math.abs(savingsVsSpot).toFixed(1)}% más caro`;
            
            const riskColor = offer.profileData.risk === 'Alto' ? '#ef4444' : offer.profileData.risk === 'Medio' ? '#f59e0b' : '#10b981';

            html += `
                <div style="background: linear-gradient(135deg, rgba(${this.hexToRgb(offer.providerColor)}, 0.08) 0%, rgba(15,23,42,0.6) 100%); 
                            border: 1px solid rgba(${this.hexToRgb(offer.providerColor)}, 0.3); 
                            border-radius: 10px; padding: 12px; margin-bottom: 10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <div>
                            <div style="color:${offer.providerColor}; font-weight:700; font-size:0.9rem;">${offer.providerName}</div>
                            <div style="color:#94a3b8; font-size:0.75rem;">Perfil: ${offer.profileData.icon} ${offer.profileData.name}</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="color:#3b82f6; font-weight:700; font-size:1.1rem;">$${offer.price.toFixed(3)}/L</div>
                            <div style="color:${savingsColor}; font-size:0.7rem;">${savingsText}</div>
                        </div>
                    </div>
                    
                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin:8px 0; padding:8px 0; border-top:1px solid rgba(255,255,255,0.08); border-bottom:1px solid rgba(255,255,255,0.08);">
                        <div>
                            <div style="color:#64748b; font-size:0.7rem;">Volumen</div>
                            <div style="color:#cbd5e1; font-weight:600; font-size:0.85rem;">${(offer.volume / 1000).toFixed(0)}k L</div>
                        </div>
                        <div>
                            <div style="color:#64748b; font-size:0.7rem;">Duración</div>
                            <div style="color:#cbd5e1; font-weight:600; font-size:0.85rem;">${offer.duration} días</div>
                        </div>
                        <div>
                            <div style="color:#64748b; font-size:0.7rem;">Riesgo</div>
                            <div style="color:${riskColor}; font-weight:600; font-size:0.85rem;">${offer.profileData.risk}</div>
                        </div>
                    </div>

                    <div style="color:#94a3b8; font-size:0.7rem; margin-bottom:8px; font-style:italic;">${offer.profileData.description}</div>
                    
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="color:#64748b; font-size:0.7rem;">
                            Penalización ruptura: <span style="color:#ef4444; font-weight:600;">${(offer.breakPenalty * 100).toFixed(0)}%</span>
                        </div>
                        <button class="btn-purchase-from-provider" data-offer-id="${offer.id}" 
                                style="background: linear-gradient(135deg, ${offer.providerColor} 0%, ${this.adjustColor(offer.providerColor, -20)} 100%); 
                                       color: white; border: none; padding: 8px 16px; border-radius: 6px; 
                                       cursor: pointer; font-weight: 600; font-size: 0.85rem;">
                            Comprar
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59,130,246';
    }

    adjustColor(hex, percent) {
        const num = parseInt(hex.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    renderFuelMarket(historyDays = 14) {
        const fuel = this.game.state.fuel || { spotPrice: 1.0, history: [] };
        const history = (fuel.history || []).slice(-historyDays);
        const prices = history.length ? history.map(h => h.spot) : [fuel.spotPrice || 1.0];
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const last = prices[prices.length - 1];
        const first = prices[0];
        const deltaPct = first ? (((last - first) / first) * 100) : 0;
        const deltaColor = deltaPct >= 0 ? '#ef4444' : '#10b981';

        const width = 320;
        const height = 60;
        const n = prices.length;
        const xStep = n > 1 ? (width / (n - 1)) : width;
        const scaleY = (v) => {
            if (max === min) return height / 2;
            const t = (v - min) / (max - min);
            return height - (t * height);
        };
        let d = '';
        prices.forEach((p, i) => {
            const x = Math.round(i * xStep);
            const y = Math.round(scaleY(p));
            d += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
        });

        return `
            <div class="hero-card" style="margin-top:12px;">
                <h4 style="margin:0 0 8px 0; color:#cbd5e1; font-size:0.95rem;">📈 Mercado de Combustible (Spot)</h4>
                <div style="display:grid; grid-template-columns: 1.2fr 0.8fr; gap:12px; align-items:center;">
                    <div style="background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:8px;">
                        <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" preserveAspectRatio="none">
                            <path d="${d}" fill="none" stroke="#3b82f6" stroke-width="2" />
                            <circle cx="${(n-1)*xStep}" cy="${Math.round(scaleY(last))}" r="3" fill="#3b82f6" />
                        </svg>
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:#94a3b8; margin-top:6px;">
                            <span>Mín ${min.toFixed(3)}</span>
                            <span>Máx ${max.toFixed(3)}</span>
                        </div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <div>
                                <div style="color:#94a3b8; font-size:0.75rem;">Precio Spot Actual</div>
                                <div style="color:#cbd5e1; font-weight:700; font-size:1.15rem;">$${(fuel.spotPrice || 1).toFixed(3)}/L</div>
                            </div>
                            <div style="text-align:right;">
                                <div style="color:#94a3b8; font-size:0.75rem;">Variación ${historyDays}d</div>
                                <div style="color:${deltaColor}; font-weight:700;">${deltaPct>=0?'+':''}${deltaPct.toFixed(1)}%</div>
                            </div>
                        </div>
                        <button id="btn-purchase-spot" 
                            style="width:100%; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; border: none; padding: 10px 12px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                            Comprar en Mercado (Spot)
                        </button>
                        <div style="color:#64748b; font-size:0.7rem; margin-top:6px;">Usa el precio spot actual y histórico para decidir compras tácticas.</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderEconomyHistory(days = 7) {
        const history = this.game.state.economyHistory || [];
        const data = history.slice(-days);

        if (data.length === 0) {
            return '<div style="color:#94a3b8; font-size:0.9rem;">Sin datos suficientes</div>';
        }

        const formatter = this.formatters.currency;

        // Mini sparkline chart (simple ASCII/bars)
        const maxRevenue = Math.max(...data.map(d => d.revenue));
        const maxCosts = Math.max(...data.map(d => d.costs));
        const maxMargin = Math.max(...data.map(d => d.net), 1);

        const sparklineHTML = data.map(d => {
            const revPct = (d.revenue / maxRevenue) * 100;
            const costPct = (d.costs / maxCosts) * 100;
            const marginPct = ((d.net / maxMargin) * 100);
            const marginColor = d.net >= 0 ? '#22c55e' : '#ef4444';

            return `
                <div style="display:flex; align-items:flex-end; gap:0.25rem; height:40px; margin-bottom:0.5rem;">
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:0.25rem;">
                        <div style="width:100%; background:#4ade80; border-radius:4px; height:${Math.max(5, revPct * 0.3)}px;"></div>
                        <div style="font-size:0.65rem; color:#94a3b8; text-align:center; overflow:hidden; text-overflow:ellipsis; max-width:100%;">
                            ${formatter.format(d.revenue).replace(/\$|,/g, '').slice(0, 5)}k
                        </div>
                    </div>
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:0.25rem;">
                        <div style="width:100%; background:#f87171; border-radius:4px; height:${Math.max(5, costPct * 0.3)}px;"></div>
                        <div style="font-size:0.65rem; color:#94a3b8; text-align:center; overflow:hidden; text-overflow:ellipsis; max-width:100%;">
                            ${formatter.format(d.costs).replace(/\$|,/g, '').slice(0, 5)}k
                        </div>
                    </div>
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:0.25rem;">
                        <div style="width:100%; background:${marginColor}; border-radius:4px; height:${Math.max(5, Math.abs(marginPct) * 0.3)}px;"></div>
                        <div style="font-size:0.65rem; color:#94a3b8; text-align:center; overflow:hidden; text-overflow:ellipsis; max-width:100%;">
                            ${d.marginPct.toFixed(0)}%
                        </div>
                    </div>
                </div>`;
        }).join('');

        // Table view
        const tableHTML = `
            <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                <thead>
                    <tr style="border-bottom:1px solid rgba(148,163,184,0.3);">
                        <th style="text-align:left; padding:0.5rem; color:#94a3b8;">Día</th>
                        <th style="text-align:right; padding:0.5rem; color:#94a3b8;">Ingresos</th>
                        <th style="text-align:right; padding:0.5rem; color:#94a3b8;">Costos</th>
                        <th style="text-align:right; padding:0.5rem; color:#94a3b8;">Margen</th>
                        <th style="text-align:right; padding:0.5rem; color:#94a3b8;">Ocupación</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(d => {
                        const dateObj = new Date(d.date);
                        const dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
                        const marginColor = d.net >= 0 ? '#22c55e' : '#ef4444';
                        return `
                            <tr style="border-bottom:1px solid rgba(148,163,184,0.15);">
                                <td style="padding:0.5rem; color:#cbd5e1;">${dateStr}</td>
                                <td style="text-align:right; padding:0.5rem; color:#4ade80;">${formatter.format(d.revenue)}</td>
                                <td style="text-align:right; padding:0.5rem; color:#f87171;">${formatter.format(d.costs)}</td>
                                <td style="text-align:right; padding:0.5rem; color:${marginColor}; font-weight:700;">${formatter.format(d.net)} (${d.marginPct.toFixed(1)}%)</td>
                                <td style="text-align:right; padding:0.5rem; color:#cbd5e1;">${(d.avgLoad * 100).toFixed(0)}%</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        return `
            <div style="display:flex; gap:1rem; margin-bottom:1rem;">
                <div style="flex:1; min-height:80px; display:flex; flex-direction:column;">
                    <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:0.5rem; text-transform:uppercase;">Barras: Ingresos | Costos | Margen</div>
                    ${sparklineHTML}
                </div>
            </div>
            ${tableHTML}
        `;
    }

    getAlerts() {
        const alerts = [];
        const now = this.game.state.date || Date.now();
        const fleet = this.game.managers.fleet.getFlatData();

        // Condición baja
        fleet.forEach(plane => {
            if (plane.condition < 40 && plane.status !== 'MAINT') {
                alerts.push({
                    type: 'danger',
                    title: 'Mantenimiento requerido',
                    message: `${plane.registration} está en ${Math.round(plane.condition)}%`,
                    action: 'Abre la ficha y lanza Check B'
                });
            } else if (plane.condition < 55 && plane.status === 'FLIGHT') {
                alerts.push({
                    type: 'warning',
                    title: 'Condición baja en vuelo',
                    message: `${plane.registration} en ${Math.round(plane.condition)}%`,
                    action: 'Programa mantenimiento pronto'
                });
            }
        });

        // Reputación baja
        const rep = this.game.state.reputation || 50;
        if (rep < 40) {
            alerts.push({
                type: 'warning',
                title: 'Reputación baja',
                message: `Reputación ${Math.round(rep)}/100`,
                action: 'Sube premium y cuida la condición'
            });
        }

        // Hubs llenos
        const hubs = this.game.state.hubs || {};
        Object.values(hubs).forEach(h => {
            if (h.slots && h.slots.used >= h.slots.total) {
                alerts.push({
                    type: 'info',
                    title: 'Slots completos',
                    message: `${h.id} ${h.slots.used}/${h.slots.total} slots`,
                    action: 'Amplía hub o libera rutas'
                });
            }
        });

        return alerts;
    }

    renderAlerts() {
        const container = document.getElementById('alerts-list');
        if (!container) return;

        const alerts = this.getAlerts();
        container.innerHTML = '';

        if (!alerts.length) {
            container.innerHTML = '<div style="color: #94a3b8; font-size: 0.9rem;">Sin alertas</div>';
            return;
        }

        const colors = {
            danger: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', text: '#f87171', icon: '⚠️' },
            warning: { bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.35)', text: '#facc15', icon: '🟡' },
            info: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', text: '#60a5fa', icon: 'ℹ️' }
        };

        alerts.slice(0, 5).forEach(alert => {
            const c = colors[alert.type] || colors.info;
            const row = document.createElement('div');
            row.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.85rem;
                background: ${c.bg};
                border: 1px solid ${c.border};
                border-radius: 10px;
                color: #e2e8f0;
            `;
            row.innerHTML = `
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span style="font-size: 1.2rem;">${c.icon}</span>
                    <div>
                        <div style="font-weight: 700;">${alert.title}</div>
                        <div style="font-size: 0.85rem; color: #cbd5e1;">${alert.message}</div>
                    </div>
                </div>
                <div style="font-size: 0.8rem; color: #94a3b8;">${alert.action || ''}</div>
            `;
            container.appendChild(row);
        });
    }

    renderHubs() {
        const container = document.getElementById('hubs-list');
        if (!container) return;

        const hubs = this.game.state.hubs || {};
        const hubsList = Object.values(hubs);

        container.innerHTML = '';

        if (!hubsList.length) {
            container.innerHTML = '<div style="color: #94a3b8; font-size: 0.9rem;">Hub principal solamente</div>';
            return;
        }

        // Stats summary
        const totalSlots = hubsList.reduce((sum, h) => sum + (h.slots?.total || 0), 0);
        const usedSlots = hubsList.reduce((sum, h) => sum + (h.slots?.used || 0), 0);
        const totalFees = hubsList.reduce((sum, h) => sum + Math.round(h.dailyFee * (h.slots?.used || 0)), 0);

        const summaryEl = document.createElement('div');
        summaryEl.style.cssText = `
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
            margin-bottom: 0.75rem;
            padding: 0.75rem;
            background: rgba(59,130,246,0.08);
            border: 1px solid rgba(59,130,246,0.2);
            border-radius: 10px;
        `;
        summaryEl.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 0.7rem; color: #94a3b8;">Total Hubs</div>
                <div style="font-weight: 700; color: #60a5fa;">${hubsList.length}</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 0.7rem; color: #94a3b8;">Slots</div>
                <div style="font-weight: 700; color: #60a5fa;">${usedSlots}/${totalSlots}</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 0.7rem; color: #94a3b8;">Costo/día</div>
                <div style="font-weight: 700; color: #60a5fa;">$${totalFees.toLocaleString()}</div>
            </div>
        `;
        container.appendChild(summaryEl);

        hubsList.forEach(hub => {
            const row = document.createElement('div');
            const slotsUsed = hub.slots?.used || 0;
            const slotsTotal = hub.slots?.total || 2;
            const slotsAvailable = slotsTotal - slotsUsed;
            const feePerDay = Math.round(hub.dailyFee * slotsUsed);
            const dailyFeeBase = Math.round(hub.dailyFee);

            row.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.85rem;
                background: rgba(16,185,129,0.08);
                border: 1px solid rgba(16,185,129,0.25);
                border-radius: 10px;
                color: #e2e8f0;
                margin-bottom: 0.5rem;
            `;

            row.innerHTML = `
                <div>
                    <div style="font-weight: 700;">${hub.name}</div>
                    <div style="font-size: 0.8rem; color: #94a3b8;">${hub.city} • Nivel ${hub.level}</div>
                    <div style="font-size: 0.75rem; color: #cbd5e1; margin-top: 0.3rem;">
                        Slots: ${slotsUsed}/${slotsTotal} (${slotsAvailable} libres) • Tarifa: $${dailyFeeBase}/día
                    </div>
                </div>
                <button onclick="window.app.ui.showHubUpgradesModal('${hub.id}')" 
                    style="padding: 0.5rem 1rem; background: #10b981; border: none; border-radius: 8px; color: #fff; cursor: pointer; font-weight: 600; font-size: 0.85rem;">
                    ⚙️ Upgrades
                </button>
            `;
            container.appendChild(row);
        });
    }

    renderLevelProgress() {
        const panel = this.getElement('level-panel');
        if (!panel) return;

        // Get requirements from imported LEVEL_REQUIREMENTS
        try {
            const current = this.game.state.level || 1;
            const nextLevel = current + 1;
            let reqs = LEVEL_REQUIREMENTS[nextLevel] || null;
        } catch {}

        // Fallback: calcular requisitos localmente
        const level = this.game.state.level || 1;
        const nextLevel = level + 1;
        const reqs = this.getNextLevelRequirements();

        const fleet = this.game.managers.fleet.ownedPlanes.length;
        const routes = this.game.managers.routes.getRoutes().length;
        const reputation = Math.round(this.game.state.reputation || 0);
        const profit = this.game.state.cumulativeProfit || 0;

        const fmt = this.formatters.currency;
        const ok = (curr, target) => curr >= target;

        // Get unlocks for next level
        const unlocks = reqs.unlocksAircraft || [];
        const unlocksHub = reqs.unlocksHub || false;
        let unlocksHtml = '';
        if (unlocks.length > 0 || unlocksHub) {
            const items = [];
            if (unlocks.length > 0) items.push(`✈️ ${unlocks.join(', ')}`);
            if (unlocksHub) items.push('🏢 Hubs secundarios');
            unlocksHtml = `
                <div style="grid-column: 1 / -1; background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.2); border-radius: 10px; padding: 10px;">
                    <div style="color: #a78bfa; font-size: 0.75rem; margin-bottom: 4px;">🎁 Desbloqueos</div>
                    <div style="font-size: 0.8rem; color: #e2e8f0;">${items.join(' • ')}</div>
                </div>
            `;
        }

        panel.innerHTML = `
            <div style="background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.25); border-radius: 10px; padding: 12px;">
                <div style="font-size: 0.8rem; color: #93c5fd;">Siguiente Nivel</div>
                <div style="font-weight: 700; color: #3b82f6; font-size: 1.1rem;">${nextLevel}</div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                <div style="background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.25); border-radius: 10px; padding: 10px;">
                    <div style="color: #f59e0b; font-size: 0.75rem;">Reputación</div>
                    <div style="font-weight: 700; color: ${ok(reputation, reqs.reputation) ? '#22c55e' : '#f59e0b'};">${reputation} / ${reqs.reputation}</div>
                </div>
                <div style="background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.25); border-radius: 10px; padding: 10px;">
                    <div style="color: #10b981; font-size: 0.75rem;">Flota</div>
                    <div style="font-weight: 700; color: ${ok(fleet, reqs.fleetSize) ? '#22c55e' : '#10b981'};">${fleet} / ${reqs.fleetSize}</div>
                </div>
                <div style="background: rgba(168,85,247,0.12); border: 1px solid rgba(168,85,247,0.25); border-radius: 10px; padding: 10px;">
                    <div style="color: #a78bfa; font-size: 0.75rem;">Rutas</div>
                    <div style="font-weight: 700; color: ${ok(routes, reqs.activeRoutes) ? '#22c55e' : '#a78bfa'};">${routes} / ${reqs.activeRoutes}</div>
                </div>
                <div style="background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.2); border-radius: 10px; padding: 10px;">
                    <div style="color: #4ade80; font-size: 0.75rem;">Beneficio Acumulado</div>
                    <div style="font-weight: 700; color: ${ok(profit, reqs.cumulativeProfit) ? '#22c55e' : '#4ade80'};">${fmt.format(profit)} / ${fmt.format(reqs.cumulativeProfit)}</div>
                </div>
                ${unlocksHtml}
            </div>
        `;
    }

    renderUnlockProgress() {
        const container = document.getElementById('unlocks-section');
        if (!container) return;

        const currentLevel = this.game.state.level || 1;
        const nextLevel = currentLevel + 1;
        if (nextLevel > 10) return; // Max level

        const currentUnlocked = this.getUnlockedAircraft(currentLevel);
        const nextUnlocked = this.getUnlockedAircraft(nextLevel);
        
        // Aviones que se desbloquearán en el próximo nivel
        const newAircraftAtNextLevel = nextUnlocked.filter(id => !currentUnlocked.includes(id));

        if (newAircraftAtNextLevel.length === 0) return;

        container.innerHTML = '';

        const header = document.createElement('div');
        header.style.cssText = `
            font-weight: 700;
            color: #cbd5e1;
            margin-bottom: 0.75rem;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;
        header.textContent = `✈️ Se desbloquean en Nivel ${nextLevel}`;
        container.appendChild(header);

        const grid = document.createElement('div');
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 0.75rem;
        `;

        newAircraftAtNextLevel.forEach(aircraftId => {
            const plane = AIRCRAFT_TYPES[aircraftId];
            if (!plane) return;

            const card = document.createElement('div');
            card.style.cssText = `
                background: rgba(168,85,247,0.08);
                border: 1px solid rgba(168,85,247,0.25);
                border-radius: 8px;
                padding: 0.75rem;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s;
            `;
            card.innerHTML = `
                <div style="font-size: 2rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-lock"></i></div>
                <div style="font-size: 0.8rem; font-weight: 600; color: #a78bfa; margin-bottom: 0.3rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${plane.name}</div>
                <div style="font-size: 0.7rem; color: #94a3b8;">${plane.seats} pax</div>
            `;
            card.addEventListener('mouseenter', () => {
                card.style.background = 'rgba(168,85,247,0.15)';
                card.style.borderColor = 'rgba(168,85,247,0.4)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.background = 'rgba(168,85,247,0.08)';
                card.style.borderColor = 'rgba(168,85,247,0.25)';
            });
            grid.appendChild(card);
        });

        container.appendChild(grid);
    }

    renderCompetitionStatus() {
        const container = document.getElementById('competition-section');
        if (!container) return;

        const status = this.game.managers.competitors.getCompetitionStatus();
        const playerShare = Math.round(status.playerShare * 100);

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <div style="font-weight: 700; color: #cbd5e1; margin-bottom: 0.5rem;"><i class="fa-solid fa-trophy"></i> Cuota de Mercado</div>
                
                <div style="background: rgba(59,130,246,0.1); border-radius: 8px; padding: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <div style="font-size: 0.85rem; font-weight: 600; color: #60a5fa;">Tu Aerolínea</div>
                        <div style="font-size: 1.1rem; font-weight: 700; color: #60a5fa;">${playerShare}%</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.2); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #3b82f6, #60a5fa); height: 100%; width: ${playerShare}%; transition: width 0.3s;"></div>
                    </div>
                </div>

                <div style="font-weight: 700; color: #cbd5e1; margin-top: 0.75rem; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;">Top Competidores</div>
                ${status.competitors.map((comp, idx) => `
                    <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.75rem; display: flex; align-items: center; gap: 0.75rem;">
                        <div style="width: 4px; height: 30px; background: ${comp.color}; border-radius: 2px;"></div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 0.9rem; color: #e2e8f0;">${idx + 1}. ${comp.name}</div>
                            <div style="font-size: 0.75rem; color: #94a3b8;">Hub: ${comp.hubName} • Rutas: ${comp.routes.length}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 700; color: #cbd5e1; font-size: 0.9rem;">${Math.round(comp.marketShare * 100)}%</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderRanking() {
        const rankingList = document.getElementById('ranking-list');
        if (!rankingList) return;

        try {
            if (!this.game.state.mainHub) {
                rankingList.innerHTML = '';
                return;
            }

            const competitionStatus = this.game.managers.competitors.getCompetitionStatus();
            if (!competitionStatus) {
                rankingList.innerHTML = '';
                return;
            }

            const topCompetitors = competitionStatus.competitors || [];
            rankingList.innerHTML = '';

            const playerShare = competitionStatus.playerShare || 0;
            const totalCompetitors = competitionStatus.totalCompetitors || 0;
            const playerRoutes = this.game.managers.routes.getRoutes();
            const playerFleet = this.game.managers.fleet?.ownedPlanes || [];
            const rep = Math.round(this.game.state.reputation || 50);
            const money = this.game.state.money || 0;

            // Calcular métricas del jugador
            const playerDailyIncome = this.calculateDailyIncome(playerRoutes);
            const playerOperatingMargin = this.calculateOperatingMargin(playerRoutes);
            const playerHubs = this.getUniqueHubs(playerRoutes);
            const playerAvgFleetAge = this.calculateAvgFleetAge(playerFleet);
            const playerContinents = this.getUniqueContinents(playerRoutes);

            // KPIs Principales (fila 1)
            const kpiGrid = document.createElement('div');
            kpiGrid.style.cssText = `
                display:grid;
                grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                gap: 0.75rem;
                margin-bottom: 0.75rem;
            `;
            const mainKpis = [
                { label: 'Cuota de mercado', value: `${(playerShare*100).toFixed(2)}%`, color: '#10b981' },
                { label: 'Reputación', value: `${rep}/100`, color: rep >= 60 ? '#10b981' : (rep >= 40 ? '#f59e0b' : '#ef4444') },
                { label: 'Rutas activas', value: `${playerRoutes.length}`, color: '#60a5fa' },
                { label: 'Flota', value: `${playerFleet.length}`, color: '#a78bfa' },
                { label: 'Cash', value: `$${(money/1000000).toFixed(1)}M`, color: '#eab308' }
            ];
            mainKpis.forEach(k => {
                const card = document.createElement('div');
                card.style.cssText = `
                    padding: 0.75rem;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 10px;
                `;
                card.innerHTML = `
                    <div style="color:#94a3b8; font-size:0.75rem; text-transform:uppercase;">${k.label}</div>
                    <div style="font-weight:700; color:${k.color}; font-size:1.1rem; margin-top:0.25rem;">${k.value}</div>
                `;
                kpiGrid.appendChild(card);
            });
            rankingList.appendChild(kpiGrid);

            // KPIs Operativos (fila 2)
            const operationalGrid = document.createElement('div');
            operationalGrid.style.cssText = `
                display:grid;
                grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                gap: 0.75rem;
                margin-bottom: 1rem;
            `;
            const opKpis = [
                { label: 'Ingresos diarios', value: `$${(playerDailyIncome/1000).toFixed(0)}k`, color: '#10b981', icon: '<i class="fa-solid fa-money-bill-wave"></i>' },
                { label: 'Margen operativo', value: `${playerOperatingMargin.toFixed(1)}%`, color: playerOperatingMargin >= 30 ? '#10b981' : '#f59e0b', icon: '<i class="fa-solid fa-chart-line"></i>' },
                { label: 'Hubs activos', value: `${playerHubs}`, color: '#60a5fa', icon: '<i class="fa-solid fa-building"></i>' },
                { label: 'Edad media flota', value: `${playerAvgFleetAge.toFixed(0)} días`, color: playerAvgFleetAge < 100 ? '#10b981' : '#f59e0b', icon: '<i class="fa-solid fa-plane"></i>' },
                { label: 'Conectividad', value: `${playerContinents} cont.`, color: '#a78bfa', icon: '<i class="fa-solid fa-earth-americas"></i>' }
            ];
            opKpis.forEach(k => {
                const card = document.createElement('div');
                card.style.cssText = `
                    padding: 0.75rem;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 10px;
                `;
                card.innerHTML = `
                    <div style="color:#94a3b8; font-size:0.7rem;">${k.icon} ${k.label}</div>
                    <div style="font-weight:600; color:${k.color}; font-size:1rem; margin-top:0.25rem;">${k.value}</div>
                `;
                operationalGrid.appendChild(card);
            });
            rankingList.appendChild(operationalGrid);

            // Análisis Comparativo: Promedio Top 5 vs Jugador
            if (topCompetitors.length > 0) {
                const avgCompetitorRoutes = topCompetitors.reduce((s,c) => s + c.routes.length, 0) / topCompetitors.length;
                const avgCompetitorFleet = topCompetitors.reduce((s,c) => s + (c.fleetSize||100), 0) / topCompetitors.length;
                const avgCompetitorIncome = topCompetitors.reduce((s,c) => s + (c.dailyIncome||250000), 0) / topCompetitors.length;
                const avgCompetitorRep = topCompetitors.reduce((s,c) => s + (c.reputation||70), 0) / topCompetitors.length;

                const comparisonSection = document.createElement('div');
                comparisonSection.style.cssText = `
                    background: rgba(59,130,246,0.08);
                    border: 1px solid rgba(59,130,246,0.2);
                    border-radius: 10px;
                    padding: 1rem;
                    margin-bottom: 1rem;
                `;
                comparisonSection.innerHTML = `
                    <div style="color:#60a5fa; font-size:0.8rem; font-weight:600; margin-bottom:0.75rem; text-transform:uppercase;"><i class="fa-solid fa-chart-bar"></i> Análisis Comparativo</div>
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:0.5rem; font-size:0.85rem;">
                        <div>
                            <div style="color:#94a3b8; font-size:0.7rem;">Rutas (Promedio Top 5)</div>
                            <div style="color:white; font-weight:600;">${avgCompetitorRoutes.toFixed(1)} vs ${playerRoutes.length} <span style="color:${playerRoutes.length >= avgCompetitorRoutes ? '#10b981' : '#ef4444'};">${playerRoutes.length >= avgCompetitorRoutes ? '▲' : '▼'}</span></div>
                        </div>
                        <div>
                            <div style="color:#94a3b8; font-size:0.7rem;">Flota (Promedio Top 5)</div>
                            <div style="color:white; font-weight:600;">${avgCompetitorFleet.toFixed(0)} vs ${playerFleet.length} <span style="color:${playerFleet.length >= avgCompetitorFleet ? '#10b981' : '#ef4444'};">${playerFleet.length >= avgCompetitorFleet ? '▲' : '▼'}</span></div>
                        </div>
                        <div>
                            <div style="color:#94a3b8; font-size:0.7rem;">Ingresos/día (Prom. Top 5)</div>
                            <div style="color:white; font-weight:600;">$${(avgCompetitorIncome/1000).toFixed(0)}k vs $${(playerDailyIncome/1000).toFixed(0)}k <span style="color:${playerDailyIncome >= avgCompetitorIncome ? '#10b981' : '#ef4444'};">${playerDailyIncome >= avgCompetitorIncome ? '▲' : '▼'}</span></div>
                        </div>
                        <div>
                            <div style="color:#94a3b8; font-size:0.7rem;">Reputación (Prom. Top 5)</div>
                            <div style="color:white; font-weight:600;">${avgCompetitorRep.toFixed(0)} vs ${rep} <span style="color:${rep >= avgCompetitorRep ? '#10b981' : '#ef4444'};">${rep >= avgCompetitorRep ? '▲' : '▼'}</span></div>
                        </div>
                    </div>
                `;
                rankingList.appendChild(comparisonSection);
            }

            // Total competitors info
            const info = document.createElement('div');
            info.style.cssText = 'color:#94a3b8; font-size:0.75rem; margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.05em;';
            info.textContent = `${totalCompetitors} competidores activos`;
            rankingList.appendChild(info);

            // Top competitors list con datos enriquecidos
            if (topCompetitors.length > 0) {
                const titleDiv = document.createElement('div');
                titleDiv.style.cssText = 'color: #94a3b8; font-size: 0.8rem; font-weight: 600; margin: 0.25rem 0 0.75rem 0; text-transform: uppercase; letter-spacing: 0.05em;';
                titleDiv.textContent = `🏢 Top ${Math.min(5, topCompetitors.length)} Competidores`;
                rankingList.appendChild(titleDiv);

                topCompetitors.slice(0, 5).forEach((competitor, idx) => {
                    // Encontrar la ruta más rentable del competidor (aproximado)
                    const topRoute = competitor.routes.length > 0 ? competitor.routes[0] : null;
                    const topRouteStr = topRoute ? `${topRoute.origin}-${topRoute.dest}` : 'N/A';
                    const dailyIncome = competitor.dailyIncome || 250000;
                    const fleetSize = competitor.fleetSize || 100;
                    const numHubs = competitor.hubs?.length || 1;
                    
                    const row = document.createElement('div');
                    row.style.cssText = `
                        padding: 0.85rem;
                        background: rgba(255,255,255,0.05);
                        border-left: 4px solid ${competitor.color || '#3b82f6'};
                        border-radius: 8px;
                        font-size: 0.9rem;
                        margin-bottom: 0.6rem;
                    `;
                    row.innerHTML = `
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.5rem;">
                            <div style="font-weight: bold; color: white;">
                                <span style="color: #94a3b8; margin-right: 0.5rem;">${idx + 1}.</span>
                                ${competitor.name}
                            </div>
                            <div style="font-size:0.85rem; color:${competitor.color || '#3b82f6'}; font-weight:600;">
                                ${(competitor.marketShare * 100).toFixed(2)}%
                            </div>
                        </div>
                        <div style="font-size: 0.75rem; color: #64748b; display:flex; flex-wrap:wrap; gap:0.75rem;">
                            <span>🏢 ${numHubs} hub${numHubs > 1 ? 's' : ''}</span>
                            <span>🗺️ ${competitor.routes.length} rutas</span>
                            <span>✈️ ${fleetSize} aviones</span>
                            <span>💰 $${(dailyIncome/1000).toFixed(0)}k/día</span>
                        </div>
                        <div style="font-size: 0.7rem; color: #475569; margin-top:0.35rem; font-style:italic;">
                            Ruta principal: ${topRouteStr}
                        </div>
                    `;
                    rankingList.appendChild(row);
                });
            }
        } catch (err) {
            console.error('❌ Error renderizando ranking:', err);
            rankingList.innerHTML = '';
        }
    }

    // Métodos auxiliares para calcular métricas
    calculateDailyIncome(routes) {
        if (!routes || routes.length === 0) return 0;
        // route.dailyRevenue ya contiene la suma de todos los assignments
        return routes.reduce((sum, route) => sum + (route.dailyRevenue || 0), 0);
    }

    calculateOperatingMargin(routes) {
        if (!routes || routes.length === 0) return 0;
        const totalRevenue = this.calculateDailyIncome(routes);
        if (totalRevenue === 0) return 0;
        // Estimar costos como 60% de ingresos (simplificado)
        const estimatedCosts = totalRevenue * 0.6;
        const profit = totalRevenue - estimatedCosts;
        return (profit / totalRevenue) * 100;
    }

    getUniqueHubs(routes) {
        if (!routes || routes.length === 0) return 0;
        const origins = new Set(routes.map(r => r.origin));
        return origins.size;
    }

    calculateAvgFleetAge(fleet) {
        if (!fleet || fleet.length === 0) return 0;
        const now = this.game.state.date || Date.now();
        const totalAge = fleet.reduce((sum, plane) => {
            const deliveredAt = plane.deliveredAt || now;
            const ageDays = Math.max(0, (now - deliveredAt) / 86400000);
            return sum + ageDays;
        }, 0);
        return totalAge / fleet.length;
    }

    getUniqueContinents(routes) {
        if (!routes || routes.length === 0) return 0;
        const regions = new Set();
        routes.forEach(route => {
            const originAirport = window.AIRPORTS?.[route.origin];
            const destAirport = window.AIRPORTS?.[route.dest];
            if (originAirport?.region) regions.add(originAirport.region);
            if (destAirport?.region) regions.add(destAirport.region);
        });
        return regions.size;
    }

    // --- HUBS VIEW ---
    buildHubsView() {
        const container = this.views.hubs;
        if (!container) return;

        const hubs = this.game.state.hubs || {};
        const hubsList = Object.values(hubs);
        const mainHub = this.game.state.mainHub;

        // Calculate stats
        const totalSlots = hubsList.reduce((sum, h) => sum + (h.slots?.total || 0), 0);
        const usedSlots = hubsList.reduce((sum, h) => sum + (h.slots?.used || 0), 0);
        const totalFees = hubsList.reduce((sum, h) => sum + Math.round(h.dailyFee * (h.slots?.used || 0)), 0);

        let html = `
            <h2><i class="fa-solid fa-location-dot"></i> Hubs</h2>
            
            <!-- Main Hub Info -->
            <div class="hero-card" style="background: linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(16,185,129,0.1) 100%); border: 2px solid rgba(59,130,246,0.3); margin-bottom: 1.5rem;">
                <h3 style="margin: 0 0 1rem 0; font-size: 1rem; color: #60a5fa; text-transform: uppercase; letter-spacing: 0.05em;">
                    ✈️ Hub Principal
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem;">
                    <div style="text-align: center; padding: 0.75rem; background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.2); border-radius: 10px;">
                        <div style="font-size: 0.7rem; color: #94a3b8; margin-bottom: 4px;">IATA</div>
                        <div style="font-weight: 700; color: #60a5fa; font-size: 1.3rem;">${mainHub}</div>
                    </div>
                    <div style="text-align: center; padding: 0.75rem; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.2); border-radius: 10px;">
                        <div style="font-size: 0.7rem; color: #94a3b8; margin-bottom: 4px;">Aerolínea</div>
                        <div style="font-weight: 700; color: #10b981; font-size: 1rem;">${this.game.state.companyName || 'Sin nombre'}</div>
                    </div>
                    <div style="text-align: center; padding: 0.75rem; background: rgba(168,85,247,0.12); border: 1px solid rgba(168,85,247,0.2); border-radius: 10px;">
                        <div style="font-size: 0.7rem; color: #94a3b8; margin-bottom: 4px;">Nivel</div>
                        <div style="font-weight: 700; color: #a78bfa; font-size: 1.3rem;">${this.game.state.level || 1}</div>
                    </div>
                </div>
            </div>
        `;

        if (hubsList.length === 0) {
            html += `
                <div class="hero-card">
                    <h3 class="section-title">
                        Hubs Secundarios
                    </h3>
                    <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"><i class="fa-solid fa-earth-americas"></i></div>
                        <p style="margin: 0 0 0.5rem 0;">No tienes hubs secundarios aún</p>
                        <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">
                            ${this.game.state.level >= 3 ? 'Abre tu primer hub secundario para expandir tu red' : 'Desbloquea hubs secundarios al alcanzar el Nivel 3'}
                        </p>
            `;
            
            if (this.game.state.level >= 3) {
                html += `
                        <button id="btn-open-hub" class="btn-primary" style="margin-top: 1.5rem; padding: 1rem 2rem; background: #10b981;">
                            <i class="fa-solid fa-building"></i> Abrir Hub Secundario
                        </button>
                `;
            }
            
            html += `
                    </div>
                </div>
            `;
        } else {
            // Stats summary
            html += `
                <div class="hero-card" style="margin-bottom: 1rem;">
                    <h3 class="section-title">
                        Resumen de Hubs Secundarios
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 0.75rem;">
                        <div class="hub-stat-box blue">
                            <div class="label">Total Hubs</div>
                            <div class="value">${hubsList.length}</div>
                        </div>
                        <div class="hub-stat-box green">
                            <div class="label">Slots Totales</div>
                            <div class="value">${totalSlots}</div>
                        </div>
                        <div class="hub-stat-box yellow">
                            <div class="label">Slots Usados</div>
                            <div class="value">${usedSlots}/${totalSlots}</div>
                        </div>
                        <div class="hub-stat-box red">
                            <div class="label">Costo/día</div>
                            <div class="value">$${totalFees.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <div class="hero-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 class="section-title" style="margin: 0;">
                            Mis Hubs Secundarios
                        </h3>
            `;

            if (this.game.state.level >= 3) {
                html += `
                        <button id="btn-open-hub" class="btn-primary" style="padding: 0.6rem 1.2rem; background: #10b981; font-size: 0.85rem;">
                            + Abrir Hub
                        </button>
                `;
            }

            html += `
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            `;

            // List each hub
            hubsList.forEach(hub => {
                const slotsUsed = hub.slots?.used || 0;
                const slotsTotal = hub.slots?.total || 2;
                const slotsAvailable = slotsTotal - slotsUsed;
                const dailyFeeBase = Math.round(hub.dailyFee);
                const totalDailyCost = Math.round(dailyFeeBase * slotsUsed);
                const utilizationPercent = Math.round((slotsUsed / slotsTotal) * 100);

                html += `
                    <div class="hub-item-card">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                            <div style="flex: 1;">
                                <div style="font-weight: 700; font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.25rem;">
                                    ${hub.name}
                                </div>
                                <div style="font-size: 0.85rem; color: var(--text-secondary);">
                                    ${hub.city} • Nivel ${hub.level}
                                </div>
                            </div>
                            <button onclick="window.app.ui.showHubUpgradesModal('${hub.id}')" 
                                style="padding: 0.6rem 1.2rem; background: #10b981; border: none; border-radius: 8px; color: #fff; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: all 0.2s;">
                                ⚙️ Upgrades
                            </button>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.5rem; margin-top: 0.75rem;">
                            <div class="hub-stat-box blue" style="padding: 0.6rem;">
                                <div class="label" style="font-size: 0.65rem; margin-bottom: 2px;">SLOTS</div>
                                <div class="value" style="font-size: 1rem;">${slotsUsed}/${slotsTotal}</div>
                                <div style="font-size: 0.65rem; color: #64748b; margin-top: 2px;">${slotsAvailable} libres</div>
                            </div>
                            <div class="hub-stat-box yellow" style="padding: 0.6rem;">
                                <div class="label" style="font-size: 0.65rem; margin-bottom: 2px;">UTILIZACIÓN</div>
                                <div class="value" style="font-size: 1rem;">${utilizationPercent}%</div>
                            </div>
                            <div class="hub-stat-box red" style="padding: 0.6rem;">
                                <div class="label" style="font-size: 0.65rem; margin-bottom: 2px;">TARIFA BASE</div>
                                <div class="value" style="font-size: 1rem;">$${dailyFeeBase}/día</div>
                            </div>
                            <div class="hub-stat-box red" style="padding: 0.6rem;">
                                <div class="label" style="font-size: 0.65rem; margin-bottom: 2px;">COSTO TOTAL</div>
                                <div class="value" style="font-size: 1rem;">$${totalDailyCost}/día</div>
                            </div>
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;

        // Attach event listener for "Abrir Hub" button
        const btnOpenHub = this.getElement('btn-open-hub');
        if (btnOpenHub) {
            btnOpenHub.addEventListener('click', () => this.showHubSelectionModal());
        }
    }


    // --- MARKET RENDERER ---
    renderMarket() {
        const container = this.views.market;
        container.innerHTML = `
            <h2>Concesionario</h2>
            <div class="market-tabs" style="display: flex; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 2px solid #2d3748;">
                <button class="market-tab-btn active" data-tab="aircraft" style="padding: 0.5rem 1rem; border: none; background: transparent; cursor: pointer; font-weight: 600; color: #e2e8f0; border-bottom: 3px solid transparent;"><i class="fa-solid fa-plane"></i> Aviones</button>
                <button class="market-tab-btn" data-tab="airports" style="padding: 0.5rem 1rem; border: none; background: transparent; cursor: pointer; font-weight: 600; color: #a0aec0; border-bottom: 3px solid transparent;"><i class="fa-solid fa-building"></i> Aeropuertos</button>
            </div>
            <div id="aircraft-tab" class="market-tab-content active"><div class="list-container"></div></div>
            <div id="airports-tab" class="market-tab-content hidden"><div class="airports-container"></div></div>
        `;
        
        // Add tab switching
        document.querySelectorAll('.market-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                document.querySelectorAll('.market-tab-btn').forEach(b => {
                    b.style.color = '#a0aec0';
                    b.style.borderBottomColor = 'transparent';
                });
                document.querySelectorAll('.market-tab-content').forEach(c => c.classList.add('hidden'));
                e.target.style.color = '#e2e8f0';
                e.target.style.borderBottomColor = '#3b82f6';
                document.getElementById(`${tabName}-tab`).classList.remove('hidden');
            });
        });

        const formatter = this.formatters.currency;
        const currentLevel = this.game.state.level || 1;

        // === AIRCRAFT TAB ===
        const list = container.querySelector('.list-container');
        const unlockedAircraft = this.getUnlockedAircraft(currentLevel);
        console.log(`🛫 Level ${currentLevel} has unlocked aircraft:`, unlockedAircraft);

        Object.values(AIRCRAFT_TYPES).forEach((plane, idx) => {
            const isLocked = !unlockedAircraft.includes(plane.id);
            const card = document.createElement('div');
            card.className = 'aircraft-card';
            
            if (isLocked) {
                card.style.opacity = '0.5';
                card.style.filter = 'grayscale(80%)';
            }

            card.innerHTML = `
                <div class="thumb" style="background-image: url('${plane.image}')${isLocked ? '; filter: grayscale(100%) brightness(0.6);' : ''}"></div>
                <div class="info">
                    <h3>${plane.name}</h3>
                    ${isLocked ? '<div style="color: #ef4444; font-size: 0.8rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-lock"></i> Bloqueado</div>' : ''}
                    <div class="specs">
                        <span><i class="fa-solid fa-ruler"></i> ${plane.range}km</span>
                        <span><i class="fa-solid fa-users"></i> ${plane.seats} pax</span>
                    </div>
                    <div style="margin-top: 0.75rem; font-size: 0.95rem; color: #4ade80; font-weight: 600;">
                        ${formatter.format(plane.price)}
                    </div>
                </div>
                <button class="btn-buy">${isLocked ? 'Bloqueado' : 'Ver'}</button>
            `;

            const btn = card.querySelector('.btn-buy');
            if (isLocked) {
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.addEventListener('click', () => {
                    const unlockLevel = this.getUnlockLevelForAircraft(plane.id);
                    this.showError(`<i class="fa-solid fa-lock"></i> Este avión se desbloquea en nivel ${unlockLevel}`);
                });
            } else {
                btn.addEventListener('click', () => {
                    this.showPlaneDetails(plane);
                });
            }

            card.style.animation = `staggerFadeIn 0.4s ease-out ${idx * 0.06}s both`;
            list.appendChild(card);
        });

        // === AIRPORTS TAB ===
        const airportContainer = container.querySelector('.airports-container');
        const sortedAirports = Object.entries(AIRPORTS)
            .sort((a, b) => a[1].minLevel - b[1].minLevel)
            .slice(0, 50); // Show first 50 to avoid clutter

        let airportHTML = '';
        sortedAirports.forEach(([id, ap]) => {
            const isUnlocked = Airport.isUnlockedAtLevel(ap, currentLevel);
            const categoryEmoji = {
                'mega-hub': '🌍',
                'major-hub': '🌎',
                'secondary-hub': '✈️',
                'regional-hub': '🏙️',
                'small-airport': '🛫'
            }[ap.category] || '🏢';

            airportHTML += `
                <div class="airport-market-card" style="padding: 1rem; border: 1px solid #4b5563; border-radius: 8px; margin-bottom: 0.75rem; ${!isUnlocked ? 'opacity: 0.6; filter: grayscale(50%);' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.3rem;">
                                ${categoryEmoji} ${ap.id} - ${ap.name}
                            </div>
                            <div style="color: #cbd5e0; font-size: 0.9rem; margin-bottom: 0.5rem;">
                                📍 ${ap.city}, ${ap.country} | 📊 ${(ap.pop).toFixed(1)}M pax
                            </div>
                            <div style="display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.85rem; color: #a0aec0;">
                                <span><i class="fa-solid fa-road"></i> ${ap.runway}m</span>
                                <span><i class="fa-solid fa-chart-bar"></i> ${ap.category.replace('-', ' ')}</span>
                                <span><i class="fa-solid fa-fire"></i> ${Airport.getDemandFactor(ap).toFixed(2)}x demand</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            ${isUnlocked ? 
                                `<div style="color: #4ade80; font-weight: 600;"><i class="fa-solid fa-check"></i> Disponible</div>` :
                                `<div style="color: #ef4444; font-weight: 600;"><i class="fa-solid fa-lock"></i> Nivel ${ap.minLevel}</div>`
                            }
                        </div>
                    </div>
                </div>
            `;
        });

        airportContainer.innerHTML = airportHTML || '<p style="color: #a0aec0;">Cargando aeropuertos...</p>';
    }

    getUnlockedAircraft(level) {
        // Use imported LEVEL_REQUIREMENTS - accumulate all unlocked aircraft up to current level
        const unlocked = [];
        
        // Ensure LEVEL_REQUIREMENTS is accessible
        if (!LEVEL_REQUIREMENTS || typeof LEVEL_REQUIREMENTS !== 'object') {
            console.warn('LEVEL_REQUIREMENTS not accessible, defaulting to Level 1 aircraft');
            return ['A320', 'A330']; // Fallback for Level 1
        }
        
        // Iterate from level 1 up to current level, accumulating unlocked aircraft
        for (let i = 1; i <= level; i++) {
            const req = LEVEL_REQUIREMENTS[i];
            if (req && Array.isArray(req.unlocksAircraft)) {
                req.unlocksAircraft.forEach(id => {
                    if (!unlocked.includes(id)) {
                        unlocked.push(id);
                    }
                });
            }
        }
        
        return unlocked;
    }

    getUnlockLevelForAircraft(aircraftId) {
        // Use imported LEVEL_REQUIREMENTS to find which level unlocks this aircraft
        if (!LEVEL_REQUIREMENTS || typeof LEVEL_REQUIREMENTS !== 'object') {
            return 1; // Fallback
        }
        
        for (let i = 1; i <= 10; i++) {
            const req = LEVEL_REQUIREMENTS[i];
            if (req && Array.isArray(req.unlocksAircraft) && req.unlocksAircraft.includes(aircraftId)) {
                return i;
            }
        }
        
        return 1; // Default to level 1 if not found
    }

    showPlaneDetails(plane) {
        const currentLevel = this.game.state.level || 1;
        const unlockedAircraft = this.getUnlockedAircraft(currentLevel);
        const isLocked = !unlockedAircraft.includes(plane.id);
        const unlockLevel = this.getUnlockLevelForAircraft(plane.id);

        // Si está bloqueado, mostrar modal de bloqueo
        if (isLocked) {
            const html = `
                <div style="padding: 40px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 20px;">
                    <div style="font-size: 4rem; margin: 20px 0;"><i class="fa-solid fa-lock"></i></div>
                    <h2 style="margin: 0; font-size: 1.5rem;">${plane.name}</h2>
                    <p style="color: #94a3b8; margin: 0; font-size: 1rem;">Este avión está bloqueado</p>
                    <div style="background: rgba(251, 191, 36, 0.1); border: 2px solid #fbbf24; border-radius: 12px; padding: 20px; margin: 20px 0; width: 100%; max-width: 400px;">
                        <div style="font-size: 0.9rem; color: #fbbf24; font-weight: bold; text-transform: uppercase; margin-bottom: 10px;"><i class="fa-solid fa-star"></i> Desbloquea en Nivel ${unlockLevel}</div>
                        <p style="margin: 0; color: #cbd5e1; font-size: 0.9rem;">
                            Sube de nivel completando rutas y ganando reputación para acceder a este avión.
                        </p>
                    </div>
                    <button class="btn-secondary" onclick="window.app.ui.hideModal()" style="padding: 12px 24px; background: #334155; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Cerrar</button>
                </div>
            `;
            this.showImmersiveModal(html);
            return;
        }

        const canAfford = this.game.managers.fleet.canAfford(plane.id);
        const maxCapacity = plane.seats;

        // Default Config
        let config = { eco: maxCapacity, prm: 0, biz: 0 };
        let totalPrice = plane.price; // Could add setup fees later


        // Inline CSS for reliability
        const heroStyle = `height: 200px; width: 100%; background-image: url('${plane.image}'); background-size: cover; background-position: center; position: relative; border-radius: 12px 12px 0 0;`;
        const heroGradient = `position: absolute; bottom: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, transparent 0%, #1e293b 100%);`;
        const pillStyle = `flex: 1; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; min-width: 80px; text-align: center;`;

        const html = `
            <div class="plane-hero" style="${heroStyle}">
                <div style="${heroGradient}"></div>
                <div class="hero-title" style="position: absolute; bottom: 15px; left: 20px; z-index: 2;">
                    <h2 style="margin: 0; font-size: 2rem; color: white;">${plane.name}</h2>
                    <span style="color: #3b82f6; font-weight: bold; text-transform: uppercase;">${plane.manufacturer} &bull; ${plane.category}</span>
                </div>
                <button class="close-btn" style="position:absolute; top:15px; right:15px; color:white; background:rgba(0,0,0,0.6); border:none; width:36px; height:36px; border-radius:50%; font-size:24px; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:10;" onclick="window.app.ui.hideModal()">&times;</button>
            </div>

            <div class="modal-body-scroll" style="padding: 20px;">
                
                <div class="stats-row" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 25px;">
                    <div style="${pillStyle}"><label style="display:block; font-size:0.75rem; color:#94a3b8;">Velocidad</label><span style="font-size:1.1rem; font-weight:bold;">${plane.speed} <small>km/h</small></span></div>
                    <div style="${pillStyle}"><label style="display:block; font-size:0.75rem; color:#94a3b8;">Rango</label><span style="font-size:1.1rem; font-weight:bold;">${plane.range} <small>km</small></span></div>
                    <div style="${pillStyle}"><label style="display:block; font-size:0.75rem; color:#94a3b8;">Pista</label><span style="font-size:1.1rem; font-weight:bold;">${plane.runway} <small>m</small></span></div>
                    <div style="${pillStyle}"><label style="display:block; font-size:0.75rem; color:#94a3b8;">Consumo</label><span style="font-size:1.1rem; font-weight:bold;">${plane.fuelBurn} <small>kg/km</small></span></div>
                </div>

                <div class="config-group">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <h3 style="margin:0;">Configuración de Cabina</h3>
                        <button id="btn-auto-config" class="btn-secondary" style="font-size:0.8rem; padding:4px 10px; border-radius:20px; background:rgba(255,255,255,0.1); color:white; border:none; cursor:pointer;">✨ Auto</button>
                    </div>
                    
                    <!-- Business -->
                    <div class="slider-container" style="margin-bottom: 20px;">
                        <div class="slider-header" style="display:flex; justify-content:space-between; margin-bottom:8px;">
                            <label style="color:#fbbf24; font-weight:bold;">Business (3x)</label>
                            <span class="count" id="val-biz" style="font-family:monospace; font-size:1.1rem;">0</span>
                        </div>
                        <input type="range" id="rng-biz" class="biz" min="0" max="${Math.floor(maxCapacity / 3)}" value="0" style="width:100%; accent-color:#fbbf24;">
                    </div>

                    <!-- Premium -->
                    <div class="slider-container" style="margin-bottom: 20px;">
                        <div class="slider-header" style="display:flex; justify-content:space-between; margin-bottom:8px;">
                            <label style="color:#a78bfa; font-weight:bold;">Premium (2x)</label>
                            <span class="count" id="val-prm" style="font-family:monospace; font-size:1.1rem;">0</span>
                        </div>
                        <input type="range" id="rng-prm" class="prm" min="0" max="${Math.floor(maxCapacity / 2)}" value="0" style="width:100%; accent-color:#a78bfa;">
                    </div>

                    <!-- Economy (Passive) -->
                    <div class="slider-container" style="margin-bottom: 20px; opacity:0.8;">
                        <div class="slider-header" style="display:flex; justify-content:space-between; margin-bottom:8px;">
                            <label style="color:#4ade80; font-weight:bold;">Turista (1x)</label>
                            <span class="count" id="val-eco" style="font-family:monospace; font-size:1.1rem;">${maxCapacity}</span>
                        </div>
                         <!-- Disabled slider, just for show -->
                        <div style="height:4px; background:#334155; border-radius:2px; position:relative; overflow:hidden;">
                             <div id="bar-eco-vis" style="width:100%; height:100%; background:#4ade80;"></div>
                        </div>
                        <div style="font-size:0.75rem; color:#64748b; margin-top:5px;">*Se ajusta automáticamente para llenar espacios.</div>
                    </div>

                    <!-- Visual Bar -->
                    <div class="big-cap-bar" style="height: 30px; background: #0f172a; border-radius: 6px; overflow: hidden; display: flex; border: 1px solid #334155;">
                        <div id="seg-biz" style="width: 0%; background: #fbbf24; height:100%; transition:width 0.2s;"></div>
                        <div id="seg-prm" style="width: 0%; background: #a78bfa; height:100%; transition:width 0.2s;"></div>
                        <div id="seg-eco" style="width: 100%; background: #4ade80; height:100%; transition:width 0.2s;"></div>
                    </div>
                    <div class="cap-legend" style="display:flex; justify-content:space-between; font-size:0.8rem; margin-top:8px; color:#94a3b8;">
                        <span id="cap-status">Ocupación: 100%</span>
                        <span id="seat-total">Total Asientos: ${maxCapacity}</span>
                    </div>
                </div>
            </div>

            <div class="modal-footer-sticky" style="padding: 20px; background: #1e293b; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                <div class="price-display" style="display: flex; flex-direction: column;">
                    <span class="label" style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">PRECIO</span>
                    <span class="val" style="font-size: 1.8rem; font-weight: bold; color: white; font-family: var(--font-mono);">$${(plane.price / 1000000).toFixed(1)}M</span>
                </div>
                <button id="btn-confirm-buy" class="btn-buy-lg" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; padding: 16px 32px; border-radius: 12px; font-size: 1.1rem; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4); cursor: pointer; transition: all 0.2s;">COMPRAR</button>
            </div>
        `;

        this.showImmersiveModal(html);

        // Elements
        const sBiz = document.getElementById('rng-biz');
        const sPrm = document.getElementById('rng-prm');

        const vBiz = document.getElementById('val-biz');
        const vPrm = document.getElementById('val-prm');
        const vEco = document.getElementById('val-eco');

        const segBiz = document.getElementById('seg-biz');
        const segPrm = document.getElementById('seg-prm');
        const segEco = document.getElementById('seg-eco');
        const barEcoVis = document.getElementById('bar-eco-vis');

        const btnBuy = document.getElementById('btn-confirm-buy');
        const btnAuto = document.getElementById('btn-auto-config');

        // Logic: Cannibalize Economy
        // We track Business and Premium. Economy is whatever is left.

        const updateCalc = () => {
            let b = parseInt(sBiz.value);
            let p = parseInt(sPrm.value);

            // 1. Check Limits
            // Space used by Biz and Prem
            let usedSpace = (b * 3) + (p * 2);

            // If we exceed capacity, we must clamp the one being moved?
            // Actually, sliders handle max, but since they are independent, we must dynamically clamp.
            // Simplest way: if Over, reduce the OTHER one? No, reduce current if possible or clamp.

            if (usedSpace > maxCapacity) {
                // If we are here, it means the user dragged a slider too far.
                // We don't know which one, but we can just constrain Premium first (or whatever matches).

                // Let's rely on event listeners to constrain BEFORE getting here, 
                // but for safety, let's clamp Premium to fit Business
                // Max P = (Total - B*3) / 2

                const maxP = Math.floor((maxCapacity - (b * 3)) / 2);
                if (p > maxP) {
                    p = maxP;
                    sPrm.value = p;
                }

                // If B is still too high (unlikely if we prioritize B), clamp B
                const maxB = Math.floor((maxCapacity - (p * 2)) / 3);
                if (b > maxB) {
                    b = maxB;
                    sBiz.value = b;
                }

                usedSpace = (b * 3) + (p * 2);
            }

            // 2. Calculate Economy
            let remainingSpace = maxCapacity - usedSpace;
            let e = remainingSpace; // Economy is 1x size

            // Update UI
            vBiz.textContent = b;
            vPrm.textContent = p;
            vEco.textContent = e;

            // Bar widths
            const total = maxCapacity;
            segBiz.style.width = ((b * 3) / total * 100) + "%";
            segPrm.style.width = ((p * 2) / total * 100) + "%";
            segEco.style.width = ((e * 1) / total * 100) + "%";

            barEcoVis.style.width = (e > 0) ? '100%' : '0%';

            config = { economy: e, premium: p, business: b };

            // Dynamic Max attributes to prevent sliding into invalid state
            const currentB = parseInt(sBiz.value);
            const spaceForB = maxCapacity - (parseInt(sPrm.value) * 2);
            sBiz.max = Math.floor(spaceForB / 3);

            const currentP = parseInt(sPrm.value);
            const spaceForP = maxCapacity - (parseInt(sBiz.value) * 3);
            sPrm.max = Math.floor(spaceForP / 2);

            // Button State
            if (!canAfford) {
                btnBuy.disabled = true;
                btnBuy.style.opacity = 0.5;
                btnBuy.textContent = "FONDOS INSUFICIENTES";
            } else {
                btnBuy.disabled = false;
                btnBuy.style.opacity = 1;
                btnBuy.textContent = "COMPRAR";
            }
        };

        sBiz.addEventListener('input', updateCalc);
        sPrm.addEventListener('input', updateCalc);

        // Auto Config
        btnAuto.addEventListener('click', () => {
            // Target: 10% Biz, 15% Prem, Rest Eco (approx by Space)
            const targetBizSpace = maxCapacity * 0.15; // 15% of space for Biz
            const targetPrmSpace = maxCapacity * 0.20; // 20% of space for Prm

            let b = Math.floor(targetBizSpace / 3);
            let p = Math.floor(targetPrmSpace / 2);

            sBiz.value = b;
            sPrm.value = p;
            updateCalc();
        });

        updateCalc(); // Init

        btnBuy.addEventListener('click', () => {
            // Show modal to input custom registration
            this.showRegistrationDialog(plane.id, config, (customReg) => {
                const result = this.game.managers.fleet.buyAircraft(plane.id, config, customReg);
                if (result.success) {
                    this.hideModal();
                    this.showError("¡Nueva aeronave adquirida!");
                    this.updateHUD();
                    if (this.views.fleet.classList.contains('active')) this.renderFleet();
                } else {
                    this.showError(result.msg);
                }
            });
        });
    }

    showRegistrationDialog(planeId, config, callback) {
        const iata = this.game.state.companyIATA || 'XYZ';
        const plane = AIRCRAFT_TYPES[planeId];
        
        // Generate suggestion: IATA + numbers
        const suggested = iata + '-' + Math.floor(10000 + Math.random() * 90000);
        
        const html = `
            <div style="text-align: center; padding: 20px;">
                <h2 style="margin-bottom: 20px; color: #e2e8f0;">Matrícula del Avión</h2>
                <p style="color: #94a3b8; margin-bottom: 30px; font-size: 1rem;">
                    ${plane.name}<br/>
                    <span style="font-size: 0.9rem; color: #64748b;">Introduce una matrícula única para esta aeronave</span>
                </p>
                <div style="margin-bottom: 30px;">
                    <label style="display: block; margin-bottom: 10px; color: #cbd5e1; font-weight: bold;">Matrícula:</label>
                    <input type="text" id="reg-input" placeholder="${suggested}" value="${suggested}" 
                        style="width: 100%; padding: 12px; background: #1e293b; border: 1px solid #475569; 
                               border-radius: 8px; color: #e2e8f0; font-family: monospace; font-size: 1.1rem;
                               box-sizing: border-box;">
                    <div style="margin-top: 8px; font-size: 0.8rem; color: #64748b;">
                        💡 Ejemplo: ${suggested}
                    </div>
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="reg-confirm" class="btn-primary" 
                        style="padding: 12px 24px; background: #3b82f6; color: white; border: none; 
                               border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1rem;">
                        CONFIRMAR
                    </button>
                    <button id="reg-cancel" class="btn-secondary" 
                        style="padding: 12px 24px; background: rgba(255,255,255,0.1); color: white; 
                               border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1rem;">
                        CANCELAR
                    </button>
                </div>
            </div>
        `;

        this.showModal("Nueva Aeronave", html);

        const input = this.getElement('reg-input');
        const confirm = this.getElement('reg-confirm');
        const cancel = this.getElement('reg-cancel');

        // Auto-focus input
        this.setTimeout(() => input?.focus(), 100);

        confirm.addEventListener('click', () => {
            let reg = input.value.trim();
            if (!reg) {
                reg = suggested;
            }
            // Validate format (optional, but let's ensure it's not too long)
            if (reg.length > 15) {
                alert('Matrícula muy larga (máximo 15 caracteres)');
                return;
            }
            callback(reg);
            this.hideModal();
        });

        cancel.addEventListener('click', () => {
            this.hideModal();
        });

        // Allow Enter to confirm
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirm.click();
            }
        });
    }

    // --- FLEET RENDERER ---
    renderFleet() {
        const container = this.views.fleet;
        const fleet = this.game.managers.fleet.getFlatData();

        const stats = this.game.managers.fleet.getStats();

        if (fleet.length === 0) {
            container.innerHTML = `
                <h2>Mi Flota</h2>
                <div class="empty-state">
                    <p>No tienes aviones aún.</p>
                    <button class="btn-primary" onclick="window.app.ui.switchView('market')">Ir al Mercado</button>
                </div>`;
            return;
        }

        container.innerHTML = `
            <h2>Mi Flota</h2>
            <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 6px;">Resumen de flota</div>
            <div class="fleet-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-bottom: 12px;">
                <div style="background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.25); border-radius: 10px; padding: 12px;">
                    <div style="font-size: 0.75rem; color: #6ee7b7;">Condición media</div>
                    <div style="font-weight: bold; font-size: 1.1rem; color: #10b981;">${Math.round(stats.avgCondition)}%</div>
                </div>
                <div style="background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.25); border-radius: 10px; padding: 12px;">
                    <div style="font-size: 0.75rem; color: #93c5fd;">Horas voladas</div>
                    <div style="font-weight: bold; font-size: 1.1rem; color: #3b82f6;">${Math.round(stats.totalHours)} h</div>
                </div>
                <div style="background: rgba(234,179,8,0.12); border: 1px solid rgba(234,179,8,0.25); border-radius: 10px; padding: 12px;">
                    <div style="font-size: 0.75rem; color: #facc15;">Antigüedad media</div>
                    <div style="font-weight: bold; font-size: 1.1rem; color: #eab308;">${Math.max(0, stats.avgAgeDays).toFixed(1)} días</div>
                </div>
                <div style="background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.2); border-radius: 10px; padding: 12px;">
                    <div style="font-size: 0.75rem; color: #4ade80;">Ingresos acumulados</div>
                    <div style="font-weight: bold; font-size: 1.1rem; color: #22c55e;">$${stats.totalRevenue.toLocaleString()}</div>
                </div>
            </div>
            <div class="list-container"></div>`;
        const list = container.querySelector('.list-container');

        fleet.forEach((plane, idx) => {
            const conditionColor = plane.condition > 70 ? '#4ade80' : plane.condition > 40 ? '#fbbf24' : '#ef4444';
            const maintInfo = plane.status === 'MAINT' ? `(${plane.maintDaysLeft}d restantes)` : '';
            const hours = Math.round(plane.hoursFlown || 0);
            const ageDays = Math.max(0, ((this.game.state.date || Date.now()) - (plane.deliveredAt || Date.now())) / 86400000);
            const revenue = Math.round(plane.totalRevenue || 0);
            const pax = Math.round(plane.totalPassengers || 0);

            const card = document.createElement('div');
            card.className = 'aircraft-card owned';
            card.innerHTML = `
                <div class="thumb" style="background-image: url('${plane.baseStats.image}')"></div>
                <div class="info">
                    <h3>${plane.baseStats.name}</h3>
                    <div class="sub-info">
                        <span class="reg">${plane.registration}</span>
                        <span class="status ${plane.status.toLowerCase()}">${plane.status} ${maintInfo}</span>
                    </div>
                    <div class="condition-bar" style="margin-top: 8px;">
                        <div class="label" style="font-size: 0.7rem; color: #94a3b8; margin-bottom: 3px;">
                            Condición: ${Math.round(plane.condition)}%
                        </div>
                        <div class="bar-bg" style="height: 6px; background: #1e293b; border-radius: 3px; overflow: hidden;">
                            <div class="bar-fill" style="width: ${plane.condition}%; height: 100%; background: ${conditionColor}; transition: width 0.3s;"></div>
                        </div>
                    </div>
                    <div style="margin-top: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 10px;">
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; font-size: 0.72rem; color: #94a3b8; text-align: left;">
                            <div>
                                <div style="color: #cbd5e1; font-weight: 700; font-size: 0.85rem;">${hours} h</div>
                                <div style="font-size: 0.65rem; opacity: 0.8;">Horas</div>
                            </div>
                            <div>
                                <div style="color: #fbbf24; font-weight: 700; font-size: 0.85rem;">${ageDays.toFixed(1)} d</div>
                                <div style="font-size: 0.65rem; opacity: 0.8;">Edad</div>
                            </div>
                            <div>
                                <div style="color: #22c55e; font-weight: 700; font-size: 0.85rem;">$${revenue.toLocaleString()}</div>
                                <div style="font-size: 0.65rem; opacity: 0.8;">Ingresos</div>
                            </div>
                            <div>
                                <div style="color: #38bdf8; font-weight: 700; font-size: 0.85rem;">${pax}</div>
                                <div style="font-size: 0.65rem; opacity: 0.8;">Pax</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Click handler for entire card
            card.addEventListener('click', () => {
                this.showAircraftDetails(plane);
            });

            // Stagger animation
            // card.style.opacity = '0'; // REMOVED
            card.style.animation = `staggerFadeIn 0.4s ease-out ${idx * 0.05}s both`;

            list.appendChild(card);
        });
    }

    showAircraftDetails(plane) {
        let currentRoute = null;
        // Prefer plane.routeId if present
        if (plane.routeId) {
            currentRoute = this.game.managers.routes.getRoutes().find(r => r.id === plane.routeId) || null;
        }
        if (!currentRoute) {
            // Fallback: legacy assignedPlane or assignments array
            currentRoute = this.game.managers.routes.getRoutes().find(r => r.assignedPlane === plane.instanceId
                || (Array.isArray(r.assignments) && r.assignments.some(a => a.planeId === plane.instanceId))
            ) || null;
        }
        const conditionColor = plane.condition > 70 ? '#7ed321' : plane.condition > 40 ? '#f5a623' : '#e74c3c';
        
        // Determinar badge de estado
        let statusBadge = '';
        let statusClass = '';
        if (plane.status === 'IDLE') {
            statusBadge = 'EN TIERRA';
            statusClass = 'idle';
        } else if (plane.status === 'FLIGHT') {
            statusBadge = 'EN VUELO';
            statusClass = 'flight';
        } else if (plane.status === 'MAINT') {
            statusBadge = 'MANTENIMIENTO';
            statusClass = 'maintenance';
        }

        const html = `
            <div class="aircraft-details-modal">
                <!-- Header con Tabs estilo Rutas -->
                <div class="aircraft-modal-header">
                    <div class="aircraft-modal-tabs">
                        <button class="aircraft-tab-btn active" data-tab="overview">
                            <span class="tab-icon"><i class="fa-solid fa-chart-simple"></i></span>RESUMEN
                        </button>
                        <button class="aircraft-tab-btn" data-tab="performance">
                            <span class="tab-icon"><i class="fa-solid fa-dollar-sign"></i></span>RENDIMIENTO
                        </button>
                        <button class="aircraft-tab-btn" data-tab="maintenance">
                            <span class="tab-icon"><i class="fa-solid fa-wrench"></i></span>MANTENIMIENTO
                        </button>
                        <button class="aircraft-tab-btn" data-tab="route">
                            <span class="tab-icon"><i class="fa-solid fa-route"></i></span>RUTA
                        </button>
                    </div>
                </div>

                <!-- Hero: Imagen del avión con badge de estado -->
                <div class="aircraft-hero">
                    <img src="${plane.baseStats.image}" alt="${plane.baseStats.name}">
                    <div class="aircraft-status-badge ${statusClass}">
                        <div class="status-icon"></div>
                        ${statusBadge}
                    </div>
                    <div class="aircraft-registration">${plane.registration}</div>
                    <button class="aircraft-close-btn" onclick="window.app.ui.hideModal()">×</button>
                </div>

                <!-- Info Header -->
                <div class="aircraft-info-header">
                    <h2 class="aircraft-name">${plane.baseStats.name}</h2>
                    <p class="aircraft-subtitle">${plane.baseStats.manufacturer} • ${plane.baseStats.category}</p>
                </div>

                <!-- Tab Contents -->
                <div class="tab-content active" data-content="overview">${this.getOverviewTabHTML(plane, conditionColor, currentRoute)}</div>
                <div class="tab-content" data-content="performance" style="display: none;">${this.getPerformanceTabHTML(plane)}</div>
                <div class="tab-content" data-content="maintenance" style="display: none;">${this.getMaintenanceTabHTML(plane)}</div>
                <div class="tab-content" data-content="route" style="display: none;">${this.getRouteTabHTML(plane, currentRoute)}</div>
            </div>
        `;

        this.showImmersiveModal(html);

        // Tab switching logic
        const tabBtns = document.querySelectorAll('.aircraft-tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => {
                    c.style.display = 'none';
                    c.classList.remove('active');
                });

                btn.classList.add('active');
                const targetContent = document.querySelector(`[data-content="${targetTab}"]`);
                if (targetContent) {
                    targetContent.style.display = 'block';
                    targetContent.classList.add('active');
                }
            });
        });

        // Collapsible sections
        const collapsibles = document.querySelectorAll('.collapsible-header');
        collapsibles.forEach(header => {
            header.addEventListener('click', () => {
                const section = header.closest('.collapsible-section');
                section.classList.toggle('expanded');
            });
        });

        // Route actions (elementos dinámicos del modal, no se cachean)
        const btnRemove = this.getElement('btn-remove-route');
        if (btnRemove) {
            btnRemove.addEventListener('click', () => {
                const result = this.game.managers.routes.removeRoute(currentRoute.id);
                if (result.success) {
                    this.hideModal();
                    this.showError('Ruta eliminada. El avión está libre.');
                    this.renderFleet();
                }
            });
        }

        const btnGoRoutes = this.getElement('btn-go-routes');
        if (btnGoRoutes) {
            btnGoRoutes.addEventListener('click', () => {
                this.hideModal();
                this.switchView('routes');
            });
        }

        // Maintenance Setup
        this.setupMaintenanceActions(plane);
    }

    getOverviewTabHTML(plane, conditionColor, currentRoute) {
        const totalSeats = plane.configuration.economy + plane.configuration.premium + plane.configuration.business;
        const ageDays = Math.max(0, ((this.game.state.date || Date.now()) - (plane.deliveredAt || Date.now())) / 86400000);
        
        return `
            <div class="aircraft-content">
                <!-- Columna Izquierda: Especificaciones Técnicas -->
                <div class="aircraft-column">
                    <div class="column-section">
                        <div class="section-header">Aeronave</div>
                        <div class="spec-row">
                            <span class="spec-label">Modelo</span>
                            <span class="spec-value highlight">${plane.baseStats.name}</span>
                        </div>
                        <div class="spec-row">
                            <span class="spec-label">Fabricante</span>
                            <span class="spec-value">${plane.baseStats.manufacturer}</span>
                        </div>
                        <div class="spec-row">
                            <span class="spec-label">Categoría</span>
                            <span class="spec-value">${plane.baseStats.category}</span>
                        </div>
                    </div>

                    <div class="column-section">
                        <div class="section-header">Especificaciones</div>
                        <div class="spec-row">
                            <span class="spec-label">Alcance</span>
                            <span class="spec-value highlight">${plane.baseStats.range.toLocaleString()} km</span>
                        </div>
                        <div class="spec-row">
                            <span class="spec-label">Velocidad</span>
                            <span class="spec-value">${plane.baseStats.speed} km/h</span>
                        </div>
                        <div class="spec-row">
                            <span class="spec-label">Pista mín.</span>
                            <span class="spec-value">${plane.baseStats.runway.toLocaleString()} m</span>
                        </div>
                        <div class="spec-row">
                            <span class="spec-label">Consumo</span>
                            <span class="spec-value">${plane.baseStats.fuelBurn} kg/km</span>
                        </div>
                    </div>

                    <div class="column-section">
                        <div class="section-header">Tipo</div>
                        <div class="spec-row">
                            <span class="spec-value" style="width: 100%; text-align: center; font-size: 1.5rem;">
                                👤 Pasajeros
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Columna Derecha: Estado Operativo -->
                <div class="aircraft-column">
                    <div class="column-section">
                        <div class="section-header">Horas de vuelo/Cycles</div>
                        <div class="spec-row">
                            <span class="spec-label">Horas voladas</span>
                            <span class="spec-value success">${Math.round(plane.hoursFlown || 0)} h / 3</span>
                        </div>
                    </div>

                    <div class="column-section">
                        <div class="section-header">Entregado</div>
                        <div class="spec-row">
                            <span class="spec-label">Hace</span>
                            <span class="spec-value">${ageDays.toFixed(0)} días</span>
                        </div>
                    </div>

                    <div class="column-section">
                        <div class="section-header">Tiempo revisión</div>
                        <div class="spec-row">
                            <span class="spec-label">Próximo Check</span>
                            <span class="spec-value warning">--</span>
                        </div>
                    </div>

                    <div class="column-section">
                        <div class="section-header">Deterioro</div>
                        <div class="spec-row">
                            <span class="spec-label">Condición</span>
                            <span class="spec-value ${plane.condition > 70 ? 'success' : plane.condition > 40 ? 'warning' : 'danger'}">
                                ${Math.round(plane.condition)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sección Colapsable: Disposición de Asientos -->
            <div class="collapsible-section">
                <div class="collapsible-header">
                    <div class="collapsible-title">
                        <span>💺</span>
                        DISPOSICIÓN DE ASIENTOS
                    </div>
                    <div class="collapsible-chevron">▼</div>
                </div>
                <div class="collapsible-content">
                    <div class="collapsible-body">
                        <div class="seats-visual">
                            <div class="seat-class">
                                <div class="seat-icon-container">
                                    ${this.generateSeatIcons(plane.configuration.economy, 'economy')}
                                </div>
                                <div class="seat-count">${plane.configuration.economy}</div>
                                <div class="seat-fraction">/${plane.baseStats.seats}</div>
                                <div class="seat-label">Turista</div>
                            </div>
                            <div class="seat-class">
                                <div class="seat-icon-container">
                                    ${this.generateSeatIcons(plane.configuration.premium, 'premium')}
                                </div>
                                <div class="seat-count">${plane.configuration.premium}</div>
                                <div class="seat-fraction">/${Math.floor(plane.baseStats.seats / 2)}</div>
                                <div class="seat-label">Premium</div>
                            </div>
                            <div class="seat-class">
                                <div class="seat-icon-container">
                                    ${this.generateSeatIcons(plane.configuration.business, 'business')}
                                </div>
                                <div class="seat-count">${plane.configuration.business}</div>
                                <div class="seat-fraction">/${Math.floor(plane.baseStats.seats / 3)}</div>
                                <div class="seat-label">Business</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            ${currentRoute ? `
                <!-- Datos técnicos de ruta actual -->
                <div class="collapsible-section">
                    <div class="collapsible-header">
                        <div class="collapsible-title">
                            <span>📊</span>
                            RENDIMIENTO ECONÓMICO
                        </div>
                        <div class="collapsible-chevron">▼</div>
                    </div>
                    <div class="collapsible-content">
                        <div class="collapsible-body">
                            <div class="spec-row">
                                <span class="spec-label">Ruta Actual</span>
                                <span class="spec-value highlight">${currentRoute.origin} → ${currentRoute.dest}</span>
                            </div>
                            <div class="spec-row">
                                <span class="spec-label">Distancia</span>
                                <span class="spec-value">${currentRoute.distance.toLocaleString()} km</span>
                            </div>
                            <div class="spec-row">
                                <span class="spec-label">Ingresos/día</span>
                                <span class="spec-value success">$${(() => {
                                    const rev = this.computePlaneDailyRevenue(plane, currentRoute);
                                    return rev.toLocaleString();
                                })()}</span>
                            </div>
                            <div class="spec-row">
                                <span class="spec-label">Gastos/día</span>
                                <span class="spec-value danger">-$${(() => {
                                    const costs = this.calculateAircraftDailyCosts(plane, currentRoute);
                                    return costs.total.toLocaleString();
                                })()}</span>
                            </div>
                            <div class="spec-row" style="border-top: 2px solid rgba(255,255,255,0.2); padding-top: 12px; margin-top: 8px;">
                                <span class="spec-label" style="font-weight: bold;">Beneficio/día</span>
                                <span class="spec-value ${(() => {
                                    const costs = this.calculateAircraftDailyCosts(plane, currentRoute);
                                    const profit = this.computePlaneDailyRevenue(plane, currentRoute) - costs.total;
                                    return profit >= 0 ? 'success' : 'danger';
                                })()}" style="font-size: 1.2rem;">${(() => {
                                    const costs = this.calculateAircraftDailyCosts(plane, currentRoute);
                                    const profit = this.computePlaneDailyRevenue(plane, currentRoute) - costs.total;
                                    return (profit >= 0 ? '+' : '') + '$' + profit.toLocaleString();
                                })()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}
        `;
    }

    generateSeatIcons(count, className) {
        const maxIcons = 10; // Máximo de iconos a mostrar
        const iconsToShow = Math.min(count, maxIcons);
        let html = '';
        
        for (let i = 0; i < iconsToShow; i++) {
            html += `<span class="seat-icon ${className}">💺</span>`;
        }
        
        if (count > maxIcons) {
            html += `<span class="seat-icon ${className}" style="opacity: 0.5;">...</span>`;
        }
        
        return html || '<span style="opacity: 0.3; font-size: 0.8rem;">Sin asientos</span>';
    }

    calculateAircraftDailyCosts(plane, route) {
        if (!route) {
            // Si no tiene ruta, solo costos base (estacionamiento, seguro)
            const parkingCost = 500; // Costo diario de estacionamiento
            const insuranceCost = Math.round(plane.baseStats.price * 0.0001); // 0.01% del precio del avión
            return {
                parking: parkingCost,
                insurance: insuranceCost,
                total: parkingCost + insuranceCost
            };
        }

        // Si tiene ruta, calcular costos operativos
        const costs = this.game.managers.economy.calculateRouteCosts(route, plane);
        return costs;
    }

    getPerformanceTabHTML(plane) {
        const ageDays = Math.max(0, ((this.game.state.date || Date.now()) - (plane.deliveredAt || Date.now())) / 86400000);
        let currentRoute = null;
        if (plane.routeId) {
            currentRoute = this.game.managers.routes.getRoutes().find(r => r.id === plane.routeId) || null;
        }
        if (!currentRoute) {
            currentRoute = this.game.managers.routes.getRoutes().find(r => r.assignedPlane === plane.instanceId
                || (Array.isArray(r.assignments) && r.assignments.some(a => a.planeId === plane.instanceId))
            ) || null;
        }
        
        // Calcular costos y beneficio diario
        let dailyRevenue = 0;
        let dailyCosts = 0;
        let dailyProfit = 0;
        
        if (currentRoute) {
            dailyRevenue = this.computePlaneDailyRevenue(plane, currentRoute) || 0;
            const costs = this.calculateAircraftDailyCosts(plane, currentRoute);
            dailyCosts = costs.total || 0;
            dailyProfit = dailyRevenue - dailyCosts;
        } else {
            const costs = this.calculateAircraftDailyCosts(plane, null);
            dailyCosts = costs.total || 0;
            dailyProfit = -dailyCosts; // Negativo si no tiene ruta
        }
        
        return `
            <div style="padding: 24px;">
                <!-- Rendimiento Diario -->
                <div class="collapsible-section expanded">
                    <div class="collapsible-header">
                        <div class="collapsible-title">
                            <span>📊</span>
                            RENDIMIENTO DIARIO
                        </div>
                        <div class="collapsible-chevron">▼</div>
                    </div>
                    <div class="collapsible-content">
                        <div class="collapsible-body">
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px;">
                                <div style="background: rgba(74, 222, 128, 0.1); border-left: 4px solid #4ade80; padding: 16px; border-radius: 8px;">
                                    <div style="font-size: 0.75rem; color: #8e98a8; margin-bottom: 6px; text-transform: uppercase;">Ingresos/día</div>
                                    <div style="font-size: 1.5rem; font-weight: bold; color: #4ade80;">$${dailyRevenue.toLocaleString()}</div>
                                </div>
                                <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px;">
                                    <div style="font-size: 0.75rem; color: #8e98a8; margin-bottom: 6px; text-transform: uppercase;">Gastos/día</div>
                                    <div style="font-size: 1.5rem; font-weight: bold; color: #ef4444;">-$${dailyCosts.toLocaleString()}</div>
                                </div>
                                <div style="background: ${dailyProfit >= 0 ? 'rgba(0, 196, 140, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; border-left: 4px solid ${dailyProfit >= 0 ? '#00c48c' : '#ef4444'}; padding: 16px; border-radius: 8px;">
                                    <div style="font-size: 0.75rem; color: #8e98a8; margin-bottom: 6px; text-transform: uppercase;">Beneficio/día</div>
                                    <div style="font-size: 1.5rem; font-weight: bold; color: ${dailyProfit >= 0 ? '#00c48c' : '#ef4444'};">${dailyProfit >= 0 ? '+' : ''}$${dailyProfit.toLocaleString()}</div>
                                </div>
                            </div>
                            ${!currentRoute ? '<div style="text-align: center; padding: 12px; background: rgba(251, 191, 36, 0.1); border-radius: 6px; color: #f5a623; font-size: 0.85rem;">⚠️ Sin ruta activa - Solo gastos de estacionamiento y seguro</div>' : ''}
                        </div>
                    </div>
                </div>

                <!-- Performance Stats Cards -->
                <div class="perf-stats-grid" style="margin-top: 20px;">
                    <div class="perf-stat-card revenue">
                        <div class="perf-stat-label">Ingresos Totales</div>
                        <div class="perf-stat-value">$${(plane.totalRevenue || 0).toLocaleString()}</div>
                    </div>
                    <div class="perf-stat-card passengers">
                        <div class="perf-stat-label">Pasajeros Totales</div>
                        <div class="perf-stat-value">${(plane.totalPassengers || 0).toLocaleString()}</div>
                    </div>
                    <div class="perf-stat-card hours">
                        <div class="perf-stat-label">Horas Voladas</div>
                        <div class="perf-stat-value">${Math.round(plane.hoursFlown || 0)} h</div>
                    </div>
                    <div class="perf-stat-card age">
                        <div class="perf-stat-label">Antigüedad</div>
                        <div class="perf-stat-value">${ageDays.toFixed(1)} d</div>
                    </div>
                </div>

                <!-- Historial de Vuelos -->
                <div class="collapsible-section expanded">
                    <div class="collapsible-header">
                        <div class="collapsible-title">
                            <span>🛫</span>
                            HISTORIAL DE VUELOS
                        </div>
                        <div class="collapsible-chevron">▼</div>
                    </div>
                    <div class="collapsible-content">
                        <div class="collapsible-body">
                            ${(!plane.flightHistory || plane.flightHistory.length === 0) ?
                                '<div style="text-align: center; padding: 30px; color: #8e98a8;">Sin vuelos registrados aún</div>' :
                                `<table class="flight-history-table">
                                    <thead>
                                        <tr>
                                            <th>Código</th>
                                            <th>Ruta</th>
                                            <th>Fecha</th>
                                            <th>Pax</th>
                                            <th>Ingresos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${plane.flightHistory.slice(0, 10).map((flight, idx) => `
                                            <tr>
                                                <td class="flight-code">ME-${String(idx + 1).padStart(4, '0')}</td>
                                                <td class="flight-route">${flight.route}</td>
                                                <td class="flight-date">${flight.date}</td>
                                                <td class="flight-pax">${flight.passengers}</td>
                                                <td class="flight-revenue">$${flight.revenue.toLocaleString()}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    computePlaneDailyRevenue(plane, route) {
        if (!route || !plane) return 0;
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
        const f = this.game.managers.routes.getDemandFactors(route.origin, route.dest);
        return this.game.managers.routes.calculatePotentialRevenue(
            route.distance,
            seats,
            route.priceMultiplier || 1.0,
            f.originDemandFactor,
            f.destDemandFactor,
            route.origin,
            route.dest,
            route.frequency || 7
        );
    }

    getRouteTabHTML(plane, currentRoute) {
        if (!currentRoute) {
            return `
                <div style="padding: 40px; text-align: center; color: #8e98a8;">
                    <div style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;">✈️</div>
                    <h3 style="margin: 0 0 10px 0; color: white;">Sin Ruta Asignada</h3>
                    <p style="margin: 0 0 24px 0;">Este avión no tiene ninguna ruta asignada actualmente</p>
                    ${plane.status === 'IDLE' ?
                        `<button id="btn-go-routes" class="modal-btn btn-primary" style="padding: 14px 32px; font-size: 1rem; background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%); border: none; color: white; border-radius: 8px; cursor: pointer; font-weight: bold;">
                            Asignar Ruta
                        </button>` :
                        `<p style="color: #f5a623; font-size: 0.9rem;">⚠️ El avión debe estar IDLE para asignar rutas</p>`
                    }
                </div>
            `;
        }

        return `
            <div style="padding: 24px;">
                <!-- Ruta actual con diseño mejorado -->
                <div style="background: linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(53, 122, 189, 0.1) 100%); border: 2px solid rgba(74, 144, 226, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <div>
                            <h3 style="margin: 0 0 8px 0; font-size: 1.6rem; color: white;">
                                ${currentRoute.origin} <span style="color: #4a90e2;">✈</span> ${currentRoute.dest}
                            </h3>
                            <p style="margin: 0; font-size: 0.9rem; color: #8e98a8;">
                                ${currentRoute.distance.toLocaleString()} km
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.8rem; font-weight: bold; color: #00c48c;">
                                $${currentRoute.dailyRevenue.toLocaleString()}
                            </div>
                            <div style="font-size: 0.75rem; color: #8e98a8; text-transform: uppercase;">
                                Ingresos Diarios
                            </div>
                        </div>
                    </div>
                    
                    <button id="btn-remove-route" style="width: 100%; padding: 14px; background: rgba(231, 76, 60, 0.1); border: 2px solid rgba(231, 76, 60, 0.3); color: #e74c3c; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 0.95rem; transition: all 0.3s ease;">
                        ❌ Eliminar Ruta
                    </button>
                </div>
            </div>
        `;
    }

    getMaintenanceTabHTML(plane) {
        const canA = plane.status === 'IDLE';
        const canB = plane.status === 'IDLE';

        return `
            <div class="maint-options" style="display: flex; gap: 15px; margin-top: 10px;">
                <div class="maint-card" style="flex: 1; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border: 1px solid #334155;">
                    <h4 style="margin: 0 0 10px 0; color: #3b82f6;">Check A</h4>
                    <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 10px;">Mantenimiento rápido</p>
                    <ul style="font-size: 0.8rem; color: #cbd5e1; margin-bottom: 15px; padding-left: 20px;">
                        <li>Duración: 1 día</li>
                        <li>Restaura: +20%</li>
                        <li>Costo: $10,000</li>
                    </ul>
                    <button class="modal-btn btn-primary btn-check-a" ${!canA ? 'disabled style="opacity:0.5;"' : ''}>
                        Realizar Check A
                    </button>
                </div>
                
                <div class="maint-card" style="flex: 1; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border: 1px solid #334155;">
                    <h4 style="margin: 0 0 10px 0; color: #8b5cf6;">Check B</h4>
                    <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 10px;">Mantenimiento completo</p>
                    <ul style="font-size: 0.8rem; color: #cbd5e1; margin-bottom: 15px; padding-left: 20px;">
                        <li>Duración: 3 días</li>
                        <li>Restaura: 100%</li>
                        <li>Costo: $50,000</li>
                    </ul>
                    <button class="modal-btn btn-primary btn-check-b" ${!canB ? 'disabled style="opacity:0.5;"' : ''}>
                        Realizar Check B
                    </button>
                </div>
            </div>
            ${plane.status !== 'IDLE' ? '<p style="color: #ef4444; text-align: center; margin-top: 15px; font-size: 0.9rem;">⚠️ El avión debe estar IDLE para mantenimiento</p>' : ''}
        `;
    }

    setupMaintenanceActions(plane) {
        const btnA = document.querySelector('.btn-check-a');
        const btnB = document.querySelector('.btn-check-b');

        if (btnA && !btnA.disabled) {
            btnA.addEventListener('click', () => {
                const result = this.game.managers.fleet.startMaintenance(plane.instanceId, 'A');
                if (result.success) {
                    this.hideModal();
                    this.showError('Check A iniciado. Durará 1 día.');
                    this.renderFleet();
                    this.updateHUD();
                }
            });
        }

        if (btnB && !btnB.disabled) {
            btnB.addEventListener('click', () => {
                const result = this.game.managers.fleet.startMaintenance(plane.instanceId, 'B');
                if (result.success) {
                    this.hideModal();
                    this.showError('Check B iniciado. Durará 3 días.');
                    this.renderFleet();
                    this.updateHUD();
                }
            });
        }
    }

    // --- ROUTE RENDERER ---
    renderRoutes() {
        let listContainer = this.getElement('routes-list');

        // Self-healing: If stale HTML is cached and missing container, recreate structure
        if (!listContainer) {
            console.warn('DOM Repair: Recreating missing routes structure...');
            const view = this.views.routes;
            if (view) {
                view.innerHTML = `
                    <h2>Rutas</h2>
                    <div id="routes-list"></div>
                `;
                // Limpiar cache y obtener nuevamente después de crear HTML
                delete this.elementCache['routes-list'];
                listContainer = this.getElement('routes-list');
            }
        }

        if (!listContainer) return; // Should not happen after repair

        const routes = this.game.managers.routes.getRoutes();

        let html = `
            <div class="header-action" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0;">Mis Rutas</h3>
                <button class="btn-primary small" id="btn-new-route" style="padding: 0.5rem 1rem; font-size: 0.9rem;">+ Nueva Ruta</button>
            </div>
        `;

        if (routes.length === 0) {
            html += `
                <div class="empty-state">
                    <p>No tienes rutas activas.</p>
                </div>`;
        } else {
            html += `<div class="list-container">`;
            routes.forEach(r => {
                const origin = AIRPORTS[r.origin];
                const dest = AIRPORTS[r.dest];
                const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === r.assignedPlane);
                const hubBase = r.hubBase || this.game.state.mainHub;
                const assignedCount = (Array.isArray(r.assignments) && r.assignments.length > 0)
                    ? r.assignments.length
                    : (r.assignedPlane ? 1 : 0);

                // Yield calculation
                const yield_ = this.game.managers.routes.calculateYield(r);
                
                // Rival pricing comparison
                const rivalAvg = this.game.managers.routes.getRivalAveragePrice(r.origin, r.dest);
                const priceMultiplier = r.priceMultiplier || 1.0;
                const priceDiff = ((priceMultiplier - rivalAvg) / rivalAvg * 100).toFixed(0);
                
                let priceColor = '#94a3b8';
                let priceLabel = 'Normal';
                if (priceMultiplier < 0.85) {
                    priceColor = '#22c55e';
                    priceLabel = 'Low-Cost';
                } else if (priceMultiplier > 1.15) {
                    priceColor = '#8b5cf6';
                    priceLabel = 'Premium';
                }

                // Competencia descriptor
                const label = this.game.managers.competitors?.getCompetitionLabelForRoute?.(r.origin, r.dest) || 'Baja';
                let compColor = '#22c55e';
                let compBg = 'rgba(34,197,94,0.12)';
                let compBorder = 'rgba(34,197,94,0.30)';
                if (label === 'Media') {
                    compColor = '#f59e0b';
                    compBg = 'rgba(245,158,11,0.12)';
                    compBorder = 'rgba(245,158,11,0.30)';
                } else if (label === 'Alta') {
                    compColor = '#ef4444';
                    compBg = 'rgba(239,68,68,0.12)';
                    compBorder = 'rgba(239,68,68,0.30)';
                }

                // Frecuencia (vuelos por semana)
                const frequency = r.frequency || 7;
                let freqLabel = '';
                if (frequency === 1) freqLabel = '1x/sem';
                else if (frequency === 2) freqLabel = '2x/sem';
                else if (frequency === 3) freqLabel = '3x/sem';
                else if (frequency === 7) freqLabel = 'Diario';
                else if (frequency === 14) freqLabel = '2x/día';

                // Eventos recientes (últimas 24 horas)
                const recentEvents = (r.events || []).filter(e => (this.game.state.date - e.timestamp) < 24 * 60 * 60 * 1000);
                let eventBadges = '';
                if (recentEvents.length > 0) {
                    const hasCancel = recentEvents.some(e => e.type === 'cancellation');
                    const hasDelay = recentEvents.some(e => e.type === 'delay');
                    const hasOB = recentEvents.some(e => e.type === 'overbooking');
                    
                    if (hasCancel) eventBadges += '<span style="display:inline-block;font-size:0.7rem;background:#ef4444;color:#fff;border-radius:4px;padding:2px 6px;margin-right:4px;"><i class="fa-solid fa-times"></i> Cancelado</span>';
                    if (hasDelay) eventBadges += '<span style="display:inline-block;font-size:0.7rem;background:#f59e0b;color:#fff;border-radius:4px;padding:2px 6px;margin-right:4px;"><i class="fa-solid fa-clock"></i> Retraso</span>';
                    if (hasOB) eventBadges += '<span style="display:inline-block;font-size:0.7rem;background:#8b5cf6;color:#fff;border-radius:4px;padding:2px 6px;"><i class="fa-solid fa-chart-line"></i> Overbooking</span>';
                }

                html += `
                    <div class="route-card" data-route-id="${r.id}" data-route-origin="${r.origin}" data-route-dest="${r.dest}">
                        <div class="route-card-main">
                            <div class="route-info">
                                <h3>${r.origin} ➔ ${r.dest}</h3>
                                <p>${plane ? plane.baseStats.name : (assignedCount > 1 ? `Múltiples aviones (${assignedCount})` : 'Sin info')}</p>
                                <p>${r.distance}km • Hub: ${hubBase} • ${freqLabel} • Aviones: ${assignedCount}</p>
                                ${eventBadges ? `<div style="margin-top:6px;">${eventBadges}</div>` : ''}
                                <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;">
                                    <div style="display:inline-block; font-size:0.75rem; color:${compColor}; background:${compBg}; border:1px solid ${compBorder}; border-radius:999px; padding:4px 8px;">
                                        ⚔️ ${label}
                                    </div>
                                    <div class="route-price-badge" data-route-id="${r.id}" style="display:inline-flex; align-items:center; gap:4px; font-size:0.75rem; color:${priceColor}; background:linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.15) 100%); border:2px solid ${priceColor}; border-radius:999px; padding:6px 10px; cursor: pointer; transition: all 0.2s; font-weight: 600;">
                                        💵 ${priceLabel} (${priceDiff > 0 ? '+' : ''}${priceDiff}%) <i class="fa-solid fa-pen-to-square" style="font-size:0.7rem;"></i>
                                    </div>
                                    <div style="display:inline-block; font-size:0.75rem; color:#60a5fa; background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.3); border-radius:999px; padding:4px 8px;">
                                        ${assignedCount} asignado${assignedCount===1?'':'s'}
                                    </div>
                                </div>
                                <div style="margin-top: 6px; font-size: 0.75rem; color: #64748b;">
                                    Yield: $${yield_.toFixed(2)}/pax/km
                                </div>
                            </div>
                            <div class="route-rev">
                                <div class="amount">+$${r.dailyRevenue}</div>
                                <div class="label">/día</div>
                            </div>
                        </div>
                        <div class="route-card-editor hidden" id="editor-${r.id}">
                            <div style="padding: 12px; background: rgba(59,130,246,0.08); border-radius: 8px; margin-top: 12px;">
                                <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 8px;">
                                    <strong>Ajusta el precio y ve el impacto en tiempo real</strong>
                                </div>
                                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
                                    <input type="range" class="route-price-slider" data-route-id="${r.id}" min="70" max="150" step="5" value="${priceMultiplier * 100}" style="flex: 1; height: 6px; border-radius: 3px; background: rgba(255,255,255,0.1); outline: none; cursor: pointer;">
                                    <span class="route-price-display" style="min-width: 45px; font-weight: 700; color: #3b82f6; font-size: 0.9rem;">${(priceMultiplier * 100).toFixed(0)}%</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #64748b; margin-bottom: 12px;">
                                    <span>70% Low</span>
                                    <span>100% Normal</span>
                                    <span>150% Premium</span>
                                </div>
                                <div class="route-projection" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 0.8rem; margin-bottom: 12px;">
                                    <div style="background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3); border-radius: 6px; padding: 8px; text-align: center;">
                                        <div style="color: #94a3b8;">Ingreso</div>
                                        <div class="proj-revenue" style="color: #10b981; font-weight: 700;">$${r.dailyRevenue}</div>
                                    </div>
                                    <div style="background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.3); border-radius: 6px; padding: 8px; text-align: center;">
                                        <div style="color: #94a3b8;">Ocupación</div>
                                        <div class="proj-load" style="color: #3b82f6; font-weight: 700;">--</div>
                                    </div>
                                    <div style="background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.3); border-radius: 6px; padding: 8px; text-align: center;">
                                        <div style="color: #94a3b8;">Yield</div>
                                        <div class="proj-yield" style="color: #8b5cf6; font-weight: 700;">$${yield_.toFixed(2)}</div>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 8px;">
                                    <button class="route-cancel-edit" data-route-id="${r.id}" style="flex: 1; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #cbd5e1; border-radius: 6px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;">Cancelar</button>
                                    <button class="route-apply-price" data-route-id="${r.id}" style="flex: 1; padding: 8px; background: #3b82f6; border: none; color: white; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 700; transition: all 0.2s;">Aplicar Precio</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        listContainer.innerHTML = html;

        // Limpiar cache de elementos dinámicos después de cambiar innerHTML
        delete this.elementCache['btn-new-route'];
        const btnNewRoute = this.getElement('btn-new-route');
        if (btnNewRoute) {
            btnNewRoute.addEventListener('click', () => {
                this.showNewRouteParams();
            });
        }

        // Add click handlers to route cards
        const routeCards = listContainer.querySelectorAll('.route-card[data-route-id]');
        routeCards.forEach(card => {
            const routeId = card.dataset.routeId;
            const route = this.game.managers.routes.getRoutes().find(r => r.id === routeId);
            
            // Click en el main card (excepto precio) abre modal
            const mainCard = card.querySelector('.route-card-main');
            mainCard.addEventListener('click', (e) => {
                if (!e.target.closest('.route-price-badge')) {
                    this.showRoutePricingModal(routeId);
                }
            });
            
            // Click en price badge abre editor inline
            const priceBadge = card.querySelector('.route-price-badge');
            if (priceBadge) {
                priceBadge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const editor = card.querySelector('.route-card-editor');
                    if (!editor) {
                        console.error('❌ Editor no encontrado para ruta', routeId);
                        return;
                    }
                    console.log('✅ Expandiendo editor para ruta', routeId);
                    mainCard.classList.add('hidden');
                    editor.classList.remove('hidden');
                });
            }
            
            // Slider para proyección en tiempo real
            const slider = card.querySelector('.route-price-slider');
            if (slider && route) {
                slider.addEventListener('input', (e) => {
                    const newMultiplier = parseInt(e.target.value) / 100;
                    const priceDisplay = card.querySelector('.route-price-display');
                    priceDisplay.textContent = e.target.value + '%';
                    
                    // Get plane from route
                    const assignments = Array.isArray(route.assignments) && route.assignments.length > 0
                        ? route.assignments
                        : (route.assignedPlane ? [{ planeId: route.assignedPlane }] : []);
                    
                    if (assignments.length === 0) return;
                    
                    const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === assignments[0].planeId);
                    if (!plane) return;
                    
                    // Proyectar cambios
                    const projection = this.game.managers.economy?.projectRouteMetrics?.(route, plane, newMultiplier);
                    if (projection) {
                        const projRevenue = card.querySelector('.proj-revenue');
                        const projLoad = card.querySelector('.proj-load');
                        const projYield = card.querySelector('.proj-yield');
                        
                        if (projRevenue) projRevenue.textContent = '$' + Math.floor(projection.revenue).toLocaleString();
                        if (projLoad) projLoad.textContent = Math.round(projection.occupancy * 100) + '%';
                        if (projYield) projYield.textContent = '$' + projection.yield.toFixed(2);
                    }
                });
            }
            
            // Botón cancelar
            const cancelBtn = card.querySelector('.route-cancel-edit');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const editor = card.querySelector('.route-card-editor');
                    editor.classList.add('hidden');
                    mainCard.classList.remove('hidden');
                });
            }
            
            // Botón aplicar precio
            const applyBtn = card.querySelector('.route-apply-price');
            if (applyBtn && route) {
                applyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const slider = card.querySelector('.route-price-slider');
                    const newMultiplier = parseInt(slider.value) / 100;
                    
                    // Actualizar ruta
                    route.priceMultiplier = newMultiplier;
                    
                    // Guardar
                    this.game.save();
                    
                    // Cerrar editor y refrescar
                    const editor = card.querySelector('.route-card-editor');
                    editor.classList.add('hidden');
                    mainCard.classList.remove('hidden');
                    
                    // Re-renderizar para actualizar precios
                    this.renderRoutes();
                });
            }
        });

        // Render the Leaflet Map
        if (this.map) {
            this.map.invalidateSize();
            this.updateMap();
        }
    }

    showNewRouteParams() {
        // Filter idle planes
        const availablePlanes = this.game.managers.fleet.ownedPlanes.filter(p => p.status === 'IDLE');
        if (availablePlanes.length === 0) {
            this.showError("No tienes aviones disponibles (IDLE) para asignar.");
            return;
        }

        // Hubs del jugador para origen
        const hubs = this.game.state.hubs || {};
        const hubIds = Object.keys(hubs);
        if (hubIds.length === 0) {
            this.showError("Primero selecciona un hub para tu aerolínea.");
            return;
        }

        const hubOptions = hubIds.map(id => {
            const ap = AIRPORTS[id];
            const label = ap ? `${ap.city} (${id})` : id;
            return `<option value="${id}">${label}</option>`;
        }).join('');

        const planeOptions = availablePlanes.map(p => `<option value="${p.instanceId}">${p.baseStats.name} (${p.registration}) - Rango: ${p.baseStats.range}km</option>`).join('');

        const html = `
            <div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="form-group">
                    <label>Origen (solo hubs)</label>
                    <select id="route-origin" class="form-select">${hubOptions}</select>
                </div>
                <div class="form-group">
                    <label>Avión</label>
                    <select id="route-plane" class="form-select">${planeOptions}</select>
                </div>
            </div>
            <div class="form-group" style="margin-top:8px;">
                <label>Destino (filtrado por autonomía y pista)</label>
                <input id="route-dest-search" type="text" placeholder="Buscar ciudad/IATA" class="form-input" style="margin-bottom:8px;" />
                <select id="route-dest" class="form-select"></select>
                <div id="dest-helper" style="font-size:0.8rem;color:#94a3b8;margin-top:6px;"></div>
            </div>

            <div id="route-calc" class="route-preview hidden" style="margin-top:12px;">
                Distancia: <span id="calc-dist">0</span>km · Costo Setup: $<span id="calc-cost">0</span><br>
                Competencia: <span id="calc-comp" style="font-weight:700;">-</span>
            </div>
            
            <div class="form-group" style="margin-top: 16px;">
                <label style="display: block; margin-bottom: 8px;">
                    Estrategia de Precio: <span id="price-value-new" style="color: #3b82f6; font-weight: bold;">100%</span>
                    <span id="rival-price-indicator" style="color: #94a3b8; font-size: 0.85rem;"></span>
                </label>
                <input type="range" id="price-slider-new" min="70" max="150" step="5" value="100" 
                    style="width: 100%; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); outline: none; cursor: pointer;">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; margin-top: 4px;">
                    <span>70% Low-Cost</span>
                    <span>100% Normal</span>
                    <span>150% Premium</span>
                </div>
            </div>
            
            <div id="revenue-preview" style="display: none; background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px; margin-top: 12px;">
                <div style="font-size: 0.85rem; color: #cbd5e1; margin-bottom: 8px;">Vista Previa:</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.85rem;">
                    <div>
                        <span style="color: #94a3b8;">Ingreso Diario:</span>
                        <span id="preview-revenue-new" style="color: #10b981; font-weight: bold; margin-left: 4px;">$0</span>
                    </div>
                    <div>
                        <span style="color: #94a3b8;">Load Factor:</span>
                        <span id="preview-load-new" style="color: #3b82f6; font-weight: bold; margin-left: 4px;">85%</span>
                    </div>
                </div>
            </div>
        `;

        const actions = `<button class="modal-btn btn-primary" id="confirm-route">Crear Ruta</button>`;

        this.showModal("Nueva Ruta", html, actions);

        // Add Listeners directly
        const originSel = document.getElementById('route-origin');
        const destSel = document.getElementById('route-dest');
        const destSearch = document.getElementById('route-dest-search');
        const planeSel = document.getElementById('route-plane');
        const priceSlider = document.getElementById('price-slider-new');
        const priceValue = document.getElementById('price-value-new');
        const rivalPriceIndicator = document.getElementById('rival-price-indicator');
        const revenuePreview = document.getElementById('revenue-preview');
        const previewRevenueNew = document.getElementById('preview-revenue-new');
        const previewLoadNew = document.getElementById('preview-load-new');
        const destHelper = document.getElementById('dest-helper');

        let currentPriceMultiplier = 1.0;
        let feasibleList = [];

        const rebuildDestOptions = () => {
            const origin = originSel.value;
            const planeId = planeSel.value;
            feasibleList = this.game.managers.routes.getFeasibleDestinations(planeId, origin);
            const q = (destSearch.value || '').trim().toLowerCase();
            const filtered = feasibleList.filter(f => {
                if (!q) return true;
                const ap = AIRPORTS[f.id];
                const text = `${ap?.city || ''} ${ap?.name || ''} ${f.id}`.toLowerCase();
                return text.includes(q);
            });
            destSel.innerHTML = filtered.map(f => {
                const ap = AIRPORTS[f.id];
                const label = `${ap?.city || f.id} (${f.id}) · ${f.dist}km · pista ${ap?.runway || f.runway}m`;
                return `<option value="${f.id}">${label}</option>`;
            }).join('');
            if (filtered.length === 0) {
                destHelper.textContent = "No hay destinos factibles con el avión y hub seleccionados.";
            } else {
                destHelper.textContent = `${filtered.length} destinos disponibles`;
            }
        };

        const updateCalc = () => {
            const o = originSel.value;
            const d = destSel.value;
            if (!d) {
                document.getElementById('route-calc').classList.add('hidden');
                return;
            }
            const dist = this.game.managers.routes.getDistance(o, d);
            const cost = 5000 + (dist * 2);
            const planeId = planeSel.value;
            const plane = availablePlanes.find(p => p.instanceId === planeId);

            document.getElementById('calc-dist').textContent = dist;
            document.getElementById('calc-cost').textContent = cost;
            const compEl = document.getElementById('calc-comp');
            if (compEl) {
                const label = this.game.managers.competitors?.getCompetitionLabelForRoute?.(o, d) || 'Baja';
                compEl.textContent = label;
                let color = '#22c55e';
                if (label === 'Media') color = '#f59e0b';
                if (label === 'Alta') color = '#ef4444';
                compEl.style.color = color;
            }
            
            const rivalAvg = this.game.managers.routes.getRivalAveragePrice(o, d);
            const priceDiff = ((currentPriceMultiplier - rivalAvg) / rivalAvg * 100).toFixed(0);
            rivalPriceIndicator.textContent = `(Rivales: ${(rivalAvg * 100).toFixed(0)}%, ${priceDiff > 0 ? '+' : ''}${priceDiff}%)`;
            
            if (plane) {
                const totalSeats = plane.baseStats.seats || 0;
                const seats = {
                    economy: Math.floor(totalSeats * 0.7),
                    premium: Math.floor(totalSeats * 0.2),
                    business: Math.ceil(totalSeats * 0.1)
                };
                const originAp = AIRPORTS[o];
                const destAp = AIRPORTS[d];
                const originDemandFactor = originAp ? Airport.getDemandFactor(originAp) : 1.0;
                const destDemandFactor = destAp ? Airport.getDemandFactor(destAp) : 1.0;
                const revenue = this.game.managers.routes.calculatePotentialRevenue(dist, seats, currentPriceMultiplier, originDemandFactor, destDemandFactor, o, d, 7);
                const loadFactor = this.game.managers.routes.calculateLoadFactorSimple(currentPriceMultiplier);
                previewRevenueNew.textContent = `$${revenue}`;
                previewLoadNew.textContent = `${(loadFactor * 100).toFixed(0)}%`;
                revenuePreview.style.display = 'block';
            }
            document.getElementById('route-calc').classList.remove('hidden');
        };

        const updatePrice = () => {
            currentPriceMultiplier = priceSlider.value / 100;
            priceValue.textContent = `${priceSlider.value}%`;
            updateCalc();
        };

        // Initial build
        rebuildDestOptions();
        updateCalc();

        originSel.addEventListener('change', () => { rebuildDestOptions(); updateCalc(); });
        planeSel.addEventListener('change', () => { rebuildDestOptions(); updateCalc(); });
        destSearch.addEventListener('input', () => { rebuildDestOptions(); });
        destSel.addEventListener('change', updateCalc);
        priceSlider.addEventListener('input', updatePrice);

        document.getElementById('confirm-route').addEventListener('click', () => {
            const o = originSel.value;
            const d = destSel.value;
            const planeId = planeSel.value;
            // Ensure destination is feasible
            const isFeasible = feasibleList.some(f => f.id === d);
            if (!isFeasible) {
                this.showError("Destino no factible para el avión y origen seleccionados.");
                return;
            }
            const result = this.game.managers.routes.createRoute(
                o,
                d,
                planeId,
                currentPriceMultiplier
            );

            if (result.success) {
                this.hideModal();
                this.showError("¡Ruta creada exitosamente!");
                this.renderRoutes();
                this.updateHUD();
            } else {
                this.showError(result.msg);
            }
        });
    }

    // --- LEAFLET MAP MANAGER ---
    initMap() {
        // Si el mapa ya existe, verificar si el contenedor sigue siendo válido
        if (this.map) {
            const homeMapEl = this.getElement('home-map');
            if (homeMapEl && !homeMapEl.hasChildNodes()) {
                // El contenedor está vacío pero el mapa existe, probablemente cambió de vista
                // No destruimos el mapa, solo invalidamos el tamaño para que se ajuste
                this.setTimeout(() => this.map.invalidateSize(), 100);
            }
            return;
        }

        console.log('🗺️ INITIALIZING MAP...');

        // Siempre usar 'home-map' como contenedor principal del mapa
        const mapContainerEl = this.getElement('home-map');
        if (!mapContainerEl) {
            console.error('❌ Map container "home-map" not found');
            return;
        }

        // Initialize Leaflet Map
        // Center roughly on Europe/Atlantic for start
        this.map = L.map('home-map', {
            center: [20, 0],
            zoom: 2,
            minZoom: 2,
            zoomControl: false,
            attributionControl: false
        });

        console.log('🗺️ Map object created');

        // Create tile layers for both themes
        this.mapTileLayers = {
            dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
                subdomains: 'abcd',
                maxZoom: 19
            }),
            light: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
                subdomains: 'abcd',
                maxZoom: 19
            })
        };

        // Add the appropriate tile layer based on current theme
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        this.currentMapTileLayer = currentTheme === 'light' ? this.mapTileLayers.light : this.mapTileLayers.dark;
        this.currentMapTileLayer.addTo(this.map);

        // NO agregar control de zoom de Leaflet - usamos botones personalizados
        // L.control.zoom() se eliminó para evitar controles duplicados

        this.mapLayers = {
            markers: L.layerGroup().addTo(this.map),
            routes: L.layerGroup().addTo(this.map),
            planes: L.layerGroup().addTo(this.map)
        };

        // Track plane markers by route id so we can update positions without recreating
        this.planeMarkers = {};
        
        // Track currently open popup
        this.currentOpenPopup = null;
        this.currentOpenHubPopup = null;
        this.currentOpenAirportPopup = null;

        // Setup map control buttons (buscar tanto en home como en routes por compatibilidad)
        setTimeout(() => {
            const zoomInBtn = document.getElementById('btn-zoom-in-home') || document.getElementById('btn-zoom-in');
            const zoomOutBtn = document.getElementById('btn-zoom-out-home') || document.getElementById('btn-zoom-out');
            
            if (zoomInBtn && this.map) {
                zoomInBtn.onclick = () => this.map.zoomIn();
            }
            if (zoomOutBtn && this.map) {
                zoomOutBtn.onclick = () => this.map.zoomOut();
            }
        }, 100);

        // Add test button listener (DEBUG ONLY)
        setTimeout(() => {
            const testBtn = document.getElementById('btn-test-panel');
            console.log('🔍 Looking for test button...', testBtn);
            if (testBtn) {
                console.log('✅ Test button found! Adding listener...');
                testBtn.onclick = () => {
                    console.log('🧪 ================== TEST BUTTON CLICKED ==================');
                    const routes = this.game.managers.routes.getRoutes();
                    console.log('Routes:', routes);
                    if (routes.length > 0) {
                        const r = routes[0];
                        const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === r.assignedPlane);
                        const orig = AIRPORTS[r.origin];
                        const dest = AIRPORTS[r.dest];
                        console.log('Showing panel for:', r.origin, '->', r.dest);
                        this.showFlightInfoPanel(r, plane, orig, dest, 0.5);
                    } else {
                        console.warn('No routes found');
                        alert('No hay rutas activas. Crea una ruta primero.');
                    }
                };
            } else {
                console.error('❌ Test button NOT found!');
            }
        }, 1000);

        this.updateMap();

    }

    updateMap() {
        if (!this.map) return;

        const routes = this.game.managers.routes.getRoutes();
        const markersLayer = this.mapLayers.markers;
        const routesLayer = this.mapLayers.routes;

        markersLayer.clearLayers();
        routesLayer.clearLayers();

        // 1. Get player level to filter available airports
        const playerLevel = this.game.state.level || 1;
        
        // 2. Get all player-owned hubs (for visual differentiation)
        const playerHubs = new Set();
        if (this.game.state.mainHub) {
            playerHubs.add(this.game.state.mainHub);
        }
        Object.keys(this.game.state.hubs || {}).forEach(hubId => {
            playerHubs.add(hubId);
        });

        // 3. Gather airports with active routes (for route visualization)
        const airportsWithRoutes = new Set();
        routes.forEach(r => {
            airportsWithRoutes.add(r.origin);
            airportsWithRoutes.add(r.dest);
        });

        // 4. Show ALL available airports (unlocked by player level)
        Object.entries(AIRPORTS).forEach(([airportId, airport]) => {
            // Filter by player level - only show unlocked airports
            if (airport.minLevel && airport.minLevel > playerLevel) {
                return; // Skip locked airports
            }

            const isOwned = playerHubs.has(airportId);
            const isMainHub = airportId === this.game.state.mainHub;
            const hasActiveRoutes = airportsWithRoutes.has(airportId);
            
            // Get hub data - mainHub might not be in state.hubs, so handle separately
            let hubData = null;
            if (isOwned) {
                if (this.game.state.hubs && this.game.state.hubs[airportId]) {
                    hubData = this.game.state.hubs[airportId];
                } else if (isMainHub) {
                    // Main hub might not be in hubs object, create basic structure
                    const slotCount = Airport.getSlotCount ? Airport.getSlotCount(airport) : 4;
                    hubData = {
                        id: airportId,
                        name: airport.name,
                        city: airport.city,
                        slots: { used: 0, total: slotCount },
                        dailyFee: this.game.getHubDailyFee ? this.game.getHubDailyFee(airportId) : (2000 + (airport.pop || 0) * 500),
                        level: 1,
                        established: this.game.state.date || Date.now()
                    };
                }
            }
            
            // Different visual style based on ownership and status
            let dotColor, dotGlow, hubLabel;
            if (isMainHub) {
                dotColor = '#fbbf24'; // Gold for main hub
                dotGlow = '#fbbf24';
                hubLabel = ''; // No icon, just the yellow dot and IATA code
            } else if (isOwned) {
                if (hasActiveRoutes) {
                    dotColor = '#4ade80'; // Green for owned hub with routes
                    dotGlow = '#4ade80';
                    hubLabel = '✓';
                } else {
                    dotColor = '#60a5fa'; // Blue for owned hub without routes
                    dotGlow = '#3b82f6';
                    hubLabel = '○';
                }
            } else {
                // Available destination (not owned)
                dotColor = '#94a3b8'; // Gray for available destinations
                dotGlow = '#64748b';
                hubLabel = '';
            }

            // Build label with optional icon
            const labelText = hubLabel ? `${hubLabel} ${airportId}` : airportId;
            
            const icon = L.divIcon({
                className: 'airport-marker clickable',
                html: `<div class="dot" style="background: ${dotColor}; border-color: ${dotColor}; box-shadow: 0 0 10px ${dotGlow};"></div><div class="label">${labelText}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15] // Center
            });

            const title = isMainHub ? 'Hub Principal' : 
                         isOwned ? 'Hub Secundario' : 
                         'Destino Disponible';
            
            const marker = L.marker([airport.lat, airport.lon], { 
                icon: icon,
                title: `${airport.name} (${title})`
            }).addTo(markersLayer);

            // Add click event to show airport/hub info panel
            marker.on('click', (e) => {
                e.originalEvent.stopPropagation();
                if (isOwned) {
                    // Show hub info panel (with ownership data)
                    this.showHubInfoPanel(airportId, airport, isMainHub, hubData, hasActiveRoutes);
                } else {
                    // Show airport info panel (available destination, no ownership)
                    this.showAirportInfoPanel(airportId, airport, playerLevel);
                }
            });
        });

        // 3. Add Route Lines
        routes.forEach(r => {
            const orig = AIRPORTS[r.origin];
            const dest = AIRPORTS[r.dest];
            if (orig && dest) {
                // Simple straight line (Geodesic requires plugin or more logic, straight is fine for now)
                const line = L.polyline(
                    [[orig.lat, orig.lon], [dest.lat, dest.lon]],
                    { color: '#3b82f6', weight: 2, opacity: 0.6 }
                ).addTo(routesLayer);
            }
        });

        // Start animation loop for planes
        if (!this.planeAnimationLoop) {
            this.animatePlanes();
        }
    }

    animatePlanes() {
        if (!this.map) return;
        
        // Respect pause state: don't animate if paused
        if (this.game.managers.time.isPaused) {
            // Still request next frame, but don't update positions
            requestAnimationFrame(() => this.animatePlanes());
            return;
        }

        const routes = this.game.managers.routes.getRoutes();
        const now = this.game.state.date; // Use game time, not real time

        // Store currently open popup if any
        let openPopupRouteId = null;
        if (this.currentOpenPopup) {
            openPopupRouteId = this.currentOpenPopup.routeId;
        }

        if (!this.planeMarkers) this.planeMarkers = {};
        const activeRouteIds = new Set();

        routes.forEach((r, i) => {
            const orig = AIRPORTS[r.origin];
            const dest = AIRPORTS[r.dest];
            if (!orig || !dest) return;

            // Calculate real progress from activeFlight
            let distFactor = 0.5; // Default middle
            const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === r.assignedPlane);
            
            // Determine flight direction and endpoints
            let flightSourceAirport = orig;
            let flightDestAirport = dest;
            
            if (plane && plane.activeFlight) {
                const elapsed = Math.max(0, now - plane.activeFlight.departureTime);
                const duration = plane.activeFlight.duration;
                distFactor = Math.min(1, elapsed / duration);
                
                // Use actual flight endpoints, not route endpoints
                flightSourceAirport = AIRPORTS[plane.activeFlight.source];
                flightDestAirport = AIRPORTS[plane.activeFlight.target];
            } else {
                // Fallback: fake progress based on time for visuals when no active flight
                const speed = 0.0001;
                distFactor = (now * speed + i * 0.2) % 1;
            }

            // Linear interpolation between current flight source and target
            const lat = flightSourceAirport.lat + (flightDestAirport.lat - flightSourceAirport.lat) * distFactor;
            const lng = flightSourceAirport.lon + (flightDestAirport.lon - flightSourceAirport.lon) * distFactor;

            activeRouteIds.add(r.id);

            // Create or update marker without recreating it every frame
            let marker = this.planeMarkers[r.id];
            if (!marker) {
                const planeIcon = L.divIcon({
                    className: 'plane-marker clickable',
                    html: '<svg width="24" height="24" viewBox="0 0 24 24" fill="#3b82f6"><path d="M21,16v-2l-8-5V3.5C13,2.67,12.33,2,11.5,2S10,2.67,10,3.5V9l-8,5v2l8-2.5V19l-2,1.5V22l3.5-1l3.5,1v-1.5L13,19v-5.5L21,16z"/></svg>',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                marker = L.marker([lat, lng], {
                    icon: planeIcon,
                    zIndexOffset: 1000,
                    title: `${orig.id} → ${dest.id}`,
                    interactive: true
                }).addTo(this.mapLayers.planes);

                // Add click event to show info panel
                marker.on('click', (e) => {
                    console.log('✈️ ================== PLANE CLICKED ==================');
                    console.log('Plane clicked:', plane ? plane.registration : 'N/A');
                    console.log('Route:', r.origin, '->', r.dest);
                    e.originalEvent.stopPropagation();
                    this.showFlightInfoPanel(r, plane, orig, dest, distFactor);
                    this.currentOpenPopup = { routeId: r.id };
                });

                this.planeMarkers[r.id] = marker;
            } else {
                marker.setLatLng([lat, lng]);
            }

            // If popup is open for this route, just update progress instead of rebuilding panel
            if (openPopupRouteId === r.id) {
                this.updateFlightInfoProgress(r.id, distFactor);
            }
        });

        // Remove markers for routes that no longer exist
        Object.keys(this.planeMarkers).forEach(routeId => {
            if (!activeRouteIds.has(routeId)) {
                const m = this.planeMarkers[routeId];
                this.mapLayers.planes.removeLayer(m);
                delete this.planeMarkers[routeId];
            }
        });

        requestAnimationFrame(() => this.animatePlanes());
    }

    updateMapTheme(theme) {
        if (!this.map || !this.mapTileLayers) return;
        
        // Remove current tile layer
        if (this.currentMapTileLayer) {
            this.map.removeLayer(this.currentMapTileLayer);
        }
        
        // Add new tile layer based on theme
        this.currentMapTileLayer = theme === 'light' ? this.mapTileLayers.light : this.mapTileLayers.dark;
        this.currentMapTileLayer.addTo(this.map);
        
        console.log(`🗺️ Map theme updated to: ${theme}`);
    }

    showFlightInfoPanel(route, plane, origin, dest, progress) {
        // Close hub panel if open
        const hubPanel = document.getElementById('hub-info-panel');
        if (hubPanel) {
            hubPanel.remove();
            this.currentOpenHubPopup = null;
        }
        
        // Close airport panel if open
        const airportPanel = document.getElementById('airport-info-panel');
        if (airportPanel) {
            airportPanel.remove();
            this.currentOpenAirportPopup = null;
        }
        
        // Reuse existing panel if it belongs to the same route
        let panel = document.getElementById('flight-info-panel');
        if (panel && panel.dataset.routeId !== String(route.id)) {
            panel.remove();
            panel = null;
        }

        const pct = Math.max(0, Math.min(100, Math.round((progress ?? 0) * 100)));
        const panelWasCreated = !panel;
        const hubBase = route.hubBase || this.game.state.mainHub;

        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'flight-info-panel';
            panel.className = 'flight-info-panel';
            document.body.appendChild(panel);
        }

        panel.dataset.routeId = String(route.id);
        
        // Determine actual flight direction from activeFlight
        let flightOrigin = origin;
        let flightDest = dest;
        let flightStatus = "Ida";
        
        if (plane && plane.activeFlight) {
            const flight = plane.activeFlight;
            flightOrigin = AIRPORTS[flight.source];
            flightDest = AIRPORTS[flight.target];
            flightStatus = flight.isOutbound ? "Ida" : "Regreso";
        }
        
        panel.innerHTML = `
            <div class="panel-header">
                <strong><svg width="16" height="16" viewBox="0 0 24 24" fill="white" style="display: inline-block; vertical-align: middle; margin-right: 6px;"><path d="M21,16v-2l-8-5V3.5C13,2.67,12.33,2,11.5,2S10,2.67,10,3.5V9l-8,5v2l8-2.5V19l-2,1.5V22l3.5-1l3.5,1v-1.5L13,19v-5.5L21,16z"/></svg>${plane ? plane.registration : 'N/A'}</strong>
                <button class="panel-close" onclick="this.parentElement.parentElement.remove(); window.app.ui.currentOpenPopup = null;">✕</button>
            </div>
            <div class="panel-body">
                <div class="info-row">
                    <span class="label">Avión:</span>
                    <span class="value">${plane ? plane.baseStats.name : 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="label">Segmento:</span>
                    <span class="value" style="color: #f59e0b; font-weight: bold;">${flightStatus}</span>
                </div>
                <div class="info-row">
                    <span class="label">Ruta:</span>
                    <span class="value">${flightOrigin ? flightOrigin.city : 'N/A'} → ${flightDest ? flightDest.city : 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="label">Código:</span>
                    <span class="value">${flightOrigin ? flightOrigin.id : 'N/A'} → ${flightDest ? flightDest.id : 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="label">Hub Base:</span>
                    <span class="value">${hubBase}</span>
                </div>
                <div class="info-row">
                    <span class="label">Distancia:</span>
                    <span class="value">${route.distance} km</span>
                </div>
                <div class="info-row">
                    <span class="label">Competencia:</span>
                    <span class="value" style="color: ${this.getCompetitionDescriptorColor(origin.id, dest.id)};">${this.getCompetitionDescriptorLabel(origin.id, dest.id)}</span>
                </div>
                <div class="info-row">
                    <span class="label">Progreso:</span>
                    <span class="value">
                        <div style="background: rgba(255,255,255,0.1); border-radius: 4px; height: 6px; width: 120px; overflow: hidden;">
                            <div class="flight-progress-bar" style="background: #4ade80; height: 100%; width: ${pct}%; transition: width 0.2s ease;"></div>
                        </div>
                        <span class="flight-progress-text">${pct}%</span>
                    </span>
                </div>
                <div class="info-row">
                    <span class="label">Ingresos/día:</span>
                    <span class="value" style="color: #4ade80;">$${route.dailyRevenue.toLocaleString()}</span>
                </div>
                <div class="info-row">
                    <span class="label">Condición:</span>
                    <span class="value" style="color: ${plane && plane.condition > 70 ? '#4ade80' : plane && plane.condition > 40 ? '#fbbf24' : '#f87171'};">${plane ? Math.round(plane.condition) : 'N/A'}%</span>
                </div>
            </div>
        `;

        this.currentOpenPopup = { routeId: route.id };

        if (panelWasCreated) {
            setTimeout(() => panel.classList.add('visible'), 10);
        }
    }

    getCompetitionDescriptorLabel(originId, destId) {
        const label = this.game.managers.competitors?.getCompetitionLabelForRoute?.(originId, destId) || 'Baja';
        return label;
    }

    getCompetitionDescriptorColor(originId, destId) {
        const label = this.getCompetitionDescriptorLabel(originId, destId);
        if (label === 'Alta') return '#ef4444';
        if (label === 'Media') return '#f59e0b';
        return '#22c55e';
    }

    updateFlightInfoProgress(routeId, progress) {
        const panel = document.getElementById('flight-info-panel');
        if (!panel) return;
        if (panel.dataset.routeId && panel.dataset.routeId !== String(routeId)) return;

        const pct = Math.max(0, Math.min(100, Math.round((progress ?? 0) * 100)));
        const bar = panel.querySelector('.flight-progress-bar');
        if (bar) bar.style.width = `${pct}%`;

        const text = panel.querySelector('.flight-progress-text');
        if (text) text.textContent = `${pct}%`;
    }

    showHubInfoPanel(hubId, airport, isMainHub, hubData, hasActiveRoutes) {
        // Close flight panel if open
        const flightPanel = document.getElementById('flight-info-panel');
        if (flightPanel) {
            flightPanel.remove();
            this.currentOpenPopup = null;
        }
        
        // Close airport panel if open
        const airportPanel = document.getElementById('airport-info-panel');
        if (airportPanel) {
            airportPanel.remove();
            this.currentOpenAirportPopup = null;
        }
        
        // Close any existing hub panel for a different hub
        const existingHubPanel = document.getElementById('hub-info-panel');
        if (existingHubPanel && existingHubPanel.dataset.hubId !== hubId) {
            existingHubPanel.remove();
        }

        // Reuse existing hub panel if it's for the same hub
        let panel = document.getElementById('hub-info-panel');
        if (panel && panel.dataset.hubId !== hubId) {
            panel.remove();
            panel = null;
        }

        const panelWasCreated = !panel;

        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'hub-info-panel';
            panel.className = 'flight-info-panel'; // Reuse same CSS class
            document.body.appendChild(panel);
        }

        panel.dataset.hubId = hubId;

        // Get routes from this hub
        const routes = this.game.managers.routes.getRoutes();
        const hubRoutes = routes.filter(r => r.origin === hubId || r.dest === hubId);
        const routesFromHub = routes.filter(r => r.origin === hubId);
        const routesToHub = routes.filter(r => r.dest === hubId);

        // Calculate hub stats
        const slotsUsed = hubData?.slots?.used || 0;
        const slotsTotal = hubData?.slots?.total || 0;
        let dailyFee = 0;
        if (hubData && hubData.dailyFee) {
            dailyFee = hubData.dailyFee;
        } else if (this.game.getHubDailyFee) {
            dailyFee = this.game.getHubDailyFee(hubId);
        } else {
            // Fallback calculation
            const pop = airport.pop || 0;
            dailyFee = 2000 + (pop * 500);
        }
        const establishedDate = hubData?.established ? new Date(hubData.established) : null;
        const daysSinceEstablished = establishedDate ? Math.floor((this.game.state.date - hubData.established) / (1000 * 60 * 60 * 24)) : null;

        // Calculate daily revenue from routes
        const dailyRevenue = hubRoutes.reduce((sum, r) => sum + (r.dailyRevenue || 0), 0);
        
        // Get airport category
        const categoryLabel = airport.category ? airport.category.replace('-', ' ').toUpperCase() : 'N/A';
        const categoryIcon = airport.category === 'mega-hub' ? '🌟' : 
                            airport.category === 'major-hub' ? '⭐' : '';

        const formatter = this.formatters.currency;

        // Show category icon only if not main hub, or show main hub icon instead
        const headerIcon = isMainHub ? '⭐' : (categoryIcon || '');
        
        panel.innerHTML = `
            <div class="panel-header">
                <strong><span style="margin-right: 6px;">${headerIcon}</span>${airport.name}</strong>
                <button class="panel-close" onclick="this.parentElement.parentElement.remove(); window.app.ui.currentOpenHubPopup = null;">✕</button>
            </div>
            <div class="panel-body">
                <div class="info-row">
                    <span class="label">Código IATA:</span>
                    <span class="value" style="font-family: monospace; font-weight: bold;">${hubId}</span>
                </div>
                <div class="info-row">
                    <span class="label">Tipo:</span>
                    <span class="value" style="color: ${isMainHub ? '#fbbf24' : '#60a5fa'};">
                        ${isMainHub ? '⭐ Hub Principal' : 'Hub Secundario'}
                    </span>
                </div>
                <div class="info-row">
                    <span class="label">Ciudad:</span>
                    <span class="value">${airport.city}, ${airport.country}</span>
                </div>
                <div class="info-row">
                    <span class="label">Categoría:</span>
                    <span class="value">${categoryIcon} ${categoryLabel}</span>
                </div>
                <div class="info-row">
                    <span class="label">Población:</span>
                    <span class="value">${airport.pop || 'N/A'}M</span>
                </div>
                <div class="info-row">
                    <span class="label">Región:</span>
                    <span class="value">${airport.region || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="label">Slots:</span>
                    <span class="value" style="color: ${slotsUsed >= slotsTotal ? '#ef4444' : slotsUsed >= slotsTotal * 0.8 ? '#f59e0b' : '#22c55e'};">
                        ${slotsUsed} / ${slotsTotal}
                    </span>
                </div>
                <div class="info-row">
                    <span class="label">Tarifa diaria:</span>
                    <span class="value">${formatter.format(dailyFee)}</span>
                </div>
                ${establishedDate ? `
                <div class="info-row">
                    <span class="label">Establecido:</span>
                    <span class="value">Hace ${daysSinceEstablished} días</span>
                </div>
                ` : ''}
                <div class="info-row">
                    <span class="label">Rutas activas:</span>
                    <span class="value" style="color: ${hasActiveRoutes ? '#22c55e' : '#94a3b8'};">
                        ${hubRoutes.length} ${hubRoutes.length === 1 ? 'ruta' : 'rutas'}
                    </span>
                </div>
                ${routesFromHub.length > 0 ? `
                <div class="info-row">
                    <span class="label">Salidas:</span>
                    <span class="value">${routesFromHub.length}</span>
                </div>
                ` : ''}
                ${routesToHub.length > 0 ? `
                <div class="info-row">
                    <span class="label">Llegadas:</span>
                    <span class="value">${routesToHub.length}</span>
                </div>
                ` : ''}
                ${dailyRevenue > 0 ? `
                <div class="info-row">
                    <span class="label">Ingresos/día:</span>
                    <span class="value" style="color: #4ade80;">${formatter.format(dailyRevenue)}</span>
                </div>
                ` : ''}
            </div>
        `;

            this.currentOpenHubPopup = { hubId: hubId };

        if (panelWasCreated) {
            setTimeout(() => panel.classList.add('visible'), 10);
        }
    }

    showAirportInfoPanel(airportId, airport, playerLevel) {
        // Close flight panel if open
        const flightPanel = document.getElementById('flight-info-panel');
        if (flightPanel) {
            flightPanel.remove();
            this.currentOpenPopup = null;
        }
        
        // Close hub panel if open
        const hubPanel = document.getElementById('hub-info-panel');
        if (hubPanel) {
            hubPanel.remove();
            this.currentOpenHubPopup = null;
        }

        // Reuse existing airport panel if it's for the same airport
        let panel = document.getElementById('airport-info-panel');
        if (panel && panel.dataset.airportId !== airportId) {
            panel.remove();
            panel = null;
        }

        const panelWasCreated = !panel;

        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'airport-info-panel';
            panel.className = 'flight-info-panel'; // Reuse same CSS class
            document.body.appendChild(panel);
        }

        panel.dataset.airportId = airportId;

        // Get routes TO/FROM this airport (if any exist)
        const routes = this.game.managers.routes.getRoutes();
        const routesFromAirport = routes.filter(r => r.origin === airportId);
        const routesToAirport = routes.filter(r => r.dest === airportId);
        const totalRoutes = routesFromAirport.length + routesToAirport.length;

        // Check if airport is unlocked for current level
        const isUnlocked = !airport.minLevel || airport.minLevel <= playerLevel;
        const unlockInfo = airport.minLevel && airport.minLevel > playerLevel ? 
            `Requiere Nivel ${airport.minLevel}` : 'Disponible';

        // Calculate estimated daily fee if opened as hub
        const estimatedDailyFee = this.game.getHubDailyFee ? this.game.getHubDailyFee(airportId) : (2000 + (airport.pop || 0) * 500);
        const formatter = this.formatters.currency;

        // Get airport category
        const categoryLabel = airport.category ? airport.category.replace('-', ' ').toUpperCase() : 'N/A';
        const categoryIcon = airport.category === 'mega-hub' ? '🌟' : 
                            airport.category === 'major-hub' ? '⭐' : '';

        panel.innerHTML = `
            <div class="panel-header">
                <strong><span style="margin-right: 6px;">${categoryIcon}</span>${airport.name}</strong>
                <button class="panel-close" onclick="this.parentElement.parentElement.remove(); window.app.ui.currentOpenAirportPopup = null;">✕</button>
            </div>
            <div class="panel-body">
                <div class="info-row">
                    <span class="label">Código IATA:</span>
                    <span class="value" style="font-family: monospace; font-weight: bold;">${airportId}</span>
                </div>
                <div class="info-row">
                    <span class="label">Estado:</span>
                    <span class="value" style="color: ${isUnlocked ? '#94a3b8' : '#f59e0b'};">
                        ${isUnlocked ? '📍 Destino Disponible' : '🔒 ' + unlockInfo}
                    </span>
                </div>
                <div class="info-row">
                    <span class="label">Ciudad:</span>
                    <span class="value">${airport.city}, ${airport.country}</span>
                </div>
                <div class="info-row">
                    <span class="label">Región:</span>
                    <span class="value">${airport.region || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="label">Categoría:</span>
                    <span class="value">${categoryIcon} ${categoryLabel}</span>
                </div>
                <div class="info-row">
                    <span class="label">Población:</span>
                    <span class="value">${airport.pop || 'N/A'}M</span>
                </div>
                ${airport.runway ? `
                <div class="info-row">
                    <span class="label">Pista (m):</span>
                    <span class="value">${airport.runway.toLocaleString()}</span>
                </div>
                ` : ''}
                ${airport.annualPax ? `
                <div class="info-row">
                    <span class="label">Pasajeros/año:</span>
                    <span class="value">${(airport.annualPax / 1000000).toFixed(1)}M</span>
                </div>
                ` : ''}
                ${totalRoutes > 0 ? `
                <div class="info-row">
                    <span class="label">Rutas conectadas:</span>
                    <span class="value" style="color: #22c55e;">${totalRoutes} ${totalRoutes === 1 ? 'ruta' : 'rutas'}</span>
                </div>
                ${routesFromAirport.length > 0 ? `
                <div class="info-row">
                    <span class="label">Salidas:</span>
                    <span class="value">${routesFromAirport.length}</span>
                </div>
                ` : ''}
                ${routesToAirport.length > 0 ? `
                <div class="info-row">
                    <span class="label">Llegadas:</span>
                    <span class="value">${routesToAirport.length}</span>
                </div>
                ` : ''}
                ` : `
                <div class="info-row">
                    <span class="label">Rutas conectadas:</span>
                    <span class="value" style="color: #94a3b8;">0 rutas</span>
                </div>
                `}
                ${isUnlocked ? `
                <div class="info-row" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <span class="label" style="font-weight: 600;">Est. tarifa/día:</span>
                    <span class="value" style="color: #60a5fa; font-weight: 600;">${formatter.format(estimatedDailyFee)}</span>
                </div>
                ` : ''}
            </div>
        `;

        this.currentOpenAirportPopup = { airportId: airportId };

        if (panelWasCreated) {
            setTimeout(() => panel.classList.add('visible'), 10);
        }
    }

    showError(msg) {
        // Simple toast or alert
        alert(msg);
    }

    showRoutePricingModal(routeId) {
        const route = this.game.managers.routes.getRoutes().find(r => r.id === routeId);
        if (!route) return;

        const currentPrice = route.priceMultiplier || 1.0;
        const currentFrequency = route.frequency || 7;
        const rivalAvg = this.game.managers.routes.getRivalAveragePrice(route.origin, route.dest);
        const currentYield = this.game.managers.routes.calculateYield(route);
        
        // Calculate MARKET demand by class (independent of our seats)
        const originAp = this.game.managers.routes.getAirport(route.origin);
        const destAp = this.game.managers.routes.getAirport(route.dest);
        const originPop = originAp?.pop || 1;
        const destPop = destAp?.pop || 1;
        
        // Base weekly market demand (depends on city sizes and distance)
        const avgPop = (originPop + destPop) / 2;
        const distanceFactor = route.distance < 500 ? 1.5 : route.distance < 2000 ? 1.2 : 1.0; // Short routes have more demand
        const baseWeeklyDemand = Math.round(avgPop * 1000 * distanceFactor); // passengers per week in total market
        
        // Class distribution based on route distance
        // Short routes (<500km): 85% Economy, 12% Premium, 3% Business
        // Medium (500-2000km): 75% Economy, 18% Premium, 7% Business
        // Long (>2000km): 65% Economy, 22% Premium, 13% Business
        let ecoShare, premShare, bizShare;
        if (route.distance < 500) {
            ecoShare = 0.85; premShare = 0.12; bizShare = 0.03;
        } else if (route.distance < 2000) {
            ecoShare = 0.75; premShare = 0.18; bizShare = 0.07;
        } else {
            ecoShare = 0.65; premShare = 0.22; bizShare = 0.13;
        }
        
        const totalMarketDemandEconomy = Math.round(baseWeeklyDemand * ecoShare);
        const totalMarketDemandPremium = Math.round(baseWeeklyDemand * premShare);
        const totalMarketDemandBusiness = Math.round(baseWeeklyDemand * bizShare);
        
        // Our market share (based on price, reputation, competitors)
        const loadFactor = this.game.managers.routes.calculateLoadFactorSimple(currentPrice);
        const competitorCount = this.game.managers.competitors?.getCompetitorsOnRoute?.(route.origin, route.dest)?.length || 2;
        const baseMarketShare = 1 / (competitorCount + 1); // Equal share if all equal
        const ourMarketShare = baseMarketShare * (loadFactor / 0.85); // Adjusted by our pricing/reputation
        
        // Our captured demand (what we actually get from the market)
        const demandEconomy = Math.round(totalMarketDemandEconomy * ourMarketShare);
        const demandPremium = Math.round(totalMarketDemandPremium * ourMarketShare);
        const demandBusiness = Math.round(totalMarketDemandBusiness * ourMarketShare);
        
        const seatsEconomy = route.seats.economy * currentFrequency;
        const seatsPremium = route.seats.premium * currentFrequency;
        const seatsBusiness = route.seats.business * currentFrequency;
        
        // Calculate preview data
        const calculatePreview = (multiplier, frequency) => {
            const newRevenue = this.game.managers.routes.calculatePotentialRevenue(
                route.distance,
                route.seats,
                multiplier,
                1.0, 1.0,
                route.origin,
                route.dest,
                frequency
            );
            const newLoadFactor = this.game.managers.routes.calculateLoadFactorSimple(multiplier);
            
            // Calculate new yield
            const baseTicket = 50 + (route.distance * 0.12);
            const avgTicket = (baseTicket * multiplier * (
                route.seats.economy * 1.0 +
                route.seats.premium * 2.2 +
                route.seats.business * 4.0
            )) / (route.seats.economy + route.seats.premium + route.seats.business);
            const newYield = (avgTicket * newLoadFactor) / route.distance;
            
            return { revenue: newRevenue, loadFactor: newLoadFactor, yield: newYield };
        };

        let previewMultiplier = currentPrice;
        let previewFrequency = currentFrequency;
        let preview = calculatePreview(previewMultiplier, previewFrequency);

        // Obtener eventos recientes (últimos 7 días)
        const recentEvents = this.game.managers.routes.getRouteEvents(routeId, 7) || [];
        let eventsHTML = '';
        if (recentEvents.length > 0) {
            eventsHTML = `
                <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin: 16px 0;">
                    <h3 style="margin-top: 0; font-size: 1rem; color: #cbd5e1;">📋 Eventos Recientes (7 días)</h3>
                    <div style="max-height: 150px; overflow-y: auto;">
            `;
            recentEvents.forEach(e => {
                const date = new Date(e.timestamp).toLocaleDateString('es-ES');
                let icon = '📝';
                let color = '#64748b';
                if (e.type === 'cancellation') { icon = '❌'; color = '#ef4444'; }
                else if (e.type === 'delay') { icon = '⏰'; color = '#f59e0b'; }
                else if (e.type === 'overbooking') { icon = '📈'; color = '#8b5cf6'; }
                
                eventsHTML += `
                    <div style="padding: 8px; border-left: 3px solid ${color}; margin-bottom: 8px; background: rgba(255,255,255,0.02);">
                        <div style="font-size: 0.85rem; color: ${color}; font-weight: bold;">${icon} ${e.message}</div>
                        <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">${date}</div>
                    </div>
                `;
            });
            eventsHTML += `</div></div>`;
        }

        // Helpers for metrics
        const formatDuration = (hours) => {
            if (!isFinite(hours)) return '—';
            const totalMin = Math.max(0, Math.round(hours * 60));
            const h = Math.floor(totalMin / 60);
            const m = totalMin % 60;
            return `${h}h ${String(m).padStart(2, '0')}m`;
        };

        const calcPerFlightEconomics = (plane) => {
            const seatsObj = plane.configuration && plane.configuration.economy ? {
                economy: plane.configuration.economy,
                premium: plane.configuration.premium,
                business: plane.configuration.business
            } : (() => {
                const totalSeats = plane.baseStats.seats || 0;
                return {
                    economy: Math.floor(totalSeats * 0.7),
                    premium: Math.floor(totalSeats * 0.2),
                    business: Math.ceil(totalSeats * 0.1)
                };
            })();

            const { originDemandFactor, destDemandFactor } = this.game.managers.routes.getDemandFactors(route.origin, route.dest);
            const perDay = this.game.managers.routes.calculatePotentialRevenue(
                route.distance,
                seatsObj,
                route.priceMultiplier || 1.0,
                originDemandFactor,
                destDemandFactor,
                route.origin,
                route.dest,
                route.frequency || 7
            );
            const perFlight = perDay / Math.max(1, (route.frequency || 7) / 7);
            return Math.floor(perFlight);
        };

        // Build assignments management UI
        const assignments = Array.isArray(route.assignments) && route.assignments.length > 0
            ? route.assignments
            : (route.assignedPlane ? [{ planeId: route.assignedPlane }] : []);

        const renderAssignmentRow = (a) => {
            const p = this.game.managers.fleet.ownedPlanes.find(pp => pp.instanceId === a.planeId);
            if (!p) return '';
            const rev = this.computePlaneDailyRevenue(p, route);
            const costs = this.calculateAircraftDailyCosts(p, route);
            const profit = rev - (costs.total || 0);
            const durationHours = (route.distance || 0) / (p.baseStats?.speed || 1);
            const margin = (p.baseStats?.range || 0) - (route.distance || 0);
            const loadFactor = this.game.managers.routes.calculateLoadFactorByReputation(route.origin, route.dest, route.priceMultiplier || 1.0);
            const perFlightRevenue = calcPerFlightEconomics(p);
            const perFlightCost = (costs.total || 0) / Math.max(1, (route.frequency || 7) / 7);
            const perFlightProfit = perFlightRevenue - perFlightCost;
            const riskLabel = p.condition >= 80 ? 'Bajo' : p.condition >= 60 ? 'Medio' : 'Alto';
            const riskColor = p.condition >= 80 ? '#10b981' : p.condition >= 60 ? '#f59e0b' : '#ef4444';
            return `
                <tr>
                    <td>${p.registration}</td>
                    <td>${p.baseStats.name}</td>
                    <td>${Math.round(p.condition)}%</td>
                    <td>$${rev.toLocaleString()}</td>
                    <td>-$${(costs.total || 0).toLocaleString()}</td>
                    <td style="font-weight:600; color:${profit>=0?'#10b981':'#ef4444'};">${profit>=0?'+':'-'}$${Math.abs(profit).toLocaleString()}</td>
                    <td>
                        <div style="display:grid; grid-template-columns: repeat(2, minmax(120px,1fr)); gap:6px 10px; font-size:0.78rem; color:#cbd5e1; min-width:220px;">
                            <div style="display:flex; justify-content:space-between;"><span>Duración</span><span>${formatDuration(durationHours)}</span></div>
                            <div style="display:flex; justify-content:space-between; color:${margin < route.distance*0.15 ? '#f59e0b' : '#cbd5e1'};"><span>Margen</span><span>${margin.toLocaleString()} km</span></div>
                            <div style="display:flex; justify-content:space-between;"><span>LF prev.</span><span>${Math.round((loadFactor||0)*100)}%</span></div>
                            <div style="display:flex; justify-content:space-between;"><span>$/vuelo</span><span>$${perFlightRevenue.toLocaleString()}</span></div>
                            <div style="display:flex; justify-content:space-between; color:${perFlightProfit>=0?'#10b981':'#ef4444'};"><span>Margen/vuelo</span><span>${perFlightProfit>=0?'+':'-'}$${Math.abs(perFlightProfit).toLocaleString()}</span></div>
                            <div style="display:flex; justify-content:space-between; color:${riskColor};"><span>Riesgo</span><span>${riskLabel}</span></div>
                        </div>
                    </td>
                    <td><button class="btn-remove-assignment" data-plane-id="${p.instanceId}" style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:6px 10px;cursor:pointer;">Quitar</button></td>
                </tr>
            `;
        };

        // Build add-assignment selector with compatible idle planes
        const compatibleIdlePlanes = this.game.managers.fleet.ownedPlanes.filter(p => {
            if (p.status !== 'IDLE') return false;
            if ((p.condition || 0) < 40) return false;
            if ((p.baseStats?.range || 0) < (route.distance || 0)) return false;
            const originAp = this.game.managers.routes.getAirport(route.origin);
            const destAp = this.game.managers.routes.getAirport(route.dest);
            if (!originAp || !destAp) return false;
            if ((p.baseStats?.runway || Infinity) > originAp.runway) return false;
            if ((p.baseStats?.runway || Infinity) > destAp.runway) return false;
            // Not assigned to any other route
            const activeRoute = this.game.managers.routes.getPlaneActiveRoute?.(p.instanceId);
            if (activeRoute) return false;
            // Not already in this route assignments
            if (assignments.some(a => a.planeId === p.instanceId)) return false;
            return true;
        });

        const addOptions = compatibleIdlePlanes.length > 0
            ? compatibleIdlePlanes.map(p => `<option value="${p.instanceId}">${p.baseStats.name} • ${p.registration} • Alcance ${p.baseStats.range}km</option>`).join('')
            : '';

        const assignmentsHTML = `
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin: 16px 0;">
                <h3 style="margin-top: 0; font-size: 1rem; color: #cbd5e1;">Asignaciones de Aeronaves</h3>
                <div style="display:flex; gap:12px; flex-wrap:wrap; font-size:0.82rem; color:#cbd5e1; margin-bottom:8px;">
                    <span>Distancia: <strong>${route.distance.toLocaleString()} km</strong></span>
                    <span>Frecuencia: <strong>${route.frequency || 7} /sem</strong></span>
                    <span>Slots usados: <strong>${(route.assignments?.length || 1) * 2}</strong> (origen+destino)</span>
                </div>
                ${assignments.length === 0 ? `<div style="color:#94a3b8;font-size:0.9rem;">Sin aeronaves asignadas a esta ruta.</div>` : `
                <div style="overflow:auto;">
                    <table style="width:100%; border-collapse: collapse; font-size: 0.85rem;">
                        <thead>
                            <tr style="color:#94a3b8; text-align:left;">
                                <th style="padding:6px 8px; border-bottom:1px solid rgba(255,255,255,0.1);">Registro</th>
                                <th style"padding:6px 8px; border-bottom:1px solid rgba(255,255,255,0.1);">Modelo</th>
                                <th style="padding:6px 8px; border-bottom:1px solid rgba(255,255,255,0.1);">Cond.</th>
                                <th style="padding:6px 8px; border-bottom:1px solid rgba(255,255,255,0.1);">Ing/día</th>
                                <th style="padding:6px 8px; border-bottom:1px solid rgba(255,255,255,0.1);">Cost/día</th>
                                <th style="padding:6px 8px; border-bottom:1px solid rgba(255,255,255,0.1);">Ben/día</th>
                                <th style="padding:6px 8px; border-bottom:1px solid rgba(255,255,255,0.1);">Ops/Flight</th>
                                <th style="padding:6px 8px; border-bottom:1px solid rgba(255,255,255,0.1);"></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${assignments.map(renderAssignmentRow).join('')}
                        </tbody>
                    </table>
                </div>
                `}
                <div style="display:flex; gap:8px; align-items:center; margin-top:12px;">
                    <select id="add-assignment-select" style="flex:1; padding:10px; border-radius:8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color:#fff;" ${compatibleIdlePlanes.length===0?'disabled':''}>
                        ${addOptions || '<option value="">No hay aviones IDLE compatibles</option>'}
                    </select>
                    <button id="add-assignment-btn" class="modal-btn btn-primary" ${compatibleIdlePlanes.length===0?'disabled':''}>Añadir Avión</button>
                </div>
            </div>
        `;

        const contentHTML = `
            <div style="max-width: 100%;">
                <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin: 16px 0;">
                    <h3 style="margin-top: 0; font-size: 1rem; color: #cbd5e1; margin-bottom: 8px;">📊 Demanda Capturada vs Capacidad (semanal)</h3>
                    <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 12px;">
                        💡 Mercado total: ${baseWeeklyDemand.toLocaleString()} pax/sem • 
                        Tu cuota: ${(ourMarketShare * 100).toFixed(1)}% (${competitorCount} rivales) • 
                        LF objetivo: ${(loadFactor * 100).toFixed(0)}%
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 0.85rem;">
                        <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; padding: 10px;">
                            <div style="color: #94a3b8; font-size: 0.75rem; margin-bottom: 4px;">Economy (Y)</div>
                            <div style="color: #10b981; font-weight: 700; font-size: 1.1rem;">${demandEconomy.toLocaleString()} / ${seatsEconomy}</div>
                            <div style="color: #cbd5e1; font-size: 0.7rem; margin-top: 2px;">${route.seats.economy} asientos × ${currentFrequency} vuelos</div>
                            <div style="color: #64748b; font-size: 0.65rem; margin-top: 2px;">Mercado: ${totalMarketDemandEconomy.toLocaleString()}</div>
                        </div>
                        <div style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 8px; padding: 10px;">
                            <div style="color: #94a3b8; font-size: 0.75rem; margin-bottom: 4px;">Premium (W)</div>
                            <div style="color: #f59e0b; font-weight: 700; font-size: 1.1rem;">${demandPremium.toLocaleString()} / ${seatsPremium}</div>
                            <div style="color: #cbd5e1; font-size: 0.7rem; margin-top: 2px;">${route.seats.premium} asientos × ${currentFrequency} vuelos</div>
                            <div style="color: #64748b; font-size: 0.65rem; margin-top: 2px;">Mercado: ${totalMarketDemandPremium.toLocaleString()}</div>
                        </div>
                        <div style="background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); border-radius: 8px; padding: 10px;">
                            <div style="color: #94a3b8; font-size: 0.75rem; margin-bottom: 4px;">Business (J)</div>
                            <div style="color: #8b5cf6; font-weight: 700; font-size: 1.1rem;">${demandBusiness.toLocaleString()} / ${seatsBusiness}</div>
                            <div style="color: #cbd5e1; font-size: 0.7rem; margin-top: 2px;">${route.seats.business} asientos × ${currentFrequency} vuelos</div>
                            <div style="color: #64748b; font-size: 0.65rem; margin-top: 2px;">Mercado: ${totalMarketDemandBusiness.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
                
                <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin: 16px 0;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                        <div>
                            <div style="font-size: 0.8rem; color: #94a3b8;">Precio Actual</div>
                            <div style="font-size: 1.3rem; font-weight: bold; color: #3b82f6;">${(currentPrice * 100).toFixed(0)}%</div>
                        </div>
                        <div>
                            <div style="font-size: 0.8rem; color: #94a3b8;">Promedio Rivales</div>
                            <div style="font-size: 1.3rem; font-weight: bold; color: #f59e0b;">${(rivalAvg * 100).toFixed(0)}%</div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 0.9rem; margin-bottom: 8px; color: #cbd5e1;">
                            Multiplicador de Precio: <span id="price-value" style="color: #3b82f6; font-weight: bold;">${(previewMultiplier * 100).toFixed(0)}%</span>
                        </label>
                        <input type="range" id="price-slider" min="70" max="150" step="5" value="${previewMultiplier * 100}" 
                            style="width: 100%; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); outline: none; cursor: pointer;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; margin-top: 4px;">
                            <span>70% (Low-Cost)</span>
                            <span>100% (Normal)</span>
                            <span>150% (Premium)</span>
                        </div>
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.9rem; margin-bottom: 8px; color: #cbd5e1;">
                            ✈️ Frecuencia de Vuelos
                        </label>
                        <select id="frequency-selector" style="width: 100%; padding: 10px; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 0.95rem;">
                            <option value="1" ${currentFrequency === 1 ? 'selected' : ''}>1 vuelo/semana</option>
                            <option value="2" ${currentFrequency === 2 ? 'selected' : ''}>2 vuelos/semana</option>
                            <option value="3" ${currentFrequency === 3 ? 'selected' : ''}>3 vuelos/semana</option>
                            <option value="7" ${currentFrequency === 7 ? 'selected' : ''}>Diario (7 vuelos/semana)</option>
                            <option value="14" ${currentFrequency === 14 ? 'selected' : ''}>2 vuelos/día (14/semana)</option>
                        </select>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin: 16px 0;">
                    <h3 style="margin-top: 0; font-size: 1rem; color: #cbd5e1;">Vista Previa</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; text-align: center;">
                        <div>
                            <div style="font-size: 0.75rem; color: #94a3b8;">Ingreso Diario</div>
                            <div id="preview-revenue" style="font-size: 1.1rem; font-weight: bold; color: #10b981;">$${preview.revenue}</div>
                            <div id="preview-revenue-change" style="font-size: 0.7rem; color: #64748b;"></div>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: #94a3b8;">Load Factor</div>
                            <div id="preview-load" style="font-size: 1.1rem; font-weight: bold; color: #3b82f6;">${(preview.loadFactor * 100).toFixed(0)}%</div>
                            <div id="preview-load-change" style="font-size: 0.7rem; color: #64748b;"></div>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: #94a3b8;">Yield</div>
                            <div id="preview-yield" style="font-size: 1.1rem; font-weight: bold; color: #8b5cf6;">$${preview.yield.toFixed(2)}</div>
                            <div id="preview-yield-change" style="font-size: 0.7rem; color: #64748b;"></div>
                        </div>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin: 16px 0;">
                    <h3 style="margin-top: 0; font-size: 1rem; color: #cbd5e1;">🎯 Optimización de Yield</h3>
                    <div style="font-size: 0.85rem; color: #cbd5e1; margin-bottom: 12px;">
                        Sistema automático analiza diferentes configuraciones de asientos y recomienda la que maximiza ingresos ($/pax/km).
                    </div>
                    <button id="btn-optimize-yield" class="modal-btn btn-primary" style="width: 100%; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border: none; color: white; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 700; transition: all 0.2s;">
                        📊 Analizar & Optimizar
                    </button>
                    <div id="yield-recommendation" style="margin-top: 12px; display: none;">
                        <div style="background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.3); border-radius: 8px; padding: 12px;">
                            <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 6px;">RECOMENDACIÓN</div>
                            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; font-size: 0.8rem;">
                                <div style="text-align: center;">
                                    <div style="color: #cbd5e1;">Economy</div>
                                    <div class="rec-economy" style="color: #8b5cf6; font-weight: 700; font-size: 1.1rem;">-</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="color: #cbd5e1;">Premium</div>
                                    <div class="rec-premium" style="color: #8b5cf6; font-weight: 700; font-size: 1.1rem;">-</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="color: #cbd5e1;">Business</div>
                                    <div class="rec-business" style="color: #8b5cf6; font-weight: 700; font-size: 1.1rem;">-</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="color: #cbd5e1;">Yield</div>
                                    <div class="rec-yield" style="color: #8b5cf6; font-weight: 700; font-size: 1.1rem;">-</div>
                                </div>
                            </div>
                            <div class="rec-name" style="color: #cbd5e1; font-size: 0.8rem; margin-top: 8px; text-align: center; font-style: italic;">-</div>
                            <button id="btn-apply-recommendation" class="modal-btn btn-primary" style="width: 100%; margin-top: 12px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border: none; color: white; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.85rem;">
                                ✨ Aplicar Recomendación
                            </button>
                        </div>
                    </div>
                </div>

                ${eventsHTML}

                ${assignmentsHTML}

                <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 12px; margin: 16px 0; font-size: 0.85rem; color: #93c5fd;">
                    💡 <strong>Tip:</strong> Precios bajos aumentan ocupación pero reducen ingreso por pasajero. Mayor frecuencia aumenta costos pero mejora ingresos totales.
                </div>
            </div>
        `;

        const actionsHTML = `
            <button class="modal-btn btn-danger" id="btn-delete-route" style="background:#ef4444;">Eliminar Ruta</button>
            <button class="modal-btn btn-secondary" id="btn-cancel-pricing">Cancelar</button>
            <button class="modal-btn btn-primary" id="btn-apply-pricing">Aplicar Cambios</button>
        `;

        this.showModal(`Ajustar Ruta - ${route.origin} ➔ ${route.dest}`, contentHTML, actionsHTML);

        // Resize modal for better desktop view and keep it responsive
        try {
            const modalContent = this.elements.modalOverlay.querySelector('.modal-content');
            const body = this.elements.modalBody;
            const w = window.innerWidth || 1024;
            if (w >= 1400) {
                modalContent.style.maxWidth = '1040px';
                modalContent.style.width = '1040px';
                modalContent.style.maxHeight = '82vh';
            } else if (w >= 1024) {
                modalContent.style.maxWidth = '940px';
                modalContent.style.width = '940px';
                modalContent.style.maxHeight = '82vh';
            } else if (w >= 768) {
                modalContent.style.maxWidth = '92vw';
                modalContent.style.width = '92vw';
                modalContent.style.maxHeight = '84vh';
            } else {
                modalContent.style.maxWidth = '95vw';
                modalContent.style.width = '95vw';
                modalContent.style.maxHeight = '90vh';
            }
            // Body scrolling is now handled by flexbox layout in CSS
        } catch (e) { /* no-op */ }

        // Setup slider interactivity
        const slider = document.getElementById('price-slider');
        const frequencySelector = document.getElementById('frequency-selector');
        const valueDisplay = document.getElementById('price-value');
        const previewRevenue = document.getElementById('preview-revenue');
        const previewRevenueChange = document.getElementById('preview-revenue-change');
        const previewLoad = document.getElementById('preview-load');
        const previewLoadChange = document.getElementById('preview-load-change');
        const previewYieldElem = document.getElementById('preview-yield');
        const previewYieldChange = document.getElementById('preview-yield-change');

        const updatePreview = () => {
            previewMultiplier = slider.value / 100;
            previewFrequency = parseInt(frequencySelector.value);
            valueDisplay.textContent = `${slider.value}%`;
            
            preview = calculatePreview(previewMultiplier, previewFrequency);
            
            // Update displays
            previewRevenue.textContent = `$${preview.revenue}`;
            previewLoad.textContent = `${(preview.loadFactor * 100).toFixed(0)}%`;
            previewYieldElem.textContent = `$${preview.yield.toFixed(2)}`;
            
            // Calculate changes
            const revChange = ((preview.revenue - route.dailyRevenue) / route.dailyRevenue * 100).toFixed(1);
            const loadChange = ((preview.loadFactor - 0.85) * 100).toFixed(1);
            const yieldChange = ((preview.yield - currentYield) / currentYield * 100).toFixed(1);
            
            previewRevenueChange.textContent = `${revChange > 0 ? '+' : ''}${revChange}%`;
            previewRevenueChange.style.color = revChange > 0 ? '#10b981' : '#ef4444';
            
            previewLoadChange.textContent = `${loadChange > 0 ? '+' : ''}${loadChange}pp`;
            previewLoadChange.style.color = loadChange > 0 ? '#10b981' : '#ef4444';
            
            previewYieldChange.textContent = `${yieldChange > 0 ? '+' : ''}${yieldChange}%`;
            previewYieldChange.style.color = yieldChange > 0 ? '#10b981' : '#ef4444';
        };

        slider.addEventListener('input', updatePreview);
        frequencySelector.addEventListener('change', updatePreview);
        updatePreview(); // Initial update

        // Assignments: add/remove handlers
        const addBtn = document.getElementById('add-assignment-btn');
        const addSel = document.getElementById('add-assignment-select');
        if (addBtn && addSel) {
            addBtn.addEventListener('click', () => {
                const planeId = addSel.value;
                if (!planeId) return;
                const res = this.game.managers.routes.addPlaneToRoute(routeId, planeId);
                if (!res.success) {
                    alert(res.msg || 'No se pudo añadir el avión');
                    return;
                }
                this.game.save();
                // Re-open to refresh data
                this.showRoutePricingModal(routeId);
                this.renderRoutes();
                this.updateHUD();
            });
        }

        const removeBtns = document.querySelectorAll('.btn-remove-assignment');
        removeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const planeId = btn.getAttribute('data-plane-id');
                if (!planeId) return;
                const confirmRemove = confirm('¿Quitar este avión de la ruta?');
                if (!confirmRemove) return;
                const res = this.game.managers.routes.removePlaneFromRoute(routeId, planeId);
                if (!res.success) {
                    alert(res.msg || 'No se pudo quitar el avión');
                    return;
                }
                this.game.save();
                this.showRoutePricingModal(routeId);
                this.renderRoutes();
                this.updateHUD();
            });
        });

        // Yield Optimization button
        const optimizeBtn = document.getElementById('btn-optimize-yield');
        if (optimizeBtn) {
            optimizeBtn.addEventListener('click', () => {
                // Get first assigned plane for analysis
                const assignments = Array.isArray(route.assignments) && route.assignments.length > 0
                    ? route.assignments
                    : (route.assignedPlane ? [{ planeId: route.assignedPlane }] : []);
                
                if (assignments.length === 0) {
                    alert('Asigna al menos un avión a la ruta para optimizar.');
                    return;
                }
                
                const plane = this.game.managers.fleet.ownedPlanes.find(p => p.instanceId === assignments[0].planeId);
                if (!plane) return;
                
                const recommendation = this.game.managers.economy?.optimizeYieldConfiguration?.(route, plane);
                if (!recommendation) {
                    alert('No se pudo calcular la optimización.');
                    return;
                }
                
                // Display recommendation
                const recDiv = document.getElementById('yield-recommendation');
                if (recDiv) {
                    recDiv.style.display = 'block';
                    recDiv.querySelector('.rec-economy').textContent = recommendation.economy;
                    recDiv.querySelector('.rec-premium').textContent = recommendation.premium;
                    recDiv.querySelector('.rec-business').textContent = recommendation.business;
                    recDiv.querySelector('.rec-yield').textContent = '$' + recommendation.yield;
                    recDiv.querySelector('.rec-name').textContent = '✨ ' + recommendation.name;
                    
                    // Scroll to recommendation
                    recDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    
                    // Setup apply button
                    const applyBtn = recDiv.querySelector('#btn-apply-recommendation');
                    if (applyBtn) {
                        applyBtn.onclick = () => {
                            // Store the recommendation for later application
                            route.seats = {
                                economy: recommendation.economy,
                                premium: recommendation.premium,
                                business: recommendation.business
                            };
                            
                            // Update plane configuration if needed
                            if (plane.configuration) {
                                plane.configuration = { ...route.seats };
                            }
                            
                            this.game.save();
                            
                            // Update UI
                            const seatsDisplay = document.getElementById('current-seats');
                            if (seatsDisplay) {
                                seatsDisplay.innerHTML = `
                                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 0.8rem; text-align: center;">
                                        <div><div style="color: #94a3b8;">Economy</div><div style="color: #10b981; font-weight: 700;">${recommendation.economy}</div></div>
                                        <div><div style="color: #94a3b8;">Premium</div><div style="color: #f59e0b; font-weight: 700;">${recommendation.premium}</div></div>
                                        <div><div style="color: #94a3b8;">Business</div><div style="color: #8b5cf6; font-weight: 700;">${recommendation.business}</div></div>
                                    </div>
                                `;
                            }
                            
                            alert('✨ Recomendación aplicada. Los asientos se han actualizado.');
                        };
                    }
                }
            });
        }

        document.getElementById('btn-cancel-pricing').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('btn-apply-pricing').addEventListener('click', () => {
            const newMultiplier = previewMultiplier;
            const newFrequency = previewFrequency;
            
            // Update pricing
            this.game.managers.routes.updateRoutePricing(routeId, newMultiplier);
            
            // Update frequency if changed
            if (newFrequency !== currentFrequency) {
                const result = this.game.managers.routes.updateRouteFrequency(routeId, newFrequency);
                if (!result.success) {
                    alert(result.msg);
                    return;
                }
            }
            
            this.game.save();
            this.hideModal();
            this.renderRoutes();
            this.updateHUD();
        });

        document.getElementById('btn-delete-route').addEventListener('click', () => {
            const confirmDelete = confirm(`¿Eliminar la ruta ${route.origin} ➔ ${route.dest}? Esta acción es permanente.`);
            if (!confirmDelete) return;
            const res = this.game.managers.routes.deleteRoute(routeId);
            if (!res.success) {
                alert(res.msg || 'No se pudo eliminar la ruta');
                return;
            }
            this.hideModal();
            this.renderRoutes();
            this.updateHUD();
        });
    }

    // --- TIME CONTROLS ---
    setupTimeControls() {
        // Pause button
        this.elements.btnPause.addEventListener('click', () => {
            const isPaused = this.game.managers.time.togglePause();
            this.updatePauseButton(isPaused);
        });

        // Speed buttons
        [this.elements.btnSpeed1x, this.elements.btnSpeed2x, this.elements.btnSpeed5x].forEach(btn => {
            btn.addEventListener('click', () => {
                const speed = parseInt(btn.dataset.speed);
                this.game.managers.time.setSpeed(speed);
                this.updateSpeedButtons(speed);

                // If paused, resume when changing speed
                if (this.game.managers.time.isPaused) {
                    this.game.managers.time.togglePause();
                    this.updatePauseButton(false);
                }

                // Sync dev speed dropdown
                const devSelect = document.getElementById('dev-speed-select');
                if (devSelect) devSelect.value = String(speed);
            });
        });

        // Dev speed dropdown
        const devSelect = document.getElementById('dev-speed-select');
        if (devSelect) {
            devSelect.addEventListener('change', (e) => {
                const val = parseFloat(e.target.value);
                this.game.managers.time.setSpeed(val);
                this.updateSpeedButtons(val);

                // If paused, resume when changing speed
                if (this.game.managers.time.isPaused) {
                    this.game.managers.time.togglePause();
                    this.updatePauseButton(false);
                }
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Space = Pause/Resume
            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                const isPaused = this.game.managers.time.togglePause();
                this.updatePauseButton(isPaused);
            }

            // Numbers 1, 2, 3 = Speeds
            if (e.key === '1' && !e.target.matches('input, textarea')) {
                this.game.managers.time.setSpeed(1);
                this.updateSpeedButtons(1);
                if (this.game.managers.time.isPaused) {
                    this.game.managers.time.togglePause();
                    this.updatePauseButton(false);
                }
                const devSelect = document.getElementById('dev-speed-select');
                if (devSelect) devSelect.value = '1';
            }
            if (e.key === '2' && !e.target.matches('input, textarea')) {
                this.game.managers.time.setSpeed(2);
                this.updateSpeedButtons(2);
                if (this.game.managers.time.isPaused) {
                    this.game.managers.time.togglePause();
                    this.updatePauseButton(false);
                }
                const devSelect = document.getElementById('dev-speed-select');
                if (devSelect) devSelect.value = '2';
            }
            if (e.key === '3' && !e.target.matches('input, textarea')) {
                this.game.managers.time.setSpeed(5);
                this.updateSpeedButtons(5);
                if (this.game.managers.time.isPaused) {
                    this.game.managers.time.togglePause();
                    this.updatePauseButton(false);
                }
                const devSelect = document.getElementById('dev-speed-select');
                if (devSelect) devSelect.value = '5';
            }

            // Ctrl+D = Dev Panel
            if (e.ctrlKey && e.key === 'd' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.showDevPanel();
            }
        });
    }

    updatePauseButton(isPaused) {
        const icon = this.elements.btnPause.querySelector('.icon');
        if (isPaused) {
            icon.textContent = '▶️'; // Play
            this.elements.btnPause.classList.add('paused');
        } else {
            icon.textContent = '⏸️'; // Pause
            this.elements.btnPause.classList.remove('paused');
        }
    }

    updateSpeedButtons(activeSpeed) {
        [this.elements.btnSpeed1x, this.elements.btnSpeed2x, this.elements.btnSpeed5x].forEach(btn => {
            const speed = parseInt(btn.dataset.speed);
            btn.classList.toggle('active', speed === activeSpeed);
        });
    }

    async showHubUpgradesModal(hubId) {
        const hub = this.game.state.hubs?.[hubId];
        if (!hub) {
            this.showError('Hub no encontrado.');
            return;
        }

        const cash = this.game.state.money || 0;
        const COST_SLOTS = 5000000; // $5M para agregar 2 slots
        const COST_RUNWAY = 3000000; // $3M para mejorar runway

        const slotsUsed = hub.slots?.used || 0;
        const slotsTotal = hub.slots?.total || 2;
        const slotsAvailable = slotsTotal - slotsUsed;
        const dailyFeeBase = Math.round(hub.dailyFee);

        let runwayLevel = hub.upgrades?.runwayLevel || 0;
        let runwayFeeReduction = runwayLevel * 10; // 10% reduction per level

        const content = `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div style="background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.25); border-radius: 10px; padding: 1rem;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #10b981;">${hub.name}</h4>
                    <div style="color: #cbd5e1; font-size: 0.9rem;">
                        <div>📍 ${hub.city}</div>
                        <div style="margin-top: 0.3rem;">Slots: ${slotsUsed}/${slotsTotal} (${slotsAvailable} disponibles)</div>
                        <div>Tarifa base: $${dailyFeeBase}/día</div>
                    </div>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
                    <h4 style="margin: 0 0 0.75rem 0; color: #e2e8f0;">Mejoras Disponibles</h4>
                    
                    <div style="background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2); border-radius: 10px; padding: 0.85rem; margin-bottom: 0.75rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: 600;">➕ Agregar 2 Slots</div>
                                <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.3rem;">Costo: $${(COST_SLOTS/1000000).toFixed(0)}M</div>
                            </div>
                            <button id="btn-upgrade-slots" class="btn-primary" style="padding: 0.5rem 1rem; background: #3b82f6;" ${cash < COST_SLOTS ? 'disabled' : ''}>
                                Mejorar
                            </button>
                        </div>
                    </div>

                    <div style="background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.2); border-radius: 10px; padding: 0.85rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: 600;">✈️ Mejorar Pista (Nivel ${runwayLevel})</div>
                                <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.3rem;">Reduce tarifa: ${runwayFeeReduction}%</div>
                                <div style="font-size: 0.8rem; color: #94a3b8;">Costo: $${(COST_RUNWAY/1000000).toFixed(0)}M</div>
                            </div>
                            <button id="btn-upgrade-runway" class="btn-primary" style="padding: 0.5rem 1rem; background: #a78bfa;" ${cash < COST_RUNWAY ? 'disabled' : ''}>
                                Mejorar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const actions = `
            <button class="btn-secondary" onclick="window.app.ui.hideModal()">Cerrar</button>
        `;

        this.showModal(`🏢 Upgrades - ${hub.name}`, content, actions);

        const btnSlots = document.getElementById('btn-upgrade-slots');
        const btnRunway = document.getElementById('btn-upgrade-runway');

        btnSlots?.addEventListener('click', async () => {
            const result = await this.game.upgradeHubSlots(hubId);
            if (result?.success) {
                this.showError('✅ ' + (result.msg || 'Slots mejorados'));
                this.hideModal();
                this.updateHUD();
            } else {
                this.showError(result?.msg || 'No se pudo mejorar los slots.');
            }
        });

        btnRunway?.addEventListener('click', async () => {
            const result = await this.game.upgradeHubRunway(hubId);
            if (result?.success) {
                this.showError('✅ ' + (result.msg || 'Pista mejorada'));
                this.hideModal();
                this.updateHUD();
            } else {
                this.showError(result?.msg || 'No se pudo mejorar la pista.');
            }
        });
    }

    async showOpenHubModal() {
        const level = this.game.state.level || 1;
        const cash = this.game.state.money || 0;
        const baseCost = 10000000; // $10M base

        // Get available airports for player level
        const availableAirports = this.game.managers.routes.getAvailableAirports();
        const existing = Object.keys(this.game.state.hubs || {});
        
        let selectedAirport = null;
        const options = Object.entries(availableAirports)
            .filter(([id, ap]) => id !== this.game.state.mainHub && !existing.includes(id))
            .map(([id, ap]) => {
                const cost = Math.floor(baseCost * Airport.getCategoryMultiplier(ap));
                const slots = Airport.getSlotCount(ap);
                return `<option value="${id}" data-cost="${cost}" data-slots="${slots}">${id} - ${ap.city} (${ap.name}) - Nivel ${ap.minLevel}</option>`;
            })
            .join('');

        const content = `
            <div style="display:flex; flex-direction:column; gap:12px;">
                <p>Abre un hub secundario para expandir tu red. Requisitos:</p>
                <ul>
                    <li>Nivel mínimo: 2</li>
                    <li>Coste: Variable según categoría del aeropuerto</li>
                </ul>
                <label style="font-weight:600;">Selecciona aeropuerto</label>
                <select id="open-hub-select" style="padding:8px; border-radius:8px;">${options || '<option>Sin aeropuertos disponibles</option>'}</select>
                <div id="hub-cost-info" style="padding: 0.75rem; background: #2d3748; border-radius: 8px; color: #cbd5e0;">
                    <div id="hub-cost-display"></div>
                    <div id="hub-slots-display"></div>
                </div>
                ${level < 2 ? `<p style="color:#ef4444;">❌ Requiere nivel 2.</p>` : ''}
            </div>
        `;

        const actions = `
            <button class="btn-secondary" id="cancel-open-hub">Cancelar</button>
            <button class="btn-primary" id="confirm-open-hub" ${(level < 2 || !options) ? 'disabled' : ''}>Confirmar</button>
        `;

        this.showModal('Abrir Hub Secundario', content, actions);

        const selectEl = document.getElementById('open-hub-select');
        const costDisplay = document.getElementById('hub-cost-display');
        const slotsDisplay = document.getElementById('hub-slots-display');
        const confirmBtn = document.getElementById('confirm-open-hub');

        // Update cost display when selection changes
        const updateCostDisplay = () => {
            if (selectEl.value) {
                const option = selectEl.options[selectEl.selectedIndex];
                const cost = parseInt(option.dataset.cost);
                const slots = parseInt(option.dataset.slots);
                const formatter = this.formatters.currency;
                costDisplay.innerHTML = `💰 Coste de apertura: ${formatter.format(cost)}`;
                slotsDisplay.innerHTML = `📊 Slots iniciales: ${slots}`;
                confirmBtn.textContent = `Confirmar (${formatter.format(cost)})`;
                confirmBtn.disabled = cash < cost;
            }
        };

        selectEl.addEventListener('change', updateCostDisplay);
        updateCostDisplay();

        const cancelBtn = document.getElementById('cancel-open-hub');
        cancelBtn?.addEventListener('click', () => this.hideModal());
        
        confirmBtn?.addEventListener('click', async () => {
            const iata = selectEl?.value;
            if (!iata || !AIRPORTS[iata]) {
                this.showError('Selecciona un aeropuerto válido.');
                return;
            }
            const result = await this.game.openSecondaryHub(iata);
            if (result?.success) {
                this.showError(result.msg || 'Hub abierto correctamente');
                this.hideModal();
                this.updateHUD();
            } else {
                this.showError(result?.msg || 'No se pudo abrir el hub.');
            }
        });
    }

    // === TIP SYSTEM (Fase 6) ===
    showTip(tipId, title, message, type = 'info') {
        // Prevent duplicate tips
        if (this.tipsShown[tipId]) return;
        this.tipsShown[tipId] = true;

        // Create tip notification
        const tip = document.createElement('div');
        tip.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(30,30,30,0.95);
            border: 2px solid #3b82f6;
            border-radius: 12px;
            padding: 1rem;
            max-width: 320px;
            color: #e2e8f0;
            font-size: 0.9rem;
            z-index: 1000;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            animation: slideIn 0.3s ease-out;
        `;

        const icon = {
            info: '💡',
            success: '✅',
            warning: '⚠️',
            danger: '🚨'
        }[type] || '💡';

        tip.innerHTML = `
            <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
                <span style="font-size: 1.5rem;">${icon}</span>
                <div style="flex: 1;">
                    <div style="font-weight: 700; margin-bottom: 0.25rem;">${title}</div>
                    <div style="color: #cbd5e1; font-size: 0.85rem;">${message}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1.2rem;">×</button>
            </div>
        `;

        document.body.appendChild(tip);

        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (tip.parentElement) tip.remove();
        }, 8000);
    }

    // Tutorial tips - shown based on milestones
    checkAndShowTips() {
        const level = this.game.state.level || 1;
        const fleet = this.game.managers.fleet.ownedPlanes.length;
        const routes = this.game.managers.routes.getRoutes().length;
        const reputation = this.game.state.reputation || 50;

        // First plane purchased
        if (fleet === 1 && !this.completedActions.firstPlane) {
            this.completedActions.firstPlane = true;
            this.showTip('first_plane', 
                '✈️ Tu primer avión', 
                'Excelente! Ahora puedes crear rutas y generar ingresos.',
                'success');
        }

        // First route created
        if (routes === 1 && !this.completedActions.firstRoute) {
            this.completedActions.firstRoute = true;
            this.showTip('first_route',
                '🛫 Primera ruta operativa',
                'Tu avión está volando! Los ingresos se generarán cada día. Monitorea la reputación.',
                'success');
        }

        // Low reputation warning
        if (reputation < 30 && !this.completedActions.lowRepWarn) {
            this.completedActions.lowRepWarn = true;
            this.showTip('low_rep',
                '⭐ Reputación baja',
                'La reputación afecta la ocupación de tus vuelos. Sube aviones premium o mejora la condición.',
                'warning');
        }

        // Level 2 unlocked
        if (level >= 2 && !this.completedActions.level2) {
            this.completedActions.level2 = true;
            this.showTip('level_2',
                '🎉 Nivel 2 alcanzado!',
                'Ahora puedes acceder a nuevos aviones y opciones avanzadas.',
                'success');
        }

        // Hub secondary unlock
        if (level >= 2 && !this.completedActions.hubSecondary) {
            this.completedActions.hubSecondary = true;
            this.showTip('hub_secondary',
                '🏢 Hubs Secundarios',
                'Tienes $10M? Abre un segundo hub para expandir tu red aérea.',
                'info');
        }
    }

    // === DEV PANEL (Testing) ===
    showDevPanel() {
        const devPanel = document.getElementById('dev-panel') || document.createElement('div');
        devPanel.id = 'dev-panel';
        
        if (!devPanel.parentElement) {
            devPanel.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: rgba(15, 23, 42, 0.95);
                border: 2px solid #ef4444;
                border-radius: 12px;
                padding: 1rem;
                z-index: 9999;
                max-width: 350px;
                color: #e2e8f0;
                font-family: 'Space Mono', monospace;
                font-size: 0.8rem;
                box-shadow: 0 8px 32px rgba(0,0,0,0.6);
                line-height: 1.6;
            `;

            const currentLevel = this.game.state.level || 1;
            const currentMoney = this.game.state.money || 0;
            const currentRep = this.game.state.reputation || 50;
            const currentFleet = this.game.managers.fleet.ownedPlanes.length;
            const currentRoutes = this.game.managers.routes.getRoutes().length;

            devPanel.innerHTML = `
                <div style="margin-bottom: 1rem;">
                    <div style="color: #ef4444; font-weight: bold; margin-bottom: 0.5rem;">🔧 DEV PANEL (Ctrl+D)</div>
                    
                    <div style="margin-bottom: 0.75rem;">
                        <label style="display: block; margin-bottom: 0.25rem; color: #f59e0b;">
                            Nivel: <strong>${currentLevel}</strong>
                        </label>
                        <input type="range" id="dev-level" min="1" max="10" value="${currentLevel}" 
                            style="width: 100%; cursor: pointer;">
                    </div>

                    <div style="margin-bottom: 0.75rem;">
                        <label style="display: block; margin-bottom: 0.25rem; color: #10b981;">
                            Dinero: $${(currentMoney / 1000000).toFixed(1)}M
                        </label>
                        <input type="range" id="dev-money" min="0" max="999" value="${Math.min(999, Math.floor(currentMoney / 1000000))}" 
                            style="width: 100%; cursor: pointer;" title="Millones">
                    </div>

                    <div style="margin-bottom: 0.75rem;">
                        <label style="display: block; margin-bottom: 0.25rem; color: #f59e0b;">
                            Reputación: <strong>${Math.round(currentRep)}/100</strong>
                        </label>
                        <input type="range" id="dev-rep" min="0" max="100" value="${currentRep}" 
                            style="width: 100%; cursor: pointer;">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 1rem;">
                        <button id="dev-reset" style="background: #ef4444; color: white; border: none; padding: 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem;">
                            🔄 Reset Game
                        </button>
                        <button id="dev-close" style="background: rgba(255,255,255,0.1); color: #e2e8f0; border: 1px solid #ef4444; padding: 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem;">
                            ✕ Cerrar
                        </button>
                    </div>

                    <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.7rem; color: #94a3b8;">
                        <div>✈️ Flota: ${currentFleet} aviones</div>
                        <div>🗺️ Rutas: ${currentRoutes} activas</div>
                    </div>
                </div>
            `;

            document.body.appendChild(devPanel);

            // Event listeners
            const levelInput = document.getElementById('dev-level');
            const moneyInput = document.getElementById('dev-money');
            const repInput = document.getElementById('dev-rep');
            const resetBtn = document.getElementById('dev-reset');
            const closeBtn = document.getElementById('dev-close');

            levelInput.addEventListener('input', (e) => {
                const newLevel = parseInt(e.target.value);
                this.game.state.level = newLevel;
                this.game.save();
                console.log(`🔧 Dev: Level set to ${newLevel}`);
                this.updateHUD();
            });

            moneyInput.addEventListener('input', (e) => {
                const newMoney = parseInt(e.target.value) * 1000000;
                this.game.state.money = newMoney;
                this.game.save();
                console.log(`🔧 Dev: Money set to $${newMoney.toLocaleString()}`);
                this.updateHUD();
            });

            repInput.addEventListener('input', (e) => {
                const newRep = parseInt(e.target.value);
                this.game.state.reputation = newRep;
                this.game.save();
                console.log(`🔧 Dev: Reputation set to ${newRep}`);
                this.updateHUD();
            });

            resetBtn.addEventListener('click', () => {
                if (confirm('¿Resetear el juego? Se perderán todos los datos.')) {
                    this.game.state.mainHub = null;
                    this.game.state.level = 1;
                    this.game.state.money = 999999999;
                    this.game.state.reputation = 50;
                    this.game.state.cumulativeProfit = 0;
                    this.game.state.hubs = {};
                    this.game.managers.fleet.ownedPlanes = [];
                    this.game.managers.routes.routes = [];
                    this.game.save();
                    location.reload();
                }
            });

            closeBtn.addEventListener('click', () => {
                devPanel.remove();
            });
        } else {
            // Toggle close if already open
            devPanel.remove();
        }
    }

    // ==========================================
    // SEMANA 3: FUEL HEDGING UI
    // ==========================================

    showFuelContractModal() {
        const fuelIndex = this.game.managers.economy.fuelIndex;
        const fuelState = this.game.state.fuel || { spotPrice: 1 };
        const marketPrice = (fuelState.spotPrice || 1).toFixed(3);
        const level = this.game.state.level || 1;
        const allowedDurations = this.game.managers.economy.fuelSystem.allowedDurations(level);
        const volumeCaps = this.game.managers.economy.fuelSystem.volumeCaps(level);
        
        const contentHTML = `
            <div style="max-width: 100%;">
                <div style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                    <div style="color: #cbd5e1; font-size: 0.85rem; margin-bottom: 8px;">
                        💡 Los contratos te protegen contra alzas de combustible. Si el precio de mercado sube, usarás tu contrato a precio fijo.
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
                        <div>
                            <div style="color: #94a3b8; font-size: 0.75rem;">Precio Mercado Actual</div>
                            <div style="color: #3b82f6; font-weight: 700; font-size: 1.2rem;">$${marketPrice}/L</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8; font-size: 0.75rem;">Tu Balance</div>
                            <div style="color: #10b981; font-weight: 700; font-size: 1.2rem;">$${this.game.state.money.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 0.9rem; margin-bottom: 8px; color: #cbd5e1;">
                        ⛽ Volumen (Litros): <span id="volume-display" style="color: #3b82f6; font-weight: bold;">50,000L</span>
                    </label>
                    <input type="range" id="volume-slider" min="${volumeCaps.min}" max="${volumeCaps.max}" step="10000" value="${Math.min(Math.max(50000, volumeCaps.min), volumeCaps.max)}" 
                        style="width: 100%; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); outline: none; cursor: pointer;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; margin-top: 4px;">
                        <span>${volumeCaps.min.toLocaleString()}L</span>
                        <span>${Math.round((volumeCaps.min + volumeCaps.max)/2).toLocaleString()}L</span>
                        <span>${volumeCaps.max.toLocaleString()}L</span>
                    </div>
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 0.9rem; margin-bottom: 8px; color: #cbd5e1;">
                        📅 Duración (Días)
                    </label>
                    <select id="duration-select" style="width: 100%; padding: 10px; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 0.95rem;">
                        ${allowedDurations.map(d => `<option value="${d}" ${d===Math.min(...allowedDurations)?'selected':''}>${d} días</option>`).join('')}
                    </select>
                </div>

                <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px;">
                    <h3 style="margin-top: 0; font-size: 0.9rem; color: #cbd5e1;">📊 Resumen del Contrato</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
                        <div>
                            <div style="color: #94a3b8;">Volumen Total</div>
                            <div id="summary-volume" style="color: #cbd5e1; font-weight: 600;">50,000L</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8;">Precio Fijo</div>
                            <div id="summary-price" style="color: #cbd5e1; font-weight: 600;">$${marketPrice}/L</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8;">Duración</div>
                            <div id="summary-duration" style="color: #cbd5e1; font-weight: 600;">90 días</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8;">Costo Total</div>
                            <div id="summary-cost" style="color: #10b981; font-weight: 700; font-size: 1.1rem;">$${(50000 * parseFloat(marketPrice)).toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const actionsHTML = `
            <button class="modal-btn btn-secondary" id="btn-cancel-fuel">Cancelar</button>
            <button class="modal-btn btn-primary" id="btn-confirm-fuel">Comprar Contrato</button>
        `;

        this.showModal('⛽ Comprar Contrato de Combustible', contentHTML, actionsHTML);

        // Setup interactivity
        const volumeSlider = document.getElementById('volume-slider');
        const volumeDisplay = document.getElementById('volume-display');
        const durationSelect = document.getElementById('duration-select');
        const summaryVolume = document.getElementById('summary-volume');
        const summaryPrice = document.getElementById('summary-price');
        const summaryDuration = document.getElementById('summary-duration');
        const summaryCost = document.getElementById('summary-cost');

        const updateSummary = () => {
            const volume = parseInt(volumeSlider.value);
            const duration = parseInt(durationSelect.value);
            const price = parseFloat(marketPrice);
            const cost = volume * price;

            volumeDisplay.textContent = `${volume.toLocaleString()}L`;
            summaryVolume.textContent = `${volume.toLocaleString()}L`;
            summaryDuration.textContent = `${duration} días`;
            summaryCost.textContent = `$${cost.toLocaleString()}`;
        };

        volumeSlider.addEventListener('input', updateSummary);
        durationSelect.addEventListener('change', updateSummary);

        document.getElementById('btn-cancel-fuel').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('btn-confirm-fuel').addEventListener('click', () => {
            const volume = parseInt(volumeSlider.value);
            const duration = parseInt(durationSelect.value);

            const result = this.game.managers.economy.purchaseFuelContract(volume, duration);
            if (result.success) {
                this.hideModal();
                this.showNotification('Contrato Adquirido', result.msg, 'success');
                
                // Refresh view based on current active tab
                const activeView = document.querySelector('[class*="-view"].active');
                if (activeView && activeView.id === 'fuel-view') {
                    // Force re-render fuel panel to show new contract
                    this.setTimeout(() => this.renderFuel(14), 100);
                } else {
                    this.renderEconomy();
                    // Also update dashboard money if visible
                    const dashMoney = document.getElementById('dash-money');
                    if (dashMoney) {
                        dashMoney.innerText = `$${this.game.state.money.toLocaleString()}`;
                    }
                }
            } else {
                alert(result.msg);
            }
        });
    }

    showSpotPurchaseModal() {
        const fuelState = this.game.state.fuel || { spotPrice: 1 };
        const marketPrice = (fuelState.spotPrice || 1).toFixed(3);
        const level = this.game.state.level || 1;
        const allowedDurations = this.game.managers.economy.fuelSystem.allowedDurations(level);
        const volumeCaps = this.game.managers.economy.fuelSystem.volumeCaps(level);

        const initialVolume = Math.min(Math.max(50000, volumeCaps.min), volumeCaps.max);

        const contentHTML = `
            <div style="max-width: 100%;">
                <div style="background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                    <div style="color: #cbd5e1; font-size: 0.85rem; margin-bottom: 8px;">
                        ⛽ Compra directa al mercado (spot). El volumen comprado se usará automáticamente en tus vuelos al precio actual.
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
                        <div>
                            <div style="color: #94a3b8; font-size: 0.75rem;">Precio Mercado Actual</div>
                            <div style="color: #f59e0b; font-weight: 700; font-size: 1.2rem;">$${marketPrice}/L</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8; font-size: 0.75rem;">Tu Balance</div>
                            <div style="color: #10b981; font-weight: 700; font-size: 1.2rem;">$${this.game.state.money.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 0.9rem; margin-bottom: 8px; color: #cbd5e1;">
                        ⛽ Volumen (Litros): <span id="spot-volume-display" style="color: #f59e0b; font-weight: bold;">${initialVolume.toLocaleString()}L</span>
                    </label>
                    <input type="range" id="spot-volume-slider" min="${volumeCaps.min}" max="${volumeCaps.max}" step="10000" value="${initialVolume}" 
                        style="width: 100%; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); outline: none; cursor: pointer;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; margin-top: 4px;">
                        <span>${volumeCaps.min.toLocaleString()}L</span>
                        <span>${Math.round((volumeCaps.min + volumeCaps.max)/2).toLocaleString()}L</span>
                        <span>${volumeCaps.max.toLocaleString()}L</span>
                    </div>
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 0.9rem; margin-bottom: 8px; color: #cbd5e1;">📅 Duración (Días)</label>
                    <select id="spot-duration-select" style="width: 100%; padding: 10px; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 0.95rem;">
                        ${allowedDurations.map(d => `<option value="${d}" ${d===Math.min(...allowedDurations)?'selected':''}>${d} días</option>`).join('')}
                    </select>
                </div>

                <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px;">
                    <h3 style="margin-top: 0; font-size: 0.9rem; color: #cbd5e1;">📊 Resumen de Compra Spot</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
                        <div>
                            <div style="color: #94a3b8;">Volumen Total</div>
                            <div id="spot-summary-volume" style="color: #cbd5e1; font-weight: 600;">${initialVolume.toLocaleString()}L</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8;">Precio Spot</div>
                            <div id="spot-summary-price" style="color: #cbd5e1; font-weight: 600;">$${marketPrice}/L</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8;">Duración</div>
                            <div id="spot-summary-duration" style="color: #cbd5e1; font-weight: 600;">${Math.min(...allowedDurations)} días</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8;">Costo Total</div>
                            <div id="spot-summary-cost" style="color: #10b981; font-weight: 700; font-size: 1.1rem;">$${(initialVolume * parseFloat(marketPrice)).toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const actionsHTML = `
            <button class="modal-btn btn-secondary" id="btn-cancel-spot">Cancelar</button>
            <button class="modal-btn btn-primary" id="btn-confirm-spot">Comprar Spot</button>
        `;

        this.showModal('⛽ Comprar Combustible en Mercado', contentHTML, actionsHTML);

        const volumeSlider = document.getElementById('spot-volume-slider');
        const volumeDisplay = document.getElementById('spot-volume-display');
        const durationSelect = document.getElementById('spot-duration-select');
        const summaryVolume = document.getElementById('spot-summary-volume');
        const summaryDuration = document.getElementById('spot-summary-duration');
        const summaryCost = document.getElementById('spot-summary-cost');

        const updateSummary = () => {
            const volume = parseInt(volumeSlider.value);
            const duration = parseInt(durationSelect.value);
            const price = parseFloat(marketPrice);
            const cost = volume * price;

            volumeDisplay.textContent = `${volume.toLocaleString()}L`;
            summaryVolume.textContent = `${volume.toLocaleString()}L`;
            summaryDuration.textContent = `${duration} días`;
            summaryCost.textContent = `$${cost.toLocaleString()}`;
        };

        volumeSlider.addEventListener('input', updateSummary);
        durationSelect.addEventListener('change', updateSummary);

        document.getElementById('btn-cancel-spot').addEventListener('click', () => this.hideModal());

        document.getElementById('btn-confirm-spot').addEventListener('click', () => {
            const volume = parseInt(volumeSlider.value);
            const duration = parseInt(durationSelect.value);
            const result = this.game.managers.economy.purchaseSpotFuel(volume, duration);
            if (result.success) {
                this.hideModal();
                this.showNotification('Compra Spot Realizada', result.msg, 'success');
                setTimeout(() => this.renderFuel(14), 100);
                const dashMoney = document.getElementById('dash-money');
                if (dashMoney) dashMoney.innerText = `$${this.game.state.money.toLocaleString()}`;
            } else {
                this.showNotification('Error', result.msg, 'error');
            }
        });
    }

    // ==========================================
    // SEMANA 3: CORPORATE CONTRACTS UI
    // ==========================================

    renderCorporateContracts() {
        if (!this.game.state.corporateContracts) this.game.state.corporateContracts = [];

        const activeContracts = (this.game.state.corporateContracts || []).filter(c => 
            c.status === 'active' && 
            this.game.state.date <= c.endDate
        );

        const totalRevenue = activeContracts.reduce((sum, c) => sum + c.dailyRevenue, 0);
        const totalCapacity = activeContracts.reduce((sum, c) => sum + c.seatsReserved, 0);

        let contractsHTML = '';
        if (activeContracts.length > 0) {
            contractsHTML = activeContracts.map(c => {
                const route = this.game.state.routes.find(r => r.id === c.routeId);
                const routeName = route ? `${route.origin} → ${route.destination}` : 'Ruta Cancelada';
                const daysLeft = Math.max(0, (c.endDate - this.game.state.date) / (24 * 60 * 60 * 1000));
                const totalDays = (c.endDate - c.startDate) / (24 * 60 * 60 * 1000);
                const progress = ((totalDays - daysLeft) / totalDays) * 100;
                const totalEarned = c.dailyRevenue * (totalDays - daysLeft);
                
                return `
                    <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <div>
                                <div style="color: #cbd5e1; font-size: 0.9rem; font-weight: 600;">${c.companyName}</div>
                                <div style="color: #94a3b8; font-size: 0.75rem;">${routeName}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: #10b981; font-size: 0.9rem; font-weight: 700;">$${c.dailyRevenue.toLocaleString()}/día</div>
                                <div style="color: #64748b; font-size: 0.7rem;">${c.seatsReserved} asientos</div>
                            </div>
                        </div>
                        <div style="color: #94a3b8; font-size: 0.75rem; margin-bottom: 6px;">
                            ${daysLeft.toFixed(0)} días restantes • Ganado: $${totalEarned.toLocaleString()}
                        </div>
                        <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(90deg, #10b981, #3b82f6); width: ${progress}%;"></div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            contractsHTML = '<div style="color: #94a3b8; font-size: 0.85rem; text-align: center; padding: 12px;">Sin contratos corporativos activos</div>';
        }

        return `
            <div class="hero-card">
                <h3 style="margin:0 0 0.75rem 0; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">🏢 Contratos Corporativos</h3>
                <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
                        <div>
                            <div style="color: #94a3b8; font-size: 0.75rem;">Contratos Activos</div>
                            <div style="color: #10b981; font-weight: 700; font-size: 1.1rem;">${activeContracts.length}</div>
                            <div style="color: #64748b; font-size: 0.7rem;">${totalCapacity} asientos reservados</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8; font-size: 0.75rem;">Ingresos Garantizados</div>
                            <div style="color: #3b82f6; font-weight: 700; font-size: 1.1rem;">$${totalRevenue.toLocaleString()}/día</div>
                            <div style="color: #64748b; font-size: 0.7rem;">Automático cada día</div>
                        </div>
                    </div>
                </div>
                <div style="margin-bottom: 12px;">
                    ${contractsHTML}
                </div>
                <button id="btn-create-corporate-contract" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.95rem; transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(16,185,129,0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                    ⚡ Crear Contrato Corporativo
                </button>
            </div>
        `;
    }

    // ==========================================
    // SEMANA 3 FASE 1: CONTRACT OFFERS PANEL
    // ==========================================

    renderContractOffers() {
        const offers = (this.game.state.corporateContractOffers || []).filter(o => {
            // No mostrar ofertas expiradas
            if (this.game.state.date > o.expiresDate) return false;
            return true;
        });

        console.log('🔍 DEBUG renderContractOffers:', {
            totalOffers: this.game.state.corporateContractOffers?.length || 0,
            validOffers: offers.length,
            rawData: this.game.state.corporateContractOffers
        });

        if (offers.length === 0) {
            return `
                <div class="hero-card">
                    <h3 style="margin:0 0 0.75rem 0; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">📬 Ofertas de Contratos</h3>
                    <div style="background: rgba(148,163,184,0.1); border: 1px solid rgba(148,163,184,0.3); border-radius: 8px; padding: 12px; text-align: center; color: #94a3b8;">
                        Sin ofertas disponibles por el momento. Vuelve en 7 días.
                    </div>
                </div>
            `;
        }

        let offersHTML = '';
        offers.forEach(offer => {
            const tierColor = {
                'LOCAL': '#8b5cf6',
                'REGIONAL': '#f59e0b',
                'NATIONAL': '#ef4444',
                'MULTINATIONAL': '#3b82f6',
                'GLOBAL': '#10b981'
            }[offer.tier] || '#cbd5e1';

            const tierLabel = {
                'LOCAL': '🟢 Local',
                'REGIONAL': '🟡 Regional',
                'NATIONAL': '🔴 Nacional',
                'MULTINATIONAL': '🔵 Multinacional',
                'GLOBAL': '✨ Global'
            }[offer.tier] || offer.tier;

            const daysLeft = Math.max(0, (offer.expiresDate - this.game.state.date) / (24 * 60 * 60 * 1000));
            const validation = this.game.managers.economy.validateContractAcceptance(offer.id);

            const statusClass = validation.valid ? 'valid' : 'invalid';
            const statusColor = validation.valid ? '#10b981' : '#ef4444';

            offersHTML += `
                <div style="background: rgba(255,255,255,0.05); border: 2px solid ${tierColor}; border-radius: 8px; padding: 14px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                <span style="background: ${tierColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700;">${tierLabel}</span>
                            </div>
                            <div style="color: #cbd5e1; font-size: 0.95rem; font-weight: 600;">${offer.company}</div>
                            <div style="color: #94a3b8; font-size: 0.8rem; margin-top: 2px;">${offer.description}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="color: #10b981; font-size: 1.1rem; font-weight: 700;">$${offer.dailyRevenue.toLocaleString()}</div>
                            <div style="color: #64748b; font-size: 0.75rem;">por día</div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; font-size: 0.8rem; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <div>
                            <div style="color: #94a3b8;">Duración</div>
                            <div style="color: #cbd5e1; font-weight: 600;">${offer.duration} días</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8;">Ingresos Totales</div>
                            <div style="color: #3b82f6; font-weight: 600;">$${offer.totalRevenue.toLocaleString()}</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8;">Pago Inicial</div>
                            <div style="color: #ef4444; font-weight: 600;">$${offer.upfrontFee.toLocaleString()}</div>
                        </div>
                    </div>

                    ${validation.valid ? 
                        `<button class="btn-accept-offer" data-offer-id="${offer.id}" style="width: 100%; padding: 10px; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                            ✅ Aceptar Oferta
                        </button>`
                        : 
                        `<div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 6px; padding: 8px; color: #ef4444; font-size: 0.8rem;">
                            <strong>No puedes aceptar:</strong><br>
                            ${validation.reasons.map(r => `• ${r}`).join('<br>')}
                        </div>`
                    }

                    <div style="color: #64748b; font-size: 0.7rem; margin-top: 8px; text-align: right;">
                        Expira en ${daysLeft.toFixed(0)} días
                    </div>
                </div>
            `;
        });

        return `
            <div class="hero-card">
                <h3 style="margin:0 0 0.75rem 0; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">📬 Ofertas de Contratos Corporativos</h3>
                <div style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); border-radius: 8px; padding: 10px; margin-bottom: 12px; font-size: 0.85rem; color: #cbd5e1;">
                    💼 Nuevas oportunidades de ingresos garantizados. Revisa los requisitos antes de aceptar.
                </div>
                ${offersHTML}
            </div>
        `;
    }

    // ==========================================
    // SEMANA 3: CREDIT SYSTEM UI
    // ==========================================

    renderCreditSystem() {
        const totalDebt = this.game.managers.economy.getTotalDebt();
        const maxLoan = this.game.managers.economy.calculateMaxLoanAmount();
        const activeLoans = (this.game.state.loans || []).filter(l => l.status === 'active');
        
        let loansHTML = '';
        if (activeLoans.length > 0) {
            loansHTML = activeLoans.map(loan => {
                const monthlyPayment = loan.monthlyPayment;
                const remainingMonths = loan.monthsRemaining;
                const totalRemaining = monthlyPayment * remainingMonths;
                const progress = ((loan.totalPayments - remainingMonths) / loan.totalPayments) * 100;
                
                return `
                    <div style="background: rgba(239,68,68,0.1); border-radius: 8px; padding: 10px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                            <div style="color: #cbd5e1; font-size: 0.85rem; font-weight: 600;">$${loan.amount.toLocaleString()}</div>
                            <div style="color: #ef4444; font-size: 0.75rem;">${(loan.interestRate * 100).toFixed(1)}% tasa</div>
                        </div>
                        <div style="color: #94a3b8; font-size: 0.75rem; margin-bottom: 4px;">
                            $${monthlyPayment.toLocaleString()}/mes • ${remainingMonths} meses restantes
                        </div>
                        <div style="width: 100%; height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                            <div style="height: 100%; background: #ef4444; width: ${progress}%;"></div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            loansHTML = '<div style="color: #94a3b8; font-size: 0.85rem; text-align: center; padding: 12px;">Sin préstamos activos</div>';
        }

        return `
            <div class="hero-card">
                <h3 style="margin:0 0 0.75rem 0; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">💳 Sistema de Crédito</h3>
                <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
                        <div>
                            <div style="color: #94a3b8; font-size: 0.75rem;">Deuda Total</div>
                            <div style="color: #ef4444; font-weight: 700; font-size: 1.1rem;">$${totalDebt.toLocaleString()}</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8; font-size: 0.75rem;">Máx Disponible</div>
                            <div style="color: #3b82f6; font-weight: 700; font-size: 1.1rem;">$${maxLoan.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
                
                ${loansHTML}
                
                <button id="btn-request-loan" class="modal-btn btn-primary" style="width: 100%; margin-top: 8px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 10px; font-size: 0.9rem;">
                    💰 Solicitar Préstamo
                </button>
            </div>
        `;
    }

    showLoanModal() {
        const maxLoan = this.game.managers.economy.calculateMaxLoanAmount();
        
        const contentHTML = `
            <div style="max-width: 100%;">
                <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                    <div style="color: #cbd5e1; font-size: 0.85rem; margin-bottom: 8px;">
                        💡 Los préstamos tienen interés basado en tu reputación. Pagas mensualmente a partir del mes 1.
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
                        <div>
                            <div style="color: #94a3b8; font-size: 0.75rem;">Máximo Disponible</div>
                            <div style="color: #3b82f6; font-weight: 700; font-size: 1.2rem;">$${maxLoan.toLocaleString()}</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8; font-size: 0.75rem;">Tu Reputación</div>
                            <div style="color: #10b981; font-weight: 700; font-size: 1.2rem;">${Math.round(this.game.state.reputation)}/100</div>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 0.9rem; margin-bottom: 8px; color: #cbd5e1;">
                        💵 Monto ($): <span id="amount-display" style="color: #3b82f6; font-weight: bold;">$100,000</span>
                    </label>
                    <input type="range" id="amount-slider" min="10000" max="${maxLoan}" step="10000" value="100000" 
                        style="width: 100%; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); outline: none; cursor: pointer;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; margin-top: 4px;">
                        <span>$10k</span>
                        <span>$${(maxLoan/2).toLocaleString()}</span>
                        <span>$${maxLoan.toLocaleString()}</span>
                    </div>
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 0.9rem; margin-bottom: 8px; color: #cbd5e1;">
                        📅 Duración (Meses)
                    </label>
                    <select id="months-select" style="width: 100%; padding: 10px; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 0.95rem;">
                        <option value="6">6 meses</option>
                        <option value="12" selected>12 meses (1 año)</option>
                        <option value="24">24 meses (2 años)</option>
                        <option value="36">36 meses (3 años)</option>
                    </select>
                </div>

                <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px;">
                    <h3 style="margin-top: 0; font-size: 0.9rem; color: #cbd5e1;">📊 Cálculo del Préstamo</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
                        <div>
                            <div style="color: #94a3b8;">Monto</div>
                            <div id="summary-amount" style="color: #cbd5e1; font-weight: 600;">$100,000</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8;">Tasa de Interés</div>
                            <div id="summary-rate" style="color: #ef4444; font-weight: 600;">8.0%</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8;">Duración</div>
                            <div id="summary-duration" style="color: #cbd5e1; font-weight: 600;">12 meses</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8;">Pago Mensual</div>
                            <div id="summary-monthly" style="color: #10b981; font-weight: 700; font-size: 1.1rem;">$867</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const actionsHTML = `
            <button class="modal-btn btn-secondary" id="btn-cancel-loan">Cancelar</button>
            <button class="modal-btn btn-primary" id="btn-confirm-loan">Solicitar Préstamo</button>
        `;

        this.showModal('💰 Solicitar Préstamo', contentHTML, actionsHTML);

        // Setup interactivity
        const amountSlider = document.getElementById('amount-slider');
        const amountDisplay = document.getElementById('amount-display');
        const monthsSelect = document.getElementById('months-select');
        const summaryAmount = document.getElementById('summary-amount');
        const summaryRate = document.getElementById('summary-rate');
        const summaryDuration = document.getElementById('summary-duration');
        const summaryMonthly = document.getElementById('summary-monthly');

        const rep = this.game.state.reputation || 50;
        const baseRate = 0.08;
        const riskMultiplier = (100 - rep) / 50;
        const rate = baseRate * Math.max(1.0, riskMultiplier);

        const updateSummary = () => {
            const amount = parseInt(amountSlider.value);
            const months = parseInt(monthsSelect.value);
            const monthlyPayment = Math.round((amount / months) + (amount * rate / 12));

            amountDisplay.textContent = `$${amount.toLocaleString()}`;
            summaryAmount.textContent = `$${amount.toLocaleString()}`;
            summaryRate.textContent = `${(rate * 100).toFixed(1)}%`;
            summaryDuration.textContent = `${months} meses`;
            summaryMonthly.textContent = `$${monthlyPayment.toLocaleString()}`;
        };

        amountSlider.addEventListener('input', updateSummary);
        monthsSelect.addEventListener('change', updateSummary);

        document.getElementById('btn-cancel-loan').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('btn-confirm-loan').addEventListener('click', () => {
            const amount = parseInt(amountSlider.value);
            const months = parseInt(monthsSelect.value);

            const result = this.game.managers.economy.requestLoan(amount, months);
            if (result.success) {
                this.hideModal();
                this.showNotification('Préstamo Aprobado', result.msg, 'success');
                this.renderEconomy(); // Refresh view
            } else {
                alert(result.msg);
            }
        });
    }

    showCorporateContractModal() {
        const routes = this.game.state.routes || [];
        if (routes.length === 0) {
            alert('No tienes rutas activas. Crea una ruta primero.');
            return;
        }

        const routeOptions = routes.map(r => {
            const route = this.game.managers.route.getRoute(r.id);
            if (!route) return '';
            const currentRevenue = route.dailyRevenue || 0;
            return `<option value="${r.id}" data-revenue="${currentRevenue}">${r.origin} → ${r.destination} ($${currentRevenue.toLocaleString()}/día)</option>`;
        }).join('');

        const companyNames = [
            'Amazon Corporate Travel',
            'Google Business Flights',
            'Microsoft Ventures',
            'Apple Executive Jet',
            'Meta Connect Services',
            'Tesla Mobility Group',
            'SpaceX Logistics',
            'Samsung Global Partners',
            'IBM Enterprise Travel',
            'Oracle Business Aviation'
        ];

        const contentHTML = `
            <div style="color: #cbd5e1;">
                <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; padding: 14px; margin-bottom: 16px;">
                    <div style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 8px;">
                        💼 Los contratos corporativos garantizan ingresos fijos diarios a cambio de reservar el 40% de los asientos de una ruta.
                    </div>
                    <div style="color: #64748b; font-size: 0.75rem;">
                        • Pago inicial: 10% del valor total del contrato<br>
                        • Ingresos garantizados: sin fluctuaciones de demanda<br>
                        • Capacidad reservada: 40% de los asientos no disponibles para venta libre
                    </div>
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 0.9rem; margin-bottom: 8px; color: #cbd5e1;">
                        🏢 Empresa Cliente
                    </label>
                    <select id="company-select" style="width: 100%; padding: 10px; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 0.95rem;">
                        ${companyNames.map(name => `<option value="${name}">${name}</option>`).join('')}
                    </select>
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 0.9rem; margin-bottom: 8px; color: #cbd5e1;">
                        ✈️ Ruta
                    </label>
                    <select id="route-select" style="width: 100%; padding: 10px; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 0.95rem;">
                        ${routeOptions}
                    </select>
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 0.9rem; margin-bottom: 8px; color: #cbd5e1;">
                        💰 Ingresos Diarios Garantizados: <span id="revenue-display" style="color: #10b981; font-weight: bold;">$5,000</span>
                    </label>
                    <input type="range" id="revenue-slider" min="1000" max="50000" step="500" value="5000" 
                        style="width: 100%; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); outline: none; cursor: pointer;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; margin-top: 4px;">
                        <span>$1k</span>
                        <span>$25k</span>
                        <span>$50k</span>
                    </div>
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 0.9rem; margin-bottom: 8px; color: #cbd5e1;">
                        📅 Duración (Días)
                    </label>
                    <select id="duration-select" style="width: 100%; padding: 10px; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 0.95rem;">
                        <option value="30">30 días (1 mes)</option>
                        <option value="60" selected>60 días (2 meses)</option>
                        <option value="90">90 días (3 meses)</option>
                        <option value="180">180 días (6 meses)</option>
                        <option value="365">365 días (1 año)</option>
                    </select>
                </div>

                <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px;">
                    <h3 style="margin-top: 0; font-size: 0.9rem; color: #cbd5e1;">📊 Resumen del Contrato</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
                        <div>
                            <div style="color: #94a3b8;">Ingresos Diarios</div>
                            <div id="summary-daily" style="color: #10b981; font-weight: 700;">$5,000</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8;">Duración</div>
                            <div id="summary-days" style="color: #cbd5e1; font-weight: 600;">60 días</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8;">Ingresos Totales</div>
                            <div id="summary-total" style="color: #3b82f6; font-weight: 700;">$300,000</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8;">Pago Inicial (10%)</div>
                            <div id="summary-upfront" style="color: #ef4444; font-weight: 700;">$30,000</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const actionsHTML = `
            <button class="modal-btn btn-secondary" id="btn-cancel-contract">Cancelar</button>
            <button class="modal-btn btn-primary" id="btn-confirm-contract">Crear Contrato</button>
        `;

        this.showModal('🏢 Crear Contrato Corporativo', contentHTML, actionsHTML);

        // Setup interactivity
        const revenueSlider = document.getElementById('revenue-slider');
        const revenueDisplay = document.getElementById('revenue-display');
        const durationSelect = document.getElementById('duration-select');
        const summaryDaily = document.getElementById('summary-daily');
        const summaryDays = document.getElementById('summary-days');
        const summaryTotal = document.getElementById('summary-total');
        const summaryUpfront = document.getElementById('summary-upfront');

        const updateSummary = () => {
            const dailyRevenue = parseInt(revenueSlider.value);
            const days = parseInt(durationSelect.value);
            const totalRevenue = dailyRevenue * days;
            const upfrontCost = totalRevenue * 0.1;

            revenueDisplay.textContent = `$${dailyRevenue.toLocaleString()}`;
            summaryDaily.textContent = `$${dailyRevenue.toLocaleString()}`;
            summaryDays.textContent = `${days} días`;
            summaryTotal.textContent = `$${totalRevenue.toLocaleString()}`;
            summaryUpfront.textContent = `$${upfrontCost.toLocaleString()}`;
        };

        revenueSlider.addEventListener('input', updateSummary);
        durationSelect.addEventListener('change', updateSummary);

        document.getElementById('btn-cancel-contract').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('btn-confirm-contract').addEventListener('click', () => {
            const company = document.getElementById('company-select').value;
            const routeId = document.getElementById('route-select').value;
            const dailyRevenue = parseInt(revenueSlider.value);
            const days = parseInt(durationSelect.value);

            const result = this.game.managers.economy.createCorporateContract(
                company,
                routeId,
                dailyRevenue,
                days
            );

            if (result.success) {
                this.hideModal();
                this.showNotification('Contrato Creado', result.msg, 'success');
                this.renderEconomy();
            } else {
                alert(result.msg);
            }
        });
    }

    // Show notification toast
    showNotification(title, message, type = 'info') {
        const notificationId = 'notification-' + Date.now();
        const bgColor = type === 'success' ? '#10b981' : type === 'warning' ? '#ef4444' : '#3b82f6';
        const notificationHTML = `
            <div id="${notificationId}" style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${bgColor};
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 9999;
                max-width: 400px;
                animation: slideIn 0.3s ease-out;
            ">
                <div style="font-weight: 700; margin-bottom: 4px;">${title}</div>
                <div style="font-size: 0.9rem; opacity: 0.95;">${message}</div>
            </div>
            <style>
                @keyframes slideIn {
                    from {
                        transform: translateX(450px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(450px);
                        opacity: 0;
                    }
                }
            </style>
        `;

        // Create temporary container if doesn't exist
        let notifContainer = document.getElementById('notification-container');
        if (!notifContainer) {
            notifContainer = document.createElement('div');
            notifContainer.id = 'notification-container';
            document.body.appendChild(notifContainer);
        }

        const notifDiv = document.createElement('div');
        notifDiv.innerHTML = notificationHTML;
        notifContainer.appendChild(notifDiv.firstElementChild);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            const notif = document.getElementById(notificationId);
            if (notif) {
                notif.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => notif.remove(), 300);
            }
        }, 3000);
    }

    // Event listener setup for credit system
    setupCreditSystemListeners() {
        const loanBtn = document.getElementById('btn-request-loan');
        if (loanBtn) {
            loanBtn.addEventListener('click', () => this.showLoanModal());
        }
    }

    // Event listener setup for contract offers
    setupContractOfferListeners() {
        const buttons = document.querySelectorAll('.btn-accept-offer');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const offerId = e.target.getAttribute('data-offer-id');
                this.showAcceptContractModal(offerId);
            });
        });
    }

    /**
     * Show modal to accept contract offer
     */
    showAcceptContractModal(offerId) {
        const offer = (this.game.state.corporateContractOffers || []).find(o => o.id === offerId);
        if (!offer) {
            alert('Oferta no encontrada');
            return;
        }

        // Get active routes from RouteManager using assignments
        const routes = (this.game.managers.routes?.getRoutes() || []).filter(r => {
            let isActive = Array.isArray(r.assignments) && r.assignments.some(a => a?.status === 'ACTIVE' || a?.status === 'active' || a?.status === true);
            if (!isActive && typeof r.status === 'string') {
                isActive = r.status.toUpperCase() === 'ACTIVE';
            }
            if (!isActive && r.assignedPlane) {
                const pl = this.game.managers.fleet?.ownedPlanes?.find(p => p.instanceId === r.assignedPlane);
                if (pl && pl.status === 'FLIGHT') isActive = true;
            }
            return isActive;
        });
        if (routes.length === 0) {
            alert('No tienes rutas activas para asignar a este contrato');
            return;
        }

        const routeOptions = routes.map(r => 
            `<option value="${r.id}">${r.origin} → ${r.dest} ($${(r.dailyRevenue || 0).toLocaleString()}/día)</option>`
        ).join('');

        const contentHTML = `
            <div style="color: #cbd5e1;">
                <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; padding: 12px; margin-bottom: 14px;">
                    <div style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 6px;">
                        ✓ Cumples todos los requisitos
                    </div>
                    <div style="font-size: 0.9rem; font-weight: 600; color: #10b981;">
                        ${offer.company} - ${offer.tier}
                    </div>
                </div>

                <div style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 0.9rem; margin-bottom: 8px; color: #cbd5e1;">
                        📍 Selecciona Ruta
                    </label>
                    <select id="route-select-contract" style="width: 100%; padding: 10px; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 0.95rem;">
                        ${routeOptions}
                    </select>
                </div>

                <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px;">
                    <h3 style="margin-top: 0; font-size: 0.9rem; color: #cbd5e1;">📊 Detalles del Contrato</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
                        <div>
                            <div style="color: #94a3b8;">Ingresos Diarios</div>
                            <div style="color: #10b981; font-weight: 700;">$${offer.dailyRevenue.toLocaleString()}</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8;">Duración</div>
                            <div style="color: #cbd5e1; font-weight: 600;">${offer.duration} días</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8;">Ingresos Totales</div>
                            <div style="color: #3b82f6; font-weight: 700;">$${offer.totalRevenue.toLocaleString()}</div>
                        </div>
                        <div>
                            <div style="color: #94a3b8;">Pago Inicial (10%)</div>
                            <div style="color: #ef4444; font-weight: 700;">-$${offer.upfrontFee.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <div style="background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); border-radius: 8px; padding: 10px; margin-top: 12px; font-size: 0.8rem; color: #fca5a5;">
                    ⚠️ El 40% de los asientos de la ruta serán reservados para este contrato durante su duración.
                </div>
            </div>
        `;

        const actionsHTML = `
            <button class="modal-btn btn-secondary" id="btn-cancel-offer">Cancelar</button>
            <button class="modal-btn btn-primary" id="btn-confirm-offer">Aceptar Contrato</button>
        `;

        this.showModal(`💼 Aceptar ${offer.company}`, contentHTML, actionsHTML);

        document.getElementById('btn-cancel-offer').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('btn-confirm-offer').addEventListener('click', () => {
            const routeId = document.getElementById('route-select-contract').value;
            const result = this.game.managers.economy.acceptContractOffer(offerId, routeId);
            
            if (result.success) {
                this.hideModal();
                this.showNotification('✅ Contrato Aceptado', result.msg, 'success');
                this.renderEconomy();
                this.game.save();
            } else {
                this.showNotification('❌ Error', result.msg, 'warning');
            }
        });
    }
}