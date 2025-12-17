import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Mail, ShieldCheck, KeyRound, Store, Shield, AlertCircle, Loader2 } from "lucide-react";
import authHero from "@/assets/auth-hero.jpg";
import { validateEmail, getEmailError } from "@/lib/validation";

const Login = () => {
  const [searchParams] = useSearchParams();
  const role = (searchParams.get("role") as UserRole) || "customer";

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  const navigate = useNavigate();
  const { login, verifyOTP } = useAuth();
  const { toast } = useToast();

  // Admin email whitelist
  const ADMIN_EMAIL = "prabhat@autoformindia.com";

  // Countdown timer effect
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Handle email change with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(getEmailError(value));
  };

  // Step 1: Email login (no password)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email format
    const error = getEmailError(email);
    if (error) {
      setEmailError(error);
      toast({
        title: "Validation Error",
        description: error,
        variant: "destructive",
      });
      return;
    }

    // Validate admin email
    if (role === "admin" && email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      toast({
        title: "Access Denied",
        description: "This email is not authorized for admin access. Only invited administrators can login.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, role);

      if (result.requiresOTP && result.userId) {
        setUserId(result.userId);
        setShowOTP(true);
        setResendTimer(30); // Start 30 second countdown
        toast({
          title: "OTP Sent",
          description: "Please check your email for the OTP code.",
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || "Invalid credentials";

      // Check if user is not registered - redirect to register page
      // Matches backend error: "User not found. Please register first."
      if (errorMessage.toLowerCase().includes("not found") ||
        errorMessage.toLowerCase().includes("register first") ||
        errorMessage.toLowerCase().includes("not registered")) {

        toast({
          title: "Account Not Found",
          description: "You don't have an account yet. Redirecting to registration...",
          variant: "destructive",
          duration: 3000,
        });

        // Redirect immediately to register page
        navigate(`/register?role=${role}`, { replace: true });
        return;
      }

      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: OTP verification
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await verifyOTP(userId, otp);

      if (result && result.token && result.user) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${result.user.name}!`,
        });

        // Redirect to role-specific dashboard
        const dashboardRoutes = {
          customer: "/dashboard/customer",
          vendor: "/dashboard/vendor",
          admin: "/dashboard/admin",
        };

        const redirectPath = dashboardRoutes[result.user.role] || "/warranty";
        navigate(redirectPath, { replace: true });
      } else {
        throw new Error("Invalid server response — no token found");
      }
    } catch (error: any) {
      console.error("❌ OTP verification error:", error);
      toast({
        title: "Verification Failed",
        description: error.response?.data?.error || error.message || "Invalid OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOTP = async () => {
    if (resendTimer > 0 || resendLoading) return;

    setResendLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (data.success) {
        setResendTimer(30); // Reset countdown
        setOtp(""); // Clear old OTP input
        toast({
          title: "OTP Resent",
          description: "A new OTP has been sent to your email.",
        });
      } else {
        throw new Error(data.error || "Failed to resend OTP");
      }
    } catch (error: any) {
      toast({
        title: "Resend Failed",
        description: error.message || "Failed to resend OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  // Get role-specific text and icons
  const getRoleConfig = () => {
    switch (role) {
      case "admin":
        return {
          title: "Administrator Login",
          subtitle: showOTP
            ? "Enter the OTP sent to your email"
            : "Enter your admin email to continue",
          emailLabel: "Admin Email",
          emailPlaceholder: "admin@autoformindia.com",
          icon: Shield,
          heroTitle: "Admin Portal",
          heroDescription: "Manage users, verify vendors, and oversee warranty registrations with full system access.",
        };
      case "vendor":
        return {
          title: "Franchise Login",
          subtitle: showOTP
            ? "Enter the OTP sent to your email"
            : "Enter your store email to continue",
          emailLabel: "Store Email",
          emailPlaceholder: "store@example.com",
          icon: Store,
          heroTitle: "Welcome Back",
          heroDescription: "Manage your store's warranty registrations efficiently and securely.",
        };
      default:
        return {
          title: "Customer Login",
          subtitle: showOTP
            ? "Enter the OTP sent to your email"
            : "Enter your email to continue",
          emailLabel: "Email Address",
          emailPlaceholder: "your.email@example.com",
          icon: Mail,
          heroTitle: "Welcome Back",
          heroDescription: "Access your product warranties with ease. Secure and reliable warranty management.",
        };
    }
  };

  const config = getRoleConfig();
  const IconComponent = config.icon;

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-background">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-primary mb-2">
              <ShieldCheck className="h-8 w-8" />
              <span className="text-2xl font-bold">Warranty Portal</span>
            </Link>
            <p className="text-muted-foreground text-sm mt-2">
              Secure warranty registration system
            </p>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {config.title}
            </h1>
            <p className="text-muted-foreground">
              {config.subtitle}
            </p>
          </div>

          {/* Forms */}
          {!showOTP ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">
                  {config.emailLabel}
                </Label>
                <div className="relative">
                  <IconComponent className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={config.emailPlaceholder}
                    value={email}
                    onChange={handleEmailChange}
                    required
                    disabled={loading}
                    className={`pl-11 h-12 ${emailError ? 'border-red-500 focus:ring-red-500' : ''}`}
                  />
                </div>
                {emailError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {emailError}
                  </p>
                )}
                {role === "admin" && (
                  <p className="text-xs text-muted-foreground">
                    Only authorized admin emails can access this portal
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : "Send OTP"}
              </Button>

              {role !== "admin" && (
                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to={`/register?role=${role}`} className="text-primary font-medium hover:underline">
                    Register here
                  </Link>
                </p>
              )}
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
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    maxLength={6}
                    disabled={loading}
                    className="pl-11 h-12 text-center text-2xl tracking-widest"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Check your email ({email}) for the OTP
                </p>
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading || otp.length !== 6}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : "Verify & Login"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12"
                onClick={() => {
                  setShowOTP(false);
                  setOtp("");
                  setUserId("");
                  setResendTimer(0);
                }}
              >
                Back to Login
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0 || resendLoading}
                  className={`text-sm ${resendTimer > 0 || resendLoading ? 'text-muted-foreground cursor-not-allowed' : 'text-primary hover:underline cursor-pointer'}`}
                >
                  {resendLoading ? (
                    "Sending..."
                  ) : resendTimer > 0 ? (
                    `Resend OTP in ${resendTimer}s`
                  ) : (
                    "Didn't receive OTP? Resend"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex flex-1 relative bg-muted">
        <img src={authHero} alt="Warranty Registration" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-secondary/90 mix-blend-multiply" />
        <div className="relative z-10 flex items-center justify-center p-12 text-white">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-4">{config.heroTitle}</h2>
            <p className="text-lg text-white/90">
              {config.heroDescription}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;