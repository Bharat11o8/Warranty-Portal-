import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EVFormData } from "../EVProductsForm";

interface CarDetailsProps {
  formData: EVFormData;
  updateFormData: (updates: Partial<EVFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const CarDetails = ({ formData, updateFormData, onNext, onPrev }: CarDetailsProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="carModel">
            Car Model <span className="text-destructive">*</span>
          </Label>
          <Input
            id="carModel"
            type="text"
            placeholder="e.g., Honda City 2024"
            value={formData.carModel}
            onChange={(e) => updateFormData({ carModel: e.target.value })}
            required
          />
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
