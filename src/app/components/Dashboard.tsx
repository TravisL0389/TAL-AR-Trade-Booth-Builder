import React, { useRef } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { Sparkles, Building2, Package, Eye, Activity, Info, Cpu, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";

interface Template {
  id: string;
  name: string;
  category: string;
  gradient: string;
  image: string;
  icon: React.ReactNode;
  badges: string[];
  hint: string;
}

const templates: Template[] = [
  {
    id: "tech",
    name: "Tech Nexus",
    category: "Technology",
    gradient: "from-blue-600/50 via-indigo-600/50 to-purple-600/50",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
    icon: <Cpu className="w-5 h-5" />,
    badges: ["AR Ready", "AI Optimized"],
    hint: "Optimized for product demos and high foot traffic.",
  },
  {
    id: "luxury",
    name: "Luxe Pavilion",
    category: "Premium",
    gradient: "from-amber-500/50 via-orange-600/50 to-rose-600/50",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80",
    icon: <Sparkles className="w-5 h-5" />,
    badges: ["Premium Lighting", "Spatial Audio"],
    hint: "Best for exclusive brand reveals and VIP zones.",
  },
  {
    id: "minimal",
    name: "Zenith Minimal",
    category: "Modern",
    gradient: "from-teal-500/50 via-emerald-600/50 to-cyan-600/50",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
    icon: <Building2 className="w-5 h-5" />,
    badges: ["AR Ready", "Eco Mode"],
    hint: "Clean lines and open space for clear messaging.",
  },
  {
    id: "showcase",
    name: "Immersive Retail",
    category: "Retail",
    gradient: "from-fuchsia-500/50 via-pink-600/50 to-rose-600/50",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80",
    icon: <Package className="w-5 h-5" />,
    badges: ["Interactive Zones", "High Engagement"],
    hint: "Designed for tactile interactions and sampling.",
  },
];

interface DashboardProps {}

function TiltCard({ 
  template, 
  onClick, 
  index 
}: { 
  template: Template; 
  onClick: () => void; 
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-7, 7]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  // Stagger the second column down slightly for a more organic feel
  const isOdd = index % 2 !== 0;

  return (
    <div style={{ perspective: 1200 }} className={`w-full ${isOdd ? "xl:mt-12" : ""}`}>
      <motion.div
        ref={ref}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: index * 0.15, ease: "easeOut" }}
        whileHover={{ scale: 1.03, y: -10 }}
        whileTap={{ scale: 0.98 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        className="group relative min-h-[22rem] overflow-hidden rounded-[2rem] cursor-pointer sm:min-h-[24rem] xl:min-h-[26rem]"
      >
        {/* Glassmorphism Background layer */}
        <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-[30px] border border-white/10 rounded-[32px] z-10 transition-all duration-500 group-hover:bg-white/[0.05] group-hover:border-white/20" />
        
        {/* Shadow / Bloom effect */}
        <div className={`absolute -inset-4 bg-gradient-to-br ${template.gradient} opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-500 z-0`} />

        {/* Image layer */}
        <div className="absolute inset-0 z-10 overflow-hidden rounded-[32px]">
          <img
            src={template.image}
            alt={template.name}
            className="w-full h-full object-cover opacity-30 transition-transform duration-700 ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors duration-500" />
          <div className={`absolute inset-0 bg-gradient-to-br ${template.gradient} mix-blend-overlay opacity-80`} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/60 to-transparent" />
        </div>

        {/* Content Layer */}
        <div
          className="relative z-20 flex h-full flex-col justify-between p-5 sm:p-6 lg:p-8"
          style={{ transform: "translateZ(40px)" }}
        >
          {/* Top section: Badges & Icon */}
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2">
              {template.badges.map((badge, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-white/90 w-max shadow-xl">
                  {badge.includes("AR") ? <Eye className="w-3 h-3 text-blue-300" /> : <Activity className="w-3 h-3 text-purple-300" />}
                  {badge}
                </div>
              ))}
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
              {template.icon}
            </div>
          </div>

          {/* Bottom section: Text & Hints */}
          <div className="space-y-4">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/50 sm:text-sm">
                {template.category}
              </div>
              <h3 className="text-[1.85rem] font-bold tracking-tight text-white drop-shadow-lg sm:text-[2.15rem]">
                {template.name}
              </h3>
            </div>
            
            {/* Hint & Action */}
            <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
              <div className="flex items-start gap-2 text-sm text-white/60">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-white/40" />
                <p className="leading-snug">{template.hint}</p>
              </div>
              
              <div className="flex items-center gap-2 text-sm font-medium text-white group-hover:text-blue-300 transition-colors mt-2">
                <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text group-hover:from-blue-300 group-hover:to-purple-300">Enter Builder</span>
                <motion.div
                  className="inline-block"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-[#050508] font-sans selection:bg-purple-500/30">
      {/* Immersive Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle noise texture */}
        <div 
          className="absolute inset-0 opacity-[0.02] z-10"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />
        
        {/* Aurora / Animated Orbs */}
        <motion.div
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-purple-600/20 blur-[140px] rounded-full mix-blend-screen"
          animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[10%] -right-[10%] w-[50%] h-[70%] bg-blue-600/20 blur-[140px] rounded-full mix-blend-screen"
          animate={{ x: [0, -60, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] bg-indigo-600/20 blur-[140px] rounded-full mix-blend-screen"
          animate={{ x: [0, 50, 0], y: [0, -50, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-20 mx-auto flex min-h-[100svh] w-full max-w-[var(--content-max-width)] flex-col gap-12 px-[var(--page-gutter)] py-16 sm:gap-14 sm:py-20 lg:py-24 xl:grid xl:grid-cols-[minmax(0,0.92fr)_minmax(18rem,0.88fr)] xl:items-center xl:gap-16">
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex w-full flex-col text-left pt-6 sm:pt-10 xl:pr-12 xl:pt-0"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 shadow-2xl">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white/80 tracking-wide">Next-Gen Spatial Builder</span>
          </div>
          
          <h1 className="mb-6 text-[clamp(2.9rem,9vw,6.6rem)] font-bold leading-[1.02] tracking-tight text-white">
            Step Into Your <br className="hidden xl:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              Booth Before It Exists
            </span>
          </h1>
          
          <p className="mb-10 max-w-2xl text-[clamp(1.05rem,2.8vw,1.5rem)] font-light leading-relaxed text-white/50">
            Start with a vibe. Customize everything. Walk it in AR. Experience your floor plan at real-world scale instantly.
          </p>

          <div className="mb-12 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            <button 
              onClick={() => navigate('/ai')}
              className="group relative flex min-h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-white/20 px-6 py-4 shadow-[0_0_40px_rgba(168,85,247,0.3)] transition-all hover:shadow-[0_0_60px_rgba(168,85,247,0.5)] sm:w-auto"
              style={{
                background: "linear-gradient(135deg, rgba(147,51,234,0.8) 0%, rgba(79,70,229,0.8) 100%)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-indigo-400/20" />
              <Sparkles className="w-5 h-5 text-white" />
              <span className="text-base font-bold text-white tracking-wide relative z-10">Generate with AI</span>
            </button>
            <span className="text-sm font-medium uppercase tracking-wider text-white/40">
              or pick a template &rarr;
            </span>
          </div>

          {/* Particles/Shimmer line */}
          <div className="h-px w-full max-w-md bg-gradient-to-r from-white/20 to-transparent relative mb-12">
            <motion.div 
              className="absolute top-0 left-0 h-full w-32 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ["-100%", "400%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </div>

          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
             <div className="flex -space-x-4">
               {[1,2,3].map((i) => (
                 <div key={i} className="w-12 h-12 rounded-full border-2 border-[#050508] bg-white/10 backdrop-blur-md overflow-hidden flex items-center justify-center shadow-lg">
                   <img src={`https://i.pravatar.cc/100?img=${i + 12}`} alt="User" className="w-full h-full object-cover" />
                 </div>
               ))}
             </div>
             <p className="text-sm leading-relaxed text-white/50">
               Join <strong className="text-white/90">2,000+</strong> designers<br/> building the future of events.
             </p>
          </div>
        </motion.div>

        {/* Templates Grid */}
        <div className="w-full xl:max-w-[48rem] xl:justify-self-end">
          <div className="grid grid-cols-1 gap-5 pb-8 sm:grid-cols-2 sm:gap-6 xl:pb-0">
            {templates.map((template, index) => (
              <TiltCard 
                key={template.id}
                template={template}
                index={index}
                onClick={() => navigate(`/builder/${template.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
