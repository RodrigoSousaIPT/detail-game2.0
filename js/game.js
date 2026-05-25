/* ========================================================================
   DETAIL KINGS — Core Game Engine
   ======================================================================== */

// ─── STATE ───────────────────────────────────────────────────────────────
const state = {
  money: 50,
  reputation: 0,
  tools: { wash:0, dry:0, polish:0, interior:0, wax:0, wheel:0, glass:0 },
  shopLevel: 0,
  activeToolCategory: 'wash',
  // runtime
  car: null,
  cleaning: false,
  nextCustomerIn: 0,
  carInBay: false,
  jobStartTime: 0,
  // combo
  combo: 0,
  comboTimer: 0,
  // satisfaction
  satisfaction: 5, // starts at 5 (max), decreases with time
  maxSatisfaction: 5,
};
window.debugState = state;

let currentJobPay = 0;
let lastCleanTime = 0;

// ─── THREE.JS SETUP ──────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a2230);
scene.fog = new THREE.Fog(0x1a2230, 18, 40);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(5, 3.5, 6);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 0.8, 0);
controls.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
controls.minDistance = 3;
controls.maxDistance = 14;
controls.maxPolarAngle = Math.PI * 0.48;
controls.update();

// ─── LIGHTS ──────────────────────────────────────────────────────────────
const ambient = new THREE.AmbientLight(0x88aacc, 0.35);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xfff4dd, 0.9);
keyLight.position.set(6, 10, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.left = -8;
keyLight.shadow.camera.right = 8;
keyLight.shadow.camera.top = 8;
keyLight.shadow.camera.bottom = -8;
scene.add(keyLight);

const overheadLights = [];
function createOverheadLight(x, z) {
  const light = new THREE.PointLight(0xffffcc, 0.0, 10, 2);
  light.position.set(x, 3.8, z);
  scene.add(light);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffcc })
  );
  bulb.position.copy(light.position);
  scene.add(bulb);
  const fixture = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.08, 12),
    new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 })
  );
  fixture.position.set(x, 3.95, z);
  scene.add(fixture);
  overheadLights.push({ light, bulb, fixture });
}

const flashlight = new THREE.SpotLight(0xffffff, 0.6, 12, Math.PI / 7, 0.5, 1.5);
flashlight.position.set(0, 4, 0);
scene.add(flashlight);
scene.add(flashlight.target);

// ─── GARAGE ENVIRONMENT ──────────────────────────────────────────────────
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0x4a4540, roughness: 0.85, metalness: 0.05 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const bayLines = new THREE.Mesh(
  new THREE.PlaneGeometry(3.5, 6),
  new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.15 })
);
bayLines.rotation.x = -Math.PI / 2;
bayLines.position.y = 0.01;
scene.add(bayLines);

const wallMat = new THREE.MeshStandardMaterial({ color: 0x3a3530, roughness: 0.9 });
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 6), wallMat);
backWall.position.set(0, 3, -8);
scene.add(backWall);
const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 6), wallMat);
leftWall.rotation.y = Math.PI / 2;
leftWall.position.set(-10, 3, 0);
scene.add(leftWall);
const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 6), wallMat);
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.set(10, 3, 0);
scene.add(rightWall);
const ceiling = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 1 })
);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = 4.2;
scene.add(ceiling);

// ─── DECORATIVE SHOP OBJECTS (managed for upgrades) ─────────────────────
const shopDecorations = {};

function buildShopDecorations(level) {
  // Remove old decorations
  Object.values(shopDecorations).forEach(group => {
    if (group) scene.remove(group);
  });

  const deco = {};
  const group = new THREE.Group();
  deco.group = group;

  if (level >= 0) {
    // Basic tool chest (always present)
    const chest = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.0, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xcc2222, metalness: 0.6, roughness: 0.35 })
    );
    chest.position.set(-4, 0.5, -5);
    chest.castShadow = true;
    group.add(chest);
  }

  if (level >= 1) {
    // Shelving unit
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5, roughness: 0.4 });
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 0.4), shelfMat);
    shelf.position.set(-4.5, 0.7, 3);
    group.add(shelf);
    // Items on shelf (colored bottles)
    const bottleMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff });
    for (let i = 0; i < 4; i++) {
      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, 0.2, 8),
        bottleMat
      );
      bottle.position.set(-4.5 + i * 0.35, 1.5, 3.1);
      group.add(bottle);
    }
  }

  if (level >= 2) {
    // Neon sign above bay
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 0.5),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff })
    );
    sign.position.set(0, 3.4, -7.8);
    group.add(sign);
    // Glow light
    const glow = new THREE.PointLight(0x00e5ff, 0.4, 4);
    glow.position.set(0, 3.4, -7.5);
    group.add(glow);
    // Cabinet
    const cabMat = new THREE.MeshStandardMaterial({ color: 0x556677, metalness: 0.3, roughness: 0.6 });
    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.5), cabMat);
    cabinet.position.set(4.5, 0.6, 3);
    group.add(cabinet);
  }

  if (level >= 3) {
    // Premium detailing station
    const stationMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, metalness: 0.8, roughness: 0.2 });
    const station = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 0.8), stationMat);
    station.position.set(4.5, 0.5, -4);
    group.add(station);
    // Monitor screen
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.4),
      new THREE.MeshBasicMaterial({ color: 0x00ff88 })
    );
    screen.position.set(4.5, 1.0, -4.41);
    group.add(screen);
    // Extra overhead neon
    const neon2 = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 0.2),
      new THREE.MeshBasicMaterial({ color: 0xff8a00 })
    );
    neon2.position.set(2.5, 3.0, -7.9);
    group.add(neon2);
    // Waiting area chair
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x333344 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), chairMat);
    seat.position.set(-5, 0.3, 4);
    group.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.08), chairMat);
    back.position.set(-5, 0.6, 4.25);
    group.add(back);
    // Potted plant
    const plantMat = new THREE.MeshStandardMaterial({ color: 0x2d8a4e });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.25, 8), plantMat);
    pot.position.set(-5, 0.15, -5);
    group.add(pot);
    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0x44bb66 })
    );
    leaves.position.set(-5, 0.5, -5);
    group.add(leaves);
  }

  scene.add(group);
  shopDecorations.group = group;
}

