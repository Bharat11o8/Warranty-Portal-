import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SeatCoverForm from "@/components/warranty/SeatCoverForm";
import EVProductsForm from "@/components/warranty/EVProductsForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const AdminWarrantyForm = () => {
    const [activeTab, setActiveTab] = useState("seat-cover");

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Warranty Registration</h2>
                <p className="text-slate-500">Register a new warranty for a customer.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
                    <TabsTrigger value="seat-cover">Seat Cover</TabsTrigger>
                    <TabsTrigger value="ev-products">EV Products</TabsTrigger>
                </TabsList>

                <TabsContent value="seat-cover" className="mt-0">
                    <SeatCoverForm />
                </TabsContent>

                <TabsContent value="ev-products" className="mt-0">
                    <EVProductsForm />
                </TabsContent>
            </Tabs>
        </div>
    );
};
