// ============================================
// SPECIES & GENETICS DATA
// ============================================

// Trait definitions — each trait has a base range per species
// Values are 0-1 normalized, applied as multipliers
export const TRAIT_DEFS = {
  growthRate:     { name: 'Pertumbuhan',    desc: 'Seberapa cepat ikan mencapai ukuran dewasa',      base: 1.0,   mutationChance: 0.02, mutationRange: 0.15 },
  diseaseResist:  { name: 'Ketahanan',      desc: 'Mengurangi kerusakan health dari penyakit',       base: 1.0,   mutationChance: 0.02, mutationRange: 0.15 },
  fryCount:       { name: 'Jumlah Anak',    desc: 'Bonus jumlah fry saat melahirkan',                base: 1.0,   mutationChance: 0.03, mutationRange: 0.20 },
  longevity:      { name: 'Umur Panjang',   desc: 'Health decay lebih lambat saat tua',              base: 1.0,   mutationChance: 0.01, mutationRange: 0.10 },
  colorIntensity: { name: 'Intensitas Warna', desc: 'Warna lebih cerah/jenuh',                       base: 1.0,   mutationChance: 0.05, mutationRange: 0.25 },
  appetite:       { name: 'Nafsu Makan',    desc: 'Fullness decay lebih lambat',                     base: 1.0,   mutationChance: 0.02, mutationRange: 0.15 },
  tempTolerance:  { name: 'Toleransi Suhu', desc: 'Range suhu aman lebih lebar (±2°C)',              base: 1.0,   mutationChance: 0.01, mutationRange: 0.10 },
};

