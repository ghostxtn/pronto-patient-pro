import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import RequireAuth from "@/components/auth/RequireAuth";
import RequireDoctorAccess from "@/components/auth/RequireDoctorAccess";
import RequireRole from "@/components/auth/RequireRole";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { getDefaultRouteByRole } from "@/lib/auth-routing";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import FindDoctors from "./pages/FindDoctors";
import Specialties from "./pages/Specialties";
import DoctorProfile from "./pages/DoctorProfile";
import MyAppointments from "./pages/MyAppointments";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorSchedule from "./pages/doctor/DoctorSchedule";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorPatients from "./pages/doctor/DoctorPatients";
import DoctorPatientDetail from "./pages/doctor/DoctorPatientDetail";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageDoctors from "./pages/admin/ManageDoctors";
import ManageStaff from "./pages/admin/ManageStaff";
import ManagePatients from "./pages/admin/ManagePatients";
import ManageAppointments from "./pages/admin/ManageAppointments";
import ClinicSettings from "./pages/admin/ClinicSettings";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import Profile from "./pages/Profile";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffDoctors from "./pages/staff/StaffDoctors";
import NotFound from "./pages/NotFound";

// Public pages
import WhyMedibook from "./pages/public/WhyMedibook";
import AppointmentProcess from "./pages/public/AppointmentProcess";
import Contact from "./pages/public/Contact";
import LocationPage from "./pages/public/Location";
import About from "./pages/public/About";
import Faq from "./pages/public/Faq";
import PatientRights from "./pages/public/PatientRights";
import Accessibility from "./pages/public/Accessibility";
import LegalKvkk from "./pages/public/LegalKvkk";
import LegalPrivacyPolicy from "./pages/public/LegalPrivacyPolicy";
import LegalCookiePolicy from "./pages/public/LegalCookiePolicy";
import LegalDataSubject from "./pages/public/LegalDataSubject";
import LegalMedicalDisclaimer from "./pages/public/LegalMedicalDisclaimer";
import LegalTermsOfUse from "./pages/public/LegalTermsOfUse";

const queryClient = new QueryClient();

function LegacyAppointmentsRedirect() {
  const { user } = useAuth();

  if (user?.role === "patient") {
    return <Navigate to="/patient/appointments" replace />;
  }

  return <Navigate to={getDefaultRouteByRole(user?.role)} replace />;
}

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/request-appointment" element={<Navigate to="/auth?tab=signup" replace />} />
        <Route path="/doctors" element={<FindDoctors />} />
        <Route path="/specialties" element={<Specialties />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Public information pages */}
        <Route path="/why-medibook" element={<WhyMedibook />} />
        <Route path="/appointment-process" element={<AppointmentProcess />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/location" element={<LocationPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/patient-rights" element={<PatientRights />} />
        <Route path="/accessibility" element={<Accessibility />} />

        {/* Legal pages */}
        <Route path="/legal/kvkk" element={<LegalKvkk />} />
        <Route path="/legal/privacy-policy" element={<LegalPrivacyPolicy />} />
        <Route path="/legal/cookie-policy" element={<LegalCookiePolicy />} />
        <Route path="/legal/data-subject-application" element={<LegalDataSubject />} />
        <Route path="/legal/medical-disclaimer" element={<LegalMedicalDisclaimer />} />
        <Route path="/legal/terms-of-use" element={<LegalTermsOfUse />} />

        <Route element={<RequireAuth />}>
          <Route path="/appointments" element={<LegacyAppointmentsRedirect />} />
          <Route path="/profile" element={<Profile />} />

          <Route element={<RequireRole allowedRoles={["patient"]} />}>
            <Route path="/patient/dashboard" element={<Dashboard />} />
            <Route path="/patient/profile" element={<Profile />} />
            <Route path="/patient/doctors" element={<FindDoctors />} />
            <Route path="/patient/doctors/:id" element={<DoctorProfile />} />
            <Route path="/patient/appointments" element={<MyAppointments />} />
          </Route>

          <Route element={<RequireDoctorAccess />}>
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/schedule" element={<DoctorSchedule />} />
            <Route path="/doctor/appointments" element={<DoctorAppointments />} />
            <Route path="/doctor/patients" element={<DoctorPatients />} />
            <Route path="/doctor/patients/:id" element={<DoctorPatientDetail />} />
          </Route>

          <Route element={<RequireRole allowedRoles={["owner", "admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/doctors" element={<ManageDoctors />} />
            <Route path="/admin/staff" element={<ManageStaff />} />
          </Route>

          <Route element={<RequireRole allowedRoles={["owner", "admin", "staff"]} />}>
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/doctors" element={<StaffDoctors />} />
            <Route path="/admin/patients" element={<ManagePatients />} />
            <Route path="/admin/appointments" element={<ManageAppointments />} />
          </Route>

          <Route element={<RequireRole allowedRoles={["owner", "admin"]} />}>
            <Route path="/admin/settings" element={<ClinicSettings />} />
          </Route>

          <Route element={<RequireRole allowedRoles={["owner"]} />}>
            <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          </Route>
        </Route>
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
