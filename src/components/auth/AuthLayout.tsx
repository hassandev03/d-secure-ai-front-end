"use client";

import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

interface AuthLayoutProps {
    children: React.ReactNode;
    portalName: string;
    portalDescription: string;
    portalIcon: LucideIcon;
    panelColor: string; // Tailwind bg class e.g. "bg-brand-950"
    textColor?: string;
}

export default function AuthLayout({
    children,
    portalName,
    portalDescription,
    portalIcon: PortalIcon,
    panelColor,
    textColor = "text-white",
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen">
            {/* Left branded panel */}
            <div
                className={`hidden w-[40%] flex-col justify-between p-10 lg:flex ${panelColor} ${textColor}`}
            >
                <div>
                    <Link href="/" className="inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Link>
                </div>

                <div className="flex flex-col items-center text-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                        <PortalIcon className="h-10 w-10" />
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="h-5 w-5 opacity-80" />
                        <span className="text-lg font-semibold opacity-90">{APP_NAME}</span>
                    </div>
                    <h2 className="text-2xl font-bold">{portalName}</h2>
                    <p className="mt-2 max-w-xs opacity-80">{portalDescription}</p>
                </div>

                <div className="text-center text-xs opacity-50">
                    © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
                </div>
            </div>

            {/* Mobile top banner */}
            <div
                className={`fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-4 lg:hidden ${panelColor} ${textColor}`}
            >
                <Link href="/" className="flex items-center gap-2 text-sm opacity-80">
                    <ArrowLeft className="h-4 w-4" />
                    Home
                </Link>
                <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-semibold">{APP_NAME}</span>
                </div>
                <PortalIcon className="h-5 w-5 opacity-80" />
            </div>

            {/* Right form panel */}
            <div className="flex w-full flex-col items-center justify-center bg-white px-6 pt-20 pb-10 lg:w-[60%] lg:pt-10">
                <div className="w-full max-w-md">{children}</div>
            </div>
        </div>
    );
}
