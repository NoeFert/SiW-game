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

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }
}
