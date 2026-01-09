import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { submitWarranty, updateWarranty } from "@/lib/warrantyApi";
import InstallerDetails from "./steps/InstallerDetails";
import CustomerDetails from "./steps/CustomerDetails";
import CarDetails from "./steps/CarDetails";
import ProductInfo from "./steps/ProductInfo";

export interface EVFormData {
  // Installer Details
  storeName: string;
  storeEmail: string;
  dealerMobile: string;
  dealerAddr1: string;
  dealerAddr2: string;
  dealerState: string;
  dealerCity: string;
  dealerPostalCode: string;
  installerName: string;
  installerCode: string;
  manpowerId?: number | string;

  // Customer Details
  customerFname: string;
  customerLname: string;
  customerMobile: string;
  customerEmail: string;



  // Car Details
  installationDate: string;
  carModel: string;
  carReg: string;
  carMake: string;
  carYear: string;

  // Product Info
  product: string;
  warrantyType: string;
  serialNumber: string;
  installArea: string;
  lhsPhoto: File | null;
  rhsPhoto: File | null;
  frontRegPhoto: File | null;
  backRegPhoto: File | null;
  warrantyPhoto: File | null;
  termsAccepted: boolean;
}

interface EVProductsFormProps {
  initialData?: any;
  warrantyId?: string;
  onSuccess?: () => void;
  isUniversal?: boolean;
  isEditing?: boolean;
}

