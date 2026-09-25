import { useCallback, useEffect, useRef, useState } from "react";
import { ITEM_LIBRARY_BY_TYPE, getFootprint } from "./Item";
import { mountArSceneLauncher } from "./arSession";
import { getSpaceTypeLabel } from "./ProjectCatalog";

async function copyToClipboard(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export default function ARPanel({ open, booth, items, brand, shareUrl, arSupport, onClose }) {
  const launcherRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const launcherCleanupRef = useRef(null);

  const [copyStatus, setCopyStatus] = useState("Copy mobile link");
  const [shareStatus, setShareStatus] = useState("Share from device");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [launcherError, setLauncherError] = useState("");
  const [showLiveLauncher, setShowLiveLauncher] = useState(false);
  const spaceTypeLabel = getSpaceTypeLabel(booth.spaceType).toLowerCase();

  const closePanel = useCallback(() => {
    setCameraActive(false);
    setShowLiveLauncher(false);
    setLauncherError("");
    setCopyStatus("Copy mobile link");
    setShareStatus("Share from device");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open || !cameraActive || !videoRef.current) {
      return undefined;
    }

    let isCancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraError("");
      } catch {
        setCameraError("Camera access is blocked on this origin. Use HTTPS or localhost and allow permission.");
        setCameraActive(false);
      }
    }

    startCamera();

    return () => {
      isCancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraActive, open]);

  useEffect(() => {
    if (!open || !showLiveLauncher || !launcherRef.current) {
      return undefined;
    }

    let isDisposed = false;

    async function mountLauncher() {
      try {
        setLauncherError("");
        launcherCleanupRef.current = await mountArSceneLauncher(launcherRef.current, { booth, items, brand });
      } catch {
        setLauncherError("Live AR could not initialize here. Use the camera preview or open the share link on a supported mobile browser.");
      }

      if (isDisposed && launcherCleanupRef.current) {
        launcherCleanupRef.current();
      }
    }

    mountLauncher();

    return () => {
      isDisposed = true;
      launcherCleanupRef.current?.();
      launcherCleanupRef.current = null;
    };
  }, [booth, brand, items, open, showLiveLauncher]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closePanel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [closePanel, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ar-panel-title"
      onPointerDown={(event) => event.target === event.currentTarget && closePanel()}
    >
      <div className="modal-panel">
        <div className="modal-panel__header">
          <div>
            <p className="eyebrow">AR Integration</p>
            <h2 id="ar-panel-title">Launch, handoff, and rehearse</h2>
            <p className="panel-copy">
              This flow packages the current {spaceTypeLabel} layout for mobile review, camera-overlay rehearsal,
              and live WebXR placement on compatible devices.
            </p>
          </div>
          <button ref={closeButtonRef} type="button" className="ghost-button" onClick={closePanel} aria-label="Close AR panel">
            Close
          </button>
        </div>

        <div className="modal-grid">
          <section className="modal-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Readiness</p>
                <h3>Device support</h3>
              </div>
              <span className={`support-badge ${arSupport.supported ? "support-badge--ready" : ""}`}>
                {arSupport.supported ? "Live AR ready" : "Fallback mode"}
              </span>
            </div>
            <p className="panel-copy">{arSupport.reason}</p>
            <ul className="support-list">
              <li>Share link preserves the full footprint, labels, placement, and rotation.</li>
              <li>Camera preview works as a fast onsite rehearsal even when immersive AR is unavailable.</li>
              <li>For a phone or tablet, use HTTPS or localhost so camera and WebXR permissions can resolve correctly.</li>
            </ul>
          </section>

          <section className="modal-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Mobile Handoff</p>
                <h3>Open on another device</h3>
              </div>
            </div>
            <textarea value={shareUrl} readOnly rows="5" aria-label="Shareable mobile AR link" />
            <div className="modal-actions">
              <button
                type="button"
                className="primary-button"
                onClick={async () => {
                  const copied = await copyToClipboard(shareUrl);
                  setCopyStatus(copied ? "Copied" : "Clipboard unavailable");
                }}
              >
                {copyStatus}
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={async () => {
                  if (!navigator.share) {
                    setShareStatus("Share API unavailable");
                    return;
                  }

                  try {
                    await navigator.share({
                      title: booth.name,
                      text: `Open this ${spaceTypeLabel} layout in AR mode.`,
                      url: shareUrl,
                    });
                    setShareStatus("Shared");
                  } catch {
                    setShareStatus("Share canceled");
                  }
                }}
              >
                {shareStatus}
              </button>
            </div>
          </section>

          <section className="modal-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Camera Rehearsal</p>
                <h3>Fallback preview</h3>
              </div>
            </div>
            <div className="camera-preview-shell">
              {cameraActive ? (
                <>
                  <video ref={videoRef} className="camera-preview__video" playsInline muted aria-label="Live camera preview" />
                  <div className="camera-preview__overlay">
                    <div
                      className="camera-stage"
                      style={{ aspectRatio: `${booth.width} / ${booth.depth}` }}
                    >
                      {items.map((item) => {
                        const config = ITEM_LIBRARY_BY_TYPE[item.type];
                        const footprint = getFootprint(item);

                        return (
                          <div
                            key={item.id}
                            className="camera-stage__item"
                            style={{
                              left: `${(item.x / booth.width) * 100}%`,
                              top: `${(item.y / booth.depth) * 100}%`,
                              width: `${(footprint.width / booth.width) * 100}%`,
                              height: `${(footprint.depth / booth.depth) * 100}%`,
                              background: config.bg,
                              borderColor: config.border,
                              boxShadow: `0 10px 30px ${config.shadow}`,
                            }}
                          >
                            <span>{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="camera-preview__empty">
                  <p>Start camera preview to rehearse the footprint overlay against the room.</p>
                </div>
              )}
            </div>
            {cameraError ? <p className="error-copy">{cameraError}</p> : null}
            <div className="modal-actions">
              <button
                type="button"
                className="primary-button"
                disabled={!arSupport.cameraSupported}
                onClick={() => setCameraActive((current) => !current)}
              >
                {cameraActive ? "Stop Camera Preview" : "Open Camera Preview"}
              </button>
            </div>
          </section>

          <section className="modal-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Immersive Launch</p>
                <h3>Live WebXR session</h3>
              </div>
            </div>
            <p className="panel-copy">
              On supported mobile hardware, the launcher below opens a true immersive AR session with
              surface hit-testing and a placeable, fully arranged 3D model.
            </p>
            <div ref={launcherRef} className="ar-launcher-zone">
              {showLiveLauncher ? null : (
                <button
                  type="button"
                  className="primary-button"
                  disabled={!arSupport.supported}
                  onClick={() => setShowLiveLauncher(true)}
                >
                  Prepare Live AR Launcher
                </button>
              )}
            </div>
            {launcherError ? <p className="error-copy">{launcherError}</p> : null}
          </section>
        </div>
      </div>
    </div>
  );
}
