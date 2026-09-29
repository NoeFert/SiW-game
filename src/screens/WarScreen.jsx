import { Badge } from '@/components/ui/8bit/badge.jsx';
import { Button } from '@/components/ui/8bit/button.jsx';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/8bit/card.jsx';
import { BATTLES, WAR_BATTLE_IDS } from '../data/battles.js';
import { ROSTERS } from '../data/rosters.js';
import { ARMY_PP_CAP, armyCost, armyUnits } from '../logic/army.js';
import { isWarCompleted, victoryReward, warBattleState } from '../logic/war.js';
import { getArmy, getOwnedUnits, getWonWarBattles } from '../persistence.js';
import { SpiritStonesAmount } from '../ui/SpiritStonesBalance.jsx';
import { TEXT } from '../ui/strings.js';

const T = TEXT.war;

// technical.md 5.1 / rules.md 11.7 : écran « Partir en guerre ». L'armée qui partira, puis une
// ligne par bataille dans l'ordre de déblocage — zones, état, récompense de la prochaine victoire
// (pleine ou réduite au rejeu) — et « Combattre » pour chaque bataille débloquée, désactivé si
// l'armée est vide. Une fois les trois gagnées, un message annonce la suite.
export default function WarScreen({ playerFaction, onFight, onBack }) {
  const roster = ROSTERS[playerFaction];
  const units = getOwnedUnits() ?? [];
  const army = getArmy();
  const wonIds = getWonWarBattles();
  const armyIsEmpty = armyUnits(army, units).length === 0;

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-8 bg-neutral-900 text-white">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>{T.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="retro text-xs">{T.armyLine(army.name, armyCost(army, units, roster), ARMY_PP_CAP)}</p>
          {armyIsEmpty && <p className="text-xs text-red-400">{T.emptyArmy}</p>}
          {WAR_BATTLE_IDS.map((id) => {
            const battle = BATTLES[id];
            const state = warBattleState(WAR_BATTLE_IDS, wonIds, id);
            return (
              <div
                key={id}
                className={`flex items-center gap-4 border-2 border-white/30 bg-black/40 px-3 py-2 ${state === 'locked' ? 'opacity-50' : ''}`}
              >
                <div className="flex flex-1 flex-col gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{T.battleNames[id]}</span>
                    <Badge variant="secondary" font="normal" className="text-[10px] mx-1.5">{T.states[state]}</Badge>
                  </div>
                  <span className="text-white/60">{battle.zones.map((zone) => T.zoneNames[zone]).join(' → ')}</span>
                  {state !== 'locked' && <SpiritStonesAmount amount={victoryReward(battle.reward, state === 'won')} />}
                </div>
                <Button size="sm" disabled={state === 'locked' || armyIsEmpty} onClick={() => onFight(id)}>
                  {T.fight}
                </Button>
              </div>
            );
          })}
          {isWarCompleted(WAR_BATTLE_IDS, wonIds) && <p className="retro text-xs text-center">{T.completed}</p>}
        </CardContent>
      </Card>
      <Button onClick={onBack}>{T.back}</Button>
    </div>
  );
}
