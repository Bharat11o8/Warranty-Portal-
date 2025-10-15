import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Upload } from "lucide-react";
import { submitWarranty } from "@/lib/warrantyApi";

const SeatCoverForm = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    uid: "",
    customerName: "",
    customerEmail: "",
    customerMobile: "",
    customerAddress: "",
    productName: "",
    storeEmail: "",
    purchaseDate: "",
    storeName: "Aaradhya Car Accesssories",
    carMake: "",
    carModel: "",
    carYear: "",
    registrationNumber: "",
    invoiceFile: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate UID length
      if (formData.uid.length < 13 || formData.uid.length > 16) {
        toast({
          title: "Invalid UID",
          description: "UID must be between 13-16 digits",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Prepare warranty data
      const warrantyData = {
        productType: "seat-cover",
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerMobile,
        customerAddress: formData.customerAddress || "N/A",
        carMake: formData.carMake || "N/A",
        carModel: formData.carModel || "N/A",
        carYear: formData.carYear || new Date().getFullYear().toString(),
        registrationNumber: formData.registrationNumber || formData.uid,
        purchaseDate: formData.purchaseDate,
        installerName: formData.storeName,
        installerContact: formData.storeEmail,
        productDetails: {
          uid: formData.uid,
          productName: formData.productName,
          storeName: formData.storeName,
          storeEmail: formData.storeEmail,
          invoiceFileName: formData.invoiceFile?.name || null,
        },
      };

      // Submit warranty registration
      const result = await submitWarranty(warrantyData);

      toast({
        title: "Success!",
        description: `Warranty registered successfully. Registration #: ${result.registrationNumber}`,
      });

      // Reset form
      setFormData({
        uid: "",
        customerName: "",
        customerEmail: "",
        customerMobile: "",
        customerAddress: "",
        productName: "",
        storeEmail: "",
        purchaseDate: "",
        storeName: "Aaradhya Car Accesssories",
        carMake: "",
        carModel: "",
        carYear: "",
        registrationNumber: "",
        invoiceFile: null,
      });
    } catch (error: any) {
      console.error("Warranty submission error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to submit warranty registration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 20 MB",
        variant: "destructive",
      });
      return;
    }
    setFormData(prev => ({ ...prev, invoiceFile: file || null }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seat Cover Warranty Registration</CardTitle>
        <CardDescription>
          Please fill in all required fields to register your seat cover warranty
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="uid">
                UID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="uid"
                type="text"
                placeholder="Enter 13-16 digit number"
                value={formData.uid}
                onChange={(e) => handleChange("uid", e.target.value)}
                required
                maxLength={16}
                pattern="[0-9]{13,16}"
              />
              <p className="text-xs text-muted-foreground">
                {formData.uid.length} of 16 max characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName">
                Customer Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerName"
                type="text"
                placeholder="Enter customer name"
                value={formData.customerName}
                onChange={(e) => handleChange("customerName", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">
                Customer Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="customer@example.com"
                value={formData.customerEmail}
                onChange={(e) => handleChange("customerEmail", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerMobile">
                Customer Mobile Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerMobile"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={formData.customerMobile}
                onChange={(e) => handleChange("customerMobile", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerAddress">
                Customer Address
              </Label>
              <Input
                id="customerAddress"
                type="text"
                placeholder="Enter address"
                value={formData.customerAddress}
                onChange={(e) => handleChange("customerAddress", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carMake">
                Car Make
              </Label>
              <Input
                id="carMake"
                type="text"
                placeholder="e.g., Toyota, Honda"
                value={formData.carMake}
                onChange={(e) => handleChange("carMake", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carModel">
                Car Model
              </Label>
              <Input
                id="carModel"
                type="text"
                placeholder="e.g., Camry, Civic"
                value={formData.carModel}
                onChange={(e) => handleChange("carModel", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carYear">
                Car Year
              </Label>
              <Input
                id="carYear"
                type="text"
                placeholder="e.g., 2024"
                value={formData.carYear}
                onChange={(e) => handleChange("carYear", e.target.value)}
                maxLength={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationNumber">
                Vehicle Registration Number
              </Label>
              <Input
                id="registrationNumber"
                type="text"
                placeholder="e.g., DL01AB1234"
                value={formData.registrationNumber}
                onChange={(e) => handleChange("registrationNumber", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productName">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.productName}
                onValueChange={(value) => handleChange("productName", value)}
                required
              >
                <SelectTrigger id="productName">
                  <SelectValue placeholder="Select Product Name" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leather-seat-cover">Leather Seat Cover</SelectItem>
                  <SelectItem value="fabric-seat-cover">Fabric Seat Cover</SelectItem>
                  <SelectItem value="premium-seat-cover">Premium Seat Cover</SelectItem>
                  <SelectItem value="custom-seat-cover">Custom Seat Cover</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeEmail">
                Store Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="storeEmail"
                type="email"
                placeholder="store@example.com"
                value={formData.storeEmail}
                onChange={(e) => handleChange("storeEmail", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">
                Purchase Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handleChange("purchaseDate", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeName">
                Store Name <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.storeName}
                onValueChange={(value) => handleChange("storeName", value)}
                required
              >
                <SelectTrigger id="storeName">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aaradhya Car Accesssories">Aaradhya Car Accesssories</SelectItem>
                  <SelectItem value="Other Store">Other Store</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="invoiceFile">
                Upload File Proof (Invoice / MRP Sticker) <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="invoiceFile"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  required
                  className="cursor-pointer"
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Max. file size: 20 MB. {formData.invoiceFile && `Selected: ${formData.invoiceFile.name}`}
              </p>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "SUBMIT"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SeatCoverForm;