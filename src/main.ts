import { Application, Container } from 'pixi.js';
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
import { ProceduralSprites } from '@/assets/ProceduralSprites';
import { ArenaRenderer } from '@/render/ArenaRenderer';
import { TrailRenderer } from '@/render/TrailRenderer';
import { JuiceController } from '@/render/JuiceController';
import { EntityRenderer } from '@/render/EntityRenderer';
import { VfxRenderer } from '@/render/VfxRenderer';
import { FloatingTextRenderer } from '@/render/FloatingText';
import { UIManager } from '@/ui/UIManager';
import { SoundEngine } from '@/audio/SoundEngine';
import type { SkillId } from '@/types/game';

const GAME_ROOT_ID = 'game-root';
const UI_ROOT_ID = 'ui-root';
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
  const juice = new JuiceController(camera);

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

  const textures = new ProceduralSprites();
  const arena = new ArenaRenderer(textures);
  const trailRenderer = new TrailRenderer(world);
  const entityRenderer = new EntityRenderer(world, textures);
  const vfxRenderer = new VfxRenderer(world, textures);
  const floatingText = new FloatingTextRenderer(world);

  const worldContainer = new Container();
  worldContainer.sortableChildren = true;
  worldContainer.addChild(
    arena.container,
    trailRenderer.container,
    entityRenderer.container,
    vfxRenderer.container,
    floatingText.container,
  );
  app.stage.addChild(worldContainer);

  const joystick = new TouchJoystick(state.input);
  const sound = new SoundEngine();
  const unlockAudio = (): void => sound.unlock();
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
  combat.onHit((info) => {
    sound.playHit(info.crit);
    juice.impact(info.crit ? 3.2 : 1.6, info.dirX, info.dirY, info.heavy ? 0.035 : 0);
  });

  // Tactile UI: crimson flash + short vibration + synthesized click on every button.
  document.addEventListener(
    'pointerdown',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const node = target.closest('button');
      if (!node) return;
      navigator.vibrate?.(12);
      sound.playUiClick();
      node.classList.add('ui-flash');
      window.setTimeout(() => node.classList.remove('ui-flash'), 60);
    },
    { passive: true },
  );

  let pendingLevels = 0;
  let levelUpOpen = false;
  let hudTimer = 0;

  const startRun = (loadout: SkillId[]): void => {
    world.reset();
    trailRenderer.clear();
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
    trailRenderer.clear();
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
        sound.playLevelUp();
        if (!levelUpOpen && state.phase === 'playing') openLevelUp();
        break;
      case 'playerDamaged':
        juice.impact(7, 0, 0, 0.03);
        sound.playHurt();
        break;
      case 'xpGained':
        sound.playXp();
        break;
      case 'bossSpawned':
        juice.impact(12, 0, 0, 0.05);
        sound.playBoss();
        break;
      case 'ultimateActivated':
        juice.hitStop(0.05);
        sound.playUltimate();
        break;
      case 'ultimateLanded':
        juice.hitStop(0.06);
        break;
      case 'synergyForged':
        juice.impact(9, 0, 0, 0.05);
        sound.playSynergy();
        break;
      case 'runEnded':
        joystick.setEnabled(false);
        ui.showGameOver(state.stats);
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
      trailRenderer.update(dt);
      camera.follow(state.player, dt);
      camera.update(dt);

      hudTimer += dt;
      if (hudTimer >= 0.2) {
        hudTimer = 0;
        ui.updateHud(state, ultimateSystem.canActivate(), ultimateSystem.isActive);
      }
    },
    render: (_alpha, frameDt) => {
      loop.timeScale = juice.tick(frameDt);
      const width = app.screen.width;
      const height = app.screen.height;
      const cam = camera.state;
      worldContainer.scale.set(cam.zoom);
      worldContainer.position.set(
        width / 2 - cam.x * cam.zoom + cam.shakeX,
        height / 2 - cam.y * cam.zoom + cam.shakeY,
      );
      arena.update(frameDt, camera, width, height, state.timer.elapsed);
      entityRenderer.update(state, state.timer.elapsed);
      vfxRenderer.update(frameDt);
      floatingText.update(frameDt);
    },
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (state.phase === 'playing') {
        state.phase = 'paused';
        joystick.setEnabled(false);
        loop.pause();
      }
    } else if (state.phase === 'paused') {
      state.phase = 'playing';
      joystick.setEnabled(true);
      loop.resume();
    }
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

  if (import.meta.env.DEV) {
    (window as unknown as { __shadow?: unknown }).__shadow = {
      state,
      world,
      playerSystem,
      skillSystem,
      progression,
      ultimateSystem,
      camera,
      sprites: textures,
    };
  }

  ui.showDraft();
  loop.start();
}

void boot().catch((error: unknown) => {
  console.error('[ShadowKunai] boot failed', error);
});
