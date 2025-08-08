
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Course from "./pages/Course";
import CreateCourse from "./pages/CreateCourse";
import EditCourse from "./pages/EditCourse";
import PaymentResult from "./pages/PaymentResult";
import InstructorEarnings from "./pages/InstructorEarnings";
import AdminPayouts from "./pages/AdminPayouts";
import UserManagement from "./pages/UserManagement";
import AdminRoute from "./components/AdminRoute";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Debug component to log route changes
const RouteLogger = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('Current route:', location.pathname);
    console.log('Route state:', location.state);
  }, [location]);
  
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RouteLogger />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/courses" element={
              <ProtectedRoute>
                <Courses />
              </ProtectedRoute>
            } />
            <Route path="/course/:courseId" element={
              <ProtectedRoute>
                <Course />
              </ProtectedRoute>
            } />
            <Route path="/create-course" element={
              <ProtectedRoute>
                <CreateCourse />
              </ProtectedRoute>
            } />
            <Route path="/edit-course/:courseId" element={
              <ProtectedRoute>
                <EditCourse />
              </ProtectedRoute>
            } />
            <Route path="/instructor/earnings" element={
              <ProtectedRoute>
                <InstructorEarnings />
              </ProtectedRoute>
            } />
            <Route path="/admin/payouts" element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminPayouts />
                </AdminRoute>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute>
                <AdminRoute requireSuperAdmin={true}>
                  <UserManagement />
                </AdminRoute>
              </ProtectedRoute>
            } />
            <Route path="/payment/finish" element={<PaymentResult />} />
            <Route path="/payment/error" element={<PaymentResult />} />
            <Route path="/payment/pending" element={<PaymentResult />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
