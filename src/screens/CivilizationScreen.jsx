import { useState } from 'react';
import { Badge } from '@/components/ui/8bit/badge.jsx';
import { Button } from '@/components/ui/8bit/button.jsx';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/8bit/card.jsx';
import { ROSTERS } from '../data/rosters.js';
import { SPECIES_SPRITES, spritePath } from '../data/sprites.js';
import {
  ARMY_NAME_MAX_LENGTH, ARMY_PP_CAP, addToArmy, armyCost, canAddToArmy, canRemoveFromArmy,
  removeFromArmy, renameArmy,
} from '../logic/army.js';
import {
  individualLevel, individualProgress, levelDamage, levelStat, sortByLevel,
} from '../logic/levels.js';
import { summonAction } from '../logic/summon.js';
import { getArmy, getOwnedUnits, saveArmy } from '../persistence.js';
import { LevelBadge, XpBar } from '../ui/LevelDisplay.jsx';
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

// Bouton d'invocation d'une espèce (vers SummonScreen) : « Invoquer », « Réinvoquer » pour un
// [Légendaire] mort, désactivé avec « Déjà à vos côtés » tant qu'il est vivant (rules.md 11.4).
function SummonButton({ species, owned, onSummon }) {
  const action = summonAction(species, owned);
  return (
    <Button size="sm" disabled={action === 'alreadyOwned'} onClick={onSummon}>
      {TEXT.summonActions[action]}
    </Button>
  );
}

// technical.md 5.1 : en-tête d'accordéon d'une espèce — clic pour ouvrir ou fermer la liste de
// ses individus. `summary` : ce qui s'affiche sous le nom ; `action` : bouton à droite.
// Une espèce sans individu reste affichée, grisée.
function SpeciesAccordion({
  species, owned, open, onToggle, summary, action, children,
}) {
  return (
    <div className="border-2 border-white/30 bg-black/40">
      <div className="flex items-center gap-3 px-3 py-2">
        <button
          type="button"
          onClick={onToggle}
          disabled={owned === 0}
          className={`flex flex-1 items-center gap-3 text-left ${owned === 0 ? 'opacity-50 grayscale' : 'hover:text-white/80'}`}
        >
          <span className="w-3 text-xs">{owned === 0 ? '' : (open ? '▾' : '▸')}</span>
          <span className="retro text-xs w-8 text-right">{owned}x</span>
          <SpeciesSprite species={species} className="size-12" />
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-bold">{unitName(species)}</span>
              <Badge className="text-[10px] mx-1.5">{TEXT.presenceTag(species.cost)}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-y-1">{summary}</div>
          </div>
        </button>
        {action}
      </div>
      {open && owned > 0 && <div className="flex flex-col gap-1 border-t-2 border-white/20 p-2">{children}</div>}
    </div>
  );
}

// Une ligne d'individu : niveau, barre d'XP, puis ce que la section y ajoute (`children`).
function IndividualLine({ unit, faction, children }) {
  return (
    <>
      <LevelBadge level={individualLevel(unit.xp)} faction={faction} />
      <XpBar progress={individualProgress(unit.xp)} faction={faction} className="flex-1" />
      {children}
    </>
  );
}

// Stats complètes de units.md, au niveau de l'individu (rules.md 11.6 : PV et dégâts).
function statRows(species, level) {
  const damage = levelDamage(species.damage, level);
  return [
    [T.stats.hp, levelStat(species.maxHp, level)],
    [T.stats.damage, typeof damage === 'number' ? damage : T.hybridDamage(damage)],
    [T.stats.attackType, T.attackTypes[species.attackType]],
    [T.stats.size, T.size(species.size)],
    [T.stats.moveSpeed, T.moveSpeed(species.moveSpeed)],
    [T.stats.attackSpeed, T.attackSpeed(species.attackSpeed)],
    [T.stats.range, T.range(species.range)],
    [T.stats.cost, TEXT.presenceTag(species.cost)],
  ];
}

