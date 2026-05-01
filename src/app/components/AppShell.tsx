import { useEffect, useState, type ReactNode } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

import type { RootOutletContext, ShellConfig } from "./Root";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { NavToolsBar } from "./NavToolsBar";

interface AppShellProps {
  shellConfig: ShellConfig | null;
  openAR: RootOutletContext["openAR"];
  setShellConfig: RootOutletContext["setShellConfig"];
}

export function AppShell({ shellConfig, openAR, setShellConfig }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const builderMatch = location.pathname.match(/\/builder\/(.+)/);
  const currentTemplateId = shellConfig?.currentTemplateId || builderMatch?.[1] || "default";

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [location.hash, location.pathname]);

  const contextMeta =
    shellConfig?.contextMeta ??
    (builderMatch ? (
      <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-3">
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
          Active Builder
        </span>
        <span className="truncate text-sm font-semibold text-white">{currentTemplateId}</span>
      </div>
    ) : null);

  return (
    <div className="min-h-[100svh] bg-background text-foreground">
      <NavToolsBar
        currentTemplateId={currentTemplateId}
        currentTemplateName={shellConfig?.currentTemplateName}
        onTemplatesClick={() => navigate({ pathname: "/", hash: "#template-gallery" })}
        onOpenAR={() => openAR(shellConfig?.arPayload)}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        contextMeta={contextMeta}
        toolbarContent={shellConfig?.toolbarContent}
      />

      <main className="relative min-h-[calc(100svh-5rem)]">
        <Outlet context={{ openAR, setShellConfig }} />
      </main>

      <MobileNavDrawer
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        currentTemplateId={currentTemplateId}
        onTemplatesClick={() => navigate({ pathname: "/", hash: "#template-gallery" })}
        onOpenAR={() => openAR(shellConfig?.arPayload)}
        contextContent={shellConfig?.drawerContent ?? contextMeta}
      />

      {shellConfig?.quickActions ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 lg:hidden">
          <div className="pointer-events-auto mx-auto max-w-[var(--content-max-width)] rounded-[1.65rem] border border-white/10 bg-[linear-gradient(180deg,rgba(5,15,24,0.94),rgba(6,10,18,0.96))] p-2 shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
            {shellConfig.quickActions}
          </div>
        </div>
      ) : null}
    </div>
  );
}
