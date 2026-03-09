"use client";

import { use } from "react";
import { Button } from "@/components/ui/button";
import DeptDashboardView from "@/components/shared/DeptDashboardView";

/** Map department IDs to display metadata (mock — replace with API later) */
const DEPT_META: Record<string, { name: string; head: string }> = {
    "dept-001": { name: "Engineering", head: "Sarah Johnson" },
    "dept-002": { name: "Marketing",   head: "Emma Davis" },
    "dept-003": { name: "Sales",       head: "David Kim" },
    "dept-004": { name: "Finance",     head: "Aisha Patel" },
    "dept-005": { name: "HR",          head: "Lisa Chen" },
    "dept-006": { name: "Operations",  head: "James Wilson" },
};

export default function DepartmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const dept = DEPT_META[id] ?? { name: "Department", head: "Unknown" };

    return (
        <DeptDashboardView
            deptName={dept.name}
            subtitle={`Managed by ${dept.head}`}
            breadcrumbs={[
                { label: "Organization", href: "/oa/dashboard" },
                { label: "Departments", href: "/oa/departments" },
                { label: dept.name },
            ]}
            linkPrefix={`/oa/departments/${id}`}
            headerActions={<Button variant="outline">Edit Department</Button>}
        />
    );
}
