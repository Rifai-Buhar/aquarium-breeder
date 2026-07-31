// ============================================
// UI & HUD MANAGEMENT
// ============================================

import { SPECIES, getTraitDisplay, getColorDisplayName, getEffectiveMaturity, getEffectiveFryCount, createTraits, determineColor } from './species.js';
import { cfg, state, tanks, gameRefs, fishId, byId, cheapestUnlocked, fishValue, validPair, getAchievements } from './game.js';
import { FISH_SPRITE, shade } from './sprites.js';

// DOM Elements cache
let elements = {};

function cacheElements() {
  elements = {
    // Profile
    pEmpty: document.getElementById('pEmpty'),
    pCard: document.getElementById('pCard'),
    pName: document.getElementById('pName'),
    pSpecies: document.getElementById('pSpecies'),
    pHv: document.getElementById('pHv'),
    pHb: document.getElementById('pHb'),
    pAge: document.getElementById('pAge'),
    pFull: document.getElementById('pFull'),
    pFullb: document.getElementById('pFullb'),
    pSick: document.getElementById('pSick'),
    pSickHint: document.getElementById('pSickHint'),

    // HUD
    coins: document.getElementById('coins'),
    day: document.getElementById('day'),
    count: document.getElementById('count'),
    food: document.getElementById('food'),
    bred: document.getElementById('bred'),
    earned: document.getElementById('earned'),
    o2v: document.getElementById('o2v'),
    o2b: document.getElementById('o2b'),
    fedv: document.getElementById('fedv'),
    fedb: document.getElementById('fedb'),
    amv: document.getElementById('amv'),
    amb: document.getElementById('amb'),
    ntv: document.getElementById('ntv'),
    ntb: document.getElementById('ntb'),
    phv: document.getElementById('phv'),
    phb: document.getElementById('phb'),
    tmpv: document.getElementById('tmpv'),
    tmpb: document.getElementById('tmpb'),

    // Buttons
    bBreed: document.getElementById('bBreed'),
    bSell: document.getElementById('bSell'),
    bIndex: document.getElementById('bIndex'),
    idxShort: document.getElementById('idxShort'),
    bOrder: document.getElementById('bOrder'),
    bOrder50: document.getElementById('bOrder50'),
    bWater: document.getElementById('bWater'),
    bFilter: document.getElementById('bFilter'),
    bLamp: document.getElementById('bLamp'),
    bTempD: document.getElementById('bTempD'),
    bTempU: document.getElementById('bTempU'),
    bPause: document.getElementById('bPause'),
    bSave: document.getElementById('bSave'),
    bExport: document.getElementById('bExport'),
    bImport: document.getElementById('bImport'),
    bAchievements: document.getElementById('bAchievements'),
    saveInfo: document.getElementById('saveInfo'),

    // Selection info
    selinfo: document.getElementById('selinfo'),

    // Shop
    shop: document.getElementById('shop'),

    // Tank bar
    tankLabel: document.getElementById('tankLabel'),
    tankPrev: document.getElementById('tankPrev'),
    tankNext: document.getElementById('tankNext'),
    tankAdd: document.getElementById('tankAdd'),
    tankRename: document.getElementById('tankRename'),

    // Index overlay
    idxOverlay: document.getElementById('idxOverlay'),
    idxCount: document.getElementById('idxCount'),
    idxList: document.getElementById('idxList'),
    idxSortAgeAsc: document.getElementById('idxSortAgeAsc'),
    idxSortAgeDesc: document.getElementById('idxSortAgeDesc'),
    idxSortPriceAsc: document.getElementById('idxSortPriceAsc'),
    idxSortPriceDesc: document.getElementById('idxSortPriceDesc'),
    idxClose: document.getElementById('idxClose'),

    // Game over
    overlay: document.getElementById('overlay'),
    ovscore: document.getElementById('ovscore'),
    restart: document.getElementById('restart'),

    // Toast
    toast: document.getElementById('toast'),
  };
}

// ============================================
// HUD UPDATES
// ============================================

