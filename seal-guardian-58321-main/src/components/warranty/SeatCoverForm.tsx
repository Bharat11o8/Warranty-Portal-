import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  validateIndianMobile,
  validateEmail,
  getPhoneError,
  getEmailError
} from "@/lib/validation";
import { getISTTodayISO, getISTYear } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, Loader2, HelpCircle, CheckCircle2, FileText, Building2, User, Car, Smartphone, Mail, Calendar, Package } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { submitWarranty, updateWarranty } from "@/lib/warrantyApi";
import { TermsModal } from "./TermsModal";
import { CAR_MAKES } from "@/lib/carMakes";

interface SeatCoverFormProps {
  initialData?: any;
  warrantyId?: string;
  onSuccess?: () => void;
  isEditing?: boolean;
  isPublic?: boolean;
  storeDetails?: {
    id: number;
    store_name: string;
    store_email: string;
    contact_number: string;
    address_line1?: string;
    city?: string;
    state?: string;
    store_code?: string;
    vendor_details_id?: number;
  };
  installers?: any[];
}

const SeatCoverForm = ({ initialData, warrantyId, onSuccess, isEditing, isPublic, storeDetails, installers }: SeatCoverFormProps = {}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [manpowerList, setManpowerList] = useState<any[]>([]);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialData ? {
    uid: initialData.product_details?.uid || "",
    customerName: initialData.customer_name || "",
    customerEmail: initialData.customer_email || "",
    customerMobile: initialData.customer_phone || "",

    productName: initialData.product_details?.productName || "",
    storeEmail: initialData.installer_contact || "",
    purchaseDate: initialData.purchase_date ? new Date(initialData.purchase_date).toISOString().split('T')[0] : "",
    storeName: initialData.installer_name || "",
    manpowerId: initialData.manpower_id || "",
    carMake: initialData.car_make || "",
    carModel: initialData.car_model || "",
    carYear: initialData.car_year || "",
    warrantyType: initialData.warranty_type || "1 Year",
    invoiceFile: null as File | null,
    termsAccepted: true, // Already accepted if editing
  } : {
    uid: "",
    customerName: "",
    customerEmail: "",
    customerMobile: "",

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
    termsAccepted: false,
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

  // Auto-fill store details for public QR flow
  useEffect(() => {
    if (isPublic && storeDetails) {
      setFormData(prev => ({
        ...prev,
        storeName: storeDetails.store_name || "",
        storeEmail: storeDetails.store_email || "",
      }));
      if (installers) {
        setManpowerList(installers);
      }
    }
  }, [isPublic, storeDetails, installers]);

  // Fetch manpower when store changes
  useEffect(() => {
    const fetchManpower = async () => {
      const selectedStore = stores.find(s => s.store_name === formData.storeName);
      if (selectedStore) {
        // Auto-fill email
        setFormData(prev => ({ ...prev, storeEmail: selectedStore.store_email, manpowerId: "" }));

        try {
          const response = await api.get(`/public/stores/${selectedStore.vendor_details_id}/manpower?active=true`);
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
      if (!formData.termsAccepted) {
        toast({
          title: "Terms Required",
          description: "Please accept the terms and conditions to proceed.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (formData.uid.length < 13 || formData.uid.length > 16) {
        toast({
          title: "Invalid UID",
          description: "UID must be between 13-16 digits",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate Customer Mobile
      const phoneError = getPhoneError(formData.customerMobile);
      if (phoneError) {
        toast({
          title: "Invalid Mobile Number",
          description: phoneError,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate Customer Email (if provided or required)
      // Note: Email is required for non-vendors and for public flow
      if (isPublic && !formData.customerEmail) {
        toast({
          title: "Email Required",
          description: "Please enter your email address",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if (formData.customerEmail && !validateEmail(formData.customerEmail)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate Car Make
      if (!formData.carMake) {
        toast({
          title: "Car Make Required",
          description: "Please select a car make",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate Car Year
      if (!formData.carYear) {
        toast({
          title: "Car Year Required",
          description: "Please select a car year",
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
        customerAddress: "N/A",
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
          customerAddress: "N/A",
          invoiceFileName: formData.invoiceFile?.name || null,
          invoiceFile: formData.invoiceFile, // Pass file object for API wrapper
        },
      };

      // Submit or update warranty registration
      let result;
      if (warrantyId) {
        result = await updateWarranty(warrantyId, warrantyData);
        toast({
          title: "Warranty Updated",
          description: "Warranty updated and resubmitted successfully!",
        });
      } else if (isPublic) {
        // Public flow: use public API endpoint
        const formDataPayload = new FormData();

        // Add warranty data fields
        Object.entries(warrantyData).forEach(([key, value]) => {
          if (key === 'productDetails') {
            const pd = value as any;
            // Extract invoice file before stringifying
            const invoiceFile = pd.invoiceFile;
            const pdWithoutFile = { ...pd };
            delete pdWithoutFile.invoiceFile;
            formDataPayload.append('productDetails', JSON.stringify(pdWithoutFile));

            // Append invoice file
            if (invoiceFile instanceof File) formDataPayload.append('invoiceFile', invoiceFile);
          } else if (value !== null && value !== undefined) {
            formDataPayload.append(key, String(value));
          }
        });

        const response = await api.post('/public/warranty/submit', formDataPayload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        result = response.data;
        toast({
          title: "Warranty Submitted!",
          description: result.isNewUser
            ? "Your warranty has been submitted. Check your email for account details!"
            : "Your warranty has been submitted and is awaiting store verification.",
        });
      } else {
        result = await submitWarranty(warrantyData);
        toast({
          title: "Warranty Registered",
          description: `Warranty registered successfully. UID: ${formData.uid}`,
        });
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
        return; // Don't reset form if callback provided
      }

      // For public flow, show success message and don't navigate
      if (isPublic) {
        // Reset form for another submission
        setFormData({
          uid: "",
          customerName: "",
          customerEmail: "",
          customerMobile: "",
          productName: "",
          storeEmail: storeDetails?.store_email || "",
          purchaseDate: "",
          storeName: storeDetails?.store_name || "",
          manpowerId: "",
          carMake: "",
          carModel: "",
          carYear: "",
          warrantyType: "1 Year",
          invoiceFile: null,
          termsAccepted: false,
        });
        return;
      }

      // Reset form
      setFormData({
        uid: "",
        customerName: "",
        customerEmail: "",
        customerMobile: "",
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
        termsAccepted: false,
      });

      // Redirect to appropriate dashboard based on role
      const dashboardRoutes: Record<string, string> = {
        customer: "/dashboard/customer",
        vendor: "/dashboard/vendor",
        admin: "/dashboard/admin",
      };
      const redirectPath = user?.role ? dashboardRoutes[user.role] : "/warranty";
      navigate(redirectPath, { replace: true });
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
    let processedValue = value;

    if (name === 'customerMobile') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'customerName' || name === 'carModel') {
      // Allow only letters and spaces
      processedValue = value.replace(/[^A-Za-z\s]/g, '');
    } else if (name === 'uid') {
      // UID should be only digits
      processedValue = value.replace(/\D/g, '').slice(0, 16);
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'application/pdf'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: "Maximum file size is 5 MB",
          variant: "destructive",
        });
        e.target.value = ''; // Reset input
        return;
      }
      // Check file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          title: "Invalid File Format",
          description: "Only JPG, PNG, HEIC, and PDF files are allowed",
          variant: "destructive",
        });
        e.target.value = ''; // Reset input
        return;
      }
    }
    setFormData(prev => ({ ...prev, invoiceFile: file || null }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-1 sm:p-4">
      {/* Header Section */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-orange-100 rounded-full mb-4 ring-8 ring-orange-50">
          <Car className="h-8 w-8 text-orange-600" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          {warrantyId ? "Edit Seat Cover Warranty" : "Seat Cover Warranty Registration"}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {warrantyId
            ? "Update the warranty details below and resubmit for approval."
            : "Complete the form below to register your premium seat cover warranty. Please ensure all details are accurate."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Store & Installer Details */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm ring-1 ring-slate-100">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50/30 px-6 py-4 border-b border-orange-100 flex items-center gap-3 rounded-t-xl">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Building2 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Installer Details</h3>
              <p className="text-xs text-muted-foreground">Store and manpower information</p>
            </div>
          </div>
          <CardContent className="p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {/* Store Selection */}
              <div className="space-y-3">
                <Label htmlFor="storeName" className="text-sm font-medium text-slate-700">
                  Store Name <span className="text-destructive">*</span>
                </Label>
                {user?.role === 'vendor' || isPublic ? (
                  <Input
                    id="storeName"
                    value={formData.storeName}
                    readOnly
                    className="bg-slate-50 border-slate-200"
                    placeholder={isPublic ? "Store Name" : "Loading store name..."}
                  />
                ) : (
                  <Combobox
                    options={stores.map(store => ({ value: store.store_name, label: store.store_name }))}
                    value={formData.storeName}
                    onChange={(value) => handleChange("storeName", value)}
                    placeholder="Select Store"
                    searchPlaceholder="Search store name..."
                    emptyMessage="No store found."
                    disabled={loading}
                    className="w-full"
                  />
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="storeEmail" className="text-sm font-medium text-slate-700">
                  Store Email <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="storeEmail"
                    type="email"
                    placeholder="store@example.com"
                    value={formData.storeEmail}
                    onChange={(e) => handleChange("storeEmail", e.target.value)}
                    required
                    readOnly
                    disabled={loading}
                    className="pl-9 bg-slate-50 border-slate-200"
                  />
                </div>
              </div>

              {/* Manpower Selection */}
              <div className="space-y-3">
                <Label htmlFor="manpowerId" className="text-sm font-medium text-slate-700">
                  Manpower (Installer)
                </Label>
                <Select
                  value={formData.manpowerId}
                  onValueChange={(value) => handleChange("manpowerId", value)}
                  disabled={(!formData.storeName || manpowerList.length === 0) || loading}
                >
                  <SelectTrigger id="manpowerId" className="bg-white border-slate-200">
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

              <div className="space-y-3">
                <Label htmlFor="purchaseDate" className="text-sm font-medium text-slate-700">
                  Purchase Date <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => handleChange("purchaseDate", e.target.value)}
                    required
                    disabled={loading}
                    max={getISTTodayISO()}
                    className="pl-9 bg-white border-slate-200"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Customer Information */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm ring-1 ring-slate-100">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50/30 px-6 py-4 border-b border-blue-100 flex items-center gap-3 rounded-t-xl">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Customer Information</h3>
              <p className="text-xs text-muted-foreground">Personal and contact details</p>
            </div>
          </div>
          <CardContent className="p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-3">
                <Label htmlFor="customerName" className="text-sm font-medium text-slate-700">
                  Customer Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="customerName"
                    type="text"
                    placeholder="Enter customer name"
                    value={formData.customerName}
                    onChange={(e) => handleChange("customerName", e.target.value)}
                    required
                    readOnly={user?.role === 'customer'}
                    disabled={loading}
                    className={`pl-9 border-slate-200 ${user?.role === 'customer' ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'}`}
                  />
                </div>
                {user?.role === 'customer' && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" /> Auto-filled
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="customerEmail" className="text-sm font-medium text-slate-700">
                  Customer Email {user?.role !== 'vendor' && <span className="text-destructive">*</span>}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="customer@example.com"
                    value={formData.customerEmail}
                    onChange={(e) => handleChange("customerEmail", e.target.value)}
                    required={user?.role !== 'vendor'}
                    readOnly={user?.role === 'customer'}
                    disabled={loading}
                    className={`pl-9 border-slate-200 ${user?.role === 'customer' ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'}`}
                  />
                </div>
                {user?.role === 'vendor' && (
                  <p className="text-xs text-muted-foreground">Optional for notification</p>
                )}
              </div>

              <div className="space-y-3 md:col-span-2">
                <Label htmlFor="customerMobile" className="text-sm font-medium text-slate-700">
                  Mobile Number <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="customerMobile"
                    type="tel"
                    placeholder="9876543210"
                    value={formData.customerMobile}
                    onChange={(e) => handleChange("customerMobile", e.target.value)}
                    required
                    readOnly={user?.role === 'customer'}
                    disabled={loading}
                    className={`pl-9 border-slate-200 ${user?.role === 'customer' ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'}`}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Vehicle Details */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm ring-1 ring-slate-100">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50/30 px-6 py-4 border-b border-emerald-100 flex items-center gap-3 rounded-t-xl">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Car className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Vehicle Details</h3>
              <p className="text-xs text-muted-foreground">Car make, model and year</p>
            </div>
          </div>
          <CardContent className="p-6 md:p-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="carMake" className="text-sm font-medium text-slate-700">
                  Car Make <span className="text-destructive">*</span>
                </Label>
                <Combobox
                  options={[...CAR_MAKES]}
                  value={formData.carMake}
                  onChange={(value) => handleChange("carMake", value)}
                  placeholder="Select Brand"
                  searchPlaceholder="Search brands..."
                  emptyMessage="No brand found."
                  disabled={loading}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="carModel" className="text-sm font-medium text-slate-700">
                  Car Model
                </Label>
                <Input
                  id="carModel"
                  type="text"
                  placeholder="e.g., Camry"
                  value={formData.carModel}
                  onChange={(e) => handleChange("carModel", e.target.value)}
                  disabled={loading}
                  className="bg-white border-slate-200"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="carYear" className="text-sm font-medium text-slate-700">
                  Car Year <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.carYear}
                  onValueChange={(value) => handleChange("carYear", value)}
                  disabled={loading}
                >
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: getISTYear() - 1979 }, (_, i) => getISTYear() - i).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Product & Warranty */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm ring-1 ring-slate-100">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50/30 px-6 py-4 border-b border-purple-100 flex items-center gap-3 rounded-t-xl">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Product & Warranty Information</h3>
              <p className="text-xs text-muted-foreground">Product UID and warranty details</p>
            </div>
          </div>
          <CardContent className="p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-3 md:col-span-2">
                <Label htmlFor="uid" className="text-sm font-medium text-slate-700">
                  Product UID (from MRP Sticker) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-2.5 bg-slate-100 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-500 tracking-wider">UID</div>
                  <Input
                    id="uid"
                    type="text"
                    placeholder="Enter 13-16 digit number"
                    value={formData.uid}
                    onChange={(e) => handleChange("uid", e.target.value)}
                    required
                    maxLength={16}
                    disabled={loading}
                    pattern="[0-9]{13,16}"
                    className="pl-12 font-mono tracking-wide bg-white border-slate-200"
                  />
                </div>
                <div className="flex justify-between text-xs px-1 mt-1">
                  <span className="text-muted-foreground">{formData.uid.length}/16 digits</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-orange-600 font-medium hover:text-orange-700 transition-colors cursor-help">
                          <HelpCircle className="h-3 w-3" /> Where to find?
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Locate the sticker on the seat cover product packaging.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="productName" className="text-sm font-medium text-slate-700">
                  Product Name <span className="text-destructive">*</span>
                </Label>
                <Combobox
                  options={products.map(product => ({ value: product.name, label: product.name }))}
                  value={formData.productName}
                  onChange={(value) => handleChange("productName", value)}
                  placeholder="Select Product"
                  searchPlaceholder="Search product..."
                  emptyMessage="No product found."
                  disabled={loading}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="warrantyType" className="text-sm font-medium text-slate-700">
                  Warranty Type
                </Label>
                <div className="relative">
                  <CheckCircle2 className="absolute left-3 top-2.5 h-4 w-4 text-green-500" />
                  <Input
                    id="warrantyType"
                    type="text"
                    value={formData.warrantyType}
                    readOnly
                    className="pl-9 bg-green-50/50 border-green-100 text-green-700 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-3 md:col-span-2">
                <Label htmlFor="invoiceFile" className="text-sm font-medium text-slate-700">
                  Proof of Purchase (Invoice / MRP Sticker) <span className="text-destructive">*</span>
                </Label>
                <div className={`mt-2 border-2 border-dashed rounded-xl p-6 transition-all duration-200 text-center relative ${formData.invoiceFile ? 'border-orange-300 bg-orange-50/30' : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'}`}>
                  <div className="flex flex-col items-center gap-2">
                    <div className={`p-3 rounded-full ${formData.invoiceFile ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                      {formData.invoiceFile ? <FileText className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
                    </div>
                    <div>
                      {formData.invoiceFile ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-orange-700 break-all">{formData.invoiceFile.name}</p>
                          <p className="text-xs text-orange-600/70">{(formData.invoiceFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          <label htmlFor="invoiceFile" className="text-xs text-orange-600 underline cursor-pointer hover:text-orange-800">Change File</label>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
                          <p className="text-xs text-muted-foreground">JPG, PNG, PDF (Max 5MB)</p>
                        </div>
                      )}
                    </div>
                    <Input
                      id="invoiceFile"
                      type="file"
                      accept="image/jpeg,image/png,image/heic,image/heif,application/pdf"
                      onChange={handleFileChange}
                      required={!warrantyId}
                      disabled={loading}
                      className="hidden"
                    />
                    {!formData.invoiceFile && (
                      <label htmlFor="invoiceFile" className="absolute inset-0 cursor-pointer"></label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms & Submit */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm ring-1 ring-slate-100">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className={`p-4 rounded-xl border transition-colors ${formData.termsAccepted ? 'bg-green-50/50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 p-1 rounded-full ${formData.termsAccepted ? 'bg-green-100' : 'bg-slate-200'}`}>
                      <CheckCircle2 className={`h-4 w-4 ${formData.termsAccepted ? 'text-green-600' : 'text-slate-500'}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Terms & Conditions</h4>
                      <p className="text-sm text-muted-foreground">Please review and accept our policy to proceed.</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={formData.termsAccepted ? "outline" : "default"}
                    onClick={() => setTermsModalOpen(true)}
                    className={formData.termsAccepted ? "border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800" : ""}
                  >
                    {formData.termsAccepted ? 'View Terms' : 'View & Accept'}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full text-lg h-12 shadow-orange-200 shadow-lg hover:shadow-xl transition-all"
                disabled={loading || !formData.termsAccepted}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing Registration...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Terms Modal */}
        <TermsModal
          isOpen={termsModalOpen}
          onClose={() => setTermsModalOpen(false)}
          onAccept={() => setFormData(prev => ({ ...prev, termsAccepted: true }))}
        />
      </form>
    </div>
  );
};

export default SeatCoverForm;