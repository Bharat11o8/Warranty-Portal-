import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Upload } from "lucide-react";
import { submitWarranty, updateWarranty } from "@/lib/warrantyApi";

interface SeatCoverFormProps {
  initialData?: any;
  warrantyId?: string;
  onSuccess?: () => void;
}

const SeatCoverForm = ({ initialData, warrantyId, onSuccess }: SeatCoverFormProps = {}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [manpowerList, setManpowerList] = useState<any[]>([]);
  const [formData, setFormData] = useState(initialData ? {
    uid: initialData.product_details?.uid || "",
    customerName: initialData.customer_name || "",
    customerEmail: initialData.customer_email || "",
    customerMobile: initialData.customer_phone || "",
    customerAddress: initialData.customer_address || "",
    productName: initialData.product_details?.productName || "",
    storeEmail: initialData.installer_contact || "",
    purchaseDate: initialData.purchase_date || "",
    storeName: initialData.installer_name || "",
    manpowerId: initialData.manpower_id || "",
    carMake: initialData.car_make || "",
    carModel: initialData.car_model || "",
    carYear: initialData.car_year || "",
    warrantyType: initialData.warranty_type || "1 Year",
    invoiceFile: null as File | null,
  } : {
    uid: "",
    customerName: "",
    customerEmail: "",
    customerMobile: "",
    customerAddress: "",
    productName: "",
    storeEmail: "",
    purchaseDate: "",
    storeName: "",
    manpowerId: "",
    carMake: "",
    carModel: "",
    carYear: "",
    warrantyType: "1 Year",
    invoiceFile: null as File | null,
  });

  // Auto-fill customer details for logged-in customers
  useEffect(() => {
    if (user?.role === 'customer') {
      setFormData(prev => ({
        ...prev,
        customerName: user.name || "",
        customerEmail: user.email || "",
        customerMobile: user.phoneNumber || "",
      }));
    }
  }, [user]);

  // Auto-fill vendor/store details for logged-in vendors
  useEffect(() => {
    const fetchVendorDetails = async () => {
      if (user?.role === 'vendor') {
        try {
          // Fetch vendor's own store details
          const response = await api.get('/vendor/profile');
          if (response.data.success && response.data.vendorDetails) {
            const vendorDetails = response.data.vendorDetails;
            setFormData(prev => ({
              ...prev,
              storeName: vendorDetails.store_name || "",
              storeEmail: vendorDetails.store_email || "",
            }));

            // Fetch vendor's manpower list
            const manpowerResponse = await api.get('/vendor/manpower?active=true');
            if (manpowerResponse.data.success) {
              setManpowerList(manpowerResponse.data.manpower);
            }
          }
        } catch (error) {
          console.error("Failed to fetch vendor details", error);
        }
      }
    };
    fetchVendorDetails();
  }, [user]);

  // Fetch stores on mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await api.get('/public/stores');
        if (response.data.success) {
          setStores(response.data.stores);
        }
      } catch (error) {
        console.error("Failed to fetch stores", error);
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await api.get('/public/products');
        if (response.data.success) {
          setProducts(response.data.products.filter((p: any) => p.type === 'seat_cover'));
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
      }
    };

    fetchStores();
    fetchProducts();
  }, []);

  // Fetch manpower when store changes
  useEffect(() => {
    const fetchManpower = async () => {
      const selectedStore = stores.find(s => s.store_name === formData.storeName);
      if (selectedStore) {
        // Auto-fill email
        setFormData(prev => ({ ...prev, storeEmail: selectedStore.store_email, manpowerId: "" }));

        try {
          const response = await api.get(`/public/stores/${selectedStore.vendor_details_id}/manpower`);
          if (response.data.success) {
            setManpowerList(response.data.manpower);
          }
        } catch (error) {
          console.error("Failed to fetch manpower", error);
          setManpowerList([]);
        }
      } else {
        setManpowerList([]);
      }
    };

    if (formData.storeName) {
      fetchManpower();
    }
  }, [formData.storeName, stores]);

  // Auto-select warranty type based on product name
  // Auto-select warranty type based on product name
  useEffect(() => {
    const selectedProduct = products.find(p => p.name === formData.productName);
    if (selectedProduct) {
      setFormData(prev => ({
        ...prev,
        warrantyType: selectedProduct.warranty_years,
      }));
    }
  }, [formData.productName, products]);


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

      // Find selected manpower name
      const selectedManpower = manpowerList.find(mp => mp.id === formData.manpowerId);
      const manpowerName = selectedManpower ? selectedManpower.name : "";

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
        purchaseDate: formData.purchaseDate,
        warrantyType: formData.warrantyType,
        installerName: formData.storeName,
        installerContact: formData.storeEmail,
        manpowerId: formData.manpowerId || null,
        productDetails: {
          uid: formData.uid,
          productName: formData.productName,
          storeName: formData.storeName,
          storeEmail: formData.storeEmail,
          manpowerId: formData.manpowerId,
          manpowerName: manpowerName,
          customerAddress: formData.customerAddress, // Added to ensure it's saved in JSON
          invoiceFileName: formData.invoiceFile?.name || null,
          invoiceFile: formData.invoiceFile, // Pass file object for API wrapper
        },
      };

      // Submit or update warranty registration
      const result = warrantyId
        ? await updateWarranty(warrantyId, warrantyData)
        : await submitWarranty(warrantyData);

      toast({
        title: warrantyId ? "Warranty Updated" : "Warranty Registered",
        description: warrantyId
          ? "Warranty updated and resubmitted successfully!"
          : `Warranty registered successfully. UID: ${formData.uid}`,
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
        return; // Don't reset form if callback provided
      }

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
        storeName: "",
        manpowerId: "",
        carMake: "",
        carModel: "",
        carYear: "",
        warrantyType: "1 Year",
        invoiceFile: null,
      });
    } catch (error: any) {
      console.error("Warranty submission error:", error);
      toast({
        title: "Submission Failed",
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
        title: "File Too Large",
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
        <CardTitle>{warrantyId ? "Edit Seat Cover Warranty" : "Seat Cover Warranty Registration"}</CardTitle>
        <CardDescription>
          {warrantyId
            ? "Update the warranty details below and resubmit for approval"
            : "Please fill in all required fields to register your seat cover warranty"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">

            {/* Store Selection - Auto-filled for vendors */}
            <div className="space-y-2">
              <Label htmlFor="storeName">
                Store Name <span className="text-destructive">*</span>
              </Label>
              {user?.role === 'vendor' ? (
                <Input
                  id="storeName"
                  value={formData.storeName}
                  readOnly
                  className="bg-muted"
                  placeholder="Loading store name..."
                />
              ) : (
                <Combobox
                  options={stores.map(store => ({ value: store.store_name, label: store.store_name }))}
                  value={formData.storeName}
                  onChange={(value) => handleChange("storeName", value)}
                  placeholder="Select Store"
                  searchPlaceholder="Search store name..."
                  emptyMessage="No store found."
                />
              )}
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
                readOnly
                className="bg-muted"
              />
            </div>

            {/* Manpower Selection */}
            <div className="space-y-2">
              <Label htmlFor="manpowerId">
                Manpower (Installer)
              </Label>
              <Select
                value={formData.manpowerId}
                onValueChange={(value) => handleChange("manpowerId", value)}
                disabled={!formData.storeName || manpowerList.length === 0}
              >
                <SelectTrigger id="manpowerId">
                  <SelectValue placeholder={!formData.storeName ? "Select Store First" : manpowerList.length === 0 ? "No Manpower Found" : "Select Installer"} />
                </SelectTrigger>
                <SelectContent>
                  {manpowerList.map((mp) => (
                    <SelectItem key={mp.id} value={mp.id}>
                      {mp.name} ({mp.applicator_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                readOnly={user?.role === 'customer'}
                className={user?.role === 'customer' ? 'bg-muted cursor-not-allowed' : ''}
              />
              {user?.role === 'customer' && (
                <p className="text-xs text-muted-foreground">Auto-filled from your account</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">
                Customer Email {user?.role !== 'vendor' && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="customer@example.com"
                value={formData.customerEmail}
                onChange={(e) => handleChange("customerEmail", e.target.value)}
                required={user?.role !== 'vendor'}
                readOnly={user?.role === 'customer'}
                className={user?.role === 'customer' ? 'bg-muted cursor-not-allowed' : ''}
              />
              {user?.role === 'customer' && (
                <p className="text-xs text-muted-foreground">Auto-filled from your account</p>
              )}
              {user?.role === 'vendor' && (
                <p className="text-xs text-muted-foreground">Optional - If not provided, customer won't receive email notifications</p>
              )}
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
                readOnly={user?.role === 'customer'}
                className={user?.role === 'customer' ? 'bg-muted cursor-not-allowed' : ''}
              />
              {user?.role === 'customer' && (
                <p className="text-xs text-muted-foreground">Auto-filled from your account</p>
              )}
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
              <Label htmlFor="productName">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Combobox
                options={products.map(product => ({ value: product.name, label: product.name }))}
                value={formData.productName}
                onChange={(value) => handleChange("productName", value)}
                placeholder="Select Product Name"
                searchPlaceholder="Search product..."
                emptyMessage="No product found."
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
                Auto-selected based on product
              </p>
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