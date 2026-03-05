import { cn, percentage } from "@/lib/utils";

interface QuotaBarProps {
    used: number;
    total: number;
    label?: string;
    showLabel?: boolean;
    size?: "sm" | "md";
    className?: string;
}

export default function QuotaBar({
    used,
    total,
    label,
    showLabel = true,
    size = "md",
    className,
}: QuotaBarProps) {
    const pct = percentage(used, total);
    const color = pct >= 90 ? "bg-danger" : pct >= 70 ? "bg-warning" : "bg-brand-500";

    return (
        <div className={cn("space-y-1.5", className)}>
            {showLabel && (
                <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">{label || "Quota"}</span>
                    <span className="text-foreground font-semibold">
                        {used.toLocaleString()} / {total.toLocaleString()} ({pct}%)
                    </span>
                </div>
            )}
            <div className={cn("w-full overflow-hidden rounded-full bg-muted", size === "sm" ? "h-1.5" : "h-2.5")}>
                <div
                    className={cn("h-full rounded-full transition-all duration-500", color)}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                />
            </div>
        </div>
    );
}
