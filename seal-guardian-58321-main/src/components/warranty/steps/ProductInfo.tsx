import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { EVFormData } from "../EVProductsForm";
import { useToast } from "@/hooks/use-toast";

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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/public/products');
        if (response.data.success) {
          setProducts(response.data.products.filter((p: any) => p.type === 'ev_product'));
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

  const handleFileChange = (name: keyof EVFormData, file: File | null) => {
    if (file && file.size > 20 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 20 MB",
        variant: "destructive",
      });
      return;
    }
    updateFormData({ [name]: file });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
          <Label htmlFor="lotNumber">
            Lot Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lotNumber"
            type="text"
            placeholder="Enter lot number"
            value={formData.lotNumber}
            onChange={(e) => updateFormData({ lotNumber: e.target.value })}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rollNumber">
            Roll Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="rollNumber"
            type="text"
            placeholder="Enter roll number"
            value={formData.rollNumber}
            onChange={(e) => updateFormData({ rollNumber: e.target.value })}
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
              accept="image/*"
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
              accept="image/*"
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
              accept="image/*"
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
              accept="image/*"
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
              accept="image/*"
              onChange={(e) => handleFileChange("warrantyPhoto", e.target.files?.[0] || null)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Maximum file size: 20 MB per image. Accepted formats: JPG, PNG, JPEG
        </p>
      </div>

      <div className="flex items-start space-x-2 pt-4">
        <Checkbox
          id="terms"
          checked={formData.termsAccepted}
          onCheckedChange={(checked) => updateFormData({ termsAccepted: checked as boolean })}
          required
          disabled={loading}
        />
        <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
          I agree to the Terms and Conditions and confirm that all information provided is accurate{" "}
          <span className="text-destructive">*</span>
        </Label>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" size="lg" onClick={onPrev}>
          ← Previous
        </Button>
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : "Submit Registration ✓"}
        </Button>
      </div>
    </form>
  );
};

export default ProductInfo;
