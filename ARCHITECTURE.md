# SHADOW KUNAI: SURVIVOR — Файловая архитектура и спецификация модулей

Каждый файл спроектирован так, чтобы его размер не превышал 150–250 строк, а зависимости шли строго сверху вниз (без циклических импортов, на которых ломаются лёгкие модели).

## 1. Строгая структура проекта

```
shadow-kunai/
├── .github/
│   └── workflows/
│       └── build-apk.yml          # Автосборка Android APK в облаке при git push
├── android/                       # Нативный проект Android (генерируется Capacitor)
├── index.html                     # Точка входа, meta viewport (user-scalable=no), safe-area
├── package.json                   # Зависимости (pixi.js v8, tailwindcss, @capacitor/android)
├── tsconfig.json                  # Строгий TypeScript (strict: true, noImplicitAny: true)
├── vite.config.ts                 # Конфигурация сборщика
├── capacitor.config.ts            # Настройки приложения (appId, ориентация portrait)
└── src/
    ├── main.ts                    # Инициализация Pixi Application, запуск GameLoop и UI
    ├── style.css                  # Tailwind + утилиты для safe-area-inset и отключения выделения
    │
    ├── types/
    │   ├── game.ts                # Публичный баррель (ре-экспорт всех типов)
    │   ├── core.ts               # Entity, PlayerState, InputState, константы пулов
    │   ├── skills.ts             # SkillId/Flags/Augment/SkillDefinition, синергии, ульта
    │   ├── entities.ts           # Враги, снаряды, орбиталы, зоны, VFX, текст урона
    │   └── run.ts                # RunPhase, UpgradeCard, RunStats, GameEvent
    │
    ├── core/
    │   ├── GameState.ts           # Центральное хранилище состояния забега (HP, XP, таймер, инвентарь)
    │   ├── GameLoop.ts            # Цикл fixedTimestep (60 Hz) + управление паузой
    │   ├── ObjectPool.ts          # Универсальный пул объектов без аллокаций в рантайме
    │   ├── SpatialGrid.ts         # Пространственная хеш-сетка (128x128 px) для быстрых коллизий
    │   ├── Camera.ts              # Слежение за игроком, зум при ульте и screen-shake
    │   └── TouchJoystick.ts       # Плавающий виртуальный стик с мёртвой зоной
    │
    ├── data/
    │   ├── skills.ts              # Конфиги 20 скиллов (базовые статы + аугментации 3 / 7 / 10 ур.)
    │   ├── synergies.ts           # Рецепты парных и тройных слияний + статы эволюций
    │   ├── enemies.ts             # Архетипы врагов (ассасин, самурай, стрелок, мини-босс) и волны
    │   └── ultimate.ts            # Тюнинг ульты 50 ур. (длительности фаз, бонус времени, зум)
    │
    ├── systems/
    │   ├── PlayerSystem.ts        # Движение ниндзя, i-frames (неуязвимость), сбор сфер опыта
    │   ├── EnemySystem.ts         # Спавнер волн за краем экрана, ИИ преследования и атаки
    │   ├── SkillSystem.ts         # Кулдауны авто-каста, применение эффектов аугментаций 3/7/10
    │   ├── ProjectileSystem.ts    # Баллистика: прямая, самонаводка, рикошеты, орбиталы, AoE-зоны
    │   ├── CombatSystem.ts        # Проверка попаданий через SpatialGrid, расчёт критов и статусов
    │   ├── UltimateSystem.ts      # State Machine ульты 50 ур. (механика Wanwan + Hayabusa)
    │   └── ProgressionSystem.ts   # Расчёт XP, генерация карточек апгрейда и проверка слияний
    │
    ├── render/
    │   ├── TextureFactory.ts      # Процедурная генерация текстур/графики Pixi (без внешних PNG)
    │   ├── EntityRenderer.ts      # Синхронизация пулов врагов/снарядов со спрайтами + hit-flash
    │   ├── VfxRenderer.ts         # Шлейфы (trails), линии разрезов ульты, частицы взрывов
    │   └── FloatingText.ts        # Пул вылетающих цифр урона (обычные белые, криты красно-золотые)
    │
    ├── audio/
    │   └── SoundEngine.ts         # Встроенный микро-синтезатор ZzFX (бросок, крит, XP, левел-ап, ульта)
    │
    └── ui/
        ├── UIManager.ts           # Переключение экранов (Меню -> Бой -> Левел-ап -> Game Over)
        ├── PreRunDraft.ts         # Экран выбора 5 стартовых скиллов из 20 перед забегом
        ├── HudOverlay.ts          # Полоска HP, шкала XP/уровня, таймер, кнопка ульты 50 ур.
        ├── LevelUpModal.ts        # Модалка выбора 1 из 3 карточек (статы / аугментации / слияния)
        └── GameOverModal.ts       # Экран статистики: время жизни, убийства, DPS каждого скилла
```

