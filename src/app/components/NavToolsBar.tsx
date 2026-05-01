import type { ReactNode } from "react";
import { Link, NavLink } from "react-router";
import { Boxes, LayoutDashboard, Menu, Sparkles, View } from "lucide-react";

import { cn } from "./ui/utils";

interface NavToolsBarProps {
  currentTemplateId: string;
  currentTemplateName?: string;
  onTemplatesClick: () => void;
  onOpenAR: () => void;
  onOpenMobileMenu: () => void;
  contextMeta?: ReactNode;
  toolbarContent?: ReactNode;
}

function navLinkClass(active: boolean) {
  return cn(
    "inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
    active
      ? "bg-cyan-400/16 text-cyan-100 ring-1 ring-cyan-300/35"
      : "text-slate-300 hover:bg-white/[0.05] hover:text-white",
  );
}

export function NavToolsBar({
  currentTemplateId,
  currentTemplateName,
  onTemplatesClick,
  onOpenAR,
  onOpenMobileMenu,
  contextMeta,
  toolbarContent,
}: NavToolsBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[linear-gradient(180deg,rgba(4,14,22,0.88),rgba(6,10,18,0.74))] backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-[var(--content-max-width)] flex-col gap-4 px-[var(--page-gutter)] py-3 lg:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.08] lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/" className="group flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(36,187,255,0.18),rgba(18,216,201,0.1))] text-cyan-100 shadow-[0_0_0_1px_rgba(125,211,252,0.18),0_18px_36px_rgba(0,0,0,0.24)]">
                <Boxes className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-cyan-200/70">
                  TAL Spatial Planning
                </p>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white sm:text-base">Spatial Booth Studio</p>
                  {currentTemplateName ? (
                    <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-300 md:inline-flex">
                      {currentTemplateName}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <NavLink to="/" className={({ isActive }) => navLinkClass(isActive)}>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </NavLink>
            <NavLink to="/ai" className={({ isActive }) => navLinkClass(isActive)}>
              <Sparkles className="h-4 w-4" />
              AI Generator
            </NavLink>
            <NavLink
              to={`/builder/${currentTemplateId || "default"}`}
              className={({ isActive }) => navLinkClass(isActive)}
            >
              <Boxes className="h-4 w-4" />
              Builder
            </NavLink>
            <button type="button" onClick={onTemplatesClick} className={navLinkClass(false)}>
              <Boxes className="h-4 w-4" />
              Templates
            </button>
            <button
              type="button"
              onClick={onOpenAR}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-teal-300/25 bg-teal-400/12 px-4 py-2 text-sm font-semibold text-teal-100 transition hover:bg-teal-400/18"
            >
              <View className="h-4 w-4" />
              AR Preview
            </button>
          </div>
        </div>

        {contextMeta || toolbarContent ? (
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {contextMeta ? <div className="min-w-0">{contextMeta}</div> : <div />}
            {toolbarContent ? <div className="hidden min-w-0 lg:block">{toolbarContent}</div> : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
