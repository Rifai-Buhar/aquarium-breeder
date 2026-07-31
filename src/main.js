// ============================================
// MAIN ENTRY POINT - Aquarium Breeder
// ============================================

import { cfg, state, tanks, gameRefs, fishId, makeWater, makeTank, makeFish, byId, cheapestUnlocked, fishValue, simStep, validPair, giveBirth, toggleSelect, actBuy, actBreed, actSell, actOrder, actOrderBulk, actWater, actFilter, actLamp, actTemp, togglePause, reset, getFish, getWater, getFoods, getFeedLeftover, getFedRatio, getFilterLevel, getBubbles, getSelected, setSelected, getProfileId, setProfileId, getActiveTank } from './game.js';
import { initRenderer, render } from './render.js';
import { cacheElements, updateHUD, updateShop, updateProfile, updateSelInfo, openIndex, closeIndex, renderIndex, refreshActiveTankUI, doGameOver, elements } from './ui.js';
import { toast, flash } from './uiUtils.js';
import { saveGame, loadGame, exportCode, importCode, setRefreshActiveTankUI } from './save.js';
import { SPECIES, createTraits, determineColor, getEffectiveMaturity, getEffectiveFryCount, getEffectiveGestation, getTraitDisplay, getColorDisplayName } from './species.js';
import './styles.css';

// ============================================
// GLOBAL STATE (re-exported for modules)
// ============================================

// These are imported from game.js but need to be mutable for other modules
// We use a mutable object reference pattern
export { cfg, state, tanks, gameRefs, fishId, makeWater, makeTank, makeFish, byId, cheapestUnlocked, fishValue, simStep, validPair, giveBirth, toggleSelect, actBuy, actBreed, actSell, actOrder, actOrderBulk, actWater, actFilter, actLamp, actTemp, togglePause, reset };

// Patch save.js with UI refresher
setRefreshActiveTankUI(refreshActiveTankUI);

// ============================================
// CACHE DOM ELEMENTS
// ============================================

cacheElements();

// ============================================
// INITIALIZE RENDERER
// ============================================

const cv = document.getElementById('cv');
initRenderer(cv);

// ============================================
// EVENT LISTENERS
// ============================================

// Canvas click - select fish or drop food
cv.addEventListener('click', (e) => {
  if (state.gameOver) return;
  const r = cv.getBoundingClientRect();
  const mx = (e.clientX - r.left) * (192 / r.width);
  const my = (e.clientY - r.top) * (128 / r.height);

  // Check fish clicks (reverse order for top-most)
  const fish = getFish();
  for (let i = fish.length - 1; i >= 0; i--) {
    const f = fish[i];
    const cell = Math.max(1, Math.round(1 + f.size * 2.2));
    if (mx >= f.x && mx <= f.x + 9 * cell && my >= f.y && my <= f.y + 5 * cell) {
      toggleSelect(f.id);
      return;
    }
  }

  // Empty water -> drop 1 food
  if (state.food > 0) {
    state.food--;
    getFoods().push({
      x: Math.max(2, Math.min(190, mx)),
      y: Math.max(2, my),
      vy: 0.3 + Math.random() * 0.2,
      eaten: false,
      sunk: false,
    });
    updateHUD();
  } else {
    toast('📦 Pakan habis — klik Order Pakan');
  }
});

// UI Buttons
elements.bIndex.onclick = openIndex;
elements.idxSortAgeAsc.onclick = () => { idxState.sort = 'ageAsc'; renderIndex(); };
elements.idxSortAgeDesc.onclick = () => { idxState.sort = 'ageDesc'; renderIndex(); };
elements.idxSortPriceAsc.onclick = () => { idxState.sort = 'priceAsc'; renderIndex(); };
elements.idxSortPriceDesc.onclick = () => { idxState.sort = 'priceDesc'; renderIndex(); };
elements.idxClose.onclick = closeIndex;

elements.bBreed.onclick = actBreed;
elements.bSell.onclick = actSell;
elements.bOrder.onclick = actOrder;
elements.bOrder50.onclick = actOrderBulk;
elements.bWater.onclick = actWater;
elements.bFilter.onclick = actFilter;
elements.bLamp.onclick = actLamp;
elements.bTempU.onclick = () => actTemp(1);
elements.bTempD.onclick = () => actTemp(-1);
elements.bPause.onclick = togglePause;

// Save/Load
elements.bSave.onclick = () => saveGame(false);
elements.bExport.onclick = exportCode;
elements.bImport.onclick = importCode;

// Keyboard
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); togglePause(); }
});

// Restart button
document.getElementById('restart').onclick = reset;

// Name input
document.getElementById('pName').addEventListener('input', (e) => {
  const f = state.profileId != null ? byId(state.profileId) : null;
  if (f) f.name = e.target.value;
});

// ============================================
// AUTO-SAVE & LOAD
// ============================================

// Load saved game
if (loadGame()) {
  toast('📂 Progres dimuat otomatis');
} else {
  refreshActiveTankUI();
}

// Auto-save every 15 seconds + on unload/hide
setInterval(() => { if (!state.gameOver) saveGame(true); }, 15000);
window.addEventListener('beforeunload', () => saveGame(true));
document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(true); });

// ============================================
// GAME LOOP
// ============================================

// Simulation tick
setInterval(() => {
  if (state.running && !state.gameOver) simStep();
}, cfg.tickMs);

// Render loop (requestAnimationFrame)
(function frame() {
  try {
    render(getActiveTank());
  } catch (e) {
    console.error('render error (frame skipped):', e);
  }
  requestAnimationFrame(frame);
})();

// ============================================
// EXPORTS FOR DEBUGGING (console access)
// ============================================

window.__game = {
  state,
  tanks,
  cfg,
  SPECIES,
  saveGame: () => saveGame(false),
  loadGame,
  exportCode,
  importCode,
  reset,
  toast,
  simStep,
};

console.log('🐠 Aquarium Breeder v2.0 loaded — type __game. for debug');