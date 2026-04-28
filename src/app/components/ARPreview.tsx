import { AnimatePresence, motion } from "motion/react";
import { Camera, Copy, ScanSearch, Send, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CELL_SIZE,
  LIBRARY_ITEM_BY_TYPE,
  buildShareUrl,
  createProjectFromTemplate,
  deriveMetrics,
  getFootprint,
  serializeProject,
  type ARPreviewPayload,
} from "../lib/boothBuilder";
import { mountArScene } from "../lib/mountArScene";

interface ARPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  project?: ARPreviewPayload;
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch (error) {
    return false;
  }
}

export function ARPreview({ isOpen, onClose, templateId, project }: ARPreviewProps) {
  const fallbackProject = useMemo(() => createProjectFromTemplate(templateId), [templateId]);
  const booth = project?.booth ?? fallbackProject.booth;
  const items = project?.items ?? fallbackProject.items;
  const shareUrl =
    project?.shareUrl ||
    (typeof window !== "undefined"
      ? buildShareUrl(
          `${window.location.origin}/builder/${booth.templateId || templateId}`,
          serializeProject(booth, items),
        )
      : "");
  const metrics = useMemo(() => deriveMetrics(booth, items), [booth, items]);
  const launcherRef = useRef<HTMLDivElement | null>(null);
  const launcherCleanupRef = useRef<null | (() => void)>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [copyStatus, setCopyStatus] = useState("Copy mobile link");
  const [shareStatus, setShareStatus] = useState("Share");
  const [showArLauncher, setShowArLauncher] = useState(false);
  const [arSupport, setArSupport] = useState({
    checked: false,
    immersive: false,
    camera: false,
    reason: "Checking device support...",
  });

  useEffect(() => {
    if (!isOpen) {
      setCameraActive(false);
      setShowArLauncher(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let cancelled = false;

    async function checkSupport() {
      const camera = Boolean(navigator.mediaDevices?.getUserMedia);
      const secure = window.isSecureContext;
      const xr = (navigator as Navigator & {
        xr?: { isSessionSupported?: (mode: string) => Promise<boolean> };
      }).xr;

      if (!xr?.isSessionSupported) {
        if (!cancelled) {
          setArSupport({
            checked: true,
            immersive: false,
            camera,
            reason: secure
              ? "Immersive WebXR is unavailable here, but camera rehearsal still works."
              : "Use HTTPS or localhost to enable camera and live AR features.",
          });
        }
        return;
      }

      try {
        const immersive = secure && (await xr.isSessionSupported("immersive-ar"));

        if (!cancelled) {
          setArSupport({
            checked: true,
            immersive,
            camera,
            reason: immersive
              ? "Live AR placement is available on this device."
              : "Camera preview fallback is available. Use a supported mobile device for live AR.",
          });
        }
      } catch (error) {
        if (!cancelled) {
          setArSupport({
            checked: true,
            immersive: false,
            camera,
            reason: "AR capability detection failed, but the fallback preview can still be used.",
          });
        }
      }
    }

    checkSupport();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !cameraActive || !videoRef.current) {
      return undefined;
    }

    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraError("");
      } catch (error) {
        setCameraError("Camera access is blocked on this origin. Use HTTPS or localhost and allow permission.");
        setCameraActive(false);
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraActive, isOpen]);

  useEffect(() => {
    if (!isOpen || !showArLauncher || !launcherRef.current) {
      return undefined;
    }

    let cancelled = false;

    async function mountLauncher() {
      launcherCleanupRef.current = await mountArScene(launcherRef.current!, booth, items);

      if (cancelled && launcherCleanupRef.current) {
        launcherCleanupRef.current();
      }
    }

    mountLauncher();

    return () => {
      cancelled = true;
      launcherCleanupRef.current?.();
      launcherCleanupRef.current = null;
    };
  }, [booth, isOpen, items, showArLauncher]);

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xl"
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.97 }}
          transition={{ duration: 0.28 }}
          className="relative flex max-h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,11,18,0.94),rgba(5,5,10,0.97))] shadow-[0_35px_100px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 md:px-7">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">AR Rehearsal</p>
              <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
                Validate {project?.sourceLabel || booth.name} before you ship
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
                This merged preview flow packages the live builder layout for mobile sharing, camera-overlay rehearsal, and immersive WebXR placement.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-auto px-5 py-5 md:px-7">
            <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
              <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">Readiness</p>
                    <h3 className="mt-1 text-xl font-semibold text-white">Device support</h3>
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
                    {arSupport.immersive ? "Live AR ready" : "Fallback mode"}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/55">{arSupport.reason}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Booth area</p>
                    <p className="mt-2 text-lg font-semibold text-white">{metrics.boothArea} sq ft</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Placed items</p>
                    <p className="mt-2 text-lg font-semibold text-white">{items.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Occupancy</p>
                    <p className="mt-2 text-lg font-semibold text-white">{metrics.occupancy}%</p>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">Mobile handoff</p>
                    <h3 className="mt-1 text-xl font-semibold text-white">Share this exact layout</h3>
                  </div>
                  <Sparkles className="h-5 w-5 text-violet-300" />
                </div>
                <textarea
                  readOnly
                  rows={4}
                  value={shareUrl}
                  className="mt-4 w-full rounded-[22px] border border-white/10 bg-black/25 px-4 py-3 text-xs leading-6 text-white/70"
                />
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      const copied = await copyText(shareUrl);
                      setCopyStatus(copied ? "Copied" : "Clipboard unavailable");
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/[0.08]"
                  >
                    <Copy className="h-4 w-4" />
                    {copyStatus}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!navigator.share) {
                        setShareStatus("Share unavailable");
                        return;
                      }

                      try {
                        await navigator.share({
                          title: booth.name,
                          text: "Open this AR Trade Show Booth Builder layout in AR mode.",
                          url: shareUrl,
                        });
                        setShareStatus("Shared");
                      } catch (error) {
                        setShareStatus("Share canceled");
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-violet-500/14 px-4 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-500/22"
                  >
                    <Send className="h-4 w-4" />
                    {shareStatus}
                  </button>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">Camera fallback</p>
                    <h3 className="mt-1 text-xl font-semibold text-white">Rehearse the footprint in the room</h3>
                  </div>
                  <Camera className="h-5 w-5 text-violet-300" />
                </div>

                <div className="relative mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-black/30">
                  {cameraActive ? (
                    <>
                      <video ref={videoRef} className="h-[360px] w-full object-cover" muted playsInline />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-transparent to-black/35">
                        <div
                          className="relative border border-violet-300/35 bg-violet-500/8 shadow-[0_35px_80px_rgba(0,0,0,0.3)]"
                          style={{
                            width: booth.width * (CELL_SIZE * 0.42),
                            height: booth.depth * (CELL_SIZE * 0.42),
                            transform: "perspective(960px) rotateX(70deg)",
                            transformStyle: "preserve-3d",
                            backgroundImage:
                              "linear-gradient(rgba(167,139,250,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.08) 1px, transparent 1px)",
                            backgroundSize: "14px 14px",
                          }}
                        >
                          {items.map((item) => {
                            const config = LIBRARY_ITEM_BY_TYPE[item.type];
                            const footprint = getFootprint(item);

                            return (
                              <div
                                key={item.id}
                                className="absolute flex items-center justify-center rounded-xl border text-[9px] font-semibold uppercase tracking-[0.12em] text-white/90"
                                style={{
                                  left: item.x * CELL_SIZE * 0.42,
                                  top: item.y * CELL_SIZE * 0.42,
                                  width: footprint.width * CELL_SIZE * 0.42,
                                  height: footprint.depth * CELL_SIZE * 0.42,
                                  borderColor: config.accent,
                                  background: config.background,
                                  boxShadow: `0 10px 28px ${config.shadow}`,
                                }}
                              >
                                <span className="px-1 text-center">{item.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-[360px] flex-col items-center justify-center gap-4 p-8 text-center text-white/50">
                      <div className="flex h-20 w-20 items-center justify-center rounded-[26px] border border-dashed border-white/15 bg-white/[0.03]">
                        <Camera className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-white/75">Open the environment camera</p>
                        <p className="mt-1 text-sm text-white/45">
                          Use the overlay to judge spacing, aisle clearance, and sightlines before deployment.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {cameraError ? <p className="mt-3 text-sm text-rose-300">{cameraError}</p> : null}

                <button
                  type="button"
                  disabled={!arSupport.camera}
                  onClick={() => setCameraActive((current) => !current)}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Camera className="h-4 w-4" />
                  {cameraActive ? "Stop camera preview" : "Open camera preview"}
                </button>
              </section>

              <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">Immersive placement</p>
                    <h3 className="mt-1 text-xl font-semibold text-white">Launch live WebXR</h3>
                  </div>
                  <ScanSearch className="h-5 w-5 text-violet-300" />
                </div>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  On supported mobile hardware, the launcher below opens a real immersive AR session with hit-testing and full-scale booth massing.
                </p>
                <div
                  ref={launcherRef}
                  className="mt-4 flex min-h-[220px] items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-black/20 p-6"
                >
                  {!showArLauncher ? (
                    <button
                      type="button"
                      disabled={!arSupport.immersive}
                      onClick={() => setShowArLauncher(true)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Sparkles className="h-4 w-4" />
                      Prepare live AR launcher
                    </button>
                  ) : null}
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
