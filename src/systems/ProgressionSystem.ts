/**
 * Прогрессия: карточки апгрейда, аугментации 3/7/10 и слияния скиллов.
 * Зависимости: GameState, SkillSystem, data/skills, data/synergies.
 */

import type { GameState } from '@/core/GameState';
import { createSkillInstance } from '@/core/GameState';
import type { SkillSystem } from './SkillSystem';
import type { SkillInstance, UpgradeCard } from '@/types/game';
import { getSkillDefinition } from '@/data/skills';
import { getAvailableSynergies, getSynergyRecipe } from '@/data/synergies';

const STAT_TEXT = '+15% урона · −8% перезарядки · +1 снаряд каждые 3 уровня';

export class ProgressionSystem {
  constructor(
    private readonly state: GameState,
    private readonly skillSystem: SkillSystem,
  ) {}

  generateCards(count = 3): UpgradeCard[] {
    const cards: UpgradeCard[] = [];
    const available = getAvailableSynergies(this.state.skills).filter(
      (recipe) => !this.state.synergies.includes(recipe.id),
    );
    if (available.length > 0) {
      const recipe = available[Math.floor(Math.random() * available.length)];
      if (recipe) cards.push(this.synergyCard(recipe.id));
    }

    const upgradeable = this.state.skills.filter((skill) => skill.level < 10);
    this.shuffle(upgradeable);
    for (const skill of upgradeable) {
      if (cards.length >= count) break;
      if (!getSkillDefinition(skill.id)) continue;
      cards.push(this.upgradeCard(skill));
    }
    return cards.slice(0, count);
  }

  private upgradeCard(skill: SkillInstance): UpgradeCard {
    const def = getSkillDefinition(skill.id);
    const nextLevel = skill.level + 1;
    const augment = def?.augments.find((entry) => entry.level === nextLevel);
    if (def && augment) {
      return {
        id: `${skill.id}-aug-${nextLevel}-${Math.random().toString(36).slice(2, 7)}`,
        kind: 'augment',
        title: augment.name,
        description: `${def.name}: ${augment.description}`,
        skillId: skill.id,
        synergyId: null,
        nextLevel,
        rarity: 'epic',
      };
    }
    return {
      id: `${skill.id}-stat-${nextLevel}-${Math.random().toString(36).slice(2, 7)}`,
      kind: 'stat',
      title: `${def?.name ?? skill.id} · ур. ${nextLevel}`,
      description: STAT_TEXT,
      skillId: skill.id,
      synergyId: null,
      nextLevel,
      rarity: nextLevel >= 8 ? 'rare' : 'common',
    };
  }

  private synergyCard(id: UpgradeCard['synergyId']): UpgradeCard {
    const recipe = id ? getSynergyRecipe(id) : undefined;
    const names = recipe
      ? recipe.ingredients
          .map((skillId) => getSkillDefinition(skillId)?.name ?? skillId)
          .join(' + ')
      : '';
    return {
      id: `synergy-${id ?? 'unknown'}`,
      kind: 'synergy',
      title: recipe?.name ?? 'Слияние',
      description: `${names}. ${recipe?.description ?? ''}`,
      skillId: null,
      synergyId: id,
      nextLevel: null,
      rarity: 'legendary',
    };
  }

  apply(card: UpgradeCard): void {
    if (card.kind === 'synergy' && card.synergyId) {
      this.forge(card);
      return;
    }
    if (!card.skillId) return;
    const skill = this.state.getSkill(card.skillId);
    if (!skill) return;
    this.skillSystem.levelUpSkill(card.skillId);
    this.state.emit('upgradePicked', { skillId: card.skillId, level: skill.level });
  }

  private forge(card: UpgradeCard): void {
    const recipe = card.synergyId ? getSynergyRecipe(card.synergyId) : undefined;
    if (!recipe) return;

    const ingredients = recipe.ingredients
      .map((id) => this.state.getSkill(id))
      .filter((skill): skill is SkillInstance => skill !== undefined);
    if (ingredients.length !== recipe.ingredients.length) return;

    const maxLevel = Math.max(...ingredients.map((skill) => skill.level));
    const primary = ingredients[0];
    if (!primary) return;

    this.state.skills = this.state.skills.filter(
      (skill) => !recipe.ingredients.includes(skill.id),
    );

    const evolved = createSkillInstance(primary.id, maxLevel);
    evolved.isEvolved = true;
    evolved.evolvedFrom = [...recipe.ingredients];
    evolved.synergyId = recipe.id;
    evolved.cooldownTimer = 0;
    evolved.augmentsUnlocked = { ...primary.augmentsUnlocked };
    this.state.skills.push(evolved);
    this.state.synergies.push(recipe.id);
    this.state.emit('synergyForged', { id: recipe.id });
  }

  private shuffle<T>(items: T[]): void {
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = items[i];
      const other = items[j];
      if (temp === undefined || other === undefined) continue;
      items[i] = other;
      items[j] = temp;
    }
  }
}
