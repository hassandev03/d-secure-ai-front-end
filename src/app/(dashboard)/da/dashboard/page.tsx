"use client";

import DeptDashboardView from "@/components/shared/DeptDashboardView";

export default function DeptAdminDashboard() {
    return (
        <DeptDashboardView
            deptName="Engineering Department"
            subtitle="Department overview and team management."
            linkPrefix="/da"
            showQuotaRequestLink
        />
    );
}
