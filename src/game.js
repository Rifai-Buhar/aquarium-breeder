// ============================================
// GAME STATE - Single Source of Truth
// ============================================

import {
  SPECIES,
  createTraits,
  determineColor,
  getEffectiveMaturity,
  getEffectiveFryCount,
  getEffectiveGestation,
  clamp,
  ri,
} from './species.js';

import { toast, flash } from './uiUtils.js';
import { refreshActiveTankUI } from './ui.js';

// ---------- Config ----------
export const cfg = {
  tickMs: 750,
  ticksPerDay: 40,
  capacity: 42,
  gestation: 2,
  breedCD: 3,
  startCapital: 120,
  startFood: 10,
  foodOrderCost: 5,
  foodPerOrder: 10,
  foodBulkCost: 20,
  foodBulkOrder: 50,
  foodDecay: 0.89,
  eatGain: 20,
  tankCost: 200,
  maxTanks: 8,
};

// ---------- Water / Tank ----------
export function makeWater() {
  return {
    o2: 90,
    ammonia: 3,
    nitrate: 3,
    ph: 7.0,
    temp: 26,
    setTemp: 26,
    lampOn: true,
    light: 80,
  };
}

export function makeTank(name) {
  const t = {
    name: name || 'Akuarium',
    fish: [],
    water: makeWater(),
    filterLevel: 0,
    foods: [],
    feedLeftover: 0,
    fedRatio: 1,
    bubbles: [],
    selected: [],
    profileId: null,
  };
  for (let i = 0; i < 16; i++) {
    t.bubbles.push({
      x: Math.random() * 192,
      y: Math.random() * 128,
      r: 0.5 + Math.random() * 1.2,
      s: 0.2 + Math.random() * 0.4,
    });
  }
  return t;
}

export const tanks = [makeTank('Akuarium 1')];

// Use an object for mutable activeTank reference
export const gameRefs = {
  activeTank: 0,
};

export function setActiveTank(idx) {
  gameRefs.activeTank = idx;
}

export function getActiveTank() {
  return gameRefs.activeTank;
}

// ---------- Global State ----------
export const state = {
  coins: cfg.startCapital,
  day: 0,
  tick: 0,
  running: true,
  gameOver: false,
  food: cfg.startFood,
  stats: { bred: 0, earned: 0, sold: 0 },
  achievements: {},  // key -> {unlockedAt, notified}
};

export let fishId = 0;

// Convenience getters for active tank properties
export function getFish() { return tanks[gameRefs.activeTank].fish; }
export function getWater() { return tanks[gameRefs.activeTank].water; }
export function getFilterLevel() { return tanks[gameRefs.activeTank].filterLevel; }
export function setFilterLevel(v) { tanks[gameRefs.activeTank].filterLevel = v; }
export function getFoods() { return tanks[gameRefs.activeTank].foods; }
export function setFoods(v) { tanks[gameRefs.activeTank].foods = v; }
export function getFeedLeftover() { return tanks[gameRefs.activeTank].feedLeftover; }
export function setFeedLeftover(v) { tanks[gameRefs.activeTank].feedLeftover = v; }
export function getFedRatio() { return tanks[gameRefs.activeTank].fedRatio; }
export function setFedRatio(v) { tanks[gameRefs.activeTank].fedRatio = v; }
export function getBubbles() { return tanks[gameRefs.activeTank].bubbles; }
export function getSelected() { return tanks[gameRefs.activeTank].selected; }
export function setSelected(v) { tanks[gameRefs.activeTank].selected = v; }
export function getProfileId() { return tanks[gameRefs.activeTank].profileId; }
export function setProfileId(v) { tanks[gameRefs.activeTank].profileId = v; }
export function getActiveTankObj() { return tanks[gameRefs.activeTank]; }

