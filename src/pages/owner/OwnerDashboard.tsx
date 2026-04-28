import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function OwnerDashboard() {
  return (
    <AppLayout>
      <Card className="rounded-2xl border border-border bg-card shadow-soft">
        <CardContent className="space-y-2 p-6">
          <h1 className="text-3xl font-display font-bold text-foreground">Owner Dashboard</h1>
          <p className="text-muted-foreground">
            Owner area is ready for the next phase.
          </p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