// ─── DIRT TEXTURE SYSTEM ─────────────────────────────────────────────────
function createDirtCanvas(paintColor, size) {
  size = size || 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const hex = '#' + paintColor.toString(16).padStart(6, '0');

  // Store original paint color components for dirt measurement
  c._paintHex = hex;
  c._paintR = (paintColor >> 16) & 0xff;
  c._paintG = (paintColor >> 8) & 0xff;
  c._paintB = paintColor & 0xff;

  // Base paint
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, size, size);

  // Subtle paint flake highlight
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, 'rgba(255,255,255,0.08)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0.05)');
  grad.addColorStop(1, 'rgba(255,255,255,0.04)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // DIRT LAYERS ──────────────────────────────────────────
  // Overall dust haze
  ctx.fillStyle = 'rgba(90,70,50,0.35)';
  ctx.fillRect(0, 0, size, size);

  // Mud splatters
  for (let i = 0; i < 25; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 8 + Math.random() * 30;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, 'rgba(60,40,25,0.85)');
    grd.addColorStop(0.6, 'rgba(70,50,30,0.5)');
    grd.addColorStop(1, 'rgba(70,50,30,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grease streaks
  ctx.strokeStyle = 'rgba(30,25,20,0.55)';
  ctx.lineWidth = 2 + Math.random() * 3;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * size, Math.random() * size);
    ctx.bezierCurveTo(
      Math.random() * size, Math.random() * size,
      Math.random() * size, Math.random() * size,
      Math.random() * size, Math.random() * size
    );
    ctx.stroke();
  }

  // Bird droppings
  for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const r = 6 + Math.random() * 10;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, 'rgba(230,230,210,0.95)');
    grd.addColorStop(0.7, 'rgba(200,200,180,0.6)');
    grd.addColorStop(1, 'rgba(200,200,180,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return c;
}

/**
 * measureDirt — Improved algorithm.
 * Compares each sampled pixel against the stored original paint color.
 * If the pixel differs significantly from the original paint, it's dirt.
 * This works on ALL paint colors, including dark ones.
 */
function measureDirt(canvas) {
  const ctx = canvas.getContext('2d');
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const pR = canvas._paintR, pG = canvas._paintG, pB = canvas._paintB;
  let dirty = 0, total = 0;
  const step = 4; // sample every 4 pixels for speed

  const threshold = 18; // perceptual difference threshold (lower = more sensitive to dirt)

  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      const idx = (y * canvas.width + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      // Euclidean distance in RGB space from original paint
      const dist = Math.sqrt(
        (r - pR) * (r - pR) +
        (g - pG) * (g - pG) +
        (b - pB) * (b - pB)
      );
      if (dist > threshold) dirty++;
      total++;
    }
  }
  return total === 0 ? 0 : dirty / total;
}

function cleanAt(canvas, u, v, radius) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const cx = u * size;
  const cy = (1 - v) * size;
  const r = radius * size;

  const pR = canvas._paintR, pG = canvas._paintG, pB = canvas._paintB;

  // Soft-edge clean with radial gradient
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  const paintCSS = 'rgb(' + pR + ',' + pG + ',' + pB + ')';
  grd.addColorStop(0, paintCSS);
  grd.addColorStop(0.6, paintCSS);
  grd.addColorStop(1, 'rgba(' + pR + ',' + pG + ',' + pB + ',0)');
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Subtle highlight streak for satisfaction feedback
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath();
  ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