// technical.md 5.1 : page de détail d'un individu (vue interne à l'écran) — stats à son niveau,
// XP, présence dans l'armée, aptitudes, et bouton d'invocation de son espèce.
function IndividualDetail({
  unit, species, faction, owned, inArmy, onBack, onSummon,
}) {
  const level = individualLevel(unit.xp);
  return (
    <div className="flex flex-col gap-6 text-sm">
      <div className="flex items-center gap-6">
        <SpeciesSprite species={species} className="size-32" />
        <div className="flex flex-1 flex-col gap-3">
          <span className="retro text-sm">{unitName(species)}</span>
          <div className="flex flex-wrap items-center gap-y-1">
            <LevelBadge level={level} faction={faction} />
            <Keywords species={species} />
          </div>
          <XpBar progress={individualProgress(unit.xp)} faction={faction} />
          <span>{inArmy ? T.inArmyYes : T.inArmyNo}</span>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1">
        {statRows(species, level).map(([label, value]) => (
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
        <SummonButton species={species} owned={owned} onSummon={onSummon} />
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

// technical.md 5.1 : gestion de civilisation, en deux écrans ouverts chacun par son bouton de
// l'accueil (`section`), avec un accordéon par espèce :
// - 'units' (titré du nom de la faction) : individus un par un (clic -> page de détail de
//   l'individu) ; une espèce à 0 garde son bouton Invoquer / Réinvoquer.
// - 'army' (« Armées ») : nom, compteur « X / 500 PP » ; fermé, un résumé ; ouvert, une case
//   « dans l'armée » par individu (rules.md 11.2), sauvegardée à chaque changement.
// Individus triés par niveau puis XP décroissants. `initialSpecies` : accordéon ouvert au retour
// de SummonScreen.
export default function CivilizationScreen({
  playerFaction, section, initialSpecies = null, onBack, onOpenSummon,
}) {
  const [openKey, setOpenKey] = useState(initialSpecies);
  const [selectedId, setSelectedId] = useState(null);
  const [army, setArmy] = useState(getArmy);
  const roster = ROSTERS[playerFaction];
  const units = getOwnedUnits() ?? [];
  const armyIds = new Set(army?.unitIds ?? []);
  const speciesUnits = (key) => sortByLevel(units.filter((unit) => unit.species === key));

  const changeArmy = (newArmy) => {
    saveArmy(newArmy);
    setArmy(newArmy);
  };
  const toggle = (key) => setOpenKey((current) => (current === key ? null : key));

  const selected = units.find((unit) => unit.id === selectedId);
  let content;
  if (selected) {
    content = (
      <IndividualDetail
        unit={selected}
        species={roster[selected.species]}
        faction={playerFaction}
        owned={speciesUnits(selected.species).length}
        inArmy={armyIds.has(selected.id)}
        onBack={() => setSelectedId(null)}
        onSummon={() => onOpenSummon(selected.species)}
      />
    );
  } else if (section === 'army') {
    content = (
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <ArmyName name={army.name} onRename={(name) => changeArmy(renameArmy(army, name))} />
          <span className="retro text-xs">{T.armyCost(armyCost(army, units, roster), ARMY_PP_CAP)}</span>
        </div>
        {Object.entries(roster).map(([key, species]) => {
          const members = speciesUnits(key);
          const inArmy = members.filter((unit) => armyIds.has(unit.id)).length;
          return (
            <SpeciesAccordion
              key={key}
              species={species}
              owned={members.length}
              open={openKey === key}
              onToggle={() => toggle(key)}
              summary={<span>{T.armySummary(inArmy, members.length)}</span>}
            >
              {members.map((unit) => {
                const checked = armyIds.has(unit.id);
                const allowed = checked
                  ? canRemoveFromArmy(army, units, unit.id)
                  : canAddToArmy(army, units, roster, unit.id);
                return (
                  <label key={unit.id} className={`flex items-center gap-2 px-1 ${allowed ? 'cursor-pointer' : 'opacity-50'}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!allowed}
                      onChange={() => changeArmy(checked
                        ? removeFromArmy(army, units, unit.id)
                        : addToArmy(army, units, roster, unit.id))}
                      className="size-4 accent-white"
                    />
                    <IndividualLine unit={unit} faction={playerFaction} />
                  </label>
                );
              })}
            </SpeciesAccordion>
          );
        })}
      </section>
    );
  } else {
    content = (
      <section className="flex flex-col gap-3">
        {Object.entries(roster).map(([key, species]) => {
          const members = speciesUnits(key);
          return (
            <SpeciesAccordion
              key={key}
              species={species}
              owned={members.length}
              open={openKey === key}
              onToggle={() => toggle(key)}
              summary={<Keywords species={species} />}
              action={members.length === 0 && (
                <SummonButton species={species} owned={0} onSummon={() => onOpenSummon(key)} />
              )}
            >
              {members.map((unit) => (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => setSelectedId(unit.id)}
                  className="flex items-center gap-2 px-1 py-0.5 text-left hover:bg-white/10"
                >
                  <IndividualLine unit={unit} faction={playerFaction}>
                    <span className="w-24 text-right text-[10px] text-white/60">
                      {armyIds.has(unit.id) ? T.inArmyTag : ''}
                    </span>
                  </IndividualLine>
                </button>
              ))}
            </SpeciesAccordion>
          );
        })}
      </section>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-8 bg-neutral-900 text-white">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>{section === 'army' ? T.army : TEXT.factions[playerFaction]}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="max-h-[65vh] overflow-y-auto pr-1">{content}</div>
        </CardContent>
      </Card>
      {!selected && <Button onClick={onBack}>{T.back}</Button>}
    </div>
  );
}
