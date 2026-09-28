import { PRESENCE_CAP } from '../logic/deployment.js';
import { TEXT } from './strings.js';

// Classes littérales (Tailwind ne détecte pas les noms construits dynamiquement).
const FILL_CLASS = {
  wyrms: 'bg-faction-wyrms',
  undead: 'bg-faction-undead',
};

// ui-battle-screen-decisions.md 2.1 : rond qui se remplit de bas en haut, comme un liquide,
// selon les points de présence sur le terrain, avec le ratio par-dessus.
export default function PresenceGauge({ used, playerFaction }) {
  const ratio = Math.min(1, used / PRESENCE_CAP);
  return (
    <div className="flex flex-col items-center gap-2">
      <div data-tutorial="presence-gauge" className="relative size-24 rounded-full overflow-hidden border-4 border-foreground bg-neutral-800">
        <div
          className={`absolute inset-x-0 bottom-0 transition-[height] duration-300 ${FILL_CLASS[playerFaction]}`}
          style={{ height: `${ratio * 100}%` }}
        />
        <span className="retro absolute inset-0 flex items-center justify-center text-[11px] text-white [text-shadow:0_0_3px_#000,0_0_3px_#000]">
          {used}/{PRESENCE_CAP}
        </span>
      </div>
      <span className="text-xs text-muted-foreground">{TEXT.presenceLabel}</span>
    </div>
  );
}
