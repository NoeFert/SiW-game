import { useState } from 'react';
import { Menu, X } from 'lucide-react';

// Outil de dev (pas une fonctionnalité joueur) : menu burger fixe en haut à gauche, affiché
// seulement avec `npm run dev` (voir App.jsx). Libellés en dur, hors strings.js : ils ne sont
// jamais montrés au joueur.
export default function DevMenu({ actions }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-2 left-2 z-[100] font-mono text-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded bg-fuchsia-700 px-2 py-1 text-white shadow hover:bg-fuchsia-600"
      >
        {open ? <X size={14} /> : <Menu size={14} />}
        devs
      </button>
      {open && (
        <div className="mt-1 flex flex-col overflow-hidden rounded border border-fuchsia-700 bg-neutral-950 shadow-lg">
          {actions.map(({ label, run }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setOpen(false);
                run();
              }}
              className="px-3 py-1.5 text-left text-white hover:bg-fuchsia-900"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