// ---------- Fish Creation with Genetics ----------
export function makeFish(key, sex, age) {
  age = age || 0;
  const sp = SPECIES[key];
  const id = ++fishId;

  // Create traits
  const traits = createTraits(key);

  // Determine color with genetics
  const colorInfo = determineColor(key, traits);
  const color = colorInfo.hex;

  return {
    id,
    species: key,
    sex,
    name: sp.name + ' #' + id,
    age,
    size: clamp(age / (sp.maturity * 2), 0, 1),
    health: 90,
    fullness: 100,
    sick: null,
    x: 10 + Math.random() * 170,
    y: 12 + Math.random() * 100,
    vx: (Math.random() < 0.5 ? 1 : -1) * (0.12 + Math.random() * 0.12),
    vy: (Math.random() - 0.5) * 0.08,
    t: Math.random() * 100,
    color,
    colorInfo,
    pregnant: false,
    gestate: 0,
    mateId: null,
    cooldown: 0,
    parentId: null,
    tx: 20 + Math.random() * 150,
    ty: 15 + Math.random() * 95,
    wanderT: 30 + (Math.random() * 40 | 0),
    spd: 0.035 + Math.random() * 0.025,
    head: Math.random() * Math.PI * 2,
    flip: false,
    traits,
  };
}

export function byId(id) {
  const fish = getFish();
  return fish.find(f => f.id === id);
}

// ---------- Disease Diagnosis ----------
function diagnose(f, w) {
  const sp = SPECIES[f.species];
  const prefs = sp.prefWater || {};
  
  if (w.ammonia > 40) return { name: 'Bintik Putih (Ich)', fix: 'Turunkan ammonia: Ganti Air / Filter' };
  if (w.o2 < 25) return { name: 'Sesak Napas', fix: 'Naikkan O₂: nyalakan Lampu / Filter' };
  if (getFish().length > cfg.capacity * 0.92) return { name: 'Stress Keramaian', fix: 'Kurangi jumlah ikan (jual sebagian)' };
  
  // Temperature stress with species preference
  const tempMin = prefs.tempMin ?? 21;
  const tempMax = prefs.tempMax ?? 30;
  if (w.temp < tempMin || w.temp > tempMax) return { name: 'Flu Suhu', fix: `Set suhu ${tempMin}–${tempMax}°C` };
  
  // pH stress with species preference
  const phMin = prefs.phMin ?? 6.5;
  const phMax = prefs.phMax ?? 8.0;
  if (w.ph < phMin || w.ph > phMax) return { name: 'pH Stress', fix: `Set pH ${phMin}–${phMax}` };
  
  if (f.fullness < 25) return { name: 'Lapar Kronis', fix: 'Berikan pakan (klik air)' };
  return null;
}

// ---------- Simulation ----------
export function validPair(a, b) {
  if (!a || !b || a === b) return false;
  if (getFish().length >= cfg.capacity) return false;
  if (a.species !== b.species) return false;
  if (a.sex === b.sex) return false;
  const sp = SPECIES[a.species];
  const maturityA = getEffectiveMaturity(a.species, a.traits);
  const maturityB = getEffectiveMaturity(b.species, b.traits);
  if (a.age < maturityA || b.age < maturityB) return false;
  if (a.health < 40 || b.health < 40) return false;
  if (a.cooldown > 0 || b.cooldown > 0) return false;
  if (a.pregnant || b.pregnant) return false;
  return true;
}

export function simStep() {
  if (state.gameOver) return;
  state.tick++;
  let dayWrapped = false;
  if (state.tick >= cfg.ticksPerDay) {
    state.tick = 0;
    state.day++;
    dayWrapped = true;
    checkAchievements(); // day-based achievements
  }

  const savedActive = gameRefs.activeTank;
  for (let ti = 0; ti < tanks.length; ti++) {
    gameRefs.activeTank = ti;
    simTank(dayWrapped);
  }
  gameRefs.activeTank = savedActive;

  // Game over only if ALL tanks empty & can't afford cheapest fish
  const totalFish = tanks.reduce((s, t) => s + t.fish.length, 0);
  if (totalFish === 0 && state.coins < cheapestUnlocked() && state.food === 0) {
    doGameOver();
  }
}

