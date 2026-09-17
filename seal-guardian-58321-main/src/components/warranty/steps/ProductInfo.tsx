import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, FileText, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { EVFormData, PPFRoll } from "../EVProductsForm";
import { useToast } from "@/hooks/use-toast";
import { TermsModal } from "../TermsModal";
import { compressImage, isCompressibleImage } from "@/lib/imageCompression";
import {
  getRollsError,
  normalizeSerial,
  normalizeSqft,
  SERIAL_MIN_LENGTH,
  SERIAL_MAX_LENGTH,
} from "@/lib/ppfRolls";

interface ProductInfoProps {
  formData: EVFormData;
  updateFormData: (updates: Partial<EVFormData>) => void;
  onPrev: () => void;
  onSubmit: () => void;
  loading: boolean;
  existingPhotos?: any;
}

/**
 * The five photos, and the `product_details.photos` key each is stored under.
 *
 * Declared once rather than as five near-identical JSX blocks: they had already
 * drifted apart, and the asterisk bug below existed in all five copies.
 */
const PHOTO_FIELDS = [
  { field: 'lhsPhoto', photoKey: 'lhs', label: 'Left Hand Side' },
  { field: 'rhsPhoto', photoKey: 'rhs', label: 'Right Hand Side' },
  { field: 'frontRegPhoto', photoKey: 'frontReg', label: 'Front with Reg. No.' },
  { field: 'backRegPhoto', photoKey: 'backReg', label: 'Back with Reg. No.' },
  { field: 'warrantyPhoto', photoKey: 'warranty', label: 'Warranty Card (Dealer Stamp)', fullWidth: true },
] as const;

/** Existing photos are stored either as a full URL or a bare filename. */
const photoSrc = (value: string) =>
  value.startsWith('http') ? value : `${window.location.origin}/uploads/${value}`;

/**
 * One photo slot.
 *
 * When editing, the form cannot turn a stored URL back into a File, so the
 * field starts null even though a photo exists on the warranty. The label must
 * therefore key off the EXISTING photo, not the empty file input — the previous
 * `|| formData.xPhoto === null` clause was always true while editing, so every
 * photo showed a red asterisk and people re-uploaded all five believing they
 * had to. The server keeps whatever is not replaced.
 */
