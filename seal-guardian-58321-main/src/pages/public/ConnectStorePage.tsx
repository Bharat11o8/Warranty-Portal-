import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Phone, Mail, Store, ShieldCheck, Sofa } from "lucide-react";
import EVProductsForm from "@/components/warranty/EVProductsForm";
import SeatCoverForm from "@/components/warranty/SeatCoverForm";
import api from "@/lib/api";

interface StoreDetails {
    id: number;
    store_name: string;
    store_email: string;
    contact_number: string;
    address_line1?: string;
    city?: string;
    state?: string;
    store_code?: string;
    vendor_details_id?: number;
}

const ConnectStorePage = () => {
    const { storeCode } = useParams<{ storeCode: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [storeDetails, setStoreDetails] = useState<StoreDetails | null>(null);
    const [installers, setInstallers] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"ev" | "seat-cover">("ev");

    useEffect(() => {
        const fetchStoreDetails = async () => {
            if (!storeCode) {
                setError("No store code provided");
                setLoading(false);
                return;
            }

            try {
                // Fetch store details from backend
                const response = await api.get(`/public/stores/code/${storeCode}`);

                if (response.data.success && response.data.store) {
                    const store = response.data.store;
                    setInstallers(response.data.installers || []);
                    setStoreDetails({
                        id: store.vendor_details_id,
                        store_name: store.store_name,
                        store_email: store.store_email,
                        contact_number: store.contact_number,
                        address_line1: store.address_line1,
                        city: store.city,
                        state: store.state,
                        store_code: store.store_code,
                        vendor_details_id: store.vendor_details_id
                    });
                } else {
                    setError("Store not found");
                }
                setLoading(false);
            } catch (err: any) {
                console.error("Failed to fetch store details:", err);
                setError(err.response?.data?.error || "Store not found or not verified");
                setLoading(false);
            }
        };

        fetchStoreDetails();
    }, [storeCode]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                        Loading Store...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !storeDetails) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Card className="max-w-md w-full border-red-200 bg-red-50">
                    <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Store className="h-8 w-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-red-700 mb-2">Store Not Found</h2>
                        <p className="text-sm text-red-600">
                            {error || "The store code you scanned is invalid or expired."}
                        </p>
                        <p className="text-xs text-red-400 mt-4">
                            Code: {storeCode}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Store Info Card */}
            <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50/50 overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-2xl border border-orange-200 flex items-center justify-center shadow-sm">
                            <Store className="h-8 w-8 text-orange-600" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-xl font-bold text-slate-900">
                                    {storeDetails.store_name}
                                </h1>
                                <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] font-bold">
                                    Verified Partner
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                <span className="flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5 text-orange-500" />
                                    {storeDetails.contact_number}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5 text-orange-500" />
                                    {storeDetails.store_email}
                                </span>
                                {storeDetails.city && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-orange-500" />
                                        {storeDetails.city}, {storeDetails.state}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Product Type Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "ev" | "seat-cover")} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-100 rounded-2xl p-1">
                    <TabsTrigger
                        value="ev"
                        className="rounded-xl h-12 data-[state=active]:bg-white data-[state=active]:shadow-md flex items-center gap-2 font-bold"
                    >
                        <ShieldCheck className="h-5 w-5 text-blue-600" />
                        <span>PPF / EV Products</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="seat-cover"
                        className="rounded-xl h-12 data-[state=active]:bg-white data-[state=active]:shadow-md flex items-center gap-2 font-bold"
                    >
                        <Sofa className="h-5 w-5 text-orange-600" />
                        <span>Seat Covers</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="ev" className="mt-6">
                    <EVProductsForm
                        isPublic={true}
                        storeDetails={storeDetails}
                        installers={installers}
                    />
                </TabsContent>

                <TabsContent value="seat-cover" className="mt-6">
                    <SeatCoverForm
                        isPublic={true}
                        storeDetails={storeDetails}
                        installers={installers}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ConnectStorePage;
