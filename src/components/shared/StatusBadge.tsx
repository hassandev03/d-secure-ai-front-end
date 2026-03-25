import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type StatusType =
    | "active"
    | "onboarding"
    | "unverified"
    | "suspended"
    | "deactivated"
    | "approved"
    | "denied"
    | "pending";

interface StatusBadgeProps {
    status: string;
    className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
    active:      { label: "Active",      className: "bg-success/10 text-success border-success/20" },
    onboarding:  { label: "Onboarding",  className: "bg-info/10 text-info border-info/20" },
    unverified:  { label: "Unverified",  className: "bg-warning/10 text-warning border-warning/20" },
    suspended:   { label: "Suspended",   className: "bg-danger/10 text-danger border-danger/20" },
    deactivated: { label: "Deactivated", className: "bg-muted text-muted-foreground border-border" },
    approved:    { label: "Approved",    className: "bg-success/10 text-success border-success/20" },
    denied:      { label: "Denied",      className: "bg-danger/10 text-danger border-danger/20" },
    pending:     { label: "Pending",     className: "bg-warning/10 text-warning border-warning/20" },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
    const key = status.toLowerCase() as StatusType;
    const config = statusConfig[key] || { label: status, className: "bg-muted text-muted-foreground border-border" };

    return (
        <Badge variant="outline" className={cn("font-medium capitalize", config.className, className)}>
            {config.label}
        </Badge>
    );
}
