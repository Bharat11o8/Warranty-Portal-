import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import AdminGrievances from "@/components/admin/AdminGrievances";
import { Loader2 } from "lucide-react";

const AdminGrievancesPage = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return <Navigate to="/login" />;
    if (user.role !== "admin") return <Navigate to="/" />;

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <AdminGrievances />
        </div>
    );
};

export default AdminGrievancesPage;
