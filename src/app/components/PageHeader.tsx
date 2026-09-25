import type { ReactNode } from "react";

import { cn } from "./ui/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(5,17,28,0.9),rgba(6,10,18,0.88))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl min-w-0">
          {eyebrow ? (
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-cyan-200/70">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-2 text-[clamp(1.7rem,3.4vw,3.2rem)] font-semibold leading-[1.03] tracking-[-0.03em] text-white">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-[0.95rem]">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[14rem]">{actions}</div> : null}
      </div>

      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}
