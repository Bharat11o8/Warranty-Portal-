import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EVFormData } from "../EVProductsForm";

interface InstallerDetailsProps {
  formData: EVFormData;
  updateFormData: (updates: Partial<EVFormData>) => void;
  onNext: () => void;
}

const InstallerDetails = ({ formData, updateFormData, onNext }: InstallerDetailsProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold mb-2">📋 Installer Information</h3>
        <p className="text-muted-foreground mb-6">Please provide the dealer/installer details</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="dealerName">
            Dealer Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="dealerName"
            type="text"
            placeholder="Enter dealer name"
            value={formData.dealerName}
            onChange={(e) => updateFormData({ dealerName: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dealerEmail">
            Email ID <span className="text-destructive">*</span>
          </Label>
          <Input
            id="dealerEmail"
            type="email"
            placeholder="dealer@example.com"
            value={formData.dealerEmail}
            onChange={(e) => updateFormData({ dealerEmail: e.target.value })}
            required
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
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dealerState">
            State <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.dealerState}
            onValueChange={(value) => updateFormData({ dealerState: value })}
            required
          >
            <SelectTrigger id="dealerState">
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
          <Label htmlFor="dealerCity">
            City <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.dealerCity}
            onValueChange={(value) => updateFormData({ dealerCity: value })}
            required
          >
            <SelectTrigger id="dealerCity">
              <SelectValue placeholder="Select City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="city1">City 1</SelectItem>
              <SelectItem value="city2">City 2</SelectItem>
            </SelectContent>
          </Select>
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
