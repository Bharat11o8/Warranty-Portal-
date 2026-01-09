import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { CAR_MAKES } from "@/lib/carMakes";
import { validateVehicleReg } from "@/lib/validation";
import { EVFormData } from "../EVProductsForm";
import { useToast } from "@/hooks/use-toast";

interface CarDetailsProps {
  formData: EVFormData;
  updateFormData: (updates: Partial<EVFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const CarDetails = ({ formData, updateFormData, onNext, onPrev }: CarDetailsProps) => {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Custom validation for required fields
    if (!formData.installationDate) {
      toast({ title: "Installation Date Required", description: "Please select installation date", variant: "destructive" });
      return;
    }
    if (!formData.carMake) {
      toast({ title: "Car Make Required", description: "Please select a car make", variant: "destructive" });
      return;
    }
    if (!formData.carModel) {
      toast({ title: "Car Model Required", description: "Please enter the car model", variant: "destructive" });
      return;
    }
    if (!formData.carYear) {
      toast({ title: "Car Year Required", description: "Please select a car year", variant: "destructive" });
      return;
    }
    if (!formData.carReg) {
      toast({ title: "Registration Number Required", description: "Please enter car registration number", variant: "destructive" });
      return;
    }
    if (!validateVehicleReg(formData.carReg)) {
      toast({ title: "Invalid Registration Format", description: "Use format: XX-00-XX-0000 (e.g., DL-01-AB-1234)", variant: "destructive" });
      return;
    }

    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold mb-2">🚗 Vehicle Information</h3>
        <p className="text-muted-foreground mb-6">Provide installation and vehicle details</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="installationDate">
            Installation Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="installationDate"
            type="date"
            value={formData.installationDate}
            onChange={(e) => updateFormData({ installationDate: e.target.value })}
            required
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="carMake">
            Car Make <span className="text-destructive">*</span>
          </Label>
          <Combobox
            options={[...CAR_MAKES]}
            value={formData.carMake}
            onChange={(value) => updateFormData({ carMake: value })}
            placeholder="Select car make..."
            searchPlaceholder="Search car brands..."
            emptyMessage="No car brand found."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="carModel">
            Car Model - Variant  <span className="text-destructive">*</span>
          </Label>
          <Input
            id="carModel"
            type="text"
            placeholder="e.g., City"
            value={formData.carModel}
            onChange={(e) => updateFormData({ carModel: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="carYear">
            Year <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.carYear}
            onValueChange={(value) => updateFormData({ carYear: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select year..." />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: new Date().getFullYear() - 1979 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="carReg">
            Car Registration Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="carReg"
            type="text"
            placeholder="e.g., DL-01-AB-1234"
            value={formData.carReg}
            onChange={(e) => updateFormData({ carReg: e.target.value })}
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

export default CarDetails;