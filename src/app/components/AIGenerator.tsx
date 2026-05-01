import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "motion/react";
import { useNavigate, useOutletContext } from "react-router";
import {
  Sparkles, Mic, Send, Eye, Wand2, Sliders,
  CheckCircle2, ArrowRight, Activity, Zap, Command,
  RefreshCw, ChevronRight, LayoutGrid, TrendingUp, Users, Target,
  MicOff, Star, Shield, Cpu, Globe,
  Maximize2, BarChart3, MousePointer, Lightbulb, Boxes
} from "lucide-react";
import { PageHeader } from "./PageHeader";
import type { RootOutletContext } from "./Root";
import { createProjectFromTemplate } from "../lib/boothBuilder";

// ─── Types ────────────────────────────────────────────────────────────────────

type BoothTheme = "empty" | "tech" | "luxury" | "nature" | "minimal" | "neon";
type AppMode = "chat" | "auto" | "optimize";

function resolveBuilderTemplateId(theme: BoothTheme) {
  switch (theme) {
    case "tech":
      return "tech";
    case "luxury":
      return "luxury";
    case "minimal":
      return "minimal";
    case "nature":
      return "showcase";
    case "neon":
      return "tech";
    case "empty":
    default:
      return "default";
  }
}

interface MessageChip {
  label: string;
  prompt: string;
}

interface AIMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  bullets?: string[];
  chips?: MessageChip[];
  timestamp: Date;
}

