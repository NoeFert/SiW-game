import { Button } from '@/components/ui/8bit/button.jsx';
import { TEXT } from './strings.js';

// GRAPHICS.md « Interface » : mise en page plein écran des écrans de la couche méta (Partir en
// guerre, unités, Armées, Invocation), comme l'accueil — « Retour » et titre en haut à gauche,
// contenu sur toute la surface restante (défilant si besoin).
export default function ScreenLayout({ title, onBack, children }) {
  return (
    <div className="relative flex h-screen w-screen flex-col gap-6 bg-neutral-900 px-6 pt-4 pb-6 text-white">
      <header className="flex items-center gap-6">
        <Button onClick={onBack}>{TEXT.back}</Button>
        <h1 className="retro text-lg">{title}</h1>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
