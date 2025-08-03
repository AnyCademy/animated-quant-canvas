
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { lazy, Suspense, useEffect } from "react";

// Lazy load components
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Courses = lazy(() => import("./pages/Courses"));
const Course = lazy(() => import("./pages/Course"));
const CreateCourse = lazy(() => import("./pages/CreateCourse"));
const EditCourse = lazy(() => import("./pages/EditCourse"));
const PaymentResult = lazy(() => import("./pages/PaymentResult"));
const InstructorPaymentSettings = lazy(() => import("./pages/InstructorPaymentSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-quant-blue-dark flex items-center justify-center">
    <div className="text-center">
      <div className="w-20 h-20 border-4 border-t-quant-teal border-quant-blue rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-quant-white">Loading...</p>
    </div>
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
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
              <Route path="/instructor/payment-settings" element={
                <ProtectedRoute>
                  <InstructorPaymentSettings />
                </ProtectedRoute>
              } />
              <Route path="/payment/finish" element={<PaymentResult />} />
              <Route path="/payment/error" element={<PaymentResult />} />
              <Route path="/payment/pending" element={<PaymentResult />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
