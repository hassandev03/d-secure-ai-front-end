"use client";

import { Bell, Search, LogOut, ChevronDown, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface TopbarProps {
    showProfile?: boolean;
}

export default function Topbar({ showProfile = true }: TopbarProps) {
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const initials = user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white/80 px-6 backdrop-blur-lg">
            {/* Right side */}
            <div className="ml-auto flex items-center gap-3">
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-4 w-4" />
                    <Badge className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger p-0 text-[10px] text-white">
                        3
                    </Badge>
                </Button>

                {/* Profile dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-brand-100 text-sm font-semibold text-brand-700">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden text-left md:block">
                                <p className="text-sm font-medium text-foreground">{user?.name || "User"}</p>
                                <p className="text-[11px] text-muted-foreground">{user?.role?.replace("_", " ") || "Guest"}</p>
                                {user?.orgName && (
                                    <p className="text-[10px] text-muted-foreground">{user.orgName}</p>
                                )}
                            </div>
                            <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <div className="px-2 py-1.5">
                            <p className="text-sm font-medium">{user?.name}</p>
                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                        <DropdownMenuSeparator />
                        {showProfile && (
                            <>
                                <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" /> Profile
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </>
                        )}
                        <DropdownMenuItem onClick={handleLogout} className="text-danger focus:text-danger cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" /> Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
