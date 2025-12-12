import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProductManagement } from "@/components/admin/ProductManagement";
import { useEffect } from "react";

const AdminProducts = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (user?.role !== 'admin') {
            navigate('/');
        }
    }, [user, navigate]);

    if (user?.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            <Header />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    {/* ProductManagement component already has a title, but we can wrap it nicely */}
                    <div className="bg-card rounded-lg border shadow-sm p-6">
                        <ProductManagement />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminProducts;
