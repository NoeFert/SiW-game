import { useEffect } from 'react';
import { Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/8bit/button.jsx';
import { cn } from '@/lib/utils';
import { togglePlayerPause } from '../logic/battle.js';
import { tutorialAllows } from '../logic/tutorial.js';
import { TEXT } from './strings.js';

// Espace ne doit pas basculer la pause quand le joueur tape du texte, ni pendant une boîte de
// dialogue (confirmation d'abandon).
function isTypingOrInDialog(target) {
  return target.isContentEditable
    || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    || target.closest?.('[role="alertdialog"]');
}

// rules.md 5.2 : interrupteur de la pause principale (⏸ / ▶), pas un menu modal. Le ▶ pulse
// doucement tant que la pause est active. Raccourci : barre Espace.
export default function PauseButton({ battle }) {
  const paused = battle.pause.main;

  useEffect(() => {
    const onKey = (event) => {
      if (event.code !== 'Space' || isTypingOrInDialog(event.target)) return;
      // Empêche aussi un bouton qui aurait le focus d'être "cliqué" par la même touche.
      event.preventDefault();
      if (event.type === 'keydown' && !event.repeat) togglePlayerPause(battle);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, [battle]);

  return (
    <Button
      size="icon"
      onClick={() => togglePlayerPause(battle)}
      disabled={battle.outcome !== 'ongoing' || !tutorialAllows(battle, 'mainPause')}
      aria-label={paused ? TEXT.resume : TEXT.pause}
      title={paused ? TEXT.resume : TEXT.pause}
      className={cn(paused && 'animate-pulse')}
    >
      {paused ? <Play /> : <Pause />}
    </Button>
  );
}
