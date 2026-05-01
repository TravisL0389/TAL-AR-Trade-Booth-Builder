import { useEffect, useMemo, useRef } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import {
  ArrowRight,
  Boxes,
  Cpu,
  Eye,
  MoveRight,
  Ruler,
  ScanSearch,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate, useOutletContext } from "react-router";

import { BUILDER_TEMPLATES } from "../lib/boothBuilder";
import { PageHeader } from "./PageHeader";
import type { RootOutletContext } from "./Root";

const FEATURE_STEPS = [
  {
    title: "Pick booth size",
    body: "Start from a right-sized footprint and choose a concept tuned for your floor plan.",
    icon: Ruler,
  },
  {
    title: "Place assets",
    body: "Drop counters, media walls, kiosks, seating, and brand markers into a clear spatial plan.",
    icon: Boxes,
  },
  {
    title: "Preview in AR",
    body: "Rehearse the booth in camera or WebXR to validate scale, sightlines, and clearance.",
    icon: Eye,
  },
  {
    title: "Share with client",
    body: "Send a live layout link so stakeholders can review the concept before production.",
    icon: ScanSearch,
  },
];

const TEMPLATE_ART = {
  default: {
    accent: "rgba(34,211,238,0.55)",
    line: "rgba(103,232,249,0.8)",
    glow: "rgba(34,211,238,0.18)",
    label: "Launch Platform",
    category: "Balanced",
  },
  tech: {
    accent: "rgba(56,189,248,0.55)",
    line: "rgba(125,211,252,0.9)",
    glow: "rgba(56,189,248,0.18)",
    label: "Tech Expo",
    category: "Media-rich",
  },
  luxury: {
    accent: "rgba(251,191,36,0.58)",
    line: "rgba(253,224,71,0.9)",
    glow: "rgba(251,191,36,0.18)",
    label: "Luxury Brand",
    category: "Hospitality",
  },
  minimal: {
    accent: "rgba(45,212,191,0.5)",
    line: "rgba(94,234,212,0.9)",
    glow: "rgba(45,212,191,0.16)",
    label: "Minimal Product",
    category: "Editorial",
  },
  showcase: {
    accent: "rgba(251,146,60,0.52)",
    line: "rgba(253,186,116,0.9)",
    glow: "rgba(249,115,22,0.18)",
    label: "Showcase Booth",
    category: "Retail",
  },
} as const;