function simTank(dayWrapped) {
  const fish = getFish();
  const n = fish.length;
  const w = getWater();

  // Once per day: aging, growth, pregnancy, disease, starvation, death
  if (dayWrapped && n > 0) {
    const stress = clamp(1 - w.o2 / 30, 0, 1) * 0.5 + clamp((w.ammonia - 50) / 50, 0, 1) * 0.5;
    const dead = [];

    for (const f of fish) {
      f.age++;
      if (f.cooldown > 0) f.cooldown--;

      if (f.pregnant) {
        f.gestate--;
        if (f.gestate <= 0) giveBirth(f);
      }

      const sp = SPECIES[f.species];
      const targetSize = clamp(f.age / (sp.maturity * 2), 0, 1);
      f.size += (targetSize - f.size) * 0.04 * (f.fullness > 30 ? 1 : 0.4);

      // Fullness decay affected by appetite trait
      const appetiteMult = f.traits?.appetite || 1.0;
      f.fullness = clamp(f.fullness - cfg.foodDecay * appetiteMult, 0, 100);

      let dh = (f.fullness > 40 ? 0.8 : -1.2) - stress * 2 - (f.sick ? 1.0 : 0);

      // Longevity trait reduces health decay when old
      const longevityMult = f.traits?.longevity || 1.0;
      if (f.age > sp.maturity * 2) {
        dh *= (2 - longevityMult); // higher longevity = slower decay
      }

      f.health = clamp(f.health + dh, 0, 100);

      if (f.health <= 0) {
        let cause = 'sakit';
        if (f.fullness <= 0) cause = 'kelaparan 🍤';
        else if (f.sick) cause = f.sick.name.toLowerCase();
        else if (w.ammonia > 50) cause = 'ammonia tinggi ☠️';
        else if (w.o2 < 25) cause = 'O₂ rendah 💨';
        dead.push(SPECIES[f.species].name + ' ' + cause);
      }
    }

    if (dead.length) {
      // Remove dead fish
      const aliveFish = fish.filter(f => f.health > 0);
      tanks[gameRefs.activeTank].fish = aliveFish;

      // Clean up selections
      setSelected(getSelected().filter(id => byId(id)));
      if (getProfileId() != null && !byId(getProfileId())) {
        setProfileId(null);
      }

      const uniq = [...new Set(dead)];
      toast('⚠️ ' + tanks[gameRefs.activeTank].name + ': ' + uniq.slice(0, 2).join(', ') + (dead.length > 2 ? ' +' + (dead.length - 2) : ''));
    }

    setFedRatio(fish.length ? fish.reduce((s, f) => s + f.fullness, 0) / fish.length / 100 : 1);
    checkAchievements();
  }

  // Water chemistry (per tick)
  w.ammonia = clamp(w.ammonia + n * 0.05 + getFeedLeftover() * 0.4 - w.ammonia * 0.02 * getFilterLevel(), 0, 100);
  w.nitrate = clamp(w.nitrate + w.ammonia * 0.02 - w.nitrate * 0.02 * getFilterLevel(), 0, 100);

  const light = w.lampOn ? w.light : 0;
  const o2prod = 4 * (light / 100) + 2 + getFilterLevel() * 1.5;
  const o2cons = n * 0.02 + 0.4;
  w.o2 = clamp(w.o2 + o2prod - o2cons, 0, 100);

  w.ph += ((7 + (w.nitrate - 30) / 200) - w.ph) * 0.02;
  w.temp += (w.setTemp - w.temp) * 0.05;

  setFeedLeftover(Math.max(0, getFeedLeftover() - 0.3));

  // Diagnose disease every tick
  for (const f of fish) {
    f.sick = diagnose(f, w);
  }
}

// ---------- Breeding ----------
export function giveBirth(mom) {
  const sp = SPECIES[mom.species];
  const room = cfg.capacity - getFish().length;
  if (room <= 0) { mom.gestate = 1; return; }

  const fryRange = getEffectiveFryCount(mom.species, mom.traits);
  const cnt = Math.min(ri(fryRange.min, fryRange.max), room);

  for (let i = 0; i < cnt; i++) {
    const baby = makeFish(mom.species, Math.random() < 0.5 ? 'M' : 'F', 0);
    baby.x = clamp(mom.x + (Math.random() * 16 - 8), 4, 180);
    baby.y = clamp(mom.y + (Math.random() * 10 - 5), 8, 118);
    baby.health = 85;
    baby.fullness = 100;
    baby.size = 0;
    baby.parentId = mom.id;

    const dad = mom.mateId != null ? byId(mom.mateId) : null;
    if (dad) baby.parentId = (Math.random() < 0.5 ? mom.id : dad.id);

    getFish().push(baby);
  }

  state.stats.bred += cnt;
  checkAchievements();
  mom.pregnant = false;
  mom.gestate = 0;
  mom.cooldown = cfg.breedCD;

  const dad = mom.mateId != null ? byId(mom.mateId) : null;
  if (dad) dad.cooldown = cfg.breedCD;
  mom.mateId = null;
}

