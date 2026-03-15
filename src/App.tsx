import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import RequireAuth from "@/components/auth/RequireAuth";
import RequireRole from "@/components/auth/RequireRole";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import FindDoctors from "./pages/FindDoctors";
import DoctorProfile from "./pages/DoctorProfile";
import MyAppointments from "./pages/MyAppointments";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorSchedule from "./pages/doctor/DoctorSchedule";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageDoctors from "./pages/admin/ManageDoctors";
import ManageStaff from "./pages/admin/ManageStaff";
import ManagePatients from "./pages/admin/ManagePatients";
import ManageAppointments from "./pages/admin/ManageAppointments";
import ClinicSettings from "./pages/admin/ClinicSettings";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import Profile from "./pages/Profile";
import StaffDashboard from "./pages/staff/StaffDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route element={<RequireAuth />}>
                <Route path="/profile" element={<Profile />} />

                <Route element={<RequireRole allowedRoles={["patient"]} />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/doctors" element={<FindDoctors />} />
                  <Route path="/doctors/:id" element={<DoctorProfile />} />
                  <Route path="/appointments" element={<MyAppointments />} />
                </Route>

                <Route element={<RequireRole allowedRoles={["doctor"]} />}>
                  <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
                  <Route path="/doctor/schedule" element={<DoctorSchedule />} />
                  <Route path="/doctor/appointments" element={<DoctorAppointments />} />
                </Route>

                <Route element={<RequireRole allowedRoles={["owner", "admin"]} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/doctors" element={<ManageDoctors />} />
                  <Route path="/admin/staff" element={<ManageStaff />} />
                </Route>

                <Route element={<RequireRole allowedRoles={["owner", "admin", "staff"]} />}>
                  <Route path="/staff/dashboard" element={<StaffDashboard />} />
                  <Route path="/admin/patients" element={<ManagePatients />} />
                  <Route path="/admin/appointments" element={<ManageAppointments />} />
                </Route>

                <Route element={<RequireRole allowedRoles={["owner"]} />}>
                  <Route path="/owner/dashboard" element={<OwnerDashboard />} />
                  <Route path="/admin/settings" element={<ClinicSettings />} />
                </Route>
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