// Color palette per species — extended with rare variants
export const SPECIES = {
  guppy: {
    name: 'Guppy',
    price: 20,
    maturity: 3,
    fryMin: 3,
    fryMax: 6,
    value: 16,
    unlock: 0,
    colors: ['#ffb74d', '#4fc3f7', '#fff176', '#ce93d8', '#ef9a9a'],
    rareColors: {
      albino:       { hex: '#fff8e1', weight: 0.002, name: 'Albino' },
      melanistic:   { hex: '#212121', weight: 0.003, name: 'Melanistik' },
      neonBlue:     { hex: '#00e5ff', weight: 0.005, name: 'Neon Biru' },
      neonGreen:    { hex: '#76ff03', weight: 0.005, name: 'Neon Hijau' },
      koiPattern:   { hex: '#ffca28', weight: 0.008, name: 'Pola Koi', pattern: 'koi' },
    },
    baseTraits: {
      growthRate: 1.2,
      diseaseResist: 0.9,
      fryCount: 1.3,
      longevity: 0.8,
      colorIntensity: 1.1,
      appetite: 1.1,
      tempTolerance: 1.0,
    },
    prefWater: { phMin: 7.0, phMax: 8.0, tempMin: 22, tempMax: 28 },
  },
  platy: {
    name: 'Platy',
    price: 30,
    maturity: 4,
    fryMin: 3,
    fryMax: 6,
    value: 26,
    unlock: 0,
    colors: ['#ff8a65', '#aed581', '#4dd0e1', '#f06292'],
    rareColors: {
      albino:       { hex: '#fff8e1', weight: 0.002, name: 'Albino' },
      melanistic:   { hex: '#212121', weight: 0.003, name: 'Melanistik' },
      sunset:       { hex: '#ff6d00', weight: 0.006, name: 'Sunset' },
      platinum:     { hex: '#e0e0e0', weight: 0.004, name: 'Platinum' },
      tuxedo:       { hex: '#ff5722', weight: 0.007, name: 'Tuxedo', pattern: 'tuxedo' },
    },
    baseTraits: {
      growthRate: 1.0,
      diseaseResist: 1.1,
      fryCount: 1.1,
      longevity: 1.0,
      colorIntensity: 1.0,
      appetite: 1.0,
      tempTolerance: 1.1,
    },
    prefWater: { phMin: 7.0, phMax: 8.2, tempMin: 22, tempMax: 28 },
  },
  swordtail: {
    name: 'Swordtail',
    price: 45,
    maturity: 6,
    fryMin: 3,
    fryMax: 5,
    value: 42,
    unlock: 200,
    colors: ['#ff7043', '#26c6da', '#9ccc65'],
    rareColors: {
      albino:       { hex: '#fff8e1', weight: 0.002, name: 'Albino' },
      melanistic:   { hex: '#212121', weight: 0.003, name: 'Melanistik' },
      pineapple:    { hex: '#ffd600', weight: 0.005, name: 'Pineapple' },
      koiPattern:   { hex: '#ffca28', weight: 0.006, name: 'Koi Pattern', pattern: 'koi' },
      hiFin:        { hex: '#ff7043', weight: 0.008, name: 'Hi-Fin', pattern: 'hifin' },
    },
    baseTraits: {
      growthRate: 0.9,
      diseaseResist: 1.0,
      fryCount: 0.9,
      longevity: 1.1,
      colorIntensity: 1.1,
      appetite: 0.9,
      tempTolerance: 1.0,
    },
    prefWater: { phMin: 7.0, phMax: 8.4, tempMin: 23, tempMax: 28 },
  },
  angelfish: {
    name: 'Angelfish',
    price: 80,
    maturity: 8,
    fryMin: 2,
    fryMax: 4,
    value: 90,
    unlock: 500,
    colors: ['#eceff1', '#b39ddb', '#80cbc4'],
    rareColors: {
      albino:       { hex: '#fff8e1', weight: 0.0015, name: 'Albino' },
      melanistic:   { hex: '#212121', weight: 0.002, name: 'Melanistik' },
      koiPattern:   { hex: '#ffca28', weight: 0.004, name: 'Koi', pattern: 'koi' },
      platinum:     { hex: '#e8eaf6', weight: 0.003, name: 'Platinum' },
      zebra:        { hex: '#9e9e9e', weight: 0.005, name: 'Zebra', pattern: 'zebra' },
      veilTail:     { hex: '#b39ddb', weight: 0.006, name: 'Veil Tail', pattern: 'veil' },
    },
    baseTraits: {
      growthRate: 0.7,
      diseaseResist: 0.8,
      fryCount: 0.7,
      longevity: 1.3,
      colorIntensity: 1.2,
      appetite: 0.8,
      tempTolerance: 0.9,
    },
    prefWater: { phMin: 6.5, phMax: 7.5, tempMin: 25, tempMax: 30 },
  },
  koi: {
    name: 'Koi',
    price: 120,
    maturity: 12,
    fryMin: 2,
    fryMax: 3,
    value: 160,
    unlock: 1000,
    colors: ['#ffca28', '#ffffff', '#ff7043', '#212121'],
    rareColors: {
      doitsu:       { hex: '#fff8e1', weight: 0.003, name: 'Doitsu (Scaleless)', pattern: 'doitsu' },
      ginrin:       { hex: '#e3f2fd', weight: 0.004, name: 'Ginrin (Sparkle)', pattern: 'ginrin' },
      tancho:       { hex: '#ffffff', weight: 0.002, name: 'Tancho (Red Spot)', pattern: 'tancho' },
      showa:        { hex: '#212121', weight: 0.003, name: 'Showa', pattern: 'showa' },
      kohaku:       { hex: '#ffca28', weight: 0.003, name: 'Kohaku', pattern: 'kohaku' },
    },
    baseTraits: {
      growthRate: 0.5,
      diseaseResist: 1.2,
      fryCount: 0.5,
      longevity: 1.5,
      colorIntensity: 1.3,
      appetite: 1.0,
      tempTolerance: 1.2,
    },
    prefWater: { phMin: 6.8, phMax: 7.8, tempMin: 18, tempMax: 26 },
  },
};

// Utility functions
export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
export function ri(a, b) { return a + ((Math.random() * (b - a + 1)) | 0); }

// ============================================
// GENETICS ENGINE
// ============================================

/**
 * Create a new trait object for a fish
 * @param {string} speciesKey
 * @param {Object} [parentTraits] — if breeding, inherit from parents {mom, dad}
 * @returns {Object} traits object with all 7 traits
 */