const PhotoField = ({
  field, label, existingUrl, file, onChange, loading, fullWidth,
}: {
  field: keyof EVFormData;
  label: string;
  existingUrl?: string;
  file: File | null;
  onChange: (field: keyof EVFormData, file: File | null) => void;
  loading: boolean;
  fullWidth?: boolean;
}) => {
  const keepingExisting = Boolean(existingUrl) && !file;

  return (
    <div className={`space-y-2 ${fullWidth ? 'md:col-span-2' : ''}`}>
      <Label htmlFor={field}>
        {label} {!existingUrl && <span className="text-destructive">*</span>}
      </Label>

      {keepingExisting && (
        <div className="flex items-center gap-3">
          <a
            href={photoSrc(existingUrl!)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-24 h-24 rounded-lg overflow-hidden border-2 border-emerald-100 shadow-sm shrink-0"
          >
            <img src={photoSrc(existingUrl!)} alt={`Existing ${label}`} className="w-full h-full object-cover" />
          </a>
          <p className="text-xs text-emerald-600 font-medium">
            ✓ Already uploaded — only choose a file if you want to replace it.
          </p>
        </div>
      )}

      <Input
        id={field}
        type="file"
        accept="image/*"
        onChange={(e) => onChange(field, e.target.files?.[0] || null)}
        required={!existingUrl}
        disabled={loading}
      />
    </div>
  );
};

const ProductInfo = ({ formData, updateFormData, onPrev, onSubmit, loading, existingPhotos }: ProductInfoProps) => {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [disclaimer, setDisclaimer] = useState("");
  /**
   * The serial the server last refused, so its row can be marked.
   *
   * Only the server knows how much of a roll is left, and it does not say —
   * the form can show which entry was rejected but never what remains.
   */
  const [failedSerial, setFailedSerial] = useState<string | null>(null);

  const updateRoll = (index: number, changes: Partial<PPFRoll>) => {
    const next = formData.rolls.map((roll, i) => (i === index ? { ...roll, ...changes } : roll));
    // The marking is stale the moment the installer edits either field.
    setFailedSerial(null);
    updateFormData({ rolls: next });
  };

  const addRoll = () => updateFormData({ rolls: [...formData.rolls, { serial: "", sqft: "" }] });

  const removeRoll = (index: number) =>
    updateFormData({ rolls: formData.rolls.filter((_, i) => i !== index) });

  useEffect(() => {
    api.get('/settings/public/ppf_disclaimer')
      .then(res => { if (res.data.success && res.data.value) setDisclaimer(res.data.value); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/public/products');
        if (response.data.success) {
          const evProducts = response.data.products.filter((p: any) => p.type === 'ev_product');
          setProducts(evProducts);

          // Auto-select if only one product is available and none is selected
          if (evProducts.length === 1 && !formData.product) {
            updateFormData({ product: evProducts[0].name });
          }
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
      }
    };
    fetchProducts();
  }, []);

  // Auto-select warranty type based on product name
  useEffect(() => {
    const selectedProduct = products.find(p => p.name === formData.product);
    if (selectedProduct) {
      updateFormData({ warrantyType: selectedProduct.warranty_years });
    }
  }, [formData.product, products]);

  const handleFileChange = async (name: keyof EVFormData, file: File | null) => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (after compression)
    const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];

    if (file) {
      const isAllowedType = ALLOWED_FILE_TYPES.includes(file.type) ||
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif');

      if (!isAllowedType) {
        toast({
          title: "Invalid File Type",
          description: "Only JPG, PNG, and HEIC image files are allowed",
          variant: "destructive",
        });
        return;
      }

      // Compress image (imageCompression.ts skips files already < 500KB)
      let processedFile = file;
      if (isCompressibleImage(file)) {
        setCompressing(true);
        try {
          processedFile = await compressImage(file, { maxSizeKB: 1024, quality: 0.8 });
        } catch (err) {
          console.error('Compression failed:', err);
        } finally {
          setCompressing(false);
        }
      }

      if (processedFile.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: "Maximum file size is 5 MB. Please use a smaller image.",
          variant: "destructive",
        });
        return;
      }

      updateFormData({ [name]: processedFile });
    } else {
      updateFormData({ [name]: null });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Custom validation for required fields
    if (!formData.product) {
      toast({ title: "Product Required", description: "Please select a product", variant: "destructive" });
      return;
    }

    if (!formData.installArea) {
      toast({ title: "Installation Area Required", description: "Please enter the area of installation", variant: "destructive" });
      return;
    }

    const rollError = getRollsError(formData.rolls);
    if (rollError) {
      toast({ title: "Roll Details", description: rollError, variant: "destructive" });
      return;
    }

    if (!formData.lhsPhoto && !existingPhotos?.lhs) {
      toast({ title: "LHS Photo Required", description: "Please upload left hand side photo", variant: "destructive" });
      return;
    }
    if (!formData.rhsPhoto && !existingPhotos?.rhs) {
      toast({ title: "RHS Photo Required", description: "Please upload right hand side photo", variant: "destructive" });
      return;
    }
    if (!formData.frontRegPhoto && !existingPhotos?.frontReg) {
      toast({ title: "Front Photo Required", description: "Please upload front photo with registration number", variant: "destructive" });
      return;
    }
    if (!formData.backRegPhoto && !existingPhotos?.backReg) {
      toast({ title: "Back Photo Required", description: "Please upload back photo with registration number", variant: "destructive" });
      return;
    }
    if (!formData.warrantyPhoto && !existingPhotos?.warranty) {
      toast({ title: "Warranty Card Required", description: "Please upload warranty card photo with dealer stamp", variant: "destructive" });
      return;
    }
    if (!formData.termsAccepted) {
      toast({ title: "Terms Required", description: "Please accept the terms and conditions", variant: "destructive" });
      return;
    }

    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold mb-2">📦 Product & Documentation</h3>
        <p className="text-muted-foreground mb-6">Select product details and upload required photos</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="product">
            Select Product <span className="text-destructive">*</span>
          </Label>
          <Combobox
            options={products.map(product => ({ value: product.name, label: product.name }))}
            value={formData.product}
            onChange={(value) => updateFormData({ product: value })}
            placeholder="Select Product"
            searchPlaceholder="Search product..."
            emptyMessage="No product found."
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="warrantyType">
            Warranty Type
          </Label>
          <Input
            id="warrantyType"
            type="text"
            value={formData.warrantyType}
            readOnly
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Default warranty period for PPF products
          </p>
        </div>



        <div className="space-y-2">
          <Label htmlFor="installArea">
            Area of Installation <span className="text-destructive">*</span>
          </Label>
          <Input
            id="installArea"
            type="text"
            placeholder="e.g., Full Body, Hood, etc."
            value={formData.installArea}
            onChange={(e) => updateFormData({ installArea: e.target.value })}
            required
            disabled={loading}
          />
        </div>
      </div>

      {/* Rolls — a roll is fitted across several vehicles, and one vehicle may
          take film from more than one roll, so each entry pairs the serial with
          the area taken from it. */}
      <div className="space-y-3">
        <div>
          <Label>
            Roll Serial Number & Usage <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Enter the serial number of each roll used on this vehicle and how many sq.ft came from it.
          </p>
        </div>

        {formData.rolls.map((roll, index) => {
          const serialTooShort = roll.serial.length > 0 && roll.serial.length < SERIAL_MIN_LENGTH;
          const isFailed = failedSerial != null && roll.serial === failedSerial;

          return (
            <div key={index} className="grid md:grid-cols-[1fr_180px_auto] gap-3 items-start">
              <div className="space-y-1">
                <Input
                  aria-label={`Serial number ${index + 1}`}
                  type="text"
                  placeholder="8–10 character serial number"
                  value={roll.serial}
                  onChange={(e) => updateRoll(index, { serial: normalizeSerial(e.target.value) })}
                  maxLength={SERIAL_MAX_LENGTH}
                  disabled={loading}
                  className={serialTooShort || isFailed ? 'border-red-400 focus-visible:ring-red-300' : ''}
                />
                <div className="flex justify-between text-xs px-0.5">
                  <span className={serialTooShort ? 'text-red-500' : 'text-muted-foreground'}>
                    {serialTooShort
                      ? `${SERIAL_MIN_LENGTH - roll.serial.length} more characters needed`
                      : 'Alphanumeric only'}
                  </span>
                  <span className="text-muted-foreground">{roll.serial.length}/{SERIAL_MAX_LENGTH}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <Input
                    aria-label={`Square feet used from serial ${index + 1}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g., 150"
                    value={roll.sqft}
                    onChange={(e) => updateRoll(index, { sqft: normalizeSqft(e.target.value) })}
                    disabled={loading}
                    className={`pr-14 ${isFailed ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    sq.ft
                  </span>
                </div>
                <span className="text-xs text-muted-foreground px-0.5">Used on this vehicle</span>
              </div>

              {/* The first row is the entry itself, not an addition, so there is
                  nothing to remove until a second roll is added. */}
              {formData.rolls.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRoll(index)}
                  disabled={loading}
                  aria-label={`Remove roll ${index + 1}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRoll}
          disabled={loading}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add another roll
        </Button>
      </div>

      {/* Disclaimer — full width, shown once a product is selected */}
      {disclaimer && formData.product && (
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div
            className="text-sm text-amber-800 leading-relaxed prose prose-sm max-w-none [&_p]:mb-1 [&_ul]:mt-1 [&_li]:leading-snug"
            dangerouslySetInnerHTML={{ __html: disclaimer }}
          />
        </div>
      )}

      <div className="space-y-4 mt-8">
        <h4 className="text-lg font-semibold">📸 Photo Documentation</h4>

        <div className="grid md:grid-cols-2 gap-4">
          {PHOTO_FIELDS.map(({ field, photoKey, label, fullWidth }) => (
            <PhotoField
              key={field}
              field={field}
              label={label}
              existingUrl={existingPhotos?.[photoKey]}
              file={formData[field] as File | null}
              onChange={handleFileChange}
              loading={loading}
              fullWidth={fullWidth}
            />
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          Maximum file size: 5 MB per image. Accepted formats: JPG, PNG, HEIC
        </p>
      </div>

      {/* Terms & Conditions - Simple Checkbox */}
      <div className="pt-4 border-t">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="termsCheckbox"
            checked={formData.termsAccepted}
            onChange={(e) => updateFormData({ termsAccepted: e.target.checked })}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
            disabled={loading}
          />
          <label htmlFor="termsCheckbox" className="text-sm text-slate-700 cursor-pointer">
            I have read and agree to the{" "}
            <button
              type="button"
              onClick={() => setTermsModalOpen(true)}
              className="text-primary font-medium underline hover:text-primary/80"
            >
              Terms and Conditions
            </button>
          </label>
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" size="lg" onClick={onPrev}>
          ← Previous
        </Button>
        <Button type="submit" size="lg" disabled={loading || !formData.termsAccepted}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : "Submit Registration"}
        </Button>
      </div>

      {/* Terms Modal — PPF-specific */}
      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        onAccept={() => updateFormData({ termsAccepted: true })}
        settingKey="ppf_terms_conditions"
      />
    </form>
  );
};

export default ProductInfo;
