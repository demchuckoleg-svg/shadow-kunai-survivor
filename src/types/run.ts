/**
 * Контракты прогрессии, карточек выбора, статистики и событий UI.
 * Зависимости: ./skills.
 */

import type { SkillId, SynergyId } from './skills';

export type RunPhase = 'menu' | 'draft' | 'playing' | 'levelup' | 'paused' | 'gameover';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type UpgradeCardKind = 'stat' | 'augment' | 'synergy';

export interface UpgradeCard {
  id: string;
  kind: UpgradeCardKind;
  title: string;
  description: string;
  skillId: SkillId | null;
  synergyId: SynergyId | null;
  /** Уровень скилла после выбора; null для слияния. */
  nextLevel: number | null;
  rarity: Rarity;
}

export interface SkillRunStats {
  damage: number;
  hits: number;
  crits: number;
  kills: number;
}

export interface RunStats {
  survivalTime: number;
  kills: number;
  level: number;
  totalDamage: number;
  bestCombo: number;
  perSkill: Partial<Record<SkillId, SkillRunStats>>;
}

export type GameEventType =
  | 'playerDamaged'
  | 'xpGained'
  | 'levelUp'
  | 'cardsOffered'
  | 'upgradePicked'
  | 'synergyForged'
  | 'ultimateUnlocked'
  | 'ultimateReady'
  | 'ultimateActivated'
  | 'bossSpawned'
  | 'runEnded';

export interface GameEvent {
  type: GameEventType;
  payload?: unknown;
}

export interface RunTimer {
  elapsed: number;
  minute: number;
}

export type GameEventHandler = (event: GameEvent) => void;
