import { Application, Container, Graphics } from 'pixi.js';
import './style.css';
import { GameState } from '@/core/GameState';
import { Camera } from '@/core/Camera';
import { GameLoop } from '@/core/GameLoop';
import { TouchJoystick } from '@/core/TouchJoystick';
import { World } from '@/core/World';
import { PlayerSystem } from '@/systems/PlayerSystem';
import { EnemySystem } from '@/systems/EnemySystem';
import { CombatSystem } from '@/systems/CombatSystem';
import { ProjectileSystem } from '@/systems/ProjectileSystem';
import { UltimateSystem } from '@/systems/UltimateSystem';
import { SkillSystem } from '@/systems/SkillSystem';
import { TextureFactory } from '@/render/TextureFactory';
import { EntityRenderer } from '@/render/EntityRenderer';
import { VfxRenderer } from '@/render/VfxRenderer';
import { FloatingTextRenderer } from '@/render/FloatingText';
import type { SkillId } from '@/types/game';

const GAME_ROOT_ID = 'game-root';
const DEMO_LOADOUT: readonly SkillId[] = ['kunai', 'shuriken', 'katana', 'smoke', 'seals'];
const ARENA_HALF = 3400;

function createArena(): Container {
  const arena = new Container();
  const floor = new Graphics();
  floor.rect(-ARENA_HALF, -ARENA_HALF, ARENA_HALF * 2, ARENA_HALF * 2).fill({ color: 0x080811 });

  const grid = new Graphics();
  for (let x = -ARENA_HALF; x <= ARENA_HALF; x += 128) {
    grid.moveTo(x, -ARENA_HALF).lineTo(x, ARENA_HALF);
  }
  for (let y = -ARENA_HALF; y <= ARENA_HALF; y += 128) {
    grid.moveTo(-ARENA_HALF, y).lineTo(ARENA_HALF, y);
  }
  grid.stroke({ width: 1, color: 0x161d2e, alpha: 0.7 });

  arena.addChild(floor, grid);
  return arena;
}

function createDebugHud(): HTMLDivElement {
  const hud = document.createElement('div');
  hud.dataset.ui = 'hud';
  hud.style.cssText = [
    'position:fixed',
    'left:12px',
    'top:calc(12px + env(safe-area-inset-top, 0px))',
    'font:600 12px/1.5 ui-monospace, SFMono-Regular, monospace',
    'color:#cfe9ff',
    'background:rgba(7,7,13,0.55)',
    'border:1px solid rgba(53,230,255,0.25)',
    'border-radius:8px',
    'padding:6px 9px',
    'pointer-events:none',
    'white-space:pre',
    'z-index:30',
  ].join(';');
  document.body.appendChild(hud);
  return hud;
}

