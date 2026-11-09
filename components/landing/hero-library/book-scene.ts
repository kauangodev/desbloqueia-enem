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
  Texture,
  Vector3,
  WebGLRenderer,
} from "three";
import { bookSequence, heroBooks, type HeroBook } from "../../../lib/hero-books";

/**
 * Biblioteca 3D da hero (capas reais do catálogo). Sem React: a física roda fora do framework.
 * Enquadramento por ESCALA-ALVO (altura projetada do livro da frente), não por "caber a fileira inteira":
 * a fileira continua além do quadro, como na referência.
 */
export type BookSceneOptions = {
  container: HTMLElement;
  /** Região em que o ponteiro influencia a cena (a hero). */
  pointerArea: HTMLElement;
  /** Quantidade de livros criados (o enquadramento mostra só os da frente). */
  count: number;
  maxPixelRatio: number;
  coarsePointer: boolean;
  /** Movimento reduzido: sem entrada elástica nem onda automática; reage só ao cursor do usuário, mais suave. */
  reduced?: boolean;
  /** Fração da altura do palco ocupada pelo livro da frente (padrão 0,56 desktop; maior no mobile). */
  targetFraction: number;
  /** Primeiro quadro significativo (livros em entrada): momento de trocar a composição estática. */
  onReady: () => void;
  onFail: (reason: string) => void;
  layout?: Partial<{ sep: number; angle: number; yaw: number; pitch: number; camX: number; back: number; fov: number; ty: number }>;
};

export type BookScene = {
  setPaused: (paused: boolean) => void;
  setVisible: (visible: boolean) => void;
  dispose: () => void;
  stats: () => { frames: number; running: boolean; paused: boolean; books: number; visibleBooks: number; pixelRatio: number; maxLift: number; waving: boolean; frontPx: number };
};

// Física (valores de referência ajustados à escala atual: livros grandes na tela)
const LIFT = 0.5;
const FORWARD = 0.3;
const STIFFNESS = 70;
const DAMPING = 12.5;
const MAX_DT = 1 / 30;
const SUBSTEPS = 4;
const IDLE_BEFORE_WAVE = 4000;
const WAVE_DURATION = 7000;
const WAVE_GAP = 5000;

const BOOK_W = 1;
const BOOK_H = 1.5; // proporção 2:3 das capas (640 × 960)
const BOOK_D = 0.2;

type Book = {
  mesh: Mesh;
  restX: number;
  restY: number;
  restZ: number;
  lift: number;
  liftV: number;
  enter: number;
  enterV: number;
  delay: number;
  started: boolean;
  sx: number;
  sy: number;
  inFrame: boolean;
};

async function loadImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  await image.decode();
  return image;
}

