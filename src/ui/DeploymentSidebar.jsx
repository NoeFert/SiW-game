import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/8bit/button.jsx';
import { useBattle } from './useBattle.js';
import { getReserve, getPresenceUsed, PRESENCE_CAP } from '../logic/deployment.js';
import { deployPlayerUnit } from '../logic/battle.js';
import { CELL_SIZE, GAME_WIDTH } from '../renderConstants.js';
import { interactionState } from '../state/interactionState.js';

// Une ligne par variante réellement distincte d'une espèce : les copies fraîches (toutes
// identiques entre elles) se regroupent en une ligne, et chaque valeur de PV différente parmi
// les copies revenues de fuite obtient sa propre ligne (deux copies aux PV identiques se
// regroupent, elles, ensemble). `choice` est ce qu'on transmettra à deployPlayerUnit pour
// garantir que la ligne glissée est bien la copie déployée (voir deployment.js `takeCopy`).
function buildRows(playerDeployment, speciesList) {
  const rows = [];
  for (const species of speciesList) {
    const reserve = getReserve(playerDeployment, species);

    if (reserve.fresh > 0) {
      rows.push({
        species, choice: 'fresh', hp: species.maxHp, count: reserve.fresh,
      });
    }

    const tally = new Map();
    for (const hp of reserve.returningHp) tally.set(hp, (tally.get(hp) ?? 0) + 1);
    for (const [hp, count] of tally) {
      rows.push({
        species, choice: hp, hp, count,
      });
    }

    if (reserve.fresh === 0 && reserve.returningHp.length === 0) {
      rows.push({
        species, choice: null, hp: species.maxHp, count: 0,
      });
    }
  }
  return rows;
}

// rules.md 2 : sidebar de déploiement (React) — le glisser part d'ici (Pointer Events, suivies
// sur `window` pour ne pas dépendre du DOM de Phaser), et se termine sur le canevas (repéré par
// son <canvas> DOM, une donnée générique, pas un objet Phaser) qui reste géré exclusivement par
// BattleScene. La règle de déploiement elle-même (plafond, copies, légendaire, zone, choix de
// la copie) est entièrement dans deployment.js/battle.js, inchangée à part `copyChoice`.
export default function DeploymentSidebar() {
  const battle = useBattle();
  const [drag, setDrag] = useState(null); // { row, x, y } en coordonnées écran
  const [message, setMessage] = useState('');
  const messageTimer = useRef(null);
  useEffect(() => () => clearTimeout(messageTimer.current), []);

  if (!battle) return null;

  const used = getPresenceUsed('player', battle.units.filter((u) => u.isOnField));
  const speciesList = [...battle.playerDeployment.bySpecies.keys()];
  const rows = buildRows(battle.playerDeployment, speciesList);

  // Un nouveau message remplace le précédent et repart pour sa pleine durée d'affichage.
  const showMessage = (text) => {
    clearTimeout(messageTimer.current);
    setMessage(text);
    messageTimer.current = setTimeout(() => setMessage(''), 1500);
  };

  const finishDrag = (row, clientX, clientY) => {
    interactionState.paused = false;
    interactionState.deploymentDragActive = false;
    const canvas = document.querySelector('#phaser-root canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (clientX < rect.left || clientX >= rect.right || clientY < rect.top || clientY >= rect.bottom) {
      return; // relâché hors du terrain : annulation silencieuse (comme reposer l'icône)
    }
    // technical.md 3.1 : le canevas est affiché à une taille CSS variable (Phaser.Scale.FIT),
    // mais src/logic/ raisonne toujours dans le référentiel fixe de GAME_WIDTH (1536px) — il
    // faut donc ramener le point de relâchement à cette échelle avant de calculer la case.
    const scale = rect.width / GAME_WIDTH;
    const gx = Math.floor((clientX - rect.left) / scale / CELL_SIZE);
    const gy = Math.floor((clientY - rect.top) / scale / CELL_SIZE);
    const result = deployPlayerUnit(battle, row.species, gx, gy, row.choice);
    if (!result.success) showMessage(`Déploiement refusé : ${result.reason}`);
  };

  const startDrag = (row, event) => {
    if (battle.outcome !== 'ongoing' || interactionState.commandModeActive || row.choice === null) return;
    interactionState.paused = true;
    interactionState.deploymentDragActive = true;
    setDrag({ row, x: event.clientX, y: event.clientY });

    // La capture garantit de recevoir le relâché même hors de la fenêtre du navigateur ; sinon
    // le jeu resterait en pause avec le fantôme collé au curseur.
    event.currentTarget.setPointerCapture(event.pointerId);

    const onMove = (e) => setDrag({ row, x: e.clientX, y: e.clientY });
    const end = (clientX, clientY) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('blur', onCancel);
      finishDrag(row, clientX, clientY);
      setDrag(null);
    };
    const onUp = (e) => end(e.clientX, e.clientY);
    // pointercancel (le navigateur reprend la main sur le pointeur) ou perte de focus de la
    // fenêtre (alt-tab) : annulation, traitée comme un relâché hors du terrain.
    const onCancel = () => end(-1, -1);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('blur', onCancel);
  };

  return (
    <div className="p-4 flex flex-col gap-2 border-b border-neutral-700">
      <h2 className="font-bold text-sm">Déploiement</h2>
      <p className="text-xs text-neutral-300">Points de présence : {used}/{PRESENCE_CAP}</p>
      {message && <p className="text-xs text-red-400">{message}</p>}

      {rows.map((row) => {
        const wounded = row.hp < row.species.maxHp;
        const label = wounded ? `${row.species.name} (${row.hp} PV)` : row.species.name;
        return (
          <Button
            key={`${row.species.name}-${row.choice ?? 'none'}`}
            disabled={row.count <= 0}
            onPointerDown={(event) => startDrag(row, event)}
            className="w-full justify-between text-xs"
          >
            <span>{label}</span>
            <span>{row.species.cost}pts x{row.count}</span>
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
          {drag.row.species.name}
        </div>
      )}
    </div>
  );
}
