import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { ARPreview } from "./ARPreview";
import type { ARPreviewPayload } from "../lib/boothBuilder";

export interface RootOutletContext {
  openAR: (payload?: ARPreviewPayload) => void;
}

export function Root() {
  const [showAR, setShowAR] = useState(false);
  const [payload, setPayload] = useState<ARPreviewPayload | undefined>(undefined);
  const location = useLocation();
  const match = location.pathname.match(/\/builder\/(.+)/);
  const templateId = match ? match[1] : "default";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Outlet
        context={{
          openAR: (nextPayload?: ARPreviewPayload) => {
            setPayload(nextPayload);
            setShowAR(true);
          },
        }}
      />

      <ARPreview
        isOpen={showAR}
        onClose={() => setShowAR(false)}
        templateId={templateId}
        project={payload}
      />
    </div>
  );
}
