// ============================================
// RENDERING ENGINE
// ============================================

import { FISH_SPRITE, shade } from './sprites.js';
import { SPECIES, clamp } from './species.js';
import { cfg, getFish, getWater, getFilterLevel, getFoods, getFeedLeftover, setFeedLeftover, getFedRatio, getBubbles, getSelected, state, byId } from './game.js';

// Canvas context (initialized in main.js)
let cv = null;
let ctx = null;

function initRenderer(canvas) {
  cv = canvas;
  ctx = cv.getContext('2d');
}

function fishScale(f) {
  return 1 + f.size * 2.2;
}

function drawSpriteScaled(grid, x, y, flip, pal, cell, c = ctx) {
  const w = grid[0].length;
  const h = grid.length;
  for (let r = 0; r < h; r++) {
    for (let cc = 0; cc < w; cc++) {
      const ch = grid[r][cc];
      if (ch === '.') continue;
      let col = pal.body;
      if (ch === 'E') col = '#0a0f14';
      else if (ch === 'T') col = pal.tail;
      else if (ch === 'F') col = pal.fin;
      const px = flip ? (w - 1 - cc) : cc;
      c.fillStyle = col;
      c.fillRect(x + px * cell, y + r * cell, cell, cell);
    }
  }
}

function drawPlants() {
  if (!ctx) return;
  ctx.fillStyle = '#1b5e20';
  for (const bx of [14, 40, 70, 110, 150, 176]) {
    for (let i = 0; i < 22; i++) {
      const sway = Math.sin((performance.now() / 700) + bx + i * 0.4) * 2;
      ctx.fillRect(bx + sway * (i / 22), 128 - i * 2, 2, 2);
    }
  }
}