// ─── CAR BUILDER ─────────────────────────────────────────────────────────
function buildCar(type, color) {
  const group = new THREE.Group();
  group.userData.panels = [];
  group.userData.type = type;
  group.userData.color = color;

  const paintHex = '#' + color.toString(16).padStart(6, '0');

  function makePanel(geom, pos, rot, panelName) {
    const dirtCanvas = createDirtCanvas(color, 256);
    dirtCanvas._paintHex = paintHex;
    const tex = new THREE.CanvasTexture(dirtCanvas);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.35, metalness: 0.55
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(pos);
    if (rot) mesh.rotation.set(rot.x || 0, rot.y || 0, rot.z || 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.isPanel = true;
    mesh.userData.dirtCanvas = dirtCanvas;
    mesh.userData.texture = tex;
    mesh.userData.dirtyFraction = 1.0;
    mesh.userData.panelName = panelName || 'Panel';
    group.add(mesh);
    group.userData.panels.push(mesh);
    return mesh;
  }

  // Check if this is a motorcycle
  if (type.id === 'motorcycle') {
    return buildMotorcycle(group, type, color, makePanel, paintHex);
  }

  const W = type.bodyW, H = type.bodyH, L = type.bodyL;
  const cabH = type.cabH, cabOff = type.cabOff;

  // Hood (front top)
  makePanel(
    new THREE.BoxGeometry(W * 0.95, 0.08, L * 0.35),
    new THREE.Vector3(0, H + 0.04, L * 0.25),
    null, 'Hood'
  );
  // Roof
  if (cabH > 0.1) {
    makePanel(
      new THREE.BoxGeometry(W * 0.85, 0.08, L * 0.30),
      new THREE.Vector3(0, H + cabH + 0.04, cabOff),
      null, 'Roof'
    );
  }
  // Trunk
  makePanel(
    new THREE.BoxGeometry(W * 0.95, 0.08, L * 0.25),
    new THREE.Vector3(0, H + 0.04, -L * 0.30),
    null, 'Trunk'
  );
  // Left side
  makePanel(
    new THREE.BoxGeometry(0.08, cabH > 0.1 ? H + cabH * 0.7 : H * 0.8, L * 0.95),
    new THREE.Vector3(-W / 2, (cabH > 0.1 ? H / 2 + cabH * 0.2 : H * 0.45), 0),
    null, 'Left Side'
  );
  // Right side
  makePanel(
    new THREE.BoxGeometry(0.08, cabH > 0.1 ? H + cabH * 0.7 : H * 0.8, L * 0.95),
    new THREE.Vector3(W / 2, (cabH > 0.1 ? H / 2 + cabH * 0.2 : H * 0.45), 0),
    null, 'Right Side'
  );
  // Front bumper
  makePanel(
    new THREE.BoxGeometry(W * 0.95, H * 0.7, 0.15),
    new THREE.Vector3(0, H * 0.45, L / 2),
    null, 'Bumper'
  );

  // Chassis
  const chassisMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, H * 0.9, L * 0.95), chassisMat);
  chassis.position.set(0, H * 0.45, 0);
  chassis.castShadow = true;
  group.add(chassis);

  // Glass
  if (cabH > 0.1) {
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x1a2a3a, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.6
    });
    const ws = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.82, cabH * 0.95), glassMat);
    ws.position.set(0, H + cabH * 0.4, cabOff + L * 0.15 + 0.02);
    ws.rotation.x = -0.25;
    group.add(ws);
    const rw = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.82, cabH * 0.9), glassMat);
    rw.position.set(0, H + cabH * 0.4, cabOff - L * 0.15 - 0.02);
    rw.rotation.x = 0.25;
    rw.rotation.y = Math.PI;
    group.add(rw);
  }

  // Wheels
  addWheels(group, W, type.wheels, L);

  // Headlights
  const hlMat = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffaa, emissiveIntensity: 0.4 });
  const hlGeom = new THREE.SphereGeometry(0.12, 10, 8);
  [-0.6, 0.6].forEach(x => {
    const hl = new THREE.Mesh(hlGeom, hlMat);
    hl.position.set(x, H * 0.7, L / 2 + 0.05);
    group.add(hl);
  });

  // Taillights
  const tlMat = new THREE.MeshStandardMaterial({ color: 0xaa1111, emissive: 0x660000, emissiveIntensity: 0.3 });
  [-0.6, 0.6].forEach(x => {
    const tl = new THREE.Mesh(hlGeom, tlMat);
    tl.position.set(x, H * 0.7, -L / 2 - 0.05);
    group.add(tl);
  });

  return group;
}

function buildMotorcycle(group, type, color, makePanel, paintHex) {
  const W = type.bodyW, H = type.bodyH, L = type.bodyL;

  // Fuel tank (main body)
  makePanel(
    new THREE.BoxGeometry(W * 0.6, H * 0.6, L * 0.3),
    new THREE.Vector3(0, H * 0.5, L * 0.1),
    null, 'Fuel Tank'
  );
  // Front fairing
  makePanel(
    new THREE.BoxGeometry(W * 0.5, H * 0.5, 0.1),
    new THREE.Vector3(0, H * 0.55, L / 2),
    null, 'Fairing'
  );
  // Rear cowl
  makePanel(
    new THREE.BoxGeometry(W * 0.5, H * 0.4, L * 0.2),
    new THREE.Vector3(0, H * 0.35, -L * 0.3),
    null, 'Rear Cowl'
  );
  // Left side panel
  makePanel(
    new THREE.BoxGeometry(0.05, H * 0.4, L * 0.5),
    new THREE.Vector3(-W / 2, H * 0.4, 0),
    null, 'Left Panel'
  );
  // Right side panel
  makePanel(
    new THREE.BoxGeometry(0.05, H * 0.4, L * 0.5),
    new THREE.Vector3(W / 2, H * 0.4, 0),
    null, 'Right Panel'
  );

  // Engine block (chrome/dark)
  const engMat = new THREE.MeshStandardMaterial({ color: 0x222233, metalness: 0.7, roughness: 0.4 });
  const engine = new THREE.Mesh(new THREE.BoxGeometry(W * 0.5, H * 0.3, L * 0.25), engMat);
  engine.position.set(0, H * 0.15, 0);
  group.add(engine);

  // Wheels (2)
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.3 });
  const wheelR = type.wheels;
  const wheelGeom = new THREE.CylinderGeometry(wheelR, wheelR, 0.15, 12);
  const rimGeom = new THREE.CylinderGeometry(wheelR * 0.5, wheelR * 0.5, 0.16, 8);

  const positions = [
    [0, wheelR, L * 0.3],
    [0, wheelR, -L * 0.3]
  ];
  positions.forEach(p => {
    const w = new THREE.Mesh(wheelGeom, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(p[0], p[1], p[2]);
    w.castShadow = true;
    group.add(w);
    const r = new THREE.Mesh(rimGeom, rimMat);
    r.rotation.z = Math.PI / 2;
    r.position.set(p[0], p[1], p[2]);
    group.add(r);
  });

  // Handlebars
  const barMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 });
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, W * 1.1, 6), barMat);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, H * 0.9, L * 0.35);
  group.add(bar);

  // Headlight
  const hlMat = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffaa, emissiveIntensity: 0.4 });
  const hl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), hlMat);
  hl.position.set(0, H * 0.65, L / 2 + 0.05);
  group.add(hl);

  return group;
}

function addWheels(group, bodyW, wheelR, bodyL) {
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.3 });
  const wheelGeom = new THREE.CylinderGeometry(wheelR, wheelR, 0.25, 18);
  const rimGeom = new THREE.CylinderGeometry(wheelR * 0.55, wheelR * 0.55, 0.26, 10);
  const positions = [
    [-bodyW / 2 - 0.05, wheelR, bodyL * 0.33],
    [bodyW / 2 + 0.05, wheelR, bodyL * 0.33],
    [-bodyW / 2 - 0.05, wheelR, -bodyL * 0.33],
    [bodyW / 2 + 0.05, wheelR, -bodyL * 0.33]
  ];
  positions.forEach(p => {
    const w = new THREE.Mesh(wheelGeom, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(p[0], p[1], p[2]);
    w.castShadow = true;
    group.add(w);
    const r = new THREE.Mesh(rimGeom, rimMat);
    r.rotation.z = Math.PI / 2;
    r.position.set(p[0], p[1], p[2]);
    group.add(r);
  });
}

