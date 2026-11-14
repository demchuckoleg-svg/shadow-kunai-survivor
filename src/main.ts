import { Application, Container, Graphics } from 'pixi.js';
import './style.css';
import { GameState } from '@/core/GameState';
import { Camera } from '@/core/Camera';
import { GameLoop } from '@/core/GameLoop';
import { TouchJoystick } from '@/core/TouchJoystick';
import type { SkillId } from '@/types/game';

/**
 * Точка входа.
 * Шаг 2: ядро (пулы/сетка/состояние/цикл/камера/джойстик) + отладочная сцена.
 */

const GAME_ROOT_ID = 'game-root';
const DEMO_LOADOUT: readonly SkillId[] = ['kunai', 'shuriken', 'katana', 'smoke', 'seals'];
const ARENA_HALF = 2400;

function createArena(): Container {
  const arena = new Container();

  const floor = new Graphics();
  floor.rect(-ARENA_HALF, -ARENA_HALF, ARENA_HALF * 2, ARENA_HALF * 2).fill({ color: 0x0b0b16 });

  const grid = new Graphics();
  const step = 128;
  for (let x = -ARENA_HALF; x <= ARENA_HALF; x += step) {
    grid.moveTo(x, -ARENA_HALF).lineTo(x, ARENA_HALF);
  }
  for (let y = -ARENA_HALF; y <= ARENA_HALF; y += step) {
    grid.moveTo(-ARENA_HALF, y).lineTo(ARENA_HALF, y);
  }
  grid.stroke({ width: 1, color: 0x1d2336, alpha: 0.55 });

  const border = new Graphics();
  border.rect(-ARENA_HALF, -ARENA_HALF, ARENA_HALF * 2, ARENA_HALF * 2).stroke({
    width: 4,
    color: 0x35e6ff,
    alpha: 0.35,
  });

  arena.addChild(floor, grid, border);
  return arena;
}

function createNinja(): Container {
  const ninja = new Container();

  const shadow = new Graphics();
  shadow.ellipse(0, 10, 16, 7).fill({ color: 0x000000, alpha: 0.55 });

  const body = new Graphics();
  body.circle(0, 0, 14).fill({ color: 0x151527 });
  body.circle(0, 0, 14).stroke({ width: 2, color: 0x35e6ff, alpha: 0.9 });
  body.circle(0, -3, 4).fill({ color: 0xff2e4d });

  const blade = new Graphics();
  blade.moveTo(10, -2).lineTo(30, 0).lineTo(10, 3).closePath().fill({ color: 0xbfefff, alpha: 0.85 });

  ninja.addChild(shadow, body, blade);
  return ninja;
}

async function boot(): Promise<void> {
  const host = document.getElementById(GAME_ROOT_ID);
  if (!host) throw new Error(`#${GAME_ROOT_ID} not found`);

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

  const state = new GameState();
  state.startRun(DEMO_LOADOUT);

  const camera = new Camera();
  camera.snapTo(state.player);

  const world = new Container();
  world.sortableChildren = true;
  app.stage.addChild(world);

  const arena = createArena();
  const ninja = createNinja();
  world.addChild(arena, ninja);

  const joystick = new TouchJoystick(state.input);

  const loop = new GameLoop({
    update: (dt) => {
      state.update(dt);

      const player = state.player;
      if (state.isRunning && state.input.active) {
        player.vx = state.input.moveX * player.speed;
        player.vy = state.input.moveY * player.speed;
        player.x = Math.max(-ARENA_HALF, Math.min(ARENA_HALF, player.x + player.vx * dt));
        player.y = Math.max(-ARENA_HALF, Math.min(ARENA_HALF, player.y + player.vy * dt));
        const len = Math.hypot(player.vx, player.vy);
        if (len > 0.01) {
          player.facingX = player.vx / len;
          player.facingY = player.vy / len;
          ninja.rotation = Math.atan2(player.facingY, player.facingX);
        }
      }

      camera.follow(player, dt);
      camera.update(dt);
    },
    render: () => {
      const width = app.screen.width;
      const height = app.screen.height;
      const cam = camera.state;
      world.scale.set(cam.zoom);
      world.position.set(
        width / 2 - cam.x * cam.zoom + cam.shakeX,
        height / 2 - cam.y * cam.zoom + cam.shakeY,
      );
      ninja.position.set(state.player.x, state.player.y);
      ninja.alpha = state.player.invulnTimer > 0 ? 0.55 : 1;
    },
  });

  joystick.setEnabled(true);
  loop.start();

  // Отладка: тап по свободному месту не должен ломать джойстик на тач-устройствах.
  window.addEventListener('resize', () => camera.setZoom(1), { passive: true });
}

void boot().catch((error: unknown) => {
  console.error('[ShadowKunai] boot failed', error);
});