// ============================================
// ACHIEVEMENT SYSTEM
// ============================================

const ACHIEVEMENTS = {
  firstBreed: { name: '🐣 Parent Pertama', desc: 'Berhasil memijahkan pasangan pertama', check: () => state.stats.bred >= 1 },
  breeder10: { name: '🏡 Peternak Pemula', desc: 'Melahirkan total 10 anak ikan', check: () => state.stats.bred >= 10 },
  breeder50: { name: '🏘️ Peternak Handal', desc: 'Melahirkan total 50 anak ikan', check: () => state.stats.bred >= 50 },
  firstSale: { name: '💰 Penjual Pertama', desc: 'Menjual ikan pertama', check: () => state.stats.sold >= 1 },
  rich1000: { name: '💎 Kaya Raya', desc: 'Mengumpulkan $1000 total cuan', check: () => state.stats.earned >= 1000 },
  rich10000: { name: '💎 Miliarder Akuarium', desc: 'Mengumpulkan $10000 total cuan', check: () => state.stats.earned >= 10000 },
  survivor30: { name: '🛡️ Survivor', desc: 'Mencapai hari ke-30 tanpa game over', check: () => state.day >= 30 },
  survivor100: { name: '🏆 Legend', desc: 'Mencapai hari ke-100', check: () => state.day >= 100 },
  filterMax: { name: '⚙️ Master Filter', desc: 'Mengupgrade filter ke Level 3', check: () => tanks.some(t => t.filterLevel >= 3) },
  multiTank: { name: '🏢 Multi-Tank Owner', desc: 'Memiliki 3 akuarium sekaligus', check: () => tanks.length >= 3 },
  koiOwner: { name: '🎋 Koi Keeper', desc: 'Memiliki ikan Koi', check: () => tanks.some(t => t.fish.some(f => f.species === 'koi')) },
  rareColor: { name: '✨ Rare Hunter', desc: 'Mendapatkan ikan warna rare', check: () => tanks.some(t => t.fish.some(f => f.colorInfo?.isRare)) },
};

function checkAchievements() {
  for (const [key, ach] of Object.entries(ACHIEVEMENTS)) {
    if (!state.achievements[key] && ach.check()) {
      state.achievements[key] = { unlockedAt: Date.now(), notified: false };
    }
  }
}

function notifyAchievements() {
  for (const [key, achData] of Object.entries(state.achievements)) {
    if (!achData.notified) {
      const ach = ACHIEVEMENTS[key];
      if (ach) {
        achData.notified = true;
        // Use setTimeout to avoid circular import with toast
        setTimeout(() => {
          if (typeof toast === 'function') {
            toast('🏆 Achievement: ' + ach.name + ' — ' + ach.desc);
          }
        }, 100);
      }
    }
  }
}

export function getAchievements() {
  return Object.entries(ACHIEVEMENTS).map(([key, ach]) => ({
    key,
    ...ach,
    unlocked: !!state.achievements[key],
    unlockedAt: state.achievements[key]?.unlockedAt,
  }));
}

export function cheapestUnlocked() {
  let m = Infinity;
  for (const k in SPECIES) {
    if (state.stats.earned >= SPECIES[k].unlock) m = Math.min(m, SPECIES[k].price);
  }
  return m;
}

export function fishValue(f) {
  const sp = SPECIES[f.species];
  // Value affected by color intensity trait
  const colorMult = f.traits?.colorIntensity || 1.0;
  return Math.floor(sp.value * (0.3 + 0.7 * f.size) * (f.health / 100) * colorMult);
}

// ---------- Actions ----------
export function trySpend(n) {
  if (state.coins < n) { flash('Koin kurang!'); return false; }
  state.coins -= n;
  return true;
}

let toastTimer = null;

export function actBuy(key, sex) {
  const sp = SPECIES[key];
  if (state.stats.earned < sp.unlock) { flash('Belum terbuka'); return; }
  if (getFish().length >= cfg.capacity) { flash('Akuarium penuh'); return; }
  if (!trySpend(sp.price)) return;
  getFish().push(makeFish(key, sex, ri(1, 2)));
  checkAchievements();
  updateShop();
  updateHUD();
}

