import { useState } from "react";
import { z } from "zod";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, ShieldCheck, AlertCircle, KeyRound } from "lucide-react";
import authHero from "@/assets/auth-hero.jpg";

const Register = () => {
  const [searchParams] = useSearchParams();
  const role = (searchParams.get("role") as UserRole) || "customer";
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call API to send OTP
      const response = await fetch("/api/auth/register/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, role }),
      });

      if (!response.ok) {
        throw new Error("Failed to send OTP");
      }

      setOtpSent(true);
      toast({
        title: "OTP Sent",
        description: "Please check your email for the verification code.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register({ ...formData, otp, role });
      
      if (role === "vendor") {
        toast({
          title: "Registration Submitted",
          description: "Your vendor registration is pending validation from our representative. You'll receive an email once approved.",
        });
      } else {
        toast({
          title: "Registration Successful",
          description: "Your account has been created successfully. You can now login.",
        });
      }
      
      navigate(`/login?role=${role}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Registration failed. Please check your OTP and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, role }),
      });

      if (!response.ok) {
        throw new Error("Failed to resend OTP");
      }

      toast({
        title: "OTP Resent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend OTP.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-background overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-primary mb-2">
              <ShieldCheck className="h-8 w-8" />
              <span className="text-2xl font-bold">Warranty Portal</span>
            </Link>
            <p className="text-muted-foreground text-sm mt-2">
              Secure warranty registration system
            </p>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {role === "customer" ? "Customer" : "Vendor"} Registration
            </h1>
            <p className="text-muted-foreground">
              {!otpSent 
                ? (role === "customer" 
                    ? "Create your account to register warranties" 
                    : "Request vendor account (requires validation)")
                : "Enter the OTP sent to your email"
              }
            </p>
          </div>

          {/* Form Content */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="pl-11 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    className="pl-11 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="pl-11 h-12"
                  />
                </div>
              </div>

              {role === "vendor" && (
                <div className="bg-muted/50 border border-border p-4 rounded-lg flex gap-3">
                  <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Vendor accounts require validation from our representative before you can login.
                  </p>
                </div>
              )}

          <Button type="submit" className="w-full h-12" disabled={loading}>
  {loading ? "Sending OTP..." : "Send OTP"}
</Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to={`/login?role=${role}`} className="text-primary font-medium hover:underline">
                  Login here
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndRegister} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      value={formData.name}
                      disabled
                      className="pl-11 h-12 bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      value={formData.email}
                      disabled
                      className="pl-11 h-12 bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      value={formData.phoneNumber}
                      disabled
                      className="pl-11 h-12 bg-muted"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">
                  One-Time Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    className="pl-11 h-12 tracking-widest text-center text-lg font-semibold"
                  />
                </div>
              </div>

              {role === "vendor" && (
                <div className="bg-muted/50 border border-border p-4 rounded-lg flex gap-3">
                  <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Vendor accounts require validation from our representative before you can login.
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? "Verifying..." : "Complete Registration"}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                  }}
                  className="text-muted-foreground hover:text-primary"
                >
                  Edit details
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-primary font-medium hover:underline"
                >
                  Resend OTP
                </button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to={`/login?role=${role}`} className="text-primary font-medium hover:underline">
                  Login here
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex flex-1 relative bg-muted">
        <img 
          src={authHero} 
          alt="Warranty Registration" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/90 to-primary/90 mix-blend-multiply" />
        <div className="relative z-10 flex items-center justify-center p-12 text-white">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-4">
              Join Our Platform
            </h2>
            <p className="text-lg text-white/90 mb-6">
              Register your products and enjoy comprehensive warranty coverage. Professional service for customers and vendors.
            </p>
            <ul className="space-y-3 text-white/90">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
                <span>Easy warranty registration</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
                <span>Secure data management</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
                <span>24/7 support access</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;