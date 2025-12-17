import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, ShieldCheck, AlertCircle, KeyRound, Store, MapPin, Plus, Trash2, Users, Loader2 } from "lucide-react";
import authHero from "@/assets/auth-hero.jpg";
import {
  validateIndianMobile,
  validateEmail,
  validatePincode,
  cleanPhoneNumber,
  getPhoneError,
  getEmailError,
  getPincodeError
} from "@/lib/validation";

interface Manpower {
  id: string;
  name: string;
  phoneNumber: string;
  manpowerId: string;
  applicatorType: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phoneNumber?: string;
  storeName?: string;
  storeEmail?: string;
  address?: string;
  state?: string;
  city?: string;
  pincode?: string;
}

const Register = () => {
  const [searchParams] = useSearchParams();
  const role = (searchParams.get("role") as UserRole) || "customer";

  // Common state
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Customer Form Data
  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
    phoneNumber: ""
  });

  // Vendor Form Data
  const [vendorData, setVendorData] = useState({
    contactName: "",
    storeName: "",
    storeEmail: "",
    phoneNumber: "",
    address: "",
    state: "",
    city: "",
    pincode: "",
  });

  // Handle Customer Input Change with validation
  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Clean phone number input
    if (name === 'phoneNumber') {
      const cleaned = cleanPhoneNumber(value);
      setCustomerData(prev => ({ ...prev, [name]: cleaned }));
      setErrors(prev => ({ ...prev, phoneNumber: getPhoneError(cleaned) }));
    } else if (name === 'email') {
      setCustomerData(prev => ({ ...prev, [name]: value }));
      setErrors(prev => ({ ...prev, email: getEmailError(value) }));
    } else {
      setCustomerData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle Vendor Input Change with validation
  const handleVendorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'phoneNumber') {
      const cleaned = cleanPhoneNumber(value);
      setVendorData(prev => ({ ...prev, [name]: cleaned }));
      setErrors(prev => ({ ...prev, phoneNumber: getPhoneError(cleaned) }));
    } else if (name === 'storeEmail') {
      setVendorData(prev => ({ ...prev, [name]: value }));
      setErrors(prev => ({ ...prev, storeEmail: getEmailError(value) }));
    } else if (name === 'pincode') {
      const cleaned = value.replace(/\D/g, '').slice(0, 6);
      setVendorData(prev => ({ ...prev, [name]: cleaned }));
      setErrors(prev => ({ ...prev, pincode: getPincodeError(cleaned) }));
    } else {
      setVendorData(prev => ({ ...prev, [name]: value }));
    }
  };


  // Manpower Data
  const [manpowerList, setManpowerList] = useState<Manpower[]>([
    { id: "1", name: "", phoneNumber: "", manpowerId: "", applicatorType: "" },
    { id: "2", name: "", phoneNumber: "", manpowerId: "", applicatorType: "" },
    { id: "3", name: "", phoneNumber: "", manpowerId: "", applicatorType: "" }
  ]);

  const navigate = useNavigate();
  const { register, verifyOTP } = useAuth();
  const { toast } = useToast();

  // Handle Manpower Change with phone validation
  const handleManpowerChange = (id: string, field: keyof Manpower, value: string) => {
    setManpowerList(prev => prev.map(item => {
      if (item.id === id) {
        let processedValue = value;

        // Clean phone number for manpower
        if (field === 'phoneNumber') {
          processedValue = cleanPhoneNumber(value);
        }

        const updatedItem = { ...item, [field]: processedValue };

        // Auto-generate Manpower ID if name or phone changes
        if (field === "name" || field === "phoneNumber") {
          const namePart = updatedItem.name.slice(0, 3).toUpperCase();
          const phonePart = updatedItem.phoneNumber.slice(-4);
          updatedItem.manpowerId = (namePart && phonePart) ? `${namePart}${phonePart}` : "";
        }

        return updatedItem;
      }
      return item;
    }));
  };

  // Add Manpower Row
  const addManpowerRow = () => {
    const newId = (manpowerList.length + 1).toString();
    setManpowerList(prev => [
      ...prev,
      { id: newId, name: "", phoneNumber: "", manpowerId: "", applicatorType: "" }
    ]);
  };

  // Remove Manpower Row
  const removeManpowerRow = (id: string) => {
    if (manpowerList.length > 1) {
      setManpowerList(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate before submission
    if (role === "customer") {
      const emailError = getEmailError(customerData.email);
      const phoneError = getPhoneError(customerData.phoneNumber);

      if (emailError || phoneError) {
        setErrors({ email: emailError, phoneNumber: phoneError });
        toast({
          title: "Validation Error",
          description: emailError || phoneError,
          variant: "destructive",
        });
        return;
      }
    } else {
      // Vendor validation
      const emailError = getEmailError(vendorData.storeEmail);
      const phoneError = getPhoneError(vendorData.phoneNumber);
      const pincodeError = getPincodeError(vendorData.pincode);

      if (emailError || phoneError || pincodeError) {
        setErrors({ storeEmail: emailError, phoneNumber: phoneError, pincode: pincodeError });
        toast({
          title: "Validation Error",
          description: emailError || phoneError || pincodeError,
          variant: "destructive",
        });
        return;
      }

      // Validate manpower phone numbers
      const invalidManpower = manpowerList.filter(m => m.phoneNumber && !validateIndianMobile(m.phoneNumber));
      if (invalidManpower.length > 0) {
        toast({
          title: "Validation Error",
          description: "Please enter valid 10-digit Indian mobile numbers for all manpower entries",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      // Prepare data based on role
      const registrationData = role === "customer"
        ? { ...customerData, role }
        : {
          ...vendorData,
          name: vendorData.contactName, // Map contactName to name for backend compatibility
          email: vendorData.storeEmail, // Map storeEmail to email
          manpower: manpowerList.filter(m => m.name && m.phoneNumber), // Filter empty rows
          role
        };

      const result = await register(registrationData);
      setUserId(result.userId);
      setShowOTP(true);

      toast({
        title: "OTP Sent",
        description: "An OTP has been sent to your email. Enter it below to complete registration.",
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.response?.data?.error || error.message || "Registration failed.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await verifyOTP(userId, otp);

      if (role === "customer") {
        if (result.token) {
          toast({
            title: "Registration Successful",
            description: "Registration complete! Welcome aboard!"
          });
          navigate("/", { replace: true });
        }
      } else {
        toast({
          title: "Registration Submitted",
          description: "Your franchise registration request has been submitted for approval. You'll be notified via email.",
          duration: 5000
        });
        setTimeout(() => {
          navigate(`/login?role=vendor`, { replace: true });
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.response?.data?.error || error.message || "Invalid OTP.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-background overflow-y-auto">
        <div className={`w-full ${role === "vendor" ? "max-w-4xl" : "max-w-md"}`}>
          {/* Logo */}
          <div className="mb-8 text-center md:text-left">
            <Link to="/" className="inline-flex items-center gap-2 text-primary mb-2">
              <ShieldCheck className="h-8 w-8" />
              <span className="text-2xl font-bold">Warranty Portal</span>
            </Link>
          </div>

          <div className="mb-8 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">
              {role === "customer" ? "Customer" : "Franchise"} Registration
            </h1>
            <p className="text-muted-foreground">
              {showOTP
                ? "Enter the OTP sent to your email"
                : role === "customer"
                  ? "Create your account to manage warranties"
                  : "Register your store details and manpower"
              }
            </p>
          </div>

          {!showOTP ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              {role === "customer" ? (
                // Customer Form
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        value={customerData.name}
                        onChange={handleCustomerChange}
                        required
                        disabled={loading}
                        className="pl-11 h-12"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={customerData.email}
                        onChange={handleCustomerChange}
                        required
                        disabled={loading}
                        className={`pl-11 h-12 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number * <span className="text-xs text-muted-foreground">(10-digit Indian mobile)</span></Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        placeholder="9876543210"
                        value={customerData.phoneNumber}
                        onChange={handleCustomerChange}
                        required
                        maxLength={10}
                        disabled={loading}
                        className={`pl-11 h-12 ${errors.phoneNumber ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                    </div>
                    {errors.phoneNumber && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.phoneNumber}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                // Vendor Form
                <div className="space-y-8">
                  {/* Contact Information Section */}
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2 border-b pb-2">
                      <Store className="h-5 w-5 text-primary" />
                      Contact Information
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="contactName">Contact Name *</Label>
                        <Input
                          id="contactName"
                          name="contactName"
                          placeholder="Store Owner Name"
                          value={vendorData.contactName}
                          onChange={handleVendorChange}
                          required
                          disabled={loading}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="storeName">Store Name *</Label>
                        <Input
                          id="storeName"
                          name="storeName"
                          placeholder="Tech Store India"
                          value={vendorData.storeName}
                          onChange={handleVendorChange}
                          required
                          disabled={loading}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="storeEmail">Store Email *</Label>
                        <Input
                          id="storeEmail"
                          name="storeEmail"
                          type="email"
                          placeholder="store@example.com"
                          value={vendorData.storeEmail}
                          onChange={handleVendorChange}
                          required
                          disabled={loading}
                          className={`h-11 ${errors.storeEmail ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {errors.storeEmail && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {errors.storeEmail}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number * <span className="text-xs text-muted-foreground">(10-digit)</span></Label>
                        <Input
                          id="phoneNumber"
                          name="phoneNumber"
                          type="tel"
                          placeholder="9876543210"
                          value={vendorData.phoneNumber}
                          onChange={handleVendorChange}
                          required
                          maxLength={10}
                          disabled={loading}
                          className={`h-11 ${errors.phoneNumber ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {errors.phoneNumber && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {errors.phoneNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Shop No, Street, Area"
                        value={vendorData.address}
                        onChange={handleVendorChange}
                        required
                        disabled={loading}
                        className="h-11"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          name="state"
                          placeholder="State"
                          value={vendorData.state}
                          onChange={handleVendorChange}
                          required
                          disabled={loading}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          name="city"
                          placeholder="City"
                          value={vendorData.city}
                          onChange={handleVendorChange}
                          required
                          disabled={loading}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode * <span className="text-xs text-muted-foreground">(6-digit)</span></Label>
                        <Input
                          id="pincode"
                          name="pincode"
                          placeholder="110001"
                          value={vendorData.pincode}
                          onChange={handleVendorChange}
                          required
                          maxLength={6}
                          disabled={loading}
                          className={`h-11 ${errors.pincode ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {errors.pincode && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {errors.pincode}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Manpower Section */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Manpower Details
                      </h2>
                      <Button type="button" variant="outline" size="sm" onClick={addManpowerRow}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Manpower
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {manpowerList.map((manpower, index) => (
                        <div key={manpower.id} className="grid md:grid-cols-12 gap-4 items-end bg-muted/30 p-4 rounded-lg border">
                          <div className="md:col-span-3 space-y-2">
                            <Label>Name</Label>
                            <Input
                              placeholder="Staff Name"
                              value={manpower.name}
                              onChange={(e) => handleManpowerChange(manpower.id, "name", e.target.value)}
                              className="h-10"
                              disabled={loading}
                            />
                          </div>
                          <div className="md:col-span-3 space-y-2">
                            <Label>Phone Number</Label>
                            <Input
                              placeholder="Phone"
                              value={manpower.phoneNumber}
                              onChange={(e) => handleManpowerChange(manpower.id, "phoneNumber", e.target.value)}
                              className="h-10"
                              disabled={loading}
                            />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <Label>Manpower ID</Label>
                            <Input
                              value={manpower.manpowerId}
                              readOnly
                              className="h-10 bg-muted font-mono text-sm"
                              placeholder="Auto-gen"
                            />
                          </div>
                          <div className="md:col-span-3 space-y-2">
                            <Label>Applicator Type</Label>
                            <Select
                              value={manpower.applicatorType}
                              onValueChange={(value) => handleManpowerChange(manpower.id, "applicatorType", value)}
                              disabled={loading}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="seat_cover">Seat Cover Applicator</SelectItem>
                                <SelectItem value="ppf_spf">PPF/SPF Applicator</SelectItem>
                                <SelectItem value="ev">EV Applicator</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-1 flex justify-end pb-1">
                            {manpowerList.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                onClick={() => removeManpowerRow(manpower.id)}
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {role === "vendor" && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex gap-3 text-blue-800">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">
                    Submitting this form will send a registration request to our admin team.
                    You will receive an OTP to verify your email first.
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full h-12 text-lg font-semibold" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : role === "vendor" ? "Request Franchise Registration" : "Send OTP"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to={`/login?role=${role}`} className="text-primary font-medium hover:underline">
                  Login here
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp">One-Time Password (OTP)</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    required
                    maxLength={6}
                    disabled={loading}
                    className="pl-11 h-12 text-center text-2xl tracking-widest"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Check your email ({role === "customer" ? customerData.email : vendorData.storeEmail}) for the OTP
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : "Verify & Submit Request"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12"
                onClick={() => {
                  setShowOTP(false);
                  setOtp("");
                }}
              >
                Back
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex flex-1 relative bg-muted">
        <img src={authHero} alt="Registration" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-secondary/90 mix-blend-multiply" />
        <div className="relative z-10 flex items-center justify-center p-12 text-white">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-4">Join Us Today</h2>
            <p className="text-lg text-white/90">
              {role === "customer"
                ? "Register your products and manage warranties effortlessly. Fast, secure, and reliable."
                : "Partner with us to provide seamless warranty services. Manage your manpower and registrations in one place."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;