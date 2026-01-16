import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Warranty from "./pages/Warranty";
import Profile from "./pages/Profile";
import CustomerDashboard from "./pages/CustomerDashboard";
import FranchiseDashboard from "./pages/FranchiseDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminManagement from "./pages/AdminManagement";
import AdminProducts from "./pages/AdminProducts";
import ActivityLogs from "./pages/ActivityLogs";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import CataloguePage from "./pages/CataloguePage";
import CategoryPage from "./pages/eshop/CategoryPage";
import ProductPage from "./pages/eshop/ProductPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/warranty" element={<Warranty />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard/customer" element={<CustomerDashboard />} />
            <Route path="/dashboard/vendor" element={<FranchiseDashboard />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/admin/manage" element={<AdminManagement />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/activity-logs" element={<ActivityLogs />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/catalogue" element={<CataloguePage />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/product/:productId" element={<ProductPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
