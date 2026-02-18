import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { EVFormData } from "../EVProductsForm";
import { useToast } from "@/hooks/use-toast";
import { TermsModal } from "../TermsModal";
import { compressImage, isCompressibleImage } from "@/lib/imageCompression";

interface ProductInfoProps {
  formData: EVFormData;
  updateFormData: (updates: Partial<EVFormData>) => void;
  onPrev: () => void;
  onSubmit: () => void;
  loading: boolean;
}

const ProductInfo = ({ formData, updateFormData, onPrev, onSubmit, loading }: ProductInfoProps) => {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [compressing, setCompressing] = useState(false);

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

      // Compress image if it's a compressible type (not PDF)
      let processedFile = file;
      if (isCompressibleImage(file) && file.size > 1024 * 1024) { // Compress if > 1MB
        setCompressing(true);
        try {
          processedFile = await compressImage(file, { maxSizeKB: 1024, quality: 0.8 });
          // Silent compression - no need to inform customer
        } catch (err) {
          console.error('Compression failed:', err);
          // Continue with original file if compression fails
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
    if (!formData.lhsPhoto) {
      toast({ title: "LHS Photo Required", description: "Please upload left hand side photo", variant: "destructive" });
      return;
    }
    if (!formData.rhsPhoto) {
      toast({ title: "RHS Photo Required", description: "Please upload right hand side photo", variant: "destructive" });
      return;
    }
    if (!formData.frontRegPhoto) {
      toast({ title: "Front Photo Required", description: "Please upload front photo with registration number", variant: "destructive" });
      return;
    }
    if (!formData.backRegPhoto) {
      toast({ title: "Back Photo Required", description: "Please upload back photo with registration number", variant: "destructive" });
      return;
    }
    if (!formData.warrantyPhoto) {
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
            Default warranty period for EV products
          </p>
        </div>



        <div className="space-y-2">
          <Label htmlFor="serialNumber">
            Serial Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="serialNumber"
            type="text"
            placeholder="Enter Product Serial Number"
            value={formData.serialNumber}
            onChange={(e) => updateFormData({ serialNumber: e.target.value })}
            required
            disabled={loading}
          />
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

      <div className="space-y-4 mt-8">
        <h4 className="text-lg font-semibold">📸 Photo Documentation</h4>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lhsPhoto">
              Left Hand Side <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lhsPhoto"
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif"
              onChange={(e) => handleFileChange("lhsPhoto", e.target.files?.[0] || null)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rhsPhoto">
              Right Hand Side <span className="text-destructive">*</span>
            </Label>
            <Input
              id="rhsPhoto"
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif"
              onChange={(e) => handleFileChange("rhsPhoto", e.target.files?.[0] || null)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frontRegPhoto">
              Front with Reg. No. <span className="text-destructive">*</span>
            </Label>
            <Input
              id="frontRegPhoto"
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif"
              onChange={(e) => handleFileChange("frontRegPhoto", e.target.files?.[0] || null)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="backRegPhoto">
              Back with Reg. No. <span className="text-destructive">*</span>
            </Label>
            <Input
              id="backRegPhoto"
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif"
              onChange={(e) => handleFileChange("backRegPhoto", e.target.files?.[0] || null)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="warrantyPhoto">
              Warranty Card (Dealer Stamp) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="warrantyPhoto"
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif"
              onChange={(e) => handleFileChange("warrantyPhoto", e.target.files?.[0] || null)}
              required
              disabled={loading}
            />
          </div>
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

      {/* Terms Modal */}
      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        onAccept={() => updateFormData({ termsAccepted: true })}
      />
    </form>
  );
};

export default ProductInfo;
