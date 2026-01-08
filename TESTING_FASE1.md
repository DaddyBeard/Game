# Testing Fase 1 - Quick Start Guide

## How to Test Hub Selection

### 1. Clean Browser Cache
```
Ctrl + Shift + Delete  (or Cmd + Shift + Delete on Mac)
→ Clear "All time"
→ Clear Cache, Cookies, Site data
```

Or in DevTools:
```
F12 → Application → Service Workers → Unregister "sw.js"
F12 → Application → Storage → Clear Site Data
```

### 2. Hard Reload Page
```
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

### 3. Expected Hub Selection Flow

**What you should see:**
- Full-screen overlay with "Bienvenido a SkyTycoon" header
- Grid of 6 hub cards: MAD, LHR, CDG, JFK, AMS, ORD
- Each card shows:
  - City name + IATA code
  - Population (millions)
  - Runway length
  - Daily fee
  - Starting capital

**Example Card Data:**
```
Madrid (MAD)
Población: 6.6M
Pista: 4100m
📊 Fee Diario: $5,300
💰 Capital Inicial: $7,350,000
```

### 4. Selecting a Hub

1. **Click any hub card** → It highlights with blue border + glow
2. **Enter company name** (e.g., "AirMagic Airlines")
3. **Click "Comenzar Aventura"** button
4. Overlay slides away → Dashboard appears with selected hub's capital

### 5. Verify Hub Data in Console

Open DevTools → Console and check:

```javascript
// Should show game object
window.app.game

// Check hub info
console.log(window.app.game.state.mainHub)        // Should show 'MAD' (or selected hub)
console.log(window.app.game.state.hubs)           // Should show hub structure
console.log(window.app.game.state.money)          // Should show starting capital

// Example output:
// mainHub: 'MAD'
// hubs: {MAD: {id: 'MAD', slots: {used: 0, total: 4}, dailyFee: 5300, ...}}
// money: 7350000
```

### 6. Create a Test Route

To verify hub slot system:

```javascript
// In browser console:

// Buy first plane
const result1 = window.app.game.managers.fleet.buyAircraft('A320');
console.log(result1);  // Should show success

// Create route (MAD → BCN only, since level < 4)
const planeId = window.app.game.managers.fleet.ownedPlanes[0].instanceId;
const routeRes = window.app.game.managers.routes.createRoute('MAD', 'BCN', planeId);
console.log(routeRes);  // Should show {success: true, route: {...}}

// Check slots
console.log(window.app.game.state.hubs.MAD.slots);  // Should show {used: 1, total: 4}
console.log(window.app.game.state.hubs.BCN.slots);  // Should show {used: 1, total: 4}

// Try forbidden route (should fail)
const badRoute = window.app.game.managers.routes.createRoute('JFK', 'LAX', planeId);
console.log(badRoute);  // Should show error: "Hasta Nivel 4..."
```

### 7. Verify Daily Hub Fees

In console, fast-forward to next day:

```javascript
// Current day example: Jan 1, 2025
// Manually trigger economy processor
window.app.game.managers.economy.processDaily();

// Check console output (look for 🏢 icon):
// 💰 Economy: Processing Daily Revenue
// 🏢 Hub Fees: $5300
// Daily Net: ... (gross X, costs Y, hub fees 5300)

// Check bank
console.log(window.app.game.state.money);  // Should be reduced by hub fees
```

### 8. Testing Hub Slot Limits

```javascript
// Create 4 routes from MAD (4 slot limit)
// Routes 1-4 should succeed
// Route 5 should fail with error: "Hub ... está lleno (4/4 slots)"

// Buy 5 planes
for (let i = 0; i < 5; i++) {
    window.app.game.managers.fleet.buyAircraft('A320');
}

// Try to create 5 routes
for (let i = 0; i < 5; i++) {
    const planeId = window.app.game.managers.fleet.ownedPlanes[i].instanceId;
    const result = window.app.game.managers.routes.createRoute('MAD', 'BCN', planeId);
    console.log(`Route ${i+1}:`, result.success ? '✅ Created' : `❌ ${result.msg}`);
}

