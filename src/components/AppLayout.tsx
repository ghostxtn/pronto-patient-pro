import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import api from "@/services/api";
import { getDefaultRouteByRole } from "@/lib/auth-routing";
import { hasActiveDoctorProfile } from "@/lib/doctor-access";
import {
  Stethoscope, LogOut, LayoutDashboard, Search, CalendarDays, User, Clock, ClipboardList,
  Users, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const isOwner = user?.role === "owner";
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";
  const isDoctor = user?.role === "doctor";
  const isPatient = user?.role === "patient";

  const { data: doctorProfile } = useQuery({
    queryKey: ["layout-doctor-profile", user?.id],
    queryFn: () => api.doctors.me(),
    enabled: isOwner || isAdmin,
    retry: false,
  });

  const patientLinks = [
    { to: "/patient/dashboard", label: t.dashboard, icon: LayoutDashboard },
    { to: "/patient/doctors", label: t.findDoctorsNav, icon: Search },
    { to: "/patient/appointments", label: t.myAppointments, icon: CalendarDays },
    { to: "/patient/profile", label: t.profile, icon: User },
  ];

  const doctorLinks = [
    { to: "/doctor/dashboard", label: t.dashboard, icon: LayoutDashboard },
    { to: "/doctor/schedule", label: t.myScheduleNav, icon: Clock },
    { to: "/doctor/appointments", label: t.appointmentsNav, icon: ClipboardList },
    { to: "/doctor/patients", label: "Hastalarım", icon: Users },
    { to: "/profile", label: t.profile, icon: User },
  ];

  const adminLinks = useMemo(() => {
    const links = [
      { to: "/admin/dashboard", label: t.dashboard, icon: LayoutDashboard },
      { to: "/admin/doctors", label: t.doctorsNav, icon: Stethoscope },
      { to: "/admin/staff", label: t.staffNav, icon: Users },
      { to: "/admin/patients", label: t.patientsNav, icon: Users },
      { to: "/admin/appointments", label: t.appointmentsNav, icon: CalendarDays },
      { to: "/admin/settings", label: t.settingsNav, icon: Settings },
    ];

    if ((isOwner || isAdmin) && hasActiveDoctorProfile(doctorProfile)) {
      links.splice(1, 0, { to: "/doctor/schedule", label: "🩺 Doktor Panelim", icon: Stethoscope });
    }

    return links;
  }, [isOwner, isAdmin, doctorProfile, t]);

  const staffLinks = [
    { to: "/staff/dashboard", label: t.dashboard, icon: LayoutDashboard },
    { to: "/staff/doctors", label: "Doktorlar", icon: Stethoscope },
    { to: "/admin/patients", label: t.patientsNav, icon: Users },
    { to: "/admin/appointments", label: t.appointmentsNav, icon: CalendarDays },
  ];

  const links =
    isOwner || isAdmin ? adminLinks
    : isStaff ? staffLinks
    : isDoctor ? doctorLinks
    : patientLinks;

  const roleLabel =
    isOwner ? "Owner"
    : isAdmin ? t.admin
    : isStaff ? "Staff"
    : isDoctor ? t.doctor
    : isPatient ? t.patient
    : t.patient;

  const defaultRoute = getDefaultRouteByRole(user?.role);
  const homePath =
    isOwner || isAdmin ? "/admin/dashboard"
    : isStaff ? "/staff/dashboard"
    : isDoctor ? "/doctor/dashboard"
    : defaultRoute === "/patient/dashboard" ? "/patient/dashboard" : "/patient/dashboard";

  const isActiveLink = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

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
                  isActiveLink(link.to)
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
            <Button variant="ghost" size="icon" onClick={logout}>
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
                  isActiveLink(link.to)
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
