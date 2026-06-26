import { Suspense } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { PortalClient } from "@/components/portal/PortalClient";

// Operator share link — /portal/<operatorId>. Shows that operator's branded
// portal. Without an AP MAC it acts as a preview (browsing only); real clients
// arrive with ?clientMac=&apMac= appended by the router for live purchases.
export default async function OperatorPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ operatorId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { operatorId } = await params;
  await searchParams; // ensure dynamic rendering for client-side query reads

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <PortalClient operatorIdParam={operatorId} />
    </Suspense>
  );
}
