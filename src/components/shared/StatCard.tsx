import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    delta?: {
        value: string;
        trend: "up" | "down" | "flat";
    };
    iconColor?: string;
    className?: string;
}

export default function StatCard({
    title,
    value,
    icon: Icon,
    delta,
    iconColor = "text-brand-600 bg-brand-50",
    className,
}: StatCardProps) {
    const TrendIcon = delta?.trend === "up" ? TrendingUp : delta?.trend === "down" ? TrendingDown : Minus;
    const trendColor = delta?.trend === "up" ? "text-success" : delta?.trend === "down" ? "text-danger" : "text-muted-foreground";

    return (
        <div className={cn("rounded-xl border border-border bg-white p-5 transition-shadow hover:shadow-md", className)}>
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                    {delta && (
                        <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
                            <TrendIcon className="h-3.5 w-3.5" />
                            {delta.value}
                        </div>
                    )}
                </div>
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", iconColor)}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}