// ─── PARTICLE SYSTEM ─────────────────────────────────────────────────────
const particlePool = [];
const PARTICLE_COUNT = 200; // increased from 120 for more effects
const particleGeom = new THREE.BufferGeometry();
const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
const particleSizes = new Float32Array(PARTICLE_COUNT);
const particleColors = new Float32Array(PARTICLE_COUNT * 3);
particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
particleGeom.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
particleGeom.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

const particleMat = new THREE.PointsMaterial({
  size: 0.08, vertexColors: true, transparent: true, opacity: 0.85,
  blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
});
const particles = new THREE.Points(particleGeom, particleMat);
scene.add(particles);

for (let i = 0; i < PARTICLE_COUNT; i++) {
  particlePool.push({
    life: 0, maxLife: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, active: false, color: [1, 1, 1]
  });
}

function getToolParticleColor() {
  switch (state.activeToolCategory) {
    case 'wash':   return [0.4, 0.75, 1.0]; // water blue
    case 'dry':    return [1.0, 1.0, 1.0];  // white air
    case 'polish': return [1.0, 0.85, 0.3]; // gold
    case 'interior': return [0.7, 0.5, 1.0]; // purple steam
    case 'wax':    return [0.3, 1.0, 0.7];  // green shine
    case 'wheel':  return [0.2, 0.3, 0.4];  // dark grey
    case 'glass':  return [0.7, 0.9, 1.0];  // light blue
    default:       return [0.8, 0.8, 0.8];
  }
}

function spawnParticles(pos) {
  const color = getToolParticleColor();
  let spawned = 0;
  for (let i = 0; i < PARTICLE_COUNT && spawned < 6; i++) {
    const p = particlePool[i];
    if (!p.active) {
      p.active = true;
      p.life = 0;
      p.maxLife = 0.5 + Math.random() * 0.4;
      p.x = pos.x;
      p.y = pos.y;
      p.z = pos.z;
      p.vx = (Math.random() - 0.5) * 1.5;
      p.vy = 0.3 + Math.random() * 1.0;
      p.vz = (Math.random() - 0.5) * 1.5;
      p.color = color;
      spawned++;
    }
  }
}

function updateParticles(dt) {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = particlePool[i];
    if (p.active) {
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        particleSizes[i] = 0;
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.vy -= 2.5 * dt;
        particlePositions[i * 3] = p.x;
        particlePositions[i * 3 + 1] = p.y;
        particlePositions[i * 3 + 2] = p.z;
        const fade = 1 - (p.life / p.maxLife);
        particleSizes[i] = 0.1 * fade;
        particleColors[i * 3] = p.color[0] * fade;
        particleColors[i * 3 + 1] = p.color[1] * fade;
        particleColors[i * 3 + 2] = p.color[2] * fade;
      }
    } else {
      particleSizes[i] = 0;
    }
  }
  particleGeom.attributes.position.needsUpdate = true;
  particleGeom.attributes.size.needsUpdate = true;
  particleGeom.attributes.color.needsUpdate = true;
}

function confettiBurst() {
  const colors = [
    [1, 0.3, 0.3], [0.3, 1, 0.3], [0.3, 0.5, 1],
    [1, 1, 0.3], [1, 0.3, 1], [0.3, 1, 1]
  ];
  let spawned = 0;
  for (let i = 0; i < PARTICLE_COUNT && spawned < 50; i++) {
    const p = particlePool[i];
    if (!p.active) {
      p.active = true;
      p.life = 0;
      p.maxLife = 1.5 + Math.random() * 1.0;
      p.x = (Math.random() - 0.5) * 2;
      p.y = 1.5 + Math.random() * 1;
      p.z = (Math.random() - 0.5) * 2;
      p.vx = (Math.random() - 0.5) * 5;
      p.vy = 2 + Math.random() * 4;
      p.vz = (Math.random() - 0.5) * 5;
      p.color = colors[Math.floor(Math.random() * colors.length)];
      spawned++;
    }
  }
}

// ─── INPUT / CLEANING ────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let mouseDown = false;

canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    mouseDown = true;
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    updateFlashlight();
    if (state.carInBay) tryClean();
  }
});
window.addEventListener('mouseup', (e) => {
  if (e.button === 0) mouseDown = false;
});
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  updateFlashlight();
  if (mouseDown && state.carInBay) tryClean();
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function updateFlashlight() {
  raycaster.setFromCamera(mouse, camera);
  flashlight.position.copy(camera.position);
  const dir = raycaster.ray.direction.clone().multiplyScalar(6);
  flashlight.target.position.copy(camera.position).add(dir);
  flashlight.target.updateMatrixWorld();
}

function tryClean() {
  if (!state.car) return;
  const now = performance.now();
  if (now - lastCleanTime < 25) return;
  lastCleanTime = now;

  raycaster.setFromCamera(mouse, camera);
  const panels = state.car.userData.panels;
  const hits = raycaster.intersectObjects(panels, false);
  if (hits.length === 0) return;

  const hit = hits[0];
  const panel = hit.object;
  if (!hit.uv) return;

  const toolData = getCurrentTool();
  const dirtCanvas = panel.userData.dirtCanvas;

  cleanAt(dirtCanvas, hit.uv.x, hit.uv.y, toolData.radius);
  panel.userData.texture.needsUpdate = true;

  // Particles at clean location
  spawnParticles(hit.point);

  // Increment combo
  state.combo++;
  state.comboTimer = 3.0;

  // Measure dirt
  panel.userData.dirtyFraction = measureDirt(dirtCanvas);

  updateProgress();
}