// Output should be:
// Route 1: ✅ Created
// Route 2: ✅ Created
// Route 3: ✅ Created
// Route 4: ✅ Created
// Route 5: ❌ Hub MAD está lleno (4/4 slots)
```

### 9. Test Level Restriction (Level < 4)

```javascript
// Try route that doesn't touch mainHub (should fail)
const planeId = window.app.game.managers.fleet.ownedPlanes[0].instanceId;
const badRoute = window.app.game.managers.routes.createRoute('LHR', 'CDG', planeId);
console.log(badRoute);
// Should show: {success: false, msg: "Hasta Nivel 4..."}
```

### 10. Verify Persistence

1. **Create a route** (as shown in step 6)
2. **Refresh page** (F5)
3. **Expected**: 
   - Hub selection overlay should NOT appear (mainHub already set)
   - Dashboard loads with same capital
   - Route still visible in Rutas view
   - Hub slots still show as used

---

## Common Issues & Fixes

### Issue: Hub selection overlay doesn't appear
**Fix**: 
- Clear cache (Ctrl+Shift+Delete)
- Hard reload (Ctrl+Shift+R)
- Check Service Worker: DevTools → Application → Service Workers → Unregister

### Issue: "Cannot read property 'mainHub' of undefined"
**Fix**:
- Wait for app.init() to complete
- Check console for initialization errors
- Verify AIRPORTS are loaded: `window.AIRPORTS` should exist

### Issue: Route creation succeeds but no fee deduction
**Fix**:
- Hub fees deduct at daily tick (game loop)
- Click into "Rutas" view to trigger economy.processDaily()
- Or check: `window.app.game.state.lastEconomy`

### Issue: Starting capital doesn't match expected value
**Fix**:
- Formula: $10M - ($10M × (dailyFee/10000) × 0.5)
- Check selectedHub population value
- Verify: `window.app.game.getHubDailyFee('MAD')` returns correct fee

---

## Expected Starting Capitals by Hub

| Hub | City | Pop | Daily Fee | Starting Capital |
|-----|------|-----|-----------|-----------------|
| MAD | Madrid | 6.6M | $5,300 | ~$7.35M |
| LHR | London | 9.0M | $6,500 | ~$6.78M |
| CDG | Paris | 12.2M | $8,100 | ~$5.95M |
| JFK | NY | 18.8M | $11,400 | ~$4.29M |
| AMS | Amsterdam | 2.4M | $3,200 | ~$8.40M |
| ORD | Chicago | 8.8M | $6,400 | ~$6.84M |

---

## Success Criteria Checklist

- [ ] Hub overlay appears on first load
- [ ] All 6 hubs display with correct data
- [ ] Selecting hub highlights with blue border
- [ ] Starting capital matches formula
- [ ] Company name saves to state.companyName
- [ ] Dashboard loads after hub selection
- [ ] Creating route increments both hub slots
- [ ] Daily fees deduct from bank
- [ ] Level <4 prevents non-hub routes
- [ ] Slot limit (4) prevents 5th route from MAD
- [ ] Game persists across reload with same hub

---

## Debug Commands Quick Reference

```javascript
// State inspection
window.app.game.state                          // Full game state
window.app.game.state.mainHub                  // Selected hub
window.app.game.state.hubs                     // All hubs
window.app.game.state.money                    // Current bank
window.app.game.state.cumulativeProfit         // Lifetime profit

// Manager shortcuts
window.app.game.managers.fleet.ownedPlanes    // All aircraft
window.app.game.managers.routes.routes        // All routes
window.app.game.managers.economy.processDaily()  // Trigger daily processing

// UI control
window.app.ui.switchView('dashboard')          // Switch to dashboard
window.app.ui.switchView('routes')             // Switch to routes view
window.app.ui.showHubSelection()               // Show hub overlay again

// Force game day advance
window.app.game.state.date += 86400000         // Add 1 day in ms
window.app.game.managers.time.tick({});        // Trigger time update
```

---

**Ready to test?** Hard refresh and enjoy Fase 1! 🚀
