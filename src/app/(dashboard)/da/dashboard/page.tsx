"use client";

import { useState, useEffect } from "react";
import DeptDashboardView from "@/components/shared/DeptDashboardView";
import { getDeptInfo, type DeptInfo } from "@/services/da.service";

/**
 * DA dashboard page — client component.
 *
 * Previously this was an async server component that called getDeptInfo(),
 * which reads useAuthStore.getState().user?.deptId internally. Zustand is
 * client-side only; on the server the store is always initialised with
 * user = null, so getDeptId() returned undefined and the page rendered a
 * hard-coded fallback on every SSR pass.
 *
 * Converting to a client component ensures the effect runs after the auth
 * store has been hydrated by the DA layout's useEffect, so getDeptId()
 * returns the real value.
 */
export default function DeptAdminDashboard() {
    const [info, setInfo] = useState<DeptInfo | null>(null);

    useEffect(() => {
        getDeptInfo().then(setInfo);
    }, []);

    if (!info) return null;

    return (
        <DeptDashboardView
            deptName={info.name}
            subtitle={info.subtitle}
            linkPrefix="/da"
            showQuotaRequestLink
        />
    );
}
