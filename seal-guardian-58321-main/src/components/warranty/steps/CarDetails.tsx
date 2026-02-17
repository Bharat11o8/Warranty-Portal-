import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox } from "@/components/ui/combobox";
import { CAR_MAKES } from "@/lib/carMakes";
import { validateVehicleReg, formatVehicleRegLive, getVehicleRegError } from "@/lib/validation";
import { EVFormData } from "../EVProductsForm";
import { getISTTodayISO, getISTYear } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface CarDetailsProps {
  formData: EVFormData;
  updateFormData: (updates: Partial<EVFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const CarDetails = ({ formData, updateFormData, onNext, onPrev }: CarDetailsProps) => {
  const { toast } = useToast();

  // Handle vehicle registration input with auto-formatting
  const handleRegChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatVehicleRegLive(e.target.value);
    updateFormData({ carReg: formatted });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Custom validation for required fields
    if (!formData.installationDate) {
      toast({ title: "Installation Date Required", description: "Please select installation date", variant: "destructive" });
      return;
    }

    if (!formData.carMake) {
      toast({ title: "Vehicle Make Required", description: "Please select vehicle make", variant: "destructive" });
      return;
    }

    if (!formData.carModel) {
      toast({ title: "Vehicle Model Required", description: "Please enter vehicle model", variant: "destructive" });
      return;
    }

    if (!formData.carReg) {
      toast({ title: "Registration Number Required", description: "Please enter vehicle registration number", variant: "destructive" });
      return;
    }

    const regError = getVehicleRegError(formData.carReg || "");
    if (formData.carReg && regError) {
      toast({ title: "Invalid Registration Format", description: regError, variant: "destructive" });
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
          <Label htmlFor="carMake">
            Vehicle Make <span className="text-destructive">*</span>
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
            Vehicle Model - Variant <span className="text-destructive">*</span>
          </Label>
          <Input
            id="carModel"
            type="text"
            placeholder="e.g., City"
            value={formData.carModel}
            onChange={(e) => {
              updateFormData({ carModel: e.target.value });
            }}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="carReg">
            Vehicle Registration Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="carReg"
            type="text"
            placeholder="e.g., DL-01-AB-1234"
            value={formData.carReg}
            onChange={handleRegChange}
            required
            maxLength={20}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="installationDate" className="flex items-center gap-1">
            Installation Date <span className="text-destructive">*</span>
          </Label>
          <DatePicker
            value={formData.installationDate || undefined}
            onChange={(value) => updateFormData({ installationDate: value })}
            minDate={new Date()}
            maxDate={new Date()}
            placeholder="Select installation date"
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