function coverTexture(image: HTMLImageElement, anisotropy: number): Texture {
  const texture = new Texture(image);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/** Lombada complementar discreta: verde da capa e o nome do material (dado do catálogo), sem texto inventado. */
function spineTexture(book: HeroBook): CanvasTexture {
  const w = 96;
  const h = 960;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "#063a2a");
  g.addColorStop(1, "#04271d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(190,242,100,0.9)";
  ctx.fillRect(0, 0, 8, h);
  ctx.save();
  ctx.translate(60, h - 56);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#f4fbe9";
  ctx.font = "800 44px Inter, 'Segoe UI', Roboto, Arial, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(book.title.toUpperCase(), 0, 0);
  ctx.restore();
  ctx.fillStyle = "rgba(190,242,100,0.95)";
  ctx.font = "800 26px Inter, 'Segoe UI', Roboto, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("GoDev", w / 2 + 6, 56);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
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
  const reduced = Boolean(opts.reduced);
  const liftMax = reduced ? LIFT * 0.7 : LIFT;
  const damping = reduced ? 17 : DAMPING;
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

  const lay = { sep: 0.55, angle: 0.45, yaw: -0.2, pitch: 0.26, camX: 0.1, back: 1.6, fov: 24, ty: 0.62, ...opts.layout };
  const scene = new Scene();
  const camera = new PerspectiveCamera(lay.fov, 1, 0.1, 80);
  // Luz que preserva o branco dos títulos e as cores das capas (sem brilho de plástico).
  scene.add(new AmbientLight(0xffffff, 1.3));
  scene.add(new HemisphereLight(0xffffff, 0xaec4b8, 0.35));
  const key = new DirectionalLight(0xffffff, 0.35);
  key.position.set(-3, 5, 8);
  scene.add(key);

  const disposables: { dispose: () => void }[] = [];
  const geometry = new BoxGeometry(BOOK_W, BOOK_H, BOOK_D);
  disposables.push(geometry);
  const anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());

  let disposed = false;
  let lost = false;
  const fail = (reason: string) => { if (!disposed) opts.onFail(reason); };
  const onContextLost = (event: Event) => { event.preventDefault(); lost = true; fail("context-lost"); };
  canvas.addEventListener("webglcontextlost", onContextLost, false);

  // Quatro conjuntos de materiais (um por disciplina), compartilhados por todas as repetições.
  const pages = pagesTexture();
  const pageMaterial = new MeshLambertMaterial({ map: pages });
  disposables.push(pages, pageMaterial);
  const sets = new Map<string, Material[]>();
  try {
    const images = await Promise.all(heroBooks.map((b) => loadImage(b.cover640)));
    if (disposed) return null;
    heroBooks.forEach((b, i) => {
      const cover = coverTexture(images[i], anisotropy);
      const spine = spineTexture(b);
      const back = new MeshLambertMaterial({ color: "#04271d" });
      const coverMat = new MeshLambertMaterial({ map: cover });
      const spineMat = new MeshLambertMaterial({ map: spine });
      disposables.push(cover, spine, back, coverMat, spineMat);
      // BoxGeometry: +x, -x, +y, -y, +z, -z → lombada (+x, voltada para a câmera), páginas ×3, capa (+z), verso
      sets.set(b.slug, [spineMat, pageMaterial, pageMaterial, pageMaterial, coverMat, back]);
    });
  } catch {
    disposables.forEach((d) => d.dispose());
    renderer.dispose();
    canvas.remove();
    fail("texture");
    return null;
  }
  if (disposed) return null;

  // Fileira: índice 0 = fundo; último = livro da frente (direita-embaixo). Recua para a esquerda-acima.
  const sequence = bookSequence(count).reverse(); // a frente (último índice) recebe Matemática
  const books: Book[] = [];
  const dirX = Math.cos(lay.angle) * lay.sep;
  const dirZ = Math.sin(lay.angle) * lay.sep;
  const frontIndex = count - 1;
  for (let i = 0; i < count; i++) {
    const def = sequence[i];
    const mesh = new Mesh(geometry, sets.get(def.slug)!);
    mesh.rotation.y = lay.yaw;
    const k = i - frontIndex; // 0 na frente, negativo para o fundo
    const restX = k * dirX;
    const restZ = k * dirZ;
    const restY = BOOK_H / 2;
    mesh.position.set(restX, reduced ? restY : restY - 4.4, restZ);
    mesh.visible = reduced;
    scene.add(mesh);
    books.push({ mesh, restX, restY, restZ, lift: 0, liftV: 0, enter: reduced ? 0 : -4.4, enterV: 0, delay: 0.1 + (i < count - 9 ? 0 : (i - (count - 9)) * 0.06), started: reduced, sx: 0, sy: 0, inFrame: false });
  }
  // livros muito ao fundo (fora do quadro) entram junto, sem atraso próprio
  for (let i = 0; i < count - 9; i++) books[i].delay = 0.05;

  const tmp = new Vector3();
  let width = 1;
  let height = 1;
  let frontPx = 0;
  let waveFrom = 0;
  let waveTo = 1;
  let sigma = 80;

  function frame() {
    // Distância pela escala-alvo: o livro da frente deve ter ~targetFraction da altura do palco.
    const half = Math.tan((lay.fov * Math.PI) / 360);
    const dist = (BOOK_H * 1) / (2 * half * opts.targetFraction);
    const front = books[frontIndex];
    // Ponto de interesse: um pouco atrás da frente, para que o livro da frente fique à direita-embaixo e a fileira recue para a esquerda.
    const target = new Vector3(front.restX + lay.back * dirX * -1, lay.ty, front.restZ + lay.back * dirZ * -1);
    const camDir = new Vector3(lay.camX, lay.pitch, 1).normalize();
    camera.position.copy(target).addScaledVector(camDir, dist);
    camera.lookAt(target);
    camera.aspect = width / height;
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();
    let n = 0;
    const visibleIdx: number[] = [];
    for (let i = 0; i < books.length; i++) {
      const b = books[i];
      tmp.set(b.restX, b.restY, b.restZ).project(camera);
      b.sx = (tmp.x * 0.5 + 0.5) * width;
      b.sy = (-tmp.y * 0.5 + 0.5) * height;
      b.inFrame = b.sx > -width * 0.05 && b.sx < width * 1.05 && b.sy > -height * 0.1 && b.sy < height * 1.1;
      if (b.inFrame) { n++; visibleIdx.push(i); }
    }
    waveFrom = visibleIdx.length ? visibleIdx[0] : 0;
    waveTo = visibleIdx.length ? visibleIdx[visibleIdx.length - 1] : books.length - 1;
    // altura projetada do livro da frente (verificação de escala)
    tmp.set(front.restX, 0, front.restZ).project(camera);
    const y0 = (-tmp.y * 0.5 + 0.5) * height;
    tmp.set(front.restX, BOOK_H, front.restZ).project(camera);
    const y1 = (-tmp.y * 0.5 + 0.5) * height;
    frontPx = Math.abs(y0 - y1);
    // área de influência do cursor/onda: ~1,2 espaçamento entre livros VISÍVEIS (recalibrada a cada enquadramento)
    const a = books[frontIndex];
    const bb = books[Math.max(0, frontIndex - 1)];
    sigma = Math.max(40, Math.hypot(a.sx - bb.sx, (a.sy - bb.sy) * 0.6) * 1.25);
    void n;
  }

  function resize() {
    const rect = container.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    frame();
    renderOnce();
  }

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
  let readyFired = false;
  let waking: number | undefined;

  function renderOnce() {
    if (!disposed && !lost) renderer.render(scene, camera);
  }

  const influenceAt = (book: Book, px: number, py: number) => gaussian(Math.hypot(book.sx - px, (book.sy - py) * 0.6), sigma);

  function step(dt: number, now: number) {
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
        const a = books[waveFrom];
        const b = books[waveTo];
        const s = -0.08 + e * 1.16; // percorre os livros visíveis (da esquerda/fundo até a frente)
        waveX = a.sx + (b.sx - a.sx) * s;
        waveY = a.sy + (b.sy - a.sy) * s;
        waveStrength = 1;
      }
    }
    const sub = dt / SUBSTEPS;
    for (const book of books) {
      const wantReal = pointerStrength * influenceAt(book, pointerX, pointerY);
      const wantWave = waveStrength * influenceAt(book, waveX, waveY);
      const targetLift = liftMax * Math.max(wantReal, wantWave * (1 - pointerStrength));
      if (!book.started && entranceStart >= 0 && (now - entranceStart) / 1000 >= book.delay) {
        book.started = true;
        book.mesh.visible = true;
      }
      for (let k = 0; k < SUBSTEPS; k++) {
        const accel = STIFFNESS * (targetLift - book.lift) - damping * book.liftV;
        book.liftV += accel * sub;
        book.lift += book.liftV * sub;
        if (book.started) {
          const ea = STIFFNESS * (0 - book.enter) - damping * book.enterV;
          book.enterV += ea * sub;
          book.enter += book.enterV * sub;
        }
      }
      book.mesh.position.set(book.restX, book.restY + book.enter + book.lift, book.restZ + book.lift * (FORWARD / LIFT));
      book.mesh.rotation.x = clamp(-book.liftV * 0.04, -0.2, 0.2);
    }
  }

  function settled() {
    if (waveStart >= 0 || pointerActive || pointerStrength > 0.001 || entranceStart < 0) return false;
    for (const b of books) {
      if (!b.started || Math.abs(b.lift) > 0.002 || Math.abs(b.liftV) > 0.01 || Math.abs(b.enter) > 0.002 || Math.abs(b.enterV) > 0.01) return false;
    }
    return true;
  }

  function scheduleWake(now: number) {
    if (waking !== undefined) window.clearTimeout(waking);
    waking = undefined;
    if (paused || disposed || !Number.isFinite(nextWaveAt)) return;
    const ms = Math.max(250, Math.max(nextWaveAt, lastMove + IDLE_BEFORE_WAVE) - now);
    waking = window.setTimeout(() => { waking = undefined; kick(); }, ms);
  }

  function loop(now: number) {
    raf = 0;
    if (disposed || lost || paused || !visible || !tabVisible) return;
    const dtRaw = last ? (now - last) / 1000 : 1 / 60;
    last = now;
    const dt = Math.min(dtRaw, MAX_DT);
    if (waveStart < 0 && entranceStart >= 0 && now >= nextWaveAt && now - lastMove >= IDLE_BEFORE_WAVE && !pointerActive) waveStart = now;
    step(dt, now);
    renderer.render(scene, camera);
    frames++;
    // Só troca a composição estática quando já há livros visíveis em movimento (primeiro quadro significativo)
    if (!readyFired && entranceStart >= 0 && now - entranceStart > 520) { readyFired = true; opts.onReady(); }
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

  const onMove = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    const rect = container.getBoundingClientRect();
    pointerX = event.clientX - rect.left;
    pointerY = event.clientY - rect.top;
    pointerActive = pointerX > -width * 0.1 && pointerX < width * 1.1 && pointerY > -height * 0.1 && pointerY < height * 1.1;
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
  entranceStart = performance.now() + 80;
  if (reduced) { nextWaveAt = Infinity; readyFired = true; opts.onReady(); }
  else if (opts.coarsePointer) nextWaveAt = performance.now() + 1800;
  kick();

  return {
    setPaused(next: boolean) {
      paused = next;
      if (paused) { if (raf) cancelAnimationFrame(raf); raf = 0; if (waking !== undefined) window.clearTimeout(waking); waking = undefined; }
      else { last = 0; nextWaveAt = reduced ? Infinity : performance.now() + 800; kick(); }
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
    stats: () => ({ frames, running: raf !== 0, paused, books: books.length, visibleBooks: books.filter((b) => b.inFrame).length, pixelRatio, maxLift: Math.max(...books.map((b) => b.lift)), waving: waveStart >= 0, frontPx: Math.round(frontPx) }),
  };
}
