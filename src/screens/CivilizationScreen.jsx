import { useState } from 'react';
import { Badge } from '@/components/ui/8bit/badge.jsx';
import { Button } from '@/components/ui/8bit/button.jsx';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/8bit/card.jsx';
import { ROSTERS } from '../data/rosters.js';
import { SPECIES_SPRITES, spritePath } from '../data/sprites.js';
import { countUnitsBySpecies } from '../logic/ownedUnits.js';
import {
  ARMY_NAME_MAX_LENGTH, ARMY_PP_CAP, addToArmy, armyCost, armyUnits, canAddToArmy,
  canRemoveFromArmy, removeFromArmy, renameArmy,
} from '../logic/army.js';
import { summonAction } from '../logic/summon.js';
import { getArmy, getOwnedUnits, saveArmy } from '../persistence.js';
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
// mène à SummonScreen ; désactivé pour un [Légendaire] vivant (« Déjà à vos côtés », rules.md 11.4).
function SpeciesDetail({ species, owned, inArmy, onBack, onSummon }) {
  const action = summonAction(species, owned);
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
        <Button disabled={action === 'alreadyOwned'} onClick={onSummon}>{TEXT.summonActions[action]}</Button>
      </div>
    </div>
  );
}

// rules.md 11.2 : nom de l'armée, renommable. Entrée ou ✓ valide, Échap annule ; la saisie est
// bornée à 20 caractères, et un nom refusé par renameArmy (vide ou espaces) garde l'ancien.
function ArmyName({ name, onRename }) {
  const [draft, setDraft] = useState(null); // null = pas en cours d'édition

  if (draft === null) {
    return (
      <div className="flex items-center gap-3">
        <span className="retro text-sm">{name}</span>
        <button type="button" onClick={() => setDraft(name)} title={T.rename} className="hover:text-white/70">✎</button>
      </div>
    );
  }

  const confirm = () => {
    onRename(draft);
    setDraft(null);
  };
  return (
    <div className="flex items-center gap-3">
      <input
        autoFocus
        value={draft}
        onChange={(e) => {
          if ([...e.target.value].length <= ARMY_NAME_MAX_LENGTH) setDraft(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') confirm();
          if (e.key === 'Escape') setDraft(null);
        }}
        className="retro text-sm bg-black/60 border-2 border-white/60 px-2 py-1 outline-none focus:border-white"
      />
      <button type="button" onClick={confirm} title={T.confirmRename} className="hover:text-white/70">✓</button>
    </div>
  );
}

// technical.md 5.1 / rules.md 11.2 : section Armée — nom, compteur « X / 500 PP », et une ligne
// par espèce (individus dans l'armée / possédés) avec retrait et ajout un par un.
function ArmySection({ roster, units, army, onChange }) {
  const owned = countUnitsBySpecies(roster, units);
  const inArmy = countUnitsBySpecies(roster, armyUnits(army, units));
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <ArmyName name={army.name} onRename={(name) => onChange(renameArmy(army, name))} />
        <span className="retro text-xs">{T.armyCost(armyCost(army, units, roster), ARMY_PP_CAP)}</span>
      </div>
      {Object.entries(roster).map(([key, species]) => (
        <div key={key} className="flex items-center gap-3 border-2 border-white/30 bg-black/40 px-3 py-2">
          <SpeciesSprite species={species} className="size-10" />
          <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="font-bold">{unitName(species)}</span>
            <Badge className="text-[10px] mx-1.5">{TEXT.presenceTag(species.cost)}</Badge>
          </div>
          <Button
            size="sm"
            title={T.removeUnit}
            disabled={!canRemoveFromArmy(army, units, key)}
            onClick={() => onChange(removeFromArmy(army, units, key))}
          >
            −
          </Button>
          <span className="retro text-xs w-14 text-center">{T.armyCount(inArmy[key], owned[key])}</span>
          <Button
            size="sm"
            title={T.addUnit}
            disabled={!canAddToArmy(army, units, roster, key)}
            onClick={() => onChange(addToArmy(army, units, roster, key))}
          >
            +
          </Button>
        </div>
      ))}
    </section>
  );
}

// technical.md 5.1 : gestion de civilisation en deux sections — Unités (liste par espèce + page
// de détail) et Armée (composition et renommage, sauvegardés à chaque changement).
// `initialSpecies` : espèce dont la page de détail s'ouvre directement (retour de SummonScreen).
export default function CivilizationScreen({
  playerFaction, initialSpecies = null, onBack, onOpenSummon,
}) {
  const [section, setSection] = useState('units');
  const [selectedKey, setSelectedKey] = useState(initialSpecies);
  const [army, setArmy] = useState(getArmy);
  const roster = ROSTERS[playerFaction];
  const units = getOwnedUnits() ?? [];
  const owned = countUnitsBySpecies(roster, units);
  const inArmy = countUnitsBySpecies(roster, armyUnits(army, units));

  const changeArmy = (newArmy) => {
    saveArmy(newArmy);
    setArmy(newArmy);
  };

  let content;
  if (selectedKey) {
    content = (
      <SpeciesDetail
        species={roster[selectedKey]}
        owned={owned[selectedKey]}
        inArmy={inArmy[selectedKey]}
        onBack={() => setSelectedKey(null)}
        onSummon={() => onOpenSummon(selectedKey)}
      />
    );
  } else if (section === 'army') {
    content = <ArmySection roster={roster} units={units} army={army} onChange={changeArmy} />;
  } else {
    content = (
      <section className="flex flex-col gap-3">
        {Object.entries(roster).map(([key, species]) => (
          <SpeciesRow key={key} species={species} owned={owned[key]} onClick={() => setSelectedKey(key)} />
        ))}
      </section>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-8 bg-neutral-900 text-white">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{T.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!selectedKey && (
            <div className="flex gap-4">
              {[['units', T.units], ['army', T.army]].map(([key, label]) => (
                <Button key={key} variant={section === key ? 'default' : 'secondary'} onClick={() => setSection(key)}>
                  {label}
                </Button>
              ))}
            </div>
          )}
          {content}
        </CardContent>
      </Card>
      {!selectedKey && <Button onClick={onBack}>{T.back}</Button>}
    </div>
  );
}
