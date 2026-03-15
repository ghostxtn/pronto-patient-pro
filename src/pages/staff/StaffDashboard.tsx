import AppLayout from "@/components/AppLayout";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function StaffDashboard() {
  const { user } = useAuth();

  useEffect(() => {
    console.debug("[staff][dashboard] mounted", {
      userId: user?.id,
      role: user?.role,
    });
  }, [user?.id, user?.role]);

  return (
    <AppLayout>
      <div className="space-y-2">
        <h1 className="text-3xl font-display font-bold">Staff Dashboard</h1>
        <p className="text-muted-foreground">
          Staff area is ready for the next phase.
        </p>
      </div>
    </AppLayout>
  );
}
