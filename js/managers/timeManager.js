export class TimeManager {
    constructor(game) {
        this.game = game;
        this.speed = 1; // 1x, 2x, etc.
        this.accumulator = 0;
        this.tickRate = 1000; // 1 real second = X game time
        this.isPaused = false; // NEW: Local pause control
    }

    // NEW: Toggle pause state
    togglePause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    // NEW: Set game speed
    setSpeed(newSpeed) {
        this.speed = newSpeed;
        return this.speed;
    }

    update(delta) {
        // Check local pause instead of state
        if (this.isPaused) return;

        this.accumulator += delta * this.speed;

        // Every 1 real second = 1 game hour
        const hourLength = 1000;

        if (this.accumulator >= hourLength) {
            const hoursPassed = Math.floor(this.accumulator / hourLength);
            this.advanceTime(hoursPassed);
            this.accumulator %= hourLength;
        }
    }

    advanceTime(hours) {
        // Store old date for comparison
        const oldDate = new Date(this.game.state.date);
        const oldDay = oldDate.getDate();

        // Add hours to date (1 hour = 3600000 ms)
        const msPerHour = 3600000;
        this.game.state.date += hours * msPerHour;

        // Check if we crossed into a new day
        const newDate = new Date(this.game.state.date);
        const newDay = newDate.getDate();

        // Trigger daily economy processing when day changes
        if (oldDay !== newDay) {
            this.game.managers.economy.processDaily();
        }
    }
}