function getCurrentTool() {
  const cat = TOOL_CATEGORIES[state.activeToolCategory];
  return cat.tiers[state.tools[state.activeToolCategory]];
}

function updateProgress() {
  if (!state.car) return;
  const panels = state.car.userData.panels;
  let totalClean = 0;
  panels.forEach(p => {
    totalClean += (1 - p.userData.dirtyFraction);
  });
  const pct = Math.round((totalClean / panels.length) * 100);
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('progressText').textContent = pct + '% clean';
  document.getElementById('progressWrap').classList.add('show');

  updateMinimap();

  if (pct >= 100 && state.carInBay) {
    completeJob();
  }
}

// ─── DIRT MINIMAP ──────────────────────────────────────────────────────────
const PANEL_ICONS = {
  'Hood': '🛡️',
  'Roof': '🏠',
  'Trunk': '📦',
  'Left Side': '🚪',
  'Right Side': '🚪',
  'Bumper': '🛞',
  'Fuel Tank': '⛽',
  'Fairing': '➡️',
  'Rear Cowl': '⬆️',
  'Left Panel': '🔲',
  'Right Panel': '🔳'
};

function dirtColor(fraction) {
  // 0 = clean (green), 1 = dirty (red)
  const r = Math.min(1, fraction * 1.8);
  const g = Math.min(1, (1 - fraction) * 1.8);
  const b = 0.15;
  return 'rgb(' + Math.round(r * 255) + ',' + Math.round(g * 255) + ',' + Math.round(b * 255) + ')';
}

function dirtBarColor(fraction) {
  if (fraction < 0.05) return '#00ff88';
  if (fraction < 0.30) return '#88dd00';
  if (fraction < 0.55) return '#ddbb00';
  if (fraction < 0.80) return '#dd6600';
  return '#dd3333';
}

function updateMinimap() {
  if (!state.car) return;
  const panels = state.car.userData.panels;
  const wrap = document.getElementById('minimapWrap');

  // Build minimap car top-down view
  const carEl = document.getElementById('minimapCar');
  carEl.innerHTML = '';

  // Determine panel order for car top-down view
  // Cars: Roof -> Left Side / Right Side -> Hood -> Trunk -> Bumper
  // Motorcycles: Fuel Tank -> Fairing -> Rear Cowl -> Left Panel / Right Panel
  const isMotorcycle = state.car.userData.type.id === 'motorcycle';

  if (isMotorcycle) {
    // Motorcycle top-down
    const order = ['Fairing', 'Fuel Tank', 'Rear Cowl', 'Left Panel', 'Right Panel'];
    const rows = buildMinimapRows(panels, order, [[0,1,2],[3],[4]]);
    rows.forEach(r => carEl.appendChild(r));
  } else {
    // Car top-down: front-to-back layout
    const order = ['Bumper', 'Hood', 'Roof', 'Left Side', 'Right Side', 'Trunk'];
    const rows = buildMinimapRows(panels, order, [[0],[1],[2],[3,4],[5]]);
    rows.forEach(r => carEl.appendChild(r));
  }

  // Build region progress bars
  const barsEl = document.getElementById('minimapBars');
  barsEl.innerHTML = '';

  panels.forEach(p => {
    const name = p.userData.panelName || 'Panel';
    const df = p.userData.dirtyFraction;
    const pct = Math.round((1 - df) * 100);
    const icon = PANEL_ICONS[name] || '🔘';

    const row = document.createElement('div');
    row.className = 'minimap-bar-row';
    row.innerHTML =
      `<span class="bar-icon">${icon}</span>` +
      `<span class="bar-label">${name}</span>` +
      `<div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${dirtBarColor(df)}"></div></div>` +
      `<span class="bar-pct" style="color:${dirtBarColor(df)}">${pct}%</span>`;
    barsEl.appendChild(row);
  });
}

function buildMinimapRows(panels, order, rowDefs) {
  const rows = [];
  rowDefs.forEach(rowIndices => {
    const row = document.createElement('div');
    row.className = 'minimap-row';
    rowIndices.forEach(idx => {
      if (idx < order.length) {
        const name = order[idx];
        const panel = panels.find(p => p.userData.panelName === name);
        const df = panel ? panel.userData.dirtyFraction : 1;
        const cell = document.createElement('div');
        cell.className = 'minimap-cell';
        cell.style.background = dirtColor(df);
        cell.title = name + ': ' + Math.round((1 - df) * 100) + '% clean';
        // Abbreviated label
        const shortLabel = name === 'Left Side' ? 'L' :
                          name === 'Right Side' ? 'R' :
                          name === 'Left Panel' ? 'LP' :
                          name === 'Right Panel' ? 'RP' :
                          name.substring(0, 2);
        cell.innerHTML = `<span class="cell-label">${shortLabel}</span>`;
        row.appendChild(cell);
      }
    });
    rows.push(row);
  });
  return rows;
}



