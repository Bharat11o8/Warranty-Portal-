import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EVFormData } from "../EVProductsForm";
import { useToast } from "@/hooks/use-toast";
import {
  validateIndianMobile,
  validateEmail,
  getPhoneError,
} from "@/lib/validation";

interface CustomerDetailsProps {
  formData: EVFormData;
  updateFormData: (updates: Partial<EVFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
  isCustomer?: boolean;
  isVendor?: boolean;
}

const CustomerDetails = ({ formData, updateFormData, onNext, onPrev, isCustomer = false, isVendor = false }: CustomerDetailsProps) => {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate Mobile Number
    const phoneError = getPhoneError(formData.customerMobile);
    if (phoneError) {
      toast({
        title: "Invalid Mobile Number",
        description: phoneError,
        variant: "destructive",
      });
      return;
    }

    // Validate Email (only if provided, since it's optional for vendors)
    if (formData.customerEmail && !validateEmail(formData.customerEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }



    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold mb-2">👤 Customer Information</h3>
        <p className="text-muted-foreground mb-6">Enter the customer's contact details</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customerFname">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="customerFname"
            type="text"
            placeholder="First name"
            value={formData.customerFname}
            onChange={(e) => {
              const textOnly = e.target.value.replace(/[^A-Za-z\s]/g, '');
              updateFormData({ customerFname: textOnly });
            }}
            required
            readOnly={isCustomer}
            className={isCustomer ? 'bg-muted cursor-not-allowed' : ''}
          />
          {isCustomer && (
            <p className="text-xs text-muted-foreground">Auto-filled from your account</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerLname">Last Name</Label>
          <Input
            id="customerLname"
            type="text"
            placeholder="Last name"
            value={formData.customerLname}
            onChange={(e) => {
              const textOnly = e.target.value.replace(/[^A-Za-z\s]/g, '');
              updateFormData({ customerLname: textOnly });
            }}
            readOnly={isCustomer}
            className={isCustomer ? 'bg-muted cursor-not-allowed' : ''}
          />
          {isCustomer && (
            <p className="text-xs text-muted-foreground">Auto-filled from your account</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerMobile">
            Mobile Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="customerMobile"
            type="tel"
            placeholder="9876543210"
            value={formData.customerMobile}
            onChange={(e) => {
              const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
              updateFormData({ customerMobile: digitsOnly });

              // Conditional uniqueness check for mobile
              if (digitsOnly.length === 10) {
                import("@/lib/api").then((api) => {
                  api.default.get(`/public/warranty/check-uniqueness?phone=${digitsOnly}&type=ev-products`)
                    .then(res => {
                      if (!res.data.unique) {
                        toast({
                          title: "Already Registered",
                          description: res.data.message,
                          variant: "destructive",
                        });
                      }
                    })
                    .catch(err => console.error("Uniqueness check failed", err));
                });
              }
            }}
            required
            maxLength={10}
            readOnly={isCustomer}
            className={isCustomer ? 'bg-muted cursor-not-allowed' : ''}
          />
          {isCustomer && (
            <p className="text-xs text-muted-foreground">Auto-filled from your account</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerEmail">
            Email ID {!isVendor && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id="customerEmail"
            type="email"
            placeholder="customer@example.com"
            value={formData.customerEmail}
            onChange={(e) => updateFormData({ customerEmail: e.target.value })}
            required={!isVendor}
            readOnly={isCustomer}
            className={isCustomer ? 'bg-muted cursor-not-allowed' : ''}
          />
          {isCustomer && (
            <p className="text-xs text-muted-foreground">Auto-filled from your account</p>
          )}
          {isVendor && (
            <p className="text-xs text-muted-foreground">Optional - If not provided, customer won't receive email notifications</p>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" size="lg" onClick={onPrev}>
          ← Previous
        </Button>
        <Button type="submit" size="lg">
          Next Step →
        </Button>
      </div>
    </form >
  );
};

export default CustomerDetails;
