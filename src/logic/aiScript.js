import Unit from './unit.js';

// rules.md 7 : le script ne fait QUE définir quoi/quand/où déployer — une fois créée via
// `new Unit(...)`, l'unité IA suit exactement le comportement autonome déjà codé dans
// combat.js (mouvement, ciblage, attaque), sans aucune logique de décision supplémentaire.
export function createAiScriptState() {
  return { nextIndex: 0 };
}

// `script` doit être trié par `time` croissant (voir src/data/battleScript.js). Renvoie les
// unités à déployer pour ce tick — celles dont l'heure de déploiement (temps absolu depuis
// le début de la bataille) est atteinte depuis le dernier appel — sans jamais en redéployer
// une deuxième fois.
export function deployScheduledUnits(script, state, elapsedSeconds, faction) {
  const deployed = [];
  while (state.nextIndex < script.length && script[state.nextIndex].time <= elapsedSeconds) {
    const entry = script[state.nextIndex];
    deployed.push(new Unit(entry.species, faction, entry.x, entry.y));
    state.nextIndex += 1;
  }
  return deployed;
}
