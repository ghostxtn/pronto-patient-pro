import AppLayout from "@/components/AppLayout";

export default function OwnerDashboard() {
  return (
    <AppLayout>
      <div className="space-y-2">
        <h1 className="text-3xl font-display font-bold">Owner Dashboard</h1>
        <p className="text-muted-foreground">
          Owner area is ready for the next phase.
        </p>
      </div>
    </AppLayout>
  );
}
