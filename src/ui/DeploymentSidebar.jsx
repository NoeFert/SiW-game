import { useState } from 'react';
import { Button } from '@/components/ui/8bit/button.jsx';
import { useBattle } from './useBattle.js';
import { getReserve, getPresenceUsed, PRESENCE_CAP } from '../logic/deployment.js';
import { deployPlayerUnit } from '../logic/battle.js';
import { CELL_SIZE } from '../renderConstants.js';
import { interactionState } from '../state/interactionState.js';

// rules.md 2 : sidebar de déploiement (React) — le glisser part d'ici (Pointer Events, suivies
// sur `window` pour ne pas dépendre du DOM de Phaser), et se termine sur le canevas (repéré par
// son <canvas> DOM, une donnée générique, pas un objet Phaser) qui reste géré exclusivement par
// BattleScene. La règle de déploiement elle-même (plafond, copies, légendaire, zone) est
// entièrement dans deployment.js/battle.js, inchangée — cette sidebar ne fait qu'appeler
// deployPlayerUnit avec la case calculée depuis la position de relâchement.
export default function DeploymentSidebar() {
  const battle = useBattle();
  const [drag, setDrag] = useState(null); // { species, x, y } en coordonnées écran
  const [message, setMessage] = useState('');

  if (!battle) return null;

  const onField = battle.units.filter((u) => u.isOnField);
  const used = getPresenceUsed('player', onField);
  const speciesList = [...battle.playerDeployment.bySpecies.keys()];

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 1500);
  };

  const finishDrag = (species, clientX, clientY) => {
    interactionState.paused = false;
    const canvas = document.querySelector('#phaser-root canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (clientX < rect.left || clientX >= rect.right || clientY < rect.top || clientY >= rect.bottom) {
      return; // relâché hors du terrain : annulation silencieuse (comme reposer l'icône)
    }
    const gx = Math.floor((clientX - rect.left) / CELL_SIZE);
    const gy = Math.floor((clientY - rect.top) / CELL_SIZE);
    const result = deployPlayerUnit(battle, species, gx, gy);
    if (!result.success) showMessage(`Déploiement refusé : ${result.reason}`);
  };

  const startDrag = (species, event) => {
    if (battle.outcome !== 'ongoing' || interactionState.commandModeActive) return;
    interactionState.paused = true;
    setDrag({ species, x: event.clientX, y: event.clientY });

    const onMove = (e) => setDrag({ species, x: e.clientX, y: e.clientY });
    const onUp = (e) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      finishDrag(species, e.clientX, e.clientY);
      setDrag(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div className="p-4 flex flex-col gap-2 border-b border-neutral-700">
      <h2 className="font-bold text-sm">Déploiement</h2>
      <p className="text-xs text-neutral-300">Points de présence : {used}/{PRESENCE_CAP}</p>
      {message && <p className="text-xs text-red-400">{message}</p>}

      {speciesList.map((species) => {
        const reserve = getReserve(battle.playerDeployment, species);
        const available = reserve.fresh + reserve.returningHp.length;
        const woundedNote = reserve.returningHp.length > 0 ? ` (fuis: ${reserve.returningHp.join(',')} PV)` : '';
        return (
          <Button
            key={species.name}
            disabled={available <= 0}
            onPointerDown={(event) => startDrag(species, event)}
            className="w-full justify-between text-xs"
          >
            <span>{species.name}</span>
            <span>{species.cost}pts x{available}{woundedNote}</span>
          </Button>
        );
      })}

      {drag && (
        <div
          style={{
            position: 'fixed', left: drag.x - 24, top: drag.y - 24, width: 48, height: 48,
            pointerEvents: 'none', zIndex: 1000,
          }}
          className="rounded bg-primary/70 flex items-center justify-center text-[10px] text-white text-center px-1"
        >
          {drag.species.name}
        </div>
      )}
    </div>
  );
}
