import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import Header from "@/components/Header";

const Home = () => {
  const [activeTab, setActiveTab] = useState<"customer" | "vendor">("customer");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="inline-block mb-4">
            <Shield className="h-16 w-16 text-primary mx-auto" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Product Warranty Registration
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Secure and simple warranty registration for customers and vendors
          </p>
        </section>

        {/* Tab-based User Type Selection */}
        <section className="max-w-2xl mx-auto">
          <div className="bg-card border-2 border-border rounded-2xl overflow-hidden shadow-lg">
            {/* Tabs Header */}
            <div className="flex border-b-2 border-border">
              <button
                onClick={() => setActiveTab("customer")}
                className={`flex-1 py-4 px-6 text-lg font-semibold transition-all ${
                  activeTab === "customer"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                Customer
              </button>
              <button
                onClick={() => setActiveTab("vendor")}
                className={`flex-1 py-4 px-6 text-lg font-semibold transition-all ${
                  activeTab === "vendor"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                Vendor
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-12">
              {activeTab === "customer" ? (
                <div className="text-center space-y-6">
                  <h2 className="text-2xl font-bold">Customer Portal</h2>
                  <p className="text-muted-foreground">
                    Register your purchased products and manage warranties easily
                  </p>
                  <div className="space-y-3 pt-4">
                    <Link to="/login?role=customer" className="block">
                      <Button size="lg" className="w-full h-12">
                        Login as Customer
                      </Button>
                    </Link>
                    <Link to="/register?role=customer" className="block">
                      <Button variant="outline" size="lg" className="w-full h-12">
                        Register as Customer
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <h2 className="text-2xl font-bold">Vendor Portal</h2>
                  <p className="text-muted-foreground">
                    Manage store products and warranty registrations
                  </p>
                  <div className="space-y-3 pt-4">
                    <Link to="/login?role=vendor" className="block">
                      <Button size="lg" className="w-full h-12" variant="secondary">
                        Login as Vendor
                      </Button>
                    </Link>
                    <Link to="/register?role=vendor" className="block">
                      <Button variant="outline" size="lg" className="w-full h-12">
                        Register as Vendor
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
