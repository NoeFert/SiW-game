import { cn } from "@/lib/utils";

import "@/components/ui/8bit/styles/retro.css";
import "@/components/ui/8bit/styles/pixel-ui.css";

// GRAPHICS.md « Interface » : bannière du pack Pixel UI & HUD (styles/pixel-ui.css).
// `variant` : "default" (bannière à liseré blanc), "secondary" (liseré gris), ou la faction
// du joueur, "wyrms" / "undead" (badges de niveau).
function Badge({
  children,
  className,
  font,
  variant = "default",
  ...props
}) {
  return (
    <span
      {...props}
      data-slot="badge"
      data-variant={variant}
      className={cn(
        "pixel-badge inline-flex w-fit shrink-0 items-center justify-center gap-1 text-xs whitespace-nowrap",
        font !== "normal" && "retro",
        className
      )}
    >
      {children}
    </span>
  );
}

export { Badge };
