import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using this warranty registration portal, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily use this portal for warranty registration purposes. This is the grant of a license, not a transfer of title.
            </p>

            <h2>3. User Account</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
            </p>

            <h2>4. Warranty Registration</h2>
            <ul>
              <li>All information provided must be accurate and truthful</li>
              <li>Supporting documents must be genuine and unaltered</li>
              <li>Warranty claims are subject to verification and approval</li>
              <li>False information may result in warranty rejection</li>
            </ul>

            <h2>5. Vendor Accounts</h2>
            <p>
              Vendor accounts require validation from authorized representatives. Approval is not guaranteed and may take up to 3-5 business days.
            </p>

            <h2>6. Privacy Policy</h2>
            <p>
              Your privacy is important to us. All personal information collected will be used solely for warranty management purposes and will not be shared with third parties without consent.
            </p>

            <h2>7. Limitation of Liability</h2>
            <p>
              We shall not be held liable for any delays, failures, or errors in the warranty registration process due to circumstances beyond our reasonable control.
            </p>

            <h2>8. Modifications</h2>
            <p>
              We reserve the right to revise these terms at any time. Continued use of the portal following any changes constitutes acceptance of those changes.
            </p>

            <h2>9. Contact Information</h2>
            <p>
              For questions about these Terms and Conditions, please contact us through our support channels.
            </p>

            <p className="text-sm text-muted-foreground mt-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Terms;
