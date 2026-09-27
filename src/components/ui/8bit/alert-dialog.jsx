"use client";;
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

import {
  AlertDialog as ShadcnAlertDialog,
  AlertDialogAction as ShadcnAlertDialogAction,
  AlertDialogCancel as ShadcnAlertDialogCancel,
  AlertDialogContent as ShadcnAlertDialogContent,
  AlertDialogDescription as ShadcnAlertDialogDescription,
  AlertDialogFooter as ShadcnAlertDialogFooter,
  AlertDialogHeader as ShadcnAlertDialogHeader,
  AlertDialogOverlay as ShadcnAlertDialogOverlay,
  AlertDialogPortal as ShadcnAlertDialogPortal,
  AlertDialogTitle as ShadcnAlertDialogTitle,
  AlertDialogTrigger as ShadcnAlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import "@/components/ui/8bit/styles/retro.css";

export const alertDialogVariants = cva("", {
  variants: {
    font: {
      normal: "",
      retro: "retro",
    },
  },
  defaultVariants: {
    font: "retro",
  },
});

function AlertDialog({
  ...props
}) {
  return <ShadcnAlertDialog {...props} />;
}

function AlertDialogTrigger({
  className,
  asChild = true,
  ...props
}) {
  return (
    <ShadcnAlertDialogTrigger
      className={cn(className)}
      asChild={asChild}
      {...props}
    />
  );
}

function AlertDialogPortal({
  ...props
}) {
  return <ShadcnAlertDialogPortal {...props} />;
}

function AlertDialogOverlay({
  className,
  ...props
}) {
  return <ShadcnAlertDialogOverlay className={cn(className)} {...props} />;
}

function AlertDialogContent({
  className,
  children,
  font,
  ...props
}) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <>
        <ShadcnAlertDialogContent
          className={cn(
            "rounded-none border-y-6 border-foreground dark:border-ring",
            font !== "normal" && "retro",
            className
          )}
          {...props}
        >
          {children}

          <div
            className="absolute inset-0 border-x-6 -mx-1.5 border-foreground dark:border-ring pointer-events-none"
            aria-hidden="true"
          />
        </ShadcnAlertDialogContent>
      </>
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({
  className,
  ...props
}) {
  return <ShadcnAlertDialogHeader className={cn(className)} {...props} />;
}

function AlertDialogFooter({
  className,
  ...props
}) {
  return (
    <ShadcnAlertDialogFooter
      className={cn("flex flex-col-reverse sm:flex-row gap-4", className)}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}) {
  return <ShadcnAlertDialogTitle className={cn(className)} {...props} />;
}

function AlertDialogDescription({
  className,
  ...props
}) {
  return <ShadcnAlertDialogDescription className={cn(className)} {...props} />;
}

function AlertDialogAction({
  className,
  ...props
}) {
  return (
    <ShadcnAlertDialogAction
      className={cn(
        "rounded-none active:translate-y-1 transition-transform relative bg-primary",
        "ring-0 border-none",
        className
      )}
      {...props}
    >
      {props.children}
      {/* Pixelated border */}
      <div className="absolute -top-1.5 w-1/2 left-1.5 h-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute -top-1.5 w-1/2 right-1.5 h-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute -bottom-1.5 w-1/2 left-1.5 h-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute -bottom-1.5 w-1/2 right-1.5 h-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute top-0 left-0 size-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute top-0 right-0 size-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute bottom-0 left-0 size-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute bottom-0 right-0 size-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute top-1.5 -left-1.5 h-2/3 w-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute top-1.5 -right-1.5 h-2/3 w-1.5 bg-foreground dark:bg-ring" />
      {/* Top shadow */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-foreground/20" />
      <div className="absolute top-1.5 left-0 w-3 h-1.5 bg-foreground/20" />
      {/* Bottom shadow */}
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-foreground/20" />
      <div className="absolute bottom-1.5 right-0 w-3 h-1.5 bg-foreground/20" />
    </ShadcnAlertDialogAction>
  );
}

function AlertDialogCancel({
  className,
  ...props
}) {
  return (
    <ShadcnAlertDialogCancel
      className={cn(
        "rounded-none active:translate-y-1 transition-transform relative bg-background",
        "ring-0 border-none",
        className
      )}
      {...props}
    >
      {props.children}
      <div className="absolute -top-1.5 w-1/2 left-1.5 h-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute -top-1.5 w-1/2 right-1.5 h-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute -bottom-1.5 w-1/2 left-1.5 h-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute -bottom-1.5 w-1/2 right-1.5 h-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute top-0 left-0 size-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute top-0 right-0 size-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute bottom-0 left-0 size-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute bottom-0 right-0 size-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute top-1.5 -left-1.5 h-2/3 w-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute top-1.5 -right-1.5 h-2/3 w-1.5 bg-foreground dark:bg-ring" />
    </ShadcnAlertDialogCancel>
  );
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
