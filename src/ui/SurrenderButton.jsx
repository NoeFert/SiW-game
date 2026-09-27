import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/8bit/alert-dialog.jsx';
import { surrenderPlayer } from '../logic/battle.js';
import { TEXT } from './strings.js';

// rules.md 8.2 : abandon = défaite, réserves conservées. Disponible en permanence, tutoriel
// compris. BattleScreen navigue vers l'écran de défaite dès que `battle.outcome` change.
// TODO(design) : emplacement provisoire (discret, en haut de la tour à côté de Pause), non
// encore tranché (ui-battle-screen-decisions.md 4).
export default function SurrenderButton({ battle }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger>
        <button
          type="button"
          disabled={battle.outcome !== 'ongoing'}
          className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-red-400"
        >
          {TEXT.surrender}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{TEXT.surrenderTitle}</AlertDialogTitle>
          <AlertDialogDescription>{TEXT.surrenderDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{TEXT.surrenderCancel}</AlertDialogCancel>
          <AlertDialogAction onClick={() => surrenderPlayer(battle)}>{TEXT.surrender}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
