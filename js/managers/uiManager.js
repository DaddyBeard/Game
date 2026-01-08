import { AIRCRAFT_TYPES } from '../models/aircraft.js';
import { AIRPORTS } from '../models/airport.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.elements = {
            money: document.getElementById('money-val'),
            date: document.getElementById('game-date'),
            views: document.querySelectorAll('.view'),
            navBtns: document.querySelectorAll('.nav-btn'),
            modalOverlay: document.getElementById('modal-container'),
            modalTitle: document.getElementById('modal-title'),
            modalBody: document.getElementById('modal-body'),
            modalActions: document.getElementById('modal-actions'),
            closeBtn: document.querySelector('.close-btn'),

            // Time controls
            btnPause: document.getElementById('btn-pause'),
            btnSpeed1x: document.getElementById('btn-speed-1x'),
            btnSpeed2x: document.getElementById('btn-speed-2x'),
            btnSpeed5x: document.getElementById('btn-speed-5x')
        };

        this.views = {
            dashboard: document.getElementById('dashboard-view'),
            routes: document.getElementById('routes-view'),
            fleet: document.getElementById('fleet-view'),
            market: document.getElementById('market-view'),
            menu: document.getElementById('menu-view')
        };

        // UI State
        this.rankShowTop10 = false;

        // Interactive Map State
        this.mapState = {
            scale: 1,
            offsetX: 0,
            offsetY: 0,
            isDragging: false,
            lastX: 0,
            lastY: 0
        };

        this.setupNavigation();
        this.setupModal();
        this.setupTimeControls();
        this.setupKeyboardShortcuts();
    }

    init() {
        this.currentMoney = this.game.state.money;
        this.targetMoney = this.game.state.money;

        // Check if hub is selected; if not, show hub selection overlay
        if (!this.game.state.mainHub) {
            this.showHubSelection();
            return; // Don't proceed with normal init
        }

        this.updateHUD();
        this.renderDashboard(); // Initial dashboard render
        setInterval(() => this.updateHUD(), 1000);
        // Animate money counter
        setInterval(() => this.animateMoney(), 50);
    }

    showHubSelection() {
        const overlay = document.getElementById('hub-selection-overlay');
        if (!overlay) return;

        overlay.classList.remove('hidden');

        // Clear previous selections
        let selectedHub = null;
        let selectedIATA = null;

        // Populate hub grid
        const hubGrid = document.getElementById('hub-grid');
        hubGrid.innerHTML = '';

        const hubs = ['MAD', 'LHR', 'CDG', 'JFK', 'AMS', 'ORD'];
        
        hubs.forEach(hubId => {
            const airport = AIRPORTS[hubId];
            if (!airport) return;

            const dailyFee = this.game.getHubDailyFee(hubId);
            const baseCash = 10000000;
            const hubCostFactor = dailyFee / 10000;
            const startingCash = Math.floor(baseCash - (baseCash * hubCostFactor * 0.5));

            const card = document.createElement('div');
            card.className = 'hub-card';
            card.innerHTML = `
                <div class="hub-card-header">
                    <div class="hub-card-title">${airport.city}</div>
                    <div class="hub-card-iata">${airport.id}</div>
                </div>
                <div class="hub-card-body">
                    <div class="hub-card-stat">
                        <span class="hub-card-stat-label">Población:</span>
                        <span class="hub-card-stat-value">${airport.pop}M</span>
                    </div>
                    <div class="hub-card-stat">
                        <span class="hub-card-stat-label">Pista:</span>
                        <span class="hub-card-stat-value">${airport.runway}m</span>
                    </div>
                    <div class="hub-card-cost">
                        📊 Fee Diario: $${dailyFee.toLocaleString()}
                    </div>
                    <div class="hub-card-capital">
                        💰 Capital Inicial: $${startingCash.toLocaleString()}
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                // Remove previous selection
                document.querySelectorAll('.hub-card').forEach(c => c.classList.remove('selected'));
                // Select this card
                card.classList.add('selected');
                selectedHub = hubId;

                // Enable confirm button
                document.getElementById('btn-confirm-hub').disabled = false;
            });

            hubGrid.appendChild(card);
        });

        // Setup confirm button
        const confirmBtn = document.getElementById('btn-confirm-hub');
        const nameInput = document.getElementById('company-name-input');
        const iataInput = document.getElementById('company-iata-input');

        confirmBtn.addEventListener('click', async () => {
            if (!selectedHub) {
                alert('Selecciona un hub primero');
                return;
            }

            let iataCode = iataInput.value.trim().toUpperCase();
            if (!iataCode) {
                alert('Ingresa un código IATA (2 letras)');
                return;
            }
            if (iataCode.length !== 2 || !/^[A-Z]{2}$/.test(iataCode)) {
                alert('El código IATA debe tener exactamente 2 letras');
                return;
            }

            const companyName = nameInput.value.trim() || "SkyStart Airlines";
            this.game.state.companyName = companyName;
            this.game.state.companyIATA = iataCode;

            // Start game with selected hub
            const result = await this.game.newGameWithHub(selectedHub);
            if (result.success) {
                // Hide overlay
                overlay.classList.add('hidden');

                // Reinitialize UI
                this.updateHUD();
                this.renderDashboard();
                setInterval(() => this.updateHUD(), 1000);
                setInterval(() => this.animateMoney(), 50);

                console.log(`🎮 Game started with hub: ${selectedHub} (${companyName}) - IATA: ${iataCode}`);
            }
        });
    }

    updateHUD() {
        this.targetMoney = this.game.state.money;

        const dateObj = new Date(this.game.state.date);
        const day = dateObj.getDate();
        const month = dateObj.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
        const year = dateObj.getFullYear();
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');

        this.elements.date.textContent = `${day} ${month} ${year} ${hours}:${minutes}`;

        // Also keep dashboard KPIs in sync
        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
        const moneyEl = document.getElementById('dash-money');
        const routesEl = document.getElementById('dash-routes');
        const fleetEl = document.getElementById('dash-fleet');
        const revenueEl = document.getElementById('dash-revenue');
        const costsEl = document.getElementById('dash-costs');
        const netEl = document.getElementById('dash-net');

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

        // Update reputation in status bar
        const reputationEl = document.getElementById('reputation-val');
        const reputation = this.game.state.reputation || 50;
        if (reputationEl) {
            reputationEl.textContent = `${Math.round(reputation)}/100`;
        }

        // Update reputation in dashboard card
        const dashRepEl = document.getElementById('dash-reputation');
        if (dashRepEl) {
            dashRepEl.textContent = `${Math.round(reputation)}/100`;
        }

        // Update reputation bar in dashboard if visible
        const repBar = document.getElementById('rep-bar');
        if (repBar) {
            repBar.style.width = `${reputation}%`;
        }

        // Update load factor info
        const repTrend = document.getElementById('rep-trend');
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

        // Update hubs
        this.renderHubs();

        // Update level progress
        this.renderLevelProgress();

        // Update level badge
        const levelEl = document.getElementById('level-val');
        if (levelEl) levelEl.textContent = `Lv ${this.game.state.level || 1}`;

        // Update compact level progress ring
        const ringEl = document.getElementById('level-progress');
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
                    const panel = document.getElementById('level-panel');
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
        const hubBtn = document.getElementById('btn-open-hub');
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
        
        // Use global LEVEL_REQUIREMENTS if available
        const LEVEL_REQUIREMENTS = window.LEVEL_REQUIREMENTS || {};
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
        const diff = this.targetMoney - this.currentMoney;
        if (Math.abs(diff) < 1) {
            this.currentMoney = this.targetMoney;
        } else {
            this.currentMoney += diff * 0.15; // Smooth lerp
        }

        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
        this.elements.money.textContent = formatter.format(Math.round(this.currentMoney));

        // Add animation class when changing
        if (Math.abs(diff) > 0) {
            this.elements.money.classList.add('count-up');
            setTimeout(() => this.elements.money.classList.remove('count-up'), 400);
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

        // Show target View
        const view = document.getElementById(`${viewId}-view`);
        if (view) {
            view.classList.remove('hidden');
            view.style.display = 'block';
            setTimeout(() => view.classList.add('active'), 10);

            // Refresh content
            if (viewId === 'dashboard') this.renderDashboard();
            if (viewId === 'market') this.renderMarket();
            if (viewId === 'fleet') this.renderFleet();
            if (viewId === 'routes') {
                this.renderRoutes();
                setTimeout(() => {
                    if (!this.map) this.initMap();
                    else this.map.invalidateSize();
                }, 100);
            }
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
        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

        // Get elements
        const moneyEl = document.getElementById('dash-money');
        const routesEl = document.getElementById('dash-routes');
        const fleetEl = document.getElementById('dash-fleet');
        const revenueEl = document.getElementById('dash-revenue');
        const costsEl = document.getElementById('dash-costs');
        const netEl = document.getElementById('dash-net');

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
        const panel = document.getElementById('level-panel');
        if (!panel) return;

        // Dynamically import requirements to avoid tight coupling
        try {
            const current = this.game.state.level || 1;
            const nextLevel = current + 1;
            // Lazy access via global import already loaded in GameManager; fallback fetch
            const reqsMap = window.LEVEL_REQUIREMENTS || null;
            let reqs = null;
            if (reqsMap && reqsMap[nextLevel]) {
                reqs = reqsMap[nextLevel];
            }
        } catch {}

        // Fallback: calcular requisitos localmente
        const level = this.game.state.level || 1;
        const nextLevel = level + 1;
        const reqs = this.getNextLevelRequirements();

        const fleet = this.game.managers.fleet.ownedPlanes.length;
        const routes = this.game.managers.routes.getRoutes().length;
        const reputation = Math.round(this.game.state.reputation || 0);
        const profit = this.game.state.cumulativeProfit || 0;

        const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
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

    renderRanking() {
        const rankingList = document.getElementById('ranking-list');
        if (!rankingList) return;

        try {
            // Si no hay hub seleccionado, no mostrar ranking
            if (!this.game.state.mainHub) {
                rankingList.innerHTML = '';
                return;
            }

            // Fallback si no hay RivalManager
            if (!this.game.managers.rivals) {
                rankingList.innerHTML = '';
                return;
            }

            const ranking = this.game.managers.rivals.getRanking();
            
            if (!ranking || ranking.length === 0) {
                rankingList.innerHTML = '';
                return;
            }

            const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

            rankingList.innerHTML = '';

            // Barra de toggle Top N
            const toggleBar = document.createElement('div');
            toggleBar.style.cssText = `display:flex; justify-content:flex-end; margin-bottom:0.5rem;`;
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'rank-toggle';
            toggleBtn.textContent = this.rankShowTop10 ? 'Ver top 4' : 'Ver top 10';
            toggleBtn.style.cssText = `background: rgba(255,255,255,0.06); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 6px 10px; font-size: 0.8rem; cursor: pointer;`;
            toggleBtn.addEventListener('click', () => {
                this.rankShowTop10 = !this.rankShowTop10;
                this.renderRanking();
            });
            toggleBar.appendChild(toggleBtn);
            rankingList.appendChild(toggleBar);

            // Mostrar posición del jugador
            const playerPos = this.game.managers.rivals.getPlayerPosition();
            const totalRivals = this.game.managers.rivals.getTotalRivals();

            const positionDiv = document.createElement('div');
            positionDiv.style.cssText = `
                padding: 0.75rem;
                background: rgba(16, 185, 129, 0.2);
                border-left: 3px solid #10b981;
                border-radius: 8px;
                margin-bottom: 0.75rem;
                font-size: 0.85rem;
            `;
            positionDiv.innerHTML = `
                <div style="color: #64748b;">Tu posición</div>
                <div style="font-weight: bold; color: #10b981; font-size: 1.1rem;">
                    #${playerPos} de ${totalRivals}
                </div>
            `;
            rankingList.appendChild(positionDiv);

            const topN = this.rankShowTop10 ? 10 : 4;
            const slice = ranking.slice(0, topN);

            // Mostrar top N del ranking
            slice.forEach((airline) => {
                const badge = airline.isPlayer ? '👤' : '🏢';
                const color = airline.color || '#3b82f6';
                
                const styles = `
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.75rem;
                    background: ${airline.isPlayer ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255,255,255,0.05)'};
                    border-left: 3px solid ${color};
                    border-radius: 8px;
                    font-size: 0.9rem;
                    margin-bottom: 0.5rem;
                `;

                const row = document.createElement('div');
                row.style.cssText = styles;
                row.innerHTML = `
                    <div style="flex: 1;">
                        <div style="font-weight: bold; color: white;">
                            <span style="color: #94a3b8; margin-right: 0.5rem;">${airline.position}.</span>
                            ${badge} ${airline.name}
                        </div>
                        <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.25rem;">
                            💰 ${formatter.format(airline.dailyIncome)} · ⭐ ${Math.round(airline.reputation)}/100
                        </div>
                    </div>
                `;

                rankingList.appendChild(row);
            });

            // Si el jugador no está en Top N, añadir su fila destacada al final
            if (playerPos > topN) {
                const player = ranking.find(a => a.isPlayer);
                if (player) {
                    const sep = document.createElement('div');
                    sep.style.cssText = 'border-top: 1px dashed rgba(255,255,255,0.12); margin: 6px 0;';
                    rankingList.appendChild(sep);

                    const row = document.createElement('div');
                    row.style.cssText = `display:flex; align-items:center; justify-content:space-between; padding:0.75rem; background: rgba(16,185,129,0.18); border-left: 3px solid #10b981; border-radius:8px; font-size:0.9rem;`;
                    row.innerHTML = `
                        <div style="flex:1;">
                            <div style=\"font-weight:bold; color:white;\"><span style=\"color:#94a3b8; margin-right:0.5rem;\">${player.position}.</span>👤 ${player.name}</div>
                            <div style=\"font-size:0.8rem; color:#64748b; margin-top:0.25rem;\">💰 ${formatter.format(player.dailyIncome)} · ⭐ ${Math.round(player.reputation)}/100</div>
                        </div>
                    `;
                    rankingList.appendChild(row);
                }
            }
        } catch (err) {
            console.error('❌ Error renderizando ranking:', err);
            rankingList.innerHTML = '';
        }
    }


    // --- MARKET RENDERER ---
    renderMarket() {
        const container = this.views.market;
        container.innerHTML = '<h2>Concesionario</h2><div class="list-container"></div>';
        const list = container.querySelector('.list-container');

        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
        const currentLevel = this.game.state.level || 1;

        // Get all unlocked aircraft based on level
        const unlockedAircraft = this.getUnlockedAircraft(currentLevel);

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
                    ${isLocked ? '<div style="color: #ef4444; font-size: 0.8rem; margin-bottom: 0.5rem;">🔒 Bloqueado</div>' : ''}
                    <div class="specs">
                        <span>✈ ${plane.range}km</span>
                        <span>👥 ${plane.seats} pax</span>
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
                    this.showError(`🔒 Este avión se desbloquea en nivel ${unlockLevel}`);
                });
            } else {
                btn.addEventListener('click', () => {
                    this.showPlaneDetails(plane);
                });
            }

            // Stagger animation - Use 'both' to handle initial state safely
            card.style.animation = `staggerFadeIn 0.4s ease-out ${idx * 0.06}s both`;

            list.appendChild(card);
        });
    }

    getUnlockedAircraft(level) {
        // Import LEVEL_REQUIREMENTS dynamically or access from game
        const LEVEL_REQUIREMENTS = window.LEVEL_REQUIREMENTS || {};
        const unlocked = [];
        
        for (let i = 1; i <= level; i++) {
            const req = LEVEL_REQUIREMENTS[i];
            if (req && req.unlocksAircraft) {
                unlocked.push(...req.unlocksAircraft);
            }
        }
        
        return unlocked;
    }

    getUnlockLevelForAircraft(aircraftId) {
        const LEVEL_REQUIREMENTS = window.LEVEL_REQUIREMENTS || {};
        
        for (let i = 1; i <= 10; i++) {
            const req = LEVEL_REQUIREMENTS[i];
            if (req && req.unlocksAircraft && req.unlocksAircraft.includes(aircraftId)) {
                return i;
            }
        }
        
        return 1; // Default to level 1 if not found
    }

    showPlaneDetails(plane) {
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

        const input = document.getElementById('reg-input');
        const confirm = document.getElementById('reg-confirm');
        const cancel = document.getElementById('reg-cancel');

        // Auto-focus input
        setTimeout(() => input.focus(), 100);

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
        const currentRoute = this.game.managers.routes.getRoutes().find(r => r.assignedPlane === plane.instanceId);
        const conditionColor = plane.condition > 70 ? '#4ade80' : plane.condition > 40 ? '#fbbf24' : '#ef4444';

        const html = `
            <div class="aircraft-details-modal">
                <!-- Tabs Navigation -->
                <div class="tab-nav" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                    <button class="tab-btn active" data-tab="overview">📊 Resumen</button>
                    <button class="tab-btn" data-tab="performance">💰 Rendimiento</button>
                    <button class="tab-btn" data-tab="route">🗺️ Ruta</button>
                    <button class="tab-btn" data-tab="maintenance">🛠️ Mantenimiento</button>
                </div>
                
                <!-- Tab Contents -->
                <div class="tab-content active" data-content="overview">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="${plane.baseStats.image}" style="width: 100%; max-height: 150px; object-fit: contain; border-radius: 8px; margin-bottom: 15px;">
                        <h3 style="margin: 0 0 5px 0;">${plane.baseStats.name}</h3>
                        <p style="color: #94a3b8; margin: 0; font-family: monospace;">${plane.registration}</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;">
                        <div class="stat-card" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-size: 0.7rem; color: #94a3b8; margin-bottom: 5px;">ESTADO</div>
                            <div style="font-size: 1.1rem; font-weight: bold; color: ${conditionColor};">${Math.round(plane.condition)}%</div>
                        </div>
                        <div class="stat-card" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-size: 0.7rem; color: #94a3b8; margin-bottom: 5px;">ESTATUS</div>
                            <div style="font-size: 1.1rem; font-weight: bold;" class="status ${plane.status.toLowerCase()}">${plane.status}</div>
                        </div>
                        <div class="stat-card" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-size: 0.7rem; color: #94a3b8; margin-bottom: 5px;">RANGO</div>
                            <div style="font-size: 1.1rem; font-weight: bold;">${plane.baseStats.range} km</div>
                        </div>
                        <div class="stat-card" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-size: 0.7rem; color: #94a3b8; margin-bottom: 5px;">VELOCIDAD</div>
                            <div style="font-size: 1.1rem; font-weight: bold;">${plane.baseStats.speed} km/h</div>
                        </div>
                        <div class="stat-card" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-size: 0.7rem; color: #94a3b8; margin-bottom: 5px;">HORAS VOLADAS</div>
                            <div style="font-size: 1.1rem; font-weight: bold;">${Math.round(plane.hoursFlown || 0)} h</div>
                        </div>
                        <div class="stat-card" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-size: 0.7rem; color: #94a3b8; margin-bottom: 5px;">ANTIGÜEDAD</div>
                            <div style="font-size: 1.1rem; font-weight: bold;">${Math.max(0, ((this.game.state.date || Date.now()) - (plane.deliveredAt || Date.now())) / 86400000).toFixed(1)} d</div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 10px; font-weight: bold;">CONFIGURACIÓN DE CABINA</div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #cbd5e1;">Turista:</span>
                            <span style="font-weight: bold; color: #4ade80;">${plane.configuration.economy}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #cbd5e1;">Premium:</span>
                            <span style="font-weight: bold; color: #a78bfa;">${plane.configuration.premium}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #cbd5e1;">Business:</span>
                            <span style="font-weight: bold; color: #fbbf24;">${plane.configuration.business}</span>
                        </div>
                    </div>
                </div>
                
                <div class="tab-content" data-content="performance" style="display: none;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px;">
                        <div class="stat-card" style="background: rgba(74, 222, 128, 0.1); padding: 15px; border-radius: 8px; border: 1px solid rgba(74, 222, 128, 0.2);">
                            <div style="font-size: 0.75rem; color: #4ade80; margin-bottom: 5px;">INGRESOS TOTALES</div>
                            <div style="font-size: 1.2rem; font-weight: bold; color: #4ade80;">$${plane.totalRevenue ? plane.totalRevenue.toLocaleString() : '0'}</div>
                        </div>
                        <div class="stat-card" style="background: rgba(59, 130, 246, 0.1); padding: 15px; border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.2);">
                            <div style="font-size: 0.75rem; color: #3b82f6; margin-bottom: 5px;">PASAJEROS TOTALES</div>
                            <div style="font-size: 1.2rem; font-weight: bold; color: #3b82f6;">${plane.totalPassengers ? plane.totalPassengers.toLocaleString() : '0'}</div>
                        </div>
                        <div class="stat-card" style="background: rgba(248, 180, 0, 0.1); padding: 15px; border-radius: 8px; border: 1px solid rgba(234, 179, 8, 0.25);">
                            <div style="font-size: 0.75rem; color: #fbbf24; margin-bottom: 5px;">HORAS VOLADAS</div>
                            <div style="font-size: 1.2rem; font-weight: bold; color: #fbbf24;">${Math.round(plane.hoursFlown || 0)} h</div>
                        </div>
                        <div class="stat-card" style="background: rgba(14, 165, 233, 0.12); padding: 15px; border-radius: 8px; border: 1px solid rgba(14, 165, 233, 0.25);">
                            <div style="font-size: 0.75rem; color: #38bdf8; margin-bottom: 5px;">ANTIGÜEDAD</div>
                            <div style="font-size: 1.2rem; font-weight: bold; color: #38bdf8;">${Math.max(0, ((this.game.state.date || Date.now()) - (plane.deliveredAt || Date.now())) / 86400000).toFixed(1)} d</div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <h4 style="margin: 0 0 15px 0; font-size: 0.9rem; color: #94a3b8;">HISTORIAL DE VUELOS (Últimos 10)</h4>
                        ${(!plane.flightHistory || plane.flightHistory.length === 0) ?
                '<div style="text-align: center; padding: 30px; color: #64748b;">Sin vuelos registrados aún</div>' :
                `<div class="history-table" style="max-height: 300px; overflow-y: auto;">
                                ${plane.flightHistory.map(flight => `
                                    <div style="display: flex; justify-content: space-between; padding: 12px; margin-bottom: 8px; background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                                        <div>
                                            <div style="font-weight: bold; color: #cbd5e1; margin-bottom: 3px;">${flight.route}</div>
                                            <div style="font-size: 0.7rem; color: #64748b;">${flight.date}</div>
                                        </div>
                                        <div style="text-align: right;">
                                            <div style="color: #4ade80; font-weight: bold;">+$${flight.revenue.toLocaleString()}</div>
                                            <div style="font-size: 0.7rem; color: #64748b;">${flight.passengers} pax</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>`
            }
                    </div>
                </div>
                
                <div class="tab-content" data-content="route" style="display: none;">
                    ${currentRoute ? `
                        <div style="background: rgba(74, 222, 128, 0.1); padding: 15px; border-radius: 8px; border: 1px solid rgba(74, 222, 128, 0.2); margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <div>
                                    <h4 style="margin: 0 0 5px 0; font-size: 1.2rem;">${currentRoute.origin} ➔ ${currentRoute.dest}</h4>
                                    <p style="margin: 0; font-size: 0.85rem; color: #94a3b8;">${currentRoute.distance} km</p>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 1.3rem; font-weight: bold; color: #4ade80;">+$${currentRoute.dailyRevenue}</div>
                                    <div style="font-size: 0.7rem; color: #64748b;">/día</div>
                                </div>
                            </div>
                            <button id="btn-remove-route" class="modal-btn" style="width: 100%; padding: 12px; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; border-radius: 8px; cursor: pointer;">
                                ❌ Eliminar Ruta
                            </button>
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 40px; color: #64748b;">
                            <div style="font-size: 3rem; margin-bottom: 15px;">✈️</div>
                            <p style="margin: 0 0 20px 0;">Este avión no tiene ruta asignada</p>
                            ${plane.status === 'IDLE' ?
                `<button id="btn-go-routes" class="modal-btn btn-primary" style="width: 100%; padding: 12px;">Ir a Rutas</button>` :
                `<p style="color: #fbbf24; font-size: 0.85rem;">El avión debe estar IDLE para asignar rutas</p>`
            }
                        </div>
                    `}
                </div>
                
                <div class="tab-content" data-content="maintenance" style="display: none;">
                    ${this.getMaintenanceTabHTML(plane)}
                </div>
            </div>
        `;

        this.showModal(`${plane.baseStats.name} - ${plane.registration}`, html);

        // Ajustar tamaño del modal para la ficha de avión (más ancho y alto cómodo)
        const modalContent = this.elements.modalOverlay.querySelector('.modal-content');
        const modalBody = this.elements.modalBody;
        if (modalContent) {
            modalContent.style.maxWidth = '960px';
            modalContent.style.width = '90%';
            modalContent.style.maxHeight = '85vh';
        }
        if (modalBody) {
            modalBody.style.maxHeight = '70vh';
            modalBody.style.overflowY = 'auto';
        }

        // Tab switching logic
        const tabBtns = document.querySelectorAll('.tab-btn');
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

        // Route actions
        const btnRemove = document.getElementById('btn-remove-route');
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

        const btnGoRoutes = document.getElementById('btn-go-routes');
        if (btnGoRoutes) {
            btnGoRoutes.addEventListener('click', () => {
                this.hideModal();
                this.switchView('routes');
            });
        }

        // Maintenance Setup
        this.setupMaintenanceActions(plane);
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
        let listContainer = document.getElementById('routes-list');

        // Self-healing: If stale HTML is cached and missing container, recreate structure
        if (!listContainer) {
            console.warn('DOM Repair: Recreating missing routes structure...');
            const view = this.views.routes;
            if (view) {
                view.innerHTML = `
                    <h2>Rutas</h2>
                    <div class="map-container" style="margin-bottom: 1rem;">
                        <canvas id="route-map" width="800" height="400"
                            style="width: 100%; height: 300px; border-radius: 12px; background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(255, 255, 255, 0.08);"></canvas>
                    </div>
                    <div id="routes-list"></div>
                `;
                listContainer = document.getElementById('routes-list');
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
                const label = this.game.managers.rivals?.getCompetitionLabelForRoute?.(r.origin, r.dest) || 'Baja';
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

                html += `
                    <div class="route-card" data-route-id="${r.id}" style="cursor: pointer;">
                        <div class="route-info">
                            <h3>${r.origin} ➔ ${r.dest}</h3>
                            <p>${plane ? plane.baseStats.name : 'Unknown'}</p>
                            <p>${r.distance}km • Hub: ${hubBase}</p>
                            <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;">
                                <div style="display:inline-block; font-size:0.75rem; color:${compColor}; background:${compBg}; border:1px solid ${compBorder}; border-radius:999px; padding:4px 8px;">
                                    ⚔️ ${label}
                                </div>
                                <div style="display:inline-block; font-size:0.75rem; color:${priceColor}; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); border-radius:999px; padding:4px 8px;">
                                    💵 ${priceLabel} (${priceDiff > 0 ? '+' : ''}${priceDiff}%)
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
                `;
            });
            html += `</div>`;
        }

        listContainer.innerHTML = html;

        const btnNewRoute = document.getElementById('btn-new-route');
        if (btnNewRoute) {
            btnNewRoute.addEventListener('click', () => {
                this.showNewRouteParams();
            });
        }

        // Add click handlers to route cards
        const routeCards = listContainer.querySelectorAll('.route-card[data-route-id]');
        routeCards.forEach(card => {
            card.addEventListener('click', () => {
                const routeId = card.dataset.routeId;
                this.showRoutePricingModal(routeId);
            });
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

        const airports = Object.values(AIRPORTS);
        const options = airports.map(a => `<option value="${a.id}">${a.city} (${a.id})</option>`).join('');

        const planeOptions = availablePlanes.map(p => `<option value="${p.instanceId}">${p.baseStats.name} (${p.registration}) - Rango: ${p.baseStats.range}km</option>`).join('');

        const html = `
            <div class="form-group">
                <label>Origen</label>
                <select id="route-origin" class="form-select">${options}</select>
            </div>
            <div class="form-group">
                <label>Destino</label>
                <select id="route-dest" class="form-select">${options}</select>
            </div>
            <div class="form-group">
                <label>Avión</label>
                <select id="route-plane" class="form-select">${planeOptions}</select>
            </div>
            <div id="route-calc" class="route-preview hidden">
                Distancia: <span id="calc-dist">0</span>km <br>
                Costo Setup: $<span id="calc-cost">0</span><br>
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
        const planeSel = document.getElementById('route-plane');
        const priceSlider = document.getElementById('price-slider-new');
        const priceValue = document.getElementById('price-value-new');
        const rivalPriceIndicator = document.getElementById('rival-price-indicator');
        const revenuePreview = document.getElementById('revenue-preview');
        const previewRevenueNew = document.getElementById('preview-revenue-new');
        const previewLoadNew = document.getElementById('preview-load-new');

        // Initial default Dest
        if (destSel.options.length > 1) destSel.selectedIndex = 1;

        let currentPriceMultiplier = 1.0;

        const updateCalc = () => {
            const o = originSel.value;
            const d = destSel.value;
            const dist = this.game.managers.routes.getDistance(o, d);
            const cost = 5000 + (dist * 2);
            const planeId = planeSel.value;
            const plane = availablePlanes.find(p => p.instanceId === planeId);

            document.getElementById('calc-dist').textContent = dist;
            document.getElementById('calc-cost').textContent = cost;
            const compEl = document.getElementById('calc-comp');
            if (compEl) {
                const label = this.game.managers.rivals?.getCompetitionLabelForRoute?.(o, d) || 'Baja';
                compEl.textContent = label;
                // Color según nivel
                let color = '#22c55e';
                if (label === 'Media') color = '#f59e0b';
                if (label === 'Alta') color = '#ef4444';
                compEl.style.color = color;
            }
            
            // Show rival average price
            const rivalAvg = this.game.managers.routes.getRivalAveragePrice(o, d);
            const priceDiff = ((currentPriceMultiplier - rivalAvg) / rivalAvg * 100).toFixed(0);
            rivalPriceIndicator.textContent = `(Rivales: ${(rivalAvg * 100).toFixed(0)}%, ${priceDiff > 0 ? '+' : ''}${priceDiff}%)`;
            
            // Calculate revenue preview
            if (plane) {
                const totalSeats = plane.baseStats.seats || 0;
                // Default configuration: 70% economy, 20% premium, 10% business
                const seats = {
                    economy: Math.floor(totalSeats * 0.7),
                    premium: Math.floor(totalSeats * 0.2),
                    business: Math.ceil(totalSeats * 0.1)
                };
                
                const revenue = this.game.managers.routes.calculatePotentialRevenue(dist, seats, currentPriceMultiplier);
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

        originSel.addEventListener('change', updateCalc);
        destSel.addEventListener('change', updateCalc);
        planeSel.addEventListener('change', updateCalc);
        priceSlider.addEventListener('input', updatePrice);
        
        updateCalc(); // Run once

        document.getElementById('confirm-route').addEventListener('click', () => {
            const result = this.game.managers.routes.createRoute(
                originSel.value,
                destSel.value,
                planeSel.value,
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
        if (this.map) return;

        console.log('🗺️ INITIALIZING MAP...');

        // Initialize Leaflet Map
        // Center roughly on Europe/Atlantic for start
        this.map = L.map('route-map', {
            center: [20, 0],
            zoom: 2,
            minZoom: 2,
            zoomControl: false, // We'll add it in a better position or use custom
            attributionControl: false
        });

        console.log('🗺️ Map object created');

        // Add Dark Theme Tile Layer (CartoDB Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);

        // Add zoom control to bottom right
        L.control.zoom({
            position: 'bottomright'
        }).addTo(this.map);

        this.mapLayers = {
            markers: L.layerGroup().addTo(this.map),
            routes: L.layerGroup().addTo(this.map),
            planes: L.layerGroup().addTo(this.map)
        };

        // Track plane markers by route id so we can update positions without recreating
        this.planeMarkers = {};

        // Add test button listener
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

        // 1. Gather all unique airports
        const airportSet = new Set();
        routes.forEach(r => {
            airportSet.add(r.origin);
            airportSet.add(r.dest);
        });

        // Add major hubs if empty (decoration)
        if (airportSet.size === 0) {
            ['MAD', 'JFK', 'LHR', 'HND', 'DXB'].forEach(id => airportSet.add(id));
        }

        // 2. Add Airport Markers
        airportSet.forEach(id => {
            const airport = AIRPORTS[id];
            if (!airport) return;

            const icon = L.divIcon({
                className: 'airport-marker',
                html: `<div class="dot"></div><div class="label">${id}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15] // Center
            });

            L.marker([airport.lat, airport.lon], { icon: icon }).addTo(markersLayer);
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
        if (this.game.state.isPaused) {
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
                    html: '✈️',
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

    showFlightInfoPanel(route, plane, origin, dest, progress) {
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
                <strong>✈️ ${plane ? plane.registration : 'N/A'}</strong>
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
        const label = this.game.managers.rivals?.getCompetitionLabelForRoute?.(originId, destId) || 'Baja';
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

    showError(msg) {
        // Simple toast or alert
        alert(msg);
    }

    showRoutePricingModal(routeId) {
        const route = this.game.managers.routes.getRoutes().find(r => r.id === routeId);
        if (!route) return;

        const currentPrice = route.priceMultiplier || 1.0;
        const rivalAvg = this.game.managers.routes.getRivalAveragePrice(route.origin, route.dest);
        const currentYield = this.game.managers.routes.calculateYield(route);
        
        // Calculate preview data
        const calculatePreview = (multiplier) => {
            const newRevenue = this.game.managers.routes.calculatePotentialRevenue(
                route.distance,
                route.seats,
                multiplier
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
        let preview = calculatePreview(previewMultiplier);

        const contentHTML = `
            <div style="max-width: 100%;">
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
                    
                    <div style="margin-bottom: 8px;">
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

                <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 12px; margin: 16px 0; font-size: 0.85rem; color: #93c5fd;">
                    💡 <strong>Tip:</strong> Precios bajos aumentan ocupación pero reducen ingreso por pasajero. Precios altos mejoran yield pero reducen demanda.
                </div>
            </div>
        `;

        const actionsHTML = `
            <button class="modal-btn btn-secondary" id="btn-cancel-pricing" style="flex: 1;">Cancelar</button>
            <button class="modal-btn btn-primary" id="btn-apply-pricing" style="flex: 1;">Aplicar Cambios</button>
        `;

        this.showModal(`Ajustar Precio - ${route.origin} ➔ ${route.dest}`, contentHTML, actionsHTML);

        // Setup slider interactivity
        const slider = document.getElementById('price-slider');
        const valueDisplay = document.getElementById('price-value');
        const previewRevenue = document.getElementById('preview-revenue');
        const previewRevenueChange = document.getElementById('preview-revenue-change');
        const previewLoad = document.getElementById('preview-load');
        const previewLoadChange = document.getElementById('preview-load-change');
        const previewYieldElem = document.getElementById('preview-yield');
        const previewYieldChange = document.getElementById('preview-yield-change');

        const updatePreview = () => {
            previewMultiplier = slider.value / 100;
            valueDisplay.textContent = `${slider.value}%`;
            
            preview = calculatePreview(previewMultiplier);
            
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
        updatePreview(); // Initial update

        document.getElementById('btn-cancel-pricing').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('btn-apply-pricing').addEventListener('click', () => {
            const newMultiplier = previewMultiplier;
            this.game.managers.routes.updateRoutePricing(routeId, newMultiplier);
            this.game.save();
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
            });
        });
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
            }
            if (e.key === '2' && !e.target.matches('input, textarea')) {
                this.game.managers.time.setSpeed(2);
                this.updateSpeedButtons(2);
                if (this.game.managers.time.isPaused) {
                    this.game.managers.time.togglePause();
                    this.updatePauseButton(false);
                }
            }
            if (e.key === '3' && !e.target.matches('input, textarea')) {
                this.game.managers.time.setSpeed(5);
                this.updateSpeedButtons(5);
                if (this.game.managers.time.isPaused) {
                    this.game.managers.time.togglePause();
                    this.updatePauseButton(false);
                }
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
        const COST = 10000000;
        const canOpen = level >= 2 && cash >= COST;


        const existing = Object.keys(this.game.state.hubs || {});
        const options = Object.entries(AIRPORTS)
            .filter(([id, ap]) => id !== this.game.state.mainHub && !existing.includes(id))
            .map(([id, ap]) => `<option value="${id}">${id} - ${ap.city} (${ap.name})</option>`) 
            .join('');

        const content = `
            <div style="display:flex; flex-direction:column; gap:12px;">
                <p>Abre un hub secundario para expandir tu red. Requisitos:</p>
                <ul>
                    <li>Nivel mínimo: 2</li>
                    <li>Coste de apertura: $10,000,000</li>
                </ul>
                <label style="font-weight:600;">Selecciona aeropuerto</label>
                <select id="open-hub-select" style="padding:8px; border-radius:8px;">${options || '<option>Sin aeropuertos disponibles</option>'}</select>
                ${!canOpen ? `<p style="color:#ef4444;">No cumples los requisitos (Nivel 2 y $10M).</p>` : ''}
            </div>
        `;

        const actions = `
            <button class="btn-secondary" id="cancel-open-hub">Cancelar</button>
            <button class="btn-primary" id="confirm-open-hub" ${(!canOpen || !options) ? 'disabled' : ''}>Confirmar ($10M)</button>
        `;

        this.showModal('Abrir Hub Secundario', content, actions);

        const cancelBtn = document.getElementById('cancel-open-hub');
        const confirmBtn = document.getElementById('confirm-open-hub');
        const selectEl = document.getElementById('open-hub-select');

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

}