// ─── JOB / CUSTOMER FLOW ─────────────────────────────────────────────────
function spawnCustomer() {
  // Unlock cars based on reputation
  const maxUnlock = Math.min(CAR_TYPES.length, 1 + Math.floor(state.reputation / 4));
  const pool = CAR_TYPES.slice(0, 1 + maxUnlock);
  const type = pool[Math.floor(Math.random() * pool.length)];
  const color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];

  const car = buildCar(type, color);
  car.position.set(0, 0, -15);
  scene.add(car);
  state.car = car;
  state.carInBay = false;
  state.combo = 0;
  state.comboTimer = 0;
  state.satisfaction = state.maxSatisfaction;
  state.jobStartTime = performance.now();
  currentJobPay = computeJobPay(type, 0);

  document.getElementById('carType').textContent = type.name;
  document.getElementById('jobPay').textContent = '$' + currentJobPay;
  document.getElementById('nextTimer').textContent = '—';

  const start = performance.now();
  const duration = 1500;

  function animateIn() {
    const t = Math.min(1, (performance.now() - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    car.position.z = -15 + 15 * eased;
    if (t < 1) requestAnimationFrame(animateIn);
    else {
      state.carInBay = true;
      showBanner('🚗 New Customer!', type.name + ' — get to work!');
      updateSatisfactionUI();
      document.getElementById('minimapWrap').classList.add('show');
      updateMinimap();
    }
  }
  animateIn();
}

function computeJobPay(type, timePenalty) {
  let multSum = 0;
  for (const key of Object.keys(state.tools)) {
    multSum += TOOL_CATEGORIES[key].tiers[state.tools[key]].pay;
  }
  const avgMult = multSum / Object.keys(state.tools).length;
  const shop = SHOP_TIERS[state.shopLevel];
  const base = type.pay * avgMult * (1 + shop.tipBonus);
  const repBonus = 1 + state.reputation * 0.03;
  // Satisfaction multiplier (0.5 to 1.5 based on stars)
  const satMult = 0.5 + (state.satisfaction / state.maxSatisfaction);
  // Time bonus: faster = more pay
  const timeBonus = Math.max(0, 1 - timePenalty * 0.01);
  return Math.round(base * repBonus * satMult * timeBonus);
}

function completeJob() {
  if (!state.carInBay) return;
  state.carInBay = false;

  // Calculate time-based bonus
  const elapsed = (performance.now() - state.jobStartTime) / 1000;
  const type = state.car.userData.type;
  const targetTime = type.targetTime || 90;
  const timeRatio = Math.max(0, 1 - (elapsed - targetTime) / targetTime);
  const timePenalty = Math.max(0, Math.round((1 - timeRatio) * 10));

  // Combo bonus
  const comboBonus = Math.min(state.combo, 50) * 0.5;

  // Final pay with satisfaction, time, and combo bonuses
  const basePay = computeJobPay(type, timePenalty);
  const pay = basePay + Math.round(comboBonus);

  state.money += pay;
  state.reputation += 1;

  // Star rating based on satisfaction + combo
  const stars = Math.max(1, Math.round(
    (state.satisfaction / state.maxSatisfaction) * 3 +
    Math.min(1, state.combo / 30) * 2
  ));

  showFloatingMoney(pay);
  showBanner(
    '✅ Job Complete!',
    '+$' + pay + ' · ' + '⭐'.repeat(stars) + ' · Rep +1' +
    (comboBonus > 0 ? ' · Combo +$' + Math.round(comboBonus) : '')
  );

  updateHud();
  saveGame();

  // Drive out
  setTimeout(() => {
    if (!state.car) return;
    const car = state.car;
    const start = performance.now();
    const duration = 1400;

    function animateOut() {
      const t = Math.min(1, (performance.now() - start) / duration);
      const eased = t * t;
      car.position.z = 15 * eased;
      if (t < 1) requestAnimationFrame(animateOut);
      else {
        scene.remove(car);
        car.userData.panels.forEach(p => {
          p.userData.texture.dispose();
          p.material.dispose();
          p.geometry.dispose();
        });
        state.car = null;
        document.getElementById('progressWrap').classList.remove('show');
        document.getElementById('minimapWrap').classList.remove('show');
        document.getElementById('starsDisplay').textContent = '—';
        scheduleNextCustomer();
      }
    }
    animateOut();
  }, 1500);
}

function scheduleNextCustomer() {
  const baseDelay = [7, 5, 4, 3][state.shopLevel] || 3;
  state.nextCustomerIn = baseDelay;
  const start = performance.now();

  function tick() {
    if (state.car) return;
    const elapsed = (performance.now() - start) / 1000;
    state.nextCustomerIn = Math.max(0, baseDelay - elapsed);
    document.getElementById('nextTimer').textContent = state.nextCustomerIn.toFixed(1);
    if (state.nextCustomerIn <= 0) {
      spawnCustomer();
    } else {
      requestAnimationFrame(tick);
    }
  }
  tick();
}

// ─── SATISFACTION SYSTEM ─────────────────────────────────────────────────
function updateSatisfactionUI() {
  const el = document.getElementById('starsDisplay');
  if (!state.carInBay) {
    el.textContent = '—';
    return;
  }
  const filled = Math.round(state.satisfaction);
  const stars = '⭐'.repeat(filled) + '☆'.repeat(Math.max(0, state.maxSatisfaction - filled));
  el.textContent = stars || '☆☆☆☆☆';
}

// ─── UI ──────────────────────────────────────────────────────────────────
function showFloatingMoney(amount) {
  const el = document.createElement('div');
  el.className = 'floatMoney';
  el.textContent = '+$' + amount;
  el.style.left = (window.innerWidth / 2 - 40) + 'px';
  el.style.top = (window.innerHeight / 2 - 60) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1900);
}

function showBanner(title, sub) {
  const b = document.getElementById('banner');
  b.innerHTML = title + (sub ? '<small>' + sub + '</small>' : '');
  b.classList.add('show');
  setTimeout(() => b.classList.remove('show'), 2500);
}

function updateHud() {
  document.getElementById('moneyDisplay').textContent = '$' + state.money;
  document.getElementById('repDisplay').textContent = state.reputation;
  document.getElementById('shopDisplay').textContent = SHOP_TIERS[state.shopLevel].name;
  renderToolbar();
  renderUpgradePanel();
}