const EVProductsForm = ({ initialData, warrantyId, onSuccess, isUniversal, isEditing }: EVProductsFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<EVFormData>({
    storeName: "",
    storeEmail: "",
    dealerMobile: "",
    dealerAddr1: "",
    dealerAddr2: "",
    dealerState: "",
    dealerCity: "",
    dealerPostalCode: "",
    customerFname: "",
    customerLname: "",
    customerMobile: "",
    customerEmail: "",
    installerName: "",
    installerCode: "",


    installationDate: "",
    carModel: "",
    carReg: "",
    product: "",
    warrantyType: "",
    serialNumber: "",
    carMake: "",
    carYear: "",
    installArea: "",
    lhsPhoto: null,
    rhsPhoto: null,
    frontRegPhoto: null,
    backRegPhoto: null,
    warrantyPhoto: null,
    termsAccepted: false,
  });

  // Auto-fill customer details for logged-in customers
  // Auto-fill customer details for logged-in customers
  useEffect(() => {
    if (initialData) {
      // Pre-fill form with initial data for editing
      const pd = initialData.product_details || {};
      const customerNameParts = initialData.customer_name?.split(' ') || [];
      const dealerAddressParts = pd.dealerAddress?.split(',') || [];
      const custAddressParts = initialData.customer_address?.split(',') || [];

      setFormData({
        storeName: initialData.installer_name || "",
        storeEmail: initialData.installer_contact?.split('|')[0]?.trim() || "",
        dealerMobile: initialData.installer_contact?.split('|')[1]?.trim() || "",
        dealerAddr1: dealerAddressParts[0]?.trim() || "",
        dealerAddr2: dealerAddressParts[1]?.trim() || "",
        dealerCity: dealerAddressParts[2]?.trim() || "",
        dealerState: dealerAddressParts[3]?.split('-')[0]?.trim() || "",
        dealerPostalCode: dealerAddressParts[3]?.split('-')[1]?.trim() || "",

        customerFname: customerNameParts[0] || "",
        customerLname: customerNameParts.slice(1).join(' ') || "",
        customerEmail: initialData.customer_email || "",
        customerMobile: initialData.customer_phone || "",



        installerName: initialData.installer_name || "",
        installerCode: "", // Not stored in DB?
        manpowerId: initialData.manpower_id || "",

        installationDate: initialData.purchase_date ? new Date(initialData.purchase_date).toISOString().split('T')[0] : "",
        carModel: initialData.car_model || "",
        carReg: initialData.registration_number || "",
        carMake: initialData.car_make || "",
        carYear: initialData.car_year || "",

        product: pd.product || "",
        warrantyType: initialData.warranty_type || "1 Year",
        serialNumber: pd.serialNumber || "",
        installArea: pd.installArea || "",

        // Photos are URLs in edit mode, need to handle this in ProductInfo or just show them
        // For now, we keep them null as we can't convert URL to File easily here without fetching
        // User will need to re-upload if they want to change, or we handle "existing photo" logic
        lhsPhoto: null,
        rhsPhoto: null,
        frontRegPhoto: null,
        backRegPhoto: null,
        warrantyPhoto: null,

        termsAccepted: true, // Assume accepted if editing
      });
    } else if (user?.role === 'customer') {
      const nameParts = user.name?.split(' ') || [];
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(' ') || "";

      setFormData(prev => ({
        ...prev,
        customerFname: firstName,
        customerLname: lastName,
        customerEmail: user.email || "",
        customerMobile: user.phoneNumber || "",
      }));
    } else if (user?.role === 'vendor') {
      // Auto-fill vendor/store details for logged-in vendors
      const fetchVendorDetails = async () => {
        try {
          const response = await api.get('/vendor/profile');
          if (response.data.success && response.data.vendorDetails) {
            const vendorDetails = response.data.vendorDetails;
            setFormData(prev => ({
              ...prev,
              storeName: vendorDetails.store_name || "",
              storeEmail: vendorDetails.store_email || "",
              dealerMobile: vendorDetails.contact_number || "",
              dealerAddr1: vendorDetails.address_line1 || "",
              dealerAddr2: vendorDetails.address_line2 || "",
              dealerCity: vendorDetails.city || "",
              dealerState: vendorDetails.state || "",
              dealerPostalCode: vendorDetails.postal_code || "",
            }));
          }
        } catch (error) {
          console.error("Failed to fetch vendor details", error);
        }
      };
      fetchVendorDetails();
    }
  }, [user, initialData]);

  const steps = [
    { number: 1, label: "Installer Details" },
    { number: 2, label: "Customer Details" },
    { number: 3, label: "Car Details" },
    { number: 4, label: "Product Info" },
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    // === Step 1: Installer Details Validation ===
    if (!formData.storeName) {
      toast({ title: "Store Name Required", description: "Please select a store", variant: "destructive" });
      return;
    }
    if (!formData.installerName) {
      toast({ title: "Installer Name Required", description: "Please select an installer", variant: "destructive" });
      return;
    }

    // === Step 2: Customer Details Validation ===
    if (!formData.customerFname) {
      toast({ title: "Customer Name Required", description: "Please enter customer's first name", variant: "destructive" });
      return;
    }
    if (!formData.customerMobile) {
      toast({ title: "Customer Mobile Required", description: "Please enter customer's mobile number", variant: "destructive" });
      return;
    }

    // === Step 3: Car Details Validation ===
    if (!formData.installationDate) {
      toast({ title: "Installation Date Required", description: "Please select installation date", variant: "destructive" });
      return;
    }
    if (!formData.carMake) {
      toast({ title: "Car Make Required", description: "Please select a car make", variant: "destructive" });
      return;
    }
    if (!formData.carModel) {
      toast({ title: "Car Model Required", description: "Please enter the car model", variant: "destructive" });
      return;
    }
    if (!formData.carYear) {
      toast({ title: "Car Year Required", description: "Please select a car year", variant: "destructive" });
      return;
    }
    if (!formData.carReg) {
      toast({ title: "Registration Number Required", description: "Please enter car registration number", variant: "destructive" });
      return;
    }

    // === Step 4: Product Info Validation ===
    if (!formData.product) {
      toast({ title: "Product Required", description: "Please select a product", variant: "destructive" });
      return;
    }

    if (!formData.installArea) {
      toast({ title: "Installation Area Required", description: "Please enter the area of installation", variant: "destructive" });
      return;
    }

    // === Photo Validation ===
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

    // === Terms Validation ===
    if (!formData.termsAccepted) {
      toast({ title: "Terms Required", description: "Please accept the terms and conditions", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // Extract car make from carModel (assuming format like "Toyota Camry")
      const carParts = formData.carModel.split(' ');
      const carMake = carParts[0] || "N/A";
      const carModelName = carParts.slice(1).join(' ') || formData.carModel;

      // Prepare warranty data
      const warrantyData = {
        productType: "ev-products",
        customerName: `${formData.customerFname} ${formData.customerLname}`,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerMobile,
        customerAddress: "N/A",
        carMake: carMake,
        carModel: carModelName,
        carYear: new Date().getFullYear().toString(),
        purchaseDate: formData.installationDate,
        warrantyType: formData.warrantyType || "1 Year", // Use selected warranty type from product
        installerName: formData.storeName,
        installerContact: `${formData.storeEmail} | ${formData.dealerMobile}`,
        manpowerId: formData.manpowerId || null,
        productDetails: {
          product: formData.product,
          product: formData.product,
          installArea: formData.installArea,
          serialNumber: formData.serialNumber,
          manpowerId: formData.manpowerId,
          manpowerName: formData.installerName,
          storeName: formData.storeName,
          storeEmail: formData.storeEmail,
          dealerMobile: formData.dealerMobile,
          customerAddress: "N/A", // Added to ensure it's saved in JSON
          carRegistration: formData.carReg,
          dealerAddress: `${formData.dealerAddr1}, ${formData.dealerAddr2 ? formData.dealerAddr2 + ', ' : ''}${formData.dealerCity}, ${formData.dealerState} - ${formData.dealerPostalCode}`,
          photos: {
            lhs: formData.lhsPhoto, // Pass File object
            rhs: formData.rhsPhoto,
            frontReg: formData.frontRegPhoto,
            backReg: formData.backRegPhoto,
            warranty: formData.warrantyPhoto,
          },
          termsAccepted: formData.termsAccepted,
          installationDate: formData.installationDate,
        },
      };

      // Submit or Update warranty registration
      let result;
      if (warrantyId) {
        result = await updateWarranty(warrantyId, warrantyData);
        toast({
          title: "Warranty Updated",
          description: "Warranty updated successfully.",
        });
      } else {
        result = await submitWarranty(warrantyData);
        toast({
          title: "Warranty Registered",
          description: `Success! Serial No: ${formData.serialNumber}, Vehicle Reg: ${formData.carReg}`,
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        // Reset form only if not editing (or maybe redirect?)
        if (!warrantyId) {
          setCurrentStep(1);
          setFormData({
            storeName: "",
            storeEmail: "",
            dealerMobile: "",
            dealerAddr1: "",
            dealerAddr2: "",
            dealerState: "",
            dealerCity: "",
            dealerPostalCode: "",
            customerFname: "",
            customerLname: "",
            customerMobile: "",
            customerEmail: "",

            installerName: "",
            installerCode: "",
            manpowerId: "",
            installationDate: "",
            carModel: "",
            carReg: "",
            product: "",
            warrantyType: "",
            serialNumber: "",

            installArea: "",
            carMake: "",
            carYear: "",
            lhsPhoto: null,
            rhsPhoto: null,
            frontRegPhoto: null,
            backRegPhoto: null,
            warrantyPhoto: null,
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
        }
      }
    } catch (error: any) {
      console.error("Warranty submission error:", error);
      toast({
        title: "Submission Failed",
        description: error.response?.data?.error || "Failed to submit EV product warranty registration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (updates: Partial<EVFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const progress = (currentStep / 4) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold">{warrantyId ? 'Edit Warranty Application' : 'PPF Warranty Registration'}</CardTitle>
        <CardDescription className="text-base">
          {warrantyId ? 'Update the details below to resubmit your application' : 'Please fill in all required fields to register your Paint Protection Film (PPF) warranty'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex flex-col items-center ${step.number <= currentStep ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 ${step.number <= currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                    }`}
                >
                  {step.number}
                </div>
                <span className="text-xs md:text-sm text-center">{step.label}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form Steps */}
        {currentStep === 1 && (
          <InstallerDetails
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
          />
        )}

        {currentStep === 2 && (
          <CustomerDetails
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrev={handlePrev}
            isCustomer={user?.role === 'customer'}
            isVendor={user?.role === 'vendor'}
          />
        )}

        {currentStep === 3 && (
          <CarDetails
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}

        {currentStep === 4 && (
          <ProductInfo
            formData={formData}
            updateFormData={updateFormData}
            onPrev={handlePrev}
            onSubmit={handleSubmit}
            loading={loading}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default EVProductsForm;