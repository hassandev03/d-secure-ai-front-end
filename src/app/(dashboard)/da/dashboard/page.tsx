import DeptDashboardView from "@/components/shared/DeptDashboardView";
import { getDeptInfo } from "@/services/da.service";

export default async function DeptAdminDashboard() {
    const info = await getDeptInfo();
    return (
        <DeptDashboardView
            deptName={info.name}
            subtitle={info.subtitle}
            linkPrefix="/da"
            showQuotaRequestLink
        />
    );
}
