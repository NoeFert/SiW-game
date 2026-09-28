import { Pointer } from 'lucide-react';
import { Button } from '@/components/ui/8bit/button.jsx';
import {
  Item, ItemActions, ItemContent, ItemDescription,
} from '@/components/ui/8bit/item.jsx';
import { continueTutorial, visibleTutorialStep } from '../logic/tutorial.js';
import { getCanvasRect, gridToScreen } from '../renderConstants.js';
import { useBattle } from './useBattle.js';
import { TEXT } from './strings.js';

const HAND_SIZE = 48;
const HAND_PERIOD_MS = 6500; // durée d'un aller-retour de la main

// Centre à l'écran d'un élément de la tour repéré par `data-tutorial`.
function elementCenter(selector) {
  const rect = document.querySelector(selector)?.getBoundingClientRect();
  return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null;
}

// Cibles possibles de la main, par nom (champ `hand` des étapes, src/data/tutorials.js) :
// position à l'écran, ou null si la cible n'existe pas en ce moment (la main l'ignore).
const HAND_TARGETS = {
  basicUnitRow: () => elementCenter('[data-tutorial="basic-unit"]'),
  basicUnitPresenceTag: () => elementCenter('[data-tutorial="basic-unit"] [data-tutorial="presence-tag"]'),
  presenceGauge: () => elementCenter('[data-tutorial="presence-gauge"]'),
  commandsButton: () => elementCenter('[data-tutorial="commands-button"]'),
  fleeOrder: () => elementCenter('[data-tutorial="order-flee"]'),
  // Centre de la zone de déploiement du joueur (moitié gauche du terrain).
  deploymentZone: (battle, canvasRect) => canvasRect
    && gridToScreen(canvasRect, Math.floor(battle.grid.width / 4), Math.floor(battle.grid.height / 2)),
  playerUnit: (battle, canvasRect) => {
    const unit = battle.units.find((u) => u.faction === 'player' && u.isOnField);
    return canvasRect && unit ? gridToScreen(canvasRect, unit.x, unit.y, unit.size) : null;
  },
};

// Position de la main à l'instant `now` : aller-retour doux entre deux points, ou petit
// tapotement vertical sur un point unique.
function handPosition(targets, now) {
  const phase = (1 - Math.cos((now / HAND_PERIOD_MS) * 2 * Math.PI)) / 2; // 0 -> 1 -> 0
  const [from, to] = targets;
  if (!to) return { x: from.x, y: from.y + phase * 12 };
  return { x: from.x + (to.x - from.x) * phase, y: from.y + (to.y - from.y) * phase };
}

// technical.md 5.5 : overlay du tutoriel, seul élément (avec les tooltips) autorisé par-dessus
// le terrain. Il ne fait qu'afficher l'étape en cours (src/logic/tutorial.js, contenu dans
// src/data/tutorials.js) : message en
// haut du terrain, main qui montre l'action attendue. Il ne capte aucun clic hors du message.
export default function TutorialOverlay() {
  const battle = useBattle(); // re-rendu à chaque frame : la main s'anime avec
  const step = battle && battle.outcome === 'ongoing' ? visibleTutorialStep(battle) : null;
  if (!step) return null;

  const canvasRect = getCanvasRect();
  const targets = (step.hand ?? []).map((name) => HAND_TARGETS[name](battle, canvasRect)).filter(Boolean);
  const hand = targets.length > 0 ? handPosition(targets, performance.now()) : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {canvasRect && (
        <div
          className="absolute flex justify-center px-4"
          style={{ left: canvasRect.left, width: canvasRect.width, top: canvasRect.top + 16 }}
        >
          <Item
            variant="outline"
            className="pointer-events-auto max-w-2xl rounded-none border-4 border-white bg-neutral-950 text-white shadow-[6px_6px_0_#000]"
          >
            <ItemContent>
              <ItemDescription className="line-clamp-none text-xs leading-relaxed text-white">
                {TEXT.tutorial[step.message]}
              </ItemDescription>
            </ItemContent>
            {step.continueButton && (
              <ItemActions>
                <Button size="sm" onClick={() => continueTutorial(battle)}>{TEXT.tutorial.continue}</Button>
              </ItemActions>
            )}
          </Item>
        </div>
      )}

      {hand && (
        // Le bout de l'index de l'icône Pointer est à ~1/3 de sa largeur, en haut.
        <Pointer
          className="absolute fill-white text-black drop-shadow-[2px_2px_0_#000]"
          size={HAND_SIZE}
          style={{ left: hand.x - HAND_SIZE / 3, top: hand.y }}
        />
      )}
    </div>
  );
}
