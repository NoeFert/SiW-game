import { useEffect, useState } from 'react';
import { interactionState } from '../state/interactionState.js';

// Le `battle` de battle.js est un objet mutable ordinaire, muté à chaque frame par
// BattleScene (Phaser) — React ne le sait pas nativement. On force un re-render à chaque
// frame pour rester synchro, exactement comme la Scene relit son état à chaque `update()`.
export function useBattle() {
  const [, forceRender] = useState(0);

  useEffect(() => {
    let frameId;
    const loop = () => {
      forceRender((n) => n + 1);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return interactionState.battle;
}
