import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EVFormData } from "../EVProductsForm";

interface CustomerDetailsProps {
  formData: EVFormData;
  updateFormData: (updates: Partial<EVFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const CustomerDetails = ({ formData, updateFormData, onNext, onPrev }: CustomerDetailsProps) => {
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
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerLname">Last Name</Label>
          <Input
            id="customerLname"
            type="text"
            placeholder="Last name"
            value={formData.customerLname}
            onChange={(e) => updateFormData({ customerLname: e.target.value })}
          />
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
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerEmail">
            Email ID <span className="text-destructive">*</span>
          </Label>
          <Input
            id="customerEmail"
            type="email"
            placeholder="customer@example.com"
            value={formData.customerEmail}
            onChange={(e) => updateFormData({ customerEmail: e.target.value })}
            required
          />
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
          <Label htmlFor="custState">
            State <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.custState}
            onValueChange={(value) => updateFormData({ custState: value })}
            required
          >
            <SelectTrigger id="custState">
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Delhi">Delhi</SelectItem>
              <SelectItem value="Maharashtra">Maharashtra</SelectItem>
              <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
              <SelectItem value="Karnataka">Karnataka</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="custCity">
            City <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.custCity}
            onValueChange={(value) => updateFormData({ custCity: value })}
            required
          >
            <SelectTrigger id="custCity">
              <SelectValue placeholder="Select City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="city1">City 1</SelectItem>
              <SelectItem value="city2">City 2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="custPostalCode">
            Postal Code <span className="text-destructive">*</span>
          </Label>
          <Input
            id="custPostalCode"
            type="text"
            placeholder="Enter PIN code"
            value={formData.custPostalCode}
            onChange={(e) => updateFormData({ custPostalCode: e.target.value })}
            required
          />
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
