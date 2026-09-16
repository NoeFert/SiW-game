let nextId = 1;

export default class Unit {
  constructor(species, faction, x, y) {
    this.id = nextId++;
    this.species = species;
    this.faction = faction;
    this.x = x;
    this.y = y;
    this.hp = species.maxHp;
    this.status = 'idle'; // idle | moving | attacking | engaged | fleeing
    this.target = null;
    this.attackTimer = 0;
    this.attacksLanded = 0;
    this.paralyzedNextAttack = false;
    this.moveProgress = 0;
    this.command = null; // { type: 'attack', target } | { type: 'moveTo', x, y } | { type: 'flee' }
    this.hasFled = false;
  }

  get size() {
    return this.species.size;
  }

  get isFlying() {
    return this.species.keywords.includes('flying');
  }

  get isLegendary() {
    return this.species.keywords.includes('legendary');
  }

  get isAlive() {
    return this.hp > 0;
  }

  // Vivante et toujours sur le terrain (pas retirée par une fuite réussie, rules.md 2/5).
  get isOnField() {
    return this.isAlive && !this.hasFled;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }
}
