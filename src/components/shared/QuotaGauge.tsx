"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface QuotaGaugeProps {
    percentageUsed: number;  // 0-100
    planName?: string;
    renewsAt?: string;        // ISO date string
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

function daysUntil(isoDate: string): number {
    const target = new Date(isoDate).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
}

/**
 * QuotaGauge — animated circular gauge showing credit budget percentage usage.
 *
 * Color transitions:
 *  green  (0 – 59%)
 *  amber  (60 – 84%)
 *  red    (85 – 100%)
 */
export default function QuotaGauge({
    percentageUsed,
    planName,
    renewsAt,
    size = 'md',
    className,
}: QuotaGaugeProps) {
    const [animated, setAnimated] = useState(0);
    const rafRef = useRef<number>(0);

    /* Animate fill from 0 → percentageUsed on mount */
    useEffect(() => {
        const target = Math.min(100, Math.max(0, percentageUsed));
        let start: number | null = null;
        const duration = 900; // ms

        const step = (ts: number) => {
            if (!start) start = ts;
            const elapsed = ts - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimated(eased * target);
            if (progress < 1) rafRef.current = requestAnimationFrame(step);
        };

        rafRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafRef.current);
    }, [percentageUsed]);

    const dims = size === 'sm' ? 80 : size === 'lg' ? 160 : 120;
    const stroke = size === 'sm' ? 8 : size === 'lg' ? 14 : 11;
    const radius = (dims - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    // We draw 75% of the circle (270°) as the gauge arc
    const arcLength = circumference * 0.75;
    const offset = arcLength - (animated / 100) * arcLength;

    const strokeColor =
        percentageUsed >= 85 ? '#ef4444' :
        percentageUsed >= 60 ? '#f59e0b' :
        '#10b981';

    const trackColor = '#e2e8f0';
    const days = renewsAt ? daysUntil(renewsAt) : 0;

    const labelSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-4xl' : 'text-2xl';
    const subSize   = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-sm' : 'text-xs';
    const planSize  = size === 'sm' ? 'text-[9px]' : 'text-xs';
    const renewSize = size === 'sm' ? 'text-[8px]' : 'text-[11px]';

    return (
        <div className={cn("flex flex-col items-center gap-2", className)}>
            <div className="relative" style={{ width: dims, height: dims }}>
                <svg
                    width={dims}
                    height={dims}
                    style={{ transform: 'rotate(135deg)' }}
                    aria-label={`${Math.round(percentageUsed)}% of ${planName} quota used`}
                >
                    {/* Track */}
                    <circle
                        cx={dims / 2}
                        cy={dims / 2}
                        r={radius}
                        fill="none"
                        stroke={trackColor}
                        strokeWidth={stroke}
                        strokeDasharray={`${arcLength} ${circumference}`}
                        strokeLinecap="round"
                    />
                    {/* Fill */}
                    <circle
                        cx={dims / 2}
                        cy={dims / 2}
                        r={radius}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={stroke}
                        strokeDasharray={`${arcLength} ${circumference}`}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke 0.4s ease' }}
                    />
                </svg>

                {/* Centre text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingBottom: '10%' }}>
                    <span className={cn("font-extrabold leading-none tabular-nums", labelSize)} style={{ color: strokeColor }}>
                        {Math.round(animated)}%
                    </span>
                    <span className={cn("text-muted-foreground font-medium mt-0.5", subSize)}>used</span>
                </div>
            </div>

            {/* Labels below gauge */}
            <div className="text-center space-y-0.5">
                <p className={cn("font-semibold text-foreground", planSize)}>{planName} Plan</p>
                <p className={cn("text-muted-foreground", renewSize)}>
                    {days > 0 ? `Renews in ${days} day${days !== 1 ? 's' : ''}` : 'Renews today'}
                </p>
            </div>
        </div>
    );
}