function renderToolbar() {
  const toolbar = document.getElementById('toolbar');
  toolbar.innerHTML = '';
  const cats = Object.keys(TOOL_CATEGORIES);
  cats.forEach((catKey, idx) => {
    const cat = TOOL_CATEGORIES[catKey];
    const tierIdx = state.tools[catKey];
    const tool = cat.tiers[tierIdx];
    const slot = document.createElement('div');
    slot.className = 'tool-slot' + (state.activeToolCategory === catKey ? ' active' : '');
    slot.innerHTML =
      `<div class="hotkey">${idx + 1}</div>` +
      `<div class="emoji">${tool.emoji}</div>` +
      `<div class="name">${tool.name}</div>` +
      `<div class="tier">${cat.label}</div>`;
    slot.onclick = () => { state.activeToolCategory = catKey; renderToolbar(); };
    toolbar.appendChild(slot);
  });
  // Shop button
  const shopBtn = document.createElement('div');
  shopBtn.className = 'tool-slot';
  shopBtn.style.background = 'rgba(255,138,0,0.12)';
  shopBtn.style.borderColor = '#ff8a0066';
  shopBtn.innerHTML =
    `<div class="hotkey">TAB</div>` +
    `<div class="emoji">⚙️</div>` +
    `<div class="name">Upgrades</div>` +
    `<div class="tier">Shop</div>`;
  shopBtn.onclick = toggleUpgradePanel;
  toolbar.appendChild(shopBtn);
}

function toggleUpgradePanel() {
  document.getElementById('upgradePanel').classList.toggle('open');
  renderUpgradePanel();
}

function renderUpgradePanel() {
  const list = document.getElementById('upgradeList');
  list.innerHTML = '';

  // Tool upgrades
  Object.keys(TOOL_CATEGORIES).forEach(catKey => {
    const cat = TOOL_CATEGORIES[catKey];
    const h = document.createElement('h3');
    h.textContent = cat.emoji + ' ' + cat.label;
    list.appendChild(h);

    cat.tiers.forEach((tier, idx) => {
      const currentTier = state.tools[catKey];
      const owned = currentTier >= idx;
      const isCurrent = currentTier === idx;
      const purchasable = currentTier === idx - 1;
      const canAfford = state.money >= tier.cost;

      const item = document.createElement('div');
      item.className = 'upgrade-item' + (owned ? ' owned' : '') + (isCurrent ? ' current' : '');
      const info = document.createElement('div');
      info.className = 'upgrade-info';
      info.innerHTML =
        `<div class="title">${tier.emoji} ${tier.name}</div>` +
        `<div class="desc">${tier.desc} · Pay ×${tier.pay} · Radius ${tier.radius.toFixed(3)}</div>`;
      item.appendChild(info);

      const btn = document.createElement('button');
      btn.className = 'upgrade-btn';
      if (owned) {
        btn.classList.add('owned-btn');
        btn.textContent = isCurrent ? '✓ EQUIPPED' : '✓ OWNED';
        btn.disabled = true;
      } else if (purchasable) {
        btn.textContent = '$' + tier.cost;
        btn.disabled = !canAfford;
        btn.onclick = () => buyTool(catKey, idx);
      } else {
        btn.textContent = '🔒 $' + tier.cost;
        btn.disabled = true;
      }
      item.appendChild(btn);
      list.appendChild(item);
    });
  });

  // Shop upgrades
  const sh = document.createElement('h3');
  sh.textContent = '🏪 Shop Upgrades';
  list.appendChild(sh);

  SHOP_TIERS.forEach((shop, idx) => {
    const currentLevel = state.shopLevel;
    const owned = currentLevel >= idx;
    const isCurrent = currentLevel === idx;
    const purchasable = currentLevel === idx - 1;
    const canAfford = state.money >= shop.cost;

    const item = document.createElement('div');
    item.className = 'upgrade-item' + (owned ? ' owned' : '') + (isCurrent ? ' current' : '');
    const info = document.createElement('div');
    info.className = 'upgrade-info';
    info.innerHTML =
      `<div class="title">${shop.name}</div>` +
      `<div class="desc">${shop.desc} · Tips +${Math.round(shop.tipBonus * 100)}% · Faster customers</div>`;
    item.appendChild(info);

    const btn = document.createElement('button');
    btn.className = 'upgrade-btn';
    if (owned) {
      btn.classList.add('owned-btn');
      btn.textContent = isCurrent ? '✓ CURRENT' : '✓ OWNED';
      btn.disabled = true;
    } else if (purchasable) {
      btn.textContent = '$' + shop.cost;
      btn.disabled = !canAfford;
      btn.onclick = () => buyShop(idx);
    } else {
      btn.textContent = '🔒 $' + shop.cost;
      btn.disabled = true;
    }
    item.appendChild(btn);
    list.appendChild(item);
  });
}

function buyTool(catKey, idx) {
  const tier = TOOL_CATEGORIES[catKey].tiers[idx];
  if (state.money < tier.cost || state.tools[catKey] >= idx) return;
  state.money -= tier.cost;
  state.tools[catKey] = idx;
  showBanner('🎉 New Tool!', tier.name + ' equipped');
  screenShake();
  updateHud();
  saveGame();
}

function buyShop(idx) {
  const shop = SHOP_TIERS[idx];
  if (state.money < shop.cost || state.shopLevel >= idx) return;
  state.money -= shop.cost;
  state.shopLevel = idx;
  applyShopVisuals();
  buildShopDecorations(idx);
  showBanner('🏪 Shop Upgraded!', shop.name);
  screenShake();
  confettiBurst();
  updateHud();
  saveGame();
}

function screenShake() {
  const orig = camera.position.clone();
  let i = 0;
  const shake = setInterval(() => {
    camera.position.x = orig.x + (Math.random() - 0.5) * 0.15;
    camera.position.y = orig.y + (Math.random() - 0.5) * 0.15;
    i++;
    if (i > 10) {
      clearInterval(shake);
      camera.position.copy(orig);
    }
  }, 30);
}

