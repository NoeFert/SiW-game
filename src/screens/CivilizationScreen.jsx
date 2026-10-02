import { useState } from 'react';
import { Badge } from '@/components/ui/8bit/badge.jsx';
import { Button } from '@/components/ui/8bit/button.jsx';
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
import ScreenLayout from '../ui/ScreenLayout.jsx';
import { TEXT, keywordLabels, unitName } from '../ui/strings.js';

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
  return keywordLabels(species).map((label) => (
    <Badge key={label} variant="secondary" font="normal" className="text-[10px] mx-1.5">
      {label}
    </Badge>
  ));
}

// Bouton d'invocation d'une espèce (vers SummonScreen) : « Invoquer », « Réinvoquer » pour un
// [Légendaire] mort, désactivé avec « Déjà à vos côtés » tant qu'il est vivant (rules.md 11.4).
function SummonButton({
  species, owned, onSummon, className,
}) {
  const action = summonAction(species, owned);
  return (
    <Button size="sm" disabled={action === 'alreadyOwned'} onClick={onSummon} className={className}>
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

// GRAPHICS.md « Niveaux » : niveau d'un individu dans la couleur de la faction du joueur.
// Classes littérales (Tailwind ne détecte pas les noms construits dynamiquement).
const LEVEL_TEXT_CLASS = {
  wyrms: 'text-faction-wyrms',
  undead: 'text-faction-undead',
};

// GRAPHICS.md « Interface » : la case d'une espèce [Légendaire] a un panneau doré
// (Gold/PanelLarge) et des coins dorés (Decorators/Gold/BorderC, 11×11 à 2×).
const LEGENDARY_CORNERS = [
  ['top-left', 'top-0 left-0'],
  ['top-right', 'top-0 right-0'],
  ['bottom-left', 'bottom-0 left-0'],
  ['bottom-right', 'bottom-0 right-0'],
];

const isLegendary = (species) => species.keywords.includes('legendary');
const legendaryClass = (species) => (isLegendary(species) ? 'pixel-card-gold' : '');

function LegendaryCorners({ species }) {
  if (!isLegendary(species)) return null;
  return LEGENDARY_CORNERS.map(([corner, position]) => (
    <img
      key={corner}
      src={`/ui/legendary-corner-${corner}.png`}
      alt=""
      className={`pixelated pointer-events-none absolute size-5.5 ${position}`}
    />
  ));
}

// Case carrée d'un individu (panneau PanelLarge) : sprite, puis nom et niveau. Clic -> page de
// détail de l'individu.
function UnitTile({
  unit, species, faction, onSelect,
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`pixel-card relative flex aspect-square flex-col items-center justify-center gap-2 text-[10px] hover:brightness-125 ${legendaryClass(species)}`}
    >
      <LegendaryCorners species={species} />
      <SpeciesSprite species={species} className="size-14" />
      <span className="flex flex-col items-center gap-1 text-center leading-tight">
        <span>{unitName(species)}</span>
        <span className={`retro ${LEVEL_TEXT_CLASS[faction]}`}>{TEXT.levels.badge(individualLevel(unit.xp))}</span>
      </span>
    </button>
  );
}

// Case d'une espèce sans individu (ex : [Légendaire] mort) : grisée, avec son bouton Invoquer /
// Réinvoquer (rules.md 11.4).
function EmptySpeciesTile({ species, onSummon }) {
  return (
    <div className={`pixel-card relative flex aspect-square flex-col items-center justify-center gap-2 text-[10px] ${legendaryClass(species)}`}>
      <LegendaryCorners species={species} />
      <SpeciesSprite species={species} className="size-14 opacity-50 grayscale" />
      <span className="text-center leading-tight text-white/50">{unitName(species)}</span>
      <SummonButton species={species} owned={0} onSummon={onSummon} className="px-1 text-[10px]" />
    </div>
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
// XP, présence dans l'armée, aptitudes.
function IndividualDetail({
  unit, species, faction, inArmy,
}) {
  const level = individualLevel(unit.xp);
  return (
    <div className="flex max-w-3xl flex-col gap-6 text-sm">
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
// l'accueil (`section`) :
// - 'units' (titré du nom de la faction) : grille de cases carrées, une par individu (clic ->
//   page de détail de l'individu) ; une espèce à 0 garde une case grisée avec son bouton
//   Invoquer / Réinvoquer.
// - 'army' (« Armées ») : nom, compteur « X / 500 PP », un accordéon par espèce ; fermé, un
//   résumé ; ouvert, une case « dans l'armée » par individu (rules.md 11.2), sauvegardée à
//   chaque changement.
// Individus triés par niveau puis XP décroissants.
export default function CivilizationScreen({
  playerFaction, section, onBack, onOpenSummon,
}) {
  const [openKey, setOpenKey] = useState(null);
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
        inArmy={armyIds.has(selected.id)}
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
      <section className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
        {Object.entries(roster).flatMap(([key, species]) => {
          const members = speciesUnits(key);
          if (members.length === 0) {
            return [<EmptySpeciesTile key={key} species={species} onSummon={() => onOpenSummon(key)} />];
          }
          return members.map((unit) => (
            <UnitTile
              key={unit.id}
              unit={unit}
              species={species}
              faction={playerFaction}
              onSelect={() => setSelectedId(unit.id)}
            />
          ));
        })}
      </section>
    );
  }

  // Sur la page de détail, « Retour » ramène à la grille des unités.
  return (
    <ScreenLayout
      title={section === 'army' ? T.army : TEXT.factions[playerFaction]}
      onBack={selected ? () => setSelectedId(null) : onBack}
    >
      {content}
    </ScreenLayout>
  );
}
