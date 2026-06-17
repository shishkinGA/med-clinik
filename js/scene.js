// ============================================================
// 3D-сцена: единый Canvas за DOM. Костяная керамика + ртутные
// акценты, частицы (спираль/рассыпание/сетка/тоннель), bg-шейдер.
// Читает window.STORE каждый кадр.
// ============================================================
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const S = window.STORE;
const canvas = document.getElementById('gl');
const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 820;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (e) {
  console.warn('WebGL недоступен — сцена отключена', e);
}

if (renderer) init();

function init() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.15, 7.2);

  // --- окружение для отражений (HDRI-подобное, для премиальных бликов) ---
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.02).texture;

  // --- свет: тёплый ключ + холодный rim + два точечных для острых бликов на ртути ---
  scene.add(new THREE.AmbientLight(0xfff8ee, 0.35));
  const key = new THREE.DirectionalLight(0xfff1de, 2.1);
  key.position.set(4.5, 6, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xdfe8fb, 2.6);
  rim.position.set(-6, 2.5, -5);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xfff4e6, 0.6);
  fill.position.set(0, -4, 4);
  scene.add(fill);
  // компактные источники — дают чёткие движущиеся блики на полированном металле
  const spec1 = new THREE.PointLight(0xffffff, 26, 30, 2);
  spec1.position.set(2.6, 3.2, 4.2);
  scene.add(spec1);
  const spec2 = new THREE.PointLight(0xffe9cf, 18, 30, 2);
  spec2.position.set(-3.0, -1.5, 3.4);
  scene.add(spec2);

  // ============ ФОН: fullscreen-шейдер (noise-градиент + каустики) ============
  const BG_VERT = /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }
  `;
  const SNOISE = /* glsl */`
    vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m; m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
  `;
  const BG_FRAG = /* glsl */`
    precision highp float;
    varying vec2 vUv;
    uniform vec3 uColA; uniform vec3 uColB;
    uniform float uTime; uniform float uCaustic; uniform vec2 uRes;
    ` + SNOISE + `
    void main(){
      vec2 uv = vUv;
      vec2 p = uv * vec2(max(uRes.x / uRes.y, 0.5), 1.0);
      float t = uTime * 0.04;
      float n  = snoise(p * 1.25 + vec2(t, -t * 0.6)) * 0.5 + 0.5;
      float n2 = snoise(p * 2.1 - vec2(t * 1.5, t));
      float g = clamp(uv.y * 0.5 + n * 0.6, 0.0, 1.0);
      vec3 col = mix(uColB, uColA, g);
      float ca = pow(max(0.0, 1.0 - abs(n2)), 6.0);
      col += vec3(1.0, 0.975, 0.92) * ca * 0.10 * (0.35 + uCaustic);
      col += vec3(0.94, 0.88, 0.76) * (snoise(p * 0.65 + vec2(-t, t)) * 0.5 + 0.5) * 0.05;
      vec2 c = uv - 0.5;
      col = mix(col, vec3(0.99, 0.985, 0.972), dot(c, c) * 0.4);
      gl_FragColor = vec4(col, 1.0);
    }
  `;
  const bgMat = new THREE.ShaderMaterial({
    depthWrite: false, depthTest: false,
    uniforms: {
      uColA: { value: new THREE.Color('#F6F3ED') },
      uColB: { value: new THREE.Color('#EDE7DB') },
      uTime: { value: 0 }, uCaustic: { value: 0 },
      uRes: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
    },
    vertexShader: BG_VERT, fragmentShader: BG_FRAG
  });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
  bg.frustumCulled = false; bg.renderOrder = -1;
  scene.add(bg);

  // ============ ГЛАВНЫЙ ОБЪЕКТ: процедурная ДНК-спираль ============
  const TURNS = 2.3, RADIUS = 1.0, HEIGHT = 4.4;
  function helixPoint(t, phase, target) {
    const a = t * TURNS * Math.PI * 2 + phase;
    return (target || new THREE.Vector3()).set(Math.cos(a) * RADIUS, (t - 0.5) * HEIGHT, Math.sin(a) * RADIUS);
  }
  class Strand extends THREE.Curve {
    constructor(phase) { super(); this.phase = phase; }
    getPoint(t, target) { return helixPoint(t, this.phase, target); }
  }

  const ceramicBase = new THREE.Color('#E7DEC9');
  const chromeBase = new THREE.Color('#C6C2B9');
  // Матовый костяной фарфор: мягкое затухание формы + лёгкий лак + тёплый sheen
  const ceramic = new THREE.MeshPhysicalMaterial({
    color: ceramicBase.clone(), roughness: 0.58, metalness: 0.0,
    clearcoat: 0.7, clearcoatRoughness: 0.4,
    sheen: 1.0, sheenRoughness: 0.45, sheenColor: new THREE.Color('#F3E8D2'),
    envMapIntensity: 0.62, transparent: true
  });
  // Ртуть / жидкий металл — полированный, но среднего тона для контраста
  const chrome = new THREE.MeshPhysicalMaterial({
    color: chromeBase.clone(), roughness: 0.085, metalness: 1.0,
    clearcoat: 0.35, clearcoatRoughness: 0.1,
    envMapIntensity: 1.05, transparent: true
  });

  const group = new THREE.Group();
  scene.add(group);

  // бэкбоны — высокодетализированные фарфоровые ленты
  const seg = isMobile ? 180 : 320;
  const rad = isMobile ? 16 : 28;
  group.add(new THREE.Mesh(new THREE.TubeGeometry(new Strand(0), seg, 0.084, rad), ceramic));
  group.add(new THREE.Mesh(new THREE.TubeGeometry(new Strand(Math.PI), seg, 0.084, rad), ceramic));

  // перекладины: тонкие ртутные капсулы + мелкие ювелирные узлы
  const NB = 16;
  const beadGeo = new THREE.SphereGeometry(0.052, 24, 18);
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < NB; i++) {
    const t = (i + 0.5) / NB;
    const p1 = helixPoint(t, 0), p2 = helixPoint(t, Math.PI);
    const mid = p1.clone().add(p2).multiplyScalar(0.5);
    const dir = p2.clone().sub(p1);
    const len = dir.length();
    const r = 0.024;
    const cap = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.01, len - r * 2 - 0.12), 6, 16), chrome);
    cap.position.copy(mid);
    cap.quaternion.setFromUnitVectors(up, dir.normalize());
    group.add(cap);
    const n1 = new THREE.Mesh(beadGeo, chrome); n1.position.copy(p1); group.add(n1);
    const n2 = new THREE.Mesh(beadGeo, chrome); n2.position.copy(p2); group.add(n2);
  }

  // мягкая контактная тень под объектом
  const shCanvas = document.createElement('canvas');
  shCanvas.width = shCanvas.height = 256;
  const shCtx = shCanvas.getContext('2d');
  const grad = shCtx.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, 'rgba(40,34,24,0.55)');
  grad.addColorStop(1, 'rgba(40,34,24,0)');
  shCtx.fillStyle = grad; shCtx.fillRect(0, 0, 256, 256);
  const shadowMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shCanvas), transparent: true, depthWrite: false, opacity: 0.22 });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -HEIGHT / 2 - 0.7;
  group.add(shadow);

  // ============ ЧАСТИЦЫ: спираль / рассыпание / сетка / тоннель ============
  const COUNT = isMobile ? 620 : 900;
  const aHelix = new Float32Array(COUNT * 3);
  const aFree = new Float32Array(COUNT * 3);
  const aGrid = new Float32Array(COUNT * 3);
  const aTunnel = new Float32Array(COUNT * 3);
  const aRand = new Float32Array(COUNT);
  const aSize = new Float32Array(COUNT);
  const aShape = new Float32Array(COUNT);   // 0 круг · 1 ромб · 2 треугольник · 3 крест
  const aOrb = new Float32Array(COUNT * 3);   // сфера-орб (философия)
  const aBloom = new Float32Array(COUNT * 3); // радиальный бутон-спора (CTA)

  const NX = 14, NY = 9, NZ = 5, SP = 0.85;
  const TUBE_R = 0.07;            // нити плотнее — читается двойная спираль
  const c0 = new THREE.Vector3(), c1 = new THREE.Vector3();
  const tan = new THREE.Vector3(), nrm = new THREE.Vector3(), bin = new THREE.Vector3(), up0 = new THREE.Vector3();

  // ===== АНАТОМИЧЕСКОЕ СЕРДЦЕ как набор гладких КОНТУРНЫХ кривых (линейный рисунок) =====
  const V = (x, y) => new THREE.Vector3(x, y, 0);
  // силуэт (обход по часовой от апекса), сглажен Catmull-Rom, замкнут
  const heartSil = new THREE.CatmullRomCurve3([
    V(-0.05, -1.15),
    V(0.45, -0.6), V(0.70, 0.05), V(0.62, 0.5),      // правая доля
    V(0.42, 0.72), V(0.12, 0.5),                     // правое плечо + центральная ложбинка
    V(-0.2, 0.74), V(-0.55, 0.55),                   // левая доля
    V(-0.72, 0.0), V(-0.5, -0.55)                    // левый край к апексу
  ], true, 'catmullrom', 0.5);
  // борозда (передняя межжелудочковая)
  const heartGroove = new THREE.CatmullRomCurve3([
    V(0.08, 0.46), V(0.0, -0.05), V(-0.08, -0.62)
  ], false, 'catmullrom', 0.5);
  // два крупных сосуда из ложбинки вверх
  const aorta = new THREE.CatmullRomCurve3([V(0.12, 0.5), V(0.18, 0.95), V(0.30, 1.25)], false);
  const pulmo = new THREE.CatmullRomCurve3([V(0.0, 0.55), V(-0.05, 1.0), V(-0.18, 1.25)], false);
  const _hv = new THREE.Vector3();
  // ===== ОБЪЁМНОЕ 3D-СЕРДЦЕ: поверхность обложена гемами в один слой =====
  // неявная поверхность сердца (Taubin): доли при +z, апекс при -z, y — толщина
  const heartF = (x, y, z) => { const a = x * x + 2.25 * y * y + z * z - 1; return a * a * a - x * x * z * z * z - 0.1125 * y * y * z * z * z; };
  const heartT = new Float32Array(COUNT * 3);
  {
    const GA = Math.PI * (3 - Math.sqrt(5));   // золотой угол (равномерно по сфере)
    const tilt = -0.32, ct = Math.cos(tilt), st = Math.sin(tilt), HS = 1.15;
    for (let i = 0; i < COUNT; i++) {
      // направление i на сфере Фибоначчи
      const zz = 1 - 2 * (i + 0.5) / COUNT, rr = Math.sqrt(Math.max(0, 1 - zz * zz)), th = GA * i;
      let dx = Math.cos(th) * rr, dy = Math.sin(th) * rr, dz = zz;
      // луч из центра до поверхности сердца (внутри F<0, снаружи F>0)
      let lo = 0.05, hi = 2.2;
      if (heartF(dx * lo, dy * lo, dz * lo) <= 0) {
        for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (heartF(dx * m, dy * m, dz * m) < 0) lo = m; else hi = m; }
      }
      const s = (lo + hi) / 2;
      // сердце: doli вверх (z), апекс вниз; ставим вертикально (z->экранный верх), лёгкий наклон вперёд
      let hx = dx * s, hy = dz * s, hz = dy * s;   // x вправо, y(верх)=z-формулы, z(глубина)=y-формулы
      const ry = hy * ct - hz * st, rz = hy * st + hz * ct;   // наклон вперёд вокруг X
      const jx = (Math.random() - 0.5) * 0.02, jy = (Math.random() - 0.5) * 0.02, jz = (Math.random() - 0.5) * 0.02;
      heartT[i * 3]     = (hx + jx) * HS;
      heartT[i * 3 + 1] = (ry + jy) * HS - 0.05;
      heartT[i * 3 + 2] = (rz + jz) * HS;
    }
  }

  // ===== СВЕТЯЩЕЕСЯ ДЕРЕВО (CTA): объёмная крона + 3D-ветви + корни =====
  const treeT = new Float32Array(COUNT * 3);
  {
    const CROWN_Y = 1.35, CROWN_R = 1.5;       // центр и радиус кроны
    const GA = Math.PI * (3 - Math.sqrt(5));
    // 3D-ветви (уходят в глубину по z) + корни
    const limbs = [
      [-0.9, 1.2, 0.5], [0.9, 1.2, -0.5], [-0.5, 1.7, -0.7], [0.5, 1.7, 0.7],
      [0, 1.9, 0.9], [0, 1.6, -0.95], [-1.0, 0.9, -0.3], [1.0, 0.9, 0.3]
    ];
    const roots = [
      [-1.0, -2.0, 0.4], [1.0, -2.0, -0.4], [-0.4, -2.3, -0.6],
      [0.4, -2.3, 0.6], [0, -2.4, 0.8], [0, -2.1, -0.8]
    ];
    const branches = [];
    branches.push({ a: [0, -0.5, 0], b: [0, CROWN_Y - 0.2, 0], w: 0.06 }); // ствол
    for (const [x, y, z] of limbs) branches.push({ a: [0, 0.3, 0], b: [x, y, z], w: 0.04 });
    for (const [x, y, z] of roots) branches.push({ a: [0, -0.5, 0], b: [x, y, z], w: 0.04 });

    let totLen = 0; for (const b of branches) totLen += Math.hypot(b.b[0]-b.a[0], b.b[1]-b.a[1], b.b[2]-b.a[2]);
    const crownBudget = 0.66;                   // большинство гемов — крона (объём)
    const nCrown = Math.floor(COUNT * crownBudget);
    const nBranch = COUNT - nCrown;
    let idx = 0;
    // ветви/корни — частицы вдоль 3D-линий
    for (const b of branches) {
      const len = Math.hypot(b.b[0]-b.a[0], b.b[1]-b.a[1], b.b[2]-b.a[2]);
      const n = Math.max(1, Math.round(nBranch * len / totLen));
      for (let k = 0; k < n && idx < COUNT; k++) {
        const t = Math.random();
        const taper = b.w * (1 - t * 0.5);
        treeT[idx*3]   = b.a[0] + (b.b[0]-b.a[0])*t + (Math.random()-0.5)*taper*2;
        treeT[idx*3+1] = b.a[1] + (b.b[1]-b.a[1])*t + (Math.random()-0.5)*taper*2;
        treeT[idx*3+2] = b.a[2] + (b.b[2]-b.a[2])*t + (Math.random()-0.5)*taper*2;
        idx++;
      }
    }
    // КРОНА: один слой по поверхности шара (как с сердцем — Фибоначчи-сфера), бугристая
    let ci = 0;
    while (idx < COUNT) {
      const zz = 1 - 2 * (ci + 0.5) / nCrown, rr = Math.sqrt(Math.max(0, 1 - zz*zz)), th = GA * ci;
      let dx = Math.cos(th) * rr, dy = zz, dz = Math.sin(th) * rr;
      const lump = 1 + 0.16 * Math.sin(dx*5) * Math.cos(dz*5) + (Math.random()-0.5)*0.08; // лёгкая «крона»
      const R = CROWN_R * lump;
      treeT[idx*3]   = dx * R;
      treeT[idx*3+1] = CROWN_Y + dy * R * 0.92;
      treeT[idx*3+2] = dz * R;
      idx++; ci++;
    }
  }

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    // ---- aHelix: плотные нити (72%) + перекладины (20%) + лёгкий дрейф (8%) ----
    const roll = Math.random();
    if (roll < 0.72) {
      const ph = Math.random() < 0.5 ? 0 : Math.PI;
      const tt = Math.random();
      helixPoint(tt, ph, c0);
      helixPoint(tt + 0.004, ph, c1);
      tan.subVectors(c1, c0).normalize();
      up0.set(0, 1, 0); if (Math.abs(tan.y) > 0.92) up0.set(1, 0, 0);
      nrm.crossVectors(tan, up0).normalize();
      bin.crossVectors(tan, nrm).normalize();
      const ang = Math.random() * Math.PI * 2;
      const rr = TUBE_R * Math.sqrt(Math.random());
      const cx = Math.cos(ang) * rr, sx = Math.sin(ang) * rr;
      aHelix[i3]     = c0.x + nrm.x * cx + bin.x * sx;
      aHelix[i3 + 1] = c0.y + nrm.y * cx + bin.y * sx;
      aHelix[i3 + 2] = c0.z + nrm.z * cx + bin.z * sx;
    } else if (roll < 0.92) {
      const ri = (Math.random() * 16) | 0;
      const tt = (ri + 0.5) / 16;
      helixPoint(tt, 0, c0); helixPoint(tt, Math.PI, c1);
      const u = Math.random();
      aHelix[i3]     = c0.x + (c1.x - c0.x) * u + (Math.random() - 0.5) * 0.025;
      aHelix[i3 + 1] = c0.y + (c1.y - c0.y) * u + (Math.random() - 0.5) * 0.025;
      aHelix[i3 + 2] = c0.z + (c1.z - c0.z) * u + (Math.random() - 0.5) * 0.025;
    } else {
      // разрежённый дрейф вокруг оси — проницаемые края как в референсе
      const tt = Math.random();
      helixPoint(tt, Math.random() < 0.5 ? 0 : Math.PI, c0);
      const halo = 0.12 + Math.random() * Math.random() * 0.5;
      const ang = Math.random() * Math.PI * 2;
      aHelix[i3]     = c0.x + Math.cos(ang) * halo;
      aHelix[i3 + 1] = c0.y + (Math.random() - 0.5) * 0.5;
      aHelix[i3 + 2] = c0.z + Math.sin(ang) * halo;
    }
    // ---- aFree: элегантное вытянутое облако (не заполняет весь экран) ----
    const r = 1.7 + Math.random() * 2.9;
    const th = Math.random() * Math.PI * 2, phi = Math.acos(2 * Math.random() - 1);
    aFree[i3]     = Math.sin(phi) * Math.cos(th) * r;
    aFree[i3 + 1] = Math.cos(phi) * r * 1.08;
    aFree[i3 + 2] = Math.sin(phi) * Math.sin(th) * r * 0.8;
    // ---- сетка ----
    const cell = i % (NX * NY * NZ);
    const gx = cell % NX, gy = ((cell / NX) | 0) % NY, gz = (cell / (NX * NY)) | 0;
    aGrid[i3]     = (gx - (NX - 1) / 2) * SP + (Math.random() - 0.5) * 0.07;
    aGrid[i3 + 1] = (gy - (NY - 1) / 2) * SP + (Math.random() - 0.5) * 0.07;
    aGrid[i3 + 2] = (gz - (NZ - 1) / 2) * SP - 1.0 + (Math.random() - 0.5) * 0.07;
    // ---- тоннель ----
    const ta = Math.random() * Math.PI * 2;
    const tr = 2.1 + Math.random() * 1.4;
    aTunnel[i3]     = Math.cos(ta) * tr;
    aTunnel[i3 + 1] = Math.sin(ta) * tr * 0.85;
    aTunnel[i3 + 2] = Math.random() * 30.0;
    // ---- aOrb -> АНАТОМИЧЕСКОЕ СЕРДЦЕ: гемы равномерно по контурным линиям ----
    aOrb[i3] = heartT[i3]; aOrb[i3 + 1] = heartT[i3 + 1]; aOrb[i3 + 2] = heartT[i3 + 2];
    // ---- светящееся дерево (CTA): корни вниз, ветви вверх ----
    aBloom[i3] = treeT[i3]; aBloom[i3 + 1] = treeT[i3 + 1]; aBloom[i3 + 2] = treeT[i3 + 2];
    aRand[i] = Math.random();
    aSize[i] = 0.34 + Math.random() * Math.random() * 1.0;   // крошечные, редкие покрупнее
    // фигуры: большинство круги, немного ромбов/треугольников, крест — намёк
    const sr = Math.random();
    aShape[i] = sr < 0.6 ? 0 : sr < 0.76 ? 1 : sr < 0.9 ? 2 : 3;
  }
  // ============ КОНСТЕЛЛЯЦИЯ: 3D-КАРКАСНЫЕ МНОГОГРАННИКИ (instanced wireframe) ============
  // каждый элемент — настоящий объёмный каркас (октаэдр / тетраэдр / икосаэдр), вращается в 3D
  const GEOS = [
    new THREE.OctahedronGeometry(1, 0),
    new THREE.TetrahedronGeometry(1, 0),
    new THREE.IcosahedronGeometry(1, 0)
  ];
  const typeOf = new Int8Array(COUNT);
  const localIdx = new Int32Array(COUNT);
  const spinAxis = new Float32Array(COUNT * 3);
  const spinSpd = new Float32Array(COUNT);
  const gemScale = new Float32Array(COUNT);
  const counts = [0, 0, 0];
  for (let i = 0; i < COUNT; i++) {
    const r = Math.random();
    const tp = r < 0.42 ? 0 : r < 0.72 ? 1 : 2;
    typeOf[i] = tp; localIdx[i] = counts[tp]++;
    let ax = Math.random() * 2 - 1, ay = Math.random() * 2 - 1, az = Math.random() * 2 - 1;
    const L = Math.hypot(ax, ay, az) || 1;
    spinAxis[i * 3] = ax / L; spinAxis[i * 3 + 1] = ay / L; spinAxis[i * 3 + 2] = az / L;
    spinSpd[i] = (0.3 + Math.random() * 0.85) * (Math.random() < 0.5 ? -1 : 1);
    gemScale[i] = 0.03 + Math.random() * Math.random() * 0.055;   // мельче — по инструкции
  }
  const meshes = GEOS.map((g, tp) => {
    const mat = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0, depthWrite: false, color: 0xffffff });
    const m = new THREE.InstancedMesh(g, mat, counts[tp]);
    m.frustumCulled = false;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(m);
    return m;
  });

  // палитра инстансов: прежняя, но тёмный (коричнево-чёрный) заменён на светлый
  const colSoft = new THREE.Color('#E6DCC9');   // светлая замена бывшему тёмному
  const colInk = new THREE.Color('#403828');    // оставлен только для глубины акцентных блендов
  const colLite = new THREE.Color('#A7AEB8');
  const accCol0 = new THREE.Color(S.accent);
  const tmpCol = new THREE.Color();
  function colorFor(i) {
    const r = aRand[i];
    if (r < 0.46) return tmpCol.copy(colSoft);                      // было тёмное -> светлое
    if (r < 0.74) return tmpCol.copy(accCol0).lerp(colInk, 0.5);    // глубокий акцент
    if (r < 0.9)  return tmpCol.copy(accCol0).lerp(colInk, 0.15);   // акцент
    return tmpCol.copy(colLite);
  }
  function recolor() {
    accCol0.set(S.accent);
    for (let i = 0; i < COUNT; i++) meshes[typeOf[i]].setColorAt(localIdx[i], colorFor(i));
    meshes.forEach((m) => { if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  }
  recolor();
  function setParticleStyle() { recolor(); }   // Tweaks-стили теперь просто перекрашивают

  // ---- покадровое обновление инстансов ----
  const _p = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3();
  const _q = new THREE.Quaternion(), _ax = new THREE.Vector3(), _s = new THREE.Vector3(), _m = new THREE.Matrix4();
  const fmod = (a, n) => ((a % n) + n) % n;
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const getArr = (arr, i, o) => { const k = i * 3; return o.set(arr[k], arr[k + 1], arr[k + 2]); };
  const tunPos = (i, travel, o) => { const k = i * 3; return o.set(aTunnel[k], aTunnel[k + 1], 10 - fmod(aTunnel[k + 2] + travel * 30, 30)); };
  function formTarget(i, f, intro, travel, out) {
    if (f < 1.0) { getArr(aFree, i, _a); getArr(aHelix, i, _b); _a.lerp(_b, intro); getArr(aOrb, i, _b); out.copy(_a).lerp(_b, sstep(0, 1, f)); }
    else if (f < 2.0) { getArr(aOrb, i, _a); getArr(aGrid, i, _b); out.copy(_a).lerp(_b, sstep(1, 2, f)); }
    else if (f < 3.0) { getArr(aGrid, i, _a); getArr(aFree, i, _b); out.copy(_a).lerp(_b, sstep(2, 3, f)); }
    else if (f < 4.0) { getArr(aFree, i, _a); tunPos(i, travel, _b); out.copy(_a).lerp(_b, sstep(3, 4, f)); }
    else if (f < 5.0) { tunPos(i, travel, _a); getArr(aFree, i, _b); out.copy(_a).lerp(_b, sstep(4, 5, f)); }
    else { getArr(aFree, i, _a); getArr(aBloom, i, _b); out.copy(_a).lerp(_b, sstep(5, 6, f)); }
    return out;
  }
  function updateConstellation(f, intro, travel, rot, scl, offx, offy, time, reveal, pulse) {
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const pf = 1 + (pulse || 0);
    for (let i = 0; i < COUNT; i++) {
      formTarget(i, f, intro, travel, _p);
      if (pulse) _p.multiplyScalar(pf);   // кардио-пульсация (только у сердца)
      const x = _p.x * cr + _p.z * sr, z = -_p.x * sr + _p.z * cr;
      const r = aRand[i];
      _p.set(x * scl + offx + Math.sin(time * 0.6 + r * 12.56) * 0.06,
             _p.y * scl + offy + Math.cos(time * 0.5 + r * 9.42) * 0.05,
             z * scl);
      _ax.set(spinAxis[i * 3], spinAxis[i * 3 + 1], spinAxis[i * 3 + 2]);
      _q.setFromAxisAngle(_ax, time * spinSpd[i] + r * 6.28);
      const gs = gemScale[i] * (0.8 + 0.4 * scl);
      _s.set(gs, gs, gs);
      _m.compose(_p, _q, _s);
      meshes[typeOf[i]].setMatrixAt(localIdx[i], _m);
    }
    meshes.forEach((m) => { m.instanceMatrix.needsUpdate = true; m.material.opacity = reveal; });
  }

  // ============ раскладка / resize ============
  let ox = 0, baseScale = 1;
  function layout() {
    const mob = window.innerWidth < 820;
    ox = mob ? 0 : 2.15;
    baseScale = mob ? 0.62 : 1;
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    bgMat.uniforms.uRes.value.set(window.innerWidth, window.innerHeight);
  }
  layout();
  window.addEventListener('resize', layout);

  // мост для app.js (плавная смена цветов фона по секциям)
  window.SCENE = { bgA: bgMat.uniforms.uColA.value, bgB: bgMat.uniforms.uColB.value, group,
    setParticleStyle,
    renderForm(f, travel, offx) { var tw = Math.max(Math.max(0, 1 - Math.abs(f - 4) * 1.3), Math.max(0, 1 - Math.abs(f - 1) * 1.4)); updateConstellation(f, 1, travel || 0, 0.4 * (1 - tw), 0.94, offx == null ? 0 : offx, 0, 6, 1); meshes.forEach((m) => m.material.color.set(0xffffff)); renderer.render(scene, camera); },
    renderOnce(){ renderer.render(scene, camera); } };

  // ============ кадр ============
  const clock = new THREE.Clock();
  const sm = { form: 0, heroP: 0, travel: 0, reveal: 1, champ: 0, offx: 0, mx: 0, my: 0 };
  const accCol = new THREE.Color(S.accent);
  let accHex = S.accent;
  const damp = THREE.MathUtils.damp;
  let introV = S.reduced ? 1 : 0;
  const WHITE = new THREE.Color(0xffffff);
  const accColLive = new THREE.Color(S.accent);
  const _champCol = new THREE.Color();
  const DEEP = new THREE.Color('#7A6534');   // глубокий акцент — дерево читается на светлом фоне

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const motion = S.reduced ? 0 : S.motion;

    sm.form = damp(sm.form, S.form || 0, 2.2, dt);
    sm.heroP = damp(sm.heroP, S.heroP, 5, dt);
    sm.travel = damp(sm.travel, S.travel, 5, dt);
    sm.reveal = damp(sm.reveal, S.bgDensity == null ? 1 : S.bgDensity, 3.2, dt);
    sm.champ = damp(sm.champ, S.champ, 4, dt);
    sm.offx = damp(sm.offx, (S.offX == null ? 1 : S.offX) * ox, 3.5, dt);
    sm.mx = damp(sm.mx, S.mouse.x, 4, dt);
    sm.my = damp(sm.my, S.mouse.y, 4, dt);

    // камера: лёгкий наезд в герое + параллакс от курсора
    camera.position.z = 7.2 - sm.heroP * 1.0;
    camera.position.x = sm.mx * 0.28 * motion;
    camera.position.y = 0.15 - sm.my * 0.22 * motion;
    camera.lookAt(0, 0, 0);

    group.visible = false;  // порцелановый меш убран — рисуем констелляцией

    // акцент сменился — перекрасить инстансы
    if (accHex !== S.accent) { accHex = S.accent; accColLive.set(accHex); recolor(); }

    // сборка спирали из хаоса при загрузке (когда уходит прелоадер -> S.loaded)
    const introTarget = (S.reduced || S.loaded) ? 1 : 0;
    introV = damp(introV, introTarget, 2.4, dt);

    // трансформ констелляции: спокойный поворот + дыхание + снос вправо в герое
    const rot0 = (S.reduced ? 0.3 : Math.sin(t * 0.13) * 0.34) + sm.mx * 0.32 * motion;
    const tunw = Math.max(0, 1 - Math.abs(sm.form - 4) * 1.3);   // 1 в тоннеле
    const heart = Math.max(0, 1 - Math.abs(sm.form - 1) * 1.4);  // 1 на сердце
    const tree = Math.max(0, 1 - Math.abs(sm.form - 6) * 1.4);   // 1 на дереве (CTA)
    const flat = tunw;   // не крутим вокруг Y только в тоннеле
    // сердце и дерево вращаются (показываем объём кроны), тоннель — нет
    const spin3d = Math.max(heart, tree);
    const rot = (spin3d > 0.01 && !S.reduced) ? (rot0 * (1 - flat) + t * 0.28 * spin3d) : rot0 * (1 - flat);
    const sc = (0.94 + 0.24 * sm.heroP) * baseScale;
    const offy = (S.reduced ? 0 : Math.sin(t * 0.5) * 0.1) * (1 - flat);
    // кардио-ритм: мягкий «луб-даб», только у формации сердца (около form 1)
    const cyc = (t * 0.6) % 1.0;        // медленнее (~0.6 Гц)
    const beat = Math.exp(-Math.pow(cyc, 2) * 70) + 0.55 * Math.exp(-Math.pow(cyc - 0.15, 2) * 95);
    const pulse = S.reduced ? 0 : beat * 0.035 * heart;   // объёмная пульсация
    updateConstellation(sm.form, introV, sm.travel, rot, sc, sm.offx, offy, S.reduced ? 10 : t, sm.reveal, pulse);

    // в CTA гемы лишь слегка теплеют к акценту — палитра как в других блоках
    _champCol.copy(WHITE).lerp(accColLive, sm.champ * 0.4);
    meshes.forEach((m) => m.material.color.copy(_champCol));

    // фон: каустики оживают в секции «процесс» (формация ~4 = тоннель)
    bgMat.uniforms.uTime.value = S.reduced ? 10 : t;
    const caust = Math.max(0, 1 - Math.abs(sm.form - 4.0) * 1.4);
    bgMat.uniforms.uCaustic.value = damp(bgMat.uniforms.uCaustic.value, caust, 4, dt);

    renderer.render(scene, camera);
  });
}
