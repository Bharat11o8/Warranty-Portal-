import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EVFormData } from "../EVProductsForm";
import { getAllStates, getCitiesByState, fetchPincodeDetails } from "@/lib/indianAddressData";
import { Loader2 } from "lucide-react";

interface CustomerDetailsProps {
  formData: EVFormData;
  updateFormData: (updates: Partial<EVFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
  isCustomer?: boolean;
  isVendor?: boolean;
}

const CustomerDetails = ({ formData, updateFormData, onNext, onPrev, isCustomer = false, isVendor = false }: CustomerDetailsProps) => {
  const [loadingPincode, setLoadingPincode] = useState(false);
  const [states, setStates] = useState<any[]>([]);
  const [availableCities, setAvailableCities] = useState<any[]>([]);

  useEffect(() => {
    setStates(getAllStates());
  }, []);

  // Update available cities when state changes
  useEffect(() => {
    if (formData.custState) {
      // Find state code from state name
      const selectedState = states.find(s => s.name === formData.custState);
      if (selectedState) {
        const cities = getCitiesByState(selectedState.isoCode);
        setAvailableCities(cities);
      } else {
        setAvailableCities([]);
      }
    } else {
      setAvailableCities([]);
    }
  }, [formData.custState, states]);

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pincode = e.target.value.replace(/\D/g, '').slice(0, 6);
    updateFormData({ custPostalCode: pincode });

    if (pincode.length === 6) {
      setLoadingPincode(true);
      const details = await fetchPincodeDetails(pincode);
      setLoadingPincode(false);

      if (details) {
        const updates: Partial<EVFormData> = {};

        // Update State if empty
        if (!formData.custState) {
          // The API returns state name, we need to ensure it matches our list
          // Usually postal API returns standard names like "Maharashtra"
          // We might need to fuzzy match if names differ slightly, but for now exact match
          updates.custState = details.state;
        }

        // Update City if empty
        if (!formData.custCity) {
          updates.custCity = details.city;
        }

        if (Object.keys(updates).length > 0) {
          updateFormData(updates);
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold mb-2">👤 Customer Information</h3>
        <p className="text-muted-foreground mb-6">Enter the customer's contact and address details</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customerFname">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="customerFname"
            type="text"
            placeholder="First name"
            value={formData.customerFname}
            onChange={(e) => updateFormData({ customerFname: e.target.value })}
            required
            readOnly={isCustomer}
            className={isCustomer ? 'bg-muted cursor-not-allowed' : ''}
          />
          {isCustomer && (
            <p className="text-xs text-muted-foreground">Auto-filled from your account</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerLname">Last Name</Label>
          <Input
            id="customerLname"
            type="text"
            placeholder="Last name"
            value={formData.customerLname}
            onChange={(e) => updateFormData({ customerLname: e.target.value })}
            readOnly={isCustomer}
            className={isCustomer ? 'bg-muted cursor-not-allowed' : ''}
          />
          {isCustomer && (
            <p className="text-xs text-muted-foreground">Auto-filled from your account</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerMobile">
            Mobile Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="customerMobile"
            type="tel"
            placeholder="+91 XXXXX XXXXX"
            value={formData.customerMobile}
            onChange={(e) => updateFormData({ customerMobile: e.target.value })}
            required
            readOnly={isCustomer}
            className={isCustomer ? 'bg-muted cursor-not-allowed' : ''}
          />
          {isCustomer && (
            <p className="text-xs text-muted-foreground">Auto-filled from your account</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerEmail">
            Email ID {!isVendor && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id="customerEmail"
            type="email"
            placeholder="customer@example.com"
            value={formData.customerEmail}
            onChange={(e) => updateFormData({ customerEmail: e.target.value })}
            required={!isVendor}
            readOnly={isCustomer}
            className={isCustomer ? 'bg-muted cursor-not-allowed' : ''}
          />
          {isCustomer && (
            <p className="text-xs text-muted-foreground">Auto-filled from your account</p>
          )}
          {isVendor && (
            <p className="text-xs text-muted-foreground">Optional - If not provided, customer won't receive email notifications</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="custAddr1">
            Address Line 1 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="custAddr1"
            type="text"
            placeholder="Street address, P.O. box"
            value={formData.custAddr1}
            onChange={(e) => updateFormData({ custAddr1: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="custAddr2">Address Line 2</Label>
          <Input
            id="custAddr2"
            type="text"
            placeholder="Apartment, suite, unit, building, floor, etc."
            value={formData.custAddr2}
            onChange={(e) => updateFormData({ custAddr2: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="custPostalCode">
            Postal Code <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="custPostalCode"
              type="text"
              placeholder="Enter PIN code"
              value={formData.custPostalCode}
              onChange={handlePincodeChange}
              maxLength={6}
              required
            />
            {loadingPincode && (
              <div className="absolute right-3 top-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Enter PIN code to auto-fill State and City</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="custState">
            State <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.custState}
            onValueChange={(value) => updateFormData({ custState: value, custCity: '' })}
            required
          >
            <SelectTrigger id="custState">
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {states.map((state) => (
                <SelectItem key={state.isoCode} value={state.name}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="custCity">
            City <span className="text-destructive">*</span>
          </Label>
          {availableCities.length > 0 ? (
            <Select
              value={formData.custCity}
              onValueChange={(value) => updateFormData({ custCity: value })}
              required
            >
              <SelectTrigger id="custCity">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {availableCities.map((city) => (
                  <SelectItem key={city.name} value={city.name}>
                    {city.name}
                  </SelectItem>
                ))}
                {formData.custCity && !availableCities.find(c => c.name === formData.custCity) && (
                  <SelectItem value={formData.custCity}>{formData.custCity}</SelectItem>
                )}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="custCity"
              type="text"
              placeholder="Enter City"
              value={formData.custCity}
              onChange={(e) => updateFormData({ custCity: e.target.value })}
              required
            />
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" size="lg" onClick={onPrev}>
          ← Previous
        </Button>
        <Button type="submit" size="lg">
          Next Step →
        </Button>
      </div>
    </form>
  );
};

export default CustomerDetails;