## 2. Детальный план реализации каждой части

> Типы намеренно разбиты на 4 файла (каждый < 250 строк), а `src/types/game.ts` остаётся единственной точкой импорта: `import type { ... } from '@/types/game'`. Циклов нет: `game.ts` только ре-экспортирует, `entities.ts` зависит от `core.ts`, `run.ts` — от `skills.ts`.

### Слой 1: Контракты данных (`src/types/game.ts`)

- **Задача:** Описать все структуры данных до написания логики.
- **Что внутри:**
  - `Entity` (базовый интерфейс для пула: id, active, x, y, vx, vy, radius).
  - `PlayerState` (hp, maxHp, speed, level до 50, xp, nextLevelXp, pickupRadius, critChance, critMult, ultCharge 0–100, ultUnlocked).
  - `SkillId` (union-тип из 20 строковых ID) и `SkillInstance` (id, level 1–10, cooldownTimer, augmentsUnlocked: { lv3?: string; lv7?: string; lv10?: string }, isEvolved: boolean, totalDamageDealt: number).
  - `SkillDefinition` (базовый урон, КД, количество снарядов, тип поведения + массив аугментаций для уровней 3, 7, 10).
  - `SynergyRecipe` (id, ingredients: SkillId[] длиной 2 или 3, resultSkillId, name, description).
  - `UltimateState` (phase: 'IDLE' | 'ASCEND' | 'BARRAGE' | 'DESCEND', timer, bonusTimeUsed, primaryTargetId, slashTimer, kunaiTimer).

### Слой 2: Движок и оптимизация (`src/core/`)

- **`ObjectPool.ts`:** Дженерик-класс `ObjectPool<T extends { active: boolean }>`. Методы: `acquire(): T | null`, `release(obj: T)`, `forEachActive(cb: (obj: T) => void)`. Предвыделяет память на старте (500 врагов, 800 снарядов, 300 сфер опыта, 150 цифр урона).
- **`SpatialGrid.ts`:** Разбивает мир на ячейки 128×128 px через `Map<number, Enemy[]>`. В начале каждого тика вызывает `clear()`, заносит всех активных врагов по формуле хеша `(cellX << 16) ^ cellY`, а при проверке снаряда возвращает врагов только из 9 соседних ячеек.
- **`GameLoop.ts`:** Фиксированный шаг симуляции `FIXED_DT = 1 / 60` с аккумулятором времени (защита от скачков FPS при сворачивании приложения на Android).
- **`TouchJoystick.ts`:** Слушает `pointerdown`, `pointermove`, `pointerup`. При касании запоминает `originX`, `originY`, отдаёт нормализованный вектор `{ dx, dy }` в `GameState` и рисует полупрозрачный круг стика в точке касания.

### Слой 3: Игровые данные (`src/data/`)

