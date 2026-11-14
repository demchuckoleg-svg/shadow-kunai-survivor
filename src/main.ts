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
import { ProgressionSystem } from '@/systems/ProgressionSystem';
import { TextureFactory } from '@/render/TextureFactory';
import { EntityRenderer } from '@/render/EntityRenderer';
import { VfxRenderer } from '@/render/VfxRenderer';
import { FloatingTextRenderer } from '@/render/FloatingText';
import { UIManager } from '@/ui/UIManager';
import type { SkillId } from '@/types/game';

const GAME_ROOT_ID = 'game-root';
const UI_ROOT_ID = 'ui-root';
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

async function boot(): Promise<void> {
  const host = document.getElementById(GAME_ROOT_ID);
  const uiRoot = document.getElementById(UI_ROOT_ID);
  if (!host || !uiRoot) throw new Error('Game roots not found');

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
  const progression = new ProgressionSystem(state, skillSystem);

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

  let pendingLevels = 0;
  let levelUpOpen = false;
  let hudTimer = 0;

  const startRun = (loadout: SkillId[]): void => {
    world.reset();
    camera.reset();
    enemySystem.reset();
    skillSystem.reset();
    state.startRun(loadout);
    camera.snapTo(state.player);
    pendingLevels = 0;
    levelUpOpen = false;
    hudTimer = 0;
    joystick.setEnabled(true);
    ui.setAutoUlt(false);
    ui.showHud();
    loop.resume();
  };

  const restartRun = (): void => {
    loop.resume();
    world.reset();
    state.phase = 'menu';
    joystick.setEnabled(false);
    ui.showDraft();
  };

  const finishLevelUp = (): void => {
    pendingLevels = 0;
    levelUpOpen = false;
    state.phase = 'playing';
    joystick.setEnabled(true);
    loop.resume();
  };

  const openLevelUp = (): void => {
    if (pendingLevels <= 0 || levelUpOpen) return;
    levelUpOpen = true;
    state.phase = 'levelup';
    loop.pause();
    joystick.setEnabled(false);
    const cards = progression.generateCards();
    if (cards.length === 0) {
      finishLevelUp();
      return;
    }
    ui.showLevelUp(state.player.level, cards, (card) => {
      progression.apply(card);
      pendingLevels -= 1;
      levelUpOpen = false;
      if (pendingLevels > 0) openLevelUp();
      else finishLevelUp();
    });
  };

  const ui = new UIManager(uiRoot, {
    onStart: startRun,
    onRestart: restartRun,
    onUltimate: () => ultimateSystem.tryActivate(),
    onAutoUlt: (enabled) => {
      state.autoUlt = enabled;
    },
  });

  state.on((event) => {
    switch (event.type) {
      case 'levelUp':
        pendingLevels += 1;
        if (!levelUpOpen && state.phase === 'playing') openLevelUp();
        break;
      case 'playerDamaged':
        camera.shake(7, 0.28);
        break;
      case 'bossSpawned':
        camera.shake(12, 0.6);
        break;
      case 'runEnded':
        joystick.setEnabled(false);
        ui.showGameOver(state.stats);
        break;
      case 'synergyForged':
        camera.shake(9, 0.45);
        break;
      default:
        break;
    }
  });

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
        ui.updateHud(state, ultimateSystem.canActivate(), ultimateSystem.isActive);
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
      // Временный dev-хоткей: прокачать слот 1..5 без карточки.
      const index = Number(event.code.slice(5)) - 1;
      const skill = state.skills[index];
      if (skill) skillSystem.levelUpSkill(skill.id);
    }
  });

  ui.showDraft();
  loop.start();
}

void boot().catch((error: unknown) => {
  console.error('[ShadowKunai] boot failed', error);
});
