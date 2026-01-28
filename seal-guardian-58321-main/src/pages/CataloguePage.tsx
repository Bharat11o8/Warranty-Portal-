import VendorCatalog from "@/components/eshop/VendorCatalog";
import Header from "@/components/Header";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const CataloguePage = () => {
    return (
        <div className="w-full h-full">
            <VendorCatalog />
        </div>
    );
};

export default CataloguePage;
