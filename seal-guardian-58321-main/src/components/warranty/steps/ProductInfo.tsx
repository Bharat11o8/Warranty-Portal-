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

  const addRoll = () => updateFormData({ rolls: [...formData.rolls, { serial: "", sqft: "", installArea: "" }] });

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



      </div>

      {/* Rolls — a roll is fitted across several vehicles, and one vehicle may
          take film from more than one roll, so each entry records a serial, the
          area taken from it, and the part of the car that film went on. The
          area belongs to the roll: film from two rolls goes to two different
          panels, which one field for the whole job could not describe. */}
      <div className="space-y-2">
        <div>
          <Label>
            Roll Serial Number & Usage <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            For each roll used on this vehicle: its serial number, how many sq.ft came from it, and where that film was fitted.
          </p>
        </div>

        {/* Column headings, so the three inputs below need no labels of their
            own. Hidden once the rows stack, where each field is full width and
            its placeholder is the label. */}
        <div className="hidden md:grid gap-2 md:grid-cols-[minmax(0,15rem)_minmax(0,8.5rem)_minmax(0,1.2fr)_2.5rem] px-0.5">
          <span className="text-xs font-medium text-muted-foreground">Serial number</span>
          <span className="text-xs font-medium text-muted-foreground">Film used</span>
          <span className="text-xs font-medium text-muted-foreground">Area of installation</span>
          <span aria-hidden />
        </div>

        {formData.rolls.map((roll, index) => {
          const serialTooShort = roll.serial.length > 0 && roll.serial.length < SERIAL_MIN_LENGTH;
          const isFailed = failedSerial != null && roll.serial === failedSerial;

          return (
            <div key={index} className="space-y-1">
              {/* One row: the serial is capped at ten characters so it needs no
                  more width than that, the area takes what is left, and the
                  delete control sits at the end rather than on a line of its
                  own. Stacks to full width below md, where three inputs abreast
                  would each be too narrow to read. */}
              <div className="grid gap-2 md:grid-cols-[minmax(0,15rem)_minmax(0,8.5rem)_minmax(0,1.2fr)_2.5rem] md:items-center">
                <Input
                  id={`roll-serial-${index}`}
                  aria-label={`Serial number${formData.rolls.length > 1 ? ` for roll ${index + 1}` : ''}`}
                  type="text"
                  placeholder="e.g., 20260917FAB064_1"
                  value={roll.serial}
                  onChange={(e) => updateRoll(index, { serial: normalizeSerial(e.target.value) })}
                  maxLength={SERIAL_MAX_LENGTH}
                  disabled={loading}
                  className={`font-mono ${serialTooShort || isFailed ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                />

                {/* The unit is attached to the field rather than floated over
                    it: overlaid, a long enough number slides underneath the
                    word and both become unreadable. */}
                <div
                  className={`flex h-10 items-center rounded-md border bg-background ring-offset-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${
                    isFailed ? 'border-red-400 focus-within:ring-red-300' : 'border-input'
                  } ${loading ? 'opacity-50' : ''}`}
                >
                  <Input
                    id={`roll-sqft-${index}`}
                    aria-label={`Square feet used${formData.rolls.length > 1 ? ` from roll ${index + 1}` : ''}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="150"
                    value={roll.sqft}
                    onChange={(e) => updateRoll(index, { sqft: normalizeSqft(e.target.value) })}
                    disabled={loading}
                    className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-right pr-1.5 min-w-0"
                  />
                  <span className="pr-3 pl-0 text-xs text-muted-foreground shrink-0 select-none">
                    sq.ft
                  </span>
                </div>

                <Input
                  id={`roll-area-${index}`}
                  aria-label={`Area of installation${formData.rolls.length > 1 ? ` for roll ${index + 1}` : ''}`}
                  type="text"
                  placeholder="e.g., Bonnet, Full Body"
                  value={roll.installArea}
                  onChange={(e) => updateRoll(index, { installArea: e.target.value })}
                  disabled={loading}
                />

                {/* The first row is the entry itself, not an addition, so there
                    is nothing to remove until a second roll is added. The slot
                    is still reserved, or every row would shift sideways the
                    moment one appeared. */}
                {formData.rolls.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRoll(index)}
                    disabled={loading}
                    aria-label={`Remove roll ${index + 1}`}
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive justify-self-start md:justify-self-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : <span className="hidden md:block" aria-hidden />}
              </div>

              {/* Only speaks up when the serial is short of its minimum — a
                  character counter under every row is noise once the habit is
                  formed. */}
              {serialTooShort && (
                <p className="text-xs text-red-500 px-0.5">
                  Serial needs {SERIAL_MIN_LENGTH - roll.serial.length} more character{SERIAL_MIN_LENGTH - roll.serial.length === 1 ? '' : 's'}
                </p>
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
          className="gap-1.5 mt-1"
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
