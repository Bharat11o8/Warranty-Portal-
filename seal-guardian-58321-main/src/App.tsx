import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Warranty from "./pages/Warranty";
import CustomerDashboard from "./pages/CustomerDashboard";
import FranchiseDashboard from "./pages/FranchiseDashboard";
// import AdminDashboard from "./pages/AdminDashboard"; // Legacy
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import AdminManagement from "./pages/AdminManagement";
import AdminProducts from "./pages/AdminProducts";
import ActivityLogs from "./pages/ActivityLogs";
import GrievancePage from "./pages/GrievancePage";
import AdminGrievancesPage from "./pages/AdminGrievancesPage";
import CustomerLayout from "./components/layouts/CustomerLayout";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import CataloguePage from "./pages/CataloguePage";
import CategoryPage from "./pages/eshop/CategoryPage";
import ProductPage from "./pages/eshop/ProductPage";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/warranty" element={<Warranty />} />
              {/* Customer Routes Layout */}
              <Route element={<CustomerLayout />}>
                <Route path="/dashboard/customer" element={<CustomerDashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/grievance" element={<GrievancePage />} />
                <Route path="/terms" element={<Terms />} />
              </Route>

              <Route path="/dashboard/vendor" element={<FranchiseDashboard />} />
              <Route path="/dashboard/admin" element={<AdminLayout />} />
              <Route path="/admin/manage" element={<AdminManagement />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/activity-logs" element={<ActivityLogs />} />
              <Route path="/catalogue" element={<CataloguePage />} />
              <Route path="/category/:categoryId" element={<CategoryPage />} />
              <Route path="/product/:productId" element={<ProductPage />} />
              <Route path="/admin/grievances" element={<AdminGrievancesPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