function createUltButton(onPress: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.ui = 'ult';
  button.style.cssText = [
    'position:fixed',
    'right:calc(18px + env(safe-area-inset-right, 0px))',
    'bottom:calc(24px + env(safe-area-inset-bottom, 0px))',
    'width:82px',
    'height:82px',
    'border-radius:9999px',
    'display:none',
    'place-items:center',
    'white-space:pre',
    'font:800 13px/1.25 ui-monospace, monospace',
    'letter-spacing:0.5px',
    'color:#ffe9ee',
    'background:radial-gradient(circle at 35% 30%, rgba(255,46,77,0.85), rgba(90,6,24,0.92))',
    'border:2px solid rgba(255,120,140,0.8)',
    'box-shadow:0 0 26px rgba(255,46,77,0.55)',
    'z-index:35',
    'touch-action:none',
    'transition:opacity 120ms ease, transform 120ms ease',
  ].join(';');
  button.addEventListener('click', onPress);
  document.body.appendChild(button);
  return button;
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

  const world = new World();
  const camera = new Camera();
  camera.snapTo(state.player);

  const playerSystem = new PlayerSystem(state, world);
  const combat = new CombatSystem(state, world, camera);
  const enemySystem = new EnemySystem(state, world, playerSystem, camera, () => ({
    width: app.screen.width,
    height: app.screen.height,
  }));
  const projectileSystem = new ProjectileSystem(state, world, combat, playerSystem);
  const skillSystem = new SkillSystem(state, world, combat);
  const ultimateSystem = new UltimateSystem(state, world, combat, camera, () => ({
    width: app.screen.width,
    height: app.screen.height,
  }));

  const textures = new TextureFactory(app.renderer);
  const entityRenderer = new EntityRenderer(world, textures);
  const vfxRenderer = new VfxRenderer(world, textures);
  const floatingText = new FloatingTextRenderer(world);

  const worldContainer = new Container();
  worldContainer.sortableChildren = true;
  worldContainer.addChild(
    createArena(),
    entityRenderer.container,
    vfxRenderer.container,
    floatingText.container,
  );
  app.stage.addChild(worldContainer);

  const joystick = new TouchJoystick(state.input);
  const hud = createDebugHud();
  const ultButton = createUltButton(() => ultimateSystem.tryActivate());

  state.on((event) => {
    if (event.type === 'playerDamaged') {
      camera.shake(7, 0.28);
    } else if (event.type === 'levelUp') {
      const candidates = state.skills.filter((skill) => skill.level < 10);
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      if (pick) skillSystem.levelUpSkill(pick.id);
      camera.shake(2, 0.15);
      world.spawnVfx({
        kind: 'ring',
        x: state.player.x,
        y: state.player.y,
        color: 0x35e6ff,
        life: 0.5,
        radius: 60,
        width: 3,
      });
    } else if (event.type === 'xpGained') {
    } else if (event.type === 'bossSpawned') {
      camera.shake(12, 0.6);
    } else if (event.type === 'runEnded') {
      joystick.setEnabled(false);
    }
  });

  let hudTimer = 0;
  const refreshHud = (): void => {
    const player = state.player;
    const minutes = Math.floor(state.timer.elapsed / 60);
    const seconds = Math.floor(state.timer.elapsed % 60);
    hud.textContent =
      `HP ${Math.ceil(player.hp)}/${player.maxHp}   LV ${player.level}\n` +
      `XP ${player.xp}/${player.nextLevelXp}   KILLS ${state.kills}\n` +
      `TIME ${minutes}:${String(seconds).padStart(2, '0')}   ULT ${Math.floor(player.ultCharge)}%`;

    ultButton.style.display = player.ultUnlocked ? 'grid' : 'none';
    if (player.ultUnlocked) {
      const ready = ultimateSystem.canActivate();
      ultButton.disabled = !ready;
      ultButton.style.opacity = ready ? '1' : '0.55';
      ultButton.textContent = ultimateSystem.isActive
        ? 'ОГИ!'
        : `УЛЬТ\n${Math.floor(player.ultCharge)}%`;
    }
  };
  refreshHud();

  const loop = new GameLoop({
    update: (dt) => {
      state.update(dt);
      combat.updateStatuses(dt);
      playerSystem.update(dt);
      enemySystem.update(dt);
      skillSystem.update(dt);
      ultimateSystem.update(dt);
      if (state.autoUlt && ultimateSystem.canActivate()) ultimateSystem.tryActivate();
      projectileSystem.update(dt);
      camera.follow(state.player, dt);
      camera.update(dt);

      hudTimer += dt;
      if (hudTimer >= 0.2) {
        hudTimer = 0;
        refreshHud();
      }
    },
    render: (_alpha, frameDt) => {
      const width = app.screen.width;
      const height = app.screen.height;
      const cam = camera.state;
      worldContainer.scale.set(cam.zoom);
      worldContainer.position.set(
        width / 2 - cam.x * cam.zoom + cam.shakeX,
        height / 2 - cam.y * cam.zoom + cam.shakeY,
      );
      entityRenderer.update(state, state.timer.elapsed);
      vfxRenderer.update(frameDt);
      floatingText.update(frameDt);
    },
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const target = event.target;
    if (target instanceof Element && target.closest('input, textarea, select')) return;
    if (event.code === 'KeyQ' || event.code === 'Space') {
      event.preventDefault();
      ultimateSystem.tryActivate();
    } else if (event.code === 'KeyU') {
      // Временный dev-хоткей: мгновенно открыть ульту 50 уровня.
      state.player.level = 50;
      state.player.ultUnlocked = true;
      state.player.ultCharge = 100;
    } else if (/^Digit[1-5]$/.test(event.code)) {
      // Временный dev-хоткей: прокачать слот 1..5.
      const index = Number(event.code.slice(5)) - 1;
      const skill = state.skills[index];
      if (skill) skillSystem.levelUpSkill(skill.id);
    }
  });

  joystick.setEnabled(true);
  loop.start();
}

void boot().catch((error: unknown) => {
  console.error('[ShadowKunai] boot failed', error);
});
