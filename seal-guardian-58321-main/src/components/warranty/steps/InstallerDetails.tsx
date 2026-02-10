import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MobileSelect } from "@/components/ui/mobile-select";
import { Combobox } from "@/components/ui/combobox";
import { EVFormData } from "../EVProductsForm";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface InstallerDetailsProps {
  formData: EVFormData;
  updateFormData: (updates: Partial<EVFormData>) => void;
  onNext: () => void;
  isPublic?: boolean;
  installers?: any[];
}

const InstallerDetails = ({ formData, updateFormData, onNext, isPublic, installers }: InstallerDetailsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stores, setStores] = useState<any[]>([]);
  const [manpowerList, setManpowerList] = useState<any[]>(installers || []);

  // Fetch stores on mount (only if not public or no store data)
  useEffect(() => {
    if (isPublic && installers) {
      setManpowerList(installers);
      return;
    }

    const fetchStores = async () => {
      try {
        const response = await api.get('/public/stores');
        if (response.data.success) {
          setStores(response.data.stores);
        } else {
          toast({ title: "Failed to Load Stores", description: "Could not fetch store list. Please refresh.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Failed to fetch stores", error);
        toast({ title: "Network Error", description: "Could not connect to server. Please check your internet.", variant: "destructive" });
      }
    };
    fetchStores();
  }, []);

  // Fetch manpower when store changes
  useEffect(() => {
    const fetchManpower = async () => {
      const selectedStore = stores.find(s => s.store_name === formData.storeName);
      if (selectedStore) {
        // Auto-fill all store details
        updateFormData({
          storeEmail: selectedStore.store_email || '',
          dealerMobile: selectedStore.phone || '',
          dealerAddr1: selectedStore.address || '',
          dealerAddr2: '', // Not stored in database
          dealerCity: selectedStore.city || '',
          dealerState: selectedStore.state || '',
          dealerPostalCode: selectedStore.pincode || ''
        });

        try {
          const response = await api.get(`/public/stores/${selectedStore.vendor_details_id}/manpower?active=true`);
          if (response.data.success) {
            setManpowerList(response.data.manpower);
            if (response.data.manpower.length === 0) {
              toast({ title: "No Installers Found", description: "This store has no active installers. Please contact support.", variant: "destructive" });
            }
          }
        } catch (error) {
          console.error("Failed to fetch manpower", error);
          setManpowerList([]);
          toast({ title: "Failed to Load Installers", description: "Could not fetch installer list for this store.", variant: "destructive" });
        }
      } else {
        setManpowerList([]);
      }
    };

    if (isPublic && installers) {
      setManpowerList(installers);
      return;
    }

    if (formData.storeName) {
      fetchManpower();
    }
  }, [formData.storeName, stores, isPublic, installers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Custom validation for required fields
    if (!formData.storeName) {
      toast({ title: "Store Name Required", description: "Please select a store", variant: "destructive" });
      return;
    }
    if (!formData.installerName) {
      toast({ title: "Installer Name Required", description: "Please select an installer", variant: "destructive" });
      return;
    }

    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold mb-2">📋 Installer Information</h3>
        <p className="text-muted-foreground mb-6">Please provide the store/installer details</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="storeName">
            Store Name <span className="text-destructive">*</span>
          </Label>
          {user?.role === 'vendor' || isPublic ? (
            <Input
              id="storeName"
              value={formData.storeName}
              readOnly
              className="bg-muted"
              placeholder={isPublic ? "Store Name" : "Loading store name..."}
            />
          ) : (
            <Combobox
              options={stores.map(store => ({ value: store.store_name, label: store.store_name }))}
              value={formData.storeName}
              onChange={(value) => updateFormData({ storeName: value })}
              placeholder="Select Store"
              searchPlaceholder="Search store name..."
              emptyMessage="No store found."
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="installerName">
            Installer Name <span className="text-destructive">*</span>
          </Label>
          <MobileSelect
            value={formData.installerName}
            onValueChange={(value) => {
              const selectedManpower = manpowerList.find(mp => mp.name === value);
              updateFormData({
                installerName: value,
                installerCode: selectedManpower?.manpower_id || "",
                manpowerId: selectedManpower?.id
              });
            }}
            disabled={!formData.storeName || manpowerList.length === 0}
            placeholder={!formData.storeName ? "Select Store First" : manpowerList.length === 0 ? "No Manpower Found" : "Select Installer"}
            options={manpowerList.map((mp) => ({
              value: mp.name,
              label: `${mp.name} (${mp.applicator_type})`
            }))}
            title="Select Installer"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="storeEmail">
            Store Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="storeEmail"
            type="email"
            placeholder="store@example.com"
            value={formData.storeEmail}
            onChange={(e) => updateFormData({ storeEmail: e.target.value })}
            required
            readOnly
            className="bg-muted"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dealerMobile">
            Mobile Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="dealerMobile"
            type="tel"
            placeholder="9876543210"
            value={formData.dealerMobile}
            onChange={(e) => updateFormData({ dealerMobile: e.target.value })}
            required
            readOnly
            className="bg-muted"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="dealerAddr1">
            Address Line 1 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="dealerAddr1"
            type="text"
            placeholder="Street address, P.O. box"
            value={formData.dealerAddr1}
            onChange={(e) => updateFormData({ dealerAddr1: e.target.value })}
            required
            readOnly
            className="bg-muted"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="dealerAddr2">Address Line 2</Label>
          <Input
            id="dealerAddr2"
            type="text"
            placeholder="Apartment, suite, unit, building, floor, etc."
            value={formData.dealerAddr2}
            onChange={(e) => updateFormData({ dealerAddr2: e.target.value })}
            readOnly
            className="bg-muted"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dealerState">
            State <span className="text-destructive">*</span>
          </Label>
          <Input
            id="dealerState"
            type="text"
            placeholder="State"
            value={formData.dealerState}
            onChange={(e) => updateFormData({ dealerState: e.target.value })}
            required
            readOnly
            className="bg-muted"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dealerCity">
            City <span className="text-destructive">*</span>
          </Label>
          <Input
            id="dealerCity"
            type="text"
            placeholder="City"
            value={formData.dealerCity}
            onChange={(e) => updateFormData({ dealerCity: e.target.value })}
            required
            readOnly
            className="bg-muted"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dealerPostalCode">
            Postal Code <span className="text-destructive">*</span>
          </Label>
          <Input
            id="dealerPostalCode"
            type="text"
            placeholder="Enter PIN code"
            value={formData.dealerPostalCode}
            onChange={(e) => updateFormData({ dealerPostalCode: e.target.value })}
            required
            readOnly
            className="bg-muted"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg">
          Next Step →
        </Button>
      </div>
    </form>
  );
};

export default InstallerDetails;