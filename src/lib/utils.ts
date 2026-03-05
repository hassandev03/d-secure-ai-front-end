import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { UserRole } from "@/types/user.types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Get the dashboard redirect path for a given user role */
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/sa/dashboard';
    case 'ORG_ADMIN':
      return '/oa/dashboard';
    case 'DEPT_ADMIN':
      return '/da/dashboard';
    case 'ORG_EMPLOYEE':
    case 'PROFESSIONAL':
      return '/dashboard';
    default:
      return '/';
  }
}

/** Get the login path for a given portal type */
export function getLoginPath(portal: 'super-admin' | 'organization' | 'user'): string {
  return `/auth/${portal}/login`;
}

/** Format a number with commas */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/** Format a number as compact (e.g., 1.2K, 3.5M) */
export function formatCompact(num: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
}

/** Calculate percentage */
export function percentage(used: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((used / total) * 100);
}
