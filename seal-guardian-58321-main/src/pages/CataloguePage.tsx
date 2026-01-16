import VendorCatalog from "@/components/eshop/VendorCatalog";
import Header from "@/components/Header";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const CataloguePage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
            <Header />
            <main className="px-4 md:px-10 py-8 max-w-7xl mx-auto">
                <div className="mb-6">
                    <Link
                        to="/vendor-dashboard"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-brand-orange transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Dashboard
                    </Link>
                </div>
                <VendorCatalog />
            </main>
        </div>
    );
};

export default CataloguePage;