function bar(id, val, max) {
  const e = elements[id];
  if (e) e.style.width = clamp(val / max * 100, 0, 100) + '%';
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

function updateHUD() {
  const w = getWater();
  elements.coins.textContent = state.coins;
  elements.day.textContent = state.day;
  elements.count.textContent = getFish().length + '/' + cfg.capacity;
  elements.idxShort.textContent = getFish().length;
  elements.food.textContent = state.food;
  elements.bred.textContent = state.stats.bred;
  elements.earned.textContent = '$' + state.stats.earned;

  elements.o2v.textContent = Math.round(w.o2);
  bar('o2b', w.o2, 100);

  elements.fedv.textContent = Math.round(getFedRatio() * 100) + '%';
  bar('fedb', getFedRatio() * 100, 100);

  elements.amv.textContent = Math.round(w.ammonia) + ' (F' + getFilterLevel() + ')';
  bar('amb', w.ammonia, 100);

  elements.ntv.textContent = Math.round(w.nitrate);
  bar('ntb', w.nitrate, 100);

  elements.phv.textContent = w.ph.toFixed(1);
  bar('phb', clamp((w.ph - 5) / 5 * 100, 0, 100));

  elements.tmpv.textContent = Math.round(w.temp) + '°C';
  bar('tmpb', clamp((w.temp - 15) / 20 * 100, 0, 100));

  // Filter button
  if (getFilterLevel() >= 3) elements.bFilter.textContent = '⚙️ Filter Lv.3 (MAX)';
  else if (getFilterLevel() >= 1) elements.bFilter.textContent = '⚙️ Upgrade Filter →Lv.' + (getFilterLevel() + 1) + ' ($100)';
  else elements.bFilter.textContent = '⚙️ Filter ($100)';

  // Tank add button
  const addBtn = elements.tankAdd;
  if (addBtn) {
    const full = tanks.length >= cfg.maxTanks;
    const poor = state.coins < cfg.tankCost;
    addBtn.textContent = full ? '➕ Tank (MAX)' : '➕ Tank ($' + cfg.tankCost + ')';
    addBtn.style.opacity = (full || poor) ? '0.5' : '1';
    addBtn.disabled = full;
  }
}

// ============================================
// SHOP
// ============================================

function updateShop() {
  const el = elements.shop;
  el.innerHTML = '';
  for (const key in SPECIES) {
    const sp = SPECIES[key];
    const locked = state.stats.earned < sp.unlock;
    const wrap = document.createElement('div');
    wrap.className = 'srow';
    if (locked) {
      const l = document.createElement('span');
      l.className = 'lock';
      l.textContent = '🔒 ' + sp.name + ' (cuan $' + sp.unlock + ')';
      wrap.appendChild(l);
    } else {
      for (const sx of ['M', 'F']) {
        const b = document.createElement('button');
        b.textContent = sp.name + ' ' + (sx === 'M' ? '♂' : '♀') + ' $' + sp.price;
        b.onclick = () => actBuy(key, sx);
        wrap.appendChild(b);
      }
    }
    el.appendChild(wrap);
  }
}

// ============================================
// PROFILE PANEL
// ============================================

function updateProfile() {
  const f = getProfileId() != null ? byId(getProfileId()) : null;
  if (!f) {
    elements.pCard.style.display = 'none';
    elements.pEmpty.style.display = 'block';
    return;
  }
  elements.pEmpty.style.display = 'none';
  elements.pCard.style.display = 'block';

  const pi = elements.pName;
  if (document.activeElement !== pi) pi.value = f.name;

  const sp = SPECIES[f.species];
  elements.pSpecies.textContent = sp.name + ' ' + (f.sex === 'M' ? '♂' : '♀');
  elements.pHv.textContent = Math.round(f.health);
  elements.pHb.style.width = clamp(f.health, 0, 100) + '%';
  elements.pHb.style.background = f.health > 60 ? '#66bb6a' : f.health > 30 ? '#ffb300' : '#ef5350';
  elements.pAge.textContent = f.age + 'h';
  elements.pFull.textContent = Math.round(f.fullness) + '%';
  elements.pFullb.style.width = clamp(f.fullness, 0, 100) + '%';

  // Transfer button (if multiple tanks)
  let transferHtml = '';
  if (tanks.length > 1) {
    transferHtml = '<div style="margin-top:8px"><button id="btnTransfer" style="width:100%;padding:6px;background:#16405c;border:1px solid #2a6b92;border-radius:4px;color:#dff;font-family:inherit;font-size:11px;cursor:pointer">🔄 Pindah Tank</button></div>';
  }

  // Show traits if any
  if (f.traits) {
    const traitStr = getTraitDisplay(f.traits);
    elements.pAge.textContent += ' · ' + traitStr;
  }

  // Show color info
  if (f.colorInfo) {
    elements.pSpecies.textContent += ' · ' + getColorDisplayName(f.colorInfo);
  }

  const sick = elements.pSick;
  if (f.sick) {
    sick.className = 'sick-slot sick';
    sick.textContent = '⚠️ ' + f.sick.name;
    elements.pSickHint.textContent = 'Cara sembuh: ' + f.sick.fix;
  } else {
    sick.className = 'sick-slot';
    sick.textContent = '💚 Sehat';
    elements.pSickHint.textContent = '';
  }

  // Transfer button UI
  if (transferHtml) {
    const existing = document.getElementById('transferSlot');
    if (existing) existing.remove();
    const slot = document.createElement('div');
    slot.id = 'transferSlot';
    slot.innerHTML = transferHtml;
    elements.pCard.appendChild(slot);
    document.getElementById('btnTransfer').onclick = () => openTransferModal(f.id);
  } else {
    const existing = document.getElementById('transferSlot');
    if (existing) existing.remove();
  }
}

// ============================================
// SELECTION INFO
// ============================================

function updateSelInfo() {
  const el = elements.selinfo;
  const bB = elements.bBreed;
  const bS = elements.bSell;

  if (getFish().length >= cfg.capacity) {
    el.innerHTML = '<span class="full">Akuarium penuh (42). Jual beberapa ikan dulu.</span>';
  }

  if (getSelected().length === 0) {
    el.textContent = 'Klik ikan untuk pilih (piarkan/jual). Klik air kosong untuk jatuhkan 1 pakan.';
    bB.disabled = true;
    bS.disabled = true;
    return;
  }

  const fs = getSelected().map(byId).filter(Boolean);
  bS.disabled = false;

  if (fs.length === 1) {
    const f = fs[0];
    const sp = SPECIES[f.species];
    const mature = f.age >= getEffectiveMaturity(f.species, f.traits);
    el.innerHTML = 'Terpilih: <b>' + sp.name + '</b> ' + (f.sex === 'M' ? '♂' : '♀') + ' ' +
      '<span class="pill">umur ' + f.age + 'h</span> <span class="pill">uk ' + Math.round(f.size * 100) + '%</span> ' +
      '<span class="pill">kenyang ' + Math.round(f.fullness) + '%</span> ' +
      '<span class="pill">' + (mature ? 'dewasa' : 'anak') + '</span> ' +
      '<span class="pill">$' + fishValue(f) + '</span>';
    if (f.traits) {
      el.innerHTML += '<br><small>' + getTraitDisplay(f.traits) + '</small>';
    }
    if (f.colorInfo) {
      el.innerHTML += '<br><small>Warna: ' + getColorDisplayName(f.colorInfo) + '</small>';
    }
    bB.disabled = true;
    return;
  }

  const [a, b] = fs;
  const sp = SPECIES[a.species];
  if (validPair(a, b)) {
    const fryRange = getEffectiveFryCount(a.species, a.traits);
    const est = (fryRange.min + fryRange.max) >> 1;
    
    // Breeding preview: predict color & traits
    const mom = a.sex === 'F' ? a : b;
    const dad = a.sex === 'M' ? a : b;
    const previewTraits = createTraits(a.species, { mom: mom.traits, dad: dad.traits });
    const previewColor = determineColor(a.species, previewTraits, { mom: mom.colorInfo, dad: dad.colorInfo });
    
    el.innerHTML = 'Pasangan: <b>' + sp.name + '</b> ' + a.sex + b.sex + ' — siap dipijahkan! ' +
      '<span class="pill">~' + est + ' anak</span>' +
      '<div style="margin-top:8px;padding:8px;background:#0a1d2c;border:1px solid #234;border-radius:4px;font-size:11px">' +
      '<b>🔮 Prediksi Anak:</b><br>' +
      'Warna: <span style="color:' + previewColor.hex + '">●</span> ' + getColorDisplayName(previewColor) + '<br>' +
      'Trait: ' + getTraitDisplay(previewTraits) +
      '</div>';
    bB.disabled = false;
  } else {
    let why = 'bukan pasangan valid';
    if (getFish().length >= cfg.capacity) why = 'akuarium penuh';
    else if (a.species !== b.species) why = 'spesies beda';
    else if (a.sex === b.sex) why = 'sejenis kelamin';
    else if (a.age < getEffectiveMaturity(a.species, a.traits) || b.age < getEffectiveMaturity(b.species, b.traits)) why = 'belum cukup umur';
    else if (a.cooldown > 0 || b.cooldown > 0) why = 'masih masa istirahat';
    else if (a.pregnant || b.pregnant) why = 'sedang bunting';
    el.innerHTML = 'Terpilih 2 ikan — <b>' + why + '</b>.';
    bB.disabled = true;
  }
}

// ============================================
// INDEX OVERLAY (Fish List)
// ============================================

const idxState = { sort: 'ageAsc' };

function openIndex() {
  renderIndex();
  elements.idxOverlay.style.display = 'flex';
}

function renderIndex() {
  const list = elements.idxList;
  elements.idxCount.textContent = getFish().length;
  let arr = getFish().slice();
  switch (idxState.sort) {
    case 'ageAsc': arr.sort((a, b) => a.age - b.age); break;
    case 'ageDesc': arr.sort((a, b) => b.age - a.age); break;
    case 'priceAsc': arr.sort((a, b) => fishValue(a) - fishValue(b)); break;
    case 'priceDesc': arr.sort((a, b) => fishValue(b) - fishValue(a)); break;
  }
  list.innerHTML = '';
  if (arr.length === 0) {
    list.innerHTML = '<div class="hint" style="grid-column:1/-1">Akuarium kosong.</div>';
    return;
  }
  for (const f of arr) {
    const sp = SPECIES[f.species];
    const card = document.createElement('div');
    card.className = 'fishcard' + (getSelected().includes(f.id) ? ' sel' : '');
    const cvs = document.createElement('canvas');
    cvs.width = 54;
    cvs.height = 36;
    const fx = cvs.getContext('2d');
    fx.fillStyle = '#06121d';
    fx.fillRect(0, 0, 54, 36);
    const cell = Math.max(1, Math.round(1 + f.size * 2.2));
    const pal = { body: f.color, tail: shade(f.color, -45), fin: shade(f.color, 35) };
    drawSpriteScaled(FISH_SPRITE, 27 - Math.round(4.5 * cell), 18 - Math.round(2.5 * cell), false, pal, cell, fx);
    if (f.sick) { fx.fillStyle = '#ff5252'; fx.fillRect(27, 4, cell, cell); }
    card.appendChild(cvs);
    const nm = document.createElement('div');
    nm.className = 'nm';
    nm.textContent = f.name;
    card.appendChild(nm);
    const sub = document.createElement('div');
    sub.className = 'sub';
    sub.textContent = sp.name + ' ' + (f.sex === 'M' ? '♂' : '♀') + ' • ' + f.age + 'h' + (f.pregnant ? ' • bunting' : '');
    card.appendChild(sub);
    if (f.traits) {
      const tr = document.createElement('div');
      tr.className = 'sub';
      tr.style.fontSize = '9px';
      tr.textContent = getTraitDisplay(f.traits);
      card.appendChild(tr);
    }
    if (f.colorInfo) {
      const cl = document.createElement('div');
      cl.className = 'sub';
      cl.style.fontSize = '9px';
      cl.style.color = f.colorInfo.isRare ? '#ffd54a' : '#8fd3ff';
      cl.textContent = getColorDisplayName(f.colorInfo);
      card.appendChild(cl);
    }
    const pr = document.createElement('div');
    pr.className = 'pr';
    pr.textContent = '$' + fishValue(f);
    card.appendChild(pr);
    const sellBtn = document.createElement('button');
    sellBtn.className = 'sellbtn';
    sellBtn.textContent = '💰 Jual';
    sellBtn.onclick = (e) => { e.stopPropagation(); sellOne(f.id); };
    card.appendChild(sellBtn);
    card.onclick = () => { toggleSelect(f.id); renderIndex(); };
    list.appendChild(card);
  }
}

function closeIndex() {
  elements.idxOverlay.style.display = 'none';
}

// Sort handlers
elements.idxSortAgeAsc.onclick = () => { idxState.sort = 'ageAsc'; renderIndex(); };
elements.idxSortAgeDesc.onclick = () => { idxState.sort = 'ageDesc'; renderIndex(); };
elements.idxSortPriceAsc.onclick = () => { idxState.sort = 'priceAsc'; renderIndex(); };
elements.idxSortPriceDesc.onclick = () => { idxState.sort = 'priceDesc'; renderIndex(); };
elements.idxClose.onclick = closeIndex;

// ============================================
// TRANSFER MODAL
// ============================================

function openTransferModal(fishId) {
  const f = byId(fishId);
  if (!f) return;
  
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(4,10,18,0.9);display:flex;align-items:center;justify-content:center;z-index:100;';
  modal.innerHTML = `
    <div style="background:#112233;border:2px solid #1d4a6b;border-radius:6px;padding:20px;min-width:280px;max-width:90vw">
      <h3 style="margin:0 0 12px;color:#39c">🔄 Pindah ${f.name}</h3>
      <p style="font-size:12px;opacity:0.8;margin:0 0 16px">Pilih akuarium tujuan:</p>
      <div id="transferTargets" style="display:flex;flex-direction:column;gap:8px"></div>
      <button id="cancelTransfer" style="margin-top:16px;width:100%;padding:8px;background:#ff6b6b;border:none;border-radius:4px;color:#fff;font-family:inherit;cursor:pointer">Batal</button>
    </div>
  `;
  document.body.appendChild(modal);
  
  const targets = modal.querySelector('#transferTargets');
  tanks.forEach((t, i) => {
    if (i === gameRefs.activeTank) return;
    const btn = document.createElement('button');
    btn.textContent = `${t.name} (${t.fish.length}/${cfg.capacity})`;
    btn.style.cssText = 'padding:10px;background:#16405c;border:1px solid #2a6b92;border-radius:4px;color:#dff;font-family:inherit;font-size:12px;cursor:pointer;text-align:left';
    btn.onmouseover = () => btn.style.background = '#1d5173';
    btn.onmouseout = () => btn.style.background = '#16405c';
    btn.onclick = () => {
      transferFish(fishId, i);
      document.body.removeChild(modal);
    };
    targets.appendChild(btn);
  });
  
  modal.querySelector('#cancelTransfer').onclick = () => document.body.removeChild(modal);
  modal.onclick = (e) => { if (e.target === modal) document.body.removeChild(modal); };
}

function transferFish(fishId, targetTankIdx) {
  const fish = byId(fishId);
  if (!fish) return;
  
  const targetTank = tanks[targetTankIdx];
  if (targetTank.fish.length >= cfg.capacity) {
    toast('🚫 ' + targetTank.name + ' penuh!');
    return;
  }
  
  // Remove from current tank
  const currentTank = tanks[gameRefs.activeTank];
  currentTank.fish = currentTank.fish.filter(f => f.id !== fishId);
  
  // Add to target tank (adjust position)
  fish.x = 10 + Math.random() * 170;
  fish.y = 12 + Math.random() * 100;
  targetTank.fish.push(fish);
  
  // Clean up selection
  const selected = getSelected().filter(id => id !== fishId);
  setSelected(selected);
  if (getProfileId() === fishId) setProfileId(null);
  
  toast('✅ ' + fish.name + ' dipindah ke ' + targetTank.name + '!');
  refreshActiveTankUI();
}

// ============================================
// TANK BAR UI
// ============================================

const TANK_COST = cfg.tankCost;
const MAX_TANKS = cfg.maxTanks;

function updateTankBar() {
  const t = tanks[gameRefs.activeTank];
  elements.tankLabel.textContent = t.name + ' (' + (gameRefs.activeTank + 1) + '/' + tanks.length + ')';
  const addBtn = elements.tankAdd;
  const full = tanks.length >= MAX_TANKS;
  const poor = state.coins < TANK_COST;
  addBtn.textContent = full ? '➕ Tank (MAX)' : '➕ Tank ($' + TANK_COST + ')';
  addBtn.style.opacity = (full || poor) ? '0.5' : '1';
  addBtn.disabled = full;
}

function refreshActiveTankUI() {
  elements.bLamp.textContent = '💡 Lampu: ' + (getWater().lampOn ? 'ON' : 'OFF');
  updateTankBar();
  updateShop();
  updateHUD();
  updateSelInfo();
  updateProfile();
}

function switchTank(dir) {
  if (tanks.length < 2) { toast('Cuma ada 1 akuarium — klik ➕ Tank dulu'); return; }
  gameRefs.activeTank = (gameRefs.activeTank + dir + tanks.length) % tanks.length;
  refreshActiveTankUI();
  toast('🔄 ' + tanks[gameRefs.activeTank].name);
}

function addTank() {
  if (tanks.length >= MAX_TANKS) { flash('Maksimal ' + MAX_TANKS + ' akuarium'); toast('🚫 Maksimal ' + MAX_TANKS + ' akuarium'); return; }
  if (state.coins < TANK_COST) {
    flash('Koin kurang!');
    toast('💰 Koin kurang! Butuh $' + TANK_COST + ' buat akuarium baru (punya $' + state.coins + ')');
    return;
  }
  state.coins -= TANK_COST;
  tanks.push(makeTank('Akuarium ' + (tanks.length + 1)));
  gameRefs.activeTank = tanks.length - 1;
  refreshActiveTankUI();
  toast('✅ ' + tanks[gameRefs.activeTank].name + ' dibuat! (−$' + TANK_COST + ')');
}

function renameTank() {
  const nm = window.prompt('Nama akuarium:', tanks[gameRefs.activeTank].name);
  if (nm && nm.trim()) { tanks[gameRefs.activeTank].name = nm.trim().slice(0, 20); refreshActiveTankUI(); }
}

elements.tankPrev.onclick = () => switchTank(-1);
elements.tankNext.onclick = () => switchTank(1);
elements.tankAdd.onclick = addTank;
elements.tankRename.onclick = renameTank;

// Keyboard: arrow left/right for tank switch
window.addEventListener('keydown', e => {
  if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
  if (e.code === 'ArrowLeft') { e.preventDefault(); switchTank(-1); }
  else if (e.code === 'ArrowRight') { e.preventDefault(); switchTank(1); }
});

// ============================================
// GAME OVER
// ============================================

function doGameOver() {
  state.gameOver = true;
  state.running = false;
  const score = state.stats.bred * 5 + state.stats.earned + state.day * 10;
  elements.ovscore.textContent = 'Skor: ' + score +
    '  (Hari ' + state.day + ', dibesarkan ' + state.stats.bred + ', cuan $' + state.stats.earned + ')';
  elements.overlay.style.display = 'flex';
}

// ============================================
// ACHIEVEMENT PANEL
// ============================================

function openAchievements() {
  const achievements = getAchievements();
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(4,10,18,0.95);display:flex;align-items:center;justify-content:center;z-index:100;overflow:auto;';
  modal.innerHTML = `
    <div style="background:#112233;border:2px solid #1d4a6b;border-radius:6px;padding:20px;min-width:320px;max-width:90vw;max-height:80vh;overflow:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="margin:0;color:#39c">🏆 Pencapaian</h3>
        <button id="closeAchievements" style="background:#ff6b6b;border:none;border-radius:4px;color:#fff;padding:6px 12px;font-family:inherit;cursor:pointer">✖️ Tutup</button>
      </div>
      <div id="achievementList" style="display:flex;flex-direction:column;gap:8px"></div>
    </div>
  `;
  document.body.appendChild(modal);
  
  const list = modal.querySelector('#achievementList');
  achievements.forEach(ach => {
    const item = document.createElement('div');
    item.style.cssText = 'padding:12px;background:#0a1d2c;border:1px solid ' + (ach.unlocked ? '#39c' : '#234') + ';border-radius:4px;display:flex;align-items:flex-start;gap:10px;opacity:' + (ach.unlocked ? '1' : '0.5');
    item.innerHTML = `
      <span style="font-size:24px;flex:0 0 40px">${ach.unlocked ? '✅' : '🔒'}</span>
      <div style="flex:1">
        <div style="font-weight:bold;color:${ach.unlocked ? '#39c' : '#8fd3ff'}">${ach.name}</div>
        <div style="font-size:11px;opacity:0.8;margin-top:2px">${ach.desc}</div>
        ${ach.unlocked && ach.unlockedAt ? '<div style="font-size:10px;opacity:0.6;margin-top:4px">Terbuka: ' + new Date(ach.unlockedAt).toLocaleDateString('id-ID') + '</div>' : ''}
      </div>
    `;
    list.appendChild(item);
  });
  
  modal.querySelector('#closeAchievements').onclick = () => document.body.removeChild(modal);
  modal.onclick = (e) => { if (e.target === modal) document.body.removeChild(modal); };
}

elements.bAchievements.onclick = openAchievements;

// ============================================
// EXPORTS
// ============================================

export {
  cacheElements,
  updateHUD,
  updateShop,
  updateProfile,
  updateSelInfo,
  openIndex,
  closeIndex,
  renderIndex,
  refreshActiveTankUI,
  doGameOver,
  elements,
};