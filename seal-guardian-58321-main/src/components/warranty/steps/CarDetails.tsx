import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox } from "@/components/ui/combobox";
import { CAR_MAKES } from "@/lib/carMakes";
import { formatVehicleRegLive, getVehicleRegError } from "@/lib/validation";
import { EVFormData } from "../EVProductsForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePurchaseDateWindow } from "@/hooks/usePurchaseDateWindow";

interface CarDetailsProps {
  formData: EVFormData;
  updateFormData: (updates: Partial<EVFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
  /** Correcting an existing warranty rather than filing a new one. */
  isEditing?: boolean;
}

/**
 * The range a vehicle year may fall in.
 *
 * Next year is allowed because a car bought in December is often registered as
 * the following model year. Anything outside this is a typo, not a car.
 */
const EARLIEST_VEHICLE_YEAR = 1980;
const LATEST_VEHICLE_YEAR = new Date().getFullYear() + 1;

/**
 * Why a typed year is not usable, in words, or null when it is fine.
 *
 * This field exists because car_year was never asked for: the form defaulted it
 * to whatever year it happened to be, so ten thousand warranties claim to be
 * this year's model. The spec sheet and the UID screen both display that value,
 * which means they have been showing a year nobody entered.
 */
export const getVehicleYearError = (value: string): string | null => {
    const year = String(value || '').trim();
    if (!year) return 'Please enter the vehicle year';
    if (!/^[0-9]{4}$/.test(year)) return 'Enter the year in full, for example 2024';
    const n = Number(year);
    if (n < EARLIEST_VEHICLE_YEAR || n > LATEST_VEHICLE_YEAR) {
        return `Year must be between ${EARLIEST_VEHICLE_YEAR} and ${LATEST_VEHICLE_YEAR}`;
    }
    return null;
};

const CarDetails = ({ formData, updateFormData, onNext, onPrev, isEditing }: CarDetailsProps) => {
  const { toast } = useToast();
  const { user } = useAuth();

  /**
   * How far back a purchase date may be set. Stores and customers register close
   * to the sale, so 7 days; an admin is correcting or back-filling a record and
   * keeps the original 30.
   */
  // Admin-controlled for the public/QR flow; admins keep a fixed 30 days.
  const purchaseDateWindowDays = usePurchaseDateWindow(user?.role === 'admin');

  const [isBrandNew, setIsBrandNew] = useState(formData.carReg === 'APPLIED-FOR');

  // Handle vehicle registration input with auto-formatting
  const handleRegChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatVehicleRegLive(e.target.value);
    updateFormData({ carReg: formatted });

    // Conditional uniqueness check for vehicle registration
    if (formatted.length >= 6 && formatted !== 'APPLIED-FOR') {
      import("@/lib/api").then((api) => {
        api.default.get(`/public/warranty/check-uniqueness?reg=${formatted}&type=ev-products`)
          .then(res => {
            if (!res.data.unique) {
              toast({
                title: "Vehicle Registered",
                description: res.data.message,
                variant: "destructive",
              });
            }
          })
          .catch(err => console.error("Uniqueness check failed", err));
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Custom validation for required fields
    if (!formData.installationDate) {
      toast({ title: "Installation Date Required", description: "Please select installation date", variant: "destructive" });
      return;
    }

    // New registrations only. Correcting a rejected warranty is deliberately
    // exempt — it was rejected days after it was filed, so its purchase date is
    // almost always outside the window by then, and blocking that would break
    // the correction flow. The server agrees: it checks the window on submit
    // but never on update.
    if (user?.role !== 'admin' && !isEditing) {
      const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const daysAgo = Math.round(
        (startOfDay(new Date()).getTime() - startOfDay(new Date(formData.installationDate)).getTime()) / 86_400_000
      );
      if (daysAgo > purchaseDateWindowDays) {
        toast({
          title: "Installation Date Too Old",
          description: `Warranty must be registered within ${purchaseDateWindowDays} days of purchase. This one is ${daysAgo} days ago.`,
          variant: "destructive",
        });
        return;
      }
    }

    if (!formData.carMake) {
      toast({ title: "Vehicle Make Required", description: "Please select vehicle make", variant: "destructive" });
      return;
    }

    if (!formData.carModel) {
      toast({ title: "Vehicle Model Required", description: "Please enter vehicle model", variant: "destructive" });
      return;
    }

    const yearError = getVehicleYearError(formData.carYear || '');
    if (yearError) {
      toast({ title: "Vehicle Year", description: yearError, variant: "destructive" });
      return;
    }

    if (!formData.carColour?.trim()) {
      toast({ title: "Vehicle Colour Required", description: "Please enter the vehicle colour", variant: "destructive" });
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
            placeholder="e.g., City VX"
            value={formData.carModel}
            onChange={(e) => {
              updateFormData({ carModel: e.target.value });
            }}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="carYear">
            Vehicle Year <span className="text-destructive">*</span>
          </Label>
          <Input
            id="carYear"
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="e.g., 2024"
            value={formData.carYear || ''}
            onChange={(e) => {
              // Digits only, so "2024 model" or a stray space cannot be typed
              // into a field the spec sheet prints verbatim.
              updateFormData({ carYear: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) });
            }}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="carColour">
            Vehicle Colour <span className="text-destructive">*</span>
          </Label>
          <Input
            id="carColour"
            type="text"
            maxLength={40}
            placeholder="e.g., Pearl White"
            value={formData.carColour || ''}
            onChange={(e) => updateFormData({ carColour: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="carReg">
            Vehicle Registration Number <span className="text-destructive">*</span>
          </Label>

          <div className="flex items-center space-x-2 pb-2">
            <input
              type="checkbox"
              id="isBrandNewCar"
              checked={isBrandNew}
              onChange={(e) => {
                setIsBrandNew(e.target.checked);
                if (e.target.checked) {
                  updateFormData({ carReg: 'APPLIED-FOR' });
                } else {
                  updateFormData({ carReg: '' });
                }
              }}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <Label htmlFor="isBrandNewCar" className="text-sm font-normal text-slate-600 cursor-pointer">
              Brand new car (No registration number yet)
            </Label>
          </div>

          {!isBrandNew && (
            <Input
              id="carReg"
              type="text"
              placeholder="e.g., DL-01-AB-1234 / 26-BH-6045-F"
              value={formData.carReg}
              onChange={handleRegChange}
              required
              maxLength={20}
              className={`${formData.carReg
                ? getVehicleRegError(formData.carReg)
                  ? 'border-red-400 focus-visible:ring-red-300'
                  : 'border-green-400 focus-visible:ring-green-300'
                : ''
                }`}
            />
          )}
          {!isBrandNew && formData.carReg && (
            <p className={`text-xs flex items-center gap-1 ${getVehicleRegError(formData.carReg)
                ? 'text-red-500'
                : 'text-green-600'
              }`}>
              {getVehicleRegError(formData.carReg)
                ? `⚠ ${getVehicleRegError(formData.carReg)}`
                : '✓ Valid registration format'
              }
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="installationDate" className="flex items-center gap-1">
            Installation Date <span className="text-destructive">*</span>
          </Label>
          <DatePicker
            value={formData.installationDate || undefined}
            onChange={(value) => updateFormData({ installationDate: value })}
            minDate={new Date(new Date().setDate(new Date().getDate() - purchaseDateWindowDays))}
            maxDate={new Date()}
            placeholder="Select installation date"
          />
          {/* The calendar greys out anything older than the window, which on its
              own reads as a broken date picker. Admins have no limit, so they
              are not told about one. */}
          {user?.role !== 'admin' && !isEditing && (
            <p className="text-xs text-muted-foreground">
              Warranty must be registered within {purchaseDateWindowDays} days of purchase.
            </p>
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

export default CarDetails;