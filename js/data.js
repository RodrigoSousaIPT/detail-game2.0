/* ========================================================================
   DETAIL KINGS — Game Data (Production Build)
   Version: 2.0.0
   Description: Core game constants, configurations, and data definitions
   ======================================================================== */

/** @type {Object.<string, {label: string, emoji: string, tiers: Array}>} */
const TOOL_CATEGORIES = Object.freeze({
  wash: {
    label: 'Washing',
    emoji: '💧',
    tiers: Object.freeze([
      { name: 'Basic Brush',      cost: 0,     radius: 0.030, pay: 1.0,  emoji: '🖌️', desc: 'Slow but gets the job done' },
      { name: 'Sponge',           cost: 120,   radius: 0.050, pay: 1.25, emoji: '🧽', desc: 'Better coverage and suds' },
      { name: 'Foam Cannon',      cost: 600,   radius: 0.085, pay: 1.6,  emoji: '🧴', desc: 'Thick foam, fast cleaning' },
      { name: 'Pressure Washer',  cost: 2800,  radius: 0.130, pay: 2.2,  emoji: '💦', desc: 'Blast dirt away instantly' }
    ])
  },
  dry: {
    label: 'Drying',
    emoji: '🌬️',
    tiers: Object.freeze([
      { name: 'Old Microfiber',   cost: 0,     radius: 0.035, pay: 1.0,  emoji: '🧻', desc: 'Worn but usable cloth' },
      { name: 'Chamois',          cost: 180,   radius: 0.055, pay: 1.3,  emoji: '🟫', desc: 'Absorbs water fast' },
      { name: 'Microfiber Set',   cost: 800,   radius: 0.090, pay: 1.7,  emoji: '🟦', desc: 'Premium plush towels' },
      { name: 'Air Blower',       cost: 3500,  radius: 0.140, pay: 2.4,  emoji: '🌪️', desc: 'Touchless drying system' }
    ])
  },
  polish: {
    label: 'Polishing',
    emoji: '✨',
    tiers: Object.freeze([
      { name: 'Rag',              cost: 0,     radius: 0.030, pay: 1.0,  emoji: '🧶', desc: 'Hand buffing cloth' },
      { name: 'Hand Polisher',    cost: 250,   radius: 0.055, pay: 1.4,  emoji: '🫧', desc: 'Manual orbital action' },
      { name: 'DA Polisher',      cost: 1200,  radius: 0.095, pay: 1.9,  emoji: '⚙️', desc: 'Dual-action machine' },
      { name: 'Rotary Buffer',    cost: 5000,  radius: 0.150, pay: 2.8,  emoji: '🔆', desc: 'Mirror finish pro tool' }
    ])
  },
  interior: {
    label: 'Interior',
    emoji: '🛋️',
    tiers: Object.freeze([
      { name: 'Dust Brush',       cost: 0,     radius: 0.030, pay: 1.0,  emoji: '🧹', desc: 'Basic dashboard dusting' },
      { name: 'Shop Vac',         cost: 300,   radius: 0.060, pay: 1.4,  emoji: '🧰', desc: 'Powerful debris suction' },
      { name: 'Steam Cleaner',    cost: 1500,  radius: 0.100, pay: 2.0,  emoji: '♨️', desc: 'Deep sanitizing steam' },
      { name: 'Ozone Machine',    cost: 6000,  radius: 0.160, pay: 3.0,  emoji: '☣️', desc: 'Eliminates all odors' }
    ])
  },
  wax: {
    label: 'Wax & Sealant',
    emoji: '🛡️',
    tiers: Object.freeze([
      { name: 'Spray Wax',        cost: 0,     radius: 0.035, pay: 1.15, emoji: '🧪', desc: 'Quick spray-on protection' },
      { name: 'Hand Wax',         cost: 700,   radius: 0.060, pay: 1.5,  emoji: '🧈', desc: 'Carnauba wax shine' },
      { name: 'Ceramic Coating',  cost: 2500,  radius: 0.100, pay: 2.1,  emoji: '💎', desc: 'Nano-ceramic hardness' },
      { name: 'Pro Sealant',      cost: 8000,  radius: 0.155, pay: 3.2,  emoji: '🔮', desc: 'Premium 5-year protection' }
    ])
  },
  wheel: {
    label: 'Tires & Wheels',
    emoji: '⚫',
    tiers: Object.freeze([
      { name: 'All-Purpose Clean', cost: 0,    radius: 0.035, pay: 1.1,  emoji: '🧴', desc: 'Basic wheel cleaner' },
      { name: 'Tire Brush',       cost: 500,   radius: 0.060, pay: 1.35, emoji: '🪥', desc: 'Scrubs tire sidewalls' },
      { name: 'Wheel Polisher',   cost: 2000,  radius: 0.095, pay: 1.85, emoji: '🔄', desc: 'Brings back rim shine' },
      { name: 'Tire Shine Pro',   cost: 7000,  radius: 0.145, pay: 2.9,  emoji: '✨', desc: 'Long-lasting wet look' }
    ])
  },
  glass: {
    label: 'Windows & Glass',
    emoji: '🪟',
    tiers: Object.freeze([
      { name: 'Glass Cleaner',    cost: 0,     radius: 0.040, pay: 1.1,  emoji: '🧪', desc: 'Streak-free formula' },
      { name: 'Squeegee',         cost: 400,   radius: 0.065, pay: 1.35, emoji: '🪒', desc: 'Professional squeegee' },
      { name: 'Glass Polisher',   cost: 1800,  radius: 0.095, pay: 1.8,  emoji: '🔄', desc: 'Removes water spots' },
      { name: 'Rain Repellent',   cost: 6500,  radius: 0.145, pay: 2.7,  emoji: '🌧️', desc: 'Hydrophobic coating' }
    ])
  }
});