// ─── SHOP VISUALS ────────────────────────────────────────────────────────
function applyShopVisuals() {
  const shop = SHOP_TIERS[state.shopLevel];
  floor.material.color.setHex(shop.floor);
  backWall.material.color.setHex(shop.wall);
  leftWall.material.color.setHex(shop.wall);
  rightWall.material.color.setHex(shop.wall);

  const needed = [1, 2, 3, 5][state.shopLevel];
  while (overheadLights.length < needed) {
    const i = overheadLights.length;
    const positions = [[0, 0], [-3, 0], [3, 0], [-3, -3], [3, -3]];
    const p = positions[i] || [0, 0];
    createOverheadLight(p[0], p[1]);
  }
  overheadLights.forEach((ol, i) => {
    const on = i < needed;
    ol.light.intensity = on ? 0.6 * shop.light : 0;
    ol.bulb.material.color.setHex(on ? 0xffffcc : 0x222222);
  });
  keyLight.intensity = shop.light;
  ambient.intensity = 0.25 + shop.light * 0.15;
}

// ─── KEYBOARD ────────────────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  const cats = Object.keys(TOOL_CATEGORIES);
  const num = parseInt(e.key);
  if (num >= 1 && num <= cats.length) {
    state.activeToolCategory = cats[num - 1];
    renderToolbar();
    e.preventDefault();
  } else if (e.key === 'Tab') {
    e.preventDefault();
    toggleUpgradePanel();
  } else if (e.key === 'Escape') {
    document.getElementById('upgradePanel').classList.remove('open');
  } else if (e.key === 'r' || e.key === 'R') {
    camera.position.set(5, 3.5, 6);
    controls.target.set(0, 0.8, 0);
    controls.update();
  }
});

document.getElementById('closePanel').onclick = () => {
  document.getElementById('upgradePanel').classList.remove('open');
};

// ─── SAVE / LOAD ─────────────────────────────────────────────────────────
function saveGame() {
  const data = {
    money: state.money,
    reputation: state.reputation,
    tools: state.tools,
    shopLevel: state.shopLevel,
    savedAt: Date.now()
  };
  try {
    localStorage.setItem('detailKingsSave', JSON.stringify(data));
  } catch (e) { /* ignore */ }
}

function loadGame() {
  try {
    const raw = localStorage.getItem('detailKingsSave');
    if (!raw) return false;
    const data = JSON.parse(raw);
    state.money = data.money ?? 50;
    state.reputation = data.reputation ?? 0;
    state.tools = Object.assign(state.tools, data.tools || {});
    state.shopLevel = data.shopLevel ?? 0;
    return true;
  } catch (e) { return false; }
}

function resetGame() {
  if (!confirm('Reset all progress? This cannot be undone.')) return;
  localStorage.removeItem('detailKingsSave');
  location.reload();
}

document.getElementById('saveBtn').onclick = () => {
  saveGame();
  showBanner('💾 Saved!', 'Progress stored');
};
document.getElementById('resetBtn').onclick = resetGame;
document.getElementById('resetLink').onclick = resetGame;

// Auto-save
setInterval(saveGame, 15000);

// ─── RESIZE ──────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── CROSSHAIR / RETICLE ────────────────────────────────────────────────
// Shows where the cleaning tool is aimed on the car
const reticleGeom = new THREE.RingGeometry(0.03, 0.045, 24);
const reticleMat = new THREE.MeshBasicMaterial({
  color: 0x00e5ff,
  transparent: true,
  opacity: 0.5,
  side: THREE.DoubleSide,
  depthTest: false
});
const reticle = new THREE.Mesh(reticleGeom, reticleMat);
reticle.visible = false;
scene.add(reticle);

// Dot in center
const dotGeom = new THREE.CircleGeometry(0.008, 12);
const dotMat = new THREE.MeshBasicMaterial({
  color: 0x00e5ff,
  transparent: true,
  opacity: 0.7,
  depthTest: false
});
const dot = new THREE.Mesh(dotGeom, dotMat);
dot.visible = false;
scene.add(dot);

function updateReticle() {
  if (!state.car || !state.carInBay) {
    reticle.visible = false;
    dot.visible = false;
    return;
  }
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(state.car.userData.panels, false);
  if (hits.length > 0) {
    const hit = hits[0];
    reticle.position.copy(hit.point);
    reticle.lookAt(camera.position);
    dot.position.copy(hit.point);
    dot.lookAt(camera.position);
    const toolData = getCurrentTool();
    // Scale ring to match tool radius in world space (~bodyW × radius)
    const worldRadius = toolData.radius * 2.0;
    const baseRingSize = 0.045; // RingGeometry's outer radius
    const s = worldRadius / baseRingSize;
    reticle.scale.set(s, s, s);
    reticle.visible = true;
    dot.visible = true;
  } else {
    reticle.visible = false;
    dot.visible = false;
  }
}

// ─── MAIN LOOP ───────────────────────────────────────────────────────────
let lastFrame = performance.now();

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;

  controls.update();
  updateParticles(dt);
  updateReticle();

  // Combo timer decay
  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) {
      state.combo = 0;
      document.getElementById('comboDisplay').textContent = '';
    } else {
      document.getElementById('comboDisplay').textContent =
        state.combo > 0 ? '🔥 ' + state.combo + 'x combo' : '';
    }
  }

  // Satisfaction decay while cleaning
  if (state.carInBay) {
    state.satisfaction = Math.max(1, state.satisfaction - dt * 0.03);
    updateSatisfactionUI();
  }

  // Subtle car idle
  if (state.car && state.carInBay) {
    state.car.position.y = Math.sin(now * 0.001) * 0.005;
  }

  renderer.render(scene, camera);
}

// ─── INIT ────────────────────────────────────────────────────────────────
loadGame();
applyShopVisuals();
buildShopDecorations(state.shopLevel);
updateHud();

document.getElementById('startBtn').onclick = () => {
  document.getElementById('intro').style.display = 'none';
  animate();
  state.nextCustomerIn = 1.5;
  setTimeout(() => spawnCustomer(), 1200);
};

console.log('🚗 Detail Kings loaded. Click Start to begin!');
