import { useState } from 'react';
import { Badge } from '@/components/ui/8bit/badge.jsx';
import { Button } from '@/components/ui/8bit/button.jsx';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/8bit/card.jsx';
import { ROSTERS } from '../data/rosters.js';
import { SPECIES_SPRITES, spritePath } from '../data/sprites.js';
import { armyUnits, countUnitsBySpecies, summonAction } from '../logic/civilization.js';
import { getArmy, getOwnedUnits } from '../persistence.js';
import { TEXT, unitName } from '../ui/strings.js';

const T = TEXT.civilization;

function SpeciesSprite({ species, className }) {
  return (
    <img
      src={spritePath(SPECIES_SPRITES[species.name].key)}
      alt=""
      className={`pixelated object-contain ${className}`}
    />
  );
}

function Keywords({ species }) {
  const keywords = species.keywords.length > 0 ? species.keywords : ['basic'];
  return keywords.map((keyword) => (
    <Badge key={keyword} variant="secondary" font="normal" className="text-[10px] mx-1.5">
      {TEXT.keywords[keyword]}
    </Badge>
  ));
}

// technical.md 5.1 : une ligne par espèce — sprite, nom, keywords, coût, individus possédés.
// Une espèce à 0 reste affichée, grisée.
function SpeciesRow({ species, owned, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 border-2 border-white/30 bg-black/40 px-3 py-2 text-left hover:border-white ${owned === 0 ? 'opacity-50 grayscale' : ''}`}
    >
      <span className="retro text-xs w-8 text-right">{owned}x</span>
      <SpeciesSprite species={species} className="size-12" />
      <div className="flex flex-col gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-bold">{unitName(species)}</span>
          <Badge className="text-[10px] mx-1.5">{TEXT.presenceTag(species.cost)}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-y-1">
          <Keywords species={species} />
        </div>
      </div>
    </button>
  );
}

// Stats complètes de units.md, dans l'ordre de la page de détail.
function statRows(species) {
  const damage = typeof species.damage === 'number' ? species.damage : T.hybridDamage(species.damage);
  return [
    [T.stats.hp, species.maxHp],
    [T.stats.damage, damage],
    [T.stats.attackType, T.attackTypes[species.attackType]],
    [T.stats.size, T.size(species.size)],
    [T.stats.moveSpeed, T.moveSpeed(species.moveSpeed)],
    [T.stats.attackSpeed, T.attackSpeed(species.attackSpeed)],
    [T.stats.range, T.range(species.range)],
    [T.stats.cost, TEXT.presenceTag(species.cost)],
  ];
}

// technical.md 5.1 : page de détail d'une espèce (vue interne à l'écran). Le bouton d'invocation
// reste désactivé jusqu'à l'arrivée de SummonScreen (roadmap-mvp.md, étape 5).
function SpeciesDetail({ species, owned, inArmy, onBack }) {
  return (
    <div className="flex flex-col gap-6 text-sm">
      <div className="flex items-center gap-6">
        <SpeciesSprite species={species} className="size-32" />
        <div className="flex flex-col gap-3">
          <span className="retro text-sm">{unitName(species)}</span>
          <div className="flex flex-wrap items-center gap-y-1"><Keywords species={species} /></div>
          <span>{T.owned(owned)}</span>
          <span>{T.inArmy(inArmy)}</span>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1">
        {statRows(species).map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-white/60">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {species.abilities && (
        <section className="flex flex-col gap-2">
          <h3 className="retro text-xs">{T.abilities}</h3>
          {species.abilities.map((ability) => (
            <p key={ability.name}>
              <span className="font-bold">{ability.name} : </span>
              {TEXT.abilityDescriptions[ability.name]}
            </p>
          ))}
        </section>
      )}
      <div className="flex gap-4">
        <Button onClick={onBack}>{T.back}</Button>
        <Button disabled>{TEXT.summonActions[summonAction(species, owned)]}</Button>
      </div>
    </div>
  );
}

// technical.md 5.1 : gestion de civilisation, section Unités (liste par espèce + page de
// détail). La section Armée arrive à l'étape 4 de roadmap-mvp.md.
export default function CivilizationScreen({ playerFaction, onBack }) {
  const [selectedKey, setSelectedKey] = useState(null);
  const roster = ROSTERS[playerFaction];
  const units = getOwnedUnits() ?? [];
  const owned = countUnitsBySpecies(roster, units);
  const inArmy = countUnitsBySpecies(roster, armyUnits(getArmy(), units));

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-8 bg-neutral-900 text-white">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{T.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedKey ? (
            <SpeciesDetail
              species={roster[selectedKey]}
              owned={owned[selectedKey]}
              inArmy={inArmy[selectedKey]}
              onBack={() => setSelectedKey(null)}
            />
          ) : (
            <section className="flex flex-col gap-3">
              <h2 className="retro text-xs">{T.units}</h2>
              {Object.entries(roster).map(([key, species]) => (
                <SpeciesRow key={key} species={species} owned={owned[key]} onClick={() => setSelectedKey(key)} />
              ))}
            </section>
          )}
        </CardContent>
      </Card>
      {!selectedKey && <Button onClick={onBack}>{T.back}</Button>}
    </div>
  );
}
