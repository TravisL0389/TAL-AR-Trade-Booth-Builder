import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Cpu, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BoothItem, BuilderCategory } from "../lib/boothBuilder";

interface Suggestion {
  id: string;
  title: string;
  body: string;
  actionLabel: string;
  category?: BuilderCategory;
  opensAr?: boolean;
  tone: "violet" | "blue" | "emerald" | "amber";
}

const SUGGESTIONS: Suggestion[] = [
  {
    id: "seating",
    title: "Start with traffic anchors",
    body: "Add a chair or meeting surface first so the visitor flow has a clear center of gravity.",
    actionLabel: "Open Seating",
    category: "seating",
    tone: "violet",
  },
  {
    id: "branding",
    title: "You need a long-range visual cue",
    body: "A banner or media wall will make the booth recognizable from the aisle before visitors arrive.",
    actionLabel: "Show Branding",
    category: "branding",
    tone: "amber",
  },
  {
    id: "media",
    title: "Digital touchpoints drive dwell time",
    body: "Kiosks and LED surfaces create a stronger reason to pause and explore during busy hours.",
    actionLabel: "Browse Media",
    category: "media",
    tone: "blue",
  },
  {
    id: "ar",
    title: "This layout is ready for spatial validation",
    body: "Open the AR rehearsal flow to test scale, clearances, and booth orientation before deployment.",
    actionLabel: "Open AR",
    opensAr: true,
    tone: "emerald",
  },
];

const TONE_STYLES = {
  violet: {
    glow: "rgba(139,92,246,0.4)",
    accent: "from-violet-500/85",
    button: "bg-violet-500/18 text-violet-200",
    text: "text-violet-300",
  },
  blue: {
    glow: "rgba(96,165,250,0.4)",
    accent: "from-blue-500/85",
    button: "bg-blue-500/18 text-blue-200",
    text: "text-blue-300",
  },
  emerald: {
    glow: "rgba(52,211,153,0.4)",
    accent: "from-emerald-500/85",
    button: "bg-emerald-500/18 text-emerald-200",
    text: "text-emerald-300",
  },
  amber: {
    glow: "rgba(245,158,11,0.4)",
    accent: "from-amber-500/85",
    button: "bg-amber-500/18 text-amber-200",
    text: "text-amber-300",
  },
} as const;

interface SmartAssistantProps {
  items: BoothItem[];
  onOpenCategory: (category: BuilderCategory) => void;
  onOpenAR: () => void;
}

export function SmartAssistant({ items, onOpenCategory, onOpenAR }: SmartAssistantProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [visibleSuggestion, setVisibleSuggestion] = useState<Suggestion | null>(null);

  const suggestion = useMemo(() => {
    const hasType = (prefix: string) => items.some((item) => item.type === prefix);
    const hasSeating = hasType("chair") || hasType("table");
    const hasBranding = hasType("banner");
    const hasMedia = hasType("screen") || hasType("kiosk");

    if (!hasSeating && !dismissed.includes("seating")) {
      return SUGGESTIONS[0];
    }

    if (hasSeating && !hasBranding && !dismissed.includes("branding")) {
      return SUGGESTIONS[1];
    }

    if (items.length >= 2 && !hasMedia && !dismissed.includes("media")) {
      return SUGGESTIONS[2];
    }

    if (items.length >= 4 && !dismissed.includes("ar")) {
      return SUGGESTIONS[3];
    }

    return null;
  }, [dismissed, items]);

  useEffect(() => {
    setVisibleSuggestion(suggestion);
  }, [suggestion]);

  if (!visibleSuggestion) {
    return null;
  }

  const tone = TONE_STYLES[visibleSuggestion.tone];

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-40 sm:inset-x-4 sm:bottom-4 md:left-auto md:right-6 md:w-[min(22rem,calc(100vw-2rem))]">
      <AnimatePresence mode="wait">
        <motion.div
          key={visibleSuggestion.id}
          initial={{ opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.94 }}
          transition={{ duration: 0.28 }}
          className="pointer-events-auto rounded-[28px] border border-white/10 bg-black/50 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
        >
          <div className={`absolute left-0 top-0 h-full w-1.5 rounded-l-[28px] bg-gradient-to-b ${tone.accent} to-transparent`} />
          <div className="flex items-start justify-between gap-4 p-5 pl-6">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/45">
                <Sparkles className={`h-3.5 w-3.5 ${tone.text}`} />
                AI Assistant
              </div>
              <p className="text-sm font-semibold text-white">{visibleSuggestion.title}</p>
              <p className="mt-2 text-sm leading-6 text-white/55">{visibleSuggestion.body}</p>
              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  if (visibleSuggestion.opensAr) {
                    onOpenAR();
                  } else if (visibleSuggestion.category) {
                    onOpenCategory(visibleSuggestion.category);
                  }
                  setDismissed((current) => [...current, visibleSuggestion.id]);
                }}
                className={`mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold ${tone.button}`}
              >
                {visibleSuggestion.actionLabel}
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </div>

            <div className="flex flex-col items-end gap-3">
              <button
                type="button"
                onClick={() => setDismissed((current) => [...current, visibleSuggestion.id])}
                className="rounded-xl p-1.5 text-white/35 transition hover:bg-white/8 hover:text-white/75"
              >
                <X className="h-4 w-4" />
              </button>
              <motion.div
                animate={{ scale: [1, 1.14, 1], opacity: [0.45, 1, 0.45] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5"
                style={{ boxShadow: `0 0 28px ${tone.glow}` }}
              >
                <Cpu className={`h-5 w-5 ${tone.text}`} />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
