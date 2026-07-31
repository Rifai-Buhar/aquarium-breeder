// ============================================
// SAVE / LOAD SYSTEM
// ============================================

import { state, tanks, gameRefs, fishId, cfg, makeWater, makeTank, getActiveTank, setActiveTank } from './game.js';
import { toast } from './uiUtils.js';

const SAVE_KEY = 'aquariumBreederSave_v1';
const SAVE_VERSION = 3; // v3 = with genetics

function serializeState() {
  return {
    v: SAVE_VERSION,
    fishId: fishId,
    coins: state.coins,
    day: state.day,
    tick: state.tick,
    gameOver: state.gameOver,
    food: state.food,
    stats: state.stats,
    activeTank: getActiveTank(),
    tanks: tanks.map(t => ({
      name: t.name,
      fish: t.fish,
      water: t.water,
      filterLevel: t.filterLevel,
      feedLeftover: t.feedLeftover,
      fedRatio: t.fedRatio,
    })),
    savedAt: Date.now(),
  };
}

function rehydrateTank(td) {
  const t = makeTank(td.name || 'Akuarium');
  t.water = Object.assign(makeWater(), td.water || {});
  t.filterLevel = td.filterLevel || 0;
  t.feedLeftover = td.feedLeftover || 0;
  t.fedRatio = td.fedRatio || 1;
  // Fish are already full objects with traits, just ensure they have methods
  t.fish = (td.fish || []).map(f => {
    // Ensure traits object exists (backward compat)
    if (!f.traits) {
      // This would need the species module - for now just pass through
    }
    return f;
  });
  t.foods = [];
  t.selected = [];
  t.profileId = null;
  return t;
}

function applyState(d) {
  if (!d || typeof d !== 'object') throw new Error('data kosong');
  fishId = d.fishId || 0;
  state.coins = d.coins;
  state.day = d.day;
  state.tick = d.tick || 0;
  state.gameOver = !!d.gameOver;
  state.food = d.food || 0;
  state.stats = Object.assign({ bred: 0, earned: 0, sold: 0 }, d.stats || {});

  tanks.length = 0;
  if (d.v >= 2 && Array.isArray(d.tanks)) {
    d.tanks.forEach(td => tanks.push(rehydrateTank(td)));
    setActiveTank(clamp(d.activeTank || 0, 0, tanks.length - 1));
  } else {
    // backward-compat: v1 save (single tank flat fields)
    tanks.push(rehydrateTank({
      name: 'Akuarium 1',
      fish: d.fish,
      water: d.water,
      filterLevel: d.filterLevel,
      feedLeftover: d.feedLeftover,
      fedRatio: d.fedRatio,
    }));
    setActiveTank(0);
  }
  if (tanks.length === 0) { tanks.push(makeTank('Akuarium 1')); setActiveTank(0); }

  // Sync UI
  document.getElementById('overlay').style.display = state.gameOver ? 'flex' : 'none';
  refreshActiveTankUI();
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

// Import refreshActiveTankUI from ui.js (circular dep workaround)
let refreshActiveTankUI = null;
export function setRefreshActiveTankUI(fn) { refreshActiveTankUI = fn; }

function saveGame(silent) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(serializeState()));
    const t = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const saveInfoEl = document.getElementById('saveInfo');
    if (saveInfoEl) saveInfoEl.textContent = '✅ Tersimpan otomatis ' + t;
    if (!silent) toast('💾 Progres tersimpan');
    return true;
  } catch (e) {
    if (!silent) toast('⚠️ Gagal simpan: ' + e.message);
    return false;
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    applyState(JSON.parse(raw));
    return true;
  } catch (e) {
    console.error('load error:', e);
    return false;
  }
}

// Save Code = base64(JSON) biar gampang di-copy/paste antar device
function exportCode() {
  try {
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(serializeState()))));
    window.prompt('📤 SALIN kode ini, simpan/kirim ke device lain.\nBuat memuat: klik "Muat Code" lalu paste.', code);
  } catch (e) {
    toast('⚠️ Gagal ekspor: ' + e.message);
  }
}

function importCode() {
  const code = window.prompt('📥 Paste Save Code di sini:');
  if (!code) return;
  try {
    const d = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    applyState(d);
    saveGame(true);
    toast('📥 Progres berhasil dimuat!');
  } catch (e) {
    toast('⚠️ Kode tidak valid');
  }
}

export { saveGame, loadGame, exportCode, importCode, serializeState, applyState, SAVE_KEY, SAVE_VERSION };