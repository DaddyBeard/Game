/**
 * SkyTycoon - Main Entry Point
 */

import { GameManager } from './core/game.js';
import { UIManager } from './managers/uiManager.js';
import { DB } from './core/db.js';
import { LEVEL_REQUIREMENTS } from './models/progressionModel.js';

// Expose globally for UI access
window.LEVEL_REQUIREMENTS = LEVEL_REQUIREMENTS;

class App {
    constructor() {
        this.game = new GameManager();
        this.ui = new UIManager(this.game);
        this.hudUpdateInterval = null; // Para limpiar el intervalo más tarde
    }

    async init() {
        console.log("✈️ SkyTycoon Engine Starting...");

        // 1. Register Service Worker (PWA)
        if ('serviceWorker' in navigator) {
            try {
                const reg = await navigator.serviceWorker.register('./sw.js');
                console.log('SW Registered:', reg.scope);
            } catch (err) {
                console.error('SW Registration Failed:', err);
            }
        }

        // 2. Initialize Database
        try {
            await DB.init();
            console.log("💾 Database Initialized");
        } catch (e) {
            console.error("Critical DB Error:", e);
            this.ui.showError("Error loading database. Please refresh.");
            return;
        }

        // 3. Load or New Game
        const hasSave = await DB.hasSave();
        if (hasSave) {
            await this.game.loadGame();
        } else {
            // New game: initialize state and show setup screen
            console.log("🆕 New Game Sequence Starting");
            await this.game.newGame();
        }

        // 4. Start Loops
        // Asegurar que el tiempo no esté pausado antes de iniciar el loop
        this.game.managers.time.isPaused = false;
        this.game.startLoop();
        this.ui.init();
        
        // Iniciar actualización periódica del HUD
        // Nota: Este intervalo se limpia automáticamente al recargar la página
        // En una implementación más robusta, se podría limpiar en un método destroy()
        this.hudUpdateInterval = setInterval(() => {
            if (this.game.state.mainHub && this.ui) {
                this.ui.updateHUD();
            }
        }, 100); // Actualizar cada 100ms para mostrar cambios suaves
        
        // 5. If no mainHub selected, show setup screen
        if (!this.game.state.mainHub) {
            console.log("🎮 Showing setup screen (no mainHub)");
            this.ui.showSetupScreen();
        } else {
            // Si ya hay un hub, asegurar que el tiempo no esté pausado
            if (this.game.managers.time.isPaused) {
                this.game.managers.time.togglePause();
            }
        }

        // 6. Generate initial contract offers if needed (only in debug mode)
        const DEBUG_MODE = window.location.hostname === 'localhost';
        if (DEBUG_MODE && this.game.managers.economy) {
            console.log('🔍 [DEBUG] Forcing contract offer generation...');
            // Reset generation flag to force new offers
            this.game.state.lastContractOfferGeneration = null;
            this.game.state.corporateContractOffers = [];
            
            const offers = this.game.managers.economy.generateContractOffers();
            console.log('📩 [DEBUG] Generated offers:', offers);
            
            // Save to persist offers
            this.game.save();
            
            // Force UI update (usar setTimeout del UIManager para tracking)
            if (this.ui.renderEconomy) {
                this.ui.setTimeout(() => this.ui.renderEconomy(), 100);
            }
        }
        
        // Remove loading screen if we had one
        document.body.classList.add('loaded');
    }
}

// Singleton bootstrap
const app = new App();
window.app = app; // For debugging

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
