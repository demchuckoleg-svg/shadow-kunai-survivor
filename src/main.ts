import { Application, Container, Graphics, Text } from 'pixi.js';
import './style.css';

/**
 * Точка входа. Шаг 1: инициализация PixiJS v8 и проверочный экран.
 * GameLoop, системы и UI подключаются на следующих шагах.
 */

const GAME_ROOT_ID = 'game-root';

/** Размеры сцены в CSS-пикселях (Pixi сам умножает на devicePixelRatio). */
function readStageSize(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

async function boot(): Promise<void> {
  const host = document.getElementById(GAME_ROOT_ID);
  if (!host) {
    throw new Error(`#${GAME_ROOT_ID} not found`);
  }

  const app = new Application();
  await app.init({
    background: 0x07070d,
    antialias: true,
    preference: 'webgl',
    resolution: Math.min(window.devicePixelRatio || 1, 3),
    autoDensity: true,
    resizeTo: window,
    powerPreference: 'high-performance',
  });

  app.canvas.setAttribute('aria-label', 'Shadow Kunai game canvas');
  host.appendChild(app.canvas);

  const scene = new Container();
  scene.sortableChildren = true;
  app.stage.addChild(scene);

  const backdrop = new Graphics();
  scene.addChild(backdrop);

  const moon = new Graphics();
  scene.addChild(moon);

  const title = new Text({
    text: 'SHADOW KUNAI',
    style: {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 44,
      fontWeight: '900',
      fill: 0xf4f4f8,
      letterSpacing: 6,
    },
  });
  title.anchor.set(0.5);
  scene.addChild(title);

  const subtitle = new Text({
    text: 'SURVIVOR · каркас готов',
    style: {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 14,
      fontWeight: '600',
      fill: 0x9aa0b4,
      letterSpacing: 4,
    },
  });
  subtitle.anchor.set(0.5);
  scene.addChild(subtitle);

  const layout = (): void => {
    const { width, height } = readStageSize();
    backdrop
      .clear()
      .rect(0, 0, width, height)
      .fill({ color: 0x07070d });
    moon
      .clear()
      .circle(width / 2, height * 0.34, Math.min(width, height) * 0.22)
      .fill({ color: 0x1a0b18 })
      .circle(width / 2, height * 0.34, Math.min(width, height) * 0.2)
      .fill({ color: 0xb3122f, alpha: 0.18 });
    title.position.set(width / 2, height * 0.62);
    subtitle.position.set(width / 2, height * 0.62 + 42);
  };

  layout();
  window.addEventListener('resize', layout, { passive: true });

  // Android: не даём браузеру выделять/масштабировать сцену.
  document.addEventListener('gesturestart', (event) => event.preventDefault());
  window.addEventListener('contextmenu', (event) => event.preventDefault());
}

void boot().catch((error: unknown) => {
  console.error('[ShadowKunai] boot failed', error);
});