function TemplateBlueprintCard({
  templateId,
  title,
  category,
  description,
  onOpen,
}: {
  templateId: keyof typeof TEMPLATE_ART;
  title: string;
  category: string;
  description: string;
  onOpen: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-5, 5]);
  const art = TEMPLATE_ART[templateId];

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onOpen}
      onMouseMove={(event) => {
        if (!ref.current) {
          return;
        }
        const rect = ref.current.getBoundingClientRect();
        x.set((event.clientX - rect.left) / rect.width - 0.5);
        y.set((event.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(6,18,28,0.92),rgba(7,11,18,0.96))] p-5 text-left shadow-[0_24px_80px_rgba(0,0,0,0.28)] transition sm:p-6"
    >
      <div
        className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle_at_top_right, ${art.glow}, transparent 50%)` }}
      />
      <div
        className="relative aspect-[16/11] overflow-hidden rounded-[1.35rem] border border-white/10"
        style={{
          background:
            `linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)),` +
            `linear-gradient(90deg, ${art.accent} 0%, rgba(8,13,20,0.92) 100%)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              `linear-gradient(${art.line}22 1px, transparent 1px), linear-gradient(90deg, ${art.line}22 1px, transparent 1px)`,
            backgroundSize: "1.15rem 1.15rem",
          }}
        />
        <div className="absolute inset-x-4 top-4 flex items-center justify-between">
          <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-200">
            {category}
          </span>
          <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-300">
            {templateId}
          </span>
        </div>
        <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="rounded-2xl border border-white/10 bg-black/35 p-2"
              style={{ boxShadow: `inset 0 0 0 1px ${art.line}22` }}
            >
              <div className="h-14 rounded-xl border border-dashed border-white/10 bg-white/[0.03]" />
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-cyan-200/70">
              Spatial Template
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">{title}</h3>
          </div>
          <div
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]"
            style={{ color: art.line }}
          >
            <Boxes className="h-4 w-4" />
          </div>
        </div>
        <p className="text-sm leading-6 text-slate-300">{description}</p>
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-amber-200">
          Open Builder
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </motion.button>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { openAR, setShellConfig } = useOutletContext<RootOutletContext>();

  const shellToolbar = useMemo(
    () => (
      <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
        <Link
          to="/ai"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-amber-300/25 bg-amber-400/12 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/18"
        >
          <Sparkles className="h-4 w-4" />
          Generate with AI
        </Link>
        <button
          type="button"
          onClick={() => navigate({ pathname: "/", hash: "#template-gallery" })}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/[0.08]"
        >
          <Boxes className="h-4 w-4 text-cyan-300" />
          Pick Template
        </button>
        <Link
          to="/builder/default"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-teal-300/25 bg-teal-400/12 px-4 py-2 text-sm font-semibold text-teal-100 transition hover:bg-teal-400/18"
        >
          <MoveRight className="h-4 w-4" />
          Start Builder
        </Link>
      </div>
    ),
    [navigate],
  );

  const mobileQuickActions = useMemo(
    () => (
      <div className="grid grid-cols-2 gap-2">
        <Link
          to="/ai"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950"
        >
          <Sparkles className="h-4 w-4" />
          AI
        </Link>
        <Link
          to="/builder/default"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-teal-300/25 bg-teal-400/14 px-4 py-3 text-sm font-semibold text-teal-100"
        >
          <Boxes className="h-4 w-4" />
          Builder
        </Link>
      </div>
    ),
    [],
  );

  useEffect(() => {
    setShellConfig({
      currentTemplateId: "default",
      contextMeta: (
        <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,28,42,0.9),rgba(8,12,20,0.8))] px-4 py-3">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
            Client-ready AR planning
          </p>
          <p className="mt-1 text-sm text-slate-200">
            Build booth layouts, validate them in AR, and move from concept to client handoff in one flow.
          </p>
        </div>
      ),
      toolbarContent: shellToolbar,
      drawerContent: shellToolbar,
      quickActions: mobileQuickActions,
    });

    return () => setShellConfig(null);
  }, [mobileQuickActions, setShellConfig, shellToolbar]);

  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(45,212,191,0.14),transparent_24%),linear-gradient(180deg,#07131d_0%,#070b12_55%,#06080f_100%)]">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(103,232,249,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.07) 1px, transparent 1px)",
            backgroundSize: "3rem 3rem",
            maskImage: "linear-gradient(180deg, rgba(255,255,255,0.9), transparent 85%)",
          }}
        />
      </div>

      <div className="mx-auto flex w-full max-w-[var(--content-max-width)] flex-col gap-8 px-[var(--page-gutter)] py-6 pb-28 lg:py-8 lg:pb-10">
        <PageHeader
          eyebrow="AR Trade Show Planning"
          title="Design the booth like a blueprint. Rehearse it like a live install."
          description="Spatial Booth Studio gives your team one premium environment for concepting layouts, placing assets, validating scale, and opening the exact plan in AR before a single panel is built."
          actions={
            <>
              <button
                type="button"
                onClick={() => openAR()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-400/12 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/18"
              >
                <Eye className="h-4 w-4" />
                Open AR Preview
              </button>
              <Link
                to="/builder/default"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
              >
                <Boxes className="h-4 w-4 text-teal-300" />
                Launch Default Builder
              </Link>
            </>
          }
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(18rem,0.88fr)]">
            <div className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,24,36,0.88),rgba(6,10,18,0.88))] p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cyan-100">
                  Blueprint Hero
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-300">
                  3D floor planning
                </span>
              </div>
              <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 sm:p-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["20 x 20", "Footprint"],
                    ["8 assets", "Placements"],
                    ["AR", "Validation"],
                    ["Live link", "Client share"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                      <p className="text-lg font-semibold text-white">{value}</p>
                      <p className="mt-1 text-[0.72rem] uppercase tracking-[0.22em] text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 aspect-[16/9] overflow-hidden rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(3,18,29,0.98),rgba(7,12,20,0.98))] p-4">
                  <div className="grid h-full grid-cols-[1fr_1.2fr_0.85fr] gap-3">
                    <div className="rounded-[1.1rem] border border-dashed border-cyan-300/20 bg-cyan-400/8" />
                    <div className="rounded-[1.1rem] border border-cyan-300/20 bg-white/[0.03] p-3">
                      <div className="grid h-full grid-cols-3 gap-2">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <div key={index} className="rounded-xl border border-white/10 bg-black/20" />
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex-1 rounded-[1.1rem] border border-dashed border-amber-300/25 bg-amber-400/10" />
                      <div className="flex-1 rounded-[1.1rem] border border-white/10 bg-white/[0.03]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {FEATURE_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(6,13,21,0.92),rgba(8,12,18,0.86))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/12 text-cyan-100">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Step {index + 1}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-white">{step.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{step.body}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </PageHeader>

        <section
          id="template-gallery"
          className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(6,11,18,0.92),rgba(5,8,14,0.96))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-6"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-cyan-200/70">
                Template Gallery
              </p>
              <h2 className="mt-2 text-[clamp(1.5rem,3vw,2.5rem)] font-semibold tracking-[-0.03em] text-white">
                Pick a spatial concept and move straight into the working builder.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Each booth concept is tuned for a different event strategy, from immersive tech launches to premium hospitality and high-engagement retail showcases.
              </p>
            </div>
            <Link
              to="/builder/default"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
            >
              View Default Builder
              <MoveRight className="h-4 w-4 text-cyan-300" />
            </Link>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {(["tech", "luxury", "minimal", "showcase"] as const).map((templateId) => {
              const template = BUILDER_TEMPLATES.find((entry) => entry.id === templateId);

              if (!template) {
                return null;
              }

              return (
                <TemplateBlueprintCard
                  key={template.id}
                  templateId={templateId}
                  title={TEMPLATE_ART[templateId].label}
                  category={TEMPLATE_ART[templateId].category}
                  description={template.description}
                  onOpen={() => navigate(`/builder/${template.id}`)}
                />
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
