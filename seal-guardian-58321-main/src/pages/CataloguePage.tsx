import VendorCatalog from "@/components/eshop/VendorCatalog";
import CatalogHeader from "@/components/eshop/CatalogHeader";

const CataloguePage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
            <CatalogHeader />
            <main className="px-4 md:px-10 py-8 max-w-7xl mx-auto">
                <VendorCatalog />
            </main>
        </div>
    );
};

export default CataloguePage;
