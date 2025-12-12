import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, User, Store, ShieldCheck, Lock } from "lucide-react";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";

const Home = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to their role-specific dashboard
  useEffect(() => {
    if (!loading && user) {
      const dashboardRoutes = {
        customer: "/dashboard/customer",
        vendor: "/dashboard/vendor",
        admin: "/dashboard/admin",
      };

      const redirectPath = dashboardRoutes[user.role] || "/warranty";
      navigate(redirectPath, { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="inline-block mb-4">
            <Shield className="h-16 w-16 text-primary mx-auto animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Product Warranty Registration
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Secure and simple warranty registration for customers, vendors, and administrators
          </p>
        </section>

        {/* Main Tabs Section */}
        <section className="max-w-5xl mx-auto">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-14">
              <TabsTrigger value="login" className="text-lg font-semibold">
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="text-lg font-semibold">
                Register
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Customer Login */}
                <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg hover:scale-105">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Customer</CardTitle>
                    <CardDescription>
                      Access your warranty registrations and product information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/login?role=customer">
                      <Button className="w-full h-11" size="lg">
                        Login as Customer
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Vendor Login */}
                <Card className="border-2 hover:border-secondary transition-all duration-300 hover:shadow-lg hover:scale-105">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Store className="h-8 w-8 text-secondary" />
                    </div>
                    <CardTitle className="text-xl">Franchise</CardTitle>
                    <CardDescription>
                      Manage products and customer warranty registrations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/login?role=vendor">
                      <Button className="w-full h-11" size="lg" variant="secondary">
                        Login as Franchise
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Admin Login */}
                <Card className="border-2 hover:border-accent transition-all duration-300 hover:shadow-lg hover:scale-105">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                      <ShieldCheck className="h-8 w-8 text-accent" />
                    </div>
                    <CardTitle className="text-xl">Administrator</CardTitle>
                    <CardDescription>
                      System administration and user management
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/login?role=admin">
                      <Button className="w-full h-11" size="lg" variant="outline">
                        Login as Admin
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Customer Registration */}
                <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg hover:scale-105">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">New Customer</CardTitle>
                    <CardDescription>
                      Create an account to register your products
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link to="/register?role=customer">
                      <Button className="w-full h-11" size="lg">
                        Register as Customer
                      </Button>
                    </Link>
                    <p className="text-xs text-center text-muted-foreground">
                      Quick and easy registration
                    </p>
                  </CardContent>
                </Card>

                {/* Vendor Registration */}
                <Card className="border-2 hover:border-secondary transition-all duration-300 hover:shadow-lg hover:scale-105">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Store className="h-8 w-8 text-secondary" />
                    </div>
                    <CardTitle className="text-xl">New Franchise</CardTitle>
                    <CardDescription>
                      Register your business to manage warranties
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link to="/register?role=vendor">
                      <Button className="w-full h-11" size="lg" variant="secondary">
                        Register as Franchise
                      </Button>
                    </Link>
                    <p className="text-xs text-center text-muted-foreground">
                      Requires admin verification
                    </p>
                  </CardContent>
                </Card>

                {/* Admin Registration - Invite Only */}
                <Card className="border-2 border-muted bg-muted/20 opacity-90">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Lock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-xl text-muted-foreground">Administrator</CardTitle>
                    <CardDescription>
                      Admin access is invite-only
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full h-11" size="lg" variant="outline" disabled>
                      Invite Only
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Contact your administrator for access
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Info */}
              <div className="text-center mt-8 p-6 bg-muted/30 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> All new vendor accounts require administrator approval before activation.
                  Customer accounts are activated immediately upon registration.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
};

export default Home;
