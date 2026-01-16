import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProductManagement } from "@/components/admin/ProductManagement";
import { CatalogManagement } from "@/components/admin/CatalogManagement";
import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
                        Back to Dashboard
                    </Button>

                    <div className="bg-card rounded-lg border shadow-sm p-6">
                        <Tabs defaultValue="warranty" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-8">
                                <TabsTrigger value="warranty">Warranty Products</TabsTrigger>
                                <TabsTrigger value="catalogue">Catalogue Products</TabsTrigger>
                            </TabsList>

                            <TabsContent value="warranty" className="mt-0">
                                <div className="space-y-4">
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight">Warranty Products</h2>
                                        <p className="text-muted-foreground">
                                            Manage products eligible for warranty registration
                                        </p>
                                    </div>
                                    <ProductManagement />
                                </div>
                            </TabsContent>

                            <TabsContent value="catalogue" className="mt-0">
                                <CatalogManagement />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminProducts;