interface BoothPreset {
  id: BoothTheme;
  label: string;
  description: string;
  gradient: string;
  accent: string;
  tags: string[];
  confidence: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESETS: BoothPreset[] = [
  {
    id: "tech",
    label: "Tech Nexus",
    description: "High-contrast LED walls, curved displays, modular zones",
    gradient: "from-cyan-500/30 to-sky-500/25",
    accent: "#22d3ee",
    tags: ["Interactive", "Futuristic", "LED"],
    confidence: 87,
  },
  {
    id: "luxury",
    label: "Prestige Suite",
    description: "Warm marble surfaces, ambient gold lighting, VIP lounge",
    gradient: "from-amber-600/30 to-orange-600/30",
    accent: "#f59e0b",
    tags: ["Premium", "Exclusive", "Elegant"],
    confidence: 92,
  },
  {
    id: "nature",
    label: "Biophilic Space",
    description: "Living walls, natural wood, soft daylight simulation",
    gradient: "from-emerald-600/30 to-teal-600/30",
    accent: "#10b981",
    tags: ["Eco", "Organic", "Calm"],
    confidence: 79,
  },
  {
    id: "minimal",
    label: "Clean Slate",
    description: "Matte white surfaces, micro typography, focused messaging",
    gradient: "from-slate-600/30 to-zinc-600/30",
    accent: "#94a3b8",
    tags: ["Minimal", "Bold", "Focus"],
    confidence: 83,
  },
  {
    id: "neon",
    label: "Cyberpunk Rave",
    description: "UV reactive panels, holographic displays, gradient fog",
    gradient: "from-fuchsia-500/20 to-cyan-500/20",
    accent: "#f472b6",
    tags: ["Statement", "Bold", "Energy"],
    confidence: 94,
  },
];

const INITIAL_MESSAGES: AIMessage[] = [
  {
    id: "0",
    sender: "ai",
    text: "Welcome to Spatial Co-Designer. I'm your AI booth architect — I'll help you create a trade show presence that stops people mid-aisle.",
    bullets: [
      "Describe your brand, product, or audience",
      "Or pick a style to start instantly",
      "I'll adapt in real-time as you refine",
    ],
    chips: [
      { label: "Make it more luxury", prompt: "Make it more luxury" },
      { label: "Add LED walls", prompt: "Add LED walls" },
      { label: "Increase engagement zones", prompt: "Increase engagement zones" },
    ],
    timestamp: new Date(),
  },
];

const AI_RESPONSES: Record<string, { text: string; bullets?: string[]; theme?: BoothTheme; confidence?: number; chips?: MessageChip[] }> = {
  luxury: {
    text: "I've elevated the material palette across all surfaces. The redesigned booth now commands attention with understated opulence.",
    bullets: [
      "Carrara marble-finish reception counter",
      "Warm amber LED perimeter lighting",
      "VIP lounge zone with premium seating",
      "Engraved brand statement wall",
    ],
    theme: "luxury",
    confidence: 92,
    chips: [
      { label: "Add a private meeting room", prompt: "Add a private meeting room" },
      { label: "More dramatic lighting", prompt: "More dramatic lighting" },
      { label: "Champagne bar zone", prompt: "Add a champagne bar zone" },
    ],
  },
  led: {
    text: "LED wall system integrated across the full back wall and both side panels. The result is an immersive media canvas with dynamic content zones.",
    bullets: [
      "Full-height 8K LED back wall (24' × 12')",
      "Side wing accent panels with motion graphics",
      "Interactive touch zones for product demos",
      "Dynamic content scheduling system",
    ],
    theme: "tech",
    confidence: 89,
    chips: [
      { label: "Add motion graphics", prompt: "Add motion graphics to the LED walls" },
      { label: "Interactive product demos", prompt: "Add interactive product demo stations" },
      { label: "Reduce to accent strips", prompt: "Reduce LED to accent strip lighting" },
    ],
  },
  engagement: {
    text: "I've restructured the floor plan to maximize visitor flow and dwell time. Multiple touchpoints now draw people deeper into the space.",
    bullets: [
      "Open invitation entry arch (no barriers)",
      "3 distinct engagement pods for demos",
      "Social photo moment corner with ring lighting",
      "Hidden back-of-house team zone",
    ],
    theme: "tech",
    confidence: 95,
    chips: [
      { label: "Add gamification", prompt: "Add gamification elements" },
      { label: "Optimize traffic flow", prompt: "Optimize the traffic flow" },
      { label: "Add product showcase", prompt: "Add a product showcase zone" },
    ],
  },
  default: {
    text: "I've generated a contemporary layout balancing visual impact with functional flow. Your brand story unfolds naturally as visitors move through the space.",
    bullets: [
      "Hero brand moment at the entrance",
      "Product demo stations along the sides",
      "Seating area for deeper conversations",
      "Digital touchpoints throughout",
    ],
    theme: "tech",
    confidence: 84,
    chips: [
      { label: "Make it more luxury", prompt: "Make it more luxury" },
      { label: "Add LED walls", prompt: "Add LED walls" },
      { label: "Increase engagement zones", prompt: "Increase engagement zones" },
    ],
  },
};

// ─── Optimize Metrics ────────────────────────────────────────────────────────

const OPTIMIZE_METRICS = [
  { label: "Visitor Engagement", value: 87, color: "#22d3ee", icon: <Users className="w-3.5 h-3.5" /> },
  { label: "Brand Recall", value: 74, color: "#14b8a6", icon: <Target className="w-3.5 h-3.5" /> },
  { label: "Lead Capture Rate", value: 91, color: "#10b981", icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { label: "Spatial Flow", value: 68, color: "#f59e0b", icon: <MousePointer className="w-3.5 h-3.5" /> },
];

const OPTIMIZE_SUGGESTIONS = [
  { icon: <Lightbulb className="w-3.5 h-3.5 text-amber-400" />, text: "Move the counter 4ft forward to improve approach angle", impact: "+12% engagement" },
  { icon: <Globe className="w-3.5 h-3.5 text-blue-400" />, text: "Add a secondary visual anchor on the left side panel", impact: "+8% dwell time" },
  { icon: <Shield className="w-3.5 h-3.5 text-emerald-400" />, text: "Increase the brightness of your brand mark by 20%", impact: "+15% brand recall" },
];

// ─── Animated Confidence Ring ───────────────────────────────��─────────────────

function ConfidenceRing({ value, color = "#22d3ee" }: { value: number; color?: string }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-16 h-16">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 72 72" fill="none">
        <circle cx="36" cy="36" r={radius} stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
        <motion.circle
          cx="36" cy="36" r={radius}
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="flex flex-col items-center">
        <motion.span
          className="text-[13px] font-bold text-white tabular-nums"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {value}%
        </motion.span>
      </div>
    </div>
  );
}

// ─── Booth 3D Preview ─────────────────────────────────────────────────────────

function BoothPreview3D({ boothState, isGenerating }: { boothState: BoothTheme; isGenerating: boolean }) {
  const preset = PRESETS.find(p => p.id === boothState);
  const accent = preset?.accent ?? "#22d3ee";

  const colors = {
    empty: { wall: "rgba(255,255,255,0.03)", led: "#22d3ee", floor: "rgba(255,255,255,0.02)", glow: "rgba(34,211,238,0.15)" },
    tech: { wall: "rgba(10,15,40,0.8)", led: "#22d3ee", floor: "rgba(34,211,238,0.05)", glow: "rgba(34,211,238,0.25)" },
    luxury: { wall: "rgba(20,12,5,0.85)", led: "#f59e0b", floor: "rgba(245,158,11,0.06)", glow: "rgba(245,158,11,0.2)" },
    nature: { wall: "rgba(5,20,12,0.8)", led: "#10b981", floor: "rgba(16,185,129,0.06)", glow: "rgba(16,185,129,0.2)" },
    minimal: { wall: "rgba(15,15,20,0.9)", led: "#94a3b8", floor: "rgba(148,163,184,0.04)", glow: "rgba(148,163,184,0.15)" },
    neon: { wall: "rgba(20,5,25,0.85)", led: "#ec4899", floor: "rgba(236,72,153,0.07)", glow: "rgba(236,72,153,0.25)" },
  };

  const c = colors[boothState];

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden px-2 py-4 sm:px-4">

      {/* Scanning overlay when generating */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-[28px]"
          >
            <motion.div
              className="absolute inset-x-0 h-[2px] blur-[1px]"
              style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, boxShadow: `0 0 20px ${accent}` }}
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] rounded-[28px]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center"
                  style={{ background: `radial-gradient(circle, ${accent}20, transparent)`, borderColor: `${accent}40` }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Cpu className="w-7 h-7" style={{ color: accent }} />
                  </motion.div>
                </div>
                <span className="text-[11px] font-bold tracking-widest uppercase text-white/60">Generating spatial layout…</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The 3D Scene */}
      <div
        className="relative h-[380px] w-[560px] shrink-0 origin-center scale-[0.56] sm:scale-[0.72] lg:scale-[0.86] xl:scale-100"
        style={{ perspective: "1200px" }}
      >

        {/* Floor platform */}
        <motion.div
          animate={{ opacity: boothState === "empty" ? 0.3 : 0.8 }}
          transition={{ duration: 1 }}
          className="absolute"
          style={{
            bottom: 20,
            left: "50%",
            width: 480,
            height: 200,
            transform: "translateX(-50%) rotateX(60deg)",
            transformOrigin: "bottom center",
            background: `radial-gradient(ellipse at center, ${c.floor}, transparent 70%)`,
            border: `1px solid ${c.led}20`,
            borderRadius: 20,
          }}
        >
          {/* Floor grid lines */}
          <div className="absolute inset-0 rounded-[20px] overflow-hidden opacity-40"
            style={{
              backgroundImage: `linear-gradient(${c.led}30 1px, transparent 1px), linear-gradient(90deg, ${c.led}30 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
        </motion.div>

        {/* Glow under booth */}
        <AnimatePresence mode="wait">
          <motion.div
            key={boothState}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.6, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[100px] blur-[60px] rounded-full pointer-events-none"
            style={{ background: c.glow }}
          />
        </AnimatePresence>

        {/* Booth Structure */}
        <AnimatePresence mode="wait">
          {boothState !== "empty" && (
            <motion.div
              key={boothState}
              initial={{ opacity: 0, y: 60, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.9, type: "spring", bounce: 0.15 }}
              className="absolute"
              style={{ bottom: 60, left: "50%", transform: "translateX(-50%)", width: 400 }}
            >

              {/* Back Wall */}
              <div
                className="absolute bottom-0 left-0 right-0 rounded-3xl overflow-hidden"
                style={{
                  height: 240,
                  background: c.wall,
                  border: `1px solid ${c.led}25`,
                  boxShadow: `0 0 80px ${c.glow}, inset 0 0 60px ${c.led}10`,
                }}
              >
                {/* LED Bar Top */}
                <motion.div
                  className="absolute top-0 inset-x-0 h-1 rounded-t-3xl"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  style={{ background: `linear-gradient(90deg, transparent, ${c.led}, transparent)`, boxShadow: `0 0 15px ${c.led}` }}
                />

                {/* Content Area */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">

                  {/* Screen / Display */}
                  <motion.div
                    className="w-full rounded-2xl flex items-center justify-center overflow-hidden"
                    style={{
                      height: 120,
                      background: `linear-gradient(135deg, ${c.led}15, rgba(255,255,255,0.03))`,
                      border: `1px solid ${c.led}30`,
                    }}
                    animate={{ boxShadow: [`0 0 20px ${c.led}20`, `0 0 40px ${c.led}40`, `0 0 20px ${c.led}20`] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    {/* Screen content by theme */}
                    {boothState === "tech" && (
                      <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0" style={{
                          backgroundImage: `linear-gradient(${c.led}15 1px, transparent 1px), linear-gradient(90deg, ${c.led}15 1px, transparent 1px)`,
                          backgroundSize: "20px 20px",
                        }} />
                        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 3, repeat: Infinity }}>
                          <Boxes className="w-10 h-10" style={{ color: c.led, filter: `drop-shadow(0 0 12px ${c.led})` }} />
                        </motion.div>
                      </div>
                    )}
                    {boothState === "luxury" && (
                      <div className="w-full h-full flex items-center justify-center">
                        <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 4, repeat: Infinity }}>
                          <Star className="w-10 h-10" style={{ color: c.led, filter: `drop-shadow(0 0 12px ${c.led})` }} />
                        </motion.div>
                      </div>
                    )}
                    {boothState === "nature" && (
                      <div className="w-full h-full flex items-center justify-center">
                        <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 4, repeat: Infinity }}>
                          <Globe className="w-10 h-10" style={{ color: c.led, filter: `drop-shadow(0 0 12px ${c.led})` }} />
                        </motion.div>
                      </div>
                    )}
                    {(boothState === "minimal" || boothState === "neon") && (
                      <div className="w-full h-full flex items-center justify-center">
                        <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
                          <Sparkles className="w-10 h-10" style={{ color: c.led, filter: `drop-shadow(0 0 12px ${c.led})` }} />
                        </motion.div>
                      </div>
                    )}
                  </motion.div>

                  {/* Brand line */}
                  <motion.div
                    className="h-px w-3/4 rounded-full"
                    style={{ background: `linear-gradient(90deg, transparent, ${c.led}60, transparent)` }}
                  />
                  <div className="flex gap-3 opacity-60">
                    {[50, 80, 60].map((w, i) => (
                      <div key={i} className="h-1.5 rounded-full" style={{ width: w, background: c.led, opacity: 0.4 + i * 0.1 }} />
                    ))}
                  </div>
                </div>

                {/* Corner accent lights */}
                {["top-3 left-3", "top-3 right-3"].map((pos, i) => (
                  <motion.div
                    key={i}
                    className={`absolute ${pos} w-1.5 h-1.5 rounded-full`}
                    style={{ background: c.led, boxShadow: `0 0 8px ${c.led}` }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                  />
                ))}
              </div>

              {/* Reception Counter */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="absolute -bottom-16 left-1/2 -translate-x-1/2"
                style={{ width: 180 }}
              >
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    height: 70,
                    background: `linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))`,
                    border: `1px solid ${c.led}25`,
                    boxShadow: `0 10px 40px rgba(0,0,0,0.6), 0 0 20px ${c.led}15`,
                  }}
                >
                  <div className="absolute inset-x-3 top-3 h-2 rounded-full bg-white/5" />
                  <motion.div
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 h-0.5 rounded-full"
                    style={{ width: 60, background: `linear-gradient(90deg, transparent, ${c.led}80, transparent)` }}
                    animate={{ opacity: [0.4, 1, 0.4], width: [40, 80, 40] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </div>
              </motion.div>

              {/* Side pods */}
              {[-1, 1].map((side) => (
                <motion.div
                  key={side}
                  initial={{ opacity: 0, x: side * 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.7, type: "spring" }}
                  className="absolute"
                  style={{
                    bottom: 0,
                    [side === -1 ? "left" : "right"]: -52,
                    width: 44,
                    height: 140,
                  }}
                >
                  <div
                    className="w-full h-full rounded-2xl flex flex-col items-center justify-between py-3"
                    style={{
                      background: `linear-gradient(180deg, ${c.led}12, rgba(255,255,255,0.03))`,
                      border: `1px solid ${c.led}20`,
                    }}
                  >
                    {[0, 0.4, 0.8].map((delay, i) => (
                      <motion.div
                        key={i}
                        className="w-6 h-6 rounded-lg"
                        style={{ background: `${c.led}20`, border: `1px solid ${c.led}30` }}
                        animate={{ opacity: [0.4, 0.9, 0.4] }}
                        transition={{ duration: 2.5, repeat: Infinity, delay }}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* Floating product display */}
              {boothState !== "minimal" && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0, rotateY: [0, 8, 0, -8, 0] }}
                  transition={{ opacity: { delay: 0.5, duration: 0.7 }, rotateY: { duration: 8, repeat: Infinity, ease: "easeInOut" } }}
                  className="absolute -top-14 left-1/2 -translate-x-1/2"
                  style={{ width: 80, height: 50, transformStyle: "preserve-3d" }}
                >
                  <div
                    className="w-full h-full rounded-xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${c.led}20, rgba(255,255,255,0.05))`,
                      border: `1px solid ${c.led}40`,
                      boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 20px ${c.led}30`,
                    }}
                  >
                    <Sparkles className="w-5 h-5 opacity-60" style={{ color: c.led }} />
                  </div>
                  {/* Connecting stem */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-8"
                    style={{ background: `linear-gradient(to bottom, ${c.led}60, transparent)` }} />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        <AnimatePresence>
          {boothState === "empty" && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15), transparent)", border: "1px dashed rgba(255,255,255,0.15)" }}
              >
                <Wand2 className="w-10 h-10 text-white/20" />
              </motion.div>
              <p className="text-[12px] text-white/30 font-medium tracking-widest uppercase">Describe your vision to begin</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Chat Message ─────────────────────────────────────────────────────────────

function ChatMessage({ msg, onChipClick }: { msg: AIMessage; onChipClick: (prompt: string) => void }) {
  const isAI = msg.sender === "ai";
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-3 ${isAI ? "" : "flex-row-reverse"}`}
    >
      {isAI && (
        <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center shadow-[0_0_16px_rgba(99,102,241,0.5)]"
          style={{ background: "linear-gradient(135deg, #22d3ee, #14b8a6)" }}>
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`flex flex-col gap-2.5 max-w-[88%] ${isAI ? "" : "items-end"}`}>
        <div
          className={`px-4 py-3.5 rounded-2xl text-[13px] leading-relaxed ${
            isAI
              ? "bg-black/50 border border-white/10 text-white/90 rounded-tl-sm backdrop-blur-xl"
              : "border border-white/15 text-white rounded-tr-sm"
          }`}
          style={isAI ? {} : { background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.2))" }}
        >
          <p>{msg.text}</p>
          {msg.bullets && msg.bullets.length > 0 && (
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {msg.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-[3px] shrink-0 w-1.5 h-1.5 rounded-full bg-cyan-400/60" />
                  <span className="text-white/75 text-[12px]">{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {isAI && msg.chips && msg.chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.chips.map((chip, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.07 }}
                whileHover={{ scale: 1.03, backgroundColor: "rgba(99,102,241,0.2)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onChipClick(chip.prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-[11px] font-medium text-white/70 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <ChevronRight className="w-3 h-3 text-cyan-300" />
                {chip.label}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Auto Generate Mode ───────────────────────────────────────────────────────

function AutoGeneratePanel({ onSelect, selected }: { onSelect: (p: BoothPreset) => void; selected: BoothTheme }) {
  return (
    <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 scrollbar-hide">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-4 h-4 text-amber-400" />
        <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Auto Generate — Choose a style</span>
      </div>
      <p className="text-[12px] text-white/40 leading-relaxed -mt-1">Select a preset and the AI will build a complete spatial layout instantly.</p>
      {PRESETS.map((preset, i) => (
        <motion.button
          key={preset.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06, duration: 0.4 }}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => onSelect(preset)}
          className={`relative w-full text-left p-4 rounded-2xl border transition-all duration-300 overflow-hidden ${
            selected === preset.id
              ? "border-white/25 bg-white/8"
              : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/5"
          }`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${preset.gradient} opacity-60`} />
          {selected === preset.id && (
            <motion.div
              layoutId="selectedGlow"
              className="absolute inset-0 rounded-2xl"
              style={{ boxShadow: `inset 0 0 20px ${preset.accent}20` }}
            />
          )}
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[13px] font-bold text-white">{preset.label}</span>
                {selected === preset.id && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </motion.div>
                )}
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed mb-2">{preset.description}</p>
              <div className="flex flex-wrap gap-1">
                {preset.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-lg text-[10px] font-medium"
                    style={{ background: `${preset.accent}15`, color: preset.accent, border: `1px solid ${preset.accent}25` }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-xl"
              style={{ background: `${preset.accent}15`, border: `1px solid ${preset.accent}25` }}>
              <Activity className="w-3 h-3" style={{ color: preset.accent }} />
              <span className="text-[11px] font-bold" style={{ color: preset.accent }}>{preset.confidence}%</span>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

// ─── Optimize Mode ────────────────────────────────────────────────────────────

function OptimizePanel({ onApply }: { onApply: (prompt: string) => void }) {
  return (
    <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 scrollbar-hide">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-400" />
        <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Performance Analysis</span>
      </div>

      {/* Metric bars */}
      <div className="flex flex-col gap-3.5">
        {OPTIMIZE_METRICS.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span style={{ color: m.color }}>{m.icon}</span>
                <span className="text-[12px] text-white/70">{m.label}</span>
              </div>
              <span className="text-[12px] font-bold text-white/90">{m.value}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${m.value}%` }}
                transition={{ delay: 0.3 + i * 0.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                style={{ background: `linear-gradient(90deg, ${m.color}80, ${m.color})` }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-white/8 rounded-full" />

      {/* AI Suggestions */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">AI Recommendations</span>
        </div>
        {OPTIMIZE_SUGGESTIONS.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            type="button"
            onClick={() => onApply(s.text)}
            className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-3.5 text-left transition-colors hover:bg-white/5"
          >
            <div className="shrink-0 mt-0.5">{s.icon}</div>
            <div className="flex-1">
              <p className="text-[12px] text-white/70 leading-relaxed">{s.text}</p>
              <span className="text-[10px] font-bold text-emerald-400 mt-1 block">{s.impact}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-white/25 shrink-0 mt-0.5" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AIGenerator() {
  const navigate = useNavigate();
  const { openAR, setShellConfig } = useOutletContext<RootOutletContext>();

  const [activeMode, setActiveMode] = useState<AppMode>("chat");
  const [messages, setMessages] = useState<AIMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [boothState, setBoothState] = useState<BoothTheme>("empty");
  const [confidence, setConfidence] = useState(0);

  const [styleSlider, setStyleSlider] = useState(35);
  const [densitySlider, setDensitySlider] = useState(40);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-6, 6]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const getAIResponse = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("luxury") || lower.includes("premium") || lower.includes("gold") || lower.includes("vip")) return AI_RESPONSES.luxury;
    if (lower.includes("led") || lower.includes("screen") || lower.includes("display") || lower.includes("wall")) return AI_RESPONSES.led;
    if (lower.includes("engage") || lower.includes("zone") || lower.includes("flow") || lower.includes("traffic")) return AI_RESPONSES.engagement;
    return AI_RESPONSES.default;
  };

  const handleSend = useCallback((text: string) => {
    if (!text.trim() || isGenerating) return;

    const userMsg: AIMessage = { id: Date.now().toString(), sender: "user", text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsGenerating(true);

    setTimeout(() => {
      const response = getAIResponse(text);
      const aiMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: response.text,
        bullets: response.bullets,
        chips: response.chips,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      if (response.theme) setBoothState(response.theme);
      if (response.confidence) setConfidence(response.confidence);
      setIsGenerating(false);
    }, 2200);
  }, [isGenerating]);

  const handlePresetSelect = (preset: BoothPreset) => {
    setBoothState(preset.id);
    setConfidence(preset.confidence);
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 1800);
  };

  const handleRegenerate = () => {
    if (boothState === "empty") return;
    setIsGenerating(true);
    setTimeout(() => {
      setConfidence(prev => Math.min(99, prev + Math.floor(Math.random() * 5) - 2));
      setIsGenerating(false);
    }, 1800);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    animate(mouseX, 0, { duration: 0.8, ease: [0.16, 1, 0.3, 1] });
    animate(mouseY, 0, { duration: 0.8, ease: [0.16, 1, 0.3, 1] });
  };

  const currentPreset = PRESETS.find(p => p.id === boothState);
  const activeTemplateId = resolveBuilderTemplateId(boothState);
  const arProject = useMemo(() => createProjectFromTemplate(activeTemplateId), [activeTemplateId]);

  const triggerArPreview = useCallback(() => {
    openAR({
      booth: {
        ...arProject.booth,
        name: currentPreset?.label ?? arProject.booth.name,
        note:
          currentPreset?.description ??
          arProject.booth.note,
      },
      items: arProject.items,
      sourceLabel: currentPreset?.label ?? arProject.booth.name,
    });
  }, [arProject, currentPreset, openAR]);

  const MODES = useMemo(() => [
    { id: "chat" as AppMode, label: "Chat", icon: <Command className="w-3.5 h-3.5" /> },
    { id: "auto" as AppMode, label: "Auto Generate", icon: <Zap className="w-3.5 h-3.5" /> },
    { id: "optimize" as AppMode, label: "Optimize", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  ], []);

  const shellToolbar = useMemo(
    () => (
      <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-1.5">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setActiveMode(mode.id)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-[0.9rem] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                activeMode === mode.id
                  ? "bg-cyan-400/16 text-cyan-100 ring-1 ring-cyan-300/35"
                  : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {mode.icon}
              {mode.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => navigate(`/builder/${activeTemplateId}`)}
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
        >
          <Boxes className="h-4 w-4 text-cyan-300" />
          Open in Builder
        </button>
        <button
          type="button"
          onClick={triggerArPreview}
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-105"
        >
          <Eye className="h-4 w-4" />
          View in AR
        </button>
      </div>
    ),
    [MODES, activeMode, activeTemplateId, navigate, triggerArPreview],
  );

  const mobileQuickActions = useMemo(
    () => (
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveMode("chat")}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white"
        >
          <Sparkles className="h-4 w-4 text-cyan-300" />
          Chat
        </button>
        <button
          type="button"
          onClick={() => navigate(`/builder/${activeTemplateId}`)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white"
        >
          <Boxes className="h-4 w-4 text-cyan-300" />
          Builder
        </button>
        <button
          type="button"
          onClick={() => setActiveMode("optimize")}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white"
        >
          <TrendingUp className="h-4 w-4 text-emerald-300" />
          Optimize
        </button>
        <button
          type="button"
          onClick={triggerArPreview}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950"
        >
          <Eye className="h-4 w-4" />
          AR
        </button>
      </div>
    ),
    [activeTemplateId, navigate, triggerArPreview],
  );

  useEffect(() => {
    setShellConfig({
      currentTemplateId: activeTemplateId,
      currentTemplateName: currentPreset?.label ?? "AI Generator",
      arPayload: {
        booth: {
          ...arProject.booth,
          name: currentPreset?.label ?? arProject.booth.name,
          note: currentPreset?.description ?? arProject.booth.note,
        },
        items: arProject.items,
        sourceLabel: currentPreset?.label ?? arProject.booth.name,
      },
      contextMeta: (
        <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-[1.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,28,42,0.9),rgba(8,12,20,0.8))] px-4 py-3">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
            AI Studio
          </span>
          <span className="truncate text-sm font-semibold text-white">
            {currentPreset?.label ?? "Spatial concepting"}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-300">
            {activeMode}
          </span>
          <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-amber-100">
            AR Ready
          </span>
        </div>
      ),
      toolbarContent: shellToolbar,
      drawerContent: shellToolbar,
      quickActions: mobileQuickActions,
    });

    return () => setShellConfig(null);
  }, [activeMode, activeTemplateId, arProject, currentPreset, mobileQuickActions, setShellConfig, shellToolbar]);

  return (
    <div className="flex min-h-[100svh] w-full flex-col overflow-hidden text-white selection:bg-cyan-500/30"
      style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(34,211,238,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(45,212,191,0.08) 0%, transparent 60%), #05090f" }}>

      {/* ── Ambient Orbs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-200px] left-[-100px] h-[600px] w-[600px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #22d3ee, transparent)", filter: "blur(80px)" }} />
        <div className="absolute bottom-[-200px] right-[-100px] h-[600px] w-[600px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #14b8a6, transparent)", filter: "blur(80px)" }} />
      </div>

      {/* ── Main Content ── */}
      <main className="relative z-10 mx-auto flex w-full max-w-[var(--content-max-width)] flex-1 flex-col gap-4 overflow-auto px-[var(--page-gutter)] py-5 pb-28 min-h-0 sm:pb-32 lg:flex-row lg:gap-5 lg:overflow-hidden lg:pb-6">
        <div className="w-full lg:hidden">
          <PageHeader
            eyebrow="AI Spatial Studio"
            title="Generate booth concepts, pressure-test flow, and hand off the strongest layout to the builder."
            description="Use guided chat, instant style presets, and optimization prompts to shape a trade show concept without losing the spatial context."
          />
        </div>

        {/* ── LEFT PANEL ── */}
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex min-h-[28rem] w-full shrink-0 flex-col overflow-hidden rounded-[28px] border border-white/10 lg:min-h-0 lg:max-w-[26rem] xl:max-w-[28rem]"
          style={{ background: "rgba(255,255,255,0.02)", backdropFilter: "blur(40px)", boxShadow: "0 40px 100px rgba(0,0,0,0.5)" }}
        >

          {/* Panel Header */}
          <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between shrink-0 relative">
            <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.12), transparent 70%)" }} />
            <div className="flex items-center gap-3 relative z-10">
              <div className="relative">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #22d3ee, #14b8a6)", boxShadow: "0 0 20px rgba(34,211,238,0.3)" }}>
                  <Wand2 className="w-4 h-4 text-white" />
                </div>
                <motion.div
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#050508]"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white tracking-wide">AI Co-Designer</p>
                <p className="text-[10px] text-white/40 font-medium tracking-wide">
                  {activeMode === "chat" ? "Listening…" : activeMode === "auto" ? "Select a style preset" : "Analyzing your booth"}
                </p>
              </div>
            </div>
            <div className="relative z-10 flex items-center gap-1.5">
              {[0, 0.3, 0.6].map((delay, i) => (
                <motion.div key={i} className="w-1 h-1 rounded-full bg-cyan-400/60"
                  animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay }} />
              ))}
            </div>
          </div>

          {/* Panel Content — mode-specific */}
          <AnimatePresence mode="wait">
            {activeMode === "chat" && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 scrollbar-hide min-h-0"
              >
                {messages.map(msg => (
                  <ChatMessage key={msg.id} msg={msg} onChipClick={(p) => handleSend(p)} />
                ))}

                {isGenerating && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10"
                      style={{ background: "rgba(255,255,255,0.04)" }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                        <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                      </motion.div>
                    </div>
                    <div className="px-4 py-3.5 rounded-2xl rounded-tl-sm flex items-center gap-2 border border-white/10 backdrop-blur-xl"
                      style={{ background: "rgba(0,0,0,0.5)" }}>
                      {[0, 0.2, 0.4].map((delay, i) => (
                        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-300"
                          animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay }} />
                      ))}
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </motion.div>
            )}

            {activeMode === "auto" && (
              <motion.div
                key="auto"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex-1 min-h-0 flex flex-col"
              >
                <AutoGeneratePanel onSelect={handlePresetSelect} selected={boothState} />
              </motion.div>
            )}

            {activeMode === "optimize" && (
              <motion.div
                key="optimize"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex-1 min-h-0 flex flex-col"
              >
                <OptimizePanel onApply={handleSend} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Area — only in Chat mode */}
          <AnimatePresence>
            {activeMode === "chat" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.35 }}
                className="shrink-0 border-t border-white/8 p-4"
                style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(20px)" }}
              >
                {/* Quick Chips */}
                <div className="flex flex-wrap gap-1.5 mb-3.5">
                  {["Make it more luxury", "Add LED walls", "Increase engagement zones"].map((chip, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleSend(chip)}
                      disabled={isGenerating}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-medium text-white/60 hover:text-white transition-all border border-white/8 hover:border-white/20 disabled:opacity-40"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    >
                      {chip}
                    </motion.button>
                  ))}
                </div>

                {/* Input Row */}
                <div className="flex items-end gap-2.5">
                  {/* Textarea wrapper */}
                  <div className="flex-1 flex items-end gap-2 rounded-[18px] border border-white/10 px-3 py-2 transition-all focus-within:border-cyan-400/45"
                    style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(20px)" }}>

                    {/* Voice */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsRecording(r => !r)}
                      className={`shrink-0 p-2 rounded-xl transition-all ${isRecording ? "text-red-400 bg-red-500/10" : "text-white/35 hover:text-white/70"}`}
                    >
                      {isRecording ? (
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                          <MicOff className="w-4 h-4" />
                        </motion.div>
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </motion.button>

                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(inputValue);
                        }
                      }}
                      placeholder="Describe your vision…"
                      rows={1}
                      className="flex-1 bg-transparent border-none outline-none text-[13px] text-white placeholder:text-white/25 resize-none max-h-28 min-h-[38px] py-2 leading-relaxed"
                    />
                  </div>

                  {/* Send Button */}
                  <motion.button
                    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                    onClick={() => handleSend(inputValue)}
                    disabled={!inputValue.trim() || isGenerating}
                    className="h-12 w-12 rounded-[16px] flex items-center justify-center shrink-0 relative overflow-hidden border border-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: "linear-gradient(135deg, #22d3ee, #14b8a6)",
                      boxShadow: inputValue.trim() && !isGenerating ? "0 0 30px rgba(34,211,238,0.35)" : "none",
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
                    <Send className="w-4 h-4 text-white relative z-10 ml-0.5" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── RIGHT PANEL ── */}
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex min-h-[36rem] w-full flex-1 flex-col overflow-hidden rounded-[28px] border border-white/8"
          style={{ background: "rgba(0,0,0,0.25)", boxShadow: "0 40px 100px rgba(0,0,0,0.6)" }}
          ref={panelRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >

          {/* Background Grid */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.15]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
              transform: "perspective(800px) rotateX(55deg) scale(2.5) translateY(-45px)",
              transformOrigin: "top center",
            }}
          />

          {/* Dynamic ambient light based on booth theme */}
          <AnimatePresence mode="wait">
            <motion.div
              key={boothState}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
            >
              <div
                className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full blur-[140px] opacity-25"
                style={{ background: currentPreset ? `${currentPreset.accent}` : "#22d3ee" }}
              />
              <div
                className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-15"
                style={{ background: currentPreset ? `${currentPreset.accent}` : "#14b8a6" }}
              />
            </motion.div>
          </AnimatePresence>

          {/* ── Top-left: Booth Meta ── */}
          <div className="relative z-20 flex flex-col gap-3 border-b border-white/8 p-4 sm:p-5 xl:absolute xl:inset-x-5 xl:top-5 xl:flex-row xl:items-start xl:justify-between xl:border-none xl:p-0">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-2.5 backdrop-blur-3xl"
              style={{ background: "rgba(0,0,0,0.45)" }}>
              <LayoutGrid className="w-3.5 h-3.5 text-white/40" />
              <div>
                <p className="text-[10px] text-white/35 font-bold uppercase tracking-widest">Current Design</p>
                <motion.p key={boothState} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-[13px] font-bold text-white/90">
                  {currentPreset?.label ?? "Empty Canvas"}
                </motion.p>
              </div>
              {currentPreset && (
                <div className="flex gap-1 ml-1">
                  {currentPreset.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase"
                      style={{ background: `${currentPreset.accent}15`, color: currentPreset.accent, border: `1px solid ${currentPreset.accent}25` }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row xl:flex-col">
              {confidence > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-2.5 backdrop-blur-3xl"
                  style={{ background: "rgba(0,0,0,0.45)" }}
                >
                  <ConfidenceRing value={confidence} color={currentPreset?.accent ?? "#22d3ee"} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">AI Confidence</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <p className="text-[12px] font-bold text-white/90">
                        {confidence >= 90 ? "Excellent" : confidence >= 80 ? "Optimized" : "Good"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleRegenerate}
                disabled={boothState === "empty" || isGenerating}
                className="flex min-h-11 items-center justify-center gap-2.5 rounded-2xl border border-white/10 px-4 py-2.5 backdrop-blur-3xl transition-all hover:bg-white/8 disabled:opacity-40"
                style={{ background: "rgba(0,0,0,0.45)" }}
              >
                <motion.div animate={isGenerating ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 1, repeat: isGenerating ? Infinity : 0, ease: "linear" }}>
                  <RefreshCw className="w-3.5 h-3.5 text-white/60" />
                </motion.div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">Regenerate</span>
              </motion.button>
            </div>
          </div>

          {/* ── Centre: 3D Booth with parallax ── */}
          <div className="relative z-10 flex flex-1 items-center justify-center px-3 py-6 sm:px-5 lg:px-6 xl:px-10 xl:py-10 xl:pt-28 xl:pb-36">
            <motion.div
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              className="w-full h-full"
            >
              <BoothPreview3D boothState={boothState} isGenerating={isGenerating} />
            </motion.div>
          </div>

          {/* ── Bottom Controls ── */}
          <div className="relative z-20 grid gap-3 border-t border-white/8 p-4 sm:p-5 xl:absolute xl:inset-x-5 xl:bottom-5 xl:grid-cols-[minmax(0,15rem)_auto] xl:items-end xl:border-none xl:p-0">
            <div className="flex flex-col gap-4 rounded-3xl border border-white/10 px-5 py-4 backdrop-blur-3xl"
              style={{ background: "rgba(0,0,0,0.5)" }}>
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-white/35" />
                <span className="text-[10px] font-bold text-white/35 uppercase tracking-widest">Style Adjustments</span>
              </div>

              {/* Slider 1: Modern ↔ Luxury */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase tracking-wide">
                  <span>Modern</span><span>Luxury</span>
                </div>
                <div className="relative h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <input type="range" min="0" max="100" value={styleSlider}
                    onChange={e => setStyleSlider(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="absolute left-0 top-0 bottom-0 rounded-full pointer-events-none"
                    style={{ width: `${styleSlider}%`, background: "linear-gradient(90deg, #22d3ee, #f59e0b)" }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white pointer-events-none border-2"
                    style={{ left: `calc(${styleSlider}% - 7px)`, borderColor: styleSlider > 50 ? "#f59e0b" : "#22d3ee", boxShadow: "0 0 8px rgba(255,255,255,0.4)" }} />
                </div>
              </div>

              {/* Slider 2: Minimal ↔ Immersive */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase tracking-wide">
                  <span>Minimal</span><span>Immersive</span>
                </div>
                <div className="relative h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <input type="range" min="0" max="100" value={densitySlider}
                    onChange={e => setDensitySlider(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="absolute left-0 top-0 bottom-0 rounded-full pointer-events-none"
                    style={{ width: `${densitySlider}%`, background: "linear-gradient(90deg, #94a3b8, #14b8a6)" }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white pointer-events-none border-2"
                    style={{ left: `calc(${densitySlider}% - 7px)`, borderColor: densitySlider > 50 ? "#14b8a6" : "#94a3b8", boxShadow: "0 0 8px rgba(255,255,255,0.4)" }} />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:justify-end xl:justify-end">
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/builder/${activeTemplateId}`)}
                className="relative group flex min-h-12 items-center justify-center gap-2.5 overflow-hidden rounded-[18px] border border-white/20 px-5 py-3 text-center transition-all"
                style={{
                  background: "linear-gradient(135deg, rgba(34,211,238,0.95), rgba(245,158,11,0.92))",
                  boxShadow: "0 15px 50px rgba(34,211,238,0.24)",
                }}
              >
                <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.24), rgba(245,158,11,0.22))" }} />
                <span className="relative z-10 text-[12px] font-bold uppercase tracking-widest text-slate-950">Apply to Builder</span>
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </motion.div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={triggerArPreview}
                className="flex min-h-12 items-center justify-center gap-2 rounded-[18px] border border-white/15 px-4 py-3 backdrop-blur-3xl transition-all hover:bg-white/8"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <Maximize2 className="w-4 h-4 text-white/70" />
                <span className="text-[12px] font-bold uppercase tracking-widest text-white/80">AR Preview</span>
              </motion.button>
            </div>
          </div>

        </motion.div>
      </main>
    </div>
  );
}