- **`skills.ts`:** Чистый декларативный массив из 20 объектов `SkillDefinition`. Никакой логики внутри — только числа и теги модификаторов (`pierce: 1`, `homing: true`, `ricochet: 4`, `applyBleed: true`, `vampirism: 0.02`).
- **`synergies.ts`:** 8 рецептов (5 парных + 3 тройных). Содержит функцию-хелпер `getAvailableSynergies(activeSkills: SkillInstance[])`, которая проверяет, что все компоненты есть в инвентаре и имеют `level >= 5`.
- **`enemies.ts`:** Таблица волн по минутам (0–2 мин: базовые ниндзя; 2–5 мин: быстрые ассасины + лучники; 5+ мин: бронированные самураи; каждые 3 мин: спавн мини-босса с повышенным HP и дропом сундука/сферы опыта).

### Слой 4: Системы геймплея (`src/systems/`)

- **`PlayerSystem.ts`:** Двигает игрока по вектору стика, притягивает сферы опыта в радиусе `pickupRadius`. Важно: если активных сфер опыта на карте > 150, новые сферы не спавнятся, а их XP прибавляется к ближайшей лежащей сфере.
- **`SkillSystem.ts`:** Перебирает 5 активных слотов игрока. Когда `cooldownTimer <= 0`, читает модификаторы текущего уровня (включая активированные аугментации 3/7/10 ур.) и запрашивает объекты из пула снарядов.
- **`ProjectileSystem.ts`:** Обновляет физику всех типов атак:
  - Прямой полёт и рикошеты (поиск ближайшего врага в `SpatialGrid` при отскоке).
  - Самонаводка (плавный поворот вектора скорости `steer` к цели).
  - Орбиталы (расчёт позиции по `player.x + Math.cos(angle) * radius`).
  - Стационарные AoE-зоны (дым, лава, шипы — тикают урон раз в 0.25 сек).
- **`UltimateSystem.ts` (Wanwan + Hayabusa на 50 ур.):**
  - При активации переводит игрока в `phase = 'ASCEND'` (неуязвимость, запрет обычного движения, камера отдаляется).
  - В `phase = 'BARRAGE'` ищет врага с макс. HP в радиусе экрана. Каждые 0.06 сек спавнит призрачный кунай, летящий сверху в цель. Каждые 0.15 сек спавнит визуальный разрез теневого клона по случайному врагу в радиусе и наносит ему AoE-урон.
  - При смерти основной цели мгновенно переключает `primaryTargetId` на следующего врага и добавляет +0.25 сек к таймеру (лимит бонуса +2.0 сек).
  - В `phase = 'DESCEND'` наносит финальный удар по площади вокруг игрока и возвращает управление.
- **`ProgressionSystem.ts`:** При заполнении шкалы XP повышает уровень героя (до 50), ставит `GameLoop` на паузу и формирует 3 карточки на выбор:
  - **Приоритет 1:** доступное Слияние (если выполнено условие `level >= 5` для пары/тройки).
  - **Приоритет 2:** случайные активные скиллы игрока ниже 10-го уровня (если следующий уровень 3, 7 или 10 — карточка помечается как Аугментация с описанием новой механики).

### Слой 5: Рендер, звук и UI (`src/render/`, `src/audio/`, `src/ui/`)

- **`TextureFactory.ts`:** Генерирует все текстуры программно через `PIXI.Graphics -> app.renderer.generateTexture()` на старте (силуэт ниндзя, кунаи, сюрикены, клинки, враги, светящиеся сферы XP). Это убирает проблемы с загрузкой ассетов на Android и даёт идеальную чёткость на любом DPI.
- **`EntityRenderer.ts` & `VfxRenderer.ts`:** Управляют `PIXI.Container` слоями (`groundLayer`, `entityLayer`, `projectileLayer`, `vfxLayer`). Реализуют белую вспышку при уроне (`tint = 0xffffff` на 60 мс), полупрозрачные шлейфы за кунаями и неоновые линии разрезов во время ульты.
- **`SoundEngine.ts`:** Оболочка над 50-строчным алгоритмом ZzFX с готовыми пресетами: `playThrow()`, `playHit()`, `playCrit()`, `playXp()`, `playLevelUp()`, `playUltimate()`.
- **`ui/*.ts`:** Чистый DOM + Tailwind поверх канваса. Полная изоляция от 60 FPS цикла — UI обновляется только по событиям (получен урон, поднят опыт, левел-ап).

