import type { ReactNode } from "react";
import { Link } from "react-router";
import { Boxes, LayoutDashboard, Sparkles, View } from "lucide-react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";

interface MobileNavDrawerProps {
  currentTemplateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplatesClick: () => void;
  onOpenAR: () => void;
  contextContent?: ReactNode;
}

export function MobileNavDrawer({
  currentTemplateId,
  open,
  onOpenChange,
  onTemplatesClick,
  onOpenAR,
  contextContent,
}: MobileNavDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="border-white/10 bg-[linear-gradient(180deg,rgba(4,16,24,0.98),rgba(7,10,18,0.98))] p-0 text-white"
      >
        <SheetHeader className="border-b border-white/10 px-5 py-5 text-left">
          <SheetTitle className="text-left text-white">Spatial Booth Studio</SheetTitle>
          <SheetDescription className="text-left text-slate-300/70">
            Navigate the planner, launch AI generation, jump into the builder, or open AR rehearsal.
          </SheetDescription>
        </SheetHeader>

        <div className="flex h-full flex-col gap-6 overflow-y-auto px-5 py-5">
          <div className="grid gap-3">
            <Link
              to="/"
              onClick={() => onOpenChange(false)}
              className="inline-flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/85 transition hover:bg-white/[0.08]"
            >
              <LayoutDashboard className="h-4 w-4 text-cyan-300" />
              Dashboard
            </Link>
            <Link
              to="/ai"
              onClick={() => onOpenChange(false)}
              className="inline-flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/85 transition hover:bg-white/[0.08]"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              AI Generator
            </Link>
            <Link
              to={`/builder/${currentTemplateId || "default"}`}
              onClick={() => onOpenChange(false)}
              className="inline-flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/85 transition hover:bg-white/[0.08]"
            >
              <Boxes className="h-4 w-4 text-teal-300" />
              Builder
            </Link>
            <button
              type="button"
              onClick={() => {
                onTemplatesClick();
                onOpenChange(false);
              }}
              className="inline-flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-medium text-white/85 transition hover:bg-white/[0.08]"
            >
              <Boxes className="h-4 w-4 text-cyan-300" />
              Templates
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenAR();
                onOpenChange(false);
              }}
              className="inline-flex min-h-12 items-center gap-3 rounded-2xl border border-teal-400/25 bg-teal-400/10 px-4 py-3 text-left text-sm font-medium text-teal-100 transition hover:bg-teal-400/16"
            >
              <View className="h-4 w-4" />
              AR Preview
            </button>
          </div>

          {contextContent ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">{contextContent}</div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
