import {
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  DirectionalLight,
  HemisphereLight,
  LinearMipmapLinearFilter,
  Material,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { COVER_H, COVER_W, disciplineStyle, interleaved, SPINE_W } from "../../../lib/covers";

/**
 * Biblioteca 3D da hero. Sem React: a física roda fora do framework (nada de setState por frame).
 * Geometria 3D real (livros), molas com subpassos e dt limitado, onda por proximidade (gaussiana) no espaço de tela.
 */
export type BookSceneOptions = {
  container: HTMLElement;
  /** Região em que o ponteiro influencia a cena (a hero). */
  pointerArea: HTMLElement;
  count: number;
  textureScale: number;
  maxPixelRatio: number;
  coarsePointer: boolean;
  /** Ajustes de composição (padrões abaixo; usados também em testes visuais). */
  layout?: Partial<{ angle: number; sep: number; pitch: number; camX: number; yaw: number }>;
  onReady: () => void;
  onFail: (reason: string) => void;
};

export type BookScene = {
  setPaused: (paused: boolean) => void;
  setVisible: (visible: boolean) => void;
  dispose: () => void;
  stats: () => { frames: number; running: boolean; paused: boolean; books: number; pixelRatio: number; maxLift: number; waving: boolean };
};

// Física (valores de referência ajustados à escala da cena)
const LIFT = 0.78;
const FORWARD = 0.35;
const STIFFNESS = 70;
const DAMPING = 12.5;
const MAX_DT = 1 / 30;
const SUBSTEPS = 4;
const IDLE_BEFORE_WAVE = 4000;
const WAVE_DURATION = 6500;
const WAVE_GAP = 5000;

const BOOK_W = 1;
const BOOK_H = 1.5;
const BOOK_D = 0.2;

type Book = {
  mesh: Mesh;
  restX: number;
  restY: number;
  restZ: number;
  lift: number;
  liftV: number;
  enter: number; // deslocamento vertical de entrada (negativo = abaixo)
  enterV: number;
  delay: number;
  started: boolean;
  sx: number; // centro projetado (px do canvas)
  sy: number;
};

async function textureFromUrl(url: string, w: number, h: number, anisotropy: number): Promise<CanvasTexture> {
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas2d");
  ctx.drawImage(image, 0, 0, w, h);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.minFilter = LinearMipmapLinearFilter;
  return texture;
}

function pagesTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#efe9da";
  ctx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 3) {
    ctx.fillStyle = y % 6 === 0 ? "rgba(120,104,72,0.18)" : "rgba(255,255,255,0.35)";
    ctx.fillRect(0, y, 128, 1);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

const gaussian = (d: number, sigma: number) => Math.exp(-(d * d) / (2 * sigma * sigma));
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export async function createBookScene(opts: BookSceneOptions): Promise<BookScene | null> {
  const { container, pointerArea, count } = opts;
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch {
    opts.onFail("webgl");
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  let pixelRatio = Math.min(window.devicePixelRatio || 1, opts.maxPixelRatio);
  renderer.setPixelRatio(pixelRatio);
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.className = "hl-canvas";
  container.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(24, 1, 0.1, 80);
  scene.add(new HemisphereLight(0xffffff, 0x8aa0b4, 1.55));
  scene.add(new AmbientLight(0xffffff, 0.55));
  const key = new DirectionalLight(0xffffff, 1.1);
  key.position.set(-3, 6, 9);
  scene.add(key);

  const disposables: { dispose: () => void }[] = [];
  const geometry = new BoxGeometry(BOOK_W, BOOK_H, BOOK_D);
  disposables.push(geometry);
  const anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const cw = Math.round(COVER_W * opts.textureScale);
  const ch = Math.round(COVER_H * opts.textureScale);
  const sw = Math.round(SPINE_W * opts.textureScale);

  let disposed = false;
  let lost = false;
  const fail = (reason: string) => {
    if (disposed) return;
    opts.onFail(reason);
  };
  const onContextLost = (event: Event) => { event.preventDefault(); lost = true; fail("context-lost"); };
  canvas.addEventListener("webglcontextlost", onContextLost, false);

  // Materiais: um conjunto por capa (compartilhado pelas duplicatas) + páginas compartilhadas.
  const pages = pagesTexture();
  disposables.push(pages);
  const pageMaterial = new MeshLambertMaterial({ map: pages });
  disposables.push(pageMaterial);
  const sets = new Map<string, Material[]>();
  const defs = interleaved.slice(0, Math.min(16, interleaved.length));
  try {
    for (const def of defs) {
      const [cover, spine] = await Promise.all([textureFromUrl(`/books/cover-${def.id}.svg`, cw, ch, anisotropy), textureFromUrl(`/books/spine-${def.id}.svg`, sw, ch, anisotropy)]);
      if (disposed) { cover.dispose(); spine.dispose(); return null; }
      const back = new MeshLambertMaterial({ color: disciplineStyle[def.discipline].spine });
      const coverMat = new MeshLambertMaterial({ map: cover });
      const spineMat = new MeshLambertMaterial({ map: spine });
      disposables.push(cover, spine, back, coverMat, spineMat);
      // BoxGeometry: +x, -x, +y, -y, +z, -z → lombada (+x, voltada para a câmera), páginas, páginas, páginas, capa (+z), verso
      sets.set(def.id, [spineMat, pageMaterial, pageMaterial, pageMaterial, coverMat, back]);
      await new Promise((r) => setTimeout(r, 0)); // não monopoliza a thread principal
    }
  } catch {
    disposables.forEach((d) => d.dispose());
    renderer.dispose();
    canvas.remove();
    fail("texture");
    return null;
  }
  if (disposed) return null;

  // Livros: fileira diagonal. O mais próximo (frente) fica à direita-embaixo; a fileira recua para a esquerda-acima,
  // de modo que cada livro de trás mostre a região esquerda da capa (onde está o título).
  const books: Book[] = [];
  const lay = { angle: 0.75, sep: count >= 28 ? 0.31 : count >= 20 ? 0.4 : 0.56, pitch: 0.55, camX: 0.12, yaw: -0.4, ...opts.layout };
  const sep = lay.sep;
  const angle = lay.angle;
  const dirX = Math.cos(angle) * sep;
  const dirZ = Math.sin(angle) * sep;
  for (let i = 0; i < count; i++) {
    const def = defs[i % defs.length];
    const mesh = new Mesh(geometry, sets.get(def.id)!);
    mesh.rotation.y = lay.yaw;
    const k = i - (count - 1) / 2;
    const restX = k * dirX;
    const restZ = k * dirZ;
    const restY = BOOK_H / 2;
    mesh.position.set(restX, restY - 3.2, restZ);
    mesh.visible = false;
    scene.add(mesh);
    books.push({ mesh, restX, restY, restZ, lift: 0, liftV: 0, enter: -3.2, enterV: 0, delay: 0.12 + i * 0.045, started: false, sx: 0, sy: 0 });
  }

  const tmp = new Vector3();
  let width = 1;
  let height = 1;
  const camDir = new Vector3(lay.camX, lay.pitch, 1).normalize();
  const target = new Vector3(0, 0.55, 0);

  function frame() {
    // distância da câmera para caber toda a fileira (com margem) no enquadramento atual
    let lo = 4;
    let hi = 60;
    for (let n = 0; n < 14; n++) {
      const mid = (lo + hi) / 2;
      camera.position.copy(target).addScaledVector(camDir, mid);
      camera.lookAt(target);
      camera.updateMatrixWorld(true);
      camera.updateProjectionMatrix();
      let worst = 0;
      for (const b of books) {
        for (const sx of [-0.55, 0.55]) {
          for (const sy of [0, 1.5 + LIFT]) {
            tmp.set(b.restX + sx, b.restY - BOOK_H / 2 + sy, b.restZ).project(camera);
            worst = Math.max(worst, Math.abs(tmp.x), Math.abs(tmp.y));
          }
        }
      }
      if (worst > 0.94) lo = mid; else hi = mid;
    }
    camera.position.copy(target).addScaledVector(camDir, hi);
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();
    for (const b of books) {
      tmp.set(b.restX, b.restY, b.restZ).project(camera);
      b.sx = (tmp.x * 0.5 + 0.5) * width;
      b.sy = (-tmp.y * 0.5 + 0.5) * height;
    }
  }

  function resize() {
    const rect = container.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    frame();
    renderOnce();
  }

  // Estado de interação (variáveis simples: sem estado do framework por frame)
  let pointerX = -1;
  let pointerY = -1;
  let pointerActive = false;
  let pointerStrength = 0;
  let lastMove = performance.now();
  let waveStart = -1;
  let nextWaveAt = performance.now() + IDLE_BEFORE_WAVE;
  let paused = false;
  let visible = true;
  let tabVisible = !document.hidden;
  let raf = 0;
  let last = 0;
  let frames = 0;
  let slowFrames = 0;
  let entranceStart = -1;
  let waking: number | undefined;

  function renderOnce() {
    if (!disposed && !lost) renderer.render(scene, camera);
  }

  function influenceAt(book: Book, px: number, py: number, sigma: number) {
    const dx = book.sx - px;
    const dy = (book.sy - py) * 0.6;
    return gaussian(Math.hypot(dx, dy), sigma);
  }

  function step(dt: number, now: number) {
    const sigma = width * (count > 20 ? 0.075 : 0.1);
    // ponteiro real (suavizado) ou onda automática
    const realTarget = pointerActive && pointerX >= 0 ? 1 : 0;
    pointerStrength += (realTarget - pointerStrength) * (1 - Math.exp(-dt * 9));
    let waveX = 0;
    let waveY = 0;
    let waveStrength = 0;
    if (waveStart >= 0) {
      const u = (now - waveStart) / WAVE_DURATION;
      if (u >= 1) { waveStart = -1; nextWaveAt = now + WAVE_GAP; }
      else {
        const e = easeInOut(clamp(u, 0, 1));
        const a = books[0];
        const b = books[books.length - 1];
        const s = -0.06 + e * 1.12;
        waveX = a.sx + (b.sx - a.sx) * s;
        waveY = a.sy + (b.sy - a.sy) * s;
        waveStrength = Math.sin(Math.PI * clamp(u, 0, 1)) > 0.02 ? 1 : 0;
      }
    }
    const sub = dt / SUBSTEPS;
    for (const book of books) {
      const wantReal = pointerStrength * influenceAt(book, pointerX, pointerY, sigma);
      const wantWave = waveStrength * influenceAt(book, waveX, waveY, sigma);
      const targetLift = LIFT * Math.max(wantReal, wantWave * (1 - pointerStrength));
      if (!book.started && (entranceStart >= 0) && (now - entranceStart) / 1000 >= book.delay) {
        book.started = true;
        book.mesh.visible = true;
      }
      for (let k = 0; k < SUBSTEPS; k++) {
        const accel = STIFFNESS * (targetLift - book.lift) - DAMPING * book.liftV;
        book.liftV += accel * sub;
        book.lift += book.liftV * sub;
        if (book.started) {
          const ea = STIFFNESS * (0 - book.enter) - DAMPING * book.enterV;
          book.enterV += ea * sub;
          book.enter += book.enterV * sub;
        }
      }
      book.mesh.position.set(book.restX, book.restY + book.enter + book.lift, book.restZ + book.lift * (FORWARD / LIFT));
      book.mesh.rotation.x = clamp(-book.liftV * 0.045, -0.22, 0.22);
    }
  }

  function settled() {
    if (waveStart >= 0 || pointerActive || pointerStrength > 0.001) return false;
    if (entranceStart < 0) return false;
    for (const b of books) {
      if (!b.started || Math.abs(b.lift) > 0.002 || Math.abs(b.liftV) > 0.01 || Math.abs(b.enter) > 0.002 || Math.abs(b.enterV) > 0.01) return false;
    }
    return true;
  }

  function scheduleWake(now: number) {
    if (waking !== undefined) window.clearTimeout(waking);
    waking = undefined;
    if (paused || disposed) return;
    const ms = Math.max(250, Math.max(nextWaveAt, lastMove + IDLE_BEFORE_WAVE) - now);
    waking = window.setTimeout(() => { waking = undefined; kick(); }, ms);
  }

  function loop(now: number) {
    raf = 0;
    if (disposed || lost || paused || !visible || !tabVisible) return;
    const dtRaw = last ? (now - last) / 1000 : 1 / 60;
    last = now;
    const dt = Math.min(dtRaw, MAX_DT);
    // auto-onda: sem movimento real do ponteiro por ~4 s (ou toque), depois da entrada
    if (waveStart < 0 && entranceStart >= 0 && now >= nextWaveAt && now - lastMove >= IDLE_BEFORE_WAVE && !pointerActive) waveStart = now;
    step(dt, now);
    renderer.render(scene, camera);
    frames++;
    // qualidade adaptativa: se os primeiros quadros forem lentos, reduz a resolução
    if (frames <= 90 && dtRaw > 0.034) slowFrames++;
    if (frames === 90 && slowFrames > 40 && pixelRatio > 1) { pixelRatio = 1; renderer.setPixelRatio(1); renderer.setSize(width, height, false); }
    if (settled()) { last = 0; scheduleWake(now); return; }
    raf = requestAnimationFrame(loop);
  }

  function kick() {
    if (disposed || lost || paused || !visible || !tabVisible || raf) return;
    last = 0;
    raf = requestAnimationFrame(loop);
  }

  // Listeners limitados à hero; removidos em dispose()
  const onMove = (event: PointerEvent) => {
    if (event.pointerType === "touch") return; // toque: sem captura; a onda automática cuida da cena
    const rect = container.getBoundingClientRect();
    pointerX = event.clientX - rect.left;
    pointerY = event.clientY - rect.top;
    pointerActive = pointerX > -width * 0.2 && pointerX < width * 1.2 && pointerY > -height * 0.2 && pointerY < height * 1.2;
    lastMove = performance.now();
    waveStart = -1;
    kick();
  };
  const onLeave = () => { pointerActive = false; kick(); };
  pointerArea.addEventListener("pointermove", onMove, { passive: true });
  pointerArea.addEventListener("pointerleave", onLeave, { passive: true });

  const onVisibility = () => { tabVisible = !document.hidden; if (tabVisible) kick(); };
  document.addEventListener("visibilitychange", onVisibility);
  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(container);

  resize();
  opts.onReady();
  entranceStart = performance.now() + 120;
  if (opts.coarsePointer) nextWaveAt = performance.now() + 1600; // no toque a onda começa logo após a entrada
  kick();

  return {
    setPaused(next: boolean) {
      paused = next;
      if (paused) { if (raf) cancelAnimationFrame(raf); raf = 0; if (waking !== undefined) window.clearTimeout(waking); waking = undefined; }
      else { last = 0; nextWaveAt = performance.now() + 800; kick(); }
    },
    setVisible(next: boolean) {
      visible = next;
      if (!visible) { if (raf) cancelAnimationFrame(raf); raf = 0; }
      else kick();
    },
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      if (waking !== undefined) window.clearTimeout(waking);
      pointerArea.removeEventListener("pointermove", onMove);
      pointerArea.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      resizeObserver.disconnect();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
    stats: () => ({ frames, running: raf !== 0, paused, books: books.length, pixelRatio, maxLift: Math.max(...books.map((b) => b.lift)), waving: waveStart >= 0 }),
  };
}

