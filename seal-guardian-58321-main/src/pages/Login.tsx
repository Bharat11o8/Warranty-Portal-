import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, ShieldCheck, KeyRound } from "lucide-react";
import authHero from "@/assets/auth-hero.jpg";

const Login = () => {
  const [searchParams] = useSearchParams();
  const role = (searchParams.get("role") as UserRole) || "customer";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login, verifyOTP } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.requiresOTP && result.userId) {
        setUserId(result.userId);
        setShowOTP(true);
        toast({
          title: "OTP Sent",
          description: "Please check your email for the OTP code.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to login. Please check your credentials.",
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
      await verifyOTP(userId, otp);
      toast({
        title: "Success",
        description: "Login successful!",
      });
      navigate("/warranty");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-background">
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
              {role === "customer" ? "Customer" : "Vendor"} Login
            </h1>
            <p className="text-muted-foreground">
              {showOTP ? "Enter the OTP sent to your email" : "Enter your credentials to access your account"}
            </p>
          </div>

          {/* Form Content */}
          {!showOTP ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-11 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-11 h-12"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? "Logging in..." : "Continue"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to={`/register?role=${role}`} className="text-primary font-medium hover:underline">
                  Register here
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
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    maxLength={6}
                    className="pl-11 h-12 text-center text-2xl tracking-widest"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Check your email ({email}) for the OTP
                </p>
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading || otp.length !== 6}>
                {loading ? "Verifying..." : "Verify & Login"}
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
                Back to Login
              </Button>
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-secondary/90 mix-blend-multiply" />
        <div className="relative z-10 flex items-center justify-center p-12 text-white">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-4">
              Welcome Back
            </h2>
            <p className="text-lg text-white/90">
              Manage your product warranties with ease. Secure, fast, and reliable warranty registration system for customers and vendors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;