// Composant "8bitcn" (https://www.8bitcn.com/r/button.json) — porté à la main en JSX pur.
// La CLI shadcn plante en aval sur la version .tsx du registre (ce projet est en JS, pas TS,
// voir components.json "tsx": false).
// GRAPHICS.md « Interface » : le cadre pixel est le sprite ButtonA du pack Pixel UI & HUD
// (styles/pixel-ui.css) au lieu des bordures dessinées en <span>.
import { Slot } from 'radix-ui';

import { Button as ShadcnButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import '@/components/ui/8bit/styles/retro.css';
import '@/components/ui/8bit/styles/pixel-ui.css';

function Button({
  asChild = false,
  children,
  className,
  font,
  size,
  variant = 'default',
  ...props
}) {
  const framed = variant !== 'ghost' && variant !== 'link';

  return (
    <ShadcnButton
      {...props}
      className={cn(
        'rounded-none relative inline-flex items-center justify-center gap-1.5',
        framed && 'pixel-button bg-transparent hover:bg-transparent text-white active:translate-y-0',
        font !== 'normal' && 'retro',
        className,
      )}
      size={size}
      variant={variant}
      asChild={asChild}
    >
      {asChild ? <Slot.Slottable>{children}</Slot.Slottable> : children}
    </ShadcnButton>
  );
}

export { Button };