## 3. Порядок генерации в DeepSeek (строго по зависимостям)

Чтобы DeepSeek не придумывал несуществующие методы, скармливай ему задачи строго в этой последовательности:

1. **Инициализация + Типы:** `package.json`, `tsconfig.json`, `vite.config.ts`, `src/types/game.ts`.
2. **Ядро:** `ObjectPool.ts`, `SpatialGrid.ts`, `GameState.ts`, `GameLoop.ts`, `Camera.ts`, `TouchJoystick.ts`.
3. **Графика и Звук:** `TextureFactory.ts`, `EntityRenderer.ts`, `VfxRenderer.ts`, `FloatingText.ts`, `SoundEngine.ts`.
4. **Данные (база):** `enemies.ts`, `synergies.ts` и первые 5 скиллов в `skills.ts`.
5. **Игровые системы:** `PlayerSystem.ts`, `EnemySystem.ts`, `SkillSystem.ts`, `ProjectileSystem.ts`, `CombatSystem.ts`, `UltimateSystem.ts`, `ProgressionSystem.ts`.
6. **Интерфейс и Сборка:** `PreRunDraft.ts`, `HudOverlay.ts`, `LevelUpModal.ts`, `GameOverModal.ts`, `UIManager.ts`, `main.ts`.
7. **Масштабирование контента:** добивка оставшихся 15 скиллов в `skills.ts` (по 5 штук за промпт).
8. **Android APK:** `capacitor.config.ts` + `.github/workflows/build-apk.yml`.

## 4. Фактические дополнения к структуре

В ходе реализации добавлены модули, которых не было в исходном дереве, чтобы держать файлы компактнее и не плодить циклические импорты:

- `core/World.ts` — владелец всех пулов и `SpatialGrid`, фабрики спавна.
- `core/entityFactories.ts` — фабрики и reset-функции пулов (аллокации только на старте).
- `data/ultimate.ts` — тюнинг ульты.
- `data/skillsExtra1.ts`, `data/skillsExtra2.ts` — оставшиеся 15 скиллов; `data/skills.ts` мёржит их в `SKILL_DEFINITIONS` и содержит расчёт статов.
- `systems/AdvancedCastsA.ts`, `systems/AdvancedCastsB.ts`, `systems/castContext.ts` — касты 15 продвинутых скиллов, вынесенные из `SkillSystem`.
- `ui/dom.ts` — DOM-хелперы UI.
- `README.md` — сборка, управление, статус.

Типы разбиты на `types/core.ts`, `types/skills.ts`, `types/entities.ts`, `types/run.ts`; `types/game.ts` — публичный баррель.

## 5. Neo-Edo Ink visual layer

- `assets/palette.ts` — strict color tokens + Pixi numeric mirrors.
- `assets/inkCanvas.ts` — offscreen-canvas pipeline (2x, shadow, outline, gradient, splatter).
- `assets/enemySprites.ts`, `assets/projectileSprites.ts`, `assets/effectSprites.ts` — texture sets.
- `assets/ProceduralSprites.ts` — facade with the same API the renderers consume.
- `assets/SvgIcons.ts` — 20 bespoke skill SVGs + HUD glyphs (enso backdrop, silhouette, accent).
- `render/ArenaRenderer.ts` — tiled ink floor, giant enso seal, drifting ash motes.
- `render/TrailRenderer.ts` — pooled `PIXI.MeshRope` ribbons for fast player projectiles.
- `render/JuiceController.ts` — 35–60 ms hit-stop (`timeScale = 0.05`) and directional camera punch.
- Fonts are bundled via `@fontsource`: Cinzel, PT Serif (Cyrillic), Noto Serif JP accents, JetBrains Mono.
- `style.css` — Tailwind theme tokens, chamfer clip-paths, double-line panels, paper grain, tactile flash.
