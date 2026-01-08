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
            // Show hub selection (will be handled in UI.init())
           console.log("🆕 New Game Sequence Ready");
        }

        // 4. Start Loops
        this.game.startLoop();
        this.ui.init();
        
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
