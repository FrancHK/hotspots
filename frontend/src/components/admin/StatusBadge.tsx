import { Badge } from "@/components/ui/Badge";

type OperatorStatus = "pending" | "active" | "blocked";

const tone: Record<OperatorStatus, "success" | "warning" | "danger"> = {
  active: "success",
  pending: "warning",
  blocked: "danger",
};

const label: Record<OperatorStatus, string> = {
  active: "Active",
  pending: "Inasubiri",
  blocked: "Imezuiwa",
};

// Consistent coloured status pill for operators across the admin pages.
export function StatusBadge({ status }: { status: OperatorStatus }) {
  return <Badge tone={tone[status]}>{label[status]}</Badge>;
}
