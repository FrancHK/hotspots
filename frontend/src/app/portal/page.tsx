import { Suspense } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { PortalClient } from "@/components/portal/PortalClient";

// Captive portal — PUBLIC, no auth. Reached as:
//   /portal?clientMac=X&apMac=Y         (real client redirect)
//   /portal?preview=true&operatorId=X   (operator preview)
export default function PortalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <PortalClient />
    </Suspense>
  );
}