export function actBreed() {
  const selected = getSelected();
  if (selected.length !== 2) return;
  const [a, b] = [byId(selected[0]), byId(selected[1])];
  if (!validPair(a, b)) { flash('Pasangan tidak valid'); return; }
  const mom = a.sex === 'F' ? a : b;
  const dad = a.sex === 'M' ? a : b;
  mom.pregnant = true;
  mom.gestate = getEffectiveGestation(mom.species, mom.traits);
  mom.mateId = dad.id;
  mom.cooldown = cfg.breedCD;
  dad.cooldown = cfg.breedCD;
  setSelected([]);
  updateSelInfo();
  flash('Memijahkan... 💞');
}

export function actSell() {
  const selected = getSelected();
  if (!selected.length) return;
  let gain = 0;
  for (const id of selected) {
    const f = byId(id);
    if (f) {
      const v = fishValue(f);
      gain += v;
      state.stats.earned += v;
      state.stats.sold++;
    }
  }
  tanks[gameRefs.activeTank].fish = getFish().filter(f => !selected.includes(f.id));
  state.coins += gain;
  setSelected([]);
  if (getProfileId() != null && !byId(getProfileId())) setProfileId(null);
  checkAchievements();
  updateShop();
  updateHUD();
  updateSelInfo();
  updateProfile();
  flash('Laku $' + gain);
}

export function sellOne(id) {
  setSelected([id]);
  actSell();
  renderIndex();
}

export function actOrder() { if (!trySpend(cfg.foodOrderCost)) return; state.food += cfg.foodPerOrder; updateHUD(); toast('📦 +' + cfg.foodPerOrder + ' pakan'); }
export function actOrderBulk() { if (!trySpend(cfg.foodBulkCost)) return; state.food += cfg.foodBulkOrder; updateHUD(); toast('📦📦 +' + cfg.foodBulkOrder + ' pakan'); }
export function actWater() { if (!trySpend(10)) return; const w = getWater(); w.ammonia *= 0.3; w.nitrate *= 0.3; w.ph = 7.0; }
export function actFilter() {
  if (getFilterLevel() >= 3) { flash('Filter sudah Lv.3 (max)!'); return; }
  if (!trySpend(100)) return;
  setFilterLevel(getFilterLevel() + 1);
  const lv = getFilterLevel();
  flash('⚙️ Filter ' + (lv === 1 ? 'terpasang' : 'di-upgrade ke Lv.' + lv) + ' — ammonia makin lambat naik');
  updateHUD();
}
export function actLamp() {
  const w = getWater();
  w.lampOn = !w.lampOn;
  const btn = document.getElementById('bLamp');
  if (btn) btn.textContent = '💡 Lampu: ' + (w.lampOn ? 'ON' : 'OFF');
}
export function actTemp(d) {
  const w = getWater();
  w.setTemp = clamp(w.setTemp + d, 18, 32);
}

export function togglePause() {
  state.running = !state.running;
  const btn = document.getElementById('bPause');
  if (btn) btn.textContent = state.running ? '⏸️ Pause' : '▶️ Play';
}

// ---------- Selection ----------
export function toggleSelect(id) {
  const selected = getSelected();
  const i = selected.indexOf(id);
  if (i >= 0) selected.splice(i, 1);
  else {
    if (selected.length >= 2) selected.shift();
    selected.push(id);
  }
  setProfileId(selected.length ? selected[selected.length - 1] : null);
  updateSelInfo();
  updateProfile();
}

export function reset() {
  // Reset game state completely
  fishId = 0;
  state.coins = cfg.startCapital;
  state.day = 0;
  state.tick = 0;
  state.running = true;
  state.gameOver = false;
  state.food = cfg.startFood;
  state.stats = { bred: 0, earned: 0, sold: 0 };
  
  tanks.length = 0;
  tanks.push(makeTank('Akuarium 1'));
  gameRefs.activeTank = 0;
  
  // Reset UI
  refreshActiveTankUI();
  toast('🔄 Game direset!');
}

// Re-export for backward compat
export { getFish as fish, getWater as water, getFilterLevel as filterLevel, getFoods as foods, getFeedLeftover as feedLeftover, getFedRatio as fedRatio, getBubbles as bubbles, getSelected as selected, getProfileId as profileId, byId };

// These will be set by main.js after UI loads
export let updateHUD = () => {};
export let updateShop = () => {};
export let updateProfile = () => {};
export let updateSelInfo = () => {};
export let renderIndex = () => {};
export let doGameOver = () => {};