export function createTraits(speciesKey, parentTraits = null) {
  const sp = SPECIES[speciesKey];
  const baseTraits = sp.baseTraits;
  const traits = {};

  for (const [key, def] of Object.entries(TRAIT_DEFS)) {
    let value = baseTraits[key] * def.base;

    // Inheritance from parents (mid-parent + variance)
    if (parentTraits && parentTraits.mom && parentTraits.dad) {
      const momVal = parentTraits.mom[key] || def.base;
      const dadVal = parentTraits.dad[key] || def.base;
      value = (momVal + dadVal) / 2 * (0.9 + Math.random() * 0.2);
    } else if (parentTraits && parentTraits.single) {
      value = parentTraits.single[key] * (0.95 + Math.random() * 0.1);
    }

    // Mutation chance
    if (Math.random() < def.mutationChance) {
      const mut = (Math.random() - 0.5) * 2 * def.mutationRange;
      value = clamp(value + mut, 0.1, 3.0);
    }

    traits[key] = clamp(value, 0.1, 3.0);
  }

  return traits;
}

/**
 * Determine fish color based on genetics
 */
export function determineColor(speciesKey, traits, parentColors = null) {
  const sp = SPECIES[speciesKey];
  const colorIntensity = traits.colorIntensity || 1.0;

  // Check for rare color mutation
  const rareRoll = Math.random();
  let cumulative = 0;

  for (const [rareKey, rareData] of Object.entries(sp.rareColors)) {
    cumulative += rareData.weight;
    if (rareRoll < cumulative) {
      let hex = rareData.hex;
      hex = adjustColorIntensity(hex, colorIntensity);
      return {
        hex,
        name: rareData.name,
        isRare: true,
        pattern: rareData.pattern || null,
        rareKey,
      };
    }
  }

  // Normal color inheritance
  let baseColor;
  if (parentColors && parentColors.mom && parentColors.dad) {
    baseColor = blendColors(parentColors.mom.hex, parentColors.dad.hex);
  } else {
    baseColor = sp.colors[ri(0, sp.colors.length - 1)];
  }

  const hex = adjustColorIntensity(baseColor, colorIntensity);

  return {
    hex,
    name: 'Normal',
    isRare: false,
    pattern: null,
  };
}

function adjustColorIntensity(hex, intensity) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;

  const factor = clamp(intensity, 0.3, 2.0);
  const avg = (r + g + b) / 3;
  r = clamp(avg + (r - avg) * factor, 0, 255);
  g = clamp(avg + (g - avg) * factor, 0, 255);
  b = clamp(avg + (b - avg) * factor, 0, 255);

  const brightness = 1.0 + (intensity - 1.0) * 0.3;
  r = clamp(r * brightness, 0, 255);
  g = clamp(g * brightness, 0, 255);
  b = clamp(b * brightness, 0, 255);

  return '#' + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
}

function blendColors(hex1, hex2) {
  const n1 = parseInt(hex1.slice(1), 16);
  const n2 = parseInt(hex2.slice(1), 16);

  const r1 = (n1 >> 16) & 255, g1 = (n1 >> 8) & 255, b1 = n1 & 255;
  const r2 = (n2 >> 16) & 255, g2 = (n2 >> 8) & 255, b2 = n2 & 255;

  const w = 0.5 + (Math.random() - 0.5) * 0.2;
  const r = Math.round(r1 * w + r2 * (1 - w));
  const g = Math.round(g1 * w + g2 * (1 - w));
  const b = Math.round(b1 * w + b2 * (1 - w));

  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function getEffectiveMaturity(speciesKey, traits) {
  const baseMaturity = SPECIES[speciesKey].maturity;
  return Math.max(1, Math.round(baseMaturity / (traits?.growthRate || 1.0)));
}

export function getEffectiveFryCount(speciesKey, traits) {
  const sp = SPECIES[speciesKey];
  const mult = traits?.fryCount || 1.0;
  return {
    min: Math.max(1, Math.round(sp.fryMin * mult)),
    max: Math.max(1, Math.round(sp.fryMax * mult)),
  };
}

export function getEffectiveGestation(speciesKey, traits) {
  const baseGestation = 2;
  return Math.max(1, Math.round(baseGestation / (traits?.growthRate || 1.0)));
}

export function getTraitDisplay(traits) {
  if (!traits) return '';
  const entries = Object.entries(traits).map(([key, value]) => {
    const def = TRAIT_DEFS[key];
    const pct = Math.round((value - 1) * 100);
    const sign = pct >= 0 ? '+' : '';
    return `${def.name}: ${sign}${pct}%`;
  });
  return entries.join(' · ');
}

export function getColorDisplayName(colorInfo) {
  if (colorInfo?.isRare) {
    return `✨ ${colorInfo.name}`;
  }
  return colorInfo?.name || 'Normal';
}

export { adjustColorIntensity, blendColors };