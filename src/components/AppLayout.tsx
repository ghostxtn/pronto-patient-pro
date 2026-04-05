import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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
  Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
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
            <Link to="/" className="flex items-center gap-2">
              <svg width="36" height="36" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="13" width="44" height="18" rx="9" fill="#65a98f" />
                <rect x="13" y="0" width="18" height="22" rx="9" fill="#4f8fe6" />
                <rect x="13" y="22" width="18" height="22" rx="9" fill="#4f8fe6" />
              </svg>
              <span className="font-display font-bold text-lg hidden sm:inline" style={{ color: "#1a2e3b" }}>MediBook</span>
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
            <button
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-[#b5d1cc] text-[#5a7a8a] hover:bg-[#eaf5ff] transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menü"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="md:hidden overflow-hidden border-b sticky top-16 z-40 bg-white/95 backdrop-blur-md"
            style={{ borderColor: "#b5d1cc" }}
          >
            <div className="container flex flex-col gap-1 py-3">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    isActiveLink(link.to)
                      ? "bg-[#eaf5ff] text-[#4f8fe6]"
                      : "text-[#5a7a8a] hover:bg-[#f4f8fd] hover:text-[#1a2e3b]"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 pt-2 border-t flex items-center justify-between px-2" style={{ borderColor: "#b5d1cc" }}>
                <span className="text-xs text-[#5a7a8a]">{user?.email}</span>
                <button onClick={logout} className="flex items-center gap-1 text-xs text-[#5a7a8a] hover:text-[#e05252] transition-colors">
                  <LogOut className="h-3.5 w-3.5" />
                  Çıkış
                </button>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <main className="container py-6">{children}</main>
    </div>
  );
}
