import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { EVFormData } from "../EVProductsForm";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface InstallerDetailsProps {
  formData: EVFormData;
  updateFormData: (updates: Partial<EVFormData>) => void;
  onNext: () => void;
}

const InstallerDetails = ({ formData, updateFormData, onNext }: InstallerDetailsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stores, setStores] = useState<any[]>([]);
  const [manpowerList, setManpowerList] = useState<any[]>([]);

  // Fetch stores on mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await api.get('/public/stores');
        if (response.data.success) {
          setStores(response.data.stores);
        }
      } catch (error) {
        console.error("Failed to fetch stores", error);
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
          const response = await api.get(`/public/stores/${selectedStore.vendor_details_id}/manpower`);
          if (response.data.success) {
            setManpowerList(response.data.manpower);
          }
        } catch (error) {
          console.error("Failed to fetch manpower", error);
          setManpowerList([]);
        }
      } else {
        setManpowerList([]);
      }
    };

    if (formData.storeName) {
      fetchManpower();
    }
  }, [formData.storeName, stores]);

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
          {user?.role === 'vendor' ? (
            <Input
              id="storeName"
              value={formData.storeName}
              readOnly
              className="bg-muted"
              placeholder="Loading store name..."
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
          <Select
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
            required
          >
            <SelectTrigger id="installerName">
              <SelectValue placeholder={!formData.storeName ? "Select Store First" : manpowerList.length === 0 ? "No Manpower Found" : "Select Installer"} />
            </SelectTrigger>
            <SelectContent>
              {manpowerList.map((mp) => (
                <SelectItem key={mp.id} value={mp.name}>
                  {mp.name} ({mp.applicator_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="installerCode">
            Installer Code <span className="text-destructive">*</span>
          </Label>
          <Input
            id="installerCode"
            type="text"
            placeholder="Enter installer code"
            value={formData.installerCode}
            onChange={(e) => updateFormData({ installerCode: e.target.value })}
            required
            readOnly
            className="bg-muted"
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
            placeholder="+91 XXXXX XXXXX"
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