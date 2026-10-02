import { useState } from 'react';
import { Badge } from '@/components/ui/8bit/badge.jsx';
import { Button } from '@/components/ui/8bit/button.jsx';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/8bit/card.jsx';
import { BATTLES, WAR_BATTLE_IDS } from '../data/battles.js';
import { ROSTERS } from '../data/rosters.js';
import { WAR_MAP_1 } from '../data/warMaps.js';
import { ARMY_PP_CAP, armyCost, armyUnits } from '../logic/army.js';
import { isWarCompleted, victoryReward, warBattleState } from '../logic/war.js';
import { getArmy, getOwnedUnits, getWonWarBattles } from '../persistence.js';
import { SpiritStonesAmount } from '../ui/SpiritStonesBalance.jsx';
import { TEXT } from '../ui/strings.js';

const T = TEXT.war;

// GRAPHICS.md « Partir en guerre » : map en arbre de compétences (sprites SkillTree du pack, à
// 2×), dans la couleur du souverain adverse — violet face aux Morts-Vivants, jaune face aux Wyrms.
const ENEMY_COLOR = { wyrms: 'purple', undead: 'yellow' };
const SLOT = 42; // losange 21×21 à 2×, pointes au milieu des côtés
const HALF = SLOT / 2;
const SELECTOR = 63; // sélecteur 21×21 à 3×, pour entourer le losange
const STEP = 96; // distance entre deux cases de la grille de la map

const uiSprite = (name) => `url(/ui/${name}.png)`;
const slotCenter = ({ col, row }) => ({ x: HALF + col * STEP, y: HALF + row * STEP });

// Losange d'un emplacement : vide si disponible, plein si gagné, gris si verrouillé ; le
// sélecteur entoure l'emplacement choisi.
function Slot({ node, color, selected, onSelect }) {
  const { x, y } = slotCenter(node);
  let sprite = `war-slot-${color}`;
  if (node.state === 'won') sprite = `war-slot-won-${color}`;
  if (node.state === 'locked') sprite = 'war-slot-grey';
  return (
    <button
      type="button"
      onClick={onSelect}
      className="pixelated absolute cursor-pointer bg-size-[100%_100%] hover:brightness-125"
      style={{ left: x - HALF, top: y - HALF, width: SLOT, height: SLOT, backgroundImage: uiSprite(sprite) }}
    >
      {selected && (
        <span
          className="pixelated absolute bg-size-[100%_100%]"
          style={{
            left: HALF - SELECTOR / 2,
            top: HALF - SELECTOR / 2,
            width: SELECTOR,
            height: SELECTOR,
            backgroundImage: uiSprite(`war-selector-${node.state === 'locked' ? 'grey' : color}`),
          }}
        />
      )}
    </button>
  );
}

// Connecteur droit entre deux emplacements qui se suivent (même ligne ou même colonne), de
// pointe à pointe. Gris vers un emplacement verrouillé.
function Connector({ from, to, color }) {
  const a = slotCenter(from);
  const b = slotCenter(to);
  const vertical = a.x === b.x;
  const style = vertical
    ? { left: a.x - 16, top: Math.min(a.y, b.y) + HALF, width: 32, height: Math.abs(a.y - b.y) - SLOT }
    : { left: Math.min(a.x, b.x) + HALF, top: a.y - 16, width: Math.abs(a.x - b.x) - SLOT, height: 32 };
  return (
    <div
      className={`pixelated absolute bg-size-[32px_32px] ${vertical ? 'bg-repeat-y' : 'bg-repeat-x'}`}
      style={{ ...style, backgroundImage: uiSprite(`war-connector-${vertical ? 'vertical' : 'horizontal'}-${color}`) }}
    />
  );
}

// technical.md 5.1 / rules.md 11.7 : écran « Partir en guerre ». L'armée qui partira, puis la
// map 1 : un losange par emplacement, sur le tracé en lacets (src/data/warMaps.js). Les premiers
// portent les batailles définies, les suivants sont verrouillés (« À venir »). Un clic sur un
// losange l'affiche dans le panneau : nom, état, récompense de la prochaine victoire (pleine ou
// réduite au rejeu) et « Combattre », désactivé si verrouillée ou si l'armée est vide.
export default function WarScreen({ playerFaction, onFight, onBack }) {
  const roster = ROSTERS[playerFaction];
  const units = getOwnedUnits() ?? [];
  const army = getArmy();
  const wonIds = getWonWarBattles();
  const armyIsEmpty = armyUnits(army, units).length === 0;
  const color = ENEMY_COLOR[playerFaction];
  const nodes = WAR_MAP_1.slots.map((slot, i) => {
    const id = WAR_BATTLE_IDS[i] ?? null;
    return { ...slot, id, state: id ? warBattleState(WAR_BATTLE_IDS, wonIds, id) : 'locked' };
  });
  // Sélection par défaut : la dernière bataille débloquée, là où en est le joueur.
  const [selected, setSelected] = useState(() => nodes.findLastIndex((node) => node.state !== 'locked'));
  const current = nodes[selected];

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-8 bg-neutral-900 text-white">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>{T.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <p className="retro text-xs">{T.armyLine(army.name, armyCost(army, units, roster), ARMY_PP_CAP)}</p>
          {armyIsEmpty && <p className="text-xs text-red-400">{T.emptyArmy}</p>}
          <div className="flex items-center justify-between gap-8">
            <div
              className="relative shrink-0"
              style={{ width: SLOT + (WAR_MAP_1.cols - 1) * STEP, height: SLOT + (WAR_MAP_1.rows - 1) * STEP }}
            >
              {nodes.slice(1).map((node, i) => (
                <Connector key={i} from={nodes[i]} to={node} color={node.state === 'locked' ? 'grey' : color} />
              ))}
              {nodes.map((node, i) => (
                <Slot key={i} node={node} color={color} selected={i === selected} onSelect={() => setSelected(i)} />
              ))}
            </div>
            <div className={`flex w-52 flex-col items-center gap-3 text-center text-xs ${current.state === 'locked' ? 'opacity-50' : ''}`}>
              <span className="retro text-sm">{current.id ? T.battleNames[current.id] : T.upcoming}</span>
              <Badge variant="secondary" font="normal" className="text-[10px]">{T.states[current.state]}</Badge>
              {current.state !== 'locked' && (
                <SpiritStonesAmount amount={victoryReward(BATTLES[current.id].reward, current.state === 'won')} />
              )}
              <Button size="sm" disabled={current.state === 'locked' || armyIsEmpty} onClick={() => onFight(current.id)}>
                {T.fight}
              </Button>
            </div>
          </div>
          {isWarCompleted(WAR_BATTLE_IDS, wonIds) && <p className="retro text-xs text-center">{T.completed}</p>}
        </CardContent>
      </Card>
      <Button onClick={onBack}>{T.back}</Button>
    </div>
  );
}