function drawFilter() {
  if (!ctx) return;
  const fl = getFilterLevel();
  if (fl < 1) return;
  const lv = fl;
  const bx = 170, by = 96, bw = 18, bh = 22;
  const t = performance.now() / 1000;

  const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
  const gr = ctx.createRadialGradient(bx + bw / 2, by + bh / 2, 2, bx + bw / 2, by + bh / 2, 28 + lv * 7);
  gr.addColorStop(0, 'rgba(120,220,255,' + ((0.10 + 0.05 * lv) * pulse).toFixed(3) + ')');
  gr.addColorStop(1, 'rgba(120,220,255,0)');
  ctx.fillStyle = gr;
  ctx.fillRect(bx - 16, by - 16, bw + 32, bh + 32);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < lv; i++) {
    const yy = 24 + i * 34 + Math.sin(t * 0.6 + i) * 4;
    const off = (t * 14 * (0.6 + i * 0.3)) % 192;
    ctx.strokeStyle = 'rgba(150,230,255,' + (0.05 + 0.02 * lv).toFixed(3) + ')';
    ctx.lineWidth = 1;
    for (let x = -20; x < 192; x += 42) {
      ctx.beginPath();
      ctx.moveTo(x - off, yy);
      ctx.lineTo(x - off + 24, yy - 2);
      ctx.stroke();
    }
  }
  ctx.restore();

  ctx.fillStyle = '#37474f';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#90a4ae';
  ctx.fillRect(bx + 2, by + 2, bw - 4, 3);
  ctx.fillStyle = '#263238';
  ctx.fillRect(bx + bw / 2 - 1, by - 7, 2, 7);
  ctx.fillRect(bx + bw / 2 - 1, by + bh, 2, 4);
  ctx.fillStyle = '#455a64';
  for (let i = 1; i < 4; i++) ctx.fillRect(bx + 2, by + 6 + i * 4, bw - 4, 1);

  const cols = ['#1b4f72', '#29b6f6', '#80d8ff'];
  for (let i = 0; i < lv; i++) {
    ctx.fillStyle = cols[Math.min(i, 2)];
    ctx.fillRect(bx + 3 + i * 5, by + bh - 5, 3, 3);
  }

  const n = 2 + lv * 3;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const phase = (t * (1.2 + lv * 0.4) + i / n) % 1;
    const yy = by - 7 - phase * 94;
    const xx = bx + bw / 2 + Math.sin(phase * 6 + i * 1.7) * 2.4;
    const sz = 1.6 + (i % 2);
    const a = (0.9 * (1 - phase * 0.6));
    ctx.fillStyle = 'rgba(210,245,255,' + a.toFixed(2) + ')';
    ctx.beginPath();
    ctx.arc(xx, yy, sz, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function updateFood(tank) {
  if (!state.running) return;
  for (const fd of tank.foods) {
    fd.y += fd.vy;
    if (fd.y > 120) fd.sunk = true;
  }
  const foods = tank.foods;
  for (let i = foods.length - 1; i >= 0; i--) {
    const fd = foods[i];
    if (fd.sunk) {
      tank.feedLeftover += 1;
      foods.splice(i, 1);
    }
  }
}

function updateAndDrawFish(tank) {
  const foods = tank.foods;
  for (const f of tank.fish) {
    f.t += 0.05;
    let target = null;
    let td = 1e9;
    if (f.fullness < 90) {
      for (const fd of foods) {
        if (fd.eaten) continue;
        const dx = fd.x - f.x;
        const dy = fd.y - f.y;
        const d = dx * dx + dy * dy;
        if (d < td) {
          td = d;
          target = fd;
        }
      }
    }
    if (state.running) {
      if (target) {
        const dx = target.x - f.x;
        const dy = target.y - f.y;
        const d = Math.sqrt(td) || 1;
        const hunger = 1 - f.fullness / 100;
        const proximity = clamp(1 - d / 30, 0, 1);
        const speed = 0.04 + hunger * 0.12 + proximity * 0.12;
        f.vx += (dx / d) * speed;
        f.vy += (dy / d) * speed;
        if (d < 3) {
          f.fullness = clamp(f.fullness + cfg.eatGain, 0, 100);
          target.eaten = true;
        }
      } else {
        const spN = SPECIES[f.species];
        const nearParent = (f.age < spN.maturity) && f.parentId != null && byId(f.parentId);
        const p = nearParent ? byId(f.parentId) : null;
        let tx, ty;
        if (nearParent) {
          tx = p.x;
          ty = p.y;
        } else {
          tx = f.tx;
          ty = f.ty;
        }
        const dx = tx - f.x;
        const dy = ty - f.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const drift = f.spd * (0.6 + Math.random() * 0.6);
        f.vx = (dx / d) * drift;
        f.vy = (dy / d) * drift;
        if (nearParent) {
          if (d > 16) {
            f.tx = p.x + (Math.random() * 20 - 10);
            f.ty = p.y + (Math.random() * 14 - 7);
          }
        } else if (d < 10) {
          f.tx = 4 + Math.random() * 184;
          f.ty = 8 + Math.random() * 112;
        }
      }
      f.vx = clamp(f.vx, -0.6, 0.6);
      f.vy = clamp(f.vy, -0.5, 0.5);
      f.vx *= 0.96;
      f.vy *= 0.96;
      f.x += f.vx;
      f.y += f.vy;
      if (f.y < 8) { f.y = 8; f.head = -f.head; }
      if (f.y > 118) { f.y = 118; f.head = -f.head; }
      if (f.x < -12) { f.x = 204; }
      if (f.x > 204) { f.x = -12; }
      if (f.vx > 0.001) f.flip = false;
      else if (f.vx < -0.001) f.flip = true;
    }
    const cell = Math.max(1, Math.round(fishScale(f)));
    const pal = { body: f.color, tail: shade(f.color, -45), fin: shade(f.color, 35) };
    drawSpriteScaled(FISH_SPRITE, Math.round(f.x), Math.round(f.y), f.flip, pal, cell);
    if (f.pregnant) {
      ctx.fillStyle = '#ff80ab';
      ctx.fillRect(Math.round(f.x) + 3 * cell, Math.round(f.y) + 3 * cell, cell, cell);
    }
    if (f.sick) {
      ctx.fillStyle = '#ff5252';
      ctx.fillRect(Math.round(f.x) + 4 * cell, Math.round(f.y) - 2, cell, cell);
    }
    if (getSelected().includes(f.id)) {
      ctx.strokeStyle = '#ffd54a';
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(f.x) - 1, Math.round(f.y) - 1, 9 * cell + 2, 5 * cell + 2);
    }
    if (f.health < 35) {
      ctx.fillStyle = 'rgba(120,0,0,0.28)';
      ctx.fillRect(Math.round(f.x), Math.round(f.y), 9 * cell, 5 * cell);
    }
  }
  tank.foods = tank.foods.filter(fd => !fd.eaten);
}

function render(tank) {
  if (!ctx) return;
  const w = tank.water;
  const g = ctx.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, '#1b4f72');
  g.addColorStop(1, '#06121d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 192, 128);
  if (w.lampOn) {
    ctx.fillStyle = 'rgba(255,255,200,0.04)';
    for (let i = 0; i < 5; i++) ctx.fillRect(10 + i * 40, 0, 8, 128);
  }
  drawPlants();
  ctx.fillStyle = '#e0b070';
  for (const fd of tank.foods) ctx.fillRect(fd.x, fd.y, 2, 2);
  updateFood(tank);
  updateAndDrawFish(tank);
  drawFilter();
  ctx.fillStyle = 'rgba(220,240,255,0.5)';
  for (const b of tank.bubbles) {
    b.y -= b.s;
    if (b.y < 0) { b.y = 128; b.x = Math.random() * 192; }
    ctx.fillRect(b.x, b.y, b.r, b.r);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.strokeRect(0, 0, 192, 128);
}

export { initRenderer, render, updateAndDrawFish, fishScale, drawSpriteScaled, drawPlants, drawFilter, updateFood, clamp };