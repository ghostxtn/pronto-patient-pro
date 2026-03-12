import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  Stethoscope, LogOut, LayoutDashboard, Search, CalendarDays, User, Clock, ClipboardList,
  Users, Settings, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut, hasRole } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const isAdmin = hasRole("admin");
  const isDoctor = hasRole("doctor");
  const roleLabel = isAdmin ? t.admin : isDoctor ? t.doctor : t.patient;

  const patientLinks = [
    { to: "/dashboard", label: t.dashboard, icon: LayoutDashboard },
    { to: "/doctors", label: t.findDoctorsNav, icon: Search },
    { to: "/appointments", label: t.myAppointments, icon: CalendarDays },
    { to: "/profile", label: t.profile, icon: User },
  ];

  const doctorLinks = [
    { to: "/doctor/dashboard", label: t.dashboard, icon: LayoutDashboard },
    { to: "/doctor/schedule", label: t.myScheduleNav, icon: Clock },
    { to: "/doctor/appointments", label: t.appointmentsNav, icon: ClipboardList },
    { to: "/profile", label: t.profile, icon: User },
  ];

  const adminLinks = [
    { to: "/admin/dashboard", label: t.dashboard, icon: LayoutDashboard },
    { to: "/admin/doctors", label: t.doctorsNav, icon: Stethoscope },
    { to: "/admin/patients", label: t.patientsNav, icon: Users },
    { to: "/admin/appointments", label: t.appointmentsNav, icon: CalendarDays },
    { to: "/admin/settings", label: t.settingsNav, icon: Settings },
  ];

  const links = isAdmin ? adminLinks : isDoctor ? doctorLinks : patientLinks;
  const homePath = isAdmin ? "/admin/dashboard" : isDoctor ? "/doctor/dashboard" : "/dashboard";

  return (
    <div className="min-h-screen bg-background">
      <header className="glass-strong border-b sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={homePath} className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg hidden sm:inline">MediBook</span>
            </Link>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
              {roleLabel}
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === link.to
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <span className="text-sm text-muted-foreground hidden lg:block">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-strong border-t">
        <div className="flex justify-around py-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                location.pathname === link.to
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="container py-6 pb-24 md:pb-6">{children}</main>
    </div>
  );
}