/** @type {Array<{name: string, cost: number, tipBonus: number, light: number, floor: number, wall: number, desc: string}>} */
const SHOP_TIERS = Object.freeze([
  { name: 'Rusty Garage',         cost: 0,     tipBonus: 0.0,  light: 0.55, floor: 0x4a4540, wall: 0x3a3530, desc: 'One dim bay, peeling paint' },
  { name: 'Clean Shop',           cost: 800,   tipBonus: 0.25, light: 0.80, floor: 0x888888, wall: 0x555555, desc: 'Fresh epoxy floor, better lighting' },
  { name: 'Pro Detailing Studio', cost: 4000,  tipBonus: 0.60, light: 1.05, floor: 0xbbbbbb, wall: 0x777777, desc: 'LED lighting, dual bay setup' },
  { name: 'Luxury Detailing Center', cost: 18000, tipBonus: 1.20, light: 1.30, floor: 0x1a1a22, wall: 0x2a2a35, desc: 'Neon signs, premium clientele lounge' }
]);

/** @type {Array<{id: string, name: string, pay: number, bodyW: number, bodyH: number, bodyL: number, cabH: number, cabOff: number, wheels: number, targetTime: number, extra?: string}>} */
const CAR_TYPES = Object.freeze([
  { id: 'sedan',    name: 'Sedan',    pay: 60,  bodyW: 2.0, bodyH: 0.6, bodyL: 4.0, cabH: 0.55, cabOff: -0.1, wheels: 0.45, targetTime: 90 },
  { id: 'suv',      name: 'SUV',      pay: 95,  bodyW: 2.1, bodyH: 0.8, bodyL: 4.4, cabH: 0.70, cabOff: -0.2, wheels: 0.55, targetTime: 120 },
  { id: 'pickup',   name: 'Pickup',   pay: 120, bodyW: 2.2, bodyH: 0.8, bodyL: 5.0, cabH: 0.70, cabOff: -1.0, wheels: 0.60, targetTime: 130 },
  { id: 'sports',   name: 'Sports',   pay: 180, bodyW: 1.9, bodyH: 0.45, bodyL: 4.2, cabH: 0.40, cabOff: 0.0,  wheels: 0.48, targetTime: 75 },
  { id: 'supercar', name: 'Supercar', pay: 350, bodyW: 2.0, bodyH: 0.42, bodyL: 4.4, cabH: 0.38, cabOff: 0.0,  wheels: 0.50, targetTime: 100,
    extra: 'Low-profile, delicate paint — higher tip potential' },
  { id: 'classic',  name: 'Classic',  pay: 250, bodyW: 2.0, bodyH: 0.65, bodyL: 4.6, cabH: 0.60, cabOff: -0.2, wheels: 0.52, targetTime: 110,
    extra: 'Vintage curves, requires gentle handling' },
  { id: 'motorcycle', name: 'Motorcycle', pay: 45, bodyW: 0.8, bodyH: 0.5, bodyL: 2.2, cabH: 0.0, cabOff: 0.0, wheels: 0.35, targetTime: 50,
    extra: 'Smaller surface, quick turnaround' }
]);

/** @type {Array<number>} */
const CAR_COLORS = Object.freeze([0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xe67e22, 0xecf0f1, 0x2c3e50, 0xd35400, 0xff6b81, 0x00b894]);

// Freeze all nested arrays to prevent mutation
Object.values(TOOL_CATEGORIES).forEach(cat => {
  cat.tiers.forEach(Object.freeze);
});
SHOP_TIERS.forEach(Object.freeze);
CAR_TYPES.forEach(Object.freeze